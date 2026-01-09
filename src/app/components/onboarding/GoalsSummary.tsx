import { useState } from 'react';
import { Target, ChevronRight, Info, Flame, Beef, Wheat, Droplet, Zap, Sliders, UtensilsCrossed } from 'lucide-react';
import { MacroGoals } from '../../types';
import { calculateAllGoals, generateExplanations, GoalType, mapInternalGoalToUserGoal } from '../../utils/macroCalculations';

interface GoalsSummaryProps {
  sex: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  trainingFrequency: number;
  onComplete: (goals: MacroGoals, mealsPerDay: number, goalType: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain') => void;
}

export default function GoalsSummary({ 
  sex,
  age,
  weight, 
  height, 
  trainingFrequency,
  onComplete 
}: GoalsSummaryProps) {
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType>('maintenance');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customCalories, setCustomCalories] = useState(0);
  const [customProtein, setCustomProtein] = useState(0);
  const [customCarbs, setCustomCarbs] = useState(0);
  const [customFat, setCustomFat] = useState(0);
  const [mealsPerDay, setMealsPerDay] = useState(3); // NUEVO: Estado para comidas al día

  // Calcular todos los objetivos posibles CON LA EDAD
  const calculations = calculateAllGoals(sex, weight, height, trainingFrequency, age);
  const { bmr, tdee, goals } = calculations;
  
  console.log('🎯 GoalsSummary - Datos recibidos:');
  console.log('sex:', sex);
  console.log('age:', age);
  console.log('weight:', weight);
  console.log('height:', height);
  console.log('trainingFrequency:', trainingFrequency);
  console.log('calculations:', calculations);
  console.log('bmr:', bmr);
  console.log('tdee:', tdee);
  console.log('goals:', goals);
  console.log('goals.length:', goals.length);

  // Obtener el objetivo seleccionado
  const selectedGoal = goals.find(g => g.type === selectedGoalType)!;
  const currentMacros = isCustomizing 
    ? { calories: customCalories, protein: customProtein, carbs: customCarbs, fat: customFat }
    : selectedGoal.macros;

  // Inicializar valores custom cuando se activa
  const handleToggleCustomize = () => {
    if (!isCustomizing) {
      setCustomCalories(selectedGoal.macros.calories);
      setCustomProtein(selectedGoal.macros.protein);
      setCustomCarbs(selectedGoal.macros.carbs);
      setCustomFat(selectedGoal.macros.fat);
    }
    setIsCustomizing(!isCustomizing);
  };

  const handleContinue = () => {
    // Mapear el tipo de objetivo interno (GoalType) al objetivo del usuario
    const userGoal = mapInternalGoalToUserGoal(selectedGoalType);
    onComplete(currentMacros, mealsPerDay, userGoal); // Usar el número de comidas seleccionado
  };

  const explanations = generateExplanations(
    sex,
    weight,
    height,
    trainingFrequency,
    selectedGoalType,
    currentMacros,
    tdee
  );

  // Calcular totales de macros custom
  const totalCustomCalories = (customProtein * 4) + (customCarbs * 4) + (customFat * 9);
  const caloriesDifference = customCalories - totalCustomCalories;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-6 sm:pb-8">
      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3">Tus Objetivos</h1>
          <p className="text-sm sm:text-base text-neutral-500">Calculados científicamente para ti</p>
        </div>

        {/* TDEE Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm mb-1">Tu Metabolismo</p>
              <p className="text-[10px] sm:text-xs text-emerald-200">
                {sex === 'female' ? '♀️ Mujer' : '♂️ Hombre'} • {weight}kg • {height}cm
              </p>
            </div>
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-200" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <p className="text-emerald-100 text-[10px] sm:text-xs mb-1">TMB (Basal)</p>
              <p className="text-xl sm:text-2xl font-bold">{bmr}</p>
              <p className="text-[10px] sm:text-xs text-emerald-200">kcal/día</p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <p className="text-emerald-100 text-[10px] sm:text-xs mb-1">TDEE (Total)</p>
              <p className="text-xl sm:text-2xl font-bold">{tdee}</p>
              <p className="text-[10px] sm:text-xs text-emerald-200">kcal/día</p>
            </div>
          </div>

          <div className="mt-3 bg-white/10 rounded-lg sm:rounded-xl p-2 text-[10px] sm:text-xs text-emerald-100 text-center">
            {trainingFrequency === 0 ? '🛋️ Sedentario' : 
             trainingFrequency <= 2 ? `🚶 ${trainingFrequency} días/semana` :
             trainingFrequency <= 4 ? `🏃 ${trainingFrequency} días/semana` :
             `💪 ${trainingFrequency} días/semana (muy activo)`}
          </div>
        </div>

        {/* Goal Selection */}
        <div className="mb-5 sm:mb-6">
          <h3 className="mb-3 text-sm sm:text-base font-semibold text-neutral-700">Selecciona tu Objetivo</h3>
          <div className="space-y-2">
            {goals.map((goal) => {
              const isSelected = selectedGoalType === goal.type;
              const diff = goal.calories - tdee;
              const diffText = diff > 0 ? `+${diff}` : diff;
              
              return (
                <button
                  key={goal.type}
                  onClick={() => {
                    setSelectedGoalType(goal.type);
                    setIsCustomizing(false);
                  }}
                  className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-xl sm:text-2xl flex-shrink-0">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-emerald-700' : 'text-neutral-800'}`}>
                        {goal.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-neutral-500 leading-tight">{goal.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg sm:text-xl font-bold ${isSelected ? 'text-emerald-600' : 'text-neutral-600'}`}>
                        {goal.calories}
                      </p>
                      <p className="text-[10px] sm:text-xs text-neutral-400">
                        {diffText} kcal
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      <p className="text-[10px] sm:text-xs text-emerald-700 leading-relaxed">💡 {goal.recommendation}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customize Toggle */}
        <div className="mb-5 sm:mb-6">
          <button
            onClick={handleToggleCustomize}
            className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-2 sm:gap-3 active:scale-[0.98] ${
              isCustomizing
                ? 'border-blue-500 bg-blue-50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className={`p-2 rounded-lg sm:rounded-xl ${isCustomizing ? 'bg-blue-500' : 'bg-neutral-100'} flex-shrink-0`}>
              <Sliders className={`w-4 h-4 sm:w-5 sm:h-5 ${isCustomizing ? 'text-white' : 'text-neutral-600'}`} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Personalizar Manualmente</h4>
              <p className="text-[10px] sm:text-xs text-neutral-500">Ajusta los valores con precisión</p>
            </div>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              isCustomizing ? 'border-blue-500 bg-blue-500' : 'border-neutral-300'
            }`}>
              {isCustomizing && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>
        </div>

        {/* Macros Display/Editor */}
        {isCustomizing ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-200 mb-5 sm:mb-6">
            <h3 className="mb-4 text-sm sm:text-base font-semibold text-neutral-700 flex items-center gap-2">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span>Ajuste Personalizado</span>
            </h3>
            
            <div className="space-y-4 sm:space-y-5">
              {/* Calorías */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5 sm:gap-2">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Calorías Totales
                  </label>
                  <span className="text-sm sm:text-base text-emerald-600 font-semibold">{customCalories} kcal</span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="4000"
                  step="50"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(Number(e.target.value))}
                  className="w-full h-2.5 sm:h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 mt-1">
                  <span>1200</span>
                  <span>4000</span>
                </div>
              </div>

              {/* Proteína */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5 sm:gap-2">
                    <Beef className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    Proteína
                  </label>
                  <span className="text-sm sm:text-base text-blue-600 font-semibold">
                    {customProtein}g ({(customProtein / weight).toFixed(1)}g/kg)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="5"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(Number(e.target.value))}
                  className="w-full h-2.5 sm:h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 mt-1">
                  <span>50g</span>
                  <span>350g</span>
                </div>
              </div>

              {/* Carbohidratos */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5 sm:gap-2">
                    <Wheat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                    Carbohidratos
                  </label>
                  <span className="text-sm sm:text-base text-amber-600 font-semibold">{customCarbs}g</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(Number(e.target.value))}
                  className="w-full h-2.5 sm:h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 mt-1">
                  <span>50g</span>
                  <span>600g</span>
                </div>
              </div>

              {/* Grasas */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5 sm:gap-2">
                    <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                    Grasas
                  </label>
                  <span className="text-sm sm:text-base text-orange-600 font-semibold">{customFat}g</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={customFat}
                  onChange={(e) => setCustomFat(Number(e.target.value))}
                  className="w-full h-2.5 sm:h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-neutral-400 mt-1">
                  <span>30g</span>
                  <span>200g</span>
                </div>
              </div>

              {/* Validation */}
              {Math.abs(caloriesDifference) > 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-amber-800 leading-relaxed">
                    ⚠️ Los macros suman {totalCustomCalories} kcal, pero estableciste {customCalories} kcal como objetivo. 
                    Diferencia: {caloriesDifference > 0 ? '+' : ''}{caloriesDifference} kcal
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-200 mb-5 sm:mb-6">
            <h3 className="mb-4 text-sm sm:text-base font-semibold text-neutral-700">Distribución de Macros</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                <Beef className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{currentMacros.protein}g</p>
                <p className="text-[10px] sm:text-xs text-neutral-500">Proteína</p>
                <p className="text-[10px] sm:text-xs text-blue-600 mt-1 font-medium">
                  {(currentMacros.protein / weight).toFixed(1)}g/kg
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg sm:rounded-xl">
                <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">{currentMacros.carbs}g</p>
                <p className="text-[10px] sm:text-xs text-neutral-500">Carbohidratos</p>
                <p className="text-[10px] sm:text-xs text-amber-600 mt-1 font-medium">
                  {Math.round((currentMacros.carbs * 4 / currentMacros.calories) * 100)}%
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg sm:rounded-xl">
                <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">{currentMacros.fat}g</p>
                <p className="text-[10px] sm:text-xs text-neutral-500">Grasas</p>
                <p className="text-[10px] sm:text-xs text-orange-600 mt-1 font-medium">
                  {Math.round((currentMacros.fat * 9 / currentMacros.calories) * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Explanations */}
        <div className="mb-5 sm:mb-6">
          <h3 className="mb-3 text-sm sm:text-base font-semibold text-neutral-700 flex items-center gap-2">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <span>¿Por qué estos valores?</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {explanations.map((exp, idx) => (
              <div key={idx} className="bg-neutral-50 border border-neutral-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-neutral-800 mb-1.5 sm:mb-2">{exp.title}</h4>
                <p className="text-[10px] sm:text-xs text-neutral-600 leading-relaxed">{exp.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6">
          <p className="text-[10px] sm:text-xs text-blue-800 leading-relaxed">
            📊 <strong>Método científico:</strong> Usamos la fórmula Mifflin-St Jeor para calcular tu TMB (considerada la más precisa), 
            ajustada por tu nivel de actividad para obtener el TDEE. Los macros se optimizan según tu sexo, peso y objetivo específico.
          </p>
        </div>

        {/* NUEVO: Selector de Número de Comidas */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-200 mb-5 sm:mb-6">
          <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-neutral-700 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <span>¿Cuántas comidas harás al día?</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-neutral-500 mb-3 sm:mb-4 leading-relaxed">
            Selecciona el número de comidas que prefieres hacer al día. Tus macros se distribuirán automáticamente.
          </p>
          
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setMealsPerDay(num)}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-[0.95] ${
                  mealsPerDay === num
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="text-center">
                  <p className={`text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1 ${
                    mealsPerDay === num ? 'text-emerald-600' : 'text-neutral-400'
                  }`}>
                    {num}
                  </p>
                  <p className={`text-[10px] sm:text-xs leading-tight ${
                    mealsPerDay === num ? 'text-emerald-700 font-medium' : 'text-neutral-500'
                  }`}>
                    comida{num > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 sm:mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-emerald-800 leading-relaxed">
              💡 <strong>Tip:</strong> {
                mealsPerDay === 2 ? 'Ideal para ayuno intermitente o quienes prefieren pocas comidas grandes.' :
                mealsPerDay === 3 ? 'La opción clásica: desayuno, comida y cena.' :
                mealsPerDay === 4 ? 'Incluye una merienda o snack saludable entre comidas.' :
                '¡Perfecto para mantener tu metabolismo activo todo el día!'
              }
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-emerald-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg font-semibold text-base sm:text-lg"
        >
          <span>Continuar</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}