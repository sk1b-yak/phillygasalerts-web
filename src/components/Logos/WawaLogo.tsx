import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const WawaLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#b3282d'; // Wawa red
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Wawa">
        {/* Simplified Wawa goose silhouette */}
        <motion.path
          d="M30 70 Q35 50 50 45 Q65 40 75 30 Q80 25 85 30 Q80 35 75 40 Q70 50 60 55 Q50 60 45 70 Q40 80 30 70"
          fill="#b3282d"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
        />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          W
        </text>
      </svg>
    </LogoBase>
  );
};