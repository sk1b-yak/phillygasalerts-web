import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const BJsLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#D31245";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="BJs">
        <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#D31245" strokeWidth="4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.text x="46" y="56" textAnchor="middle" dominantBaseline="central"
          fontSize="28" fontWeight="900" fill="#D31245" fontFamily="Arial"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        >BJ&apos;s</motion.text>
      </svg>
    </LogoBase>
  );
};
