import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { Recipe, Method, Pour } from '../types';
import { sounds } from '../services/sounds';

interface RecipeFormProps {
  method: Method;
  initialData?: Recipe;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ method, initialData, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [coffee, setCoffee] = useState(initialData?.coffee_grams || 15);
  const [ratio, setRatio] = useState(initialData?.ratio || 16);
  
  const [pours, setPours] = useState<Pour[]>(initialData?.pours || [
    { name: 'Bloom', start_time_seconds: 0, water_grams: 45, notes: '' }
  ]);

  const [isDraggingCoffee, setIsDraggingCoffee] = useState(false);
  const coffeeDragRef = useRef(0);
  const coffeeStartValue = useRef(initialData?.coffee_grams || 15);

  const totalWater = Math.round(coffee * ratio);

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
      grind_clicks: initialData?.grind_clicks || 20,
      temp_c: initialData?.temp_c || 92,
      total_time_seconds: initialData?.total_time_seconds || 150,
      pours
    });
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 bg-black z-50 flex flex-col p-8 overflow-y-auto"
    >
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-white uppercase">{initialData ? 'Editar' : 'Nueva Receta'}</h2>
        <button onClick={onClose} className="p-2 text-white/40"><X size={24} /></button>
      </header>

      <div className="space-y-10 flex-1">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Nombre</span>
          <input 
            type="text" 
            placeholder="Ej: Etíope Floral"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-b border-white/10 py-2 text-2xl font-bold outline-none text-white focus:border-white w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-white/30">Café (g)</span>
            <div onTouchStart={handleCoffeeStart} onMouseDown={handleCoffeeStart} className="text-4xl font-bold py-2 cursor-ns-resize">{coffee}g</div>
          </div>
          <div className="
