import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import { CoffeeDetails } from '../types';
import { sounds } from '../services/sounds';

interface CoffeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: CoffeeDetails;
  onSave: (details: CoffeeDetails) => void;
}

const PROCESS_OPTIONS = ['Lavado', 'Honey', 'Natural'] as const;
const ROAST_OPTIONS = ['Claro', 'Medio', 'Oscuro'] as const;

export const CoffeeDetailsModal: React.FC<CoffeeDetailsModalProps> = ({
  isOpen,
  onClose,
  initialValue,
  onSave,
}) => {
  const [details, setDetails] = useState<CoffeeDetails>(initialValue || {});

  const handleSave = () => {
    onSave(details);
    onClose();
    sounds.confirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-black rounded-t-[2.5rem] z-[101] p-8 pb-12 border-t border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

            <header className="flex justify-between items-center mb-10">
              <div className="w-8" />
              <h2 className="text-xl font-display font-bold tracking-tight text-white uppercase">Datos del Grano</h2>
              <button onClick={onClose} className="p-2 text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="space-y-8">
              {/* Origin */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Origen</span>
                <input
                  type="text"
                  placeholder="Ej: Colombia, Huila"
                  value={details.origin || ''}
                  onChange={(e) => setDetails({ ...details, origin: e.target.value })}
                  className="bg-transparent border-b border-white/10 py-2 text-xl font-display font-bold tracking-tight focus:border-accent outline-none transition-colors"
                />
              </div>

              {/* Variety */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Variedad</span>
                <input
                  type="text"
                  placeholder="Ej: Caturra, Geisha"
                  value={details.variety || ''}
                  onChange={(e) => setDetails({ ...details, variety: e.target.value })}
                  className="bg-transparent border-b border-white/10 py-2 text-xl font-display font-bold tracking-tight focus:border-accent outline-none transition-colors"
                />
              </div>

              {/* Process */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Proceso</span>
                <div className="grid grid-cols-3 gap-3">
                  {PROCESS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setDetails({ ...details, process: option });
                        sounds.tick();
                      }}
                      className={`py-3 rounded-xl border text-[10px] uppercase tracking-widest font-bold transition-all ${
                        details.process === option
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-muted border-white/5 hover:border-white/20'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roast */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Nivel de Tueste</span>
                <div className="grid grid-cols-3 gap-3">
                  {ROAST_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setDetails({ ...details, roast: option });
                        sounds.tick();
                      }}
                      className={`py-3 rounded-xl border text-[10px] uppercase tracking-widest font-bold transition-all ${
                        details.roast === option
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-muted border-white/5 hover:border-white/20'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-5 mt-8 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 text-white font-display font-bold text-sm uppercase tracking-[0.2em] hover:bg-white/20 active:scale-[0.98] transition-all shadow-2xl"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
