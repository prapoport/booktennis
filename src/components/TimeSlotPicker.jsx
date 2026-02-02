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
        // Fetch public booking view
        const { data, error } = await supabase
            .from('public_bookings_view')
            .select('start_time, end_time, house_name')
            .eq('court_id', selectedCourtId)
            .eq('booking_date', selectedDate);

        if (error) {
            console.error('Error fetching availability:', error);
        } else {
            const mapping = {};
            data?.forEach(booking => {
                // Determine which 30-min slots are covered by this booking
                // Simplified: Just store the booking intervals to check against slots later, 
                // OR pre-calculate taken slots here. 
                // Let's stick to the current pattern: map "slot string" -> "house name".
                // But now a single booking (say 5:00-6:00) blocks 4:30(partial), 5:00(full), 5:30(full).

                // Wait, "blocks" means you cannot START a booking at that time.
                // If I have a booking 5:00-6:00:
                // - Can I start at 4:30? No, 4:30-5:30 overlaps.
                // - Can I start at 5:00? No.
                // - Can I start at 5:30? No.
                // - Can I start at 6:00? Yes.

                // So for every slot candidate S (duration 60m), 
                // check if (S < bookingEnd) AND (S+60 > bookingStart).
            });

            // Actually, keep 'data' in state might be cleaner, 
            // but let's just use the `takenSlots` to map "Start Time" -> "Blocking House".
            // We'll iterate all possible slots and check against all bookings.

            const allSlots = TIME_SLOTS;
            const blockedMap = {};

            allSlots.forEach(slotStartTime => {
                // slot described as: Start = slotStartTime, End = slotStartTime + 60m

                // Parse slot start
                const [h, m] = slotStartTime.split(':').map(Number);
                const slotStartMinutes = h * 60 + m;
                const slotEndMinutes = slotStartMinutes + 60; // Fixed 60m duration

                // Check conflict with any booking
                const conflict = data?.find(b => {
                    const [bh, bm] = b.start_time.split(':').map(Number);
                    const bStart = bh * 60 + bm;

                    const [eh, em] = b.end_time.split(':').map(Number);
                    const bEnd = eh * 60 + em;

                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
                    return (slotStartMinutes < bEnd) && (slotEndMinutes > bStart);
                });

                if (conflict) {
                    blockedMap[slotStartTime] = conflict.house_name || 'Booked';
                }
            });

            setTakenSlots(blockedMap);
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
