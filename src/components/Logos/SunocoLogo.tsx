import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const SunocoLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#0054a4'; // Sunoco blue

  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Sunoco">
        {/* Diamond shape with gradient */}
        <defs>
          <linearGradient id="sunocoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0054a4" />
            <stop offset="100%" stopColor="#003d7a" />
          </linearGradient>
        </defs>

        <motion.path
          d="M50 15 L85 50 L50 85 L15 50 Z"
          fill="url(#sunocoGrad)"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="#FCD116"
          fontSize="20"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          SUN
        </text>
      </svg>
    </LogoBase>
  );
};