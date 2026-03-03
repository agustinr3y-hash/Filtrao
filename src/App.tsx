import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Play, ChevronLeft } from 'lucide-react';
import { Method, Recipe, METHODS } from './types';
import { RecipeForm } from './components/RecipeForm';
import { BrewMode } from './components/BrewMode';
import { sounds } from './services/sounds';

export default function App() {
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [activeBrew, setActiveBrew] = useState<Recipe | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('filtrao_recipes');
    if (saved) setRecipes(JSON.parse(saved));
  }, []);

  const handleSaveRecipe = (recipe: Recipe) => {
    const newRecipe = editingRecipe 
      ? { ...recipe, id: editingRecipe.id, method: selectedMethod }
      : { ...recipe, id: Date.now(), method: selectedMethod };
    
    const newRecipes = editingRecipe 
      ? recipes.map(r => r.id === editingRecipe.id ? newRecipe : r)
      : [...recipes, newRecipe];

    setRecipes(newRecipes);
    localStorage.setItem('filtrao_recipes', JSON.stringify(newRecipes));
    setShowForm(false);
    setEditingRecipe(null);
    sounds.confirm();
  };

  const handleDeleteRecipe = (id: number) => {
    if (!confirm('¿Eliminar receta?')) return;
    const newRecipes = recipes.filter(r => r.id !== id);
    setRecipes(newRecipes);
    localStorage.setItem('filtrao_recipes', JSON.stringify(newRecipes));
  };

  const [methodIndex, setMethodIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(0);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    dragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const delta = dragRef.current - clientY;
    if (Math.abs(delta) > 60) {
      const next = (methodIndex + (delta > 0 ? 1 : -1) + METHODS.length) % METHODS.length;
      setMethodIndex(next);
      dragRef.current = clientY;
      sounds.tick();
    }
  };

  useEffect(() => {
    const end = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', end);
    }
    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', end);
    };
  }, [isDragging, methodIndex]);

  const recipesByMethod = recipes.filter(r => r.method === selectedMethod);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {!selectedMethod ? (
          <motion.main key="home" className="flex-1 flex flex-col items-center justify-between p-10 py-20">
            <h1 className="text-5xl font-bold tracking-tighter">Filtrao</h1>
            <div className="flex-1 flex items-center justify-center w-full" onTouchStart={handleStart}>
              <motion.button 
                key={METHODS[methodIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedMethod(METHODS[methodIndex])}
                className="text-4xl font-medium active:scale-90 transition-transform"
              >
                {METHODS[methodIndex]}
              </motion.button>
            </div>
            <p className="text-white/20 text-sm">Desliza para elegir método</p>
          </motion.main>
        ) : (
          <motion.main key="list" className="flex-1 flex flex-col p-6 pt-14 relative z-0">
            <header
