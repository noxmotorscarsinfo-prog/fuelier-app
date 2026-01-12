import { useState, useMemo, useEffect } from 'react';
import { Meal, MealType, User, DayLog, getMealPool } from '../types';
import { ArrowLeft, Search, Check, Sparkles, Heart, ChefHat, Star, Filter, X, Trophy, Info } from 'lucide-react';
import { recommendMeals, getMacroNeedsMessage, MealScore } from '../utils/mealRecommendation';
import { getMealTarget } from '../utils/simplePortionCalculator';
import { ALL_MEALS_FROM_DB } from '../../data/mealsWithIngredients';
import { rankMealsByFit } from '../utils/intelligentMealScaling';
import { calculateIntelligentTarget, getTargetDescription } from '../utils/automaticTargetCalculator';
import { getMealGoals } from '../utils/mealDistribution';
import { migrateMealsToStructured } from '../utils/mealMigration';
import * as api from '../utils/api';

interface MealSelectionProps {
  user: User;
  currentLog: DailyLog;
  mealType: MealType;
  onSelectMeal: (meal: Meal) => void;
  onBack: () => void;
  currentMeal: Meal | null;
  onToggleFavorite?: (mealId: string) => void;
  favoriteMealIds?: string[]; // IDs de comidas favoritas
  onNavigateToCreateMeal?: () => void; // Nueva prop para navegar a crear plato
}

export default function MealSelection({ 
  mealType, 
  onSelectMeal, 
  onBack, 
  onToggleFavorite,
  currentMeal,
  user,
  currentLog,
  onNavigateToCreateMeal
}: MealSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Estados para filtros y UI
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showIngredientFilter, setShowIngredientFilter] = useState(false);
  // ❌ ELIMINADO: Estados del sistema manual de porciones (selectedMealForPortion, portionMultiplier, etc.)

  // NUEVO: Estado para platos globales y personalizados (TODO desde Supabase)
  const [globalMeals, setGlobalMeals] = useState<Meal[]>([]);
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const [isLoadingGlobalMeals, setIsLoadingGlobalMeals] = useState(true);
  const [isLoadingCustomMeals, setIsLoadingCustomMeals] = useState(true);

  // Cargar platos globales al montar el componente
  useEffect(() => {
    const loadGlobalMeals = async () => {
      setIsLoadingGlobalMeals(true);
      const meals = await api.getGlobalMeals();
      
      // 🔄 MIGRACIÓN AUTOMÁTICA: Convertir platos viejos sin ingredientes a formato estructurado
      const migratedMeals = migrateMealsToStructured(meals);
      
      // ⚠️ SEGURIDAD: Solo permitir guardar migraciones si el usuario es admin
      const hadMigrations = migratedMeals.some((meal: any) => meal._migrated);
      if (hadMigrations && user.isAdmin) {
        console.log('💾 [ADMIN] Guardando platos migrados en la base de datos...');
        await api.saveGlobalMeals(migratedMeals);
        console.log('✅ Platos migrados guardados correctamente');
      } else if (hadMigrations && !user.isAdmin) {
        console.warn('⚠️ Migraciones detectadas pero usuario no es admin - NO se guardarán');
      }
      
      setGlobalMeals(migratedMeals);
      setIsLoadingGlobalMeals(false);
    };
    loadGlobalMeals();
  }, [user.isAdmin]);

  // ✅ Cargar platos personalizados desde Supabase
  useEffect(() => {
    const loadCustomMeals = async () => {
      if (!user.email) {
        setIsLoadingCustomMeals(false);
        return;
      }
      
      setIsLoadingCustomMeals(true);
      console.log('📥 Cargando custom meals desde Supabase...');
      const meals = await api.getCustomMeals(user.email);
      console.log(`✅ Cargados ${meals.length} custom meals desde Supabase`);
      setCustomMeals(meals);
      setIsLoadingCustomMeals(false);
    };
    loadCustomMeals();
  }, [user.email]);

  // Función para obtener todas las comidas disponibles
  const getMealsData = (): Meal[] => {
    // CORREGIDO: Manejar meal.type como array o string
    const filteredCustomMeals = customMeals.filter(meal => {
      if (Array.isArray(meal.type)) {
        return meal.type.includes(mealType);
      }
      return meal.type === mealType;
    });
    
    // ⭐ LÓGICA MEJORADA: Usar globalMeals SI existen, sino usar ALL_MEALS_FROM_DB
    // Esto evita duplicados cuando los platos de BD ya están en Supabase
    let dbMeals: Meal[] = [];
    
    if (globalMeals.length === 0) {
      // No hay platos globales en Supabase, usar los de la BD local
      dbMeals = ALL_MEALS_FROM_DB.filter(meal => {
        if (Array.isArray(meal.type)) {
          return meal.type.includes(mealType);
        }
        return meal.type === mealType;
      });
      console.log('📦 Usando platos de BD local:', dbMeals.length);
    } else {
      // Hay platos globales, filtrarlos por tipo
      dbMeals = globalMeals.filter(meal => {
        if (Array.isArray(meal.type)) {
          return meal.type.includes(mealType);
        }
        return meal.type === mealType;
      });
      console.log('🌍 Usando platos globales de Supabase:', dbMeals.length);
    }
    
    // Combinar platos globales/BD + Personalizados
    let allMeals = [...dbMeals, ...filteredCustomMeals];
    
    // 🔄 MIGRACIÓN: Asegurar que TODOS los platos tengan ingredientReferences
    const beforeMigration = allMeals.length;
    allMeals = migrateMealsToStructured(allMeals);
    
    // ✅ GUARDAR platos personalizados reparados de vuelta en Supabase
    const repairedCustomMeals = allMeals.filter(meal => 
      meal.isCustom && meal._migrated === true
    );
    
    if (repairedCustomMeals.length > 0 && user.email) {
      console.log(`💾 Guardando ${repairedCustomMeals.length} platos personalizados reparados en Supabase...`);
      
      // Actualizar solo los que se repararon
      const updatedCustomMeals = customMeals.map(meal => {
        const repaired = repairedCustomMeals.find(r => r.id === meal.id);
        return repaired || meal;
      });
      
      // Guardar de vuelta en Supabase (async pero no bloqueante)
      api.saveCustomMeals(user.email, updatedCustomMeals).then(() => {
        console.log('✅ Platos personalizados guardados en Supabase');
      });
    }
    
    // ⭐ Eliminar duplicados por ID (por si acaso)
    const uniqueMeals = new Map<string, Meal>();
    
    // Primero añadir todos los platos
    allMeals.forEach(meal => {
      uniqueMeals.set(meal.id, meal);
    });
    
    return Array.from(uniqueMeals.values());
  };

  const meals = getMealsData();
  
  // NUEVO: Calcular macros restantes del día (lo que falta por comer)
  const remaining = useMemo(() => {
    console.log('🔍 MealSelection - Calculando remaining');
    console.log('user.goals:', user.goals);
    console.log('currentLog:', currentLog);
    console.log('mealType actual:', mealType);
    
    const consumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    // Sumar todas las comidas ya registradas hoy
    Object.entries(currentLog).forEach(([type, meal]) => {
      if (meal && type !== mealType && type !== 'date' && type !== 'weight' && type !== 'complementaryMeals') { // Excluir la comida actual y propiedades no-meal
        // Asegurarse de que los valores sean números válidos
        consumed.calories += (typeof meal.calories === 'number' && !isNaN(meal.calories)) ? meal.calories : 0;
        consumed.protein += (typeof meal.protein === 'number' && !isNaN(meal.protein)) ? meal.protein : 0;
        consumed.carbs += (typeof meal.carbs === 'number' && !isNaN(meal.carbs)) ? meal.carbs : 0;
        consumed.fat += (typeof meal.fat === 'number' && !isNaN(meal.fat)) ? meal.fat : 0;
      }
    });
    
    console.log('consumed:', consumed);

    const result = {
      calories: Math.max(0, (user.goals?.calories || 0) - consumed.calories),
      protein: Math.max(0, (user.goals?.protein || 0) - consumed.protein),
      carbs: Math.max(0, (user.goals?.carbs || 0) - consumed.carbs),
      fat: Math.max(0, (user.goals?.fat || 0) - consumed.fat)
    };
    
    console.log('remaining result:', result);
    
    return result;
  }, [user.goals, currentLog, mealType]);

  // 🎯 SISTEMA AUTOMÁTICO: Calcular target inteligente (SIN input manual del usuario)
  const intelligentTarget = useMemo(() => {
    return calculateIntelligentTarget(user, currentLog, mealType);
  }, [user, currentLog, mealType]);
  
  // Alias para compatibilidad con código existente
  const currentCalorieGoal = intelligentTarget;
  
  // ❌ ELIMINADO: Sistema de slider manual - ahora todo es 100% automático
  // ❌ ELIMINADO: exceedsRemaining - era parte del sistema de validación manual
  // ❌ ELIMINADO: getRecommendationMessage - no es necesario con el sistema automático
  
  // ✅ FIX: Calcular macros ya consumidos EXCLUYENDO la comida actual
  const consumedMacros = useMemo(() => {
    const consumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    // Iterar sobre las comidas del día, EXCLUYENDO la comida actual
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
    mealTypes.forEach(type => {
      // ✅ CRITICAL: Excluir la comida actual del cálculo
      if (type !== mealType && currentLog[type]) {
        const meal = currentLog[type]!;
        consumed.calories += meal.calories || 0;
        consumed.protein += meal.protein || 0;
        consumed.carbs += meal.carbs || 0;
        consumed.fat += meal.fat || 0;
      }
    });

    return consumed;
  }, [currentLog, mealType]); // ✅ FIX: Agregar mealType como dependencia

  // Usar el remaining calculado arriba (ya no necesitamos este)
  const needsMessage = getMacroNeedsMessage(remaining);

  // NUEVA LÓGICA: Obtener comidas del POOL correspondiente (light o main)
  const currentPool = getMealPool(mealType);
  const mealsOfType = useMemo(() => {
    return meals.filter(meal => {
      const mealPool = getMealPool(meal.type);
      return mealPool === currentPool;
    });
  }, [meals, currentPool]);

  // Extraer ingredientes únicos de todas las comidas
  const allIngredients = useMemo(() => {
    const ingredientsSet = new Set<string>();
    mealsOfType.forEach(meal => {
      if (meal.ingredients && meal.ingredients.length > 0) {
        meal.ingredients.forEach(ingredient => {
          let cleanIngredient = ingredient
            .replace(/^\d+g\s*/i, '')
            .replace(/^\d+ml\s*/i, '')
            .replace(/^\d+\s+/i, '')
            .replace(/^1\/\d+\s+/i, '')
            .trim()
            .toLowerCase();
          
          if (cleanIngredient.length > 2) {
            // Normalizar ingredientes comunes
            if (cleanIngredient.includes('huevo')) cleanIngredient = 'huevo';
            if (cleanIngredient.includes('clara')) cleanIngredient = 'clara de huevo';
            if (cleanIngredient.includes('pollo')) cleanIngredient = 'pollo';
            if (cleanIngredient.includes('plátano') || cleanIngredient.includes('platano')) cleanIngredient = 'plátano';
            if (cleanIngredient.includes('avena')) cleanIngredient = 'avena';
            if (cleanIngredient.includes('arroz')) cleanIngredient = 'arroz';
            if (cleanIngredient.includes('pan')) cleanIngredient = 'pan';
            if (cleanIngredient.includes('yogurt')) cleanIngredient = 'yogurt';
            if (cleanIngredient.includes('proteína') || cleanIngredient.includes('proteina') || cleanIngredient.includes('whey')) cleanIngredient = 'proteína';
            if (cleanIngredient.includes('salmón') || cleanIngredient.includes('salmon')) cleanIngredient = 'salmón';
            if (cleanIngredient.includes('aguacate')) cleanIngredient = 'aguacate';
            if (cleanIngredient.includes('espinaca')) cleanIngredient = 'espinacas';
            if (cleanIngredient.includes('tomate')) cleanIngredient = 'tomate';
            if (cleanIngredient.includes('queso') || cleanIngredient.includes('parmesano')) cleanIngredient = 'queso';
            if (cleanIngredient.includes('leche')) cleanIngredient = 'leche';
            
            ingredientsSet.add(cleanIngredient);
          }
        });
      }
    });
    return Array.from(ingredientsSet).sort();
  }, [mealsOfType]);

  // NUEVA FUNCIÓN: Calcular porción personalizada según el objetivo de calorías seleccionado
  const calculateCustomPortion = (meal: Meal) => {
    // Usar el objetivo de calorías personalizado del usuario
    const targetCalories = currentCalorieGoal.calories;
    
    // Si el plato tiene 0 calorías, evitar división por cero
    if (meal.calories === 0) return 1;
    
    // Calcular el multiplicador para alcanzar exactamente las calorías objetivo
    const portion = targetCalories / meal.calories;
    
    // Limitar entre 0.1 y 5 para evitar porciones extremas
    return Math.max(0.1, Math.min(5, portion));
  };

  // Función auxiliar para calcular ajuste de macros
  const calculateMacroFitForMeal = (meal: Meal, portion: number) => {
    const adjustedMeal = {
      calories: meal.calories * portion,
      protein: meal.protein * portion,
      carbs: meal.carbs * portion,
      fat: meal.fat * portion
    };
    
    const calorieGoal = currentCalorieGoal.calories;
    const proteinGoal = currentCalorieGoal.protein;
    const carbsGoal = currentCalorieGoal.carbs;
    const fatGoal = currentCalorieGoal.fat;
    
    const calorieMatch = calorieGoal > 0 ? Math.min(100, (adjustedMeal.calories / calorieGoal) * 100) : 100;
    const proteinMatch = proteinGoal > 0 ? Math.min(100, (adjustedMeal.protein / proteinGoal) * 100) : 100;
    const carbsMatch = carbsGoal > 0 ? Math.min(100, (adjustedMeal.carbs / carbsGoal) * 100) : 100;
    const fatMatch = fatGoal > 0 ? Math.min(100, (adjustedMeal.fat / fatGoal) * 100) : 100;
    
    return (calorieMatch + proteinMatch + carbsMatch + fatMatch) / 4;
  };

  // 🎯 SISTEMA AUTOMÁTICO: Usar escalado inteligente con target calculado automáticamente
  const recommendedMeals = useMemo(() => {
    console.log('🎯 Calculando recomendaciones con escalado inteligente y preferencias');
    console.log('📊 Target automático calculado:', intelligentTarget);
    
    // Paso 1: Rankear comidas por mejor ajuste de macros
    // ✅ Usar intelligentTarget (calculado automáticamente sin input manual)
    const rankedMeals = rankMealsByFit(
      mealsOfType, 
      user, 
      currentLog, 
      mealType,
      intelligentTarget
    );
    
    console.log('✅ Meals rankeadas y escaladas:', rankedMeals.length);
    
    // Paso 2: Aplicar sistema de recomendaciones avanzado (incluye preferencias)
    // ✅ CLAVE: Pasar los scaledMeal a recommendMeals
    const mealsForRecommendation = rankedMeals.map(r => r.scaledMeal);
    const scoredWithPreferences = recommendMeals(
      mealsForRecommendation,  // ✅ Meals ya escalados
      user.goals, 
      consumedMacros,
      user,
      currentLog,
      mealType
    );
    
    // Paso 3: Combinar scores y MANTENER scaledMeal
    return scoredWithPreferences.map(scored => {
      // ✅ CLAVE: scored.meal ES el scaledMeal (porque se lo pasamos escalado)
      // Encontrar el ranked original para obtener el meal base
      const originalRanked = rankedMeals.find(r => r.scaledMeal.id === scored.meal.id);
      const macroFitScore = originalRanked?.fitScore || 0;
      
      // Score final: 70% ajuste de macros + 30% preferencias y patrones
      const finalScore = (macroFitScore * 0.7) + (scored.score * 0.3);
      
      return {
        ...scored,
        meal: originalRanked?.meal || scored.meal,  // ✅ Meal base (original)
        scaledMeal: scored.meal,  // ✅ Meal escalado (lo que se debe mostrar y guardar)
        score: Math.round(finalScore),
        reasons: [
          ...scored.reasons,
          `Ajuste de macros: ${macroFitScore.toFixed(1)}%`
        ]
      };
    }).sort((a, b) => b.score - a.score); // Re-ordenar por score combinado
  }, [mealsOfType, user, currentLog, mealType, intelligentTarget, consumedMacros]);

  // ⭐ CRÍTICO: Filtrar por preferencias alimenticias del usuario (alergias, intolerancias, disgustos)
  const mealsFilteredByPreferences = useMemo(() => {
    if (!user.preferences) {
      return recommendedMeals;
    }
    
    const { allergies = [], intolerances = [], dislikes = [] } = user.preferences;
    
    // Si no hay restricciones, retornar todas
    if (allergies.length === 0 && intolerances.length === 0 && dislikes.length === 0) {
      return recommendedMeals;
    }
    
    return recommendedMeals.filter(scored => {
      const meal = scored.meal;
      
      // Si el plato NO tiene ingredientes listados, no se puede filtrar - dejar pasar
      if (!meal.ingredients || meal.ingredients.length === 0) {
        return true;
      }
      
      // Convertir ingredientes del plato a minúsculas para comparación
      const mealIngredientsLower = meal.ingredients.map(ing => ing.toLowerCase());
      
      // FILTRO 1: ALERGIAS (máxima prioridad - eliminar SIEMPRE)
      for (const allergy of allergies) {
        const allergyLower = allergy.toLowerCase();
        if (mealIngredientsLower.some(ing => ing.includes(allergyLower))) {
          console.log(`🚫 Plato "${meal.name}" filtrado por ALERGIA: ${allergy}`);
          return false; // Contiene alérgeno → ELIMINAR
        }
      }
      
      // FILTRO 2: INTOLERANCIAS (alta prioridad - eliminar)
      for (const intolerance of intolerances) {
        const intoleranceLower = intolerance.toLowerCase();
        if (mealIngredientsLower.some(ing => ing.includes(intoleranceLower))) {
          console.log(`⚠️ Plato "${meal.name}" filtrado por INTOLERANCIA: ${intolerance}`);
          return false; // Contiene ingrediente no tolerado → ELIMINAR
        }
      }
      
      // FILTRO 3: DISGUSTOS (preferencia - reducir score pero no eliminar)
      // Por ahora también eliminamos, pero en el futuro podríamos solo reducir el score
      for (const dislike of dislikes) {
        const dislikeLower = dislike.toLowerCase();
        if (mealIngredientsLower.some(ing => ing.includes(dislikeLower))) {
          console.log(`👎 Plato "${meal.name}" filtrado por DISGUSTO: ${dislike}`);
          return false; // Contiene ingrediente que no le gusta → ELIMINAR
        }
      }
      
      // Pasó todos los filtros
      return true;
    });
  }, [recommendedMeals, user.preferences]);

  // Aplicar filtro de ingredientes seleccionados (filtro manual de UI)
  const filteredRecommendedMeals = useMemo(() => {
    if (selectedIngredients.length === 0) {
      return mealsFilteredByPreferences; // ✅ Usar meals ya filtradas por preferencias
    }
    
    return mealsFilteredByPreferences.filter(scored => {
      if (!scored.meal.ingredients || scored.meal.ingredients.length === 0) {
        return false;
      }
      
      return selectedIngredients.every(selectedIngredient => {
        return scored.meal.ingredients!.some(mealIngredient => 
          mealIngredient.toLowerCase().includes(selectedIngredient.toLowerCase())
        );
      });
    });
  }, [mealsFilteredByPreferences, selectedIngredients]);

  // Top 3 recomendaciones de la app - SIEMPRE son las mejores opciones
  // Ordenadas por mejor ajuste a objetivos y preferencias del usuario
  const top3Recommended = useMemo(() => {
    // Las recomendaciones ya vienen ordenadas de mayor a menor score
    // Tomamos las 3 primeras = las 3 MEJORES opciones
    return filteredRecommendedMeals.slice(0, 3);
  }, [filteredRecommendedMeals]);

  // Comidas favoritas del usuario
  const favoriteMeals = useMemo(() => {
    return filteredRecommendedMeals.filter(scored => scored.meal.isFavorite);
  }, [filteredRecommendedMeals]);

  // Comidas custom del usuario
  const userCustomMeals = useMemo(() => {
    return filteredRecommendedMeals.filter(scored => scored.meal.isCustom);
  }, [filteredRecommendedMeals]);

  // Resto de comidas (después del top 3)
  const restOfMeals = useMemo(() => {
    return filteredRecommendedMeals.slice(3);
  }, [filteredRecommendedMeals]);

  // Filtrar según qué sección está activa
  const getDisplayMeals = () => {
    let mealsToShow: MealScore[] = [];

    if (showFavoritesOnly) {
      mealsToShow = favoriteMeals;
    } else if (selectedCategory === 'custom') {
      mealsToShow = userCustomMeals;
    } else {
      mealsToShow = filteredRecommendedMeals;
    }

    if (searchQuery) {
      return mealsToShow.filter(scored => 
        scored.meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (scored.meal.variant && scored.meal.variant.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return mealsToShow;
  };

  const displayMeals = getDisplayMeals();

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const clearIngredientFilters = () => {
    setSelectedIngredients([]);
  };

  // ❌ ELIMINADO: handleSelectComplement y handleSaveMainMealOnly - ya no son necesarios sin el modal de complementos

  const getMealTypeLabel = () => {
    const labels = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      snack: 'Merienda',
      dinner: 'Cena'
    };
    return labels[mealType];
  };

  const getMealTypeIcon = () => {
    const icons = {
      breakfast: '🌅',
      lunch: '🍽️',
      snack: '🍎',
      dinner: '🌙'
    };
    return icons[mealType];
  };

  const handleToggleFavorite = (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(mealId);
    }
  };

  // NUEVA FUNCIÓN: Manejar confirmación de porción
  // Funciones del modal de porciones eliminadas - ahora la selección es directa

  const renderMealCard = (scoredMeal: MealScore & { scaledMeal?: Meal }, isTopRecommended: boolean = false, topNumber?: number) => {
    const { meal, scaledMeal, score, userAcceptanceProbability, adaptationScore } = scoredMeal;
    
    console.log('🎴 Renderizando tarjeta:', {
      nombre: meal.name,
      tienescaledMeal: !!scaledMeal,
      macrosOriginal: { cal: meal.calories, prot: meal.protein },
      macrosEscalado: scaledMeal ? { cal: scaledMeal.calories, prot: scaledMeal.protein } : 'N/A'
    });
    
    // ✅ USAR EL SCALED MEAL si existe (ya viene escalado según el target automático)
    const mealToDisplay = scaledMeal || meal;
    
    console.log('   → Mostrando macros de:', scaledMeal ? 'scaledMeal ✅' : 'meal original ❌', {
      cal: mealToDisplay.calories,
      prot: mealToDisplay.protein,
      carbs: mealToDisplay.carbs,
      fat: mealToDisplay.fat
    });
    
    // ✅ NO RE-ESCALAR: El meal ya viene con los valores correctos
    const adjustedMeal = {
      calories: mealToDisplay.calories,
      protein: mealToDisplay.protein,
      carbs: mealToDisplay.carbs,
      fat: mealToDisplay.fat
    };
    
    // NUEVO: Obtener la compatibilidad de proporciones
    const proportionCompatibility = mealToDisplay.proportionCompatibility || 0;
    
    // Calcular qué % del objetivo de esta comida cubre cada macro
    const calorieGoal = currentCalorieGoal.calories;
    const proteinGoal = currentCalorieGoal.protein;
    const carbsGoal = currentCalorieGoal.carbs;
    const fatGoal = currentCalorieGoal.fat;
    
    const calorieMatch = calorieGoal > 0 ? Math.min(100, (adjustedMeal.calories / calorieGoal) * 100) : 100;
    const proteinMatch = proteinGoal > 0 ? Math.min(100, (adjustedMeal.protein / proteinGoal) * 100) : 100;
    const carbsMatch = carbsGoal > 0 ? Math.min(100, (adjustedMeal.carbs / carbsGoal) * 100) : 100;
    const fatMatch = fatGoal > 0 ? Math.min(100, (adjustedMeal.fat / fatGoal) * 100) : 100;
    
    // Promedio de todos los macros
    const overallMatch = (calorieMatch + proteinMatch + carbsMatch + fatMatch) / 4;
    
    // Detectar desequilibrios (si un macro está >120% o <80% del objetivo)
    const imbalances: string[] = [];
    if (proteinMatch > 120) imbalances.push('Alto en proteína');
    if (proteinMatch < 80) imbalances.push('Bajo en proteína');
    if (carbsMatch > 120) imbalances.push('Alto en carbos');
    if (carbsMatch < 80) imbalances.push('Bajo en carbos');
    if (fatMatch > 120) imbalances.push('Alto en grasas');
    if (fatMatch < 80) imbalances.push('Bajo en grasas');
    
    const macroFit = {
      overallMatch,
      calorieMatch,
      proteinMatch,
      carbsMatch,
      fatMatch,
      imbalances,
      isPerfect: overallMatch >= 90 && imbalances.length === 0,
      isGood: overallMatch >= 75 && imbalances.length <= 1,
      needsAttention: imbalances.length > 2 || overallMatch < 60
    };
    
    // Categorizar compatibilidad de proporciones
    const getProportionCategory = () => {
      if (proportionCompatibility >= 85) return { label: 'Excelente', color: 'emerald', emoji: '🎯' };
      if (proportionCompatibility >= 70) return { label: 'Muy Bueno', color: 'green', emoji: '✅' };
      if (proportionCompatibility >= 55) return { label: 'Bueno', color: 'blue', emoji: '👍' };
      if (proportionCompatibility >= 40) return { label: 'Aceptable', color: 'amber', emoji: '⚠️' };
      return { label: 'Bajo', color: 'red', emoji: '❌' };
    };
    
    const proportionCategory = getProportionCategory();
    
    // Las cantidades ya están ajustadas automáticamente - NO mostrar etiquetas de porción

    return (
      <div
        key={meal.id}
        onClick={() => {
          // ✅ USAR EL SCALED MEAL: Ya viene escalado según el target automático calculado
          const mealToSave: Meal = {
            ...mealToDisplay,
            portionMultiplier: mealToDisplay.baseQuantity || 1,
            baseMeal: {
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat
            }
          };
          
          console.log('✅ Comida seleccionada:', {
            nombre: mealToSave.name,
            macros: {
              cal: mealToSave.calories,
              prot: mealToSave.protein,
              carbs: mealToSave.carbs,
              fat: mealToSave.fat
            },
            target: intelligentTarget,
            multiplicador: mealToSave.portionMultiplier,
            esUltimaComida: intelligentTarget.isLastMeal
          });
          
          onSelectMeal(mealToSave);
        }}
        className={`w-full border-2 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer relative active:scale-[0.99] ${
          isTopRecommended 
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 hover:border-emerald-500' 
            : 'bg-white border-neutral-200 hover:border-emerald-300'
        } ${currentMeal?.id === meal.id ? 'ring-2 ring-emerald-500' : ''}`}
      >
        {/* Badge especial para CENA - Muestra compatibilidad de proporciones */}
        {mealType === 'dinner' && isTopRecommended && topNumber && (
          <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-md z-10">
            <span className="text-xs sm:text-sm">{proportionCategory.emoji}</span>
            <span className="font-semibold whitespace-nowrap">
              {proportionCompatibility >= 85 ? 'Perfecto' : 'Top'} #{topNumber} ({Math.round(proportionCompatibility)}%)
            </span>
          </div>
        )}
        
        {/* Badge normal para otras comidas */}
        {mealType !== 'dinner' && isTopRecommended && topNumber && (
          <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-md z-10">
            <Sparkles className="w-3 h-3" />
            <span className="font-semibold whitespace-nowrap">Recomendado #{topNumber}</span>
          </div>
        )}

        {/* Badge de "Ajuste Perfecto" con porcentaje */}
        {!isTopRecommended && macroFit.isPerfect && (
          <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-md z-10">
            <Check className="w-3 h-3" />
            <span className="font-semibold whitespace-nowrap">Ajuste Perfecto {Math.round(macroFit.overallMatch)}%</span>
          </div>
        )}

        {/* Badge de "Buen Ajuste" con porcentaje */}
        {!isTopRecommended && !macroFit.isPerfect && macroFit.isGood && (
          <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-md z-10">
            <Star className="w-3 h-3" />
            <span className="font-semibold whitespace-nowrap">Buen Ajuste {Math.round(macroFit.overallMatch)}%</span>
          </div>
        )}

        {/* Las cantidades ya están personalizadas - no mostrar indicadores de porción */}
        
        {/* NUEVO: Badge de historial si tiene alta probabilidad de aceptación */}
        {userAcceptanceProbability && userAcceptanceProbability > 85 && !isTopRecommended && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-md">
            <Star className="w-3 h-3 fill-current" />
            <span className="whitespace-nowrap">Lo aceptas {Math.round(userAcceptanceProbability)}%</span>
          </div>
        )}

        {meal.isCustom && !isTopRecommended && !userAcceptanceProbability && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-purple-500 text-white rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
            <ChefHat className="w-3 h-3" />
            <span>Tuyo</span>
          </div>
        )}

        {currentMeal?.id === meal.id && !isTopRecommended && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-emerald-500 text-white rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        )}
        
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`flex-shrink-0 ${isTopRecommended ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-neutral-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl`}>
            {meal.isCustom ? '👨‍🍳' : getMealTypeIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-2 min-w-0">
                <h3 className={`${isTopRecommended ? 'text-base sm:text-lg font-bold' : 'text-sm sm:text-base font-semibold'} text-neutral-800 mb-1 truncate`}>
                  {meal.name}
                </h3>
                {meal.variant && (
                  <p className="text-xs sm:text-sm text-neutral-500 truncate">{meal.variant}</p>
                )}
                
                {/* NUEVO: Indicador de compatibilidad de proporciones para CENA */}
                {mealType === 'dinner' && proportionCompatibility > 0 && (
                  <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs ${
                    proportionCompatibility >= 85 ? 'bg-emerald-100 text-emerald-700' :
                    proportionCompatibility >= 70 ? 'bg-green-100 text-green-700' :
                    proportionCompatibility >= 55 ? 'bg-blue-100 text-blue-700' :
                    proportionCompatibility >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span>{proportionCategory.emoji}</span>
                    <span className="font-medium">
                      {proportionCategory.label} ({Math.round(proportionCompatibility)}%)
                    </span>
                  </div>
                )}
                
                {/* Indicador de ajuste de macros - MEJORADO */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    macroFit.isPerfect ? 'bg-green-500' :
                    macroFit.isGood ? 'bg-blue-500' :
                    macroFit.needsAttention ? 'bg-amber-500' : 'bg-neutral-400'
                  }`} />
                  <span className={`text-sm font-semibold ${
                    macroFit.isPerfect ? 'text-green-600' :
                    macroFit.isGood ? 'text-blue-600' :
                    macroFit.needsAttention ? 'text-amber-600' : 'text-neutral-500'
                  }`}>
                    {Math.round(macroFit.overallMatch)}% de ajuste
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => handleToggleFavorite(e, meal.id)}
                className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full transition-all active:scale-95 ${
                  meal.isFavorite 
                    ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-red-500'
                }`}
                aria-label={meal.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${meal.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Macros Grid - Mejorado para mejor visualización */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-center ${isTopRecommended ? 'bg-white border border-emerald-300' : 'bg-neutral-50'}`}>
                <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 font-medium">Kcal</p>
                <p className={`text-xs sm:text-sm font-bold leading-tight ${isTopRecommended ? 'text-emerald-600' : 'text-neutral-800'}`}>
                  {Math.round(adjustedMeal.calories)}
                </p>
              </div>
              <div className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-center ${isTopRecommended ? 'bg-white border border-blue-300' : 'bg-neutral-50'}`}>
                <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 font-medium">Prot</p>
                <p className={`text-xs sm:text-sm font-bold leading-tight ${isTopRecommended ? 'text-blue-600' : 'text-neutral-800'}`}>
                  {Math.round(adjustedMeal.protein)}g
                </p>
              </div>
              <div className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-center ${isTopRecommended ? 'bg-white border border-amber-300' : 'bg-neutral-50'}`}>
                <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 font-medium">Carb</p>
                <p className={`text-xs sm:text-sm font-bold leading-tight ${isTopRecommended ? 'text-amber-600' : 'text-neutral-800'}`}>
                  {Math.round(adjustedMeal.carbs)}g
                </p>
              </div>
              <div className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-center ${isTopRecommended ? 'bg-white border border-orange-300' : 'bg-neutral-50'}`}>
                <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 font-medium">Gras</p>
                <p className={`text-xs sm:text-sm font-bold leading-tight ${isTopRecommended ? 'text-orange-600' : 'text-neutral-800'}`}>
                  {Math.round(adjustedMeal.fat)}g
                </p>
              </div>
            </div>

            {/* NUEVO: Diferencias con macros restantes (SOLO para CENA) */}
            {mealType === 'dinner' && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg px-2.5 sm:px-3 py-2 mb-2 sm:mb-3">
                <p className="text-[10px] sm:text-xs text-purple-700 font-semibold mb-1.5">📊 Diferencia vs. macros restantes:</p>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {(() => {
                    const mealCals = Math.round(adjustedMeal.calories);
                    const mealProt = Math.round(adjustedMeal.protein);
                    const mealCarbs = Math.round(adjustedMeal.carbs);
                    const mealFat = Math.round(adjustedMeal.fat);
                    
                    const diffCals = mealCals - remaining.calories;
                    const diffProt = mealProt - remaining.protein;
                    const diffCarbs = mealCarbs - remaining.carbs;
                    const diffFat = mealFat - remaining.fat;
                    
                    return (
                      <>
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm font-bold leading-tight ${Math.abs(diffCals) < 50 ? 'text-emerald-600' : diffCals > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {diffCals > 0 ? '+' : ''}{diffCals}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm font-bold leading-tight ${Math.abs(diffProt) < 3 ? 'text-emerald-600' : diffProt > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {diffProt > 0 ? '+' : ''}{diffProt}g
                          </p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm font-bold leading-tight ${Math.abs(diffCarbs) < 5 ? 'text-emerald-600' : diffCarbs > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {diffCarbs > 0 ? '+' : ''}{diffCarbs}g
                          </p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs sm:text-sm font-bold leading-tight ${Math.abs(diffFat) < 3 ? 'text-emerald-600' : diffFat > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {diffFat > 0 ? '+' : ''}{diffFat}g
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <p className="text-[9px] sm:text-[10px] text-purple-600 mt-1 text-center leading-tight">
                  ✅ Verde = Perfecto | 🔴 Rojo = Exceso | 🟠 Naranja = Defecto
                </p>
              </div>
            )}

            {isTopRecommended && topNumber && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-lg px-3 py-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-bold">
                    {topNumber === 1 && '🥇 Mejor opción para ti'}
                    {topNumber === 2 && '🥈 Segunda mejor opción'}
                    {topNumber === 3 && '🥉 Tercera mejor opción'}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Ajustado a tus objetivos y preferencias
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Mostrar loading mientras se cargan platos desde Supabase
  if (isLoadingGlobalMeals || isLoadingCustomMeals) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando platos desde Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header Fijo */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 sm:px-6 pt-10 sm:pt-12 pb-5 sm:pb-6 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              onClick={onBack}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="text-2xl sm:text-3xl flex-shrink-0">{getMealTypeIcon()}</div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Selecciona tu {getMealTypeLabel()}</h1>
                <p className="text-emerald-100 text-xs sm:text-sm truncate">{needsMessage}</p>
              </div>
            </div>
          </div>

          {/* ⚠️ AVISO: Target limitado por macros restantes */}
          {(() => {
            const mealGoals = getMealGoals(user, mealType);
            const isLimited = 
              intelligentTarget.calories < mealGoals.calories ||
              intelligentTarget.protein < mealGoals.protein ||
              intelligentTarget.carbs < mealGoals.carbs ||
              intelligentTarget.fat < mealGoals.fat;
            
            if (isLimited && !intelligentTarget.isLastMeal) {
              return (
                <div className="bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded-lg mb-3 text-xs sm:text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">⚠️ Macros ajustados automáticamente</p>
                    <p className="text-amber-700 mt-0.5">
                      Has consumido macros en comidas anteriores. El target se ha ajustado para no exceder tus objetivos diarios.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Barra de búsqueda y botón */}
          <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar comidas..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base"
              />
            </div>
            
            {onNavigateToCreateMeal && (
              <button
                onClick={onNavigateToCreateMeal}
                className="flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 font-semibold shadow-lg active:scale-95"
              >
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Crear Plato</span>
              </button>
            )}
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setShowFavoritesOnly(false);
                setSelectedCategory('all');
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                !showFavoritesOnly && selectedCategory === 'all'
                  ? 'bg-white text-emerald-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Todas ({recommendedMeals.length})
            </button>
            <button
              onClick={() => {
                setShowFavoritesOnly(true);
                setSelectedCategory('all');
              }}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
                showFavoritesOnly
                  ? 'bg-white text-red-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">Favoritos ({favoriteMeals.length})</span>
              <span className="sm:hidden">({favoriteMeals.length})</span>
            </button>
            <button
              onClick={() => {
                setShowFavoritesOnly(false);
                setSelectedCategory('custom');
              }}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
                selectedCategory === 'custom'
                  ? 'bg-white text-purple-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Mis Platos ({userCustomMeals.length})</span>
              <span className="sm:hidden">({userCustomMeals.length})</span>
            </button>
            <button
              onClick={() => setShowIngredientFilter(true)}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base ${
                selectedIngredients.length > 0
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Ingredientes {selectedIngredients.length > 0 && `(${selectedIngredients.length})`}</span>
              <span className="sm:hidden">Filtrar {selectedIngredients.length > 0 && `(${selectedIngredients.length})`}</span>
            </button>
          </div>

          {/* Ingredientes seleccionados - Pills */}
          {selectedIngredients.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
              {selectedIngredients.map(ingredient => (
                <button
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  className="flex-shrink-0 bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition-all"
                >
                  <span className="capitalize">{ingredient}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearIngredientFilters}
                className="flex-shrink-0 text-white/80 hover:text-white px-2 py-1 text-xs underline"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NUEVA: Leyenda de indicadores de ajuste */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-3">
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-neutral-800 text-sm">Las comidas están ordenadas por mejor ajuste a tus macros</h4>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span><span className="font-medium text-green-600">Ajuste Perfecto</span> (≥90%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span><span className="font-medium text-blue-600">Buen Ajuste</span> (≥75%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span><span className="font-medium text-amber-600">Requiere Ajuste</span> (&lt;75%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVO: Banner de Macros Restantes del Día */}
      {Object.values(currentLog).filter(Boolean).length > 0 && (
        <div className="max-w-4xl mx-auto px-6 mb-6">
          <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-5 shadow-lg border-2 border-emerald-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-800">
                {mealType === 'dinner' ? '🎯 Para completar tu día necesitas' : '📊 Te falta para hoy'}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
                <p className="text-xs text-red-700 font-medium mb-1">Caloras</p>
                <p className="text-2xl font-bold text-red-600">{Math.round(remaining.calories || 0)}</p>
                <p className="text-xs text-red-600 mt-0.5">kcal</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-1">Proteína</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(remaining.protein || 0)}</p>
                <p className="text-xs text-blue-600 mt-0.5">g</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-700 font-medium mb-1">Carbos</p>
                <p className="text-2xl font-bold text-amber-600">{Math.round(remaining.carbs || 0)}</p>
                <p className="text-xs text-amber-600 mt-0.5">g</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
                <p className="text-xs text-orange-700 font-medium mb-1">Grasas</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(remaining.fat || 0)}</p>
                <p className="text-xs text-orange-600 mt-0.5">g</p>
              </div>
            </div>
            {mealType === 'dinner' && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-3 border border-emerald-200">
                💡 <strong>Tip:</strong> Selecciona "Ideal (100%)" para cumplir exactamente con estos macros y completar tu día perfecto.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🎯 Target Automático Calculado */}
      <div className="max-w-4xl mx-auto px-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border-2 border-emerald-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-500 p-3 rounded-full">
              <span className="text-3xl">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-900">
                {intelligentTarget.isLastMeal ? 'Última Comida del Día' : 'Target Óptimo Calculado'}
              </h3>
              <p className="text-sm text-emerald-700">
                {intelligentTarget.isLastMeal 
                  ? `Completa tus objetivos con ${Math.round(intelligentTarget.calories)} kcal`
                  : `Quedan ${intelligentTarget.mealsLeft} comidas • ${Math.round(intelligentTarget.calories)} kcal recomendadas`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600">Te quedan hoy</p>
              <p className="text-2xl font-bold text-emerald-700">{Math.round(remaining.calories)}</p>
              <p className="text-xs text-emerald-600">kcal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-600 mb-1">Calorías</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(intelligentTarget.calories)}</p>
              <p className="text-xs text-neutral-500">kcal</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-600 mb-1">Proteína</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(intelligentTarget.protein)}</p>
              <p className="text-xs text-neutral-500">g</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-600 mb-1">Carbos</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(intelligentTarget.carbs)}</p>
              <p className="text-xs text-neutral-500">g</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-600 mb-1">Grasas</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(intelligentTarget.fat)}</p>
              <p className="text-xs text-neutral-500">g</p>
            </div>
          </div>
          
          <div className="bg-emerald-100 rounded-lg p-3">
            <p className="text-sm text-emerald-800 font-medium">
              💡 Las recomendaciones <strong>Top #1, #2, #3</strong> están escaladas automáticamente para este target. 
              Si las sigues, llegarás al <strong>100%</strong> de tus objetivos al final del día.
            </p>
          </div>
        </div>
      </div>

      {/* ❌ ELIMINADO: Código duplicado - la lista de comidas real está más abajo */}

      {/* Lista de comidas */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {!showFavoritesOnly && selectedCategory === 'all' && !searchQuery && (
          <>
            {/* Top 3 Recomendaciones */}
            <div className="mb-6">
              {/* Banner especial si es CENA */}
              {mealType === 'dinner' && (
                <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌙</span>
                    <h3 className="font-bold text-indigo-900">Última Comida del Día</h3>
                  </div>
                  <p className="text-sm text-indigo-700">
                    Todas las opciones están ajustadas automáticamente a <span className="font-bold">{intelligentTarget.calories} kcal</span> para completar perfectamente tus macros del día.
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-neutral-800">Mejores Opciones para Ti</h2>
              </div>
              <p className="text-xs text-neutral-600 mb-4 pl-7">
                {mealType === 'dinner' 
                  ? `Escaladas automáticamente a ${intelligentTarget.calories} kcal`
                  : 'Las 3 opciones que mejor se ajustan a tus objetivos y preferencias alimentarias'
                }
              </p>
              <div className="space-y-4">
                {top3Recommended.map((scoredMeal, index) => 
                  renderMealCard(scoredMeal, true, index + 1)
                )}
              </div>
            </div>

            {/* Resto de comidas */}
            {restOfMeals.length > 0 && (
              <div>
                <h2 className="font-bold text-neutral-800 mb-4">Más Opciones</h2>
                <div className="space-y-3">
                  {restOfMeals.map((scoredMeal) => 
                    renderMealCard(scoredMeal, false)
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {(showFavoritesOnly || selectedCategory === 'custom' || searchQuery) && (
          <div className="space-y-3">
            {displayMeals.length > 0 ? (
              displayMeals.map((scoredMeal) => renderMealCard(scoredMeal, false))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-neutral-500">
                  {searchQuery 
                    ? 'No se encontraron comidas con esa búsqueda'
                    : showFavoritesOnly
                    ? 'Aún no tienes platos favoritos. ¡Dale ❤️ a tus comidas preferidas!'
                    : 'Aún no has creado platos personalizados'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Filtro por Ingredientes */}
      {showIngredientFilter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl mb-1">Filtrar por Ingredientes</h2>
                  <p className="text-blue-100 text-sm">
                    Selecciona los ingredientes que quieres en tu comida
                  </p>
                </div>
                <button
                  onClick={() => setShowIngredientFilter(false)}
                  className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-white/20 rounded-xl px-4 py-2 mt-4">
                <p className="text-sm">
                  {selectedIngredients.length === 0 
                    ? 'Ningún ingrediente seleccionado' 
                    : `${selectedIngredients.length} ingrediente${selectedIngredients.length > 1 ? 's' : ''} seleccionado${selectedIngredients.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allIngredients.map(ingredient => (
                  <button
                    key={ingredient}
                    onClick={() => toggleIngredient(ingredient)}
                    className={`px-4 py-3 rounded-xl text-sm transition-all border-2 text-left ${ 
                      selectedIngredients.includes(ingredient)
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedIngredients.includes(ingredient) && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="capitalize">{ingredient}</span>
                    </div>
                  </button>
                ))}
              </div>

              {allIngredients.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-neutral-500">
                    No hay ingredientes disponibles para este tipo de comida
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex gap-3">
              <button
                onClick={clearIngredientFilters}
                className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-xl hover:bg-neutral-300 transition-all font-medium"
              >
                Limpiar Todo
              </button>
              <button
                onClick={() => setShowIngredientFilter(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ ELIMINADO: Modal de selección de porción - ahora la selección es directa y automática */}

      {/* ❌ ELIMINADO: Modal de complementos - ya no es necesario con el sistema automático */}
    </div>
  );
}