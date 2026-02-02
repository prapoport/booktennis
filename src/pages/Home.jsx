import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { validateBookingRules } from '../lib/booking-rules';
import { Header } from '../components/Header';
import { RulesDisplay } from '../components/RulesDisplay';
import { CourtSelector } from '../components/CourtSelector';
import { HouseSelector } from '../components/HouseSelector';
import { BookingCalendar } from '../components/BookingCalendar';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { BookingForm } from '../components/BookingForm';
import { BookingConfirmation } from '../components/BookingConfirmation';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
    // State
    const [courtId, setCourtId] = useState(null);
    const [houseId, setHouseId] = useState(null);
    const [housesMap, setHousesMap] = useState({}); // { "Casa Coco": "uuid" }
    const [courts, setCourts] = useState([]); // Array of court objects from DB

    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [formData, setFormData] = useState({ booker_name: '', booker_email: '', booker_phone: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successBooking, setSuccessBooking] = useState(null);

    // Scroll refs for smooth transitions
    const houseRef = useRef(null);
    const dateRef = useRef(null);
    const timeRef = useRef(null);
    const formRef = useRef(null);

    // Fetch houses and courts on mount
    useEffect(() => {
        async function fetchData() {
            // Houses
            const { data: housesData } = await supabase.from('houses').select('id, name').eq('is_active', true);
            if (housesData) {
                const map = {};
                housesData.forEach(h => map[h.name] = h.id);
                setHousesMap(map);
            }

            // Courts
            const { data: courtsData } = await supabase.from('courts').select('*').eq('is_active', true);
            if (courtsData) {
                // Sort explicitly if needed, or trust DB order (usually insertion order for small tables)
                // Let's sort Padel first then Tennis based on names or types ensures consistency
                courtsData.sort((a, b) => a.name.localeCompare(b.name));
                setCourts(courtsData);
            }
        }
        fetchData();
    }, []);

    // Handlers
    const handleCourtSelect = (id) => {
        setCourtId(id);
        // Reset subsequent steps if changing court/house
        if (id !== courtId) {
            setHouseId(null);
            setDate(null);
            setTime(null);
        }
        setTimeout(() => houseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleHouseSelect = (name) => {
        setHouseId(name); // Storing name for UI
        setFormData(prev => ({ ...prev, house_name: name }));
        setTimeout(() => dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleDateSelect = (d) => {
        setDate(d);
        setTime(null);
        setTimeout(() => timeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleTimeSelect = (t) => {
        setTime(t);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleSubmit = async () => {
        if (!courtId || !houseId || !date || !time || !formData.booker_name) {
            setError("Please complete all required fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const realHouseId = housesMap[houseId];
            console.log("Submitting with:", { houseId, realHouseId, courtId, housesMap });
            if (!realHouseId) throw new Error("Invalid house selection");

            // 1. Client-side validation
            const ruleCheck = await validateBookingRules(realHouseId, courtId, date, time);
            if (!ruleCheck.valid) {
                throw new Error(ruleCheck.message);
            }

            // 2. Submit to Supabase
            const { data, error: rpcError } = await supabase.rpc('create_booking', {
                p_house_id: realHouseId,
                p_court_id: courtId,
                p_booker_name: formData.booker_name,
                p_booker_email: formData.booker_email,
                p_booker_phone: formData.booker_phone,
                p_booking_date: date,
                p_start_time: time
            });

            if (rpcError) throw new Error(rpcError.message);

            // Check for application-level error returned as JSON
            if (data && data.error) {
                throw new Error(data.error);
            }

            // Success
            setSuccessBooking(data.booking);

            // Trigger Email Confirmation (Fire and Forget)
            const { error: emailError } = await supabase.functions.invoke('send-confirmation', {
                body: {
                    booking_id: data.booking.id,
                    email: formData.booker_email,
                    booker_name: formData.booker_name,
                    booking_date: date,
                    start_time: time,
                    court_name: courts.find(c => c.id === courtId)?.name || 'Court',
                    house_name: houseId, // houseId here is actually the name, passed from HouseSelector
                    cancellation_token: data.booking.cancellation_token
                }
            });

            if (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't show error to user, booking was successful
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccessBooking(null);
        setCourtId(null);
        setHouseId(null);
        setDate(null);
        setTime(null);
        setFormData({ booker_name: '', booker_email: '', booker_phone: '' });
        setError(null);
    };

    if (successBooking) {
        return (
            <div className="min-h-screen bg-brand-50 pb-20">
                <Header />
                <main className="max-w-md mx-auto px-4 py-8">
                    <BookingConfirmation
                        booking={successBooking}
                        courts={courts}
                        onReset={handleReset}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-50 pb-20">
            <Header />

            <main className="max-w-md mx-auto px-4 py-6 space-y-8">

                {/* Intro */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100">
                        <h2 className="text-xl font-bold text-brand-900 mb-2">Welcome to Los Naranjos</h2>
                        <p className="text-brand-700 leading-relaxed">
                            Reserve your court time easily. Please review the rules before booking to keep things fair for everyone.
                        </p>
                    </div>
                    <RulesDisplay />
                </div>

                {/* Step 1: Court */}
                <section id="court-step">
                    <CourtSelector
                        courts={courts}
                        selectedCourtId={courtId}
                        onSelect={handleCourtSelect}
                    />
                </section>

                {/* Step 2: House */}
                {courtId && (
                    <section id="house-step" ref={houseRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <HouseSelector selectedHouse={houseId} onSelect={handleHouseSelect} />
                    </section>
                )}

                {/* Step 3: Date */}
                {houseId && (
                    <section id="date-step" ref={dateRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <BookingCalendar selectedDate={date} onSelect={handleDateSelect} />
                    </section>
                )}

                {/* Step 4: Time */}
                {date && (
                    <section id="time-step" ref={timeRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TimeSlotPicker
                            selectedCourtId={courtId}
                            selectedDate={date}
                            selectedTime={time}
                            onSelect={handleTimeSelect}
                        />
                    </section>
                )}

                {/* Step 5: Form */}
                {time && (
                    <section id="form-step" ref={formRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
                        <BookingForm formData={formData} onChange={setFormData} error={error} />

                        <div className="mt-8">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-4 bg-ocean-600 text-white font-bold text-lg rounded-xl hover:bg-ocean-700 active:scale-95 transition-all shadow-lg shadow-ocean-600/20 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Reservation'}
                            </button>
                            <p className="text-center text-xs text-brand-400 mt-4">
                                By clicking confirm, you agree to the community rules.
                            </p>
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}
