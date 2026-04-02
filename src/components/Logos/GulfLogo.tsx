import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const GulfLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#FF5F00";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Gulf">
        <motion.circle cx="50" cy="48" r="32" fill="#003B7E"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        />
        <motion.circle cx="50" cy="48" r="24" fill="#FF5F00"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        />
        <motion.circle cx="50" cy="48" r="16" fill="#fff"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        />
        <motion.text x="50" y="90" textAnchor="middle" fontSize="12" fontWeight="800"
          fill="#003B7E" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >GULF</motion.text>
      </svg>
    </LogoBase>
  );
};
