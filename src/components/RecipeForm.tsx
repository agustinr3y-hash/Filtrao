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
  
  const initialTotalSeconds = initialData?.total_time_seconds || 150; 
  const [minutes, setMinutes] = useState(Math.max(2, Math.min(5,
