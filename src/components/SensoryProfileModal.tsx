import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { SensoryProfile } from '../types';
import { sounds } from '../services/sounds';

interface SensoryProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: SensoryProfile;
  onSave: (profile: SensoryProfile) => void;
}

const ATTRIBUTES = [
  { key: 'body', label: 'Cuerpo' },
  { key: 'sweetness', label: 'Dulzor' },
  { key: 'acidity', label: 'Acidez' },
  { key: 'bitterness', label: 'Amargor' },
] as const;

export const SensoryProfileModal: React.FC<SensoryProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  initialValue, 
  onSave 
}) => {
  const [profile, setProfile] = useState<SensoryProfile>(initialValue || {
    body: 3,
    sweetness: 3,
    acidity: 3,
    bitterness: 3
  });

  const [draggingKey, setDraggingKey] = useState<keyof SensoryProfile | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getDominantText = () => {
    const values = [
      { label: 'Cuerpo pronunciado', value: profile.body },
      { label: 'Dominante en dulzor', value: profile.sweetness },
      { label: 'Dominante en acidez', value: profile.acidity },
      { label: 'Amargor marcado', value: profile.bitterness },
    ];
    
    const max = Math.max(...values.map(v => v.value));
    const dominants = values.filter(v => v.value === max);
    
    if (dominants.length > 1 && max > 3) return 'Perfil balanceado e intenso';
    if (max <= 3 && Math.min(...values.map(v => v.value)) >= 2) return 'Perfil balanceado';
    return dominants[0].label;
  };

  const handleDrag = (key: keyof SensoryProfile, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const height = rect.height;
    const padding = 40; // Vertical padding for the graph
    const graphHeight = height - (padding * 2);
    
    // Scale: 1 at bottom, 5 at top
    const relativeY = clientY - rect.top - padding;
    const percentage = 1 - (relativeY / graphHeight);
    const newValue = Math.max(1, Math.min(5, Math.round(percentage * 4 + 1)));
    
    if (newValue !== profile[key]) {
      setProfile(prev => ({ ...prev, [key]: newValue }));
      sounds.tick();
    }
  };

  useEffect(() => {
    if (!draggingKey) return;

    const onMouseMove = (e: MouseEvent) => handleDrag(draggingKey, e.clientY);
    const onTouchMove = (e: TouchEvent) => handleDrag(draggingKey, e.touches[0].clientY);
    const onEnd = () => {
      setDraggingKey(null);
      onSave(profile);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [draggingKey, profile, onSave]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onSave(profile);
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-black rounded-t-[2.5rem] z-[101] p-8 pb-12 border-t border-white/10"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
            
            <header className="flex justify-between items-center mb-10">
              <div className="w-8" />
              <h2 className="text-xl font-display font-bold tracking-tight text-white uppercase">Perfil Sensorial</h2>
              <button 
                onClick={() => {
                  onSave(profile);
                  onClose();
                }}
                className="p-2 text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            <div 
              ref={containerRef}
              className="relative h-64 mb-20 mx-12"
            >
              {/* Grid Lines & Scale Labels */}
              {[1, 2, 3, 4, 5].map((val) => (
                <div 
                  key={val}
                  className="absolute left-0 right-0 flex items-center"
                  style={{ bottom: `${(val - 1) * 25}%`, height: 0 }}
                >
                  <div className="w-full border-t border-white/5" />
                  <span className="absolute -left-8 text-[8px] text-muted/30 font-mono">{val}</span>
                </div>
              ))}

              {/* Connecting Lines */}
              <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              >
                <motion.path 
                  d={ATTRIBUTES.map((attr, i) => {
                    const x = (i / (ATTRIBUTES.length - 1)) * 100;
                    const y = 100 - (profile[attr.key] - 1) * 25;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ d: ATTRIBUTES.map((attr, i) => {
                    const x = (i / (ATTRIBUTES.length - 1)) * 100;
                    const y = 100 - (profile[attr.key] - 1) * 25;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') }}
                  transition={{ 
                    type: 'spring', 
                    damping: 35, 
                    stiffness: 350, 
                    mass: 0.5,
                    restDelta: 0.001
                  }}
                />
              </svg>

              {/* Interaction Points */}
              {ATTRIBUTES.map((attr, i) => (
                <div 
                  key={attr.key}
                  className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${(i / (ATTRIBUTES.length - 1)) * 100}%` }}
                >
                  {/* Vertical Track */}
                  <div className="absolute inset-0 flex justify-center py-1">
                    <div className="w-px h-full bg-white/5" />
                  </div>
                  
                  {/* Draggable Point */}
                  <motion.div 
                    className="absolute z-10 w-10 h-10 flex items-center justify-center cursor-ns-resize"
                    style={{ 
                      bottom: `calc(${(profile[attr.key] - 1) * 25}% - 20px)`,
                    }}
                    onMouseDown={() => setDraggingKey(attr.key)}
                    onTouchStart={() => setDraggingKey(attr.key)}
                    animate={{ bottom: `calc(${(profile[attr.key] - 1) * 25}% - 20px)` }}
                    transition={{ 
                      type: 'spring', 
                      damping: 35, 
                      stiffness: 350, 
                      mass: 0.5,
                      restDelta: 0.001
                    }}
                  >
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] border border-black/50" />
                    {draggingKey === attr.key && (
                      <motion.div 
                        layoutId="active-ring"
                        className="absolute inset-0 border border-white/20 rounded-full"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                      />
                    )}
                  </motion.div>

                  <span className="absolute -bottom-10 text-[9px] uppercase tracking-[0.15em] text-muted/60 font-medium whitespace-nowrap">
                    {attr.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <motion.p 
                key={getDominantText()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] uppercase tracking-[0.2em] text-muted/30 font-medium"
              >
                {getDominantText()}
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
