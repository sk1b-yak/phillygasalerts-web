import React from "react";
import { motion } from "framer-motion";
import { LogoBase } from "./LogoBase";
import { LogoProps } from "./types";

export const SinclairLogo: React.FC<LogoProps> = (props) => {
  const brandColor = "#00A551";
  return (
    <LogoBase {...props} brandColor={brandColor}>
      <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" aria-label="Sinclair">
        {/* Brontosaurus silhouette */}
        <motion.path
          d="M25 65 Q20 55 25 50 Q30 42 35 45 L40 40 Q45 32 55 35 Q60 36 62 40 L65 38 Q70 36 72 40 Q75 44 72 48 Q68 52 65 50 L60 55 Q55 60 50 58 L45 62 Q40 65 35 63 L30 65 Z"
          fill="#00A551"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.text x="50" y="85" textAnchor="middle" fontSize="10" fontWeight="800"
          fill="#00A551" fontFamily="Arial"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >SINC</motion.text>
      </svg>
    </LogoBase>
  );
};
