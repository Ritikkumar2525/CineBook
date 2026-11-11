import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-primary-500 border-t-transparent border-r-transparent animate-spin`}
        style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
      />
      {text && <p className="text-sm text-dark-300 font-medium tracking-wide animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
