import React from 'react';
import { CheckCircle, Calendar, Clock, Home, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { COURTS } from '../lib/constants';

export function BookingConfirmation({ booking, courts = [], onReset }) {
    const courtLabel = courts.find(c => c.id === booking.court_id)?.name || 'Court';

    // Create a display date
    const dateObj = parseISO(booking.booking_date);
    const dateStr = format(dateObj, 'EEEE, MMMM do, yyyy');

    // Format time (assuming booking.start_time is HH:mm:ss)
    const [h, m] = booking.start_time.split(':');
    const timeDate = new Date();
    timeDate.setHours(parseInt(h), parseInt(m));
    const timeStr = format(timeDate, 'h:mm a');

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-center max-w-lg mx-auto border border-brand-100 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} strokeWidth={3} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-brand-600 mb-8">Your court has been reserved successfully.</p>

            <div className="bg-brand-50 rounded-xl p-6 text-left space-y-4 mb-8">
                <div className="flex items-start gap-3">
                    <Home className="text-brand-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">House</p>
                        <div>
                            <span className="font-medium text-brand-900">
                                Reservation for your house
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Calendar className="text-brand-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">Date</p>
                        <p className="font-medium text-brand-900">{dateStr}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Clock className="text-brand-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs text-brand-500 font-bold uppercase tracking-wide">Time & Court</p>
                        <p className="font-medium text-brand-900">{timeStr} — {courtLabel}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex gap-3 text-left mb-8">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>
                    To cancel this reservation, go to the <strong>My Bookings</strong> page and enter your email address ({booking.booker_email}).
                </p>
            </div>

            <button
                onClick={onReset}
                className="w-full py-3 px-6 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/10"
            >
                Make Another Booking
            </button>
        </div>
    );
}
