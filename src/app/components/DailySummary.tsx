import { DailyLog, MacroGoals } from '../types';
import { ArrowLeft, Target, TrendingUp } from 'lucide-react';

interface DailySummaryProps {
  currentLog: DailyLog;
  goals: MacroGoals;
  onBack: () => void;
}

export default function DailySummary({ currentLog, goals, onBack }: DailySummaryProps) {
  const calculateTotals = () => {
    const meals = [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner];
    return meals.reduce(
      (acc, meal) => {
        if (meal) {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totals = calculateTotals();

  const getPercentage = (value: number, goal: number) => {
    return Math.min(Math.round((value / goal) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'bg-emerald-500';
    if (percentage >= 70 && percentage < 90) return 'bg-amber-500';
    if (percentage > 110) return 'bg-orange-500';
    return 'bg-neutral-300';
  };

  const MacroProgress = ({ 
    label, 
    value, 
    goal, 
    color, 
    unit = 'g' 
  }: { 
    label: string; 
    value: number; 
    goal: number; 
    color: string;
    unit?: string;
  }) => {
    const percentage = getPercentage(value, goal);
    const progressColor = getProgressColor(percentage);

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral-700">{label}</span>
          <span className="text-sm text-neutral-500">
            {value} / {goal} {unit}
          </span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-neutral-400">{percentage}%</span>
          {percentage >= 90 && percentage <= 110 && (
            <span className="text-xs text-emerald-600">¡Objetivo alcanzado!</span>
          )}
          {percentage > 110 && (
            <span className="text-xs text-orange-600">Sobre el objetivo</span>
          )}
        </div>
      </div>
    );
  };

  const getMealLabel = (type: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
    const labels = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      snack: 'Merienda',
      dinner: 'Cena'
    };
    return labels[type];
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl">Resumen Diario</h1>
            <p className="text-emerald-100 text-sm">
              {new Date(currentLog.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Total Summary Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5" />
            <h2 className="text-lg">Total del Día</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-3xl mb-1">{totals.calories}</p>
              <p className="text-xs text-emerald-100">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-1">{totals.protein}</p>
              <p className="text-xs text-emerald-100">prot</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-1">{totals.carbs}</p>
              <p className="text-xs text-emerald-100">carb</p>
            </div>
            <div className="text-center">
              <p className="text-3xl mb-1">{totals.fat}</p>
              <p className="text-xs text-emerald-100">grasa</p>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3>Progreso de Objetivos</h3>
          </div>
          
          <MacroProgress 
            label="Calorías" 
            value={totals.calories} 
            goal={goals.calories} 
            color="red"
            unit="kcal"
          />
          <MacroProgress 
            label="Proteína" 
            value={totals.protein} 
            goal={goals.protein} 
            color="blue"
          />
          <MacroProgress 
            label="Carbohidratos" 
            value={totals.carbs} 
            goal={goals.carbs} 
            color="amber"
          />
          <MacroProgress 
            label="Grasas" 
            value={totals.fat} 
            goal={goals.fat} 
            color="orange"
          />
        </div>

        {/* Meal Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="mb-4">Desglose por Comida</h3>
          
          <div className="space-y-4">
            {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((type) => {
              const meal = currentLog[type];
              return (
                <div key={type} className="border-l-4 border-emerald-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-neutral-500 uppercase tracking-wide">
                        {getMealLabel(type)}
                      </p>
                      <p className="text-neutral-700">
                        {meal ? meal.name : 'No seleccionado'}
                      </p>
                    </div>
                    {meal && (
                      <span className="text-emerald-600">{meal.calories} kcal</span>
                    )}
                  </div>
                  {meal && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-blue-600">P: {meal.protein}g</span>
                      <span className="text-amber-600">C: {meal.carbs}g</span>
                      <span className="text-orange-600">G: {meal.fat}g</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Macro Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="mb-4">Distribución de Macros</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600">Proteína</span>
                <span className="text-neutral-600">{totals.protein}g ({Math.round((totals.protein * 4 / totals.calories) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${(totals.protein * 4 / totals.calories) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-600">Carbohidratos</span>
                <span className="text-neutral-600">{totals.carbs}g ({Math.round((totals.carbs * 4 / totals.calories) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(totals.carbs * 4 / totals.calories) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-orange-600">Grasas</span>
                <span className="text-neutral-600">{totals.fat}g ({Math.round((totals.fat * 9 / totals.calories) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${(totals.fat * 9 / totals.calories) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}