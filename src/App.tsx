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
          <motion.main key="list" className="flex-1 flex flex-col p-6 pt-14">
            <header className="flex items-center justify-between mb-8">
              <button onClick={() => setSelectedMethod(null)} className="p-2 -ml-2"><ChevronLeft size={32}/></button>
              <h2 className="text-2xl font-bold">{selectedMethod}</h2>
              <div className="w-10" />
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pb-40 no-scrollbar">
              {recipesByMethod.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-20 italic">No hay recetas aún.</div>
              ) : (
                recipesByMethod.map(recipe => (
                  <div key={recipe.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 flex justify-between items-center">
                    <div onClick={() => { setEditingRecipe(recipe); setShowForm(true); }}>
                      <h3 className="text-lg font-bold">{recipe.name}</h3>
                      <p className="text-xs text-orange-400">{recipe.coffee_grams}g • 1:{recipe.ratio}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteRecipe(recipe.id!)} className="p-2 text-white/20"><Trash2 size={18}/></button>
                      <button onClick={() => setActiveBrew(recipe)} className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><Play size={18} fill="black"/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => { setEditingRecipe(null); setShowForm(true); }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-black shadow-2xl z-50 active:scale-90 transition-transform"
            >
              <Plus size={35} />
            </button>
          </motion.main>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <RecipeForm 
            method={selectedMethod!} 
            initialData={editingRecipe || undefined}
            onClose={() => { setShowForm(false); setEditingRecipe(null); }}
            onSave={handleSaveRecipe}
          />
        )}
      </AnimatePresence>

      {activeBrew && <BrewMode recipe={activeBrew} onClose={() => setActiveBrew(null)} />}
    </div>
  );
}
