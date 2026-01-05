import { useState } from 'react';
import { Check, Zap, TrendingUp, Info, AlertTriangle, Target, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { MacroOption, formatWeeklyFatLoss, generateSafetyWarnings } from '../utils/macroOptions';
import { calculateBMR, calculateTDEE } from '../utils/macroCalculations';

interface MacroOptionsSelectorProps {
  options: MacroOption[];
  selectedOption: MacroOption | null;
  onSelectOption: (option: MacroOption) => void;
  sex: 'male' | 'female';
  weight: number;
  height: number;
  age: number;
  trainingFrequency: number;
}

export default function MacroOptionsSelector({
  options,
  selectedOption,
  onSelectOption,
  sex,
  weight,
  height,
  age,
  trainingFrequency
}: MacroOptionsSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  const bmr = calculateBMR(sex, weight, height, age);
  const tdee = calculateTDEE(bmr, trainingFrequency);

  const getLevelColor = (level: MacroOption['level']) => {
    const colors = {
      'maintenance': 'emerald',
      'light': 'green',
      'moderate-low': 'blue',
      'moderate-high': 'amber',
      'aggressive': 'red'
    };
    return colors[level];
  };

  const getLevelIcon = (level: MacroOption['level']) => {
    const icons = {
      'maintenance': Target,
      'light': TrendingUp,
      'moderate-low': Zap,
      'moderate-high': Flame,
      'aggressive': AlertTriangle
    };
    const Icon = icons[level];
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Info Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-indigo-900 mb-1">Tu TDEE: {tdee} kcal/día</h3>
            <p className="text-sm text-indigo-700">
              Basado en tu TMB ({Math.round(bmr)} kcal) y {trainingFrequency} días de entrenamiento/semana
            </p>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-indigo-600 hover:text-indigo-800 text-xs underline"
          >
            {showInfo ? 'Ocultar' : '¿Qué es?'}
          </button>
        </div>
        
        {showInfo && (
          <div className="mt-3 pt-3 border-t border-indigo-200 text-sm text-indigo-700">
            <p className="mb-2">
              <strong>TDEE (Total Daily Energy Expenditure):</strong> Es la cantidad total de calorías que tu cuerpo quema en un día, incluyendo tu metabolismo basal y tu actividad física.
            </p>
            <p>
              Selecciona la opción que mejor se adapte a tu objetivo y estilo de vida. Puedes cambiarla en cualquier momento desde Ajustes.
            </p>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption?.id === option.id;
          const color = getLevelColor(option.level);
          const warnings = generateSafetyWarnings(option, sex, tdee);
          
          return (
            <button
              key={option.id}
              onClick={() => onSelectOption(option)}
              className={`w-full text-left rounded-2xl p-4 sm:p-5 transition-all border-2 ${
                isSelected
                  ? `border-${color}-500 bg-gradient-to-br from-${color}-50 to-${color}-100 shadow-lg scale-[1.02]`
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isSelected ? `bg-${color}-500 text-white` : `bg-${color}-100 text-${color}-600`}`}>
                    {getLevelIcon(option.level)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isSelected ? `text-${color}-900` : 'text-neutral-800'}`}>
                      {option.name}
                    </h3>
                    <p className="text-sm text-neutral-600">{option.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className={`bg-${color}-500 text-white p-1.5 rounded-full`}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center bg-white/60 rounded-xl p-2">
                  <Flame className="w-4 h-4 text-red-500 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-neutral-800">{option.calories}</p>
                  <p className="text-[10px] text-neutral-500">kcal</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-2">
                  <Beef className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-neutral-800">{option.protein}g</p>
                  <p className="text-[10px] text-neutral-500">Prot</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-2">
                  <Wheat className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-neutral-800">{option.carbs}g</p>
                  <p className="text-[10px] text-neutral-500">Carb</p>
                </div>
                <div className="text-center bg-white/60 rounded-xl p-2">
                  <Droplet className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
                  <p className="text-xs font-bold text-neutral-800">{option.fat}g</p>
                  <p className="text-[10px] text-neutral-500">Grasa</p>
                </div>
              </div>

              {/* Stats */}
              <div className={`grid grid-cols-2 gap-2 mb-3 text-xs ${isSelected ? `text-${color}-700` : 'text-neutral-600'}`}>
                <div className="bg-white/60 rounded-lg p-2">
                  <span className="font-medium">Déficit:</span> {option.deficit > 0 ? `-${option.deficit}` : '0'} kcal/día
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <span className="font-medium">Pérdida:</span> {formatWeeklyFatLoss(option.weeklyFatLoss)}
                </div>
              </div>

              {/* Recommendation */}
              <p className={`text-xs ${isSelected ? `text-${color}-800` : 'text-neutral-600'} mb-2`}>
                💡 {option.recommendation}
              </p>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                  {warnings.map((warning, idx) => (
                    <p key={idx} className="text-xs text-amber-800 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </p>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
        <p className="text-xs text-neutral-600 text-center">
          ℹ️ Estas son <strong>estimaciones</strong> basadas en fórmulas científicas. Tu cuerpo es único y puede responder diferente. 
          Monitoriza tu progreso semanal y ajusta según tus resultados reales. Puedes cambiar tu opción en cualquier momento desde Ajustes.
        </p>
      </div>
    </div>
  );
}
