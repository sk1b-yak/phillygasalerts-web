import React from 'react';
import { LogoBase } from './LogoBase';
import { LogoProps } from './types';

export const ShellLogo: React.FC<LogoProps> = (props) => {
  const brandColor = '#FCD116'; // Shell yellow

  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg
        viewBox="0 0 100 100"
        className="w-3/4 h-3/4"
        aria-label="Shell"
      >
        {/* Shell pecten (scallop shell shape) */}
        <path
          d="M50 10 C30 10 15 25 15 45 C15 70 35 85 50 90 C65 85 85 70 85 45 C85 25 70 10 50 10 Z"
          fill="#DD1D21"
          stroke="#FCD116"
          strokeWidth="2"
        />
        {/* Shell ridges */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M50 10 Q${50 + (i - 2.5) * 15} 30 ${50 + (i - 2.5) * 20} 50`}
            fill="none"
            stroke="#FCD116"
            strokeWidth="2"
            opacity={0.8}
          />
        ))}
      </svg>
    </LogoBase>
  );
};