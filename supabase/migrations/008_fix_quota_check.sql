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
  v_overlap_exists BOOLEAN;
  v_end_time TIME;
  v_booking bookings%ROWTYPE;
BEGIN
  -- Lock the house row to prevent race conditions
  SELECT * INTO v_house FROM houses WHERE id = p_house_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'House not found');
  END IF;

  -- Get court (re-select to be safe)
  SELECT * INTO v_court FROM courts WHERE id = p_court_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Court not found');
  END IF;

  -- Calculate end time: Start + Duration (default 60 mins)
  v_end_time := p_start_time + (v_court.slot_duration_minutes || ' minutes')::INTERVAL;

  -- Rule 1: Check max active bookings
  -- FIX: Only count bookings where the end time is in the future.
  SELECT COUNT(*) INTO v_active_count
  FROM bookings
  WHERE house_id = p_house_id
    AND court_id = p_court_id
    AND status = 'confirmed'
    AND (
      booking_date > CURRENT_DATE
      OR (booking_date = CURRENT_DATE AND end_time > CURRENT_TIME)
    );

  IF v_active_count >= v_house.max_active_bookings THEN
    RETURN jsonb_build_object('error',
      format('%s already has %s upcoming reservations for %s.',
        v_house.name, v_house.max_active_bookings, v_court.name));
  END IF;

  -- Rule 2: Booking Window
  IF p_booking_date > CURRENT_DATE + INTERVAL '7 days' THEN
    RETURN jsonb_build_object('error', 'Bookings can only be made 7 days in advance.');
  END IF;
  IF p_booking_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'Cannot book in the past.');
  END IF;

  -- Rule 4: OVERLAP CHECK
  -- (StartA < EndB) and (EndA > StartB)
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND status = 'confirmed'
      AND (
        (p_start_time < end_time) AND (v_end_time > start_time)
      )
  ) INTO v_overlap_exists;

  IF v_overlap_exists THEN
    RETURN jsonb_build_object('error', 'Time slot overlaps with an existing booking.');
  END IF;

  -- Create Booking
  INSERT INTO bookings (house_id, court_id, booker_name, booker_email, booker_phone, booking_date, start_time, end_time)
  VALUES (p_house_id, p_court_id, p_booker_name, p_booker_email, p_booker_phone, p_booking_date, p_start_time, v_end_time)
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
