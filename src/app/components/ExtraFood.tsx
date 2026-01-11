import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { User, DailyLog } from '../types';

interface ExtraFoodProps {
  user: User;
  currentLog: DailyLog;
  onClose: () => void;
  onAdd: (extraFood: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
}

export default function ExtraFood({ user, currentLog, onClose, onAdd }: ExtraFoodProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');

  // Calcular totales actuales
  const calculateCurrentTotals = () => {
    const meals = [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner];
    const mealTotals = meals.reduce(
      (acc, meal) => {
        if (meal) {
          return {
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat
          };
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Sumar extras existentes
    const extraTotals = (currentLog.extraFoods || []).reduce(
      (acc, extra) => ({
        calories: acc.calories + extra.calories,
        protein: acc.protein + extra.protein,
        carbs: acc.carbs + extra.carbs,
        fat: acc.fat + extra.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: mealTotals.calories + extraTotals.calories,
      protein: mealTotals.protein + extraTotals.protein,
      carbs: mealTotals.carbs + extraTotals.carbs,
      fat: mealTotals.fat + extraTotals.fat
    };
  };

  const currentTotals = calculateCurrentTotals();
  const userGoals = user.goals;

  const cals = parseFloat(calories) || 0;
  const prot = parseFloat(protein) || 0;
  const carb = parseFloat(carbs) || 0;
  const fats = parseFloat(fat) || 0;

  // Calcular nuevos totales
  const newTotals = {
    calories: currentTotals.calories + cals,
    protein: currentTotals.protein + prot,
    carbs: currentTotals.carbs + carb,
    fat: currentTotals.fat + fats
  };

  // Calcular impacto en macros
  const impact = {
    calories: newTotals.calories <= userGoals.calories,
    protein: newTotals.protein <= userGoals.protein,
    carbs: newTotals.carbs <= userGoals.carbs,
    fat: newTotals.fat <= userGoals.fat
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (cals <= 0) {
      setError('Debes introducir al menos las calorías');
      return;
    }

    onAdd({ name: name.trim(), calories: Math.round(cals), protein: Math.round(prot), carbs: Math.round(carb), fat: Math.round(fats) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-orange-600 to-orange-700 text-white px-6 py-6 rounded-t-3xl md:rounded-t-3xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl">Comida Extra</h2>
            <button
              onClick={onClose}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-orange-100 text-sm">
            Registra comidas fuera de tu dieta planificada
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-sm text-orange-800">
              💡 Usa esta función para registrar snacks, caprichos o comidas no planificadas. 
              Esto afectará tus macros del día.
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block mb-2 text-sm font-medium text-neutral-700">
              ¿Qué comiste?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Galletas, Pizza, Helado..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
          </div>

          {/* Calorías */}
          <div>
            <label className="block mb-2 text-sm font-medium text-neutral-700">
              Calorías (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Ej: 300"
              min="0"
              step="1"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
          </div>

          {/* Macros (Opcional) */}
          <div className="bg-neutral-50 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">
              Macronutrientes (opcional)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Si conoces los macros, introdúcelos para un seguimiento más preciso
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-xs text-neutral-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Proteína (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs text-neutral-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Carbohidratos (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs text-neutral-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Grasas (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preview si tiene valores */}
          {cals > 0 && (
            <>
              <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                <h3 className="text-sm font-medium mb-3">Valores a añadir</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-600 mb-1">Calorías</p>
                    <p className="text-xl text-red-600 font-medium">{Math.round(cals)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-600 mb-1">Proteína</p>
                    <p className="text-xl text-blue-600 font-medium">{Math.round(prot)}g</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-600 mb-1">Carbos</p>
                    <p className="text-xl text-amber-600 font-medium">{Math.round(carb)}g</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-600 mb-1">Grasas</p>
                    <p className="text-xl text-orange-600 font-medium">{Math.round(fats)}g</p>
                  </div>
                </div>
              </div>

              {/* Impacto en objetivos */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                <h3 className="text-sm font-medium mb-3">Impacto en tus objetivos del día</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Calorías</span>
                    <div className="flex items-center gap-2">
                      <span className={impact.calories ? 'text-green-600' : 'text-red-600'}>
                        {Math.round(newTotals.calories)} / {userGoals.calories}
                      </span>
                      {impact.calories ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Proteína</span>
                    <div className="flex items-center gap-2">
                      <span className={impact.protein ? 'text-green-600' : 'text-red-600'}>
                        {Math.round(newTotals.protein)}g / {userGoals.protein}g
                      </span>
                      {impact.protein ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Carbohidratos</span>
                    <div className="flex items-center gap-2">
                      <span className={impact.carbs ? 'text-green-600' : 'text-red-600'}>
                        {Math.round(newTotals.carbs)}g / {userGoals.carbs}g
                      </span>
                      {impact.carbs ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Grasas</span>
                    <div className="flex items-center gap-2">
                      <span className={impact.fat ? 'text-green-600' : 'text-red-600'}>
                        {Math.round(newTotals.fat)}g / {userGoals.fat}g
                      </span>
                      {impact.fat ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-100 text-neutral-700 py-4 rounded-2xl hover:bg-neutral-200 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 bg-orange-600 text-white py-4 rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}