import { useState, useMemo } from 'react';
import { ChevronRight, UtensilsCrossed } from 'lucide-react';
import { MacroGoals } from '../types';
import { generateMacroOptions, macroOptionToGoals, MacroOption } from '../utils/macroOptions';
import MacroOptionsSelector from './MacroOptionsSelector';

interface OnboardingGoalsProps {
  userName: string;
  sex: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  trainingFrequency: number;
  onComplete: (
    goals: MacroGoals, 
    mealsPerDay: number, 
    goalType: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain',
    selectedMacroOption: MacroOption['level']
  ) => void;
}

export default function OnboardingGoals({ 
  userName,
  sex,
  age,
  weight, 
  height, 
  trainingFrequency,
  onComplete 
}: OnboardingGoalsProps) {
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [selectedOption, setSelectedOption] = useState<MacroOption | null>(null);

  // Generar las 5 opciones automáticas
  const options = useMemo(() => {
    return generateMacroOptions(sex, weight, height, age, trainingFrequency);
  }, [sex, weight, height, age, trainingFrequency]);

  // Seleccionar automáticamente la opción de mantenimiento por defecto
  useMemo(() => {
    if (!selectedOption && options.length > 0) {
      const maintenanceOption = options.find(opt => opt.level === 'moderate-low');
      setSelectedOption(maintenanceOption || options[0]);
    }
  }, [options]);

  const handleComplete = () => {
    if (!selectedOption) return;

    // Mapear el nivel de la opción a goalType
    const goalTypeMapping: Record<MacroOption['level'], 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'> = {
      'maintenance': 'maintenance',
      'light': 'moderate_loss',
      'moderate-low': 'moderate_loss',
      'moderate-high': 'rapid_loss',
      'aggressive': 'rapid_loss'
    };

    const goalType = goalTypeMapping[selectedOption.level];
    const goals = macroOptionToGoals(selectedOption);

    onComplete(goals, mealsPerDay, goalType, selectedOption.level);
  };

  const mealOptions = [
    { value: 2, label: '2 comidas', description: 'Ayuno intermitente' },
    { value: 3, label: '3 comidas', description: 'Clásico y flexible' },
    { value: 4, label: '4 comidas', description: 'Equilibrado' },
    { value: 5, label: '5 comidas', description: 'Frecuente' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 sm:px-6 pt-10 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">🎯 Elige tu Plan Nutricional</h1>
        <p className="text-emerald-100 text-sm sm:text-base">
          Hola <strong>{userName}</strong>, estas son tus opciones basadas en ciencia real
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Macro Options Selector */}
        <div>
          <h2 className="text-lg font-bold text-neutral-800 mb-4">
            Selecciona tu Opción de Calorías y Macros
          </h2>
          <MacroOptionsSelector
            options={options}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            sex={sex}
            weight={weight}
            height={height}
            age={age}
            trainingFrequency={trainingFrequency}
          />
        </div>

        {/* Meals Per Day Selector */}
        <div>
          <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            ¿Cuántas comidas al día prefieres?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mealOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMealsPerDay(option.value)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  mealsPerDay === option.value
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <p className="text-2xl font-bold text-neutral-800 mb-1">{option.value}</p>
                <p className="text-xs text-neutral-600">{option.label}</p>
                <p className="text-[10px] text-neutral-500 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3 text-center">
            💡 Esto afecta cómo distribuimos tus calorías durante el día. Puedes cambiarlo después.
          </p>
        </div>

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          disabled={!selectedOption}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
            selectedOption
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-95'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          Continuar
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
