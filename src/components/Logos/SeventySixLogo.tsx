import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const SeventySixLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#FF6600";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="76">
        <motion.circle cx="50" cy="50" r="38" fill="#FF6600"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.text x="50" y="60" textAnchor="middle" fontSize="34" fontWeight="900"
          fill="#fff" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >76</motion.text>
      </svg>
    </LogoBase>
  );
};
