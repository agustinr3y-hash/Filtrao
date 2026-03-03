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
  const [minutes, setMinutes] = useState(Math.floor(initialTotalSeconds / 60));
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

  const handleAddPour = () => {
    const lastPour = pours[pours.length - 1];
    setPours([...pours, { 
      name: `Vertido ${pours.length + 1}`, 
      start_time_seconds: lastPour ? lastPour.start_time_seconds + 30 : 0, 
      water_grams: 0, 
      notes: '' 
    }]);
    sounds.muted();
  };

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
    sounds.confirm();
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-8 max-w-md mx-auto">
          <header className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">
              {initialData ? 'EDITAR RECETA' : 'NUEVA RECETA'}
            </h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </header>

          <div className="space-y-12 pb-40">
            <section className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Nombre</span>
                <div className="flex items-center gap-4 border-b border-white/10 focus-within:border-white transition-colors">
                  <input 
                    type="text" 
                    placeholder="Ej: Etíope Floral"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent py-2 text-2xl font-bold tracking-tight outline-none w-full text-white"
                  />
                  <CoffeeBeanIcon className="text-white" onClick={() => setIsCoffeeModalOpen(true)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2 items-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Café (g)</span>
                  <div 
                    className="py-2 cursor-ns-resize select-none text-4xl font-bold text-white"
                    onMouseDown={handleCoffeeStart}
                    onTouchStart={handleCoffeeStart}
                  >
                    {coffee}g
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Agua Total (g)</span>
                  <div className="py-2 text-4xl font-bold text-white/40">{totalWater}g</div>
                </div>
              </div>
