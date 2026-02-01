-- Houses in the community
CREATE TABLE houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_active_bookings INT NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Court definitions
CREATE TABLE courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  court_type TEXT NOT NULL CHECK (court_type IN ('padel', 'tennis_pickleball')),
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  earliest_slot TIME NOT NULL DEFAULT '05:00',
  latest_slot TIME NOT NULL DEFAULT '21:00',
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES houses(id),
  court_id UUID NOT NULL REFERENCES courts(id),
  booker_name TEXT NOT NULL,
  booker_email TEXT,
  booker_phone TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  cancellation_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_bookings_house_status ON bookings(house_id, status);
CREATE INDEX idx_bookings_court_date ON bookings(court_id, booking_date);
CREATE INDEX idx_bookings_email ON bookings(booker_email);
CREATE INDEX idx_bookings_cancel_token ON bookings(cancellation_token);

-- Seed data: houses
INSERT INTO houses (name) VALUES
  ('Casa Coco'),
  ('Casa Luna'),
  ('Casa Sol'),
  ('Casa Palma'),
  ('Casa Mar'),
  ('Casa Cielo'),
  ('Casa Jade'),
  ('Casa Coral'),
  ('Casa Breeze'),
  ('Casa Vista');

-- Seed data: courts
INSERT INTO courts (name, court_type) VALUES
  ('Padel Court', 'padel'),
  ('Tennis/Pickleball Court', 'tennis_pickleball');

-- Row Level Security: Enable but allow all operations (no auth)
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on houses" ON houses FOR SELECT USING (true);
CREATE POLICY "Allow all reads on courts" ON courts FOR SELECT USING (true);
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- RPC Function for Booking Creation
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
  -- Lock the house row to prevent race conditions (optional but good practice)
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
$$ LANGUAGE plpgsql;
