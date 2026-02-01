import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Loader2 } from 'lucide-react';

export default function Admin() {
    const [activeBookings, setActiveBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initial check? No, require password first.

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        // Try to fetch to verify password
        const { data, error } = await supabase.rpc('get_admin_bookings', { p_password: password });

        if (error) {
            alert('Invalid Password');
            setPassword('');
        } else {
            setIsAuthenticated(true);
            setActiveBookings(data || []);
        }
        setLoading(false);
    }

    async function fetchBookings() {
        // Refresh helper
        if (!isAuthenticated) return;
        setLoading(true);
        const { data } = await supabase.rpc('get_admin_bookings', { p_password: password });
        if (data) setActiveBookings(data);
        setLoading(false);
    }

    async function deleteBooking(id) {
        if (!window.confirm('Delete this booking?')) return;
        await supabase.from('bookings').delete().eq('id', id);
        fetchBookings();
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-brand-50 flex flex-col justify-center items-center p-4">
                <Header />
                <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm mt-8">
                    <h2 className="text-xl font-bold mb-4 text-center">Admin Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-brand-900 text-white font-bold rounded-lg hover:bg-brand-800 disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-50">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <button onClick={fetchBookings} className="text-sm text-ocean-600 hover:underline">Refresh</button>
                </div>

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
