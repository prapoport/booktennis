# Security Definer View Issue: Summary & Fix

## Issue Summary

**Entity:** `public.public_bookings_view`  
**Problem:** View is defined with SECURITY DEFINER property

### What SECURITY DEFINER Means
- Views with SECURITY DEFINER execute queries using the **view owner's privileges**, not the querying user's
- This can bypass Row-Level Security (RLS) policies intended for end users
- If the view owner has elevated privileges, it may expose or allow modification of data beyond what users should access
- Complicates security auditing and makes it harder to reason about access control

### Current Situation
Your view `public_bookings_view`:
- Shows only **public availability data** (no PII): `house_id`, `house_name`, `court_id`, `court_name`, `booking_date`, `start_time`, `end_time`, `status`
- Filters to `status = 'confirmed'` bookings only
- Currently uses SECURITY DEFINER so anonymous users can read it without having SELECT permission on `bookings` table
- Used in 2 places:
  - `TimeSlotPicker.jsx` - Shows which time slots are taken
  - `booking-rules.js` - Validates max active bookings per house

### Why This Matters
- **Security Risk:** If view owner has BYPASSRLS or elevated privileges, RLS policies may be bypassed
- **Best Practice:** Supabase recommends SECURITY INVOKER views that respect RLS policies
- **Auditability:** Harder to track who accessed what data when privileges are elevated

---

## Recommended Fix: SECURITY INVOKER + RLS Policy

**Best Option:** Convert to SECURITY INVOKER and add a SELECT policy on `bookings` table.

### Why This Works
1. ✅ View respects RLS policies (more secure)
2. ✅ No PII exposure (view only selects non-sensitive columns)
3. ✅ Follows Supabase best practices
4. ✅ Maintains same functionality (anon can still read availability)
5. ✅ Better auditability

### Implementation Steps

1. **Add SELECT policy on `bookings` table** that allows reading confirmed bookings only
2. **Convert view to SECURITY INVOKER** (or recreate it)
3. **No code changes needed** - the view interface remains the same

### Security Considerations
- The SELECT policy will only allow reading rows where `status = 'confirmed'`
- The view already filters to confirmed bookings, so this is redundant but safe
- Even if someone queries `bookings` directly, they can only see confirmed bookings (no PII columns are exposed by the view)
- The view doesn't select PII columns (`booker_name`, `booker_email`, `booker_phone`, `id`, `cancellation_token`), so even if RLS allowed reading, no sensitive data would be exposed

---

## Alternative Fix: SECURITY DEFINER Function

If you cannot use SECURITY INVOKER (e.g., need to hide table structure), replace the view with a SECURITY DEFINER function:

**Pros:**
- More explicit control over what's returned
- Can add additional validation/checks
- Security Advisor may not flag functions the same way

**Cons:**
- Requires code changes (replace `.from('public_bookings_view')` with `.rpc('get_public_bookings')`)
- More complex than a view
- Still uses SECURITY DEFINER (less ideal)

---

## Migration Plan

See `011_fix_security_definer_view.sql` for the implementation.
