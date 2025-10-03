import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGlowBorderProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

/**
 * Reusable animated glowing border component
 * Used for loading states and special effects
 */
export const AnimatedGlowBorder = ({ 
  children, 
  className = '', 
  isActive = true 
}: AnimatedGlowBorderProps) => {
  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Animated glowing border */}
      <motion.div 
        className="absolute -inset-[2px] rounded-full border-2 border-flame-400/60 z-0"
        animate={{
          boxShadow: [
            '0 0 15px rgba(249, 115, 22, 0.3)',
            '0 0 30px rgba(249, 115, 22, 0.7)',
            '0 0 15px rgba(249, 115, 22, 0.3)',
          ],
          borderColor: [
            'rgba(249, 115, 22, 0.6)',
            'rgba(251, 146, 60, 0.9)',
            'rgba(249, 115, 22, 0.6)',
          ]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {children}
    </div>
  );
};
