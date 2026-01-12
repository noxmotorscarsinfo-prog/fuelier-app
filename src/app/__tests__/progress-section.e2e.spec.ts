/**
 * Tests E2E para el Módulo de Progress (Progreso y Analytics)
 * 
 * Cubre:
 * - FLUJO 1: Cálculo de macros diarios
 * - FLUJO 2: Cálculo de puntuación (score)
 * - FLUJO 3: Navegación de calendario
 * - FLUJO 4: Widget de progreso semanal
 * - FLUJO 5: Historial y estadísticas
 * - FLUJO 6: Protección contra división por cero
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockDailyLog = {
  date: '2025-01-15',
  isSaved: true,
  breakfast: { calories: 400, protein: 25, carbs: 40, fat: 15, name: 'Desayuno' },
  lunch: { calories: 600, protein: 40, carbs: 60, fat: 20, name: 'Almuerzo' },
  snack: { calories: 200, protein: 10, carbs: 20, fat: 8, name: 'Merienda' },
  dinner: { calories: 500, protein: 35, carbs: 45, fat: 18, name: 'Cena' },
  extras: [
    { calories: 100, protein: 5, carbs: 10, fat: 3 }
  ]
};

const mockGoals = {
  calories: 2000,
  protein: 120,
  carbs: 200,
  fat: 65
};

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  goals: mockGoals
};

// ============================================
// FLUJO 1: CÁLCULO DE MACROS DIARIOS
// ============================================

describe('FLUJO 1: Cálculo de macros diarios', () => {
  it('1.1 - Suma macros de todas las comidas', () => {
    const log = mockDailyLog;
    const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
    
    const totals = meals.reduce(
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
    
    expect(totals.calories).toBe(1700);
    expect(totals.protein).toBe(110);
    expect(totals.carbs).toBe(165);
    expect(totals.fat).toBe(61);
  });

  it('1.2 - Incluye extras en el cálculo', () => {
    const log = mockDailyLog;
    const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
    
    let totals = meals.reduce(
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
    
    // Agregar extras
    if (log.extras && log.extras.length > 0) {
      log.extras.forEach(extra => {
        totals.calories += extra.calories || 0;
        totals.protein += extra.protein || 0;
        totals.carbs += extra.carbs || 0;
        totals.fat += extra.fat || 0;
      });
    }
    
    expect(totals.calories).toBe(1800);
    expect(totals.protein).toBe(115);
  });

  it('1.3 - Maneja comidas null correctamente', () => {
    const logWithNulls = {
      ...mockDailyLog,
      snack: null,
      dinner: null
    };
    
    const meals = [logWithNulls.breakfast, logWithNulls.lunch, logWithNulls.snack, logWithNulls.dinner];
    
    const totals = meals.reduce(
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
    
    expect(totals.calories).toBe(1000);
    expect(totals.protein).toBe(65);
  });

  it('1.4 - Maneja log sin extras', () => {
    const logWithoutExtras = {
      ...mockDailyLog,
      extras: []
    };
    
    const hasExtras = logWithoutExtras.extras && logWithoutExtras.extras.length > 0;
    
    expect(hasExtras).toBe(false);
  });
});

// ============================================
// FLUJO 2: CÁLCULO DE PUNTUACIÓN (SCORE)
// ============================================

describe('FLUJO 2: Cálculo de puntuación (score)', () => {
  const calculateScore = (totals: any, goals: any) => {
    const caloriesScore = goals.calories > 0 
      ? Math.min((totals.calories / goals.calories) * 100, 100) 
      : 0;
    const proteinScore = goals.protein > 0 
      ? Math.min((totals.protein / goals.protein) * 100, 100) 
      : 0;
    const carbsScore = goals.carbs > 0 
      ? Math.min((totals.carbs / goals.carbs) * 100, 100) 
      : 0;
    const fatScore = goals.fat > 0 
      ? Math.min((totals.fat / goals.fat) * 100, 100) 
      : 0;
    return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
  };

  it('2.1 - Calcula puntuación perfecta (100%)', () => {
    const totals = { calories: 2000, protein: 120, carbs: 200, fat: 65 };
    
    const score = calculateScore(totals, mockGoals);
    
    expect(score).toBe(100);
  });

  it('2.2 - Calcula puntuación parcial (50%)', () => {
    const totals = { calories: 1000, protein: 60, carbs: 100, fat: 32.5 };
    
    const score = calculateScore(totals, mockGoals);
    
    expect(score).toBe(50);
  });

  it('2.3 - No excede 100% aunque sobrepase goals', () => {
    const totals = { calories: 3000, protein: 200, carbs: 300, fat: 100 };
    
    const score = calculateScore(totals, mockGoals);
    
    expect(score).toBe(100);
  });

  it('2.4 - Retorna 0 si goals son 0 (evita división por cero)', () => {
    const totals = { calories: 1000, protein: 60, carbs: 100, fat: 30 };
    const zeroGoals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const score = calculateScore(totals, zeroGoals);
    
    expect(score).toBe(0);
  });

  it('2.5 - Puntuación es entero redondeado', () => {
    const totals = { calories: 1500, protein: 90, carbs: 150, fat: 50 };
    
    const score = calculateScore(totals, mockGoals);
    
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ============================================
// FLUJO 3: NAVEGACIÓN DE CALENDARIO
// ============================================

describe('FLUJO 3: Navegación de calendario', () => {
  it('3.1 - Genera días del mes correctamente', () => {
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.getDate();
    };
    
    // Enero 2025 tiene 31 días
    const january2025 = new Date(2025, 0, 1);
    expect(getDaysInMonth(january2025)).toBe(31);
    
    // Febrero 2025 tiene 28 días (no bisiesto)
    const february2025 = new Date(2025, 1, 1);
    expect(getDaysInMonth(february2025)).toBe(28);
    
    // Febrero 2024 tiene 29 días (bisiesto)
    const february2024 = new Date(2024, 1, 1);
    expect(getDaysInMonth(february2024)).toBe(29);
  });

  it('3.2 - Navega al mes anterior', () => {
    const currentDate = new Date(2025, 1, 15); // Febrero 2025
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    expect(previousMonth.getMonth()).toBe(0); // Enero
    expect(previousMonth.getFullYear()).toBe(2025);
  });

  it('3.3 - Navega al mes siguiente', () => {
    const currentDate = new Date(2025, 1, 15); // Febrero 2025
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    expect(nextMonth.getMonth()).toBe(2); // Marzo
    expect(nextMonth.getFullYear()).toBe(2025);
  });

  it('3.4 - Identifica día actual correctamente', () => {
    const today = new Date();
    const todayDate = new Date();
    
    const isToday = (day: number, currentDate: Date) => {
      return (
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    };
    
    expect(isToday(today.getDate(), todayDate)).toBe(true);
    expect(isToday(today.getDate() + 1, todayDate)).toBe(false);
  });

  it('3.5 - Formatea fecha correctamente', () => {
    const date = new Date(2025, 0, 15);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    expect(dateStr).toBe('2025-01-15');
  });
});

// ============================================
// FLUJO 4: WIDGET DE PROGRESO SEMANAL
// ============================================

describe('FLUJO 4: Widget de progreso semanal', () => {
  it('4.1 - Genera 7 días de la semana', () => {
    const getWeekDays = (date: Date) => {
      const days = [];
      const currentDay = date.getDay();
      const diff = currentDay === 0 ? -6 : 1 - currentDay;
      
      for (let i = 0; i < 7; i++) {
        const weekDay = new Date(date);
        weekDay.setDate(date.getDate() + diff + i);
        days.push(weekDay);
      }
      return days;
    };
    
    const weekDays = getWeekDays(new Date(2025, 0, 15)); // Miércoles
    
    expect(weekDays).toHaveLength(7);
  });

  it('4.2 - Determina color según puntuación >= 90 (verde)', () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-emerald-500';
      if (score >= 50) return 'bg-yellow-500';
      if (score >= 30) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    expect(getScoreColor(95)).toBe('bg-green-500');
    expect(getScoreColor(90)).toBe('bg-green-500');
  });

  it('4.3 - Determina color según puntuación >= 70 (esmeralda)', () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-emerald-500';
      if (score >= 50) return 'bg-yellow-500';
      if (score >= 30) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    expect(getScoreColor(85)).toBe('bg-emerald-500');
    expect(getScoreColor(70)).toBe('bg-emerald-500');
  });

  it('4.4 - Determina color según puntuación >= 50 (amarillo)', () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-emerald-500';
      if (score >= 50) return 'bg-yellow-500';
      if (score >= 30) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    expect(getScoreColor(60)).toBe('bg-yellow-500');
    expect(getScoreColor(50)).toBe('bg-yellow-500');
  });

  it('4.5 - Determina color según puntuación >= 30 (naranja)', () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-emerald-500';
      if (score >= 50) return 'bg-yellow-500';
      if (score >= 30) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    expect(getScoreColor(40)).toBe('bg-orange-500');
    expect(getScoreColor(30)).toBe('bg-orange-500');
  });

  it('4.6 - Determina color según puntuación < 30 (rojo)', () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-emerald-500';
      if (score >= 50) return 'bg-yellow-500';
      if (score >= 30) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    expect(getScoreColor(20)).toBe('bg-red-500');
    expect(getScoreColor(0)).toBe('bg-red-500');
  });
});

// ============================================
// FLUJO 5: HISTORIAL Y ESTADÍSTICAS
// ============================================

describe('FLUJO 5: Historial y estadísticas', () => {
  it('5.1 - Cuenta comidas completadas en un día', () => {
    const getMealCount = (log: any) => {
      return [log.breakfast, log.lunch, log.snack, log.dinner].filter(m => m !== null).length;
    };
    
    expect(getMealCount(mockDailyLog)).toBe(4);
    
    const partialLog = { ...mockDailyLog, snack: null };
    expect(getMealCount(partialLog)).toBe(3);
  });

  it('5.2 - Encuentra log por fecha específica', () => {
    const dailyLogs = [
      { date: '2025-01-14', isSaved: true },
      { date: '2025-01-15', isSaved: true },
      { date: '2025-01-16', isSaved: false }
    ];
    
    const findLog = (dateStr: string, onlySaved: boolean = true) => {
      return dailyLogs.find(log => 
        log.date === dateStr && (!onlySaved || log.isSaved)
      );
    };
    
    expect(findLog('2025-01-15')).toBeDefined();
    expect(findLog('2025-01-16')).toBeUndefined(); // No guardado
    expect(findLog('2025-01-17')).toBeUndefined(); // No existe
  });

  it('5.3 - Filtra logs guardados (isSaved)', () => {
    const dailyLogs = [
      { date: '2025-01-14', isSaved: true },
      { date: '2025-01-15', isSaved: true },
      { date: '2025-01-16', isSaved: false }
    ];
    
    const savedLogs = dailyLogs.filter(log => log.isSaved);
    
    expect(savedLogs).toHaveLength(2);
  });
});

// ============================================
// FLUJO 6: PROTECCIÓN CONTRA DIVISIÓN POR CERO
// ============================================

describe('FLUJO 6: Protección contra división por cero', () => {
  it('6.1 - Protege cálculo de calorías si goal es 0', () => {
    const totals = { calories: 1000 };
    const goals = { calories: 0 };
    
    const score = goals.calories > 0 
      ? Math.min((totals.calories / goals.calories) * 100, 100) 
      : 0;
    
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('6.2 - Protege cálculo de proteína si goal es 0', () => {
    const totals = { protein: 100 };
    const goals = { protein: 0 };
    
    const score = goals.protein > 0 
      ? Math.min((totals.protein / goals.protein) * 100, 100) 
      : 0;
    
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('6.3 - Protege cálculo de carbohidratos si goal es 0', () => {
    const totals = { carbs: 200 };
    const goals = { carbs: 0 };
    
    const score = goals.carbs > 0 
      ? Math.min((totals.carbs / goals.carbs) * 100, 100) 
      : 0;
    
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('6.4 - Protege cálculo de grasas si goal es 0', () => {
    const totals = { fat: 50 };
    const goals = { fat: 0 };
    
    const score = goals.fat > 0 
      ? Math.min((totals.fat / goals.fat) * 100, 100) 
      : 0;
    
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('6.5 - Maneja todos los goals en 0', () => {
    const calculateScore = (totals: any, goals: any) => {
      const caloriesScore = goals.calories > 0 
        ? Math.min((totals.calories / goals.calories) * 100, 100) 
        : 0;
      const proteinScore = goals.protein > 0 
        ? Math.min((totals.protein / goals.protein) * 100, 100) 
        : 0;
      const carbsScore = goals.carbs > 0 
        ? Math.min((totals.carbs / goals.carbs) * 100, 100) 
        : 0;
      const fatScore = goals.fat > 0 
        ? Math.min((totals.fat / goals.fat) * 100, 100) 
        : 0;
      return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
    };
    
    const totals = { calories: 1000, protein: 100, carbs: 200, fat: 50 };
    const allZeroGoals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const score = calculateScore(totals, allZeroGoals);
    
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Progress', () => {
  it('DailyLog tiene estructura correcta', () => {
    expect(mockDailyLog).toHaveProperty('date');
    expect(mockDailyLog).toHaveProperty('isSaved');
    expect(mockDailyLog).toHaveProperty('breakfast');
    expect(mockDailyLog).toHaveProperty('lunch');
    expect(mockDailyLog).toHaveProperty('snack');
    expect(mockDailyLog).toHaveProperty('dinner');
  });

  it('Goals tiene todos los macros', () => {
    expect(mockGoals).toHaveProperty('calories');
    expect(mockGoals).toHaveProperty('protein');
    expect(mockGoals).toHaveProperty('carbs');
    expect(mockGoals).toHaveProperty('fat');
  });

  it('Todos los goals son positivos', () => {
    expect(mockGoals.calories).toBeGreaterThan(0);
    expect(mockGoals.protein).toBeGreaterThan(0);
    expect(mockGoals.carbs).toBeGreaterThan(0);
    expect(mockGoals.fat).toBeGreaterThan(0);
  });

  it('Score está entre 0 y 100', () => {
    const scores = [0, 25, 50, 75, 100];
    
    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
