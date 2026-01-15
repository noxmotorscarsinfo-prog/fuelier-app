import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Flame, Beef, Wheat, Droplet, ChefHat, RefreshCw, Calendar } from 'lucide-react';
import { Meal } from '../types';
import * as api from '../utils/api';
import { canMealBeRecalculated, needsRecalculation, recalculateCustomMealForToday } from '../utils/customMealRecalculation';

interface MyCustomMealsProps {
  onBack: () => void;
  onCreate: () => void;
  onEdit?: (meal: Meal) => void;
  onSelect?: (meal: Meal) => void;
  onRecalculate?: (meal: Meal, mealType: string) => Promise<Meal>;
  userEmail: string;
  user?: any; // Para contexto de recálculo
  currentLog?: any; // Log actual del usuario
}

export default function MyCustomMeals({ 
  onBack, 
  onCreate, 
  onEdit, 
  onSelect, 
  onRecalculate, 
  userEmail, 
  user, 
  currentLog 
}: MyCustomMealsProps) {
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recalculatingMealId, setRecalculatingMealId] = useState<string | null>(null);

  useEffect(() => {
    loadMeals();
  }, [userEmail]);

  const loadMeals = async () => {
    setIsLoading(true);
    console.log('📥 Cargando custom meals desde Supabase...');
    const meals = await api.getCustomMeals(userEmail);
    console.log(`✅ Cargados ${meals.length} custom meals`);
    setCustomMeals(meals);
    setIsLoading(false);
  };

  const handleRecalculate = async (meal: Meal, mealType: string) => {
    if (!onRecalculate || !user || !currentLog) {
      alert('No se puede recalcular en este momento. Faltan datos del usuario.');
      return;
    }
    
    setRecalculatingMealId(meal.id);
    try {
      // onRecalculate debería ser una función que retorne Promise<Meal>
      const recalculatedMeal = await onRecalculate(meal, mealType);
      
      // Actualizar el plato en la lista
      const updatedMeals = customMeals.map(m => 
        m.id === meal.id ? recalculatedMeal : m
      );
      setCustomMeals(updatedMeals);
      
      // Guardar en Supabase
      await api.saveCustomMeals(userEmail, updatedMeals);
      
      console.log('✅ Plato recalculado y guardado');
    } catch (error) {
      console.error('❌ Error recalculando plato:', error);
      alert('Error al recalcular el plato. Por favor, intenta de nuevo.');
    } finally {
      setRecalculatingMealId(null);
    }
  };

  const handleDelete = async (mealId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este plato?')) {
      // ✅ Eliminar de Supabase
      const updatedMeals = customMeals.filter(m => m.id !== mealId);
      const success = await api.saveCustomMeals(userEmail, updatedMeals);
      
      if (success) {
        console.log('✅ Plato eliminado de Supabase');
        setCustomMeals(updatedMeals);
      } else {
        alert('Error al eliminar el plato. Por favor, intenta de nuevo.');
      }
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels = {
      breakfast: '🌅 Desayuno',
      lunch: '🍽️ Comida',
      snack: '🍎 Merienda',
      dinner: '🌙 Cena'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const groupedMeals = customMeals.reduce((acc, meal) => {
    if (!acc[meal.type]) {
      acc[meal.type] = [];
    }
    acc[meal.type].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  // ✅ Loading state mientras se cargan los platos desde Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando tus platos desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white px-6 pt-12 pb-6 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Mis Platos Creados</h1>
        </div>
        <div className="ml-12">
          <p className="text-purple-100 text-sm">
            {customMeals.length} {customMeals.length === 1 ? 'plato personalizado' : 'platos personalizados'}
          </p>
          <p className="text-purple-200/80 text-xs mt-1">
            📊 Escalable: Se ajusta automáticamente • 🔒 Fijo: Siempre igual
          </p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Botón Crear Nuevo */}
        <button
          onClick={onCreate}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Crear Nuevo Plato</span>
        </button>

        {/* Lista de Platos */}
        {customMeals.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">
              No tienes platos creados aún
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              Crea tus propias recetas personalizadas y ajusta los macros a tu gusto
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMeals).map(([type, meals]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-neutral-500 mb-3 ml-2">
                  {getMealTypeLabel(type)}
                </h3>
                <div className="space-y-3">
                  {meals.map(meal => (
                    <div
                      key={meal.id}
                      className="bg-white rounded-2xl p-5 shadow-md border border-neutral-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-lg text-neutral-800">
                              {meal.name}
                            </h4>
                            {/* ✨ NUEVO: Etiqueta de escalado */}
                            {(meal as any).scalingType && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                (meal as any).scalingType === 'scalable' 
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {(meal as any).scalingType === 'scalable' ? '📊 Escalable' : '🔒 Fijo'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs">
                              Personalizado
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Botón Recalcular */}
                          {canMealBeRecalculated(meal) && onRecalculate && (
                            <button
                              onClick={() => handleRecalculate(meal, type)}
                              disabled={recalculatingMealId === meal.id}
                              className={`${
                                recalculatingMealId === meal.id
                                  ? 'text-gray-400'
                                  : needsRecalculation(meal) 
                                    ? 'text-emerald-600 hover:bg-emerald-50' 
                                    : 'text-orange-500 hover:bg-orange-50'
                              } p-2 rounded-lg transition-all relative`}
                              title={
                                recalculatingMealId === meal.id
                                  ? 'Recalculando...'
                                  : needsRecalculation(meal)
                                    ? 'Recalcular para hoy (recomendado)'
                                    : 'Recalcular para hoy'
                              }
                            >
                              {recalculatingMealId === meal.id ? (
                                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              {needsRecalculation(meal) && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              )}
                            </button>
                          )}
                          
                          {onEdit && (
                            <button
                              onClick={() => onEdit(meal)}
                              className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Macros */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <Flame className="w-4 h-4 text-red-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-red-600">{meal.calories}</p>
                          <p className="text-xs text-neutral-500">kcal</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <Beef className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-blue-600">{meal.protein}g</p>
                          <p className="text-xs text-neutral-500">Prot</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                          <Wheat className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-amber-600">{meal.carbs}g</p>
                          <p className="text-xs text-neutral-500">Carb</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <Droplet className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-orange-600">{meal.fat}g</p>
                          <p className="text-xs text-neutral-500">Grasa</p>
                        </div>
                      </div>

                      {/* Ingredientes */}
                      {meal.detailedIngredients && meal.detailedIngredients.length > 0 && (
                        <div className="bg-neutral-50 rounded-xl p-3 mb-3">
                          <p className="text-xs text-neutral-500 mb-2">Ingredientes:</p>
                          <div className="space-y-1">
                            {meal.detailedIngredients.slice(0, 3).map((ing, idx) => (
                              <p key={idx} className="text-xs text-neutral-700">
                                • {ing.ingredientName} ({ing.amount}g)
                              </p>
                            ))}
                            {meal.detailedIngredients.length > 3 && (
                              <p className="text-xs text-neutral-500 italic">
                                +{meal.detailedIngredients.length - 3} más...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botón Usar */}
                      {onSelect && (
                        <button
                          onClick={() => onSelect(meal)}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium"
                        >
                          Usar en mi dieta
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}