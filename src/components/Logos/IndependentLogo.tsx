import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const IndependentLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#94a3b8";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Gas Station">
        <motion.path
          d="M50 15 Q38 35 30 50 C25 62 30 78 50 82 C70 78 75 62 70 50 Q62 35 50 15Z"
          fill="#94a3b8"
          initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        />
        <motion.ellipse cx="44" cy="52" rx="8" ry="12" fill="white" opacity="0.25"
          initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
          transition={{ delay: 0.4 }}
        />
        <motion.path
          d="M50 82 L50 92 M44 92 L56 92"
          fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
      </svg>
    </LogoBase>
  );
};
