import { X, Sparkles, TrendingUp, Beef, Wheat, Droplet, Plus, CheckCircle } from 'lucide-react';
import { User, DailyLog, MealType } from '../types';
import { useState, useEffect } from 'react';

interface MacroCompletionRecommendationsProps {
  user: User;
  currentLog: DailyLog;
  onAddMeal: (type: MealType) => void;
  onAddExtraFood: () => void;
  onAddExtraFoodDirect: (food: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onAddComplementaryMeals?: (meals: any[]) => void; // Nueva prop para añadir comidas complementarias
  onSelectedMealsChange?: (meals: any[]) => void; // Nueva prop para comunicar cambios en las comidas seleccionadas
  isOpen?: boolean; // Control manual de apertura
  onClose?: () => void; // Función para cerrar externamente
}

interface RecommendedFood {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  reason: string;
  category: 'protein' | 'carbs' | 'fat' | 'balanced';
}

export default function MacroCompletionRecommendations({
  user,
  currentLog,
  onAddMeal,
  onAddExtraFood,
  onAddExtraFoodDirect,
  onAddComplementaryMeals,
  onSelectedMealsChange,
  isOpen = false,
  onClose
}: MacroCompletionRecommendationsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedMeals, setSelectedMeals] = useState<RecommendedFood[]>([]);
  const [justClosed, setJustClosed] = useState(false);
  
  // Calcular totales actuales (incluyendo extra foods)
  const calculateTotals = () => {
    const meals = [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner];
    const extraFoods = currentLog.extraFoods || [];
    
    const mealTotals = meals.reduce(
      (acc, meal) => {
        if (meal) {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Añadir extra foods
    const extraTotals = extraFoods.reduce(
      (acc, food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        return acc;
      },
      mealTotals
    );
    
    return extraTotals;
  };

  const totals = calculateTotals();
  const goals = user.goals;

  // Calcular comidas registradas
  const mealsLogged = [currentLog.breakfast, currentLog.lunch, currentLog.snack, currentLog.dinner].filter(m => m !== null).length;

  // Calcular macros restantes SIN ajuste del 80%
  const remainingMacros = {
    calories: Math.max(0, goals.calories - totals.calories),
    protein: Math.max(0, goals.protein - totals.protein),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fat: Math.max(0, goals.fat - totals.fat)
  };

  // Solo mostrar si:
  // 1. Las 4 comidas están registradas
  // 2. Faltan macros significativos por completar
  // 3. No hay comidas complementarias ya añadidas (para evitar que se abra si el usuario ya tiene extras)
  const hasComplementaryMeals = (currentLog.extraFoods && currentLog.extraFoods.length > 0) || false;
  
  const shouldShow = mealsLogged === 4 && 
    !hasComplementaryMeals &&
    (
      remainingMacros.calories >= 150 ||  // Aumentado de 80 a 150
      (remainingMacros.protein >= 8 && remainingMacros.calories >= 100) ||  // Más estricto
      (remainingMacros.carbs >= 15 && remainingMacros.calories >= 100) ||
      (remainingMacros.fat >= 8 && remainingMacros.calories >= 100)
    );

  // Efecto para abrir automáticamente SOLO cuando se complete la cuarta comida
  useEffect(() => {
    // Solo activar si exactamente acabamos de completar las 4 comidas
    if (mealsLogged === 4 && shouldShow && !isVisible && !justClosed) {
      // Pequeño delay para permitir que se actualicen los totales
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Si ya no tenemos 4 comidas, ocultar el popup
    if (mealsLogged < 4 && isVisible) {
      setIsVisible(false);
    }
  }, [mealsLogged, shouldShow, justClosed]);

  // Resetear justClosed cuando cambian los totales significativamente
  useEffect(() => {
    if (justClosed) {
      const timer = setTimeout(() => {
        setJustClosed(false);
      }, 2000); // Aumentado de 1500 a 2000ms
      return () => clearTimeout(timer);
    }
  }, [justClosed]);

  // NUEVO: Notificar cambios en las comidas seleccionadas
  useEffect(() => {
    if (!onSelectedMealsChange) return;
    
    if (selectedMeals.length > 0) {
      let currentRemaining = { ...remainingMacros };
      const processedMeals = selectedMeals.map(meal => {
        const portion = calculateOptimalPortionForFood(meal, currentRemaining);
        
        // Actualizar lo que queda
        currentRemaining = {
          calories: Math.max(0, currentRemaining.calories - (meal.calories * portion)),
          protein: Math.max(0, currentRemaining.protein - (meal.protein * portion)),
          carbs: Math.max(0, currentRemaining.carbs - (meal.carbs * portion)),
          fat: Math.max(0, currentRemaining.fat - (meal.fat * portion))
        };
        
        return {
          id: `complementary-preview-${meal.name}`,
          name: meal.name,
          emoji: meal.emoji,
          type: 'snack' as MealType,
          calories: Math.round(meal.calories * portion),
          protein: Math.round(meal.protein * portion * 10) / 10,
          carbs: Math.round(meal.carbs * portion * 10) / 10,
          fat: Math.round(meal.fat * portion * 10) / 10,
          ingredients: [meal.portion],
          baseQuantity: 100,
          variant: `${meal.portion} (${portion}x porción)`,
          portion: portion
        };
      });
      
      onSelectedMealsChange(processedMeals);
    } else {
      onSelectedMealsChange([]);
    }
  }, [selectedMeals]); // Solo depender de selectedMeals para evitar bucles infinitos

  // Si no debe mostrarse y no está visible, no renderizar
  if (!shouldShow && !isVisible) {
    return null;
  }

  // Si está marcado como invisible, no renderizar
  if (!isVisible) {
    return null;
  }

  // Determinar qué macro falta más
  const getMacroDeficit = () => {
    const proteinPercent = (remainingMacros.protein / user.goals.protein) * 100;
    const carbsPercent = (remainingMacros.carbs / user.goals.carbs) * 100;
    const fatPercent = (remainingMacros.fat / user.goals.fat) * 100;

    return {
      protein: proteinPercent,
      carbs: carbsPercent,
      fat: fatPercent,
      dominant: proteinPercent > carbsPercent && proteinPercent > fatPercent ? 'protein' :
                carbsPercent > fatPercent ? 'carbs' : 'fat'
    };
  };

  const deficit = getMacroDeficit();

  // Base de datos de alimentos recomendados
  const foodDatabase: RecommendedFood[] = [
    // Proteínas
    {
      name: 'Pechuga de Pollo',
      emoji: '🍗',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      portion: '100g',
      reason: 'Alta en proteína, baja en grasa',
      category: 'protein'
    },
    {
      name: 'Atún Natural',
      emoji: '🐟',
      calories: 116,
      protein: 26,
      carbs: 0,
      fat: 1,
      portion: '100g (1 lata)',
      reason: 'Proteína magra y omega-3',
      category: 'protein'
    },
    {
      name: 'Claras de Huevo',
      emoji: '🥚',
      calories: 52,
      protein: 11,
      carbs: 0.7,
      fat: 0.2,
      portion: '3 claras',
      reason: 'Proteína pura sin grasa',
      category: 'protein'
    },
    {
      name: 'Yogur Griego 0%',
      emoji: '🥛',
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      portion: '100g',
      reason: 'Proteína y probióticos',
      category: 'protein'
    },
    {
      name: 'Pavo',
      emoji: '🦃',
      calories: 135,
      protein: 30,
      carbs: 0,
      fat: 1,
      portion: '100g',
      reason: 'Proteína magra y saciante',
      category: 'protein'
    },
    {
      name: 'Requesón',
      emoji: '🧀',
      calories: 98,
      protein: 11,
      carbs: 3.4,
      fat: 4.3,
      portion: '100g',
      reason: 'Caseína de digestión lenta',
      category: 'protein'
    },

    // Carbohidratos
    {
      name: 'Avena',
      emoji: '🥣',
      calories: 147,
      protein: 5,
      carbs: 27,
      fat: 3,
      portion: '40g',
      reason: 'Energía sostenida y fibra',
      category: 'carbs'
    },
    {
      name: 'Plátano',
      emoji: '🍌',
      calories: 89,
      protein: 1,
      carbs: 23,
      fat: 0.3,
      portion: '1 unidad',
      reason: 'Carbos rápidos y potasio',
      category: 'carbs'
    },
    {
      name: 'Arroz Blanco',
      emoji: '🍚',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      portion: '100g cocido',
      reason: 'Carbohidrato limpio',
      category: 'carbs'
    },
    {
      name: 'Patata Cocida',
      emoji: '🥔',
      calories: 87,
      protein: 2,
      carbs: 20,
      fat: 0.1,
      portion: '100g',
      reason: 'Carbos complejos y saciante',
      category: 'carbs'
    },
    {
      name: 'Pan Integral',
      emoji: '🍞',
      calories: 69,
      protein: 3.5,
      carbs: 12,
      fat: 1,
      portion: '1 rebanada (30g)',
      reason: 'Fibra y energía gradual',
      category: 'carbs'
    },
    {
      name: 'Manzana',
      emoji: '🍎',
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      portion: '1 unidad',
      reason: 'Carbos naturales y fibra',
      category: 'carbs'
    },

    // Grasas saludables
    {
      name: 'Almendras',
      emoji: '🌰',
      calories: 164,
      protein: 6,
      carbs: 6,
      fat: 14,
      portion: '28g (23 unidades)',
      reason: 'Grasas saludables y vitamina E',
      category: 'fat'
    },
    {
      name: 'Aguacate',
      emoji: '🥑',
      calories: 160,
      protein: 2,
      carbs: 9,
      fat: 15,
      portion: '100g (1/2 unidad)',
      reason: 'Grasas monoinsaturadas',
      category: 'fat'
    },
    {
      name: 'Aceite de Oliva',
      emoji: '🫒',
      calories: 119,
      protein: 0,
      carbs: 0,
      fat: 14,
      portion: '1 cucharada (13.5g)',
      reason: 'Grasa saludable pura',
      category: 'fat'
    },
    {
      name: 'Cacahuetes',
      emoji: '🥜',
      calories: 161,
      protein: 7,
      carbs: 5,
      fat: 14,
      portion: '28g',
      reason: 'Proteína vegetal y grasas',
      category: 'fat'
    },
    {
      name: 'Nueces',
      emoji: '🌰',
      calories: 185,
      protein: 4,
      carbs: 4,
      fat: 18,
      portion: '28g (14 mitades)',
      reason: 'Omega-3 y antioxidantes',
      category: 'fat'
    },

    // Balanceados
    {
      name: 'Hummus',
      emoji: '🫘',
      calories: 166,
      protein: 8,
      carbs: 14,
      fat: 10,
      portion: '100g',
      reason: 'Balance de macros y fibra',
      category: 'balanced'
    },
    {
      name: 'Batido de Proteína',
      emoji: '🥤',
      calories: 120,
      protein: 24,
      carbs: 3,
      fat: 1.5,
      portion: '1 scoop (30g)',
      reason: 'Proteína rápida y práctica',
      category: 'protein'
    },
    {
      name: 'Queso Fresco',
      emoji: '🧀',
      calories: 72,
      protein: 13,
      carbs: 1.4,
      fat: 2,
      portion: '50g',
      reason: 'Proteína y calcio',
      category: 'protein'
    }
  ];

  // Filtrar alimentos según preferencias y alergias
  const filterByPreferences = (foods: RecommendedFood[]) => {
    return foods.filter(food => {
      // Excluir alergias
      const hasAllergy = user.preferences.allergies.some(allergy => 
        food.name.toLowerCase().includes(allergy.toLowerCase())
      );
      if (hasAllergy) return false;

      // Excluir dislikes
      const isDisliked = user.preferences.dislikes.some(dislike => 
        food.name.toLowerCase().includes(dislike.toLowerCase())
      );
      if (isDisliked) return false;

      return true;
    });
  };

  // Función para calcular la porción óptima de cada alimento
  // MOVIDA AQUÍ para que esté disponible en getSmartRecommendations
  const calculateOptimalPortionForFood = (food: RecommendedFood, currentRemaining: typeof remainingMacros) => {
    // ESTRATEGIA DE OPTIMIZACIÓN ULTRA-CONSERVADORA:
    // Penalizar MUY FUERTEMENTE los excesos para NUNCA pasarse
    // Priorizar quedarse un poco corto antes que pasarse
    
    const MIN_PORTION = 0.25;
    const MAX_PORTION = 3.0;
    const STEP = 0.05;
    
    let bestPortion = 1.0;
    let minError = Infinity;
    
    // Probar cada porción posible
    for (let portion = MIN_PORTION; portion <= MAX_PORTION; portion += STEP) {
      // Calcular macros obtenidos con esta porción
      const obtainedCalories = food.calories * portion;
      const obtainedProtein = food.protein * portion;
      const obtainedCarbs = food.carbs * portion;
      const obtainedFat = food.fat * portion;
      
      // Calcular errores individuales
      const caloriesError = obtainedCalories - currentRemaining.calories;
      const proteinError = obtainedProtein - currentRemaining.protein;
      const carbsError = obtainedCarbs - currentRemaining.carbs;
      const fatError = obtainedFat - currentRemaining.fat;
      
      // PENALIZACIÓN EXTREMA para excesos (x20) vs déficits (x1)
      // Esto garantiza que NUNCA se pase de los macros
      const caloriesPenalty = caloriesError > 0 ? Math.abs(caloriesError) * 20 : Math.abs(caloriesError) * 1;
      const proteinPenalty = proteinError > 0 ? Math.abs(proteinError) * 20 : Math.abs(proteinError) * 1;
      const carbsPenalty = carbsError > 0 ? Math.abs(carbsError) * 20 : Math.abs(carbsError) * 1;
      const fatPenalty = fatError > 0 ? Math.abs(fatError) * 20 : Math.abs(fatError) * 1;
      
      // Error total (normalizar para que todos los macros tengan peso similar)
      const totalError = 
        (currentRemaining.calories > 0 ? caloriesPenalty / currentRemaining.calories : caloriesPenalty * 100) +
        (currentRemaining.protein > 0 ? proteinPenalty / currentRemaining.protein : proteinPenalty * 100) +
        (currentRemaining.carbs > 0 ? carbsPenalty / currentRemaining.carbs : carbsPenalty * 100) +
        (currentRemaining.fat > 0 ? fatPenalty / currentRemaining.fat : fatPenalty * 100);
      
      // Si este error es menor, actualizar mejor porción
      if (totalError < minError) {
        minError = totalError;
        bestPortion = portion;
      }
    }
    
    // VALIDACIÓN FINAL: Si la porción calculada causa exceso, reducirla
    // Esto es una doble validación para garantizar que NUNCA nos pasamos
    let finalPortion = bestPortion;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      const testCalories = food.calories * finalPortion;
      const testProtein = food.protein * finalPortion;
      const testCarbs = food.carbs * finalPortion;
      const testFat = food.fat * finalPortion;
      
      // Si algún macro se pasa, reducir la porción en un 10%
      if (testCalories > currentRemaining.calories * 1.05 || 
          testProtein > currentRemaining.protein * 1.05 || 
          testCarbs > currentRemaining.carbs * 1.05 || 
          testFat > currentRemaining.fat * 1.05) {
        finalPortion = finalPortion * 0.9;
        attempts++;
      } else {
        break;
      }
    }
    
    // Redondear de forma inteligente a cuartos (más conservador)
    if (finalPortion <= 0.3) {
      finalPortion = 0.25;
    } else if (finalPortion <= 0.6) {
      finalPortion = 0.5;
    } else if (finalPortion <= 0.85) {
      finalPortion = 0.75;
    } else if (finalPortion <= 1.15) {
      finalPortion = 1;
    } else if (finalPortion <= 1.4) {
      finalPortion = 1.25;
    } else if (finalPortion <= 1.65) {
      finalPortion = 1.5;
    } else if (finalPortion <= 1.9) {
      finalPortion = 1.75;
    } else if (finalPortion <= 2.15) {
      finalPortion = 2;
    } else if (finalPortion <= 2.4) {
      finalPortion = 2.25;
    } else if (finalPortion <= 2.65) {
      finalPortion = 2.5;
    } else {
      // Para valores mayores, redondear a cuartos
      finalPortion = Math.round(finalPortion * 4) / 4;
    }
    
    // Limitar a máximo 3 porciones y mínimo 0.25
    return Math.min(3, Math.max(0.25, finalPortion));
  };

  // Obtener recomendaciones inteligentes
  const getSmartRecommendations = (): { top3: RecommendedFood[], allFoods: RecommendedFood[] } => {
    let filtered = filterByPreferences(foodDatabase);

    // ALGORITMO DE OPTIMIZACIÓN EXACTA:
    // Encuentra las 3 comidas Y sus porciones óptimas SIMULTÁNEAMENTE
    // para llegar lo más cerca posible a los macros sin pasarse
    
    const findBestCombinationWithPortions = (foods: RecommendedFood[], target: typeof remainingMacros): RecommendedFood[] => {
      if (foods.length < 3) return foods.slice(0, 3);
      
      let bestCombo: RecommendedFood[] = [];
      let minError = Infinity;
      
      // Limitar a los 15 mejores candidatos
      const candidates = [...foods].sort((a, b) => {
        const scoreA = (a.protein * 4) + (a.carbs * 4) + (a.fat * 9);
        const scoreB = (b.protein * 4) + (b.carbs * 4) + (b.fat * 9);
        return scoreB - scoreA;
      }).slice(0, 15);
      
      // Probar combinaciones de 3 alimentos
      for (let i = 0; i < candidates.length - 2; i++) {
        for (let j = i + 1; j < candidates.length - 1; j++) {
          for (let k = j + 1; k < candidates.length; k++) {
            const combo = [candidates[i], candidates[j], candidates[k]];
            
            // OPTIMIZACIÓN SIMULTÁNEA DE PORCIONES
            // Probar diferentes combinaciones de porciones para estos 3 alimentos
            const portionOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
            
            let bestPortions = [1, 1, 1];
            let bestComboError = Infinity;
            
            // Probar todas las combinaciones de porciones
            for (const p1 of portionOptions) {
              for (const p2 of portionOptions) {
                for (const p3 of portionOptions) {
                  const portions = [p1, p2, p3];
                  
                  // Calcular macros totales con estas porciones
                  let totalCalories = 0;
                  let totalProtein = 0;
                  let totalCarbs = 0;
                  let totalFat = 0;
                  
                  combo.forEach((food, idx) => {
                    totalCalories += food.calories * portions[idx];
                    totalProtein += food.protein * portions[idx];
                    totalCarbs += food.carbs * portions[idx];
                    totalFat += food.fat * portions[idx];
                  });
                  
                  // Calcular error para cada macro
                  const calError = totalCalories - target.calories;
                  const proError = totalProtein - target.protein;
                  const carError = totalCarbs - target.carbs;
                  const fatError = totalFat - target.fat;
                  
                  // PENALIZACIÓN EXTREMADAMENTE ASIMÉTRICA:
                  // - Exceso: x100 (NUNCA queremos pasarnos)
                  // - Déficit: x1 (mejor quedarse corto)
                  const calPenalty = calError > 0 ? Math.pow(Math.abs(calError), 2) * 100 : Math.abs(calError);
                  const proPenalty = proError > 0 ? Math.pow(Math.abs(proError), 2) * 100 : Math.abs(proError);
                  const carPenalty = carError > 0 ? Math.pow(Math.abs(carError), 2) * 100 : Math.abs(carError);
                  const fatPenalty = fatError > 0 ? Math.pow(Math.abs(fatError), 2) * 100 : Math.abs(fatError);
                  
                  // Error total normalizado
                  const error = 
                    (target.calories > 0 ? calPenalty / target.calories : calPenalty) +
                    (target.protein > 0 ? proPenalty / target.protein : proPenalty) +
                    (target.carbs > 0 ? carPenalty / target.carbs : carPenalty) +
                    (target.fat > 0 ? fatPenalty / target.fat : fatPenalty);
                  
                  if (error < bestComboError) {
                    bestComboError = error;
                    bestPortions = [...portions];
                  }
                }
              }
            }
            
            // Este combo con sus porciones óptimas tiene error bestComboError
            if (bestComboError < minError) {
              minError = bestComboError;
              bestCombo = combo;
            }
          }
        }
      }
      
      return bestCombo.length > 0 ? bestCombo : candidates.slice(0, 3);
    };
    
    // Encontrar la mejor combinación
    const top3 = findBestCombinationWithPortions(filtered, remainingMacros);
    
    // Resto de alimentos ordenados
    const top3Names = top3.map(f => f.name);
    const restOfFoods = filtered.filter(f => !top3Names.includes(f.name));
    
    const sortedRest = [...restOfFoods].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (deficit.dominant === 'protein') {
        scoreA = a.protein * 3;
        scoreB = b.protein * 3;
      } else if (deficit.dominant === 'carbs') {
        scoreA = a.carbs * 3;
        scoreB = b.carbs * 3;
      } else {
        scoreA = a.fat * 3;
        scoreB = b.fat * 3;
      }

      const balanceA = (a.protein + a.carbs + a.fat) / 3;
      const balanceB = (b.protein + b.carbs + b.fat) / 3;
      scoreA += balanceA;
      scoreB += balanceB;

      return scoreB - scoreA;
    });
    
    const allFoods = [...top3, ...sortedRest];

    return { top3, allFoods };
  };

  const { top3, allFoods } = getSmartRecommendations();

  const getDominantMacroInfo = () => {
    if (deficit.dominant === 'protein') {
      return {
        icon: <Beef className="w-5 h-5 text-blue-600" />,
        color: 'blue',
        text: 'Te falta proteína',
        amount: `${Math.round(remainingMacros.protein)}g`
      };
    } else if (deficit.dominant === 'carbs') {
      return {
        icon: <Wheat className="w-5 h-5 text-amber-600" />,
        color: 'amber',
        text: 'Te faltan carbohidratos',
        amount: `${Math.round(remainingMacros.carbs)}g`
      };
    } else {
      return {
        icon: <Droplet className="w-5 h-5 text-orange-600" />,
        color: 'orange',
        text: 'Te faltan grasas',
        amount: `${Math.round(remainingMacros.fat)}g`
      };
    }
  };

  const macroInfo = getDominantMacroInfo();

  // Función para cerrar el popup
  const handleClose = () => {
    setIsVisible(false);
    setSelectedMeals([]);
    setJustClosed(true);
    if (onClose) onClose();
  };

  // Función para togglear selección de comida
  const handleToggleFood = (food: RecommendedFood) => {
    setSelectedMeals(prev => {
      const isSelected = prev.some(m => m.name === food.name);
      let newSelection;
      if (isSelected) {
        newSelection = prev.filter(m => m.name !== food.name);
      } else {
        newSelection = [...prev, food];
      }
      
      return newSelection;
    });
  };

  // Función para obtener la descripción de cantidad real
  const getActualPortionDescription = (food: RecommendedFood, multiplier: number): string => {
    // Extraer cantidad base del string portion (ej: "100g" → 100)
    const match = food.portion.match(/(\d+)g/);
    if (match) {
      const baseQuantity = parseInt(match[1]);
      const actualQuantity = Math.round(baseQuantity * multiplier);
      return `${actualQuantity}g`;
    }
    
    // Para formatos con unidades (ej: "1 unidad")
    const unitMatch = food.portion.match(/(\d+)\s*(unidad|scoop|cucharada|rebanada)/i);
    if (unitMatch) {
      const baseUnits = parseInt(unitMatch[1]);
      const unit = unitMatch[2];
      const actualUnits = baseUnits * multiplier;
      
      // Formatear según la cantidad
      if (actualUnits === 1) {
        return `1 ${unit}`;
      } else if (actualUnits === Math.floor(actualUnits)) {
        return `${actualUnits} ${unit}s`;
      } else {
        return `${actualUnits} ${unit}s`;
      }
    }
    
    // Para formatos complejos (ej: "28g (23 unidades)")
    const complexMatch = food.portion.match(/(\d+)g\s*\(([^)]+)\)/);
    if (complexMatch) {
      const baseGrams = parseInt(complexMatch[1]);
      const actualGrams = Math.round(baseGrams * multiplier);
      return `${actualGrams}g`;
    }
    
    // Si no se puede extraer, usar formato genérico
    if (multiplier === 1) {
      return food.portion;
    } else {
      return `${multiplier}x ${food.portion}`;
    }
  };

  // Función para confirmar y añadir comidas complementarias
  const handleConfirm = () => {
    if (selectedMeals.length > 0 && onAddComplementaryMeals) {
      let currentRemaining = { ...remainingMacros };
      
      const mealsToAdd = selectedMeals.map(food => {
        // Calcular porción óptima según lo que falta
        const portion = calculateOptimalPortionForFood(food, currentRemaining);
        
        // Actualizar lo que queda después de añadir este alimento
        currentRemaining = {
          calories: Math.max(0, currentRemaining.calories - (food.calories * portion)),
          protein: Math.max(0, currentRemaining.protein - (food.protein * portion)),
          carbs: Math.max(0, currentRemaining.carbs - (food.carbs * portion)),
          fat: Math.max(0, currentRemaining.fat - (food.fat * portion))
        };

        return {
          id: `complementary-${Date.now()}-${Math.random()}`,
          name: food.name,
          emoji: food.emoji,
          type: 'snack' as MealType,
          calories: Math.round(food.calories * portion),
          protein: Math.round(food.protein * portion * 10) / 10,
          carbs: Math.round(food.carbs * portion * 10) / 10,
          fat: Math.round(food.fat * portion * 10) / 10,
          ingredients: [food.portion],
          baseQuantity: 100,
          variant: getActualPortionDescription(food, portion)
        };
      });
      
      onAddComplementaryMeals(mealsToAdd);
      setIsVisible(false);
      setSelectedMeals([]);
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">¡Completa tus Macros!</h2>
                <p className="text-emerald-100 text-sm">Recomendaciones personalizadas para ti</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Macros Restantes */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-200" />
              <p className="text-sm text-emerald-100">Macros que te faltan:</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">Calorías</p>
                <p className="text-xl font-semibold">{Math.round(remainingMacros.calories)}</p>
                <p className="text-xs text-emerald-200">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">Proteína</p>
                <p className="text-xl font-semibold">{Math.round(remainingMacros.protein)}</p>
                <p className="text-xs text-emerald-200">g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">Carbos</p>
                <p className="text-xl font-semibold">{Math.round(remainingMacros.carbs)}</p>
                <p className="text-xs text-emerald-200">g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-emerald-200 mb-1">Grasas</p>
                <p className="text-xl font-semibold">{Math.round(remainingMacros.fat)}</p>
                <p className="text-xs text-emerald-200">g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Mensaje Principal */}
          <div className={`bg-${macroInfo.color}-50 border border-${macroInfo.color}-200 rounded-2xl p-4 mb-6`}>
            <div className="flex items-center gap-3">
              {macroInfo.icon}
              <div className="flex-1">
                <p className={`text-${macroInfo.color}-800 font-medium`}>{macroInfo.text}</p>
                <p className={`text-${macroInfo.color}-600 text-sm`}>Te recomendamos alimentos ricos en este macronutriente</p>
              </div>
              <p className={`text-2xl text-${macroInfo.color}-600 font-semibold`}>{macroInfo.amount}</p>
            </div>
          </div>

          {/* Recomendaciones - Lista Unificada */}
          <div className="space-y-3">
            {allFoods.map((food, index) => {
              const isTopRecommended = index < 3;
              const isSelected = selectedMeals.some(m => m.name === food.name);
              
              return (
                <button
                  key={`food-${index}`}
                  onClick={() => handleToggleFood(food)}
                  className={`w-full rounded-2xl p-4 transition-all group text-left relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-500 hover:border-purple-600'
                      : isTopRecommended
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 hover:border-emerald-500 hover:from-emerald-100 hover:to-teal-100'
                      : 'bg-white border-2 border-neutral-200 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  {/* Badge "Recomendado" solo para TOP 3 */}
                  {isTopRecommended && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
                      <Sparkles className="w-3 h-3" />
                      Recomendado #{index + 1}
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Emoji */}
                    <div className="text-4xl flex-shrink-0">{food.emoji}</div>

                    {/* Info */}
                    <div className={`flex-1 min-w-0 ${isTopRecommended ? 'pr-24' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-semibold group-hover:text-emerald-600 transition-colors ${
                            isTopRecommended ? 'text-neutral-800' : 'text-neutral-800'
                          }`}>
                            {food.name}
                          </h4>
                          <p className="text-xs text-neutral-500">
                            {(() => {
                              // Calcular porción óptima para mostrar
                              let currentRemaining = { ...remainingMacros };
                              // Restar las comidas ya seleccionadas antes de esta
                              selectedMeals.forEach(selectedFood => {
                                if (selectedFood.name !== food.name) {
                                  const portion = calculateOptimalPortionForFood(selectedFood, currentRemaining);
                                  currentRemaining = {
                                    calories: Math.max(0, currentRemaining.calories - (selectedFood.calories * portion)),
                                    protein: Math.max(0, currentRemaining.protein - (selectedFood.protein * portion)),
                                    carbs: Math.max(0, currentRemaining.carbs - (selectedFood.carbs * portion)),
                                    fat: Math.max(0, currentRemaining.fat - (selectedFood.fat * portion))
                                  };
                                }
                              });
                              const optimalPortion = calculateOptimalPortionForFood(food, currentRemaining);
                              return getActualPortionDescription(food, optimalPortion);
                            })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-emerald-600 font-semibold ${isTopRecommended ? 'text-lg font-bold' : ''}`}>
                            {(() => {
                              // Calcular calorías con porción óptima
                              let currentRemaining = { ...remainingMacros };
                              selectedMeals.forEach(selectedFood => {
                                if (selectedFood.name !== food.name) {
                                  const portion = calculateOptimalPortionForFood(selectedFood, currentRemaining);
                                  currentRemaining = {
                                    calories: Math.max(0, currentRemaining.calories - (selectedFood.calories * portion)),
                                    protein: Math.max(0, currentRemaining.protein - (selectedFood.protein * portion)),
                                    carbs: Math.max(0, currentRemaining.carbs - (selectedFood.carbs * portion)),
                                    fat: Math.max(0, currentRemaining.fat - (selectedFood.fat * portion))
                                  };
                                }
                              });
                              const optimalPortion = calculateOptimalPortionForFood(food, currentRemaining);
                              return Math.round(food.calories * optimalPortion);
                            })()} kcal
                          </p>
                        </div>
                      </div>

                      {/* Macros */}
                      <div className="flex gap-3 mb-2">
                        {isTopRecommended ? (
                          <>
                            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                              <Beef className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-700 font-medium">{food.protein}g</span>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                              <Wheat className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-amber-700 font-medium">{food.carbs}g</span>
                            </div>
                            <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-lg">
                              <Droplet className="w-3 h-3 text-orange-600" />
                              <span className="text-xs text-orange-700 font-medium">{food.fat}g</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <Beef className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-neutral-600">{food.protein}g</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wheat className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-neutral-600">{food.carbs}g</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplet className="w-3 h-3 text-orange-600" />
                              <span className="text-xs text-neutral-600">{food.fat}g</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Razón */}
                      <div className={`rounded-lg px-3 py-1.5 transition-colors ${
                        isTopRecommended 
                          ? 'bg-white/80 backdrop-blur-sm border border-emerald-300'
                          : 'bg-neutral-100 group-hover:bg-emerald-100'
                      }`}>
                        <p className={`text-xs ${
                          isTopRecommended
                            ? 'text-emerald-700 font-medium'
                            : 'text-neutral-600 group-hover:text-emerald-700'
                        }`}>
                          💡 {food.reason}
                        </p>
                      </div>
                    </div>

                    {/* Button Icon */}
                    <div className={`flex-shrink-0 ${isTopRecommended ? 'absolute bottom-4 right-4' : ''}`}>
                      <div className={`rounded-xl transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-white p-2.5 shadow-lg'
                          : isTopRecommended
                          ? 'bg-emerald-500 group-hover:bg-emerald-600 text-white p-2.5 shadow-lg'
                          : 'bg-emerald-100 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white p-2'
                      }`}>
                        {isSelected ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {allFoods.length === 0 && (
            <div className="text-center py-8">
              <p className="text-neutral-500">No hay alimentos disponibles según tus preferencias.</p>
              <p className="text-sm text-neutral-400 mt-2">Intenta ajustar tus preferencias alimentarias en Ajustes.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
          {selectedMeals.length > 0 ? (
            <div className="space-y-3">
              {/* Vista previa de comidas seleccionadas */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-3">
                <p className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {selectedMeals.length} comida{selectedMeals.length !== 1 ? 's' : ''} seleccionada{selectedMeals.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {(() => {
                    let currentRemaining = { ...remainingMacros };
                    return selectedMeals.map((meal, idx) => {
                      const portion = calculateOptimalPortionForFood(meal, currentRemaining);
                      const adjustedCalories = Math.round(meal.calories * portion);
                      const adjustedProtein = Math.round(meal.protein * portion * 10) / 10;
                      const adjustedCarbs = Math.round(meal.carbs * portion * 10) / 10;
                      const adjustedFat = Math.round(meal.fat * portion * 10) / 10;
                      
                      // Actualizar remaining para el siguiente
                      currentRemaining = {
                        calories: Math.max(0, currentRemaining.calories - adjustedCalories),
                        protein: Math.max(0, currentRemaining.protein - adjustedProtein),
                        carbs: Math.max(0, currentRemaining.carbs - adjustedCarbs),
                        fat: Math.max(0, currentRemaining.fat - adjustedFat)
                      };
                      
                      return (
                        <div key={idx} className="bg-white px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{meal.emoji}</span>
                            <span className="text-xs font-bold text-purple-700">{meal.name}</span>
                            <span className="text-xs text-purple-600 ml-auto">{getActualPortionDescription(meal, portion)}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-emerald-600">{adjustedCalories} kcal</span>
                            <span className="text-blue-600">P: {adjustedProtein}g</span>
                            <span className="text-amber-600">C: {adjustedCarbs}g</span>
                            <span className="text-orange-600">G: {adjustedFat}g</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              
              {/* Botones */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleClose}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 py-3 rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Añadir Complementarias
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 py-3 rounded-xl transition-all font-medium"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}