import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const ConocoLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#ED1C24";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Conoco">
        <motion.path
          d="M50 15 L80 75 L20 75 Z"
          fill="none"
          stroke="#ED1C24"
          strokeWidth="5"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.text
          x="50" y="62" textAnchor="middle"
          fontSize="16" fontWeight="900" fill="#ED1C24" fontFamily="Arial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >C</motion.text>
      </svg>
    </LogoBase>
  );
};
