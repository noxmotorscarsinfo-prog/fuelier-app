import { Sparkles, Plus, X } from 'lucide-react';
import { DailyLog, User } from '../types';

interface ComplementaryMealsWidgetProps {
  user: User;
  currentLog: DailyLog;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  onOpenRecommendations: () => void;
  onRemoveMeal: (index: number) => void;
}

export default function ComplementaryMealsWidget({
  user,
  currentLog,
  totals,
  onOpenRecommendations,
  onRemoveMeal
}: ComplementaryMealsWidgetProps) {
  const goals = user.goals;
  const mealsLogged = [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner].filter(m => m !== null).length;
  
  const remainingMacros = {
    calories: Math.max(0, goals.calories - totals.calories),
    protein: Math.max(0, goals.protein - totals.protein),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fat: Math.max(0, goals.fat - totals.fat)
  };
  
  const hasMacrosRemaining = 
    mealsLogged === 4 && (
      remainingMacros.calories >= 100 ||
      remainingMacros.protein >= 5 ||
      remainingMacros.carbs >= 10 ||
      remainingMacros.fat >= 5
    );

  const hasComplementaryMeals = currentLog.complementaryMeals && currentLog.complementaryMeals.length > 0;

  // Solo mostrar si faltan macros o ya hay comidas complementarias
  if (!hasMacrosRemaining && !hasComplementaryMeals) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-400 rounded-2xl p-5 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 p-2.5 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-purple-900">Completa tu día</p>
            <p className="text-xs text-purple-600">Comidas complementarias</p>
          </div>
        </div>
        {hasMacrosRemaining && (
          <button
            onClick={onOpenRecommendations}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl transition-all font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        )}
      </div>

      {/* Macros faltantes - Solo si faltan */}
      {hasMacrosRemaining && (
        <div className="bg-white/60 rounded-xl p-3 mb-4">
          <p className="text-xs text-purple-700 font-medium mb-2">Te faltan:</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
              {Math.round(remainingMacros.calories)} kcal
            </span>
            <span className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
              🥩 {Math.round(remainingMacros.protein)}g
            </span>
            <span className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
              🌾 {Math.round(remainingMacros.carbs)}g
            </span>
            <span className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
              💧 {Math.round(remainingMacros.fat)}g
            </span>
          </div>
        </div>
      )}

      {/* Comidas Complementarias Añadidas */}
      {hasComplementaryMeals && (
        <div className="space-y-3">
          {currentLog.complementaryMeals.map((meal, index) => (
            <div
              key={index}
              className="bg-white border-2 border-purple-200 rounded-xl p-3 shadow-sm relative"
            >
              <button
                onClick={() => onRemoveMeal(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-all shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
              
              <div className="flex items-start gap-3 mb-2 pr-7">
                <span className="text-xl">✨</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-800">{meal.name}</h3>
                  {meal.variant && <p className="text-xs text-neutral-500">{meal.variant}</p>}
                </div>
                <div className="text-right">
                  <p className="text-purple-600 font-bold">{meal.calories}</p>
                  <p className="text-xs text-neutral-400">kcal</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-1.5">
                  <p className="text-xs text-blue-600 font-medium">{meal.protein}g</p>
                  <p className="text-xs text-neutral-500">Proteína</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-1.5">
                  <p className="text-xs text-amber-600 font-medium">{meal.carbs}g</p>
                  <p className="text-xs text-neutral-500">Carbos</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-1.5">
                  <p className="text-xs text-orange-600 font-medium">{meal.fat}g</p>
                  <p className="text-xs text-neutral-500">Grasas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay comidas pero faltan macros */}
      {!hasComplementaryMeals && hasMacrosRemaining && (
        <div className="bg-white/40 rounded-xl p-4 text-center">
          <p className="text-sm text-purple-700">
            Toca <span className="font-bold">"Añadir"</span> para ver recomendaciones personalizadas
          </p>
        </div>
      )}
    </div>
  );
}
