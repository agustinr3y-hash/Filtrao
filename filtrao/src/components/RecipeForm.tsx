import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { Recipe, Method, Pour, parseTime, formatTime, SensoryProfile, CoffeeDetails } from '../types';
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
  
  const initialTotalSeconds = initialData?.total_time_seconds || 150; // 02:30
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

  // Update bloom automatically when coffee changes
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
    const deltaY = coffeeDragRef.current - clientY; // Up is positive
    const sensitivity = 50; // pixels per gram
    const newValue = Math.max(5, Math.min(100, coffeeStartValue.current + Math.round(deltaY / sensitivity)));
    if (newValue !== coffee) {
      setCoffee(newValue);
      sounds.tick();
    }
  };

  const handleCoffeeEnd = () => setIsDraggingCoffee(false);

  const handleMinutesStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingMinutes(true);
    minutesDragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    minutesStartValue.current = minutes;
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

  const handleMinutesEnd = () => setIsDraggingMinutes(false);

  const handleSecondsStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingSeconds(true);
    secondsDragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    secondsStartValue.current = seconds;
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

  const handleSecondsEnd = () => setIsDraggingSeconds(false);

  React.useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      handleCoffeeMove(e);
      handleMinutesMove(e);
      handleSecondsMove(e);
    };
    const handleEnd = () => {
      handleCoffeeEnd();
      handleMinutesEnd();
      handleSecondsEnd();
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

  const handleRemovePour = (index: number) => {
    setPours(pours.filter((_, i) => i !== index));
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
      className="fixed inset-0 bg-bg z-50 flex flex-col"
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-8 max-w-md mx-auto">
          <header className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-display font-bold tracking-tighter text-white uppercase">
              {initialData ? initialData.name : 'NUEVA RECETA'}
            </h2>
            <button onClick={onClose} className="p-2 text-muted hover:text-accent transition-colors">
              <X size={24} />
            </button>
          </header>

          <div className="space-y-12 pb-40">
            {/* Basic Info */}
            <section className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Nombre</span>
                <div className="flex items-center gap-4 border-b border-white/10 focus-within:border-accent transition-colors">
                  <div className="flex-1 flex flex-col">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Ej: Etíope Floral"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent py-2 text-2xl font-display font-bold tracking-tight outline-none w-full"
                    />
                    {coffeeDetails && (
                      <span className="text-[10px] text-accent uppercase tracking-widest pb-2 font-medium">
                        {coffeeDetails.origin || 'Origen'} • {coffeeDetails.process || 'Proceso'}
                      </span>
                    )}
                  </div>
                  <CoffeeBeanIcon 
                    className="text-white" 
                    onClick={() => setIsCoffeeModalOpen(true)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2 items-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Café (g)</span>
                  <div 
                    className="py-2 cursor-ns-resize select-none group w-full flex justify-center"
                    onMouseDown={handleCoffeeStart}
                    onTouchStart={handleCoffeeStart}
                  >
                    <motion.div 
                      key={coffee}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-4xl font-display font-bold tracking-tight text-white group-hover:text-accent transition-colors"
                    >
                      {coffee}g
                    </motion.div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Agua Total (g)</span>
                  <div className="py-2 text-4xl font-display font-bold tracking-tight text-muted">{totalWater}g</div>
                </div>
              </div>
            </section>

            {/* Interactive Controls */}
            <section className="space-y-10">
              <Knob 
                label="Ratio"
                min={10}
                max={20}
                step={0.5}
                value={ratio}
                onChange={setRatio}
                unit="1:x"
              />

              <Knob 
                label="Molienda"
                min={0}
                max={40}
                value={grind}
                onChange={setGrind}
                unit="Clicks"
              />

              <Knob 
                label="Temperatura"
                min={70}
                max={99}
                value={temp}
                onChange={setTemp}
                unit="°"
              />

              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Tiempo Objetivo</span>
                <div className="flex items-center justify-center gap-1 py-4">
                  <div 
                    className="flex flex-col items-center cursor-ns-resize select-none group"
                    onMouseDown={handleMinutesStart}
                    onTouchStart={handleMinutesStart}
                  >
                    <motion.div 
                      key={minutes}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-5xl font-display font-bold tracking-tighter text-white group-hover:text-accent transition-colors w-16 text-center"
                    >
                      {minutes.toString().padStart(2, '0')}
                    </motion.div>
                  </div>
                  <div className="text-3xl font-display font-bold text-muted mb-1">:</div>
                  <div 
                    className="flex flex-col items-center cursor-ns-resize select-none group"
                    onMouseDown={handleSecondsStart}
                    onTouchStart={handleSecondsStart}
                  >
                    <motion.div 
                      key={seconds}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-5xl font-display font-bold tracking-tighter text-white group-hover:text-accent transition-colors w-16 text-center"
                    >
                      {seconds.toString().padStart(2, '0')}
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pours Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-muted font-medium">Vertidos</span>
                <div className="flex items-center gap-2">
                  {isWaterExceeded && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-red-500 text-[10px] uppercase tracking-widest"
                    >
                      <AlertCircle size={12} /> Exceso
                    </motion.div>
                  )}
                  <span className={`text-xs font-medium ${isWaterExceeded ? 'text-red-500' : 'text-muted'}`}>
                    {poursWaterSum} / {totalWater}g
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {pours.map((pour, index) => (
                  <motion.div 
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-4 rounded-2xl space-y-4"
                  >
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="Nombre"
                        value={pour.name}
                        onChange={(e) => {
                          const newPours = [...pours];
                          newPours[index].name = e.target.value;
                          setPours(newPours);
                        }}
                        className="flex-1 bg-transparent border-b border-white/5 text-sm font-medium focus:border-accent/30 outline-none"
                      />
                      <button onClick={() => handleRemovePour(index)} className="text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] uppercase tracking-widest text-muted">Inicio (s)</span>
                        <input 
                          type="number" 
                          value={pour.start_time_seconds === 0 ? '' : pour.start_time_seconds}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newPours = [...pours];
                            newPours[index].start_time_seconds = val === '' ? 0 : parseInt(val) || 0;
                            setPours(newPours);
                          }}
                          placeholder="0"
                          className="bg-transparent border-b border-white/5 text-xl font-3d tracking-tight focus:border-accent/30 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] uppercase tracking-widest text-muted">Agua (g)</span>
                        <input 
                          type="number" 
                          value={pour.water_grams === 0 && index !== 0 ? '' : pour.water_grams}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newPours = [...pours];
                            newPours[index].water_grams = val === '' ? 0 : parseFloat(val) || 0;
                            setPours(newPours);
                          }}
                          placeholder="0"
                          className="bg-transparent border-b border-white/5 text-xl font-3d tracking-tight focus:border-accent/30 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
                <button 
                  onClick={handleAddPour}
                  className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-muted hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Añadir Vertido
                </button>

                {/* Sensory Profile Trigger */}
                <div className="flex flex-col items-center gap-4 pt-12 border-t border-white/5">
                  <button 
                    onClick={() => setIsSensoryModalOpen(true)}
                    className="flex flex-col items-center gap-3 text-muted hover:text-accent transition-all group"
                  >
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-accent/10 transition-colors">
                      <SensoryLogo className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Perfil Sensorial</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <SensoryProfileModal 
        isOpen={isSensoryModalOpen}
        onClose={() => setIsSensoryModalOpen(false)}
        initialValue={sensoryProfile}
        onSave={setSensoryProfile}
      />

      <CoffeeDetailsModal
        isOpen={isCoffeeModalOpen}
        onClose={() => setIsCoffeeModalOpen(false)}
        initialValue={coffeeDetails}
        onSave={setCoffeeDetails}
      />

      {/* Fixed Save Button - Liquid Glass Style */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 z-[60] pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button 
            disabled={!name || isWaterExceeded}
            onClick={handleSave}
            className="w-full py-5 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 text-white font-display font-bold text-sm uppercase tracking-[0.2em] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 active:scale-[0.98] transition-all shadow-2xl"
          >
            Guardar
          </button>
        </div>
      </footer>
    </motion.div>
  );
};
