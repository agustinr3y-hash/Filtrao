import React, { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface BackgroundParticlesProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export const BackgroundParticles: React.FC<BackgroundParticlesProps> = ({ containerRef }) => {
  // useScroll expects a RefObject. We ensure this component is only rendered
  // when the ref is already attached to an element to avoid hydration errors.
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });
  
  // Create a stable set of random particles
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.1 + 0.05,
      // Different speed for parallax effect
      speed: Math.random() * 150 + 50,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => {
        // Create a unique transform for each particle based on scroll
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const y = useTransform(scrollYProgress, [0, 1], [0, -p.speed]);
        
        return (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              backgroundColor: 'white',
              borderRadius: '50%',
              y,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: p.opacity, 
              scale: 1,
              x: [0, Math.random() * 30 - 15, 0],
            }}
            transition={{ 
              opacity: { duration: 1 },
              scale: { duration: 1 },
              x: { duration: Math.random() * 10 + 10, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        );
      })}
    </div>
  );
};
