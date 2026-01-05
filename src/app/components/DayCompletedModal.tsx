import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, Target, TrendingUp, X } from 'lucide-react';
import { User, DailyLog } from '../types';

interface DayCompletedModalProps {
  isVisible: boolean;
  currentLog: DailyLog;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onContinue: () => void;
}

export default function DayCompletedModal({ isVisible, currentLog, goals, onContinue }: DayCompletedModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger animation after mount
      setTimeout(() => setShowAnimation(true), 100);
    } else {
      setShowAnimation(false);
    }
  }, [isVisible]);

  // Validación de datos necesarios
  if (!goals || !currentLog) {
    return null;
  }

  // Calcular totales del día
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner, ...(currentLog.extraFoods || [])].forEach(meal => {
    if (meal && typeof meal.calories === 'number') {
      totals.calories += meal.calories || 0;
      totals.protein += meal.protein || 0;
      totals.carbs += meal.carbs || 0;
      totals.fat += meal.fat || 0;
    }
  });

  // Calcular porcentajes de cumplimiento
  const caloriesPercent = (totals.calories / goals.calories) * 100;
  const proteinPercent = (totals.protein / goals.protein) * 100;
  const carbsPercent = (totals.carbs / goals.carbs) * 100;
  const fatPercent = (totals.fat / goals.fat) * 100;

  // Puntuación general (promedio de los 4 macros)
  const overallScore = Math.round((caloriesPercent + proteinPercent + carbsPercent + fatPercent) / 4);

  // Mensaje según puntuación
  const getMessage = (score: number) => {
    if (score >= 95 && score <= 105) {
      return {
        title: '¡Día Perfecto! 🎯',
        message: 'Has alcanzado tus objetivos con precisión excepcional. ¡Sigue así!',
        color: 'from-emerald-500 to-teal-500',
        emoji: '🏆'
      };
    } else if (score >= 90 && score < 95) {
      return {
        title: '¡Excelente Trabajo! 💪',
        message: 'Estás muy cerca de tus objetivos. ¡Gran esfuerzo!',
        color: 'from-blue-500 to-cyan-500',
        emoji: '⭐'
      };
    } else if (score >= 85 && score < 90) {
      return {
        title: '¡Buen Día! 👍',
        message: 'Has completado un día sólido. Cada día cuenta.',
        color: 'from-indigo-500 to-purple-500',
        emoji: '💪'
      };
    } else if (score >= 75 && score < 85) {
      return {
        title: 'Día Completado ✓',
        message: 'Hay margen de mejora, pero lo importante es la consistencia.',
        color: 'from-amber-500 to-orange-500',
        emoji: '🔥'
      };
    } else if (score > 105) {
      return {
        title: '¡Te Has Pasado! 📈',
        message: 'Has superado tus objetivos. Considera ajustar las porciones mañana.',
        color: 'from-orange-500 to-red-500',
        emoji: '📊'
      };
    } else {
      return {
        title: 'Día Registrado 📝',
        message: 'Recuerda que la constancia es clave. Mañana será mejor.',
        color: 'from-neutral-500 to-neutral-600',
        emoji: '💡'
      };
    }
  };

  const result = getMessage(overallScore);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${result.color} p-6 text-white relative`}>
          <button
            onClick={onContinue}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Emoji animado */}
          <div className={`text-7xl text-center mb-4 transform transition-all duration-700 ${
            showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}>
            {result.emoji}
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-center mb-2">{result.title}</h2>
          <p className="text-white/90 text-center text-sm">{result.message}</p>
        </div>

        {/* Puntuación */}
        <div className="p-6">
          <div className="bg-neutral-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className={`w-6 h-6 ${overallScore >= 95 && overallScore <= 105 ? 'text-yellow-500' : 'text-neutral-400'}`} />
              <div className="text-center">
                <p className="text-sm text-neutral-500">Puntuación del Día</p>
                <p className="text-4xl font-bold text-neutral-800">{overallScore}<span className="text-xl text-neutral-500">%</span></p>
              </div>
              <Star className={`w-6 h-6 ${overallScore >= 90 ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-400'}`} />
            </div>

            {/* Barra de progreso general */}
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`bg-gradient-to-r ${result.color} h-3 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: showAnimation ? `${Math.min(100, overallScore)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Detalle de macros */}
          <div className="space-y-3">
            {/* Calorías */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-neutral-600">Calorías</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">
                  {Math.round(totals.calories)} / {goals.calories}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  caloriesPercent >= 95 && caloriesPercent <= 105 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : caloriesPercent > 105
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {Math.round(caloriesPercent)}%
                </span>
              </div>
            </div>

            {/* Proteína */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-neutral-600">Proteína</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">
                  {Math.round(totals.protein)}g / {goals.protein}g
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  proteinPercent >= 95 && proteinPercent <= 105 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : proteinPercent > 105
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {Math.round(proteinPercent)}%
                </span>
              </div>
            </div>

            {/* Carbohidratos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-neutral-600">Carbohidratos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">
                  {Math.round(totals.carbs)}g / {goals.carbs}g
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  carbsPercent >= 95 && carbsPercent <= 105 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : carbsPercent > 105
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {Math.round(carbsPercent)}%
                </span>
              </div>
            </div>

            {/* Grasas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" />
                <span className="text-sm text-neutral-600">Grasas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">
                  {Math.round(totals.fat)}g / {goals.fat}g
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  fatPercent >= 95 && fatPercent <= 105 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : fatPercent > 105
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {Math.round(fatPercent)}%
                </span>
              </div>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onContinue}
            className={`w-full mt-6 bg-gradient-to-r ${result.color} text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition-all shadow-lg`}
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}