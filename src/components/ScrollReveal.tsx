import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up';
  delay?: number;
  className?: string;
}

/**
 * Provides editorial left/right/up slide-in transitions when visitors view and scroll down the website.
 */
export function ScrollReveal({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const initialX = direction === 'left' ? -44 : direction === 'right' ? 44 : 0;
  const initialY = direction === 'up' ? 28 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.12, margin: '0px 0px -30px 0px' }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
