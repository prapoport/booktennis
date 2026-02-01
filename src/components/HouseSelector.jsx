import React from 'react';
import { HOUSES } from '../lib/constants';
import { Home } from 'lucide-react';

export function HouseSelector({ selectedHouse, onSelect }) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-brand-900">2. Select Your House</h2>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none">
                    <Home size={20} />
                </div>
                <select
                    value={selectedHouse || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-brand-200 rounded-xl text-brand-900 font-medium focus:outline-none focus:border-ocean-600 focus:ring-1 focus:ring-ocean-600 transition-colors appearance-none"
                >
                    <option value="" disabled>Select a house...</option>
                    {HOUSES.map((house) => (
                        <option key={house} value={house}>
                            {house}
                        </option>
                    ))}
                </select>
                {/* Custom arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
