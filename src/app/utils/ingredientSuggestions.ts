import { Ingredient, MealType, User } from '../types';

// Sugerencias de ingredientes según el tipo de comida
export const getSuggestedIngredientsByMealType = (
  mealType: MealType | MealType[],
  allIngredients: Ingredient[]
): Ingredient[] => {
  const types = Array.isArray(mealType) ? mealType : [mealType];
  
  // Mapeo de categorías de ingredientes por tipo de comida
  const mealTypeCategories: { [key in MealType]: string[] } = {
    breakfast: [
      // Cereales y granos
      'Avena', 'Pan integral', 'Pan blanco', 'Cereales integrales', 'Arroz integral',
      // Lácteos
      'Leche desnatada', 'Leche entera', 'Yogur griego', 'Yogur natural', 'Queso fresco', 'Requesón',
      // Frutas
      'Plátano', 'Manzana', 'Fresas', 'Arándanos', 'Naranja',
      // Proteínas ligeras
      'Huevos', 'Jamón de pavo', 'Proteína en polvo',
      // Grasas saludables
      'Mantequilla de cacahuete', 'Almendras', 'Nueces'
    ],
    lunch: [
      // Proteínas principales
      'Pechuga de pollo', 'Pechuga de pavo', 'Ternera magra', 'Cerdo magro',
      'Salmón', 'Atún', 'Merluza', 'Dorada',
      'Lentejas', 'Garbanzos', 'Tofu',
      // Carbohidratos
      'Arroz integral', 'Arroz blanco', 'Pasta integral', 'Pasta blanca', 'Patata', 'Boniato',
      // Verduras
      'Brócoli', 'Espinacas', 'Zanahoria', 'Tomate', 'Pimiento', 'Calabacín', 'Lechuga',
      // Grasas
      'Aceite de oliva', 'Aguacate'
    ],
    snack: [
      // Snacks saludables
      'Frutas', 'Yogur griego', 'Yogur natural', 'Queso fresco',
      'Almendras', 'Nueces', 'Cacahuetes',
      'Pan integral', 'Avena', 'Proteína en polvo',
      'Plátano', 'Manzana', 'Fresas',
      'Jamón de pavo', 'Atún'
    ],
    dinner: [
      // Proteínas (énfasis en digestión ligera)
      'Pescados': ['Salmón', 'Atún', 'Merluza', 'Dorada', 'Bacalao'],
      'Pechuga de pollo', 'Pechuga de pavo', 'Huevos',
      'Tofu', 'Requesón', 'Yogur griego',
      // Verduras (énfasis en fibra)
      'Brócoli', 'Espinacas', 'Espárragos', 'Calabacín', 'Pimiento', 'Champiñones', 'Lechuga',
      // Carbohidratos ligeros
      'Boniato', 'Calabaza', 'Arroz integral',
      // Grasas saludables
      'Aceite de oliva', 'Aguacate', 'Nueces', 'Almendras'
    ]
  };

  const suggestedNames = new Set<string>();
  types.forEach(type => {
    mealTypeCategories[type].forEach(name => {
      if (typeof name === 'string') {
        suggestedNames.add(name);
      }
    });
  });

  // Filtrar ingredientes que coincidan con las sugerencias
  return allIngredients.filter(ingredient => {
    return Array.from(suggestedNames).some(suggestedName =>
      ingredient.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
      suggestedName.toLowerCase().includes(ingredient.name.toLowerCase())
    );
  });
};

// Obtener ingredientes más usados por el usuario
export const getMostUsedIngredients = (
  user: User,
  allIngredients: Ingredient[],
  limit: number = 10
): Ingredient[] => {
  if (!user.ingredientUsageHistory || Object.keys(user.ingredientUsageHistory).length === 0) {
    return [];
  }

  // Ordenar por uso (de mayor a menor)
  const sortedByUsage = Object.entries(user.ingredientUsageHistory)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
    .map(([id]) => id);

  // Devolver ingredientes ordenados por uso
  return sortedByUsage
    .map(id => allIngredients.find(ing => ing.id === id))
    .filter((ing): ing is Ingredient => ing !== undefined);
};

// Sugerir ingredientes según balance de macros actual
export const suggestIngredientsForBalance = (
  currentMacros: { protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[],
  limit: number = 10
): Ingredient[] => {
  // Calcular el ratio de macros actual (de 0 a 1)
  const total = currentMacros.protein + currentMacros.carbs + currentMacros.fat;
  
  if (total === 0) {
    // Si no hay nada, sugerir proteínas balanceadas
    return allIngredients
      .filter(ing => ing.protein > 15) // Alto en proteína
      .sort((a, b) => b.protein - a.protein)
      .slice(0, limit);
  }

  const currentRatios = {
    protein: currentMacros.protein / total,
    carbs: currentMacros.carbs / total,
    fat: currentMacros.fat / total
  };

  // Identificar qué macro está más bajo
  const lowestMacro = Object.entries(currentRatios).sort(([, a], [, b]) => a - b)[0][0] as 'protein' | 'carbs' | 'fat';

  // Sugerir ingredientes altos en el macro que falta
  const suggestions = allIngredients.map(ingredient => {
    const ingredientTotal = ingredient.protein + ingredient.carbs + ingredient.fat;
    const ingredientRatio = ingredient[lowestMacro] / ingredientTotal;
    
    return {
      ingredient,
      score: ingredientRatio
    };
  });

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.ingredient);
};

// Obtener ingredientes favoritos del usuario
export const getFavoriteIngredients = (
  user: User,
  allIngredients: Ingredient[]
): Ingredient[] => {
  if (!user.favoriteIngredientIds || user.favoriteIngredientIds.length === 0) {
    return [];
  }

  return user.favoriteIngredientIds
    .map(id => allIngredients.find(ing => ing.id === id))
    .filter((ing): ing is Ingredient => ing !== undefined);
};

// Actualizar el historial de uso de un ingrediente
export const updateIngredientUsage = (
  user: User,
  ingredientId: string
): User => {
  const currentHistory = user.ingredientUsageHistory || {};
  const currentCount = currentHistory[ingredientId] || 0;

  return {
    ...user,
    ingredientUsageHistory: {
      ...currentHistory,
      [ingredientId]: currentCount + 1
    }
  };
};

// Toggle favorito
export const toggleFavoriteIngredient = (
  user: User,
  ingredientId: string
): User => {
  const currentFavorites = user.favoriteIngredientIds || [];
  const isFavorite = currentFavorites.includes(ingredientId);

  return {
    ...user,
    favoriteIngredientIds: isFavorite
      ? currentFavorites.filter(id => id !== ingredientId)
      : [...currentFavorites, ingredientId]
  };
};

// Obtener sugerencias combinadas (inteligentes)
export const getSmartSuggestions = (
  user: User,
  mealType: MealType | MealType[],
  currentMacros: { protein: number; carbs: number; fat: number },
  allIngredients: Ingredient[]
): {
  byMealType: Ingredient[];
  mostUsed: Ingredient[];
  forBalance: Ingredient[];
  favorites: Ingredient[];
  combined: Ingredient[];
} => {
  const byMealType = getSuggestedIngredientsByMealType(mealType, allIngredients);
  const mostUsed = getMostUsedIngredients(user, allIngredients, 8);
  const forBalance = suggestIngredientsForBalance(currentMacros, allIngredients, 8);
  const favorites = getFavoriteIngredients(user, allIngredients);

  // Combinar todas las sugerencias con un sistema de puntuación
  const scoreMap = new Map<string, number>();

  // Favoritos tienen máxima prioridad
  favorites.forEach(ing => {
    scoreMap.set(ing.id, (scoreMap.get(ing.id) || 0) + 10);
  });

  // Más usados tienen alta prioridad
  mostUsed.forEach((ing, index) => {
    scoreMap.set(ing.id, (scoreMap.get(ing.id) || 0) + (8 - index));
  });

  // Por tipo de comida tienen prioridad media
  byMealType.forEach(ing => {
    scoreMap.set(ing.id, (scoreMap.get(ing.id) || 0) + 5);
  });

  // Balance de macros tiene prioridad baja (complementaria)
  forBalance.forEach(ing => {
    scoreMap.set(ing.id, (scoreMap.get(ing.id) || 0) + 3);
  });

  // Ordenar por puntuación
  const combined = Array.from(scoreMap.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([id]) => allIngredients.find(ing => ing.id === id))
    .filter((ing): ing is Ingredient => ing !== undefined)
    .slice(0, 12);

  return {
    byMealType: byMealType.slice(0, 8),
    mostUsed,
    forBalance,
    favorites,
    combined
  };
};
