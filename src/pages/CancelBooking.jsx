import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CancelBooking() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid cancellation link.');
            setLoading(false);
            return;
        }

        cancelBooking();
    }, [token]);

    async function cancelBooking() {
        try {
            const { data, error } = await supabase.rpc('cancel_booking', { p_token: token });

            if (error) throw error;

            if (data && data.success) {
                setStatus('success');
                setMessage('Your booking has been successfully cancelled.');
            } else {
                throw new Error(data?.error || 'Failed to cancel booking.');
            }
        } catch (err) {
            console.error('Cancellation error:', err);
            setStatus('error');
            setMessage(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-brand-50 pb-20">
            <Header />
            <main className="max-w-md mx-auto px-4 py-12">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-100 text-center">
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin text-ocean-600 mb-4" size={48} />
                            <p className="text-brand-600">Processing cancellation...</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="text-green-500" size={64} />
                            <h2 className="text-2xl font-bold text-brand-900">Cancelled</h2>
                            <p className="text-brand-600">{message}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-6 px-6 py-2 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors"
                            >
                                Return to Home
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <XCircle className="text-red-500" size={64} />
                            <h2 className="text-2xl font-bold text-brand-900">Error</h2>
                            <p className="text-red-600">{message}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-6 px-6 py-2 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors"
                            >
                                Return to Home
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
