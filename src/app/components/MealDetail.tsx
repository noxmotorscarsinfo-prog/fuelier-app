import { useState, useMemo } from 'react';
import { Meal, MealIngredient } from '../types';
import { ArrowLeft, Check, Flame, Beef, Wheat, Droplet, ChefHat, Clock, Lightbulb, ShoppingBasket, ArrowRight, TrendingUp, TrendingDown, Edit, Target, UtensilsCrossed, Trash2, Plus, Zap } from 'lucide-react';
import { generateDetailedIngredients, generatePreparationSteps, generateCookingTips, generateMealVariations } from '../utils/mealDetails';
import { getMealsData } from '../data/meals';
import { getIngredients } from '../data/ingredients';
import IngredientEditor from './IngredientEditor';
import ComplementSelector from './ComplementSelector';
import { getMealGoals, getRemainingForMeal, calculateOptimalPortion, getMealTypeName } from '../utils/mealDistribution';
import { User, DailyLog } from '../types';
import { MealType } from '../types';
import { Complement } from '../data/complements';
import { adaptMealToUser, getAdaptationLevel } from '../utils/intelligentMealAdaptation';
import { getIngredientById, calculateMacrosFromIngredients } from '../../data/ingredientsDatabase';

interface MealDetailProps {
  meal: Meal;
  onConfirm: (meal: Meal) => void;
  onBack: () => void;
  onSelectVariation?: (meal: Meal) => void;
  user: User;
  currentLog: DailyLog;
  mealType?: MealType; // NUEVO: Para identificar el tipo de comida cuando viene del Dashboard
  onEdit?: () => void; // NUEVO: Para editar la comida desde el Dashboard
  onDelete?: () => void; // NUEVO: Para eliminar la comida desde el Dashboard
  isFromDashboard?: boolean; // NUEVO: Flag para saber si viene del Dashboard
}

export default function MealDetail({ meal, onConfirm, onBack, onSelectVariation, user, currentLog, mealType, onEdit, onDelete, isFromDashboard }: MealDetailProps) {
  // Detectar si es una comida combinada
  const isCombinedMeal = Boolean(meal.combinedMeals);
  
  // ⭐ IMPORTANTE: Los platos escalados desde intelligentMealScaling ya tienen todo calculado
  // Los ingredientReferences YA vienen con las cantidades escaladas
  // NO necesitamos aplicar ningún multiplicador adicional
  const [currentPortion, setCurrentPortion] = useState(1); // Siempre 1 porque ya vienen escalados
  
  const [activeTab, setActiveTab] = useState<'ingredients' | 'preparation' | 'variations'>('ingredients');
  const [editMode, setEditMode] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState<MealIngredient[]>([]);
  const [showComplementSelector, setShowComplementSelector] = useState(false);
  
  // NUEVO: Estado para los macros temporales (se actualiza en tiempo real cuando editas ingredientes)
  const [tempMacros, setTempMacros] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);

  const allMeals = getMealsData();

  // Generar contenido detallado para comidas NO combinadas
  const detailedIngredients = useMemo(() => generateDetailedIngredients(meal), [meal]);
  const preparationSteps = useMemo(() => generatePreparationSteps(meal), [meal]);
  const cookingTips = useMemo(() => generateCookingTips(meal), [meal]);
  const variations = useMemo(() => generateMealVariations(meal, allMeals), [meal, allMeals]);

  // ⭐ NUEVO: Si el plato tiene ingredientReferences (ingredientes REALES), calcularlos
  const realIngredients = useMemo(() => {
    if (!meal.ingredientReferences || meal.ingredientReferences.length === 0) return null;
    
    console.log('🔍 MEAL DETAIL: Plato con ingredientes reales:', meal.name);
    console.log('   Meal completo:', meal);
    console.log('   ingredientReferences:', meal.ingredientReferences);
    console.log('   Macros del meal:', { cal: meal.calories, prot: meal.protein, carbs: meal.carbs, fat: meal.fat });
    console.log('   perfectMatch:', meal.perfectMatch);
    
    // ⭐ CLAVE: Los ingredientReferences YA vienen ESCALADOS desde intelligentMealScaling
    // NO necesitamos multiplicar por nada, solo calcular los macros
    const ingredients = meal.ingredientReferences.map((ref, index) => {
      const ingredient = getIngredientById(ref.ingredientId);
      if (!ingredient) {
        console.warn(`⚠️ Ingrediente no encontrado: ${ref.ingredientId}`);
        return null;
      }
      
      // Calcular macros para la cantidad específica (YA ESCALADA)
      const factor = ref.amountInGrams / 100;
      const calories = ingredient.caloriesPer100g * factor;
      const protein = ingredient.proteinPer100g * factor;
      const carbs = ingredient.carbsPer100g * factor;
      const fat = ingredient.fatPer100g * factor;
      
      console.log(`   ${ingredient.name}: ${ref.amountInGrams}g → ${Math.round(calories)} kcal, ${Math.round(protein)}g prot, ${Math.round(carbs)}g carbs, ${Math.round(fat)}g fat`);
      
      return {
        name: ingredient.name,
        amount: `${ref.amountInGrams}g`,
        calories,
        protein,
        carbs,
        fat
      };
    }).filter(ing => ing !== null);
    
    // Calcular totales desde ingredientes
    const totals = ingredients.reduce((acc, ing) => ({
      calories: acc.calories + (ing?.calories || 0),
      protein: acc.protein + (ing?.protein || 0),
      carbs: acc.carbs + (ing?.carbs || 0),
      fat: acc.fat + (ing?.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    console.log('   ✅ TOTALES CALCULADOS desde ingredientes:', {
      cal: Math.round(totals.calories),
      prot: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10
    });
    console.log('   📊 TOTALES DEL MEAL (objetivo):', {
      cal: meal.calories,
      prot: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    });
    
    // ⭐⭐⭐ AJUSTE CRÍTICO: Si es perfectMatch (última comida con ajuste al 100%)
    // Ajustar proporcionalmente los macros de cada ingrediente para que sumen EXACTAMENTE
    // los macros del meal (que están forzados al target)
    if (meal.perfectMatch && totals.calories > 0) {
      console.log('   🎯 PERFECT MATCH DETECTADO - Ajustando ingredientes para que sumen exactamente el target');
      
      // Calcular factores de ajuste para cada macro
      const adjustmentFactors = {
        calories: meal.calories / totals.calories,
        protein: meal.protein / totals.protein,
        carbs: meal.carbs / totals.carbs,
        fat: meal.fat / totals.fat
      };
      
      console.log('   📐 Factores de ajuste:', {
        cal: adjustmentFactors.calories.toFixed(4),
        prot: adjustmentFactors.protein.toFixed(4),
        carbs: adjustmentFactors.carbs.toFixed(4),
        fat: adjustmentFactors.fat.toFixed(4)
      });
      
      // Aplicar ajustes a cada ingrediente
      const adjustedIngredients = ingredients.map(ing => ({
        ...ing,
        calories: ing!.calories * adjustmentFactors.calories,
        protein: ing!.protein * adjustmentFactors.protein,
        carbs: ing!.carbs * adjustmentFactors.carbs,
        fat: ing!.fat * adjustmentFactors.fat
      }));
      
      // Verificar totales ajustados
      const adjustedTotals = adjustedIngredients.reduce((acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      console.log('   ✅ TOTALES AJUSTADOS (ahora coinciden 100%):', {
        cal: Math.round(adjustedTotals.calories),
        prot: Math.round(adjustedTotals.protein * 10) / 10,
        carbs: Math.round(adjustedTotals.carbs * 10) / 10,
        fat: Math.round(adjustedTotals.fat * 10) / 10
      });
      
      return adjustedIngredients;
    }
    
    return ingredients;
  }, [meal.ingredientReferences, meal.calories, meal.protein, meal.carbs, meal.fat, meal.perfectMatch]);
  
  // ⭐ Decidir qué ingredientes mostrar: REALES o GENERADOS
  const ingredientsToShow = realIngredients || detailedIngredients;
  
  console.log('📊 MEAL DETAIL - Ingredientes a mostrar:', {
    hasRealIngredients: !!realIngredients,
    count: ingredientsToShow.length,
    mealName: meal.name,
    mealCalories: meal.calories
  });

  // NUEVO: Generar contenido detallado para comidas combinadas
  const combinedContent = useMemo(() => {
    if (!isCombinedMeal || !meal.combinedMeals) return null;
    
    const { main, complement } = meal.combinedMeals;
    
    return {
      main: {
        ingredients: generateDetailedIngredients(main),
        preparation: generatePreparationSteps(main),
      },
      complement: {
        ingredients: generateDetailedIngredients(complement),
        preparation: generatePreparationSteps(complement),
      }
    };
  }, [isCombinedMeal, meal.combinedMeals]);

  const calculateMacros = () => {
    // NUEVO: Si hay macros temporales (editando), usarlos
    if (editMode && tempMacros) {
      return {
        calories: Math.round(tempMacros.calories),
        protein: Math.round(tempMacros.protein),
        carbs: Math.round(tempMacros.carbs),
        fat: Math.round(tempMacros.fat)
      };
    }
    
    // IMPORTANTE: Los macros ya vienen ajustados desde MealSelection
    // NO multiplicar de nuevo si meal.baseMeal existe (significa que ya fueron ajustados)
    if (meal.baseMeal) {
      // Los macros YA están ajustados, usar directamente
      return {
        calories: Math.round(meal.calories),
        protein: Math.round(meal.protein),
        carbs: Math.round(meal.carbs),
        fat: Math.round(meal.fat)
      };
    }
    
    // Si no hay baseMeal (comida antigua), aplicar el multiplicador normal
    return {
      calories: Math.round(meal.calories * currentPortion),
      protein: Math.round(meal.protein * currentPortion),
      carbs: Math.round(meal.carbs * currentPortion),
      fat: Math.round(meal.fat * currentPortion)
    };
  };

  const macros = calculateMacros();

  // NUEVO: Calcular objetivos para el tipo de comida
  const mealGoals = useMemo(() => {
    if (!mealType || !user || !user.goals) return null;
    try {
      return getMealGoals(user, mealType);
    } catch (error) {
      console.error('Error calculating meal goals:', error);
      return null;
    }
  }, [user, mealType]);

  // NUEVO: Calcular cumplimiento de objetivos
  const goalCompletion = useMemo(() => {
    if (!mealGoals) return null;
    
    // IMPORTANTE: Calcular los totales del día sumando todas las comidas
    const calculateDayTotals = () => {
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      
      // Sumar todas las comidas del día
      const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
      mealTypes.forEach(type => {
        const mealData = currentLog[type];
        if (mealData) {
          calories += mealData.calories || 0;
          protein += mealData.protein || 0;
          carbs += mealData.carbs || 0;
          fat += mealData.fat || 0;
        }
      });
      
      // Sumar comidas extra si existen
      if (currentLog.extraFoods && Array.isArray(currentLog.extraFoods)) {
        currentLog.extraFoods.forEach(extra => {
          calories += extra.calories || 0;
          protein += extra.protein || 0;
          carbs += extra.carbs || 0;
          fat += extra.fat || 0;
        });
      }
      
      // Sumar comidas complementarias si existen
      if (currentLog.complementaryMeals && Array.isArray(currentLog.complementaryMeals)) {
        currentLog.complementaryMeals.forEach(comp => {
          calories += comp.calories || 0;
          protein += comp.protein || 0;
          carbs += comp.carbs || 0;
          fat += comp.fat || 0;
        });
      }
      
      return { calories, protein, carbs, fat };
    };
    
    const dayTotals = calculateDayTotals();
    
    // Si NO viene del dashboard, sumar los macros de esta comida
    let totalCalories, totalProtein, totalCarbs, totalFat;
    
    if (isFromDashboard) {
      // La comida YA está en el log, usar los totales calculados
      totalCalories = dayTotals.calories;
      totalProtein = dayTotals.protein;
      totalCarbs = dayTotals.carbs;
      totalFat = dayTotals.fat;
    } else {
      // La comida NO está en el log aún, sumarla a los totales
      totalCalories = dayTotals.calories + macros.calories;
      totalProtein = dayTotals.protein + macros.protein;
      totalCarbs = dayTotals.carbs + macros.carbs;
      totalFat = dayTotals.fat + macros.fat;
    }
    
    const dailyGoalCalories = user.goals?.calories || 2000;
    const dailyGoalProtein = user.goals?.protein || 150;
    const dailyGoalCarbs = user.goals?.carbs || 200;
    const dailyGoalFat = user.goals?.fat || 65;
    
    // Calcular porcentajes del DÍA completo - PROTEGER CONTRA DIVISIÓN POR CERO
    // IMPORTANTE: Limitar al 100% para no mostrar más del objetivo
    const caloriesPercent = dailyGoalCalories > 0 ? Math.min(100, (totalCalories / dailyGoalCalories) * 100) : 0;
    const proteinPercent = dailyGoalProtein > 0 ? Math.min(100, (totalProtein / dailyGoalProtein) * 100) : 0;
    const carbsPercent = dailyGoalCarbs > 0 ? Math.min(100, (totalCarbs / dailyGoalCarbs) * 100) : 0;
    const fatPercent = dailyGoalFat > 0 ? Math.min(100, (totalFat / dailyGoalFat) * 100) : 0;
    
    // Calcular lo que FALTA para el día
    const caloriesRemaining = Math.max(0, dailyGoalCalories - totalCalories);
    const proteinRemaining = Math.max(0, dailyGoalProtein - totalProtein);
    const carbsRemaining = Math.max(0, dailyGoalCarbs - totalCarbs);
    const fatRemaining = Math.max(0, dailyGoalFat - totalFat);
    
    // Determinar estado general del DÍA
    const rawCaloriesPercent = dailyGoalCalories > 0 ? (totalCalories / dailyGoalCalories) * 100 : 0;
    const isComplete = rawCaloriesPercent >= 95 && rawCaloriesPercent <= 105;
    const isGood = rawCaloriesPercent >= 80 && rawCaloriesPercent <= 115;
    
    return {
      // Totales del día
      day: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      },
      // Objetivos diarios
      goals: {
        calories: dailyGoalCalories,
        protein: dailyGoalProtein,
        carbs: dailyGoalCarbs,
        fat: dailyGoalFat
      },
      // Porcentajes
      percent: {
        calories: Math.round(caloriesPercent),
        protein: Math.round(proteinPercent),
        carbs: Math.round(carbsPercent),
        fat: Math.round(fatPercent)
      },
      // Lo que falta
      remaining: {
        calories: Math.round(caloriesRemaining),
        protein: Math.round(proteinRemaining),
        carbs: Math.round(carbsRemaining),
        fat: Math.round(fatRemaining)
      },
      // Contribución de ESTA comida
      contribution: {
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      },
      // Estado general
      overall: isComplete ? 'complete' : isGood ? 'good' : 'needsMore'
    };
  }, [macros, mealGoals, currentLog, user.goals, isFromDashboard]);

  // NUEVO: Calcular qué queda para completar el objetivo
  const remaining = useMemo(() => {
    if (!mealGoals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return getRemainingForMeal(user, currentLog, mealType!);
  }, [user, currentLog, mealType, mealGoals]);

  // NUEVO: Obtener nombre del tipo de comida
  const mealTypeName = useMemo(() => {
    if (!mealType) return '';
    return getMealTypeName(mealType);
  }, [mealType]);

  // Calcular tiempo total de preparación
  const totalTime = useMemo(() => {
    const total = preparationSteps.reduce((acc, step) => {
      if (step.time) {
        const mins = parseInt(step.time.split('-')[0]);
        return acc + (isNaN(mins) ? 0 : mins);
      }
      return acc;
    }, 0);
    return total;
  }, [preparationSteps]);

  const handleConfirm = () => {
    const updatedMeal: Meal = {
      ...meal,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat
    };
    onConfirm(updatedMeal);
  };

  const handleSelectVariation = (variationId: string) => {
    const selectedMeal = allMeals.find(m => m.id === variationId);
    if (selectedMeal && onSelectVariation) {
      onSelectVariation(selectedMeal);
    }
  };

  const getMealTypeIcon = () => {
    const icons = {
      breakfast: '🌅',
      lunch: '🍽️',
      snack: '🍎',
      dinner: '🌙'
    };
    return icons[meal.type];
  };

  // Funciones de edición de ingredientes
  const initializeEditMode = () => {
    // IMPORTANTE: Si la comida tiene baseMeal, trabajamos con los valores base
    // Si no, usamos los valores actuales (asumiendo que son base)
    const baseCalories = meal.baseMeal?.calories || meal.calories;
    const baseProtein = meal.baseMeal?.protein || meal.protein;
    const baseCarbs = meal.baseMeal?.carbs || meal.carbs;
    const baseFat = meal.baseMeal?.fat || meal.fat;
    const appliedPortion = meal.portionMultiplier || 1;
    
    if (meal.detailedIngredients) {
      // Si ya tiene ingredientes detallados guardados, usarlos directamente
      // pero ajustarlos por la porción aplicada
      const adjustedIngredients = meal.detailedIngredients.map(ing => ({
        ...ing,
        amount: ing.amount * appliedPortion,
        calories: ing.calories * appliedPortion,
        protein: ing.protein * appliedPortion,
        carbs: ing.carbs * appliedPortion,
        fat: ing.fat * appliedPortion
      }));
      setEditedIngredients(adjustedIngredients);
      
      // NUEVO: Inicializar macros temporales con los totales actuales
      const initialTotals = adjustedIngredients.reduce(
        (acc, ing) => ({
          calories: acc.calories + ing.calories,
          protein: acc.protein + ing.protein,
          carbs: acc.carbs + ing.carbs,
          fat: acc.fat + ing.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTempMacros(initialTotals);
    } else {
      // Generar ingredientes a partir de la base y luego aplicar la porción
      const baseIngredients = generateDetailedIngredients({
        ...meal,
        calories: baseCalories,
        protein: baseProtein,
        carbs: baseCarbs,
        fat: baseFat
      });
      
      const converted: MealIngredient[] = baseIngredients.map((ing, index) => {
        // Parsear la cantidad del ingrediente (ej: "100g" → 100)
        const amountMatch = ing.amount.match(/([0-9.]+)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
        
        // Limpiar el nombre del ingrediente
        let cleanName = ing.name
          .replace(/^\\d+(\\.\\d+)?\\s*(g|kg|ml|l|unidad|unidades|taza|tazas|cucharada|cucharadas)?\\s*(de\\s)?/i, '')
          .trim();
        
        // Capitalizar primera letra si está en minúscula
        if (cleanName && cleanName[0] === cleanName[0].toLowerCase()) {
          cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }
        
        // AJUSTAR por la porción aplicada
        const adjustedAmount = amount * appliedPortion;
        
        return {
          ingredientId: `generated_${index}`,
          ingredientName: cleanName || ing.name,
          amount: adjustedAmount,
          calories: ing.calories * appliedPortion,
          protein: ing.protein * appliedPortion,
          carbs: ing.carbs * appliedPortion,
          fat: ing.fat * appliedPortion
        };
      });
      setEditedIngredients(converted);
      
      // NUEVO: Inicializar macros temporales con los totales actuales
      const initialTotals = converted.reduce(
        (acc, ing) => ({
          calories: acc.calories + ing.calories,
          protein: acc.protein + ing.protein,
          carbs: acc.carbs + ing.carbs,
          fat: acc.fat + ing.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTempMacros(initialTotals);
    }
    setEditMode(true);
  };

  const handleSaveIngredients = (ingredients: MealIngredient[], totals: { calories: number; protein: number; carbs: number; fat: number }) => {
    // Crear un nuevo objeto meal con los valores actualizados
    const updatedMeal: Meal = {
      ...meal,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      detailedIngredients: ingredients,
      ingredients: ingredients.map(ing => `${ing.amount}g ${ing.ingredientName}`)
    };
    
    // Actualizar el estado local
    setEditMode(false);
    setEditedIngredients([]);
    
    // Confirmar la comida actualizada
    onConfirm(updatedMeal);
    
    // NUEVO: Actualizar macros temporales
    setTempMacros({
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedIngredients([]);
    setTempMacros(null); // NUEVO: Limpiar macros temporales al cancelar
  };

  // NUEVO: Manejar cambios en tiempo real del editor de ingredientes
  const handleIngredientsChange = (ingredients: MealIngredient[], totals: { calories: number; protein: number; carbs: number; fat: number }) => {
    setTempMacros(totals);
  };

  // NUEVO: Manejar adición de complemento
  const handleAddComplement = (complement: Complement) => {
    // Convertir el complemento a MealIngredient
    const complementIngredient: MealIngredient = {
      ingredientId: complement.id,
      ingredientName: complement.name,
      amount: complement.amount,
      calories: complement.calories,
      protein: complement.protein,
      carbs: complement.carbs,
      fat: complement.fat
    };

    // Crear una comida actualizada con el complemento sumado
    const updatedMeal: Meal = {
      ...meal,
      calories: macros.calories + complement.calories,
      protein: macros.protein + complement.protein,
      carbs: macros.carbs + complement.carbs,
      fat: macros.fat + complement.fat,
      detailedIngredients: [...(meal.detailedIngredients || []), complementIngredient],
      ingredients: [...(meal.ingredients || []), `${complement.name} (${complement.amount}g)`]
    };

    // Cerrar selector
    setShowComplementSelector(false);

    // Confirmar la comida actualizada inmediatamente
    onConfirm(updatedMeal);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 sm:px-6 pt-10 sm:pt-12 pb-5 sm:pb-6 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
              <span className="text-xl sm:text-2xl flex-shrink-0">{getMealTypeIcon()}</span>
              <h1 className="text-lg sm:text-2xl font-bold truncate">Detalle de Comida</h1>
            </div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>~{totalTime} min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Meal Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-neutral-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">{meal.name}</h2>
          {meal.variant && (
            <div className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm mb-4">
              {meal.variant}
            </div>
          )}
          
          {/* Quick Macros - Cantidad ya calculada y personalizada */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center bg-red-50 rounded-xl p-2 sm:p-3">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-base sm:text-lg text-red-600 font-medium">{macros.calories}</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">kcal</p>
            </div>
            <div className="text-center bg-blue-50 rounded-xl p-2 sm:p-3">
              <Beef className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-base sm:text-lg text-blue-600 font-medium">{macros.protein}g</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Prot</p>
            </div>
            <div className="text-center bg-amber-50 rounded-xl p-2 sm:p-3">
              <Wheat className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-base sm:text-lg text-amber-600 font-medium">{macros.carbs}g</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Carb</p>
            </div>
            <div className="text-center bg-orange-50 rounded-xl p-2 sm:p-3">
              <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mx-auto mb-0.5 sm:mb-1" />
              <p className="text-base sm:text-lg text-orange-600 font-medium">{macros.fat}g</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Grasa</p>
            </div>
          </div>
        </div>

        {/* Objetivo de esta comida */}
        {mealType && goalCompletion && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-neutral-800">Cómo te ayuda a completar tu día</h3>
            </div>

            <div className="space-y-4">
              {/* Calorías */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">Calorías</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-semibold">
                      +{macros.calories} kcal
                    </span>
                    <span className="text-xs text-neutral-500">
                      {goalCompletion.day.calories} / {goalCompletion.goals.calories}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, goalCompletion.percent.calories)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {goalCompletion.remaining.calories > 0 
                    ? `Te faltan ${Math.round(goalCompletion.remaining.calories)} kcal para completar tu día`
                    : `¡Completaste el ${Math.round(goalCompletion.percent.calories)}% de tu objetivo!`
                  }
                </p>
              </div>

              {/* Proteína */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">Proteína</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-semibold">
                      +{macros.protein}g
                    </span>
                    <span className="text-xs text-neutral-500">
                      {goalCompletion.day.protein} / {goalCompletion.goals.protein}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, goalCompletion.percent.protein)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {goalCompletion.remaining.protein > 0 
                    ? `Te faltan ${Math.round(goalCompletion.remaining.protein)}g para completar tu día`
                    : `¡Completaste el ${Math.round(goalCompletion.percent.protein)}% de tu objetivo!`
                  }
                </p>
              </div>

              {/* Carbohidratos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">Carbohidratos</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 font-semibold">
                      +{macros.carbs}g
                    </span>
                    <span className="text-xs text-neutral-500">
                      {goalCompletion.day.carbs} / {goalCompletion.goals.carbs}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, goalCompletion.percent.carbs)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {goalCompletion.remaining.carbs > 0 
                    ? `Te faltan ${Math.round(goalCompletion.remaining.carbs)}g para completar tu día`
                    : `¡Completaste el ${Math.round(goalCompletion.percent.carbs)}% de tu objetivo!`
                  }
                </p>
              </div>

              {/* Grasas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">Grasas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-orange-600 font-semibold">
                      +{macros.fat}g
                    </span>
                    <span className="text-xs text-neutral-500">
                      {goalCompletion.day.fat} / {goalCompletion.goals.fat}g
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, goalCompletion.percent.fat)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {goalCompletion.remaining.fat > 0 
                    ? `Te faltan ${Math.round(goalCompletion.remaining.fat)}g para completar tu día`
                    : `¡Completaste el ${Math.round(goalCompletion.percent.fat)}% de tu objetivo!`
                  }
                </p>
              </div>
            </div>

            {/* Mensaje motivacional */}
            <div className={`mt-4 p-3 rounded-xl ${
              goalCompletion.overall === 'complete'
                ? 'bg-green-100 border border-green-300'
                : goalCompletion.overall === 'good'
                ? 'bg-emerald-100 border border-emerald-300'
                : 'bg-blue-100 border border-blue-300'
            }`}>
              <p className={`text-xs ${
                goalCompletion.overall === 'complete'
                  ? 'text-green-800'
                  : goalCompletion.overall === 'good'
                  ? 'text-emerald-800'
                  : 'text-blue-800'
              }`}>
                {goalCompletion.overall === 'complete' && '🎉 ¡Perfecto! Con esta comida completarás tus objetivos del día.'}
                {goalCompletion.overall === 'good' && '💪 ¡Vas muy bien! Estás cerca de completar tus objetivos diarios.'}
                {goalCompletion.overall === 'needsMore' && (
                  <>
                    ⚡ Esta comida te acerca a tu objetivo.
                    {goalCompletion.remaining.calories > 200 && ' Te recomendamos completar con las próximas comidas.'}
                    {goalCompletion.remaining.protein > 15 && ' Recuerda incluir proteína en tus próximas comidas.'}
                  </>
                )}
              </p>
            </div>

            {/* BOTONES DE ACCIÓN solo cuando NO viene del Dashboard */}
            {!isFromDashboard && goalCompletion.remaining.calories > 100 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowComplementSelector(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Añadir Complemento para Completar
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'ingredients'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Ingredientes</span>
          </button>
          <button
            onClick={() => setActiveTab('preparation')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'preparation'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Preparación</span>
          </button>
          <button
            onClick={() => setActiveTab('variations')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === 'variations'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>Variaciones</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'ingredients' && !editMode && (
          <div className="space-y-4">
            {isCombinedMeal && combinedContent ? (
              // MOSTRAR INGREDIENTES DE COMIDAS COMBINADAS POR SEPARADO
              <>
                {/* Comida Principal */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-md border-2 border-emerald-300">
                  <h3 className="flex items-center gap-2 mb-4">
                    <ShoppingBasket className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900">{meal.combinedMeals!.main.name}</span>
                  </h3>
                  <div className="space-y-3">
                    {combinedContent.main.ingredients.map((ingredient, index) => (
                      <div 
                        key={`main-${index}`}
                        className="bg-white rounded-xl p-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-800">{ingredient.name}</h4>
                            <p className="text-sm text-emerald-600">{ingredient.amount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-neutral-800">{Math.round(ingredient.calories)}</p>
                            <p className="text-xs text-neutral-500">kcal</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-blue-600 font-medium">{Math.round(ingredient.protein)}g</p>
                            <p className="text-neutral-500">Proteína</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2">
                            <p className="text-amber-600 font-medium">{Math.round(ingredient.carbs)}g</p>
                            <p className="text-neutral-500">Carbos</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600 font-medium">{Math.round(ingredient.fat)}g</p>
                            <p className="text-neutral-500">Grasas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complemento */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-md border-2 border-amber-300">
                  <h3 className="flex items-center gap-2 mb-4">
                    <ShoppingBasket className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-amber-900">{meal.combinedMeals!.complement.name}</span>
                  </h3>
                  <div className="space-y-3">
                    {combinedContent.complement.ingredients.map((ingredient, index) => (
                      <div 
                        key={`complement-${index}`}
                        className="bg-white rounded-xl p-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-800">{ingredient.name}</h4>
                            <p className="text-sm text-amber-600">{ingredient.amount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-neutral-800">{Math.round(ingredient.calories)}</p>
                            <p className="text-xs text-neutral-500">kcal</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-blue-600 font-medium">{Math.round(ingredient.protein)}g</p>
                            <p className="text-neutral-500">Proteína</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2">
                            <p className="text-amber-600 font-medium">{Math.round(ingredient.carbs)}g</p>
                            <p className="text-neutral-500">Carbos</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600 font-medium">{Math.round(ingredient.fat)}g</p>
                            <p className="text-neutral-500">Grasas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // MOSTRAR INGREDIENTES NORMALES (NO COMBINADOS)
              <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2">
                    <ShoppingBasket className="w-5 h-5 text-emerald-600" />
                    <span>Ingredientes Detallados</span>
                  </h3>
                  {!isFromDashboard && (
                    <button
                      onClick={initializeEditMode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {ingredientsToShow.map((ingredient, index) => {
                    // ⭐ CLAVE: Si usamos realIngredients, YA vienen escalados
                    // Si usamos detailedIngredients (generados), sí necesitan multiplicarse
                    const useScaling = !realIngredients; // Solo escalar si NO son ingredientes reales
                    
                    // Parsear la cantidad del ingrediente (ej: "100g" → 100)
                    const baseAmount = parseFloat(ingredient.amount.replace(/[^0-9.]/g, '')) || 0;
                    const unit = ingredient.amount.replace(/[0-9.]/g, '').trim() || 'g';
                    
                    // Calcular cantidad y macros (escalados o no según el caso)
                    const displayAmount = useScaling ? Math.round(baseAmount * currentPortion) : Math.round(baseAmount);
                    const displayCalories = useScaling ? Math.round(ingredient.calories * currentPortion) : Math.round(ingredient.calories);
                    const displayProtein = useScaling ? Math.round(ingredient.protein * currentPortion * 10) / 10 : Math.round(ingredient.protein * 10) / 10;
                    const displayCarbs = useScaling ? Math.round(ingredient.carbs * currentPortion * 10) / 10 : Math.round(ingredient.carbs * 10) / 10;
                    const displayFat = useScaling ? Math.round(ingredient.fat * currentPortion * 10) / 10 : Math.round(ingredient.fat * 10) / 10;
                    
                    return (
                      <div 
                        key={index}
                        className="bg-neutral-50 rounded-xl p-4 hover:bg-neutral-100 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-800">{ingredient.name}</h4>
                            <p className="text-sm text-emerald-600">{displayAmount}{unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-neutral-800">{displayCalories}</p>
                            <p className="text-xs text-neutral-500">kcal</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-blue-600 font-medium">{displayProtein}g</p>
                            <p className="text-neutral-500">Proteína</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2">
                            <p className="text-amber-600 font-medium">{displayCarbs}g</p>
                            <p className="text-neutral-500">Carbos</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600 font-medium">{displayFat}g</p>
                            <p className="text-neutral-500">Grasas</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ingredients' && editMode && (
          <IngredientEditor
            initialIngredients={editedIngredients}
            onSave={handleSaveIngredients}
            onCancel={handleCancelEdit}
            onChange={handleIngredientsChange}
          />
        )}

        {activeTab === 'preparation' && (
          <div className="space-y-4">
            {isCombinedMeal && combinedContent ? (
              // MOSTRAR PREPARACIÓN DE COMIDAS COMBINADAS POR SEPARADO
              <>
                {/* Preparación de la Comida Principal */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-md border-2 border-emerald-300">
                  <h3 className="flex items-center gap-2 mb-4">
                    <ChefHat className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900">Preparación: {meal.combinedMeals!.main.name}</span>
                  </h3>
                  <div className="space-y-4">
                    {combinedContent.main.preparation.map((step, index) => (
                      <div 
                        key={`main-prep-${index}`}
                        className="flex gap-4 relative"
                      >
                        {/* Step Number */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-medium shadow-md">
                            {step.step}
                          </div>
                          {index < combinedContent.main.preparation.length - 1 && (
                            <div className="w-0.5 bg-emerald-300 h-full ml-5 mt-2" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-6">
                          <div className="bg-white rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-neutral-800 flex-1">{step.instruction}</p>
                              {step.time && (
                                <div className="flex items-center gap-1 text-emerald-600 text-sm ml-3 flex-shrink-0">
                                  <Clock className="w-4 h-4" />
                                  <span>{step.time}</span>
                                </div>
                              )}
                            </div>
                            {step.tip && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                                <p className="text-xs text-amber-800">💡 <span className="font-medium">Consejo:</span> {step.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preparación del Complemento */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-md border-2 border-amber-300">
                  <h3 className="flex items-center gap-2 mb-4">
                    <ChefHat className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-amber-900">Preparación: {meal.combinedMeals!.complement.name}</span>
                  </h3>
                  <div className="space-y-4">
                    {combinedContent.complement.preparation.map((step, index) => (
                      <div 
                        key={`complement-prep-${index}`}
                        className="flex gap-4 relative"
                      >
                        {/* Step Number */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-medium shadow-md">
                            {step.step}
                          </div>
                          {index < combinedContent.complement.preparation.length - 1 && (
                            <div className="w-0.5 bg-amber-300 h-full ml-5 mt-2" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-6">
                          <div className="bg-white rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-neutral-800 flex-1">{step.instruction}</p>
                              {step.time && (
                                <div className="flex items-center gap-1 text-amber-600 text-sm ml-3 flex-shrink-0">
                                  <Clock className="w-4 h-4" />
                                  <span>{step.time}</span>
                                </div>
                              )}
                            </div>
                            {step.tip && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                                <p className="text-xs text-orange-800">💡 <span className="font-medium">Consejo:</span> {step.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // MOSTRAR PREPARACIÓN NORMAL (NO COMBINADA)
              <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
                <h3 className="mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-600" />
                  <span>Pasos de Preparación</span>
                </h3>
                <div className="space-y-4">
                  {preparationSteps.map((step, index) => (
                    <div 
                      key={index}
                      className="flex gap-4 relative"
                    >
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-medium shadow-md">
                          {step.step}
                        </div>
                        {index < preparationSteps.length - 1 && (
                          <div className="w-0.5 bg-emerald-200 h-full ml-5 mt-2" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-neutral-800 flex-1">{step.instruction}</p>
                            {step.time && (
                              <div className="flex items-center gap-1 text-emerald-600 text-sm ml-3 flex-shrink-0">
                                <Clock className="w-4 h-4" />
                                <span>{step.time}</span>
                              </div>
                            )}
                          </div>
                          {step.tip && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                              <p className="text-xs text-amber-800">💡 <span className="font-medium">Consejo:</span> {step.tip}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'variations' && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-neutral-200">
            <h3 className="mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-emerald-600" />
              <span>Variaciones Similares</span>
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Opciones parecidas que podrían interesarte
            </p>
            <div className="space-y-3">
              {variations.map((variation) => (
                <button
                  key={variation.id}
                  onClick={() => handleSelectVariation(variation.id)}
                  className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-emerald-400 rounded-xl p-4 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-800 group-hover:text-emerald-600 transition-colors">
                        {variation.name}
                      </h4>
                      <p className="text-sm text-neutral-500 mt-1">{variation.description}</p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs ml-2">
                      {variation.tag}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      {variation.caloriesDiff > 0 ? (
                        <TrendingUp className="w-3 h-3 text-red-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      )}
                      <span className={variation.caloriesDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                        {variation.caloriesDiff > 0 ? '+' : ''}{variation.caloriesDiff} kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {variation.proteinDiff > 0 ? (
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-neutral-400" />
                      )}
                      <span className={variation.proteinDiff > 0 ? 'text-blue-600' : 'text-neutral-500'}>
                        {variation.proteinDiff > 0 ? '+' : ''}{variation.proteinDiff}g proteína
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-2xl z-10">
        {isFromDashboard ? (
          // BOTONES PARA CUANDO VIENE DEL DASHBOARD
          <div className="flex gap-3">
            <button
              onClick={onDelete}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Eliminar</span>
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
            >
              <Edit className="w-5 h-5" />
              <span className="font-medium">Cambiar</span>
            </button>
          </div>
        ) : (
          // BOTÓN NORMAL PARA CONFIRMAR
          <button
            onClick={handleConfirm}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
          >
            <Check className="w-5 h-5" />
            <span className="font-medium">Confirmar y Agregar</span>
          </button>
        )}
      </div>

      {/* Selector de Complementos */}
      {showComplementSelector && goalCompletion && (
        <ComplementSelector
          deficit={{
            calories: Math.max(0, goalCompletion.remaining.calories),
            protein: Math.max(0, goalCompletion.remaining.protein),
            carbs: Math.max(0, goalCompletion.remaining.carbs),
            fat: Math.max(0, goalCompletion.remaining.fat)
          }}
          onClose={() => setShowComplementSelector(false)}
          onAddComplement={handleAddComplement}
        />
      )}
    </div>
  );
}