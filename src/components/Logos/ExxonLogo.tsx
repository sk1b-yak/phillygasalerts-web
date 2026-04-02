import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const ExxonLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#e21833'; // Exxon red
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Exxon">
        {/* Exxon double-X design */}
        <motion.text
          x="50"
          y="60"
          textAnchor="middle"
          fill="#e21833"
          fontSize="48"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          X
        </motion.text>
        
        {/* Second X slightly offset */}
        <motion.text
          x="54"
          y="64"
          textAnchor="middle"
          fill="#0054a4"
          fontSize="48"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          opacity={0.8}
          initial={{ scale: 0, opacity: 0, rotate: 180 }}
          animate={{ scale: 1, opacity: 0.8, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
        >
          X
        </motion.text>
      </svg>
    </LogoBase>
  );
};