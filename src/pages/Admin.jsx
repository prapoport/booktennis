import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Loader2 } from 'lucide-react';

export default function Admin() {
    const [activeBookings, setActiveBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    async function fetchBookings() {
        setLoading(true);
        const { data } = await supabase
            .from('bookings')
            .select('*, houses(name), courts(name)')
            .gte('booking_date', new Date().toISOString().split('T')[0])
            .order('booking_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (data) setActiveBookings(data);
        setLoading(false);
    }

    async function deleteBooking(id) {
        if (!window.confirm('Delete this booking?')) return;
        await supabase.from('bookings').delete().eq('id', id);
        fetchBookings();
    }

    return (
        <div className="min-h-screen bg-brand-50">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

                {loading ? <Loader2 className="animate-spin" /> : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-brand-100 text-brand-900 font-bold">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Court</th>
                                    <th className="p-4">House</th>
                                    <th className="p-4">Booker</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeBookings.map(b => (
                                    <tr key={b.id} className="border-b border-brand-50 hover:bg-brand-50">
                                        <td className="p-4 whitespace-nowrap">{b.booking_date}</td>
                                        <td className="p-4">{b.start_time.substring(0, 5)}</td>
                                        <td className="p-4">{b.courts?.name}</td>
                                        <td className="p-4 font-medium">{b.houses?.name}</td>
                                        <td className="p-4">
                                            <div className="font-bold">{b.booker_name}</div>
                                            <div className="text-xs text-gray-500">{b.booker_email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => deleteBooking(b.id)} className="text-red-500 hover:underline">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeBookings.length === 0 && <p className="p-8 text-center text-gray-500">No active bookings.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
