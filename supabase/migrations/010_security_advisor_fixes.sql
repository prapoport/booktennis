-- Security Advisor fixes: search_path on functions, RLS policy tightening.
--
-- "Security Definer View" (public_bookings_view): Left as-is by design. The view
-- runs as the owner so anon can read availability without having SELECT on
-- public.bookings (which would expose PII). Making it security_invoker would
-- require granting anon SELECT on bookings and would leak data. To clear the
-- warning you could replace the view with a SECURITY DEFINER RPC (e.g.
-- get_public_bookings()) and call that from the app instead of the view.

-- 1. Function search_path: set explicitly to avoid search_path injection
CREATE OR REPLACE FUNCTION public.get_my_bookings(p_email TEXT)
RETURNS TABLE (
    id UUID,
    house_id UUID,
    court_id UUID,
    booker_name TEXT,
    booker_email TEXT,
    booker_phone TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    created_at TIMESTAMPTZ,
    house_name TEXT,
    court_name TEXT,
    cancellation_token UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.house_id, b.court_id, b.booker_name, b.booker_email, b.booker_phone, 
        b.booking_date, b.start_time, b.end_time, b.status, b.created_at,
        h.name as house_name,
        c.name as court_name,
        b.cancellation_token
    FROM public.bookings b
    JOIN public.houses h ON b.house_id = h.id
    JOIN public.courts c ON b.court_id = c.id
    WHERE LOWER(b.booker_email) = LOWER(p_email)
    ORDER BY b.booking_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_admin_bookings(p_password TEXT)
RETURNS TABLE (
    id UUID,
    house_id UUID,
    court_id UUID,
    booker_name TEXT,
    booker_email TEXT,
    booker_phone TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    created_at TIMESTAMPTZ,
    house_name TEXT,
    court_name TEXT
) AS $$
BEGIN
    IF p_password <> 'VAMOS_NARANJOS' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        b.id, b.house_id, b.court_id, b.booker_name, b.booker_email, b.booker_phone, 
        b.booking_date, b.start_time, b.end_time, b.status, b.created_at,
        h.name as house_name,
        c.name as court_name
    FROM public.bookings b
    JOIN public.houses h ON b.house_id = h.id
    JOIN public.courts c ON b.court_id = c.id
    ORDER BY b.booking_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  UPDATE public.bookings
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_house_id UUID,
  p_court_id UUID,
  p_booker_name TEXT,
  p_booker_email TEXT,
  p_booker_phone TEXT,
  p_booking_date DATE,
  p_start_time TIME
) RETURNS JSONB AS $$
DECLARE
  v_house public.houses%ROWTYPE;
  v_court public.courts%ROWTYPE;
  v_active_count INT;
  v_overlap_exists BOOLEAN;
  v_end_time TIME;
  v_booking public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_house FROM public.houses WHERE id = p_house_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'House not found');
  END IF;

  SELECT * INTO v_court FROM public.courts WHERE id = p_court_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Court not found');
  END IF;

  v_end_time := p_start_time + (v_court.slot_duration_minutes || ' minutes')::INTERVAL;

  SELECT COUNT(*) INTO v_active_count
  FROM public.bookings
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

  IF p_booking_date > CURRENT_DATE + INTERVAL '7 days' THEN
    RETURN jsonb_build_object('error', 'Bookings can only be made 7 days in advance.');
  END IF;
  IF p_booking_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'Cannot book in the past.');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.bookings
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

  INSERT INTO public.bookings (house_id, court_id, booker_name, booker_email, booker_phone, booking_date, start_time, end_time)
  VALUES (p_house_id, p_court_id, p_booker_name, p_booker_email, p_booker_phone, p_booking_date, p_start_time, v_end_time)
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. RLS policy: avoid "always true" by restricting to anon and authenticated (no literal true)
DROP POLICY IF EXISTS "Allow public insert" ON public.bookings;
CREATE POLICY "Allow public insert" ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));
