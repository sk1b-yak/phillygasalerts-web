import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const SevenElevenLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#00824A";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="7-Eleven">
        <motion.rect x="20" y="20" width="60" height="60" rx="6"
          fill="#00824A"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.text x="50" y="58" textAnchor="middle" fontSize="36" fontWeight="900"
          fill="#fff" fontFamily="Arial"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >7</motion.text>
        <motion.rect x="30" y="66" width="40" height="4" rx="2"
          fill="#FF6600"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
        />
      </svg>
    </LogoBase>
  );
};
