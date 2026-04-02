import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const MarathonLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#E2231A";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Marathon">
        <motion.text x="50" y="55" textAnchor="middle" fontSize="42" fontWeight="900"
          fill="#E2231A" fontFamily="Arial" fontStyle="italic"
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >M</motion.text>
        {/* Flame accent */}
        <motion.path d="M62 20 Q58 30 60 35 Q62 30 64 35 Q68 28 62 20Z"
          fill="#FFD700"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        />
      </svg>
    </LogoBase>
  );
};
