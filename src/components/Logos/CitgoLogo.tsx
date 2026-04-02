import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const CitgoLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#e31837'; // Citgo red
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Citgo">
        {/* Citgo triangle with colors */}
        <motion.path
          d="M50 15 L85 80 L15 80 Z"
          fill="#e31837"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M50 30 L72 70 L28 70 Z"
          fill="#0054a4"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
        <motion.path
          d="M50 45 L62 65 L38 65 Z"
          fill="#FCD116"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
      </svg>
    </LogoBase>
  );
};