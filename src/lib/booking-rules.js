import { addDays, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { supabase } from './supabase';

const MAX_ACTIVE_BOOKINGS_PER_HOUSE_PER_COURT = 2;
const MAX_ADVANCE_DAYS = 7;

// Client-side validation function to provide immediate feedback
// Mirrors the server-side logic but cannot guarantee consistency (race conditions)
export async function validateBookingRules(houseId, courtId, bookingDate, startTime) {
    // 1. Advance Booking Window
    const today = startOfDay(new Date());
    const maxDate = addDays(today, MAX_ADVANCE_DAYS);
    const bookingDateObj = parseISO(bookingDate); // bookingDate is 'YYYY-MM-DD'

    if (isAfter(bookingDateObj, maxDate)) {
        return { valid: false, message: `Bookings can only be made up to ${MAX_ADVANCE_DAYS} days in advance.` };
    }
    if (isBefore(bookingDateObj, today)) {
        return { valid: false, message: 'Cannot book in the past.' };
    }

    // 2. Check Max Active Bookings (Network Request)
    // We need to fetch current active bookings for this house from the VIEW
    const { data: activeBookings, error } = await supabase
        .from('public_bookings_view')
        .select('house_id') // We just need to count them
        .eq('house_id', houseId)
        .eq('court_id', courtId)
        // View already filters confirmed
        .gte('booking_date', new Date().toISOString().split('T')[0]); // booking_date >= today

    if (error) {
        console.error('Error validating bookings:', error);
        return { valid: false, message: 'Could not validate booking limits. Please try again.' };
    }

    if (activeBookings.length >= MAX_ACTIVE_BOOKINGS_PER_HOUSE_PER_COURT) {
        // We need to fetch the court name ideally, but let's just say "this court" or pass it in.
        // For now, generic message.
        return {
            valid: false,
            message: `This house already has ${MAX_ACTIVE_BOOKINGS_PER_HOUSE_PER_COURT} upcoming reservations for this court. Cancel one before booking another.`
        };
    }

    // 3. Double booking check is best left to the server/real-time availability view
    // We don't do a pre-check here because the UI should already show taken slots.

    return { valid: true };
}
