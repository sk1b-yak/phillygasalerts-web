import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const MobilLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#FF0000";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Mobil">
        <motion.circle cx="30" cy="50" r="14" fill="none" stroke="#FF0000" strokeWidth="5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <motion.path
          d="M50 30 Q55 22 65 20 Q72 19 78 24 Q82 28 80 35 Q78 40 72 42 L65 38 Q60 36 55 38 L50 42Z"
          fill="#FF0000"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
        />
        <motion.path
          d="M55 42 Q58 50 55 60 Q53 65 50 68 L60 65 Q65 58 63 48Z"
          fill="#0033A0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
        <motion.text x="50" y="88" textAnchor="middle" fontSize="16" fontWeight="800"
          fill="#0033A0" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >MOBIL</motion.text>
      </svg>
    </LogoBase>
  );
};
