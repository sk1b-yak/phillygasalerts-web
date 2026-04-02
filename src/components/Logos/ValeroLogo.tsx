import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const ValeroLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#00a4e4'; // Valero blue
  
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Valero">
        {/* Valero V with sunburst */}
        <motion.path
          d="M30 25 L50 75 L70 25"
          fill="none"
          stroke="#00a4e4"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />
        {/* Sunburst rays */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.line
            key={i}
            x1="50"
            y1="75"
            x2={50 + 35 * Math.cos((i * 72 - 90) * Math.PI / 180)}
            y2={75 + 35 * Math.sin((i * 72 - 90) * Math.PI / 180)}
            stroke="#FCD116"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
          />
        ))}
      </svg>
    </LogoBase>
  );
};