import React from 'react';
import { COURTS } from '../lib/constants';
import clsx from 'clsx';
import { Trophy, Activity } from 'lucide-react'; // Icons for sports

export function CourtSelector({ courts = [], selectedCourtId, onSelect }) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-brand-900">1. Choose a Court</h2>

            {courts.length === 0 ? (
                <div className="p-8 text-center bg-brand-50 rounded-xl border border-dashed border-brand-200 text-brand-400">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Loading courts...</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {courts.map((court) => {
                        const isSelected = selectedCourtId === court.id;
                        // Map court types to icons. Adjust logic if your DB uses different type strings.
                        // Assuming 'padel' and 'tennis'/'pickleball' or similar.
                        // If type is unknown, default to Trophy.
                        const isPadel = court.court_type?.toLowerCase().includes('padel');
                        const Icon = isPadel ? Activity : Trophy;

                        return (
                            <button
                                key={court.id}
                                onClick={() => onSelect(court.id)}
                                className={clsx(
                                    "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 h-32 active:scale-95 touch-manipulation",
                                    isSelected
                                        ? "border-ocean-600 bg-white shadow-md ring-1 ring-ocean-600"
                                        : "border-brand-200 bg-white hover:border-brand-300 hover:bg-brand-50"
                                )}
                            >
                                <div className={clsx(
                                    "mb-2 p-3 rounded-full transition-colors",
                                    isSelected ? "bg-ocean-50 text-ocean-600" : "bg-brand-100 text-brand-600"
                                )}>
                                    <Icon size={24} strokeWidth={2.5} />
                                </div>
                                <span className={clsx(
                                    "font-bold text-sm text-center leading-tight",
                                    isSelected ? "text-ocean-700" : "text-brand-800"
                                )}>
                                    {court.name}
                                </span>

                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ocean-600 animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
