-- 1. Create a View for Public Availability (Hides Personal Info)
CREATE OR REPLACE VIEW public.public_bookings_view AS
SELECT
    b.house_id,
    h.name as house_name,
    b.court_id,
    c.name as court_name,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status
FROM public.bookings b
JOIN public.houses h ON b.house_id = h.id
JOIN public.courts c ON b.court_id = c.id
WHERE b.status = 'confirmed';

-- Grant access to the view
GRANT SELECT ON public.public_bookings_view TO anon, authenticated, service_role;


-- 2. Revoke Public Access to the main table
-- Drop the policy that allowed everyone to do everything
DROP POLICY IF EXISTS "Allow all operations on bookings" ON public.bookings;

-- New Policies:
-- Allow INSERT (Creation) for everyone (Public Booking)
CREATE POLICY "Allow public insert" ON public.bookings FOR INSERT WITH CHECK (true);

-- Allow SELECT only via RPCs which are SECURITY DEFINER
-- But wait, standard RLS blocks select unless we explicitly allow it.
-- So verify NO other policies allow select.
-- (Earlier we had "Allow all operations on bookings", which we just dropped.)


-- 3. RPC for "My Bookings"
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
    court_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.house_id, b.court_id, b.booker_name, b.booker_email, b.booker_phone, 
        b.booking_date, b.start_time, b.end_time, b.status, b.created_at,
        h.name as house_name,
        c.name as court_name
    FROM public.bookings b
    JOIN public.houses h ON b.house_id = h.id
    JOIN public.courts c ON b.court_id = c.id
    WHERE b.booker_email = p_email
    ORDER BY b.booking_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC for Admin (Password Protected)
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
    -- Corrected syntax: <> or != for PLPGSQL
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
