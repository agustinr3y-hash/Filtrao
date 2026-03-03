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

const SensoryLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="9" width="4" height="10" rx="1.5" />
    <rect x="10" y="4" width="4" height="16" rx="1.5" />
    <rect x="16" y="14" width="4" height="6" rx="1.5" />
  </svg>
);

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

  const [isDraggingMinutes, setIsDraggingMinutes] = useState(false);
  const minutesDragRef = useRef(0);
  const minutesStartValue = useRef(0);

  const [isDraggingSeconds, setIsDraggingSeconds] = useState(false);
  const secondsDragRef = useRef(0);
  const secondsStartValue = useRef(0);

  const totalWater = Math.round(coffee * ratio);
  const poursWaterSum = pours.reduce((acc, p) => acc + p.water_grams, 0);
  const isWaterExceeded = poursWaterSum > totalWater;

  React.useEffect(() => {
    const newPours = [...pours];
    if (newPours[0] && newPours[0].name === 'Bloom') {
      newPours[0].water_grams = Math.round(coffee * 3);
      setPours(newPours);
    }
  }, [coffee]);

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

  const handleMinutesMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingMinutes) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = minutesDragRef.current - clientY;
    const sensitivity = 40;
    const newValue = Math.max(2, Math.min(5, minutesStartValue.current + Math.round(deltaY / sensitivity)));
    if (newValue !== minutes) {
      setMinutes(newValue);
      sounds.tick();
    }
  };

  const handleSecondsMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingSeconds) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = secondsDragRef.current - clientY;
    const sensitivity = 40;
    const step = 10;
    const newValue = Math.max(0, Math.min(50, secondsStartValue.current + Math.round(deltaY / sensitivity) * step));
    if (newValue !== seconds) {
      setSeconds(newValue);
      sounds.tick();
    }
  };

  React.useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      handleCoffeeMove(e);
      handleMinutesMove(e);
      handleSecondsMove(e);
    };
    const handleEnd = () => {
      setIsDraggingCoffee(false);
      setIsDraggingMinutes(false);
      setIsDraggingSeconds(false);
    };

    if (isDraggingCoffee || isDraggingMinutes || isDraggingSeconds) {
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
  }, [isDraggingCoffee, isDraggingMinutes, isDraggingSeconds]);

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
              {initialData ? initialData.name : 'NUEVA RECETA'}
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
                  <div className="py-2 cursor-ns-resize select-none text-4xl font-bold text-white" onTouchStart={handleCoffeeStart} onMouseDown={handleCoffeeStart}>
                    {coffee}g
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Agua Total (g)</span>
                  <div className="py-2 text-4xl font-bold text-white/40">{totalWater}g</div>
                </div>
              </div>
            </section>

            <section className="space-y-10">
              <Knob label="Ratio" min={10} max={20} step={0.5} value={ratio} onChange={setRatio} unit="1:x" />
              <Knob label="Molienda" min={0} max={40} value={grind} onChange={setGrind} unit="Clicks" />
              <Knob label="Temperatura" min={70} max={99} value={temp} onChange={setTemp} unit="°" />
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Vertidos</span>
                <span className={`text-xs font-medium ${isWaterExceeded ? 'text-red-500' : 'text-white/40'}`}>
                  {poursWaterSum} / {totalWater}g
                </span>
              </div>
              <div className="space-y-4">
                {pours.map((pour, index) => (
                  <div key={index} className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={pour.name} 
                        onChange={(e) => {
                          const newPours = [...pours];
                          newPours[index].name = e.target.value;
                          setPours(newPours);
                        }}
                        className="flex-1 bg-transparent border-b border-white/5 text-sm font-medium text-white outline-none"
                      />
                      <button onClick={() => setPours(pours.filter((_, i) => i !== index))} className="text-white/20"><Trash2 size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={pour.start_time_seconds} onChange={(e) => { const newPours = [...pours]; newPours[index].start_time_seconds = parseInt(e.target.value); setPours(newPours); }} className="bg-transparent border-b border-white/5 text-xl text-white outline-none" />
                      <input type="number" value={pour.water_grams} onChange={(e) => { const newPours = [...pours]; newPours[index].water_grams = parseFloat(e.target.value); setPours(newPours); }} className="bg-transparent border-b border-white/5 text-xl text-white outline-none" />
                    </div>
                  </div>
                ))}
                <button onClick={handleAddPour} className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-white/30 flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  <Plus size={14} /> Añadir Vertido
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="p-8">
        <button 
          disabled={!name || isWaterExceeded}
          onClick={handleSave}
          className="w-full py-5 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-widest disabled:opacity-20"
        >
          Guardar
        </button>
      </footer>

      <SensoryProfileModal isOpen={isSensoryModalOpen} onClose={() => setIsSensoryModalOpen(false)} initialValue={sensoryProfile} onSave={setSensoryProfile} />
      <CoffeeDetailsModal isOpen={isCoffeeModalOpen} onClose={() => setIsCoffeeModalOpen(false)} initialValue={coffeeDetails} onSave={setCoffeeDetails} />
    </motion.div>
  );
};
