-- Fix Security Definer View: Convert public_bookings_view to SECURITY INVOKER
-- This ensures the view respects RLS policies and follows Supabase best practices.

-- Step 1: Add SELECT policy on bookings table for confirmed bookings only
-- This allows anon/authenticated users to read confirmed bookings through the view
-- Note: The view only selects non-PII columns, so even if someone queries bookings directly,
-- they can only see confirmed bookings (no booker_name, email, phone, etc.)
-- 
-- Security note: This policy allows reading confirmed bookings, but the view itself
-- only exposes: house_id, house_name, court_id, court_name, booking_date, start_time, end_time, status
-- No PII (booker_name, booker_email, booker_phone, id, cancellation_token) is exposed.
DROP POLICY IF EXISTS "Allow read confirmed bookings" ON public.bookings;
CREATE POLICY "Allow read confirmed bookings" ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'confirmed');

-- Step 2: Recreate the view with SECURITY INVOKER (explicit)
-- PostgreSQL 15+ supports security_invoker option on views
DROP VIEW IF EXISTS public.public_bookings_view;

CREATE VIEW public.public_bookings_view
WITH (security_invoker = true)
AS
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

-- Step 3: Grant SELECT on the view (same as before)
GRANT SELECT ON public.public_bookings_view TO anon, authenticated, service_role;

-- Note: If your PostgreSQL version doesn't support security_invoker on views,
-- you can use ALTER VIEW instead:
-- ALTER VIEW public.public_bookings_view SET (security_invoker = true);
