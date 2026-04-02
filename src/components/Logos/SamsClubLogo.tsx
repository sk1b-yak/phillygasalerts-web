import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const SamsClubLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#0060A9";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Sams Club">
        <motion.path
          d="M58 25 C40 25 32 32 32 40 C32 48 40 50 50 52 C60 54 68 56 68 64 C68 72 60 78 42 78"
          fill="none" stroke="#0060A9" strokeWidth="7" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.circle cx="58" cy="25" r="3" fill="#0060A9"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
        />
        <motion.circle cx="42" cy="78" r="3" fill="#0060A9"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
        />
      </svg>
    </LogoBase>
  );
};
