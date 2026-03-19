'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  hoverGlow?: boolean;
  iridescent?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  blur = 20,
  opacity = 0.04,
  borderOpacity = 0.08,
  hoverGlow = true,
  iridescent = false,
  className = '',
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={`
        relative rounded-2xl overflow-hidden
        ${iridescent ? 'glass-iridescent' : ''}
        ${className}
      `}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
      }}
      whileHover={hoverGlow ? {
        borderColor: `rgba(255, 255, 255, ${borderOpacity + 0.07})`,
        boxShadow: '0 8px 40px rgba(59, 130, 246, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        transition: { duration: 0.3 },
      } : undefined}
      {...motionProps}
    >
      {/* Inner highlight at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        }}
      />
      {children}
    </motion.div>
  );
}
