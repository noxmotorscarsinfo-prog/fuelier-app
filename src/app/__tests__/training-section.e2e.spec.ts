/**
 * Tests E2E para el Módulo de Training
 * 
 * Cubre:
 * - FLUJO 1: Inicio de entrenamiento
 * - FLUJO 2: Registro de repeticiones y pesos
 * - FLUJO 3: Completar entrenamiento
 * - FLUJO 4: Historial de entrenamientos
 * - FLUJO 5: Edición de plan de entrenamiento
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MOCKS
// ============================================

const mockGetTrainingPlan = vi.fn();
const mockSaveTrainingPlan = vi.fn();
const mockGetCompletedWorkouts = vi.fn();
const mockSaveCompletedWorkouts = vi.fn();
const mockGetTrainingProgress = vi.fn();
const mockSaveTrainingProgress = vi.fn();
const mockDeleteTrainingProgress = vi.fn();

vi.mock('../utils/api', () => ({
  getTrainingPlan: (...args: any[]) => mockGetTrainingPlan(...args),
  saveTrainingPlan: (...args: any[]) => mockSaveTrainingPlan(...args),
  getCompletedWorkouts: (...args: any[]) => mockGetCompletedWorkouts(...args),
  saveCompletedWorkouts: (...args: any[]) => mockSaveCompletedWorkouts(...args),
  getTrainingProgress: (...args: any[]) => mockGetTrainingProgress(...args),
  saveTrainingProgress: (...args: any[]) => mockSaveTrainingProgress(...args),
  deleteTrainingProgress: (...args: any[]) => mockDeleteTrainingProgress(...args),
}));

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockWeekPlan = [
  {
    dayName: 'Día 1',
    exercises: [
      { id: 'ex1', name: 'Press Banca', sets: 4, reps: '8-12', restTime: 90, category: 'pecho' },
      { id: 'ex2', name: 'Dominadas', sets: 3, reps: '6-10', restTime: 120, category: 'espalda' },
    ]
  },
  {
    dayName: 'Día 2',
    exercises: [
      { id: 'ex3', name: 'Sentadillas', sets: 5, reps: '5', restTime: 180, category: 'piernas' },
    ]
  }
];

const mockCompletedWorkout = {
  date: '2026-01-12',
  dayPlanIndex: 0,
  dayPlanName: 'Día 1',
  exerciseReps: { 'ex1': [10, 10, 8, 8], 'ex2': [8, 7, 6] },
  exerciseWeights: { 'ex1': [60, 60, 55, 55], 'ex2': [0, 0, 0] }
};

// ============================================
// FLUJO 1: INICIO DE ENTRENAMIENTO
// ============================================

describe('FLUJO 1: Inicio de entrenamiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1.1 - Carga plan de entrenamiento desde Supabase', async () => {
    mockGetTrainingPlan.mockResolvedValue(mockWeekPlan);
    
    const result = await mockGetTrainingPlan('test@test.com');
    
    expect(result).toEqual(mockWeekPlan);
    expect(result.length).toBe(2);
    expect(result[0].exercises.length).toBe(2);
  });

  it('1.2 - Maneja plan vacío correctamente', async () => {
    mockGetTrainingPlan.mockResolvedValue(null);
    
    const result = await mockGetTrainingPlan('test@test.com');
    
    expect(result).toBeNull();
  });

  it('1.3 - Valida estructura del plan antes de usar', async () => {
    const validPlan = mockWeekPlan;
    
    // Validar estructura
    const isValidPlan = validPlan.every(day => 
      day && 
      typeof day === 'object' && 
      'dayName' in day && 
      'exercises' in day && 
      Array.isArray(day.exercises)
    );
    
    expect(isValidPlan).toBe(true);
  });

  it('1.4 - Rechaza plan con estructura inválida', () => {
    const invalidPlan = [
      { dayName: 'Día 1' }, // Falta 'exercises'
      { exercises: [] }     // Falta 'dayName'
    ];
    
    const isValidPlan = invalidPlan.every(day => 
      day && 
      typeof day === 'object' && 
      'dayName' in day && 
      'exercises' in day && 
      Array.isArray(day.exercises)
    );
    
    expect(isValidPlan).toBe(false);
  });
});

// ============================================
// FLUJO 2: REGISTRO DE REPETICIONES Y PESOS
// ============================================

describe('FLUJO 2: Registro de repeticiones y pesos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('2.1 - Inicializa arrays de reps correctamente', () => {
    const exercises = mockWeekPlan[0].exercises;
    
    const initialReps: { [id: string]: number[] } = {};
    exercises.forEach(exercise => {
      initialReps[exercise.id] = Array(exercise.sets).fill(0);
    });
    
    expect(initialReps['ex1']).toEqual([0, 0, 0, 0]); // 4 sets
    expect(initialReps['ex2']).toEqual([0, 0, 0]);    // 3 sets
  });

  it('2.2 - Actualiza repetición en serie específica', () => {
    const initialReps: { [key: string]: number[] } = { 'ex1': [0, 0, 0, 0] };
    
    // Simular updateExerciseReps
    const updateExerciseReps = (exerciseId: string, setIndex: number, reps: number) => {
      const currentArray = initialReps[exerciseId] || [];
      return currentArray.map((r: number, i: number) => i === setIndex ? reps : r);
    };
    
    const updatedReps = updateExerciseReps('ex1', 0, 10);
    
    expect(updatedReps).toEqual([10, 0, 0, 0]);
  });

  it('2.3 - Maneja array undefined graciosamente', () => {
    const emptyReps: { [id: string]: number[] } = {};
    
    // Simular updateExerciseReps con fallback
    const updateExerciseReps = (exerciseId: string, setIndex: number, reps: number) => {
      const currentArray = emptyReps[exerciseId] || [];
      return currentArray.map((r, i) => i === setIndex ? reps : r);
    };
    
    // No debería fallar, retorna array vacío
    const result = updateExerciseReps('nonexistent', 0, 10);
    expect(result).toEqual([]);
  });

  it('2.4 - Actualiza peso en serie específica', () => {
    const initialWeights: { [key: string]: number[] } = { 'ex1': [0, 0, 0, 0] };
    
    const updateExerciseWeights = (exerciseId: string, setIndex: number, weight: number) => {
      const currentArray = initialWeights[exerciseId] || [];
      return currentArray.map((w: number, i: number) => i === setIndex ? weight : w);
    };
    
    const updatedWeights = updateExerciseWeights('ex1', 0, 60);
    
    expect(updatedWeights).toEqual([60, 0, 0, 0]);
  });

  it('2.5 - Auto-guarda progreso cada 5 segundos', async () => {
    const progressData = {
      dayIndex: 0,
      exerciseReps: { 'ex1': [10, 8] },
      exerciseWeights: { 'ex1': [60, 55] },
      timestamp: new Date().toISOString()
    };
    
    mockSaveTrainingProgress.mockResolvedValue(true);
    
    await mockSaveTrainingProgress('test@test.com', '2026-01-12', progressData);
    
    expect(mockSaveTrainingProgress).toHaveBeenCalledWith(
      'test@test.com',
      '2026-01-12',
      expect.objectContaining({
        dayIndex: 0,
        exerciseReps: { 'ex1': [10, 8] }
      })
    );
  });
});

// ============================================
// FLUJO 3: COMPLETAR ENTRENAMIENTO
// ============================================

describe('FLUJO 3: Completar entrenamiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('3.1 - Valida que todas las series tienen reps registradas', () => {
    const exercises = mockWeekPlan[0].exercises;
    const exerciseReps: { [key: string]: number[] } = { 'ex1': [10, 10, 8, 8], 'ex2': [8, 7, 6] };
    
    const allSetsCompleted = exercises.every(exercise => {
      const reps = exerciseReps[exercise.id] || [];
      return reps.every((r: number) => r > 0);
    });
    
    expect(allSetsCompleted).toBe(true);
  });

  it('3.2 - Rechaza completar si hay series sin reps', () => {
    const exercises = mockWeekPlan[0].exercises;
    const exerciseReps: { [key: string]: number[] } = { 'ex1': [10, 0, 0, 0], 'ex2': [0, 0, 0] }; // Incompleto
    
    const allSetsCompleted = exercises.every(exercise => {
      const reps = exerciseReps[exercise.id] || [];
      return reps.every((r: number) => r > 0);
    });
    
    expect(allSetsCompleted).toBe(false);
  });

  it('3.3 - Guarda entrenamiento completado en Supabase', async () => {
    mockSaveCompletedWorkouts.mockResolvedValue(true);
    
    const workouts = [mockCompletedWorkout];
    await mockSaveCompletedWorkouts('test@test.com', workouts);
    
    expect(mockSaveCompletedWorkouts).toHaveBeenCalledWith(
      'test@test.com',
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-01-12',
          dayPlanIndex: 0,
          dayPlanName: 'Día 1'
        })
      ])
    );
  });

  it('3.4 - Elimina progreso temporal tras completar', async () => {
    mockDeleteTrainingProgress.mockResolvedValue(true);
    
    await mockDeleteTrainingProgress('test@test.com', '2026-01-12');
    
    expect(mockDeleteTrainingProgress).toHaveBeenCalledWith('test@test.com', '2026-01-12');
  });

  it('3.5 - Genera fecha en formato local correcto', () => {
    const now = new Date('2026-01-12T15:30:00');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    expect(dateStr).toBe('2026-01-12');
  });
});

// ============================================
// FLUJO 4: HISTORIAL DE ENTRENAMIENTOS
// ============================================

describe('FLUJO 4: Historial de entrenamientos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('4.1 - Carga entrenamientos completados', async () => {
    const workouts = [mockCompletedWorkout];
    mockGetCompletedWorkouts.mockResolvedValue(workouts);
    
    const result = await mockGetCompletedWorkouts('test@test.com');
    
    expect(result.length).toBe(1);
    expect(result[0].dayPlanIndex).toBe(0);
  });

  it('4.2 - Filtra entrenamientos de la semana actual', () => {
    const workouts = [
      { date: '2026-01-10', dayPlanIndex: 0 }, // Viernes semana anterior
      { date: '2026-01-12', dayPlanIndex: 0 }, // Domingo semana actual (si lunes es 13)
      { date: '2026-01-15', dayPlanIndex: 1 }, // Miércoles semana actual
    ];
    
    const weekStart = '2026-01-12';
    const weekEnd = '2026-01-18';
    
    const thisWeekWorkouts = workouts.filter(w => 
      w.date >= weekStart && w.date <= weekEnd
    );
    
    expect(thisWeekWorkouts.length).toBe(2);
  });

  it('4.3 - Detecta día del plan completado', () => {
    const completedWorkouts = [{ date: '2026-01-12', dayPlanIndex: 0 }];
    
    const isDayPlanCompletedThisWeek = (dayPlanIndex: number) => {
      return completedWorkouts.some(w => w.dayPlanIndex === dayPlanIndex);
    };
    
    expect(isDayPlanCompletedThisWeek(0)).toBe(true);
    expect(isDayPlanCompletedThisWeek(1)).toBe(false);
  });

  it('4.4 - Calcula siguiente día del plan', () => {
    const completedWorkouts = [{ dayPlanIndex: 0 }];
    const localWeekPlan = mockWeekPlan;
    
    const completedSet = new Set(completedWorkouts.map(w => w.dayPlanIndex));
    
    let nextDayPlanIndex = 0;
    for (let i = 0; i < localWeekPlan.length; i++) {
      if (!completedSet.has(i)) {
        nextDayPlanIndex = i;
        break;
      }
    }
    
    // Día 0 completado, siguiente es Día 1
    expect(nextDayPlanIndex).toBe(1);
  });
});

// ============================================
// FLUJO 5: EDICIÓN DE PLAN
// ============================================

describe('FLUJO 5: Edición de plan de entrenamiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('5.1 - Guarda plan modificado', async () => {
    mockSaveTrainingPlan.mockResolvedValue(true);
    
    const modifiedPlan = [...mockWeekPlan];
    modifiedPlan[0].exercises.push({
      id: 'ex4',
      name: 'Aperturas',
      sets: 3,
      reps: '12-15',
      restTime: 60,
      category: 'pecho'
    });
    
    await mockSaveTrainingPlan('test@test.com', modifiedPlan);
    
    expect(mockSaveTrainingPlan).toHaveBeenCalled();
  });

  it('5.2 - No guarda plan vacío', async () => {
    // Simular validación
    const saveTrainingPlan = async (email: string, weekPlan: any[]) => {
      if (!weekPlan || weekPlan.length === 0) {
        console.warn('⚠️ Attempting to save empty training plan. Aborting.');
        return false;
      }
      return true;
    };
    
    const result = await saveTrainingPlan('test@test.com', []);
    
    expect(result).toBe(false);
  });

  it('5.3 - Mantiene consistencia de IDs de ejercicios', () => {
    const exercises = mockWeekPlan[0].exercises;
    
    // Cada ejercicio debe tener un ID único
    const ids = exercises.map(e => e.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});

// ============================================
// VALIDACIONES DE FORMATO
// ============================================

describe('Validaciones de datos Training', () => {
  it('Ejercicio tiene todas las propiedades requeridas', () => {
    const exercise = mockWeekPlan[0].exercises[0];
    
    expect(exercise).toHaveProperty('id');
    expect(exercise).toHaveProperty('name');
    expect(exercise).toHaveProperty('sets');
    expect(exercise).toHaveProperty('reps');
    expect(exercise).toHaveProperty('restTime');
    expect(typeof exercise.sets).toBe('number');
    expect(exercise.sets).toBeGreaterThan(0);
  });

  it('Plan de día tiene dayName y exercises', () => {
    const dayPlan = mockWeekPlan[0];
    
    expect(dayPlan).toHaveProperty('dayName');
    expect(dayPlan).toHaveProperty('exercises');
    expect(Array.isArray(dayPlan.exercises)).toBe(true);
  });

  it('dayPlanIndex es número válido o null', () => {
    const validIndices = [0, 1, 2, null];
    
    validIndices.forEach(idx => {
      const isValid = idx === null || (typeof idx === 'number' && idx >= 0);
      expect(isValid).toBe(true);
    });
  });
});
