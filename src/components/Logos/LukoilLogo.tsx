import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const LukoilLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#e31837'; // Lukoil red
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Lukoil">
        {/* Lukoil sphere with red and blue halves */}
        <defs>
          <linearGradient id="lukoilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e31837" />
            <stop offset="50%" stopColor="#e31837" />
            <stop offset="50%" stopColor="#0054a4" />
            <stop offset="100%" stopColor="#0054a4" />
          </linearGradient>
        </defs>
        
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          fill="url(#lukoilGrad)"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          LUK
        </text>
      </svg>
    </LogoBase>
  );
};