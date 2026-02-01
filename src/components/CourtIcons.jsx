import React from 'react';

export const PadelIcon = ({ size = 24, strokeWidth = 1.5, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Padel Racket - Simple, rounded, bold */}
        <path d="M6 9c0-3.6 2.7-6 6-6s6 2.4 6 6c0 2.5-1.5 4.5-3 5.5l-2 2V21a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4.5l-2-2C7.5 13.5 6 11.5 6 9z" />

        {/* Grip Detail */}
        <path d="M10 18h4" />
        <path d="M10 20h4" />

        {/* Center Ball and Holes - Simplified layout */}
        <circle cx="12" cy="9" r="2.5" />
        <path d="M12 7.5a1.5 1.5 0 0 0 0 3" /> {/* Ball curve */}

        {/* Simple distinct holes around the ball */}
        <circle cx="8.5" cy="7" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="7" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="7.5" cy="11" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="11" r="0.75" fill="currentColor" stroke="none" />
    </svg>
);

export const TennisIcon = ({ size = 24, strokeWidth = 1.5, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Tennis Racket - Larger head relative to handle */}
        <g transform="rotate(-30 12 12)">
            <ellipse cx="12" cy="10" rx="6.5" ry="7.5" />
            <path d="M12 17.5v4.5" /> {/* Handle */}
            <path d="M10.5 22h3" /> {/* Base */}
            <path d="M12 17.5l-2.5-2.5" /> {/* Throat L */}
            <path d="M12 17.5l2.5-2.5" /> {/* Throat R */}

            {/* Minimalist Strings */}
            <path d="M8 7h8" />
            <path d="M7 10h10" />
            <path d="M8 13h8" />

            <path d="M9 5v10" />
            <path d="M12 5v10" />
            <path d="M15 5v10" />
        </g>

        {/* Ball - Clear and detached */}
        <circle cx="19" cy="19" r="2.5" />
        <path d="M17.5 20a2.5 2.5 0 0 1 2-3" />
    </svg>
);
