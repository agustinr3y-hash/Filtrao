import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { sounds } from '../services/sounds';

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  step?: number;
  unit?: string;
  isSemicircle?: boolean;
}

export const Knob: React.FC<KnobProps> = ({ 
  value, 
  onChange, 
  min, 
  max, 
  label, 
  step = 1, 
  unit = "", 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startValue = useRef(0);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    startX.current = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startValue.current = value;
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const deltaX = clientX - startX.current;
    
    // Sensitivity: how many pixels for a full range
    const sensitivity = 200; 
    const range = max - min;
    const deltaValue = (deltaX / sensitivity) * range;
    
    let newValue = startValue.current + deltaValue;
    newValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(newValue / step) * step;
    
    if (steppedValue !== value) {
      onChange(Number(steppedValue.toFixed(1)));
      sounds.tick();
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Calculate rotation for the ribbed texture
  const rotation = ((value - min) / (max - min)) * 360;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</span>
      
      <div 
        ref={knobRef}
        className="relative w-full h-20 cursor-ew-resize select-none flex items-center justify-center group"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Value Display */}
        <div className="relative z-20 flex flex-col items-center pointer-events-none w-full">
          <motion.div 
            key={value}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center justify-center w-full"
          >
            <span className="text-6xl font-display font-bold tracking-tighter text-white">
              {unit === "1:x" ? `1:${value}` : value}
            </span>
            {unit === "°" && (
              <span className="absolute text-6xl font-display font-bold tracking-tighter text-white ml-[6.5rem]">
                °
              </span>
            )}
          </motion.div>
          {unit && unit !== "1:x" && unit !== "°" && (
            <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-black mt-1 text-center w-full ml-2">
              {unit}
            </span>
          )}
        </div>

        {/* Subtle side fade */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// Legacy components updated to use the new Knob
export const RotaryDial: React.FC<any> = (props) => <Knob {...props} />;
export const CustomSlider: React.FC<any> = (props) => <Knob {...props} isSemicircle={true} />;
