// Complementos rápidos para ajustar macros
export interface Complement {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number; // gramos
  category: 'protein' | 'carbs' | 'fat' | 'balanced';
  description: string;
}

export const complements: Complement[] = [
  // PROTEÍNA
  {
    id: 'yogurt-greek',
    name: 'Yogur Griego',
    emoji: '🥛',
    calories: 100,
    protein: 10,
    carbs: 4,
    fat: 5,
    amount: 100,
    category: 'protein',
    description: 'Alto en proteína, bajo en carbos'
  },
  {
    id: 'egg-boiled',
    name: 'Huevo Cocido',
    emoji: '🥚',
    calories: 78,
    protein: 6,
    carbs: 0.6,
    fat: 5,
    amount: 50,
    category: 'protein',
    description: 'Proteína completa y saciante'
  },
  {
    id: 'protein-powder',
    name: 'Batido de Proteína',
    emoji: '🥤',
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 1.5,
    amount: 30,
    category: 'protein',
    description: 'Máxima proteína, mínimas calorías'
  },
  {
    id: 'tuna-can',
    name: 'Lata de Atún',
    emoji: '🐟',
    calories: 116,
    protein: 26,
    carbs: 0,
    fat: 1,
    amount: 100,
    category: 'protein',
    description: 'Proteína magra pura'
  },
  {
    id: 'cottage-cheese',
    name: 'Queso Cottage',
    emoji: '🧀',
    calories: 98,
    protein: 11,
    carbs: 3,
    fat: 4,
    amount: 100,
    category: 'protein',
    description: 'Bajo en grasa, alto en proteína'
  },

  // CARBOHIDRATOS
  {
    id: 'banana',
    name: 'Plátano',
    emoji: '🍌',
    calories: 89,
    protein: 1,
    carbs: 23,
    fat: 0.3,
    amount: 100,
    category: 'carbs',
    description: 'Energía rápida natural'
  },
  {
    id: 'apple',
    name: 'Manzana',
    emoji: '🍎',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    amount: 100,
    category: 'carbs',
    description: 'Baja en calorías, rica en fibra'
  },
  {
    id: 'oats',
    name: 'Avena Instantánea',
    emoji: '🥣',
    calories: 68,
    protein: 2.4,
    carbs: 12,
    fat: 1.4,
    amount: 20,
    category: 'carbs',
    description: 'Carbohidratos de liberación lenta'
  },
  {
    id: 'rice-cake',
    name: 'Tortitas de Arroz',
    emoji: '🍘',
    calories: 35,
    protein: 0.7,
    carbs: 7,
    fat: 0.3,
    amount: 9,
    category: 'carbs',
    description: 'Ligeras y crujientes'
  },
  {
    id: 'sweet-potato',
    name: 'Boniato Cocido',
    emoji: '🍠',
    calories: 90,
    protein: 2,
    carbs: 21,
    fat: 0.2,
    amount: 100,
    category: 'carbs',
    description: 'Carbohidratos complejos'
  },
  {
    id: 'dates',
    name: 'Dátiles',
    emoji: '🫐',
    calories: 66,
    protein: 0.4,
    carbs: 18,
    fat: 0.1,
    amount: 24,
    category: 'carbs',
    description: 'Dulce natural y energético'
  },

  // GRASAS SALUDABLES
  {
    id: 'almonds',
    name: 'Almendras',
    emoji: '🥜',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    amount: 28,
    category: 'fat',
    description: 'Grasas saludables y saciantes'
  },
  {
    id: 'walnuts',
    name: 'Nueces',
    emoji: '🌰',
    calories: 185,
    protein: 4.3,
    carbs: 3.9,
    fat: 18.5,
    amount: 28,
    category: 'fat',
    description: 'Omega-3 vegetal'
  },
  {
    id: 'avocado',
    name: 'Aguacate',
    emoji: '🥑',
    calories: 80,
    protein: 1,
    carbs: 4,
    fat: 7,
    amount: 50,
    category: 'fat',
    description: 'Grasas monoinsaturadas'
  },
  {
    id: 'peanut-butter',
    name: 'Crema de Cacahuete',
    emoji: '🥜',
    calories: 94,
    protein: 4,
    carbs: 3,
    fat: 8,
    amount: 15,
    category: 'fat',
    description: 'Energético y proteico'
  },
  {
    id: 'olive-oil',
    name: 'Aceite de Oliva',
    emoji: '🫒',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    amount: 14,
    category: 'fat',
    description: 'Grasa saludable pura'
  },

  // BALANCEADOS
  {
    id: 'protein-bar',
    name: 'Barrita Proteica',
    emoji: '🍫',
    calories: 200,
    protein: 20,
    carbs: 22,
    fat: 6,
    amount: 60,
    category: 'balanced',
    description: 'Snack completo y conveniente'
  },
  {
    id: 'greek-yogurt-honey',
    name: 'Yogur + Miel',
    emoji: '🍯',
    calories: 150,
    protein: 10,
    carbs: 20,
    fat: 5,
    amount: 120,
    category: 'balanced',
    description: 'Dulce y nutritivo'
  },
  {
    id: 'trail-mix',
    name: 'Mix de Frutos Secos',
    emoji: '🥜',
    calories: 140,
    protein: 4,
    carbs: 13,
    fat: 9,
    amount: 28,
    category: 'balanced',
    description: 'Energía rápida y duradera'
  }
];

/**
 * Obtiene complementos sugeridos según el déficit de macros
 */
export function getSuggestedComplements(deficit: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): Complement[] {
  const suggestions: Complement[] = [];

  // Priorizar según el déficit más grande
  const proteinDeficit = deficit.protein;
  const carbsDeficit = deficit.carbs;
  const fatDeficit = deficit.fat;

  // Si falta mucha proteína (>10g)
  if (proteinDeficit > 10) {
    suggestions.push(
      complements.find(c => c.id === 'protein-powder')!,
      complements.find(c => c.id === 'yogurt-greek')!,
      complements.find(c => c.id === 'tuna-can')!
    );
  } else if (proteinDeficit > 5) {
    suggestions.push(
      complements.find(c => c.id === 'yogurt-greek')!,
      complements.find(c => c.id === 'egg-boiled')!,
      complements.find(c => c.id === 'cottage-cheese')!
    );
  }

  // Si faltan carbohidratos (>15g)
  if (carbsDeficit > 15) {
    suggestions.push(
      complements.find(c => c.id === 'banana')!,
      complements.find(c => c.id === 'oats')!,
      complements.find(c => c.id === 'sweet-potato')!
    );
  } else if (carbsDeficit > 10) {
    suggestions.push(
      complements.find(c => c.id === 'apple')!,
      complements.find(c => c.id === 'rice-cake')!,
      complements.find(c => c.id === 'dates')!
    );
  }

  // Si faltan grasas (>8g)
  if (fatDeficit > 8) {
    suggestions.push(
      complements.find(c => c.id === 'almonds')!,
      complements.find(c => c.id === 'avocado')!,
      complements.find(c => c.id === 'peanut-butter')!
    );
  } else if (fatDeficit > 5) {
    suggestions.push(
      complements.find(c => c.id === 'walnuts')!,
      complements.find(c => c.id === 'olive-oil')!
    );
  }

  // Si faltan solo calorías pero los macros están OK
  if (deficit.calories > 100 && proteinDeficit < 5 && carbsDeficit < 10 && fatDeficit < 5) {
    suggestions.push(
      complements.find(c => c.id === 'protein-bar')!,
      complements.find(c => c.id === 'trail-mix')!,
      complements.find(c => c.id === 'greek-yogurt-honey')!
    );
  }

  // Eliminar duplicados y devolver máximo 6 sugerencias
  return [...new Set(suggestions)].filter(Boolean).slice(0, 6);
}
