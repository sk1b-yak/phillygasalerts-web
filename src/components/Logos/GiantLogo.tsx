import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const GiantLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#E31837";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Giant">
        <motion.text x="50" y="60" textAnchor="middle" fontSize="38" fontWeight="900"
          fill="#E31837" fontFamily="Arial"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 250 }}
        >G</motion.text>
        <motion.line x1="25" y1="72" x2="75" y2="72" stroke="#E31837" strokeWidth="3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
      </svg>
    </LogoBase>
  );
};
