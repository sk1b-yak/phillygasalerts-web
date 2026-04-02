import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const LibertyLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#003DA5";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Liberty">
        {/* Torch flame */}
        <motion.path
          d="M50 15 Q42 30 46 40 Q48 32 50 28 Q52 32 54 40 Q58 30 50 15Z"
          fill="#FFD700"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
        />
        {/* Torch handle */}
        <motion.rect x="47" y="40" width="6" height="35" rx="2" fill="#003DA5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        />
        <motion.text x="50" y="90" textAnchor="middle" fontSize="11" fontWeight="900"
          fill="#003DA5" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >LIB</motion.text>
      </svg>
    </LogoBase>
  );
};
