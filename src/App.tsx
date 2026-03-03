import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Settings2, Trash2, Play, Thermometer, Timer } from 'lucide-react';
import { Method, Recipe, METHODS, formatTime } from './types';
import { RecipeForm } from './components/RecipeForm';
import { BrewMode } from './components/BrewMode';
import { sounds } from './services/sounds';

export default function App() {
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [activeBrew, setActiveBrew] = useState<Recipe | null>(null);

  // CARGAR RECETAS LOCALMENTE (Más rápido)
  useEffect(() => {
    const saved = localStorage.getItem('filtrao_recipes');
    if (saved) {
      setRecipes(JSON.parse(saved));
    }
  }, []);

  // GUARDAR RECETAS LOCALMENTE (Sin errores de API)
  const handleSaveRecipe = (recipe: Recipe) => {
    let newRecipes;
    if (editingRecipe) {
      newRecipes = recipes.map(r => r.id === editingRecipe.id ? { ...recipe, id: r.id } : r);
    } else {
      const newRecipe = { ...recipe, id: Date.now() };
      newRecipes = [...recipes, newRecipe];
    }
    
    setRecipes(newRecipes);
    localStorage.setItem('filtrao_recipes', JSON.stringify(newRecipes));
    setShowForm(false);
    setEditingRecipe(null);
    sounds.confirm();
  };

  const handleDeleteRecipe = (id: number) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    const newRecipes = recipes.filter(r => r.id !== id);
    setRecipes(newRecipes);
    localStorage.setItem('filtrao_recipes', JSON.stringify(newRecipes));
    sounds.muted();
  };

  const [methodIndex, setMethodIndex] = useState(0);
  const [isDraggingMethod, setIsDraggingMethod] = useState(false);
  const methodDragRef = useRef(0);

  const handleMethodStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingMethod(true);
    methodDragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
  };

  const handleMethodMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingMethod) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = methodDragRef.current - clientY;
    if (Math.abs(deltaY) > 60) {
      const dir = deltaY > 0 ? 1 : -1;
      let next = (methodIndex + dir) % METHODS.length;
      if (next < 0) next = METHODS.length - 1;
      setMethodIndex(next);
      methodDragRef.current = clientY;
      sounds.tick();
    }
  };

  useEffect(() => {
    const end = () => setIsDraggingMethod(false);
    if (isDraggingMethod) {
      window.addEventListener('mousemove', handleMethodMove);
      window.addEventListener('mouseup', end);
      window.addEventListener('touchmove', handleMethodMove);
      window.addEventListener('touchend', end);
    }
    return () => {
      window.removeEventListener('mousemove', handleMethodMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', handleMethodMove);
      window.removeEventListener('touchend', end);
    };
  }, [isDraggingMethod, methodIndex]);

  const currentMethod = METHODS[methodIndex];
  const recipesByMethod = recipes.filter(r => r.method === selectedMethod);

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedMethod ? (
          <motion.main key="home" className="p-8 flex flex-col items-center justify-between h-screen">
            <h1 className="text-5xl font-bold tracking-tighter pt-10">Filtrao</h1>
            
            <div 
              className="flex-1 flex items-center justify-center w-full cursor-ns-resize"
              onMouseDown={handleMethodStart}
              onTouchStart={handleMethodStart}
            >
              <motion.button
                key={currentMethod}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setSelectedMethod(currentMethod)}
                className="text-4xl font-medium"
              >
                {currentMethod}
              </motion.button>
            </div>
            <div className="pb-20 text-muted opacity-40 text-sm">Deslizá para cambiar método</div>
          </motion.main>
        ) : (
          <motion.main key="list" className="p-6 pt-12 flex flex-col h-screen">
            <header className="flex items-center justify-between mb-8">
              <button onClick={() => setSelectedMethod(null)} className="text-2xl">‹</button>
              <h2 className="text-2xl font-bold">{selectedMethod}</h2>
              <div className="w-8" />
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pb-32 no-scrollbar">
              {recipesByMethod.length === 0 ? (
                <p className="text-center opacity-30 mt-20 italic">No hay recetas aún.</p>
              ) : (
                recipesByMethod.map(recipe => (
                  <div key={recipe.id} className="bg-white/5 p-5 rounded-[2rem] border border-white/10 relative group">
                    <div className="pr-12" onClick={() => { setEditingRecipe(recipe); setShowForm(true); }}>
                      <h3 className="text-xl font-bold">{recipe.name}</h3>
                      <p className="text-xs text-accent opacity-70">{recipe.coffee_grams}g • 1:{recipe.ratio}</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                       <button onClick={() => handleDeleteRecipe(recipe.id!)} className="p-2 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={16}/></button>
                       <button onClick={() => setActiveBrew(recipe)} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-black"><Play size={16} fill="black"/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="fixed bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={() => setShowForm(true)}
                className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-black shadow-lg"
              >
                <Plus size={32} />
              </button>
            </footer>
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
