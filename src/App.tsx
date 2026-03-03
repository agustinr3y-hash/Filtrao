import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
          <motion.main 
            key="home" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-between p-10 py-20"
          >
            <h1 className="text-6xl font-black tracking-tighter italic uppercase">Filtrao</h1>
            
            <div className="flex-1 flex items-center justify-center w-full" onTouchStart={handleStart} onMouseDown={handleStart}>
              <AnimatePresence mode="wait">
                <motion.button 
                  key={METHODS[methodIndex]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onClick={() => {
                    setSelectedMethod(METHODS[methodIndex]);
                    sounds.confirm();
                  }}
                  className="text-5xl font-black tracking-tighter uppercase italic hover:text-white/80 active:scale-90 transition-all"
                >
                  {METHODS[methodIndex]}
                </motion.button>
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col items-center gap-2 opacity-30">
              <div className="w-1 h-12 bg-gradient-to-b from-white to-transparent rounded-full animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Desliza</p>
            </div>
          </motion.main>
        ) : (
          <motion.main 
            key="list" 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 flex flex-col p-6 pt-14 relative z-0"
          >
            <header className="flex items-center justify-between mb-10 sticky top-0 bg-black z-20 pb-4">
              <button onClick={() => setSelectedMethod(null)} className="p-2 -ml-2 active:scale-75 transition-transform">
                <ChevronLeft size={35}/>
              </button>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedMethod}</h2>
              <div className="w-10" />
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pb-40 no-scrollbar">
              {recipesByMethod.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-10 gap-4">
                   <div className="w-12 h-[1px] bg-white" />
                   <p className="text-sm uppercase tracking-widest font-bold italic">Sin registros</p>
                   <div className="w-12 h-[1px] bg-white" />
                </div>
              ) : (
                recipesByMethod.map(recipe => (
                  <motion.div 
                    layout
                    key={recipe.id} 
                    className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/10 flex justify-between items-center backdrop-blur-sm"
                  >
                    <div className="flex-1" onClick={() => { setEditingRecipe(recipe); setShowForm(true); }}>
                      <h3 className="text-xl font-black uppercase italic leading-none mb-1">{recipe.name}</h3>
                      <div className="flex gap-3 text-[10px] uppercase tracking-widest font-bold text-white/40">
                        <span>{recipe.coffee_grams}g</span>
                        <span>•</span>
                        <span>1:{recipe.ratio}</span>
                        <span>•</span>
                        <span>{recipe.temp_c}°</span>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => { 
                          if(confirm('¿Eliminar receta?')) {
                            const n = recipes.filter(r => r.id !== recipe.id); 
                            setRecipes(n); 
                            localStorage.setItem('filtrao_recipes', JSON.stringify(n));
                          }
                        }} 
                        className="p-2 text-white/10 hover:text-red-500/50 transition-colors"
                      >
                        <Trash2 size={20}/>
                      </button>
                      <button 
                        onClick={() => setActiveBrew(recipe)} 
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        <Play size={20} fill="black" className="text-black ml-1"/>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <button 
              onClick={() => { setEditingRecipe(null); setShowForm(true); }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 active:scale-90 transition-transform"
            >
              <Plus size={40} strokeWidth={2.5} />
            </button>
          </motion.main>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60]">
            <RecipeForm 
              method={selectedMethod!} 
              initialData={editingRecipe || undefined}
              onClose={() => { setShowForm(false); setEditingRecipe(null); }}
              onSave={handleSaveRecipe}
            />
          </div>
        )}
      </AnimatePresence>

      {activeBrew && (
        <div className="fixed inset-0 z-[70]">
          <BrewMode recipe={activeBrew} onClose={() => setActiveBrew(null)} />
        </div>
      )}
    </div>
  );
}
