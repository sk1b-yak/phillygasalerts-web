import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const ChevronLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#0054a4'; // Chevron blue
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Chevron">
        <motion.path
          d="M20 30 L50 60 L80 30"
          fill="none"
          stroke="#E31837"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d="M20 50 L50 80 L80 50"
          fill="none"
          stroke="#0054a4"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      </svg>
    </LogoBase>
  );
};