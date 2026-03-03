import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, ChevronRight, CheckCircle2, Volume2 } from 'lucide-react';
import { Recipe, formatTime, Pour } from '../types';
import { sounds } from '../services/sounds';

interface BrewModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export const BrewMode: React.FC<BrewModeProps> = ({ recipe, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentPourIndex, setCurrentPourIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isActive && !isFinished) {
      interval = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          
          // Check for next pour
          const nextPour = recipe.pours[currentPourIndex + 1];
          if (nextPour && next >= nextPour.start_time_seconds) {
            setCurrentPourIndex(prevIdx => prevIdx + 1);
            sounds.phaseChange();
            sounds.vibrate([50, 30, 50]);
          }

          // Check for finish
          if (next >= recipe.total_time_seconds) {
            setIsFinished(true);
            setIsActive(false);
            sounds.confirm();
            sounds.vibrate(200);
          }

          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isFinished, currentPourIndex, recipe]);

  const currentPour = recipe.pours[currentPourIndex];
  const progress = (elapsed / recipe.total_time_seconds) * 100;
  
  const totalWater = recipe.coffee_grams * recipe.ratio;
  const currentTargetWater = recipe.pours
    .slice(0, currentPourIndex + 1)
    .reduce((acc, p) => acc + p.water_grams, 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg z-50 flex flex-col p-8"
    >
      <header className="flex justify-between items-center mb-12">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Brewing</span>
          <h2 className="text-2xl font-display font-bold tracking-tight text-white/90">{recipe.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-muted hover:text-accent transition-colors"
        >
          Cerrar
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {/* 3D Timer Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="128" cy="128" r="120" 
              className="stroke-white/5 fill-none" 
              strokeWidth="4"
            />
            <motion.circle 
              cx="128" cy="128" r="120" 
              className="stroke-accent fill-none" 
              strokeWidth="4"
              strokeDasharray="754"
              animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-7xl font-display font-bold tracking-tighter text-white">
              {formatTime(elapsed)}
            </span>
            <span className="text-xs text-muted mt-2 uppercase tracking-widest">
              de {formatTime(recipe.total_time_seconds)}
            </span>
          </div>
        </div>

        {/* Current Phase */}
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key={currentPourIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Fase Actual</span>
              <h3 className="text-4xl font-display font-bold tracking-tight text-white/90">{currentPour?.name || 'Esperando...'}</h3>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-6xl font-display font-bold tracking-tighter text-white">{currentTargetWater}</span>
                <span className="text-xl text-muted font-display font-bold">g</span>
              </div>
              <p className="text-sm text-muted max-w-[200px] mt-2 italic">
                {currentPour?.notes || 'Vierte el agua suavemente.'}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <CheckCircle2 className="w-16 h-16 text-accent" />
              <h3 className="text-4xl font-display font-bold tracking-tighter text-white">¡LISTO!</h3>
              <p className="text-muted uppercase tracking-widest text-xs">Disfruta tu café.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-auto flex justify-center gap-8 pb-8">
        {!isFinished && (
          <>
            <button 
              onClick={() => {
                setElapsed(0);
                setCurrentPourIndex(0);
                setIsActive(false);
                sounds.muted();
              }}
              className="w-16 h-16 rounded-full glass flex items-center justify-center text-muted hover:text-accent transition-all"
            >
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={() => {
                setIsActive(!isActive);
                sounds.confirm();
              }}
              className="w-20 h-20 rounded-full bg-accent text-bg flex items-center justify-center shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={() => {
                const nextPour = recipe.pours[currentPourIndex + 1];
                if (nextPour) {
                  setElapsed(nextPour.start_time_seconds);
                  sounds.muted();
                }
              }}
              className="w-16 h-16 rounded-full glass flex items-center justify-center text-muted hover:text-accent transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        {isFinished && (
          <button 
            onClick={onClose}
            className="px-12 py-4 rounded-full bg-accent text-bg font-display font-bold text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Finalizar
          </button>
        )}
      </footer>
    </motion.div>
  );
};
