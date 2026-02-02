import React from 'react';
import padelIcon from '../assets/padel_custom.png';
import tennisIcon from '../assets/tennis_custom.png';

export const PadelIcon = ({ size = 24, className }) => (
    <img
        src={padelIcon}
        alt="Padel Court"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
    />
);

export const TennisIcon = ({ size = 24, className }) => (
    <img
        src={tennisIcon}
        alt="Tennis Court"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
    />
);
