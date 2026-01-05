import { useState } from 'react';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { Ingredient } from '../types';
import { saveCustomIngredient } from '../data/ingredients';

interface CreateIngredientProps {
  onBack: () => void;
  onCreated: () => void;
}

export default function CreateIngredient({ onBack, onCreated }: CreateIngredientProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    // Validación
    if (!name.trim()) {
      setError('El nombre del ingrediente es obligatorio');
      return;
    }

    const cals = parseFloat(calories);
    const prot = parseFloat(protein);
    const carb = parseFloat(carbs);
    const fats = parseFloat(fat);

    if (isNaN(cals) || cals < 0) {
      setError('Las calorías deben ser un número válido');
      return;
    }

    if (isNaN(prot) || prot < 0 || isNaN(carb) || carb < 0 || isNaN(fats) || fats < 0) {
      setError('Los macronutrientes deben ser números válidos');
      return;
    }

    // Crear ingrediente
    const newIngredient: Ingredient = {
      id: `custom_ing_${Date.now()}`,
      name: name.trim(),
      calories: cals,
      protein: prot,
      carbs: carb,
      fat: fats,
      isCustom: true
    };

    saveCustomIngredient(newIngredient);
    onCreated();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Crear Ingrediente</h1>
        </div>
        <p className="text-blue-100 text-sm ml-12">
          Añade ingredientes personalizados a tu base de datos
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 mb-1 font-medium">
                Valores por 100g
              </p>
              <p className="text-xs text-blue-700">
                Introduce los valores nutricionales por cada 100 gramos del ingrediente. Puedes encontrar esta información en el etiquetado del producto.
              </p>
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <label className="block mb-2 text-sm font-medium text-neutral-700">
            Nombre del Ingrediente
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pechuga de pollo, Arroz integral..."
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        {/* Calorías */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <label className="block mb-2 text-sm font-medium text-neutral-700">
            Calorías (kcal por 100g)
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="Ej: 165"
            min="0"
            step="0.1"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        {/* Macronutrientes */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
          <h3 className="mb-4 font-medium">Macronutrientes (por 100g)</h3>
          
          <div className="space-y-4">
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
                placeholder="Ej: 31"
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
                placeholder="Ej: 0"
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
                placeholder="Ej: 3.6"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botón Crear */}
        <button
          onClick={handleCreate}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Crear Ingrediente</span>
        </button>
      </div>
    </div>
  );
}
