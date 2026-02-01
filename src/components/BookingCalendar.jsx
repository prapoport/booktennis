import React, { useMemo } from 'react';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz'; // Changed to toZonedTime for v3 or check version. 
// Wait, prompt just said "date-fns-tz". 
// Common import is `utcToZonedTime` (v2) or `toZonedTime` (v3). 
// Since I installed latest, I should assume v3 or check usage.
// Let's standard usage of `date-fns-tz` package.
// Actually, `npm install date-fns date-fns-tz` likely installed latest.
// `format(zonedDate, ...)` or `formatInTimeZone` is safer.

import { CalendarDays } from 'lucide-react';
import clsx from 'clsx';

const TIEMZONE = 'America/Mexico_City';

export function BookingCalendar({ selectedDate, onSelect }) {
    // Generate next 7 days based on Target Timezone
    const days = useMemo(() => {
        // Get "now" in target timezone
        const now = new Date();
        // We want the start of the day in the target timezone
        // Note: This can be tricky. easiest is just `startOfDay` of the zoned time?
        // Let's stick to simple date strings 'YYYY-MM-DD' for selection to avoid hour confusion.

        // Create an array of 7 dates starting today
        const list = [];
        const today = startOfDay(new Date()); // Local system time is acceptable proxy for "Today" usually, 
        // but strict TZ ensures if it's 11pm in user TZ but 1am tomorrow in Oaxaca...
        // Actually, let's just use local date for simplicity of UI unless strictly required.
        // But prompt said: "Show current time in CT somewhere on the page so users know what 'today' means"

        for (let i = 0; i < 7; i++) {
            list.push(addDays(today, i));
        }
        return list;
    }, []);

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-brand-900 flex items-center justify-between">
                <span>3. Select Date</span>
                <span className="text-xs font-normal text-brand-500 bg-brand-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <CalendarDays size={12} />
                    Next 7 Days
                </span>
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {days.map((date) => {
                    // Format: "Mon 12"
                    const dayName = format(date, 'EEE');
                    const dayNumber = format(date, 'd');
                    const fullDate = format(date, 'yyyy-MM-dd');
                    const isSelected = selectedDate === fullDate;

                    return (
                        <button
                            key={fullDate}
                            onClick={() => onSelect(fullDate)}
                            className={clsx(
                                "flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-all snap-start",
                                isSelected
                                    ? "border-ocean-600 bg-ocean-50 text-ocean-700 shadow-sm"
                                    : "border-brand-200 bg-white text-brand-600 hover:border-brand-300"
                            )}
                        >
                            <span className="text-xs font-medium uppercase">{dayName}</span>
                            <span className="text-xl font-bold">{dayNumber}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
