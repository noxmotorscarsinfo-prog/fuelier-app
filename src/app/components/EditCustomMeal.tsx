import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Meal, MacroGoals } from '../types';
import { updateCustomMeal } from '../data/customMeals';

interface EditCustomMealProps {
  meal: Meal;
  onBack: () => void;
  onSaved: () => void;
  userGoals: MacroGoals;
}

export default function EditCustomMeal({ meal, onBack, onSaved, userGoals }: EditCustomMealProps) {
  const [calories, setCalories] = useState(meal.calories.toString());
  const [protein, setProtein] = useState(meal.protein.toString());
  const [carbs, setCarbs] = useState(meal.carbs.toString());
  const [fat, setFat] = useState(meal.fat.toString());
  const [error, setError] = useState('');

  const cals = parseFloat(calories) || 0;
  const prot = parseFloat(protein) || 0;
  const carb = parseFloat(carbs) || 0;
  const fats = parseFloat(fat) || 0;

  // Calcular si encaja en los macros
  const fitsInMacros = {
    calories: cals <= userGoals.calories,
    protein: prot <= userGoals.protein,
    carbs: carb <= userGoals.carbs,
    fat: fats <= userGoals.fat
  };

  const allFit = Object.values(fitsInMacros).every(v => v);

  const handleSave = () => {
    if (isNaN(cals) || cals <= 0) {
      setError('Las calorías deben ser un número válido mayor a 0');
      return;
    }

    if (isNaN(prot) || prot < 0 || isNaN(carb) || carb < 0 || isNaN(fats) || fats < 0) {
      setError('Los macronutrientes deben ser números válidos');
      return;
    }

    const updatedMeal: Meal = {
      ...meal,
      calories: Math.round(cals),
      protein: Math.round(prot),
      carbs: Math.round(carb),
      fat: Math.round(fats)
    };

    updateCustomMeal(meal.id, updatedMeal);
    onSaved();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Editar Plato</h1>
        </div>
        <p className="text-blue-100 text-sm ml-12">
          Ajusta los macros de {meal.name}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Info */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <h3 className="font-medium text-neutral-800 mb-1">{meal.name}</h3>
          <p className="text-sm text-neutral-500">
            Plato personalizado
          </p>
        </div>

        {/* Edición de Macros */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <h3 className="mb-4 font-medium">Ajustar Macronutrientes</h3>
          
          <div className="space-y-4">
            {/* Calorías */}
            <div>
              <label className="block mb-2 text-sm text-neutral-600 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Calorías (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="0"
                step="1"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              />
            </div>

            {/* Proteína */}
            <div>
              <label className="block mb-2 text-sm text-neutral-600 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Proteína (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            {/* Carbohidratos */}
            <div>
              <label className="block mb-2 text-sm text-neutral-600 flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                Carbohidratos (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              />
            </div>

            {/* Grasas */}
            <div>
              <label className="block mb-2 text-sm text-neutral-600 flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                Grasas (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preview de Totales */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <h3 className="mb-4 font-medium">Vista Previa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 text-center">
              <p className="text-sm text-neutral-600 mb-1">Calorías</p>
              <p className="text-2xl text-red-600 font-medium">{Math.round(cals)}</p>
              <p className="text-xs text-neutral-500">kcal</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center">
              <p className="text-sm text-neutral-600 mb-1">Proteína</p>
              <p className="text-2xl text-blue-600 font-medium">{Math.round(prot)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 text-center">
              <p className="text-sm text-neutral-600 mb-1">Carbohidratos</p>
              <p className="text-2xl text-amber-600 font-medium">{Math.round(carb)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center">
              <p className="text-sm text-neutral-600 mb-1">Grasas</p>
              <p className="text-2xl text-orange-600 font-medium">{Math.round(fats)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
          </div>
        </div>

        {/* Validación de Macros */}
        <div className={`rounded-2xl p-6 border-2 ${
          allFit 
            ? 'bg-green-50 border-green-300' 
            : 'bg-amber-50 border-amber-300'
        }`}>
          <h4 className={`font-medium mb-3 ${
            allFit ? 'text-green-800' : 'text-amber-800'
          }`}>
            {allFit 
              ? '✓ Se ajusta a tus macros diarios' 
              : '⚠️ Excede algunos macros diarios'}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className={fitsInMacros.calories ? 'text-green-700' : 'text-red-700'}>
                Calorías: {Math.round(cals)} / {userGoals.calories}
              </span>
              <span>{fitsInMacros.calories ? '✓' : '✗'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={fitsInMacros.protein ? 'text-green-700' : 'text-red-700'}>
                Proteína: {Math.round(prot)}g / {userGoals.protein}g
              </span>
              <span>{fitsInMacros.protein ? '✓' : '✗'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={fitsInMacros.carbs ? 'text-green-700' : 'text-red-700'}>
                Carbohidratos: {Math.round(carb)}g / {userGoals.carbs}g
              </span>
              <span>{fitsInMacros.carbs ? '✓' : '✗'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={fitsInMacros.fat ? 'text-green-700' : 'text-red-700'}>
                Grasas: {Math.round(fats)}g / {userGoals.fat}g
              </span>
              <span>{fitsInMacros.fat ? '✓' : '✗'}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-2xl z-10">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
        >
          <Save className="w-5 h-5" />
          <span className="font-medium">Guardar Cambios</span>
        </button>
      </div>
    </div>
  );
}
