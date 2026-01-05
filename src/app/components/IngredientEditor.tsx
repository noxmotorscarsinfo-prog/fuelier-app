import { useState } from 'react';
import { Plus, Minus, Trash2, Save, X, Search } from 'lucide-react';
import { MealIngredient } from '../types';
import { getIngredients, getIngredientById } from '../data/ingredients';

interface IngredientEditorProps {
  initialIngredients: MealIngredient[];
  onSave: (ingredients: MealIngredient[], totals: { calories: number; protein: number; carbs: number; fat: number }) => void;
  onCancel: () => void;
  onChange?: (ingredients: MealIngredient[], totals: { calories: number; protein: number; carbs: number; fat: number }) => void; // NUEVO: callback para tiempo real
}

export default function IngredientEditor({ initialIngredients, onSave, onCancel, onChange }: IngredientEditorProps) {
  const [editedIngredients, setEditedIngredients] = useState<MealIngredient[]>(initialIngredients);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allIngredients = getIngredients();
  const filteredIngredients = allIngredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular totales
  const totals = editedIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddIngredient = (ingredientId: string, ingredientName: string) => {
    const ingredient = allIngredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return;

    const amount = 100;
    const newIngredient: MealIngredient = {
      ingredientId,
      ingredientName,
      amount,
      calories: (ingredient.calories * amount) / 100,
      protein: (ingredient.protein * amount) / 100,
      carbs: (ingredient.carbs * amount) / 100,
      fat: (ingredient.fat * amount) / 100
    };

    const updatedIngredients = [...editedIngredients, newIngredient];
    setEditedIngredients(updatedIngredients);
    setShowIngredientPicker(false);
    setSearchTerm('');
    
    // NUEVO: Notificar cambio en tiempo real
    if (onChange) {
      const newTotals = updatedIngredients.reduce(
        (acc, ing) => ({
          calories: acc.calories + ing.calories,
          protein: acc.protein + ing.protein,
          carbs: acc.carbs + ing.carbs,
          fat: acc.fat + ing.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      onChange(updatedIngredients, newTotals);
    }
  };

  const handleUpdateIngredientAmount = (index: number, newAmount: number) => {
    const currentIngredient = editedIngredients[index];
    
    // IMPORTANTE: NO recalcular desde la base de datos
    // Mantener las proporciones del ingrediente original
    // Si el ingrediente tenía 150g con 225 kcal, y ahora tiene 200g, debe tener 300 kcal
    
    const oldAmount = currentIngredient.amount;
    if (oldAmount === 0) return; // Evitar división por cero
    
    const ratio = newAmount / oldAmount;
    
    const updated = [...editedIngredients];
    updated[index] = {
      ...updated[index],
      amount: newAmount,
      calories: currentIngredient.calories * ratio,
      protein: currentIngredient.protein * ratio,
      carbs: currentIngredient.carbs * ratio,
      fat: currentIngredient.fat * ratio
    };

    setEditedIngredients(updated);
    
    // NUEVO: Notificar cambio en tiempo real
    if (onChange) {
      const newTotals = updated.reduce(
        (acc, ing) => ({
          calories: acc.calories + ing.calories,
          protein: acc.protein + ing.protein,
          carbs: acc.carbs + ing.carbs,
          fat: acc.fat + ing.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      onChange(updated, newTotals);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = editedIngredients.filter((_, i) => i !== index);
    setEditedIngredients(updatedIngredients);
    
    // NUEVO: Notificar cambio en tiempo real
    if (onChange) {
      const newTotals = updatedIngredients.reduce(
        (acc, ing) => ({
          calories: acc.calories + ing.calories,
          protein: acc.protein + ing.protein,
          carbs: acc.carbs + ing.carbs,
          fat: acc.fat + ing.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      onChange(updatedIngredients, newTotals);
    }
  };

  const handleSave = () => {
    onSave(editedIngredients, totals);
  };

  return (
    <div className="space-y-6">
      {/* Ingredientes en Edición */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2">
            <span>✏️</span>
            <span>Editar Ingredientes</span>
          </h3>
          <button
            onClick={() => setShowIngredientPicker(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>

        {editedIngredients.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-sm">No hay ingredientes. Añade algunos para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {editedIngredients.map((ing, index) => (
              <div key={index} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">{ing.ingredientName}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateIngredientAmount(index, Math.max(0, ing.amount - 10))}
                        className="bg-white border border-neutral-300 p-1.5 rounded-lg hover:bg-neutral-100 transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={ing.amount}
                        onChange={(e) => handleUpdateIngredientAmount(index, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="5"
                        className="w-20 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-center"
                      />
                      <span className="text-sm text-neutral-500 min-w-[50px]">gramos</span>
                      <button
                        onClick={() => handleUpdateIngredientAmount(index, ing.amount + 10)}
                        className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <p className="text-red-600 font-medium">{Math.round(ing.calories)}</p>
                    <p className="text-neutral-500">kcal</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-blue-600 font-medium">{Math.round(ing.protein)}g</p>
                    <p className="text-neutral-500">Prot</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <p className="text-amber-600 font-medium">{Math.round(ing.carbs)}g</p>
                    <p className="text-neutral-500">Carb</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <p className="text-orange-600 font-medium">{Math.round(ing.fat)}g</p>
                    <p className="text-neutral-500">Grasa</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totales Recalculados */}
      {editedIngredients.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 border-2 border-emerald-300">
          <h3 className="mb-4 flex items-center gap-2 text-emerald-800">
            <span>📊</span>
            <span>Nuevos Totales</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-sm text-neutral-600 mb-1">Calorías</p>
              <p className="text-2xl text-red-600 font-medium">{Math.round(totals.calories)}</p>
              <p className="text-xs text-neutral-500">kcal</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-sm text-neutral-600 mb-1">Proteína</p>
              <p className="text-2xl text-blue-600 font-medium">{Math.round(totals.protein)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-sm text-neutral-600 mb-1">Carbohidratos</p>
              <p className="text-2xl text-amber-600 font-medium">{Math.round(totals.carbs)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-sm text-neutral-600 mb-1">Grasas</p>
              <p className="text-2xl text-orange-600 font-medium">{Math.round(totals.fat)}</p>
              <p className="text-xs text-neutral-500">gramos</p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-xl hover:bg-neutral-200 transition-all font-medium flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={editedIngredients.length === 0}
        >
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>

      {/* Ingredient Picker Modal */}
      {showIngredientPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Añadir Ingrediente</h3>
                <button
                  onClick={() => {
                    setShowIngredientPicker(false);
                    setSearchTerm('');
                  }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ingrediente..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredIngredients.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => handleAddIngredient(ing.id, ing.name)}
                    className="w-full bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 rounded-xl p-4 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-800">{ing.name}</h4>
                        {ing.isCustom && (
                          <span className="text-xs text-emerald-600 mt-1 inline-block">✨ Personalizado</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 text-right">
                        <div>{ing.calories} kcal</div>
                        <div className="text-neutral-400">por 100g</div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredIngredients.length === 0 && (
                  <p className="text-center text-neutral-400 py-8">
                    No se encontraron ingredientes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}