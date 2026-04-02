import React from 'react';
import { motion } from 'framer-motion';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const BPLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#009900'; // BP green

  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg
        viewBox="0 0 100 100"
        className="w-3/4 h-3/4"
        aria-label="BP"
      >
        {/* BP shield shape */}
        <defs>
          <clipPath id="bpShield">
            <path d="M50 5 L85 25 L85 60 C85 80 50 95 50 95 C50 95 15 80 15 60 L15 25 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#bpShield)">
          {/* Green and yellow sunburst */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.path
              key={i}
              d={`M50 50 L${50 + 40 * Math.cos((i * 40 * Math.PI) / 180)} ${50 + 40 * Math.sin((i * 40 * Math.PI) / 180)}`}
              stroke={i % 2 === 0 ? '#009900' : '#FCD116'}
              strokeWidth="15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          ))}
        </g>

        {/* Shield outline */}
        <path
          d="M50 5 L85 25 L85 60 C85 80 50 95 50 95 C50 95 15 80 15 60 L15 25 Z"
          fill="none"
          stroke="#009900"
          strokeWidth="3"
        />
      </svg>
    </LogoBase>
  );
};