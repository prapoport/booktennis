import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShieldCheck } from 'lucide-react'; // ShieldCheck as a placeholder logo icon maybe

export function Header() {
    return (
        <header className="bg-white border-b border-brand-200 sticky top-0 z-50">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white group-hover:bg-brand-700 transition-colors">
                        <span className="font-bold text-lg">N</span>
                    </div>
                    <h1 className="font-bold text-brand-900 text-lg leading-tight">
                        Los Naranjos <span className="block text-xs font-normal text-brand-600">Court Reservations</span>
                    </h1>
                </Link>
                <Link to="/my-bookings" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                    My Bookings
                </Link>
            </div>
        </header>
    );
}
