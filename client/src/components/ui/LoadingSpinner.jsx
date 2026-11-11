import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-[#cf785b] border-t-transparent animate-spin`}
      />
      {text && <p className="text-xs text-[#777a72] font-medium tracking-wide">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
