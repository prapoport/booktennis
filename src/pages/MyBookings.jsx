import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { format, parseISO } from 'date-fns';
import { Loader2, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { COURTS } from '../lib/constants';

export default function MyBookings() {
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchBookings = async (e) => {
        e?.preventDefault();
        if (!email) return;

        setLoading(true);
        setSearched(true);

        // Fetch bookings for this email using Secure RPC
        const { data, error } = await supabase
            .rpc('get_my_bookings', { p_email: email });
        // The RPC already orders by date desc

        if (error) {
            console.error(error);
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    };

    const handleCancel = async (booking) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

        if (!booking.cancellation_token) {
            alert('Cannot cancel this booking (missing token).');
            return;
        }

        const { data, error } = await supabase.rpc('cancel_booking', { p_token: booking.cancellation_token });

        if (error) {
            console.error(error);
            alert('Failed to cancel booking.');
        } else if (data && !data.success) {
            alert(data.error || 'Failed to cancel booking.');
        } else {
            // Refresh
            fetchBookings();
        }
    };

    const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.booking_date) >= new Date().setHours(0, 0, 0, 0));
    const pastOrCancelled = bookings.filter(b => b.status === 'cancelled' || (b.status === 'confirmed' && new Date(b.booking_date) < new Date().setHours(0, 0, 0, 0)));

    return (
        <div className="min-h-screen bg-brand-50">
            <Header />
            <main className="max-w-md mx-auto px-4 py-8 space-y-6">
                <h2 className="text-2xl font-bold text-brand-900">My Bookings</h2>

                <form onSubmit={fetchBookings} className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-700 mb-1">Enter your email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg border border-brand-300 focus:ring-2 focus:ring-ocean-500 outline-none"
                                placeholder="john@example.com"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-brand-800 text-white font-bold rounded-lg hover:bg-brand-900 flex items-center"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Find'}
                            </button>
                        </div>
                    </div>
                </form>

                {searched && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <section>
                            <h3 className="text-lg font-bold text-brand-900 mb-4 flex items-center gap-2">
                                Upcoming Reservations <span className="text-xs bg-ocean-100 text-ocean-700 px-2 py-0.5 rounded-full">{upcomingBookings.length}</span>
                            </h3>
                            {upcomingBookings.length === 0 ? (
                                <p className="text-brand-500 text-sm italic">No upcoming bookings found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingBookings.map(booking => (
                                        <BookingCard key={booking.id} booking={booking} onCancel={() => handleCancel(booking)} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {(pastOrCancelled.length > 0) && (
                            <section className="opacity-60 grayscale-[50%] hover:grayscale-0 transition-all">
                                <h3 className="text-lg font-bold text-brand-900 mb-4">Past & Cancelled</h3>
                                <div className="space-y-3">
                                    {pastOrCancelled.map(booking => (
                                        <BookingCard key={booking.id} booking={booking} isPast />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function BookingCard({ booking, onCancel, isPast }) {
    // const court = COURTS.find(c => c.id === booking.court_id); // Removed constant lookup
    const dateStr = format(parseISO(booking.booking_date), 'EEE, MMM d');
    const timeStr = format(parseISO(`${booking.booking_date}T${booking.start_time}`), 'h:mm a');

    return (
        <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm flex justify-between items-center">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-900">{booking.court_name || 'Unknown Court'}</span>
                    {booking.status === 'cancelled' && (
                        <span className="text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 px-1.5 rounded">CANCELLED</span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-600">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {dateStr}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {timeStr}</span>
                </div>
                <div className="text-xs text-brand-400">
                    {booking.house_name} • {booking.booker_name}
                </div>
            </div>

            {!isPast && booking.status !== 'cancelled' && (
                <button
                    onClick={onCancel}
                    className="p-2 text-brand-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel Booking"
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>
    );
}
