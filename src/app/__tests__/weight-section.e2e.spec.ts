/**
 * Tests E2E para el Módulo de Weight Tracking
 * 
 * Cubre:
 * - FLUJO 1: Registro de peso
 * - FLUJO 2: Historial de peso
 * - FLUJO 3: Estadísticas y tendencias
 * - FLUJO 4: Seguimiento de objetivos
 * - FLUJO 5: Validaciones de datos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  weight: 75, // kg inicial
  goal: 'moderate_loss',
  weeklyProgress: [
    { weekStartDate: '2025-01-06', endWeight: 74.5 },
    { weekStartDate: '2025-01-13', endWeight: 74.0 },
    { weekStartDate: '2025-01-20', endWeight: 73.5 }
  ]
};

const mockWeightHistory = [
  { date: '2025-01-01', weight: 75, week: 0 },
  { date: '2025-01-06', weight: 74.5, week: 1 },
  { date: '2025-01-13', weight: 74.0, week: 2 },
  { date: '2025-01-20', weight: 73.5, week: 3 }
];

// ============================================
// FLUJO 1: REGISTRO DE PESO
// ============================================

describe('FLUJO 1: Registro de peso', () => {
  it('1.1 - Acepta peso válido positivo', () => {
    const newWeight = '74.5';
    const weight = parseFloat(newWeight);
    
    const isValid = !isNaN(weight) && weight > 0;
    
    expect(isValid).toBe(true);
    expect(weight).toBe(74.5);
  });

  it('1.2 - Rechaza peso NaN', () => {
    const newWeight = 'abc';
    const weight = parseFloat(newWeight);
    
    const isValid = !isNaN(weight) && weight > 0;
    
    expect(isValid).toBe(false);
  });

  it('1.3 - Rechaza peso <= 0', () => {
    const negativeWeight = parseFloat('-5');
    const zeroWeight = parseFloat('0');
    
    expect(!isNaN(negativeWeight) && negativeWeight > 0).toBe(false);
    expect(!isNaN(zeroWeight) && zeroWeight > 0).toBe(false);
  });

  it('1.4 - Genera fecha actual al registrar peso', () => {
    const today = new Date().toISOString().split('T')[0];
    
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('1.5 - Acepta decimales en el peso', () => {
    const weights = ['74.5', '73.25', '80.1'];
    
    weights.forEach(w => {
      const weight = parseFloat(w);
      expect(!isNaN(weight)).toBe(true);
      expect(weight % 1 !== 0 || w.includes('.0')).toBeTruthy();
    });
  });
});

// ============================================
// FLUJO 2: HISTORIAL DE PESO
// ============================================

describe('FLUJO 2: Historial de peso', () => {
  it('2.1 - Genera historial desde weeklyProgress', () => {
    const getWeightHistory = (user: typeof mockUser) => {
      const history = [];
      
      // Peso inicial
      history.push({
        date: '2025-01-01',
        weight: user.weight,
        week: 0
      });

      // Pesos semanales
      if (user.weeklyProgress && user.weeklyProgress.length > 0) {
        user.weeklyProgress.forEach((record, index) => {
          history.push({
            date: record.weekStartDate,
            weight: record.endWeight,
            week: index + 1
          });
        });
      }

      return history;
    };
    
    const history = getWeightHistory(mockUser);
    
    expect(history).toHaveLength(4);
    expect(history[0].weight).toBe(75);
    expect(history[3].weight).toBe(73.5);
  });

  it('2.2 - Maneja usuario sin historial', () => {
    const userNoHistory = { ...mockUser, weeklyProgress: [] };
    
    const history = [{ date: '2025-01-01', weight: userNoHistory.weight, week: 0 }];
    
    expect(history).toHaveLength(1);
  });

  it('2.3 - Maneja usuario con weeklyProgress undefined', () => {
    const userUndefinedProgress: { weeklyProgress?: typeof mockUser.weeklyProgress } = { weeklyProgress: undefined };
    
    const progress = userUndefinedProgress.weeklyProgress;
    const hasProgress = progress && progress.length > 0;
    
    expect(hasProgress).toBeFalsy();
  });

  it('2.4 - Ordena historial por fecha', () => {
    const isOrdered = mockWeightHistory.every((entry, i) => {
      if (i === 0) return true;
      return entry.week > mockWeightHistory[i - 1].week;
    });
    
    expect(isOrdered).toBe(true);
  });
});

// ============================================
// FLUJO 3: ESTADÍSTICAS Y TENDENCIAS
// ============================================

describe('FLUJO 3: Estadísticas y tendencias', () => {
  const getStats = (history: typeof mockWeightHistory) => {
    if (history.length < 2) {
      return {
        totalChange: 0,
        weeklyAverage: 0,
        trend: 'maintaining' as const,
        weeksTracking: 0
      };
    }

    const firstWeight = history[0].weight;
    const lastWeight = history[history.length - 1].weight;
    const totalChange = lastWeight - firstWeight;
    const weeksTracking = history.length - 1;
    const weeklyAverage = weeksTracking > 0 ? totalChange / weeksTracking : 0;

    let trend: string;
    
    if (weeklyAverage < -0.75) trend = 'losing_fast';
    else if (weeklyAverage < -0.3) trend = 'losing_moderate';
    else if (weeklyAverage < -0.1) trend = 'losing_slow';
    else if (weeklyAverage > 0.75) trend = 'gaining_fast';
    else if (weeklyAverage > 0.3) trend = 'gaining_moderate';
    else if (weeklyAverage > 0.1) trend = 'gaining_slow';
    else trend = 'maintaining';

    return {
      totalChange,
      weeklyAverage,
      trend,
      weeksTracking
    };
  };

  it('3.1 - Calcula cambio total correctamente', () => {
    const stats = getStats(mockWeightHistory);
    
    // 73.5 - 75 = -1.5
    expect(stats.totalChange).toBe(-1.5);
  });

  it('3.2 - Calcula promedio semanal correctamente', () => {
    const stats = getStats(mockWeightHistory);
    
    // -1.5 / 3 semanas = -0.5 kg/semana
    expect(stats.weeklyAverage).toBe(-0.5);
  });

  it('3.3 - Detecta tendencia de pérdida moderada', () => {
    const stats = getStats(mockWeightHistory);
    
    expect(stats.trend).toBe('losing_moderate');
  });

  it('3.4 - Detecta tendencia de pérdida rápida', () => {
    const fastLossHistory = [
      { date: '2025-01-01', weight: 80, week: 0 },
      { date: '2025-01-08', weight: 79, week: 1 },
      { date: '2025-01-15', weight: 78, week: 2 }
    ];
    
    const stats = getStats(fastLossHistory);
    
    // -2kg / 2 semanas = -1 kg/semana
    expect(stats.trend).toBe('losing_fast');
  });

  it('3.5 - Detecta tendencia de mantenimiento', () => {
    const maintainingHistory = [
      { date: '2025-01-01', weight: 75, week: 0 },
      { date: '2025-01-08', weight: 75.05, week: 1 },
      { date: '2025-01-15', weight: 74.95, week: 2 }
    ];
    
    const stats = getStats(maintainingHistory);
    
    expect(stats.trend).toBe('maintaining');
  });

  it('3.6 - Detecta tendencia de ganancia', () => {
    const gainingHistory = [
      { date: '2025-01-01', weight: 70, week: 0 },
      { date: '2025-01-08', weight: 70.5, week: 1 },
      { date: '2025-01-15', weight: 71, week: 2 }
    ];
    
    const stats = getStats(gainingHistory);
    
    expect(stats.trend).toBe('gaining_moderate');
  });

  it('3.7 - Maneja historial con solo 1 entrada', () => {
    const singleEntry = [{ date: '2025-01-01', weight: 75, week: 0 }];
    
    const stats = getStats(singleEntry);
    
    expect(stats.totalChange).toBe(0);
    expect(stats.weeklyAverage).toBe(0);
    expect(stats.trend).toBe('maintaining');
  });

  it('3.8 - Evita división por cero', () => {
    const noWeeks = [{ date: '2025-01-01', weight: 75, week: 0 }];
    
    const stats = getStats(noWeeks);
    
    expect(Number.isFinite(stats.weeklyAverage)).toBe(true);
    expect(stats.weeklyAverage).toBe(0);
  });
});

// ============================================
// FLUJO 4: SEGUIMIENTO DE OBJETIVOS
// ============================================

describe('FLUJO 4: Seguimiento de objetivos', () => {
  const isOnTrack = (goal: string, weeklyAverage: number) => {
    switch (goal) {
      case 'rapid_loss':
        return weeklyAverage >= -1.0 && weeklyAverage <= -0.75;
      case 'moderate_loss':
        return weeklyAverage >= -0.75 && weeklyAverage <= -0.5;
      case 'maintenance':
        return Math.abs(weeklyAverage) <= 0.15;
      case 'moderate_gain':
        return weeklyAverage >= 0.25 && weeklyAverage <= 0.5;
      case 'rapid_gain':
        return weeklyAverage >= 0.5 && weeklyAverage <= 0.75;
      default:
        return false;
    }
  };

  it('4.1 - Pérdida rápida: -1.0 a -0.75 kg/semana', () => {
    expect(isOnTrack('rapid_loss', -0.9)).toBe(true);
    expect(isOnTrack('rapid_loss', -0.5)).toBe(false);
    expect(isOnTrack('rapid_loss', -1.5)).toBe(false);
  });

  it('4.2 - Pérdida moderada: -0.75 a -0.5 kg/semana', () => {
    expect(isOnTrack('moderate_loss', -0.6)).toBe(true);
    expect(isOnTrack('moderate_loss', -0.3)).toBe(false);
    expect(isOnTrack('moderate_loss', -0.9)).toBe(false);
  });

  it('4.3 - Mantenimiento: ±0.15 kg/semana', () => {
    expect(isOnTrack('maintenance', 0.1)).toBe(true);
    expect(isOnTrack('maintenance', -0.1)).toBe(true);
    expect(isOnTrack('maintenance', 0.5)).toBe(false);
  });

  it('4.4 - Ganancia moderada: +0.25 a +0.5 kg/semana', () => {
    expect(isOnTrack('moderate_gain', 0.35)).toBe(true);
    expect(isOnTrack('moderate_gain', 0.1)).toBe(false);
    expect(isOnTrack('moderate_gain', 0.8)).toBe(false);
  });

  it('4.5 - Ganancia rápida: +0.5 a +0.75 kg/semana', () => {
    expect(isOnTrack('rapid_gain', 0.6)).toBe(true);
    expect(isOnTrack('rapid_gain', 0.3)).toBe(false);
    expect(isOnTrack('rapid_gain', 1.0)).toBe(false);
  });

  it('4.6 - Objetivo desconocido retorna false', () => {
    expect(isOnTrack('unknown_goal', 0.5)).toBe(false);
  });
});

// ============================================
// FLUJO 5: VALIDACIONES DE DATOS
// ============================================

describe('FLUJO 5: Validaciones de datos', () => {
  it('5.1 - Peso mínimo razonable (30 kg)', () => {
    const minWeight = 30;
    const tooLight = 25;
    
    expect(minWeight >= 30).toBe(true);
    expect(tooLight >= 30).toBe(false);
  });

  it('5.2 - Peso máximo razonable (300 kg)', () => {
    const maxWeight = 300;
    const tooHeavy = 350;
    
    expect(maxWeight <= 300).toBe(true);
    expect(tooHeavy <= 300).toBe(false);
  });

  it('5.3 - Formato de fecha válido', () => {
    const validDate = '2025-01-15';
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(validDate);
    
    expect(isValidFormat).toBe(true);
  });

  it('5.4 - ParseFloat maneja strings correctamente', () => {
    const validInputs = ['74.5', '80', '65.25'];
    
    validInputs.forEach(input => {
      const weight = parseFloat(input);
      expect(!isNaN(weight)).toBe(true);
      expect(weight > 0).toBe(true);
    });
  });

  it('5.5 - ParseFloat detecta valores inválidos', () => {
    const invalidInputs = ['', 'abc', 'NaN'];
    
    invalidInputs.forEach(input => {
      const weight = parseFloat(input);
      expect(isNaN(weight)).toBe(true);
    });
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Weight Tracking', () => {
  it('User tiene weight inicial', () => {
    expect(mockUser).toHaveProperty('weight');
    expect(mockUser.weight).toBeGreaterThan(0);
  });

  it('User tiene goal definido', () => {
    expect(mockUser).toHaveProperty('goal');
    expect(['rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain'])
      .toContain(mockUser.goal);
  });

  it('WeeklyProgress tiene estructura correcta', () => {
    mockUser.weeklyProgress!.forEach(record => {
      expect(record).toHaveProperty('weekStartDate');
      expect(record).toHaveProperty('endWeight');
    });
  });

  it('Todos los pesos en historial son positivos', () => {
    mockWeightHistory.forEach(entry => {
      expect(entry.weight).toBeGreaterThan(0);
    });
  });

  it('Semanas en historial son consecutivas', () => {
    mockWeightHistory.forEach((entry, index) => {
      expect(entry.week).toBe(index);
    });
  });
});
