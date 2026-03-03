import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { Recipe, Method, Pour, SensoryProfile, CoffeeDetails } from '../types';
import { Knob } from './Controls';
import { sounds } from '../services/sounds';
import { SensoryProfileModal } from './SensoryProfileModal';
import { CoffeeDetailsModal } from './CoffeeDetailsModal';

interface RecipeFormProps {
  method: Method;
  initialData?: Recipe;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const CoffeeBeanIcon = ({ className, onClick }: { className?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 flex items-center justify-center min-w-[48px] min-h-[48px] ${className}`}
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
  const [minutes, setMinutes] = useState(Math.max(2, Math.min(5, Math.floor(initialTotalSeconds / 60))));
  const [seconds, setSeconds] = useState(Math.floor((initialTotalSeconds % 60) / 10) * 10);

  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile | undefined>(initialData?.sensory_profile);
  const [isSensoryModalOpen, setIsSensoryModalOpen] = useState(false);

  const [coffeeDetails, setCoffeeDetails] = useState<CoffeeDetails | undefined>(initialData?.coffee_details);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);

  const [pours, setPours] = useState<Pour[]>(initialData?.pours || [
    { name: 'Bloom', start_time_seconds: 0, water_grams: 45, notes: '' }
  ]);

  const [isDraggingCoffee, setIsDraggingCoffee] = useState(false);
  const coffeeDragRef = useRef(0);
  const coffeeStartValue = useRef(initialData?.coffee_grams || 15);

  const totalWater = Math.round(coffee * ratio);
  const poursWaterSum = pours.reduce((acc, p) => acc + p.water_grams, 0);
  const isWaterExceeded = poursWaterSum > totalWater;

  const handleCoffeeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingCoffee(true);
    coffeeDragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    coffeeStartValue.current = coffee;
  };

  const handleCoffeeMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingCoffee) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = coffeeDragRef.current - clientY;
    const sensitivity = 50; 
    const newValue = Math.max(5, Math.min(100, coffeeStartValue.current + Math.round(deltaY / sensitivity)));
    if (newValue !== coffee) {
      setCoffee(newValue);
      sounds.tick();
    }
  };

  React.useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => handleCoffeeMove(e);
    const handleEnd = () => setIsDraggingCoffee(false);

    if (isDraggingCoffee) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
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
      total_time_seconds: minutes * 60 + seconds,
      pours,
      sensory_profile: sensoryProfile,
      coffee_details: coffeeDetails
    });
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar p-8">
        <header className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-white uppercase">{initialData ? name : 'NUEVA RECETA'}</h2>
          <button onClick={onClose} className="p-2 text-white/40"><X size={24} /></button>
        </header>

        <div className="space-y-12 pb-40">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase text-white/30">Nombre</span>
            <div className="flex items-center gap-4 border-b border-white/10">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent py-2 text-2xl font-bold outline-none w-full text-white"
              />
              <CoffeeBeanIcon onClick={() => setIsCoffeeModalOpen(true)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-white/30">Café (g)</span>
              <div onTouchStart={handleCoffeeStart} onMouseDown={handleCoffeeStart} className="text-4xl font-bold py-2">{coffee}g</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-white/30">Agua Total</span>
              <div className="text-4xl font-bold py-2 text-white/40">{totalWater}g</div>
            </div>
          </div>

          <Knob label="Ratio" min={10} max={20} step={0.5} value={ratio} onChange={setRatio} unit="1:x" />
          <Knob label="Molienda" min={0} max={40} value={grind} onChange={setGrind} unit="Clicks" />
          <Knob label="Temperatura" min={70} max={99} value={temp} onChange={setTemp} unit="°" />
        </div>
      </div>

      <footer className="p-8">
        <button 
          disabled={!name || isWaterExceeded}
          onClick={handleSave}
          className="w-full py-5 rounded-2xl bg-white text-black font-bold uppercase tracking-widest disabled:opacity-20"
        >
          Guardar
        </button>
      </footer>

      <SensoryProfileModal isOpen={isSensoryModalOpen} onClose={() => setIsSensoryModalOpen(false)} initialValue={sensoryProfile} onSave={setSensoryProfile} />
      <CoffeeDetailsModal isOpen={isCoffeeModalOpen} onClose={() => setIsCoffeeModalOpen(false)} initialValue={coffeeDetails} onSave={setCoffeeDetails} />
    </motion.div>
  );
};
