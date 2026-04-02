import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const CostcoLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#e31837'; // Costco red
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Costco">
        {/* Costco circular logo */}
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          fill="#0054a4"
          stroke="#e31837"
          strokeWidth="4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <text
          x="50"
          y="45"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="16"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          COSTCO
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#FCD116"
          fontSize="10"
          fontFamily="Arial, sans-serif"
        >
          WHOLESALE
        </text>
      </svg>
    </LogoBase>
  );
};