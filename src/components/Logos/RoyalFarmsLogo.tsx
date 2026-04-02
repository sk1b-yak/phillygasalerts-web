import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const RoyalFarmsLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#E31837";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Royal Farms">
        {/* Crown */}
        <motion.path
          d="M25 60 L25 35 L37 50 L50 30 L63 50 L75 35 L75 60 Z"
          fill="#FFD700" stroke="#E31837" strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        />
        <motion.rect x="25" y="60" width="50" height="8" rx="2" fill="#E31837"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 }}
        />
        <motion.text x="50" y="85" textAnchor="middle" fontSize="10" fontWeight="900"
          fill="#E31837" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >RF</motion.text>
      </svg>
    </LogoBase>
  );
};
