export interface ExerciseData {
  id: string;
  name: string;
  category: string;
  equipment?: string;
}

export const muscleCategories = [
  { id: 'pecho', name: 'Pecho', icon: '💪' },
  { id: 'espalda', name: 'Espalda', icon: '🦾' },
  { id: 'hombros', name: 'Hombros', icon: '🏋️' },
  { id: 'biceps', name: 'Bíceps', icon: '💪' },
  { id: 'triceps', name: 'Tríceps', icon: '💪' },
  { id: 'piernas', name: 'Piernas', icon: '🦵' },
  { id: 'cuadriceps', name: 'Cuádriceps', icon: '🦵' },
  { id: 'isquiotibiales', name: 'Isquiotibiales', icon: '🦵' },
  { id: 'gluteos', name: 'Glúteos', icon: '🍑' },
  { id: 'pantorrillas', name: 'Pantorrillas', icon: '🦶' },
  { id: 'core', name: 'Abdominales', icon: '🔥' },
  { id: 'fullbody', name: 'Cuerpo Completo', icon: '🏆' }
];

export const exerciseDatabase: ExerciseData[] = [
  // PECHO
  { id: 'press-banca-plano', name: 'Press de Banca Plano', category: 'pecho', equipment: 'Barra' },
  { id: 'press-banca-inclinado', name: 'Press de Banca Inclinado', category: 'pecho', equipment: 'Barra' },
  { id: 'press-banca-declinado', name: 'Press de Banca Declinado', category: 'pecho', equipment: 'Barra' },
  { id: 'press-mancuernas-plano', name: 'Press con Mancuernas Plano', category: 'pecho', equipment: 'Mancuernas' },
  { id: 'press-mancuernas-inclinado', name: 'Press con Mancuernas Inclinado', category: 'pecho', equipment: 'Mancuernas' },
  { id: 'aperturas-mancuernas', name: 'Aperturas con Mancuernas', category: 'pecho', equipment: 'Mancuernas' },
  { id: 'aperturas-cables', name: 'Aperturas en Polea (Cables)', category: 'pecho', equipment: 'Polea' },
  { id: 'fondos-pecho', name: 'Fondos en Paralelas (Pecho)', category: 'pecho', equipment: 'Paralelas' },
  { id: 'peck-deck', name: 'Peck Deck (Contractor)', category: 'pecho', equipment: 'Máquina' },
  { id: 'press-maquina-pecho', name: 'Press en Máquina (Pecho)', category: 'pecho', equipment: 'Máquina' },
  { id: 'flexiones', name: 'Flexiones', category: 'pecho', equipment: 'Peso Corporal' },
  { id: 'pullover-mancuerna', name: 'Pullover con Mancuerna', category: 'pecho', equipment: 'Mancuernas' },

  // ESPALDA
  { id: 'dominadas', name: 'Dominadas', category: 'espalda', equipment: 'Peso Corporal' },
  { id: 'dominadas-agarre-supino', name: 'Dominadas Agarre Supino', category: 'espalda', equipment: 'Peso Corporal' },
  { id: 'remo-barra', name: 'Remo con Barra', category: 'espalda', equipment: 'Barra' },
  { id: 'remo-mancuerna', name: 'Remo con Mancuerna (1 Brazo)', category: 'espalda', equipment: 'Mancuernas' },
  { id: 'remo-polea-baja', name: 'Remo en Polea Baja', category: 'espalda', equipment: 'Polea' },
  { id: 'jalones-polea', name: 'Jalones en Polea Alta', category: 'espalda', equipment: 'Polea' },
  { id: 'jalones-agarre-cerrado', name: 'Jalones Agarre Cerrado', category: 'espalda', equipment: 'Polea' },
  { id: 'peso-muerto', name: 'Peso Muerto', category: 'espalda', equipment: 'Barra' },
  { id: 'peso-muerto-rumano', name: 'Peso Muerto Rumano', category: 'espalda', equipment: 'Barra' },
  { id: 'remo-t-barra', name: 'Remo en T', category: 'espalda', equipment: 'Barra' },
  { id: 'remo-maquina', name: 'Remo en Máquina', category: 'espalda', equipment: 'Máquina' },
  { id: 'pullover-polea', name: 'Pullover en Polea', category: 'espalda', equipment: 'Polea' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'espalda', equipment: 'Polea' },

  // HOMBROS
  { id: 'press-militar', name: 'Press Militar con Barra', category: 'hombros', equipment: 'Barra' },
  { id: 'press-mancuernas-hombro', name: 'Press con Mancuernas (Hombro)', category: 'hombros', equipment: 'Mancuernas' },
  { id: 'elevaciones-laterales', name: 'Elevaciones Laterales', category: 'hombros', equipment: 'Mancuernas' },
  { id: 'elevaciones-frontales', name: 'Elevaciones Frontales', category: 'hombros', equipment: 'Mancuernas' },
  { id: 'pajaros-hombro-posterior', name: 'Pájaros (Hombro Posterior)', category: 'hombros', equipment: 'Mancuernas' },
  { id: 'remo-al-menton', name: 'Remo al Mentón', category: 'hombros', equipment: 'Barra' },
  { id: 'press-arnold', name: 'Press Arnold', category: 'hombros', equipment: 'Mancuernas' },
  { id: 'elevaciones-cables', name: 'Elevaciones Laterales en Cables', category: 'hombros', equipment: 'Polea' },
  { id: 'press-maquina-hombro', name: 'Press en Máquina (Hombro)', category: 'hombros', equipment: 'Máquina' },

  // BÍCEPS
  { id: 'curl-barra', name: 'Curl con Barra', category: 'biceps', equipment: 'Barra' },
  { id: 'curl-barra-z', name: 'Curl con Barra Z', category: 'biceps', equipment: 'Barra' },
  { id: 'curl-mancuernas', name: 'Curl con Mancuernas', category: 'biceps', equipment: 'Mancuernas' },
  { id: 'curl-martillo', name: 'Curl Martillo', category: 'biceps', equipment: 'Mancuernas' },
  { id: 'curl-concentrado', name: 'Curl Concentrado', category: 'biceps', equipment: 'Mancuernas' },
  { id: 'curl-predicador', name: 'Curl en Banco Predicador', category: 'biceps', equipment: 'Barra' },
  { id: 'curl-polea', name: 'Curl en Polea', category: 'biceps', equipment: 'Polea' },
  { id: 'curl-inclinado', name: 'Curl Inclinado con Mancuernas', category: 'biceps', equipment: 'Mancuernas' },
  { id: 'curl-21s', name: 'Curl 21s', category: 'biceps', equipment: 'Barra' },

  // TRÍCEPS
  { id: 'press-banca-agarre-cerrado', name: 'Press Banca Agarre Cerrado', category: 'triceps', equipment: 'Barra' },
  { id: 'fondos-triceps', name: 'Fondos en Paralelas (Tríceps)', category: 'triceps', equipment: 'Paralelas' },
  { id: 'extension-triceps-polea', name: 'Extensión de Tríceps en Polea', category: 'triceps', equipment: 'Polea' },
  { id: 'extension-triceps-mancuerna', name: 'Extensión de Tríceps con Mancuerna', category: 'triceps', equipment: 'Mancuernas' },
  { id: 'extension-frances', name: 'Extensión Francesa (Press Francés)', category: 'triceps', equipment: 'Barra' },
  { id: 'patada-triceps', name: 'Patada de Tríceps', category: 'triceps', equipment: 'Mancuernas' },
  { id: 'extension-triceps-cuerda', name: 'Extensión con Cuerda en Polea', category: 'triceps', equipment: 'Polea' },
  { id: 'press-diamante', name: 'Flexiones Diamante', category: 'triceps', equipment: 'Peso Corporal' },

  // PIERNAS COMPLETAS
  { id: 'sentadilla-barra', name: 'Sentadilla con Barra', category: 'piernas', equipment: 'Barra' },
  { id: 'sentadilla-frontal', name: 'Sentadilla Frontal', category: 'piernas', equipment: 'Barra' },
  { id: 'prensa-pierna', name: 'Prensa de Piernas', category: 'piernas', equipment: 'Máquina' },
  { id: 'zancadas', name: 'Zancadas (Lunges)', category: 'piernas', equipment: 'Mancuernas' },
  { id: 'sentadilla-bulgara', name: 'Sentadilla Búlgara', category: 'piernas', equipment: 'Mancuernas' },
  { id: 'pistol-squat', name: 'Pistol Squat', category: 'piernas', equipment: 'Peso Corporal' },

  // CUÁDRICEPS
  { id: 'extension-cuadriceps', name: 'Extensión de Cuádriceps', category: 'cuadriceps', equipment: 'Máquina' },
  { id: 'hack-squat', name: 'Hack Squat', category: 'cuadriceps', equipment: 'Máquina' },
  { id: 'sentadilla-goblet', name: 'Sentadilla Goblet', category: 'cuadriceps', equipment: 'Mancuernas' },
  { id: 'sissy-squat', name: 'Sissy Squat', category: 'cuadriceps', equipment: 'Peso Corporal' },

  // ISQUIOTIBIALES
  { id: 'curl-femoral-tumbado', name: 'Curl Femoral Tumbado', category: 'isquiotibiales', equipment: 'Máquina' },
  { id: 'curl-femoral-sentado', name: 'Curl Femoral Sentado', category: 'isquiotibiales', equipment: 'Máquina' },
  { id: 'peso-muerto-piernas-rigidas', name: 'Peso Muerto Piernas Rígidas', category: 'isquiotibiales', equipment: 'Barra' },
  { id: 'buenos-dias', name: 'Buenos Días', category: 'isquiotibiales', equipment: 'Barra' },
  { id: 'nordic-curl', name: 'Nordic Curl', category: 'isquiotibiales', equipment: 'Peso Corporal' },

  // GLÚTEOS
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'gluteos', equipment: 'Barra' },
  { id: 'puente-gluteo', name: 'Puente de Glúteo', category: 'gluteos', equipment: 'Peso Corporal' },
  { id: 'patada-gluteo', name: 'Patada de Glúteo', category: 'gluteos', equipment: 'Máquina' },
  { id: 'abduccion-cadera', name: 'Abducción de Cadera', category: 'gluteos', equipment: 'Máquina' },
  { id: 'zancada-reversa', name: 'Zancada Reversa', category: 'gluteos', equipment: 'Mancuernas' },

  // PANTORRILLAS
  { id: 'elevacion-gemelos-pie', name: 'Elevación de Gemelos de Pie', category: 'pantorrillas', equipment: 'Máquina' },
  { id: 'elevacion-gemelos-sentado', name: 'Elevación de Gemelos Sentado', category: 'pantorrillas', equipment: 'Máquina' },
  { id: 'saltos-gemelos', name: 'Saltos de Gemelos', category: 'pantorrillas', equipment: 'Peso Corporal' },

  // CORE / ABDOMINALES
  { id: 'plancha', name: 'Plancha (Plank)', category: 'core', equipment: 'Peso Corporal' },
  { id: 'plancha-lateral', name: 'Plancha Lateral', category: 'core', equipment: 'Peso Corporal' },
  { id: 'crunch', name: 'Crunch Abdominal', category: 'core', equipment: 'Peso Corporal' },
  { id: 'elevacion-piernas', name: 'Elevación de Piernas', category: 'core', equipment: 'Peso Corporal' },
  { id: 'abdominales-bicicleta', name: 'Abdominales Bicicleta', category: 'core', equipment: 'Peso Corporal' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'core', equipment: 'Peso Corporal' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'core', equipment: 'Peso Corporal' },
  { id: 'ab-wheel', name: 'Rueda Abdominal (Ab Wheel)', category: 'core', equipment: 'Rueda' },
  { id: 'crunch-polea', name: 'Crunch en Polea', category: 'core', equipment: 'Polea' },
  { id: 'elevacion-piernas-barra', name: 'Elevación de Piernas en Barra', category: 'core', equipment: 'Barra Fija' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'core', equipment: 'Peso Corporal' },
  { id: 'pallof-press', name: 'Pallof Press', category: 'core', equipment: 'Polea' },

  // CUERPO COMPLETO / EJERCICIOS COMPUESTOS
  { id: 'burpees', name: 'Burpees', category: 'fullbody', equipment: 'Peso Corporal' },
  { id: 'thrusters', name: 'Thrusters', category: 'fullbody', equipment: 'Barra' },
  { id: 'clean-and-press', name: 'Clean and Press', category: 'fullbody', equipment: 'Barra' },
  { id: 'clean-and-jerk', name: 'Clean and Jerk', category: 'fullbody', equipment: 'Barra' },
  { id: 'snatch', name: 'Snatch (Arrancada)', category: 'fullbody', equipment: 'Barra' },
  { id: 'farmers-walk', name: 'Farmer\'s Walk', category: 'fullbody', equipment: 'Mancuernas' },
  { id: 'man-makers', name: 'Man Makers', category: 'fullbody', equipment: 'Mancuernas' },
  { id: 'battle-ropes', name: 'Battle Ropes', category: 'fullbody', equipment: 'Cuerdas' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'fullbody', equipment: 'Kettlebell' },
  { id: 'turkish-getup', name: 'Turkish Get-Up', category: 'fullbody', equipment: 'Kettlebell' },
];

// Función para obtener ejercicios por categoría
export function getExercisesByCategory(category: string): ExerciseData[] {
  if (category === 'todos') {
    return exerciseDatabase;
  }
  return exerciseDatabase.filter(ex => ex.category === category);
}

// ========== EJERCICIOS PERSONALIZADOS ==========
// ⚠️ MIGRADO A SUPABASE - Ya no usar localStorage
// Los ejercicios personalizados ahora se guardan en Supabase vía API:
// - api.getCustomExercises(email)
// - api.saveCustomExercises(email, exercises)

// Obtener TODOS los ejercicios (predeterminados + personalizados desde Supabase)
export function getAllExercises(customExercises: ExerciseData[] = []): ExerciseData[] {
  return [...exerciseDatabase, ...customExercises];
}

// Buscar ejercicios incluyendo personalizados
export function searchAllExercises(query: string, category?: string, customExercises: ExerciseData[] = []): ExerciseData[] {
  const allExercises = getAllExercises(customExercises);
  const lowerQuery = query.toLowerCase();
  
  let filtered = allExercises;
  
  if (category && category !== 'todos') {
    filtered = filtered.filter(ex => ex.category === category);
  }
  
  if (query.trim()) {
    filtered = filtered.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  return filtered.slice(0, 10);
}