import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import clsx from 'clsx';

export function RulesDisplay() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-brand-200 rounded-xl overflow-hidden bg-brand-50/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-100/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-brand-800 font-medium">
                    <Info size={18} className="text-brand-500" />
                    <span>Booking Rules</span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-brand-500" /> : <ChevronDown size={18} className="text-brand-500" />}
            </button>

            <div className={clsx(
                "transition-all duration-300 ease-in-out px-4 text-sm text-brand-700 space-y-2",
                isOpen ? "max-h-96 pb-4 opacity-100" : "max-h-0 pb-0 opacity-0 overflow-hidden"
            )}>
                <ul className="list-disc list-inside space-y-1 ml-1">
                    <li><strong>Max 2 bookings</strong> per house per court at any time.</li>
                    <li>Book up to <strong>7 days</strong> in advance.</li>
                    <li>1-hour time slots.</li>
                    <li>Cancel anytime if you can't make it.</li>
                </ul>
            </div>
        </div>
    );
}
