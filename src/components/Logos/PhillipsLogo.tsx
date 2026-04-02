import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const PhillipsLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#E31837";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Phillips 66">
        {/* Shield */}
        <motion.path
          d="M50 15 L75 30 L75 60 Q75 80 50 90 Q25 80 25 60 L25 30 Z"
          fill="none" stroke="#E31837" strokeWidth="4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.text x="50" y="60" textAnchor="middle" fontSize="18" fontWeight="900"
          fill="#E31837" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >P66</motion.text>
      </svg>
    </LogoBase>
  );
};
