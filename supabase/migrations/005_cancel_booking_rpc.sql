-- 1. Create cancel_booking RPC (Secure)
CREATE OR REPLACE FUNCTION cancel_booking(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  -- Perform the update if token matches and status is not already cancelled
  UPDATE bookings
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE cancellation_token = p_token
    AND status = 'confirmed'
  RETURNING * INTO v_booking;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', 'Booking cancelled successfully');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token or booking already cancelled');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update create_booking to be SECURITY DEFINER
-- This is necessary because we removed public SELECT permissions on 'bookings',
-- so the standard 'RETURNING *' would fail for anon users unless the function runs as owner/definer.
CREATE OR REPLACE FUNCTION create_booking(
  p_house_id UUID,
  p_court_id UUID,
  p_booker_name TEXT,
  p_booker_email TEXT,
  p_booker_phone TEXT,
  p_booking_date DATE,
  p_start_time TIME
) RETURNS JSONB AS $$
DECLARE
  v_house houses%ROWTYPE;
  v_court courts%ROWTYPE;
  v_active_count INT;
  v_slot_taken BOOLEAN;
  v_end_time TIME;
  v_booking bookings%ROWTYPE;
BEGIN
  -- Lock the house row to prevent race conditions
  SELECT * INTO v_house FROM houses WHERE id = p_house_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'House not found');
  END IF;

  -- Get court
  SELECT * INTO v_court FROM courts WHERE id = p_court_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Court not found');
  END IF;

  -- Calculate end time
  v_end_time := p_start_time + (v_court.slot_duration_minutes || ' minutes')::INTERVAL;

  -- Rule 1: Check max active bookings for house PER COURT
  SELECT COUNT(*) INTO v_active_count
  FROM bookings
  WHERE house_id = p_house_id
    AND court_id = p_court_id
    AND status = 'confirmed'
    AND booking_date >= CURRENT_DATE;

  IF v_active_count >= v_house.max_active_bookings THEN
    RETURN jsonb_build_object('error',
      format('%s already has %s upcoming reservations for %s. Cancel one before booking another.',
        v_house.name, v_house.max_active_bookings, v_court.name));
  END IF;

  -- Rule 2: Check advance booking window (7 days)
  IF p_booking_date > CURRENT_DATE + INTERVAL '7 days' THEN
    RETURN jsonb_build_object('error', 'Bookings can only be made up to 7 days in advance.');
  END IF;
  IF p_booking_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'Cannot book in the past.');
  END IF;

  -- Rule 4: No double-booking the court slot
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND status = 'confirmed'
  ) INTO v_slot_taken;

  IF v_slot_taken THEN
    RETURN jsonb_build_object('error', 'This time slot is already booked.');
  END IF;

  -- All checks passed — create booking
  INSERT INTO bookings (house_id, court_id, booker_name, booker_email, booker_phone, booking_date, start_time, end_time)
  VALUES (p_house_id, p_court_id, p_booker_name, p_booker_email, p_booker_phone, p_booking_date, p_start_time, v_end_time)
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
