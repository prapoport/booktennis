-- Update get_my_bookings to return cancellation_token
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
