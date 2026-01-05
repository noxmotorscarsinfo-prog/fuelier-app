import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Complement, complements, getSuggestedComplements } from '../data/complements';

interface ComplementSelectorProps {
  deficit: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onAddComplement: (complement: Complement) => void;
  onClose: () => void;
}

export default function ComplementSelector({ deficit, onAddComplement, onClose }: ComplementSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'suggested' | 'protein' | 'carbs' | 'fat' | 'balanced'>('suggested');
  const [selectedComplement, setSelectedComplement] = useState<Complement | null>(null);
  const [amount, setAmount] = useState<number>(1); // Nueva: multiplicador de cantidad

  const suggestedComplements = getSuggestedComplements(deficit);

  const getComplementsByCategory = () => {
    if (selectedCategory === 'suggested') {
      return suggestedComplements;
    }
    return complements.filter(c => c.category === selectedCategory);
  };

  const handleSelectComplement = (complement: Complement) => {
    setSelectedComplement(complement);
    setAmount(1); // Reset amount when selecting new complement
  };

  const handleConfirm = () => {
    if (selectedComplement) {
      // Crear una copia del complemento con las cantidades ajustadas
      const adjustedComplement: Complement = {
        ...selectedComplement,
        amount: selectedComplement.amount * amount,
        calories: selectedComplement.calories * amount,
        protein: selectedComplement.protein * amount,
        carbs: selectedComplement.carbs * amount,
        fat: selectedComplement.fat * amount
      };
      onAddComplement(adjustedComplement);
      onClose();
    }
  };

  // Calcular qué tan bien encaja el complemento seleccionado con el déficit
  const getFitScore = (complement: Complement) => {
    if (!complement) return 0;
    
    const adjustedCals = complement.calories * amount;
    const adjustedProtein = complement.protein * amount;
    const adjustedCarbs = complement.carbs * amount;
    const adjustedFat = complement.fat * amount;
    
    // Si se pasa del déficit, es malo
    if (adjustedCals > deficit.calories * 1.3) return 1;
    if (adjustedProtein > deficit.protein * 1.3) return 1;
    
    // Si está cerca del déficit, es perfecto
    if (adjustedCals >= deficit.calories * 0.5 && adjustedCals <= deficit.calories * 1.1) return 3;
    
    // Si ayuda pero no es perfecto
    return 2;
  };

  const fitScore = selectedComplement ? getFitScore(selectedComplement) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-emerald-900">Añadir Complemento</h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-white rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-emerald-700">
            Complementa tu comida para alcanzar tus objetivos nutricionales
          </p>

          {/* Deficit Info */}
          <div className="mt-4 bg-white rounded-xl p-3 border border-emerald-200">
            <p className="text-xs text-neutral-600 mb-2">Te falta aproximadamente:</p>
            <div className="flex items-center gap-3 flex-wrap">
              {deficit.calories > 10 && (
                <div className="bg-red-50 px-2 py-1 rounded-lg">
                  <span className="text-xs text-red-700 font-medium">{Math.round(deficit.calories)} kcal</span>
                </div>
              )}
              {deficit.protein > 2 && (
                <div className="bg-blue-50 px-2 py-1 rounded-lg">
                  <span className="text-xs text-blue-700 font-medium">{Math.round(deficit.protein)}g proteína</span>
                </div>
              )}
              {deficit.carbs > 5 && (
                <div className="bg-amber-50 px-2 py-1 rounded-lg">
                  <span className="text-xs text-amber-700 font-medium">{Math.round(deficit.carbs)}g carbos</span>
                </div>
              )}
              {deficit.fat > 2 && (
                <div className="bg-orange-50 px-2 py-1 rounded-lg">
                  <span className="text-xs text-orange-700 font-medium">{Math.round(deficit.fat)}g grasas</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-neutral-200 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('suggested')}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              selectedCategory === 'suggested'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ✨ Sugeridos
          </button>
          <button
            onClick={() => setSelectedCategory('protein')}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              selectedCategory === 'protein'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            💪 Proteína
          </button>
          <button
            onClick={() => setSelectedCategory('carbs')}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              selectedCategory === 'carbs'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ⚡ Carbos
          </button>
          <button
            onClick={() => setSelectedCategory('fat')}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              selectedCategory === 'fat'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            🥑 Grasas
          </button>
          <button
            onClick={() => setSelectedCategory('balanced')}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
              selectedCategory === 'balanced'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ⚖️ Balanceado
          </button>
        </div>

        {/* Complements List */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedCategory === 'suggested' && suggestedComplements.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-sm">No hay sugerencias disponibles</p>
              <p className="text-xs mt-1">Explora las otras categorías</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {getComplementsByCategory().map(complement => (
                <button
                  key={complement.id}
                  onClick={() => handleSelectComplement(complement)}
                  className={`bg-neutral-50 hover:bg-emerald-50 border rounded-xl p-4 text-left transition-all ${
                    selectedComplement?.id === complement.id
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-neutral-200'
                  }`}
                >
                  {/* Emoji e icono de selección */}
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{complement.emoji}</span>
                    {selectedComplement?.id === complement.id && (
                      <div className="bg-emerald-600 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Nombre */}
                  <h4 className="font-medium text-neutral-800 text-sm mb-1">{complement.name}</h4>
                  
                  {/* Cantidad */}
                  <p className="text-xs text-neutral-500 mb-2">{complement.amount}g</p>

                  {/* Macros */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Calorías</span>
                      <span className="font-medium text-red-600">{complement.calories}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">P/C/G</span>
                      <span className="font-medium text-neutral-700">
                        {Math.round(complement.protein)}/{Math.round(complement.carbs)}/{Math.round(complement.fat)}g
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-neutral-500 mt-2 leading-tight">{complement.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Amount Control and Confirm Button */}
        <div className="p-4 border-t border-neutral-200 bg-white space-y-3">
          {/* Amount Control */}
          {selectedComplement && (
            <div className="bg-neutral-50 rounded-xl p-3">
              <p className="text-xs text-neutral-600 mb-2 text-center">Cantidad</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setAmount(Math.max(0.5, amount - 0.5))}
                  className="bg-white border-2 border-neutral-300 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-all active:scale-95 font-bold text-neutral-700"
                >
                  −
                </button>
                <div className="text-center min-w-[60px]">
                  <p className="text-2xl font-bold text-emerald-600">{amount}x</p>
                  <p className="text-xs text-neutral-500">{Math.round(selectedComplement.amount * amount)}g</p>
                </div>
                <button
                  onClick={() => setAmount(Math.min(5, amount + 0.5))}
                  className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95 font-bold"
                >
                  +
                </button>
              </div>
              
              {/* Preview de macros ajustados */}
              <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Kcal</p>
                  <p className="text-sm font-bold text-red-600">{Math.round(selectedComplement.calories * amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Prot</p>
                  <p className="text-sm font-bold text-blue-600">{Math.round(selectedComplement.protein * amount)}g</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Carbs</p>
                  <p className="text-sm font-bold text-amber-600">{Math.round(selectedComplement.carbs * amount)}g</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Grasas</p>
                  <p className="text-sm font-bold text-orange-600">{Math.round(selectedComplement.fat * amount)}g</p>
                </div>
              </div>

              {/* Fit Score Indicator */}
              {fitScore > 0 && (
                <div className={`mt-2 p-2 rounded-lg text-xs text-center ${
                  fitScore === 3 ? 'bg-green-100 text-green-800' :
                  fitScore === 2 ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {fitScore === 3 && '✅ ¡Perfecto para tu objetivo!'}
                  {fitScore === 2 && '👍 Buena opción'}
                  {fitScore === 1 && '⚠️ Excede tu déficit'}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedComplement}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">
              {selectedComplement ? `Añadir ${selectedComplement.name}` : 'Selecciona un complemento'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}