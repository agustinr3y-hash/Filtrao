import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Plus, Trash2 } from 'lucide-react';
import { Recipe, Method, Pour, CoffeeDetails, SensoryProfile } from '../types';
import { Knob } from './Controls';
import { sounds } from '../services/sounds';
import { CoffeeDetailsModal } from './CoffeeDetailsModal';
import { SensoryProfileModal } from './SensoryProfileModal';

interface RecipeFormProps {
  method: Method;
  initialData?: Recipe;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const CoffeeBeanIcon = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 flex items-center justify-center min-w-[48px] min-h-[48px] text-white"
  >
    <Info size={24} />
  </button>
);

export const RecipeForm: React.FC<RecipeFormProps> = ({ method, initialData, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [coffee, setCoffee] = useState(initialData?.coffee_grams || 15);
  const [ratio, setRatio] = useState(initialData?.ratio || 16);
  const [grind, setGrind] = useState(initialData?.grind_clicks || 20);
  const [temp, setTemp] = useState(initialData?.temp_c || 92);
  
  const initialTotalSeconds = initialData?.total_time_seconds || 150; 
  const [minutes, setMinutes] = useState(Math.floor(initialTotalSeconds / 60));
  const [seconds, setSeconds] = useState(Math.floor((initialTotalSeconds % 60) / 10) * 10);

  const [coffeeDetails, setCoffeeDetails] = useState<CoffeeDetails | undefined>(initialData?.coffee_details);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile | undefined>(initialData?.sensory_profile);
  const [isSensoryModalOpen, setIsSensoryModalOpen] = useState(false);

  const [pours, setPours] = useState<Pour[]>(initialData?.pours || [
    { name: 'Bloom', start_time_seconds: 0, water_grams: 45, notes: '' }
  ]);

  const [isDraggingCoffee, setIsDraggingCoffee] = useState(false);
  const coffeeDragRef = useRef(0);
  const coffeeStartValue = useRef(coffee);

  const totalWater = Math.round(coffee * ratio);

  // Lógica de arrastre para el café (Drag)
  const handleCoffeeMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingCoffee) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = coffeeDragRef.current - clientY;
    const newValue = Math.max(5, Math.min(100, coffeeStartValue.current + Math.round(deltaY / 40)));
    if (newValue !== coffee) {
      setCoffee(newValue);
      sounds.tick();
    }
  };

  useEffect(() => {
    const end = () => setIsDraggingCoffee(false);
    if (isDraggingCoffee) {
      window.addEventListener('mousemove', handleCoffeeMove);
      window.addEventListener('mouseup', end);
      window.addEventListener('touchmove', handleCoffeeMove);
      window.addEventListener('touchend', end);
    }
    return () => {
      window.removeEventListener('mousemove', handleCoffeeMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', handleCoffeeMove);
      window.removeEventListener('touchend', end);
    };
  }, [isDraggingCoffee]);

  const handleSave = () => {
    if (!name) return;
    onSave({
      name,
      method,
      coffee_grams: coffee,
      ratio,
      grind_clicks: grind,
      temp_c: temp,
      total_time_seconds: (minutes * 60) + seconds,
      pours,
      coffee_details: coffeeDetails,
      sensory_profile: sensoryProfile
    } as Recipe);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-black z-[100] flex flex-col select-none overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">
            {initialData ? 'Editar' : 'Nueva Receta'}
          </h2>
          <button onClick={onClose} className="p-2 text-white/40"><X size={28} /></button>
        </header>

        <div className="space-y-12">
          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Café</span>
            <div className="flex items-center gap-4 border-b border-white/10 focus-within:border-white transition-colors">
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Etíope Natural"
                className="bg-transparent py-3 text-2xl font-bold outline-none text-white w-full"
              />
              <CoffeeBeanIcon onClick={() => setIsCoffeeModalOpen(true)} />
            </div>
          </div>

          {/* Café y Agua */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Gramos</span>
              <div 
                onMouseDown={(e) => { setIsDraggingCoffee(true); coffeeDragRef.current = e.clientY; coffeeStartValue.current = coffee; }}
                onTouchStart={(e) => { setIsDraggingCoffee(true); coffeeDragRef.current = e.touches[0].clientY; coffeeStartValue.current = coffee; }}
                className="text-5xl font-bold py-4 text-white cursor-ns-resize"
              >
                {coffee}g
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Agua Total</span>
              <div className="text-5xl font-bold py-4 text-white/40">{totalWater}g</div>
            </div>
          </div>

          {/* Controles Knob */}
          <div className="space-y-10">
            <Knob label="Ratio" min={12} max={18} step={0.5} value={ratio} onChange={setRatio} unit="1:x" />
            <Knob label="Molienda" min={10} max={40} value={grind} onChange={setGrind} unit="Clicks" />
            <Knob label="Temperatura" min={80} max={99} value={temp} onChange={setTemp} unit="°C" />
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent">
        <button 
          onClick={handleSave} disabled={!name}
          className="w-full py-5 rounded-3xl bg-white text-black font-bold text-sm uppercase tracking-widest disabled:opacity-20 active:scale-95 transition-all shadow-xl"
        >
          Guardar Receta
        </button>
      </footer>

      <CoffeeDetailsModal isOpen={isCoffeeModalOpen} onClose={() => setIsCoffeeModalOpen(false)} initialValue={coffeeDetails} onSave={setCoffeeDetails} />
      <SensoryProfileModal isOpen={isSensoryModalOpen} onClose={() => setIsSensoryModalOpen(false)} initialValue={sensoryProfile} onSave={setSensoryProfile} />
    </motion.div>
  );
};
