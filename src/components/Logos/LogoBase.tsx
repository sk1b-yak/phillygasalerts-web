import React from 'react';
import { motion } from 'framer-motion';
import { LogoProps } from './types';

interface LogoBaseProps extends LogoProps {
  children: React.ReactNode;
}

export const LogoBase: React.FC<LogoBaseProps> = ({
  children,
  size = 64,
  brandColor = '#6366f1',
  isDarkMode = false,
  isHovered = false,
  onClick,
  className = '',
}) => {
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

  return (
    <motion.div
      className={`relative flex items-center justify-center rounded-full cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        boxShadow: isHovered 
          ? `0 0 20px ${brandColor}40, 0 4px 12px rgba(0,0,0,0.15)` 
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
      whileHover={{ 
        scale: 1.15,
        transition: { type: 'spring', stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.div
        className="flex items-center justify-center w-full h-full"
        animate={{
          rotate: isHovered ? [0, -5, 5, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
      
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `2px solid ${brandColor}`,
          }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ 
            scale: 1.3, 
            opacity: 0,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};