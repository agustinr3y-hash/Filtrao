import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Recipe, Method } from '../types';

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

  const handleSave = () => {
    if (!name) return;
    onSave({
      ...initialData,
      name,
      method,
      coffee_grams: Number(coffee),
      ratio: Number(ratio),
      grind_clicks: initialData?.grind_clicks || 20,
      temp_c: initialData?.temp_c || 92,
      total_time_seconds: initialData?.total_time_seconds || 150,
      pours: initialData?.pours || []
    } as Recipe);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      className="fixed inset-0 bg-black z-[100] flex flex-col p-8"
    >
      <header className="flex justify-between items-center mb-10">
        <h2 className="text-xl font-bold uppercase">Receta</h2>
        <button onClick={onClose} className="p-2 text-white/40"><X size={24} /></button>
      </header>
      <div className="space-y-8 flex-1">
        <input 
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="bg-transparent border-b border-white/10 py-2 text-xl font-bold outline-none text-white w-full"
          placeholder="Nombre del café"
        />
        <div className="grid grid-cols-2 gap-8">
          <input type="number" value={coffee} onChange={(e) => setCoffee(Number(e.target.value))} className="bg-transparent border-b border-white/10 py-2 text-white" />
          <input type="number" value={ratio} onChange={(e) => setRatio(Number(e.target.value))} className="bg-transparent border-b border-white/10 py-2 text-white" />
        </div>
      </div>
      <button onClick={handleSave} className="w-full py-5 rounded-2xl bg-white text-black font-bold mt-auto">Guardar</button>
    </motion.div>
  );
};
