import { useState, useEffect } from 'react';
import { User, DailyLog, Meal, MealType } from '../types';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros, mapUserGoalToInternalGoal } from '../utils/macroCalculations';
import { getMealDistribution, getMealGoals, getActiveMealTypes, getAllMealGoals } from '../utils/mealDistribution';
import { calculateSimplePortion } from '../utils/simplePortionCalculator';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestProfile {
  name: string;
  profile: {
    sex: 'male' | 'female';
    age: number;
    weight: number;
    height: number;
    trainingFrequency: number;
    goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain';
    mealsPerDay: number;
  };
}

const testProfiles: TestProfile[] = [
  {
    name: 'Mujer - Pérdida de Peso - 3 comidas',
    profile: {
      sex: 'female',
      age: 28,
      weight: 65,
      height: 165,
      trainingFrequency: 3,
      goal: 'moderate_loss',
      mealsPerDay: 3
    }
  },
  {
    name: 'Hombre - Ganancia Muscular - 5 comidas',
    profile: {
      sex: 'male',
      age: 25,
      weight: 75,
      height: 178,
      trainingFrequency: 5,
      goal: 'moderate_gain',
      mealsPerDay: 5
    }
  },
  {
    name: 'Mujer - Mantenimiento - 4 comidas',
    profile: {
      sex: 'female',
      age: 32,
      weight: 58,
      height: 160,
      trainingFrequency: 4,
      goal: 'maintenance',
      mealsPerDay: 4
    }
  },
  {
    name: 'Hombre - Pérdida Rápida - 2 comidas',
    profile: {
      sex: 'male',
      age: 40,
      weight: 95,
      height: 180,
      trainingFrequency: 2,
      goal: 'rapid_loss',
      mealsPerDay: 2
    }
  }
];

const testMeals: Record<MealType, Meal[]> = {
  breakfast: [
    {
      id: 'test-breakfast-1',
      name: 'Tostadas con Aguacate',
      type: 'breakfast',
      calories: 420,
      protein: 18,
      carbs: 35,
      fat: 22,
      ingredients: ['Pan integral', 'Aguacate', 'Huevos'],
      baseQuantity: 100
    }
  ],
  lunch: [
    {
      id: 'test-lunch-1',
      name: 'Pollo con Arroz',
      type: 'lunch',
      calories: 550,
      protein: 45,
      carbs: 60,
      fat: 12,
      ingredients: ['Pechuga de pollo', 'Arroz'],
      baseQuantity: 100
    }
  ],
  snack: [
    {
      id: 'test-snack-1',
      name: 'Yogur con Frutos Secos',
      type: 'snack',
      calories: 280,
      protein: 18,
      carbs: 22,
      fat: 14,
      ingredients: ['Yogur griego', 'Almendras'],
      baseQuantity: 100
    }
  ],
  dinner: [
    {
      id: 'test-dinner-1',
      name: 'Pavo con Ensalada',
      type: 'dinner',
      calories: 380,
      protein: 40,
      carbs: 25,
      fat: 12,
      ingredients: ['Pechuga de pavo', 'Ensalada'],
      baseQuantity: 100
    }
  ]
};

function createTestUser(profile: TestProfile['profile']): User {
  const bmr = calculateBMR(profile.sex, profile.weight, profile.height, profile.age);
  const tdee = calculateTDEE(bmr, profile.trainingFrequency);
  const internalGoal = mapUserGoalToInternalGoal(profile.goal);
  const targetCalories = calculateTargetCalories(tdee, internalGoal);
  const macros = calculateMacros(targetCalories, profile.weight, profile.sex, internalGoal);

  return {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Usuario de Prueba',
    age: profile.age,
    sex: profile.sex,
    weight: profile.weight,
    height: profile.height,
    trainingFrequency: profile.trainingFrequency,
    goal: profile.goal,
    mealsPerDay: profile.mealsPerDay,
    goals: macros,
    preferences: {
      allergies: [],
      dislikes: [],
      dietType: 'balanced'
    },
    createdAt: new Date().toISOString()
  };
}

function createEmptyLog(): DailyLog {
  return {
    date: new Date().toISOString().split('T')[0],
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null,
    extraFoods: []
  };
}

export default function MacroDistributionTest({ onClose }: { onClose: () => void }) {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    runTests(selectedProfile);
  }, [selectedProfile]);

  const runTests = (profileIndex: number) => {
    try {
      const testCase = testProfiles[profileIndex];
      const user = createTestUser(testCase.profile);
      const { sex, age, weight, height, trainingFrequency, goal, mealsPerDay } = testCase.profile;

      const activeMealTypes = getActiveMealTypes(mealsPerDay);
      const mealDistribution = getMealDistribution(user);
      
      // Calcular porcentaje total
      let totalPercentage = 0;
      activeMealTypes.forEach(mealType => {
        totalPercentage += mealDistribution[mealType] * 100;
      });
      
      const percentageCheck = Math.abs(totalPercentage - 100) < 0.01;

      // Obtener objetivos de macros
      const allMealGoals = getAllMealGoals(user);
      
      let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      
      activeMealTypes.forEach(mealType => {
        const goals = allMealGoals[mealType];
        totalCals += goals.calories;
        totalProtein += goals.protein;
        totalCarbs += goals.carbs;
        totalFat += goals.fat;
      });

      // Validaciones
      const checks = {
        percentageCheck,
        caloriesCheck: totalCals === user.goals.calories,
        proteinCheck: totalProtein === user.goals.protein,
        carbsCheck: totalCarbs === user.goals.carbs,
        fatCheck: totalFat === user.goals.fat
      };

      // Prueba de porciones
      const emptyLog = createEmptyLog();
      const portionTests: any = {};
      
      activeMealTypes.forEach(mealType => {
        const meals = testMeals[mealType];
        portionTests[mealType] = meals.map(meal => {
          const portion = calculateSimplePortion(user, emptyLog, meal, mealType);
          const adjustedCals = Math.round(meal.calories * portion);
          const adjustedProtein = Math.round(meal.protein * portion * 10) / 10;
          const adjustedCarbs = Math.round(meal.carbs * portion * 10) / 10;
          const adjustedFat = Math.round(meal.fat * portion * 10) / 10;
          
          const mealGoals = getMealGoals(user, mealType);
          const calsDiff = ((adjustedCals - mealGoals.calories) / mealGoals.calories * 100);
          const proteinDiff = ((adjustedProtein - mealGoals.protein) / mealGoals.protein * 100);
          
          return {
            name: meal.name,
            baseCals: meal.calories,
            baseProtein: meal.protein,
            baseCarbs: meal.carbs,
            baseFat: meal.fat,
            portion,
            adjustedCals,
            adjustedProtein,
            adjustedCarbs,
            adjustedFat,
            goalCals: mealGoals.calories,
            goalProtein: mealGoals.protein,
            goalCarbs: mealGoals.carbs,
            goalFat: mealGoals.fat,
            calsDiff,
            proteinDiff,
            portionInRange: portion >= 0.5 && portion <= 2.0
          };
        });
      });

      setTestResults({
        user,
        testCase,
        activeMealTypes,
        mealDistribution,
        totalPercentage,
        allMealGoals,
        totalCals,
        totalProtein,
        totalCarbs,
        totalFat,
        checks,
        portionTests
      });
    } catch (error) {
      console.error('Error running tests:', error);
    }
  };

  const handleProfileChange = (index: number) => {
    setSelectedProfile(index);
  };

  if (!testResults) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8">
          <p className="text-neutral-600">Cargando pruebas...</p>
        </div>
      </div>
    );
  }

  const mealNames = {
    breakfast: 'Desayuno',
    lunch: 'Comida',
    snack: 'Merienda',
    dinner: 'Cena'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl mb-2">Sistema de Validación de Macros</h2>
              <p className="text-purple-100 text-sm">Análisis completo de distribución y porciones</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Profile Selector */}
        <div className="p-6 border-b border-neutral-200">
          <label className="block text-sm text-neutral-700 mb-2">
            Seleccionar Perfil de Prueba:
          </label>
          <select
            value={selectedProfile}
            onChange={(e) => handleProfileChange(Number(e.target.value))}
            className="w-full border border-neutral-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {testProfiles.map((profile, index) => (
              <option key={index} value={index}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos del Perfil */}
          <div className="bg-neutral-50 rounded-2xl p-4">
            <h3 className="text-neutral-800 mb-3">📊 Datos del Perfil</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-neutral-600">Sexo:</span>
                <span className="ml-2">{testResults.testCase.profile.sex === 'male' ? 'Hombre' : 'Mujer'}</span>
              </div>
              <div>
                <span className="text-neutral-600">Edad:</span>
                <span className="ml-2">{testResults.testCase.profile.age} años</span>
              </div>
              <div>
                <span className="text-neutral-600">Peso:</span>
                <span className="ml-2">{testResults.testCase.profile.weight} kg</span>
              </div>
              <div>
                <span className="text-neutral-600">Comidas/día:</span>
                <span className="ml-2">{testResults.testCase.profile.mealsPerDay}</span>
              </div>
            </div>
          </div>

          {/* Objetivos Diarios */}
          <div className="bg-emerald-50 rounded-2xl p-4">
            <h3 className="text-emerald-800 mb-3">🎯 Objetivos Diarios</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-neutral-600 mb-1">Calorías</p>
                <p className="text-2xl text-emerald-600">{testResults.user.goals.calories}</p>
                <p className="text-xs text-neutral-500">kcal</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-neutral-600 mb-1">Proteína</p>
                <p className="text-2xl text-blue-600">{testResults.user.goals.protein}</p>
                <p className="text-xs text-neutral-500">g</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-neutral-600 mb-1">Carbohidratos</p>
                <p className="text-2xl text-amber-600">{testResults.user.goals.carbs}</p>
                <p className="text-xs text-neutral-500">g</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <p className="text-xs text-neutral-600 mb-1">Grasas</p>
                <p className="text-2xl text-orange-600">{testResults.user.goals.fat}</p>
                <p className="text-xs text-neutral-500">g</p>
              </div>
            </div>
          </div>

          {/* Suma Total */}
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-4">
            <p className="text-neutral-800 mb-2">📊 Suma Total de Todas las Comidas:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-neutral-600 mb-1">Calorías</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{testResults.totalCals}</span>
                  {testResults.checks.caloriesCheck ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-neutral-500">Objetivo: {testResults.user.goals.calories}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-neutral-600 mb-1">Proteína</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{testResults.totalProtein}g</span>
                  {testResults.checks.proteinCheck ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-neutral-500">Objetivo: {testResults.user.goals.protein}g</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-neutral-600 mb-1">Carbohidratos</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{testResults.totalCarbs}g</span>
                  {testResults.checks.carbsCheck ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-neutral-500">Objetivo: {testResults.user.goals.carbs}g</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-neutral-600 mb-1">Grasas</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{testResults.totalFat}g</span>
                  {testResults.checks.fatCheck ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-neutral-500">Objetivo: {testResults.user.goals.fat}g</p>
              </div>
            </div>
          </div>

          {/* Resultado Final */}
          <div className={`rounded-2xl p-6 ${
            Object.values(testResults.checks).every((check: any) => check === true)
              ? 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-3">
              {Object.values(testResults.checks).every((check: any) => check === true) ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-green-800 text-lg">✅ Todas las Validaciones Pasaron</h3>
                    <p className="text-green-700 text-sm">El sistema funciona correctamente</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="text-red-800 text-lg">❌ Algunas Validaciones Fallaron</h3>
                    <p className="text-red-700 text-sm">Revisar los detalles arriba</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}