import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const SpeedwayLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#FFD100";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Speedway">
        {/* Speed stripes */}
        {[0,1,2].map(i => (
          <motion.rect key={i} x={20} y={30 + i * 14} width={60} height={8} rx={4}
            fill={i === 1 ? "#FFD100" : "#E2231A"}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
          />
        ))}
        <motion.text x="50" y="85" textAnchor="middle" fontSize="11" fontWeight="900"
          fill="#E2231A" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >SPD</motion.text>
      </svg>
    </LogoBase>
  );
};
