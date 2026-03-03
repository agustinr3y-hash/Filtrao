import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Coffee, Thermometer, Timer, Settings2, Trash2, Play, Calculator } from 'lucide-react';
import { Method, Recipe, METHODS, formatTime } from './types';
import { RecipeForm } from './components/RecipeForm';
import { BrewMode } from './components/BrewMode';
import { sounds } from './services/sounds';

const MinimalBean = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C7.58 2 4 5.58 4 10c0 6.63 8 12 8 12s8-5.37 8-12c0-4.42-3.58-8-8-8zm.5 10c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3z" />
  </svg>
);

const METHOD_IMAGES: Record<Method, string> = {
  'V60': 'https://images.unsplash.com/photo-1544787210-2827443cb69b?q=80&w=800&auto=format&fit=crop',
  'Origami': 'https://images.unsplash.com/photo-1517088455889-bfa75135412c?q=80&w=800&auto=format&fit=crop',
  'Aeropress': 'https://images.unsplash.com/photo-1515442261605-6453579dc558?q=80&w=800&auto=format&fit=crop',
  'Prensa Francesa': 'https://images.unsplash.com/photo-1544190855-943b1f5c440e?q=80&w=800&auto=format&fit=crop'
};

export default function App() {
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [activeBrew, setActiveBrew] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMethod) {
      fetchRecipes();
    }
  }, [selectedMethod]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes?method=${selectedMethod}`);
      const data = await res.json();
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const isEditing = !!editingRecipe;
      const url = isEditing ? `/api/recipes/${editingRecipe!.id}` : '/api/recipes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingRecipe(null);
        fetchRecipes();
        sounds.confirm();
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      fetchRecipes();
      sounds.muted();
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
    sounds.muted();
  };

  const [methodIndex, setMethodIndex] = useState(0);
  const [isDraggingMethod, setIsDraggingMethod] = useState(false);
  const methodDragRef = useRef(0);
  const methodStartValue = useRef(0);

  const handleMethodStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingMethod(true);
    methodDragRef.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    methodStartValue.current = methodIndex;
  };

  const handleMethodMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingMethod) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = methodDragRef.current - clientY;
    const sensitivity = 60; // pixels per method change
    const change = Math.round(deltaY / sensitivity);
    
    // Calculate new index with infinite wrap-around
    let newIndex = (methodStartValue.current + change) % METHODS.length;
    if (newIndex < 0) newIndex += METHODS.length;
    
    if (newIndex !== methodIndex) {
      setMethodIndex(newIndex);
      sounds.tick();
    }
  };

  const handleMethodEnd = () => setIsDraggingMethod(false);

  useEffect(() => {
    if (isDraggingMethod) {
      window.addEventListener('mousemove', handleMethodMove);
      window.addEventListener('mouseup', handleMethodEnd);
      window.addEventListener('touchmove', handleMethodMove);
      window.addEventListener('touchend', handleMethodEnd);
    } else {
      window.removeEventListener('mousemove', handleMethodMove);
      window.removeEventListener('mouseup', handleMethodEnd);
      window.removeEventListener('touchmove', handleMethodMove);
      window.removeEventListener('touchend', handleMethodEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMethodMove);
      window.removeEventListener('mouseup', handleMethodEnd);
      window.removeEventListener('touchmove', handleMethodMove);
      window.removeEventListener('touchend', handleMethodEnd);
    };
  }, [isDraggingMethod]);

  const currentMethod = METHODS[methodIndex];
  const capitalizedMethod = currentMethod.charAt(0).toUpperCase() + currentMethod.slice(1).toLowerCase();

  return (
    <div 
      className="min-h-screen max-w-md mx-auto relative overflow-hidden"
      onClick={() => sounds.muted()}
    >
      <AnimatePresence mode="wait">
        {!selectedMethod ? (
          <motion.main 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-8 pt-8 flex flex-col items-center gap-10 h-screen"
          >
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-5xl font-display font-bold tracking-tighter text-white text-center leading-none">
                Filtrao
              </h1>
            </div>

            <div 
              className="flex-1 flex flex-col items-center justify-center w-full cursor-ns-resize select-none gap-8"
              onMouseDown={handleMethodStart}
              onTouchStart={handleMethodStart}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMethod}
                  initial={{ y: 30, opacity: 0, scale: 0.8, rotateX: 20 }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ y: -30, opacity: 0, scale: 0.8, rotateX: -20 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  className="flex flex-col items-center gap-10"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod(currentMethod);
                      sounds.muted();
                    }}
                    className="text-4xl font-display font-medium tracking-tight text-white/90"
                  >
                    {capitalizedMethod}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pb-12" />
          </motion.main>
        ) : (
          <motion.main 
            key="method-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="p-8 pt-12 flex flex-col gap-8 h-screen"
          >
            <header className="relative flex items-center justify-center min-h-[40px]">
              <button 
                onClick={() => {
                  setSelectedMethod(null);
                  sounds.muted();
                }}
                className="absolute left-0 text-muted hover:text-accent transition-colors text-2xl font-light"
              >
                ‹
              </button>
              <h2 className="text-4xl font-display font-bold tracking-tighter text-white text-center">{selectedMethod}</h2>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-32">
              {loading ? (
                <div className="flex justify-center py-20">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full"
                  />
                </div>
              ) : recipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted">
                  <p className="text-sm italic opacity-30">No hay recetas guardadas.</p>
                </div>
              ) : (
                recipes.map((recipe) => (
                  <motion.div 
                    key={recipe.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="glass p-6 rounded-[2rem] space-y-4 neo-shadow relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex flex-col gap-1 cursor-pointer flex-1"
                        onClick={() => handleEditRecipe(recipe)}
                      >
                        <h3 className="text-2xl font-display font-bold tracking-tight text-white/90">{recipe.name}</h3>
                        {recipe.coffee_details && (
                          <span className="text-[10px] text-accent uppercase tracking-widest font-medium">
                            {recipe.coffee_details.origin || 'Origen'} • {recipe.coffee_details.process || 'Proceso'}
                          </span>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                          <span className="text-[10px] text-muted uppercase tracking-widest font-bold">
                            {recipe.coffee_grams}g • 1:{recipe.ratio}
                          </span>
                          <div className="flex items-center gap-1">
                            <Settings2 size={10} className="text-muted" />
                            <span className="text-[10px] text-muted font-bold">{recipe.grind_clicks}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Thermometer size={10} className="text-muted" />
                            <span className="text-[10px] text-muted font-bold">{recipe.temp_c}°</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer size={10} className="text-muted" />
                            <span className="text-[10px] text-muted font-bold">{formatTime(recipe.total_time_seconds)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteRecipe(recipe.id!)}
                          className="p-2 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setActiveBrew(recipe);
                            sounds.confirm();
                          }}
                          className="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-accent/20"
                        >
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-bg via-bg to-transparent pointer-events-none">
              <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
                <button 
                  onClick={() => {
                    setEditingRecipe(null);
                    setShowForm(true);
                    sounds.muted();
                  }}
                  className="w-16 h-16 rounded-full bg-accent text-bg flex items-center justify-center shadow-2xl shadow-accent/30 hover:scale-110 active:scale-95 transition-all"
                >
                  <Plus size={32} />
                </button>
              </div>
            </footer>
          </motion.main>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && selectedMethod && (
          <RecipeForm 
            method={selectedMethod}
            initialData={editingRecipe || undefined}
            onClose={() => {
              setShowForm(false);
              setEditingRecipe(null);
            }}
            onSave={handleSaveRecipe}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeBrew && (
          <BrewMode 
            recipe={activeBrew}
            onClose={() => setActiveBrew(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
