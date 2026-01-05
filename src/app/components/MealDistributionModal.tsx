import { X, Calendar, Info, Sun, Sunset, Coffee as CoffeeIcon, Moon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { MealDistribution, MealType } from '../types';
import { getActiveMealTypes } from '../utils/mealDistribution';

interface MealDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDistribution?: MealDistribution;
  onSave: (distribution: MealDistribution) => void;
  mealsPerDay?: number; // NUEVO: Número de comidas del usuario
  totalCalories?: number; // NUEVO: Total de calorías diarias del usuario
}

// Función para generar presets dinámicos según número de comidas
function generatePresets(mealsPerDay: number) {
  const activeMeals = getActiveMealTypes(mealsPerDay);
  
  if (mealsPerDay === 3) {
    // 3 comidas: breakfast, lunch, dinner
    return {
      balanced: {
        name: 'Equilibrado',
        description: 'Distribución uniforme',
        icon: '⚖️',
        distribution: { breakfast: 30, lunch: 40, snack: 0, dinner: 30 }
      },
      morningHeavy: {
        name: 'Fuerte en Mañana',
        description: 'Desayuno abundante',
        icon: '🌅',
        distribution: { breakfast: 40, lunch: 35, snack: 0, dinner: 25 }
      },
      eveningHeavy: {
        name: 'Fuerte en Tarde',
        description: 'Cena abundante',
        icon: '🌙',
        distribution: { breakfast: 25, lunch: 35, snack: 0, dinner: 40 }
      },
      lunchFocused: {
        name: 'Comida Principal',
        description: 'La comida es el plato fuerte',
        icon: '🍽️',
        distribution: { breakfast: 25, lunch: 50, snack: 0, dinner: 25 }
      }
    };
  } else if (mealsPerDay === 4) {
    // 4 comidas: breakfast, lunch, snack, dinner
    return {
      balanced: {
        name: 'Equilibrado',
        description: 'Distribución uniforme',
        icon: '⚖️',
        distribution: { breakfast: 25, lunch: 35, snack: 10, dinner: 30 }
      },
      morningHeavy: {
        name: 'Fuerte en Mañana',
        description: 'Metabolismo matutino',
        icon: '🌅',
        distribution: { breakfast: 35, lunch: 30, snack: 15, dinner: 20 }
      },
      eveningHeavy: {
        name: 'Fuerte en Tarde',
        description: 'Para entrenar tarde',
        icon: '🌙',
        distribution: { breakfast: 20, lunch: 30, snack: 15, dinner: 35 }
      },
      lunchFocused: {
        name: 'Comida Principal',
        description: 'La comida es el plato fuerte',
        icon: '🍽️',
        distribution: { breakfast: 20, lunch: 40, snack: 10, dinner: 30 }
      }
    };
  } else {
    // Por defecto (2 o 5+ comidas)
    return {
      balanced: {
        name: 'Equilibrado',
        description: 'Distribución uniforme',
        icon: '⚖️',
        distribution: { breakfast: 25, lunch: 35, snack: 10, dinner: 30 }
      }
    };
  }
}

// Configuración de comidas para renderizar
const MEAL_CONFIG = [
  {
    key: 'breakfast' as keyof MealDistribution,
    name: 'Desayuno',
    icon: Sun,
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    color: 'text-amber-600',
    accent: 'accent-amber-600',
    bg: 'bg-amber-200'
  },
  {
    key: 'lunch' as keyof MealDistribution,
    name: 'Comida',
    icon: Sunset,
    gradient: 'from-red-50 to-orange-50',
    border: 'border-red-200',
    color: 'text-red-600',
    accent: 'accent-red-600',
    bg: 'bg-red-200'
  },
  {
    key: 'snack' as keyof MealDistribution,
    name: 'Merienda',
    icon: CoffeeIcon,
    gradient: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    color: 'text-green-600',
    accent: 'accent-green-600',
    bg: 'bg-green-200'
  },
  {
    key: 'dinner' as keyof MealDistribution,
    name: 'Cena',
    icon: Moon,
    gradient: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-200',
    color: 'text-indigo-600',
    accent: 'accent-indigo-600',
    bg: 'bg-indigo-200'
  }
];

export default function MealDistributionModal({
  isOpen,
  onClose,
  currentDistribution,
  onSave,
  mealsPerDay = 3,
  totalCalories = 2000
}: MealDistributionModalProps) {
  // Generar presets dinámicamente según número de comidas
  const DISTRIBUTION_PRESETS = useMemo(() => generatePresets(mealsPerDay), [mealsPerDay]);
  
  // Obtener comidas activas
  const activeMealTypes = useMemo(() => getActiveMealTypes(mealsPerDay), [mealsPerDay]);
  
  // Distribución por defecto: equilibrada
  const [distribution, setDistribution] = useState<MealDistribution>(() => 
    currentDistribution || generatePresets(mealsPerDay).balanced.distribution
  );
  
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // NUEVO: Calcular calorías para cada comida
  const calculateCalories = (percentage: number) => {
    return Math.round((percentage / 100) * totalCalories);
  };
  
  // Sincronizar con la distribución actual cuando cambia
  useEffect(() => {
    if (currentDistribution) {
      setDistribution(currentDistribution);
      // Detectar qué preset coincide
      const matchingPreset = Object.entries(DISTRIBUTION_PRESETS).find(([_, preset]) => 
        preset.distribution.breakfast === currentDistribution.breakfast &&
        preset.distribution.lunch === currentDistribution.lunch &&
        preset.distribution.snack === currentDistribution.snack &&
        preset.distribution.dinner === currentDistribution.dinner
      );
      setSelectedPreset(matchingPreset ? matchingPreset[0] : null);
    }
  }, [currentDistribution, DISTRIBUTION_PRESETS]);
  
  // Calcular el total actual (solo comidas activas)
  const total = useMemo(() => {
    return activeMealTypes.reduce((sum, mealType) => {
      return sum + distribution[mealType];
    }, 0);
  }, [distribution, activeMealTypes]);
  
  const isValidTotal = total === 100;
  
  // Aplicar preset
  const applyPreset = (presetKey: string) => {
    const preset = DISTRIBUTION_PRESETS[presetKey as keyof typeof DISTRIBUTION_PRESETS];
    setDistribution(preset.distribution);
    setSelectedPreset(presetKey);
  };
  
  // Actualizar un valor individual
  const updateValue = (meal: keyof MealDistribution, value: number) => {
    setDistribution(prev => ({
      ...prev,
      [meal]: Math.max(0, Math.min(100, value))
    }));
    setSelectedPreset(null); // Desmarcar preset al editar manualmente
  };
  
  // Normalizar valores para que sumen 100 (solo comidas activas)
  const normalize = () => {
    const currentTotal = activeMealTypes.reduce((sum, mealType) => {
      return sum + distribution[mealType];
    }, 0);
    
    if (currentTotal === 0) return;
    
    const factor = 100 / currentTotal;
    const newDistribution = { ...distribution };
    
    activeMealTypes.forEach(mealType => {
      newDistribution[mealType] = Math.round(distribution[mealType] * factor);
    });
    
    setDistribution(newDistribution);
  };
  
  const handleSave = () => {
    if (isValidTotal) {
      onSave(distribution);
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // Filtrar solo las comidas activas para mostrar
  const activeMealConfigs = MEAL_CONFIG.filter(config => 
    activeMealTypes.includes(config.key as MealType)
  );
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Distribución de Calorías</h2>
                <p className="text-emerald-100 text-sm mt-1">{mealsPerDay} comidas al día</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 leading-relaxed">
                Ajusta cómo quieres distribuir tus calorías diarias entre las <strong>{mealsPerDay} comidas</strong>. 
                Los porcentajes deben sumar <strong>100%</strong>.
              </p>
            </div>
          </div>
          
          {/* Presets */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Plantillas Recomendadas</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DISTRIBUTION_PRESETS).map(([key, preset]) => {
                // Calcular calorías para cada comida activa del preset
                const presetCalories = activeMealTypes.map(mealType => ({
                  type: mealType,
                  percentage: preset.distribution[mealType],
                  calories: calculateCalories(preset.distribution[mealType])
                })).filter(item => item.percentage > 0);

                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selectedPreset === key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{preset.icon}</div>
                    <p className="text-sm font-medium text-neutral-800">{preset.name}</p>
                    <p className="text-xs text-neutral-500 mt-1 mb-2">{preset.description}</p>
                    {/* Mostrar calorías por comida */}
                    <div className="space-y-0.5 mt-2 pt-2 border-t border-neutral-200">
                      {presetCalories.map(({ type, percentage, calories }) => (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="text-neutral-600">
                            {type === 'breakfast' ? '🌅' : type === 'lunch' ? '🍽️' : type === 'snack' ? '🍎' : '🌙'}
                          </span>
                          <span className="font-medium text-neutral-700">{calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Custom Distribution - Solo comidas activas */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Distribución Personalizada</h3>
            <div className="space-y-3">
              {activeMealConfigs.map((config) => {
                const Icon = config.icon;
                const calories = calculateCalories(distribution[config.key]);
                return (
                  <div key={config.key} className={`bg-gradient-to-r ${config.gradient} border ${config.border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm font-medium text-neutral-800">{config.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${config.color}`}>{calories} kcal</span>
                        <span className={`text-lg font-bold ${config.color}`}>({distribution[config.key]}%)</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={distribution[config.key]}
                      onChange={(e) => updateValue(config.key, parseInt(e.target.value))}
                      className={`w-full h-2 ${config.bg} rounded-lg appearance-none cursor-pointer ${config.accent}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Total Indicator */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${
            isValidTotal 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Total:</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  isValidTotal ? 'text-green-600' : 'text-red-600'
                }`}>
                  {total}%
                </span>
                {isValidTotal ? (
                  <span className="text-green-600 text-xl">✓</span>
                ) : (
                  <span className="text-red-600 text-xl">✗</span>
                )}
              </div>
            </div>
            {!isValidTotal && (
              <button
                onClick={normalize}
                className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Ajustar a 100%
              </button>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidTotal}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                isValidTotal
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}