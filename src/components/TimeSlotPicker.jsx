import React, { useEffect, useState } from 'react';
import { TIME_SLOTS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { Clock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export function TimeSlotPicker({ selectedCourtId, selectedDate, selectedTime, onSelect }) {
    const [takenSlots, setTakenSlots] = useState({}); // { "07:00": "Casa Coco" }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedCourtId && selectedDate) {
            fetchAvailability();
        } else {
            setTakenSlots({});
        }
    }, [selectedCourtId, selectedDate]);

    async function fetchAvailability() {
        setLoading(true);
        // Fetch bookings for this court and date
        // We only care about confirmed bookings
        const { data, error } = await supabase
            .from('bookings')
            .select('start_time, houses(name)')
            .eq('court_id', selectedCourtId)
            .eq('booking_date', selectedDate)
            .eq('status', 'confirmed');

        if (error) {
            console.error('Error fetching availability:', error);
        } else {
            const mapping = {};
            data?.forEach(booking => {
                // booking.start_time comes as "07:00:00" usually
                const time = booking.start_time.substring(0, 5); // "07:00"
                mapping[time] = booking.houses?.name || 'Booked';
            });
            setTakenSlots(mapping);
        }
        setLoading(false);
    }

    // Format time for display (12-hour)
    const formatTimeDisplay = (time24) => {
        const [hours, minutes] = time24.split(':');
        const d = new Date();
        d.setHours(parseInt(hours), parseInt(minutes));
        return format(d, 'h:mm a');
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-900">4. Select Time</h2>
                {/* Force re-fetch button or indicator */}
                {loading && <Loader2 size={16} className="animate-spin text-brand-500" />}
            </div>

            {!selectedCourtId || !selectedDate ? (
                <div className="p-8 text-center text-brand-400 bg-brand-50 rounded-xl border-2 border-dashed border-brand-200">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a court and date first</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {TIME_SLOTS.map((time) => {
                        const isTaken = !!takenSlots[time];
                        const takenBy = takenSlots[time];
                        const isSelected = selectedTime === time;

                        return (
                            <button
                                key={time}
                                onClick={() => !isTaken && onSelect(time)}
                                disabled={isTaken}
                                className={clsx(
                                    "relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-sm h-16",
                                    isTaken
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                        : isSelected
                                            ? "bg-ocean-600 border-ocean-600 text-white shadow-md transform scale-105"
                                            : "bg-white border-brand-200 text-brand-700 hover:border-ocean-300 hover:shadow-sm"
                                )}
                            >
                                <span className="font-bold">{formatTimeDisplay(time)}</span>
                                {isTaken && (
                                    <span className="text-[10px] truncate w-full text-center mt-1">
                                        {takenBy}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
            <p className="text-center text-xs text-brand-400 mt-2">
                Times are displayed in Local Time (Oaxaca)
            </p>
        </div>
    );
}
