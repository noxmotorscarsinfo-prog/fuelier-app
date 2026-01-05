import { useState } from 'react';
import { Calendar, Sun, Sunset, Coffee, Moon, ArrowRight } from 'lucide-react';
import { MealDistribution } from '../../types';

interface QuestionDistributionProps {
  onComplete: (distribution: MealDistribution) => void;
}

// Presets de distribución
const PRESETS = {
  balanced: {
    name: 'Equilibrado',
    description: 'Distribución uniforme durante el día',
    icon: '⚖️',
    distribution: { breakfast: 25, lunch: 35, snack: 10, dinner: 30 }
  },
  morningHeavy: {
    name: 'Fuerte en Mañana',
    description: 'Ideal para metabolismo matutino',
    icon: '🌅',
    distribution: { breakfast: 35, lunch: 30, snack: 15, dinner: 20 }
  },
  eveningHeavy: {
    name: 'Fuerte en Tarde',
    description: 'Para quienes entrenan por la tarde',
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

export default function QuestionDistribution({ onComplete }: QuestionDistributionProps) {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('balanced');
  
  const handleContinue = () => {
    const distribution = PRESETS[selectedPreset].distribution;
    onComplete(distribution);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl text-neutral-800 mb-3">
            ¿Cómo prefieres distribuir tus calorías?
          </h1>
          <p className="text-neutral-600">
            Selecciona cómo quieres repartir tu energía durante el día
          </p>
        </div>
        
        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedPreset(key as keyof typeof PRESETS)}
              className={`text-left p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                selectedPreset === key
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                  : 'border-neutral-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{preset.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {preset.description}
                  </p>
                </div>
                {selectedPreset === key && (
                  <div className="bg-emerald-500 text-white rounded-full p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Mini Distribution Preview */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="bg-amber-50 rounded-lg p-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-600 mx-auto" />
                  </div>
                  <p className="text-xs font-medium text-neutral-700">{preset.distribution.breakfast}%</p>
                </div>
                <div className="text-center">
                  <div className="bg-red-50 rounded-lg p-2 mb-1">
                    <Sunset className="w-4 h-4 text-red-600 mx-auto" />
                  </div>
                  <p className="text-xs font-medium text-neutral-700">{preset.distribution.lunch}%</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-50 rounded-lg p-2 mb-1">
                    <Coffee className="w-4 h-4 text-green-600 mx-auto" />
                  </div>
                  <p className="text-xs font-medium text-neutral-700">{preset.distribution.snack}%</p>
                </div>
                <div className="text-center">
                  <div className="bg-indigo-50 rounded-lg p-2 mb-1">
                    <Moon className="w-4 h-4 text-indigo-600 mx-auto" />
                  </div>
                  <p className="text-xs font-medium text-neutral-700">{preset.distribution.dinner}%</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> No te preocupes, podrás cambiar esto más tarde desde el Dashboard cuando quieras.
          </p>
        </div>
        
        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg font-medium"
        >
          <span>Continuar</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
