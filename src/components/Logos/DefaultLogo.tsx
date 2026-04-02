import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const DefaultLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#6366f1'; // Indigo fallback

  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Gas Station">
        {/* Generic gas pump icon */}
        <motion.rect
          x="30"
          y="25"
          width="40"
          height="55"
          rx="5"
          fill="#6366f1"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        {/* Pump display */}
        <motion.rect
          x="38"
          y="32"
          width="24"
          height="12"
          rx="2"
          fill="#1f2937"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        />
        {/* Nozzle */}
        <motion.path
          d="M70 45 L85 40 L85 55 L70 50 Z"
          fill="#6366f1"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        />
        {/* Hose */}
        <motion.path
          d="M85 47 Q95 60 80 75"
          fill="none"
          stroke="#6366f1"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        />
      </svg>
    </LogoBase>
  );
};