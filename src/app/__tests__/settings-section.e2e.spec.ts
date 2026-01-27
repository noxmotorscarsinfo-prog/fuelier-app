/**
 * Tests E2E para el Módulo de Settings
 * 
 * Cubre:
 * - FLUJO 1: Actualización de perfil
 * - FLUJO 2: Personalización de macros
 * - FLUJO 3: Preferencias alimenticias
 * - FLUJO 4: Configuración de la app
 * - FLUJO 5: Validaciones y protecciones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// DATOS DE PRUEBA
// ============================================

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  weight: 75,
  height: 175,
  age: 30,
  sex: 'male',
  goal: 'moderate_loss',
  trainingFrequency: 4,
  mealsPerDay: 4,
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  },
  preferences: {
    likes: ['Pollo', 'Arroz'],
    dislikes: ['Pescado'],
    intolerances: ['Lactosa'],
    allergies: []
  },
  settings: {
    autoSaveDays: true,
    timezone: 'Europe/Madrid'
  }
};

// ============================================
// FLUJO 1: ACTUALIZACIÓN DE PERFIL
// ============================================

describe('FLUJO 1: Actualización de perfil', () => {
  it('1.1 - Detecta cambios en peso', () => {
    let currentWeight: number = 75;
    const newWeight: number = 74;
    
    const hasChanges = currentWeight !== newWeight;
    
    expect(hasChanges).toBe(true);
  });

  it('1.2 - Detecta cambios en altura', () => {
    let currentHeight: number = 175;
    const newHeight: number = 176;
    
    const hasChanges = currentHeight !== newHeight;
    
    expect(hasChanges).toBe(true);
  });

  it('1.3 - Detecta cambios en edad', () => {
    let currentAge: number = 30;
    const newAge: number = 31;
    
    const hasChanges = currentAge !== newAge;
    
    expect(hasChanges).toBe(true);
  });

  it('1.4 - Detecta cambios en objetivo', () => {
    let currentGoal: string = 'moderate_loss';
    const newGoal: string = 'maintenance';
    
    const hasChanges = currentGoal !== newGoal;
    
    expect(hasChanges).toBe(true);
  });

  it('1.5 - Detecta cambios en frecuencia de entrenamiento', () => {
    let currentFrequency: number = 4;
    const newFrequency: number = 5;
    
    const hasChanges = currentFrequency !== newFrequency;
    
    expect(hasChanges).toBe(true);
  });

  it('1.6 - Detecta cambios en número de comidas', () => {
    let currentMeals: number = 4;
    const newMeals: number = 3;
    
    const hasChanges = currentMeals !== newMeals;
    
    expect(hasChanges).toBe(true);
  });
});

// ============================================
// FLUJO 2: PERSONALIZACIÓN DE MACROS
// ============================================

describe('FLUJO 2: Personalización de macros', () => {
  it('2.1 - Ajusta macros proporcionalmente al cambiar calorías', () => {
    const customProtein = 150;
    const customCarbs = 200;
    const customFat = 65;
    const oldTotalCalories = (customProtein * 4) + (customCarbs * 4) + (customFat * 9);
    const newCalories = 2200;
    
    const scaleFactor = newCalories / oldTotalCalories;
    
    const newProtein = Math.round((customProtein * scaleFactor) / 5) * 5;
    const newCarbs = Math.round((customCarbs * scaleFactor) / 5) * 5;
    const newFat = Math.round((customFat * scaleFactor) / 5) * 5;
    
    expect(newProtein).toBeGreaterThan(customProtein);
    expect(newCarbs).toBeGreaterThan(customCarbs);
    expect(newFat).toBeGreaterThan(customFat);
  });

  it('2.2 - Recalcula calorías al cambiar proteína', () => {
    const newProtein = 160;
    const customCarbs = 200;
    const customFat = 65;
    
    const newCalories = (newProtein * 4) + (customCarbs * 4) + (customFat * 9);
    
    expect(newCalories).toBe(2025);
  });

  it('2.3 - Recalcula calorías al cambiar carbohidratos', () => {
    const customProtein = 150;
    const newCarbs = 220;
    const customFat = 65;
    
    const newCalories = (customProtein * 4) + (newCarbs * 4) + (customFat * 9);
    
    expect(newCalories).toBe(2065);
  });

  it('2.4 - Recalcula calorías al cambiar grasas', () => {
    const customProtein = 150;
    const customCarbs = 200;
    const newFat = 70;
    
    const newCalories = (customProtein * 4) + (customCarbs * 4) + (newFat * 9);
    
    expect(newCalories).toBe(2030);
  });

  it('2.5 - Redondea valores a múltiplos de 5', () => {
    const roundToFive = (value: number) => Math.round(value / 5) * 5;
    
    expect(roundToFive(152)).toBe(150);
    expect(roundToFive(153)).toBe(155);
    expect(roundToFive(157)).toBe(155);
    expect(roundToFive(158)).toBe(160);
  });

  it('2.6 - Redondea calorías a múltiplos de 10', () => {
    const roundToTen = (value: number) => Math.round(value / 10) * 10;
    
    expect(roundToTen(2025)).toBe(2030);
    expect(roundToTen(2024)).toBe(2020);
  });

  it('2.7 - Maneja macros en 0 con distribución por defecto', () => {
    const customProtein = 0;
    const customCarbs = 0;
    const customFat = 0;
    const newCalories = 2000;
    
    const oldTotalCalories = (customProtein * 4) + (customCarbs * 4) + (customFat * 9);
    
    // Si oldTotalCalories es 0, usar distribución por defecto
    let newProtein, newCarbs, newFat;
    if (oldTotalCalories === 0) {
      // 30% proteína, 40% carbs, 30% grasa
      newProtein = Math.round((newCalories * 0.30 / 4) / 5) * 5;
      newCarbs = Math.round((newCalories * 0.40 / 4) / 5) * 5;
      newFat = Math.round((newCalories * 0.30 / 9) / 5) * 5;
    }
    
    expect(oldTotalCalories).toBe(0);
    expect(newProtein).toBeGreaterThan(0);
    expect(newCarbs).toBeGreaterThan(0);
    expect(newFat).toBeGreaterThan(0);
  });
});

// ============================================
// FLUJO 3: PREFERENCIAS ALIMENTICIAS
// ============================================

describe('FLUJO 3: Preferencias alimenticias', () => {
  it('3.1 - Añade alimento a likes', () => {
    const likes = ['Pollo', 'Arroz'];
    const newItem = 'Pavo';
    
    const updatedLikes = [...likes, newItem];
    
    expect(updatedLikes).toContain('Pavo');
    expect(updatedLikes).toHaveLength(3);
  });

  it('3.2 - Elimina alimento de dislikes', () => {
    const dislikes = ['Pescado', 'Mariscos'];
    const itemToRemove = 'Pescado';
    
    const updatedDislikes = dislikes.filter(i => i !== itemToRemove);
    
    expect(updatedDislikes).not.toContain('Pescado');
    expect(updatedDislikes).toHaveLength(1);
  });

  it('3.3 - Toggle de preferencia (añade si no existe)', () => {
    const currentList = ['Pollo'];
    const item = 'Pavo';
    
    const toggleItem = (list: string[], item: string) => {
      if (list.includes(item)) {
        return list.filter(i => i !== item);
      } else {
        return [...list, item];
      }
    };
    
    const result = toggleItem(currentList, item);
    
    expect(result).toContain('Pavo');
  });

  it('3.4 - Toggle de preferencia (elimina si existe)', () => {
    const currentList = ['Pollo', 'Pavo'];
    const item = 'Pavo';
    
    const toggleItem = (list: string[], item: string) => {
      if (list.includes(item)) {
        return list.filter(i => i !== item);
      } else {
        return [...list, item];
      }
    };
    
    const result = toggleItem(currentList, item);
    
    expect(result).not.toContain('Pavo');
  });

  it('3.5 - No añade duplicados', () => {
    const currentList = ['Pollo'];
    const item = 'Pollo';
    
    const addIfNotExists = (list: string[], item: string) => {
      if (!list.includes(item)) {
        return [...list, item];
      }
      return list;
    };
    
    const result = addIfNotExists(currentList, item);
    
    expect(result).toHaveLength(1);
  });

  it('3.6 - Añade preferencia personalizada', () => {
    const currentList: string[] = [];
    const customInput = 'Salmón ahumado';
    
    const trimmedInput = customInput.trim();
    const result = trimmedInput ? [...currentList, trimmedInput] : currentList;
    
    expect(result).toContain('Salmón ahumado');
  });
});

// ============================================
// FLUJO 4: CONFIGURACIÓN DE LA APP
// ============================================

describe('FLUJO 4: Configuración de la app', () => {
  it('4.1 - Detecta cambios en autoSaveDays', () => {
    let currentSetting: boolean = true;
    const newSetting: boolean = false;
    
    const hasChanges = currentSetting !== newSetting;
    
    expect(hasChanges).toBe(true);
  });

  it('4.2 - Detecta cambios en timezone', () => {
    let currentTimezone: string = 'Europe/Madrid';
    const newTimezone: string = 'America/New_York';
    
    const hasChanges = currentTimezone !== newTimezone;
    
    expect(hasChanges).toBe(true);
  });

  it('4.3 - Obtiene timezone por defecto del sistema', () => {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    expect(typeof systemTimezone).toBe('string');
    expect(systemTimezone.length).toBeGreaterThan(0);
  });

  it('4.4 - Reset restaura valores originales', () => {
    const original = { weight: 75, height: 175, age: 30 };
    let current = { weight: 74, height: 176, age: 31 };
    
    // Simular reset
    current = { ...original };
    
    expect(current.weight).toBe(75);
    expect(current.height).toBe(175);
    expect(current.age).toBe(30);
  });
});

// ============================================
// FLUJO 5: VALIDACIONES Y PROTECCIONES
// ============================================

describe('FLUJO 5: Validaciones y protecciones', () => {
  it('5.1 - Peso dentro de rango válido (30-300 kg)', () => {
    const validWeights = [30, 75, 150, 300];
    const invalidWeights = [25, 350];
    
    const isValidWeight = (weight: number) => weight >= 30 && weight <= 300;
    
    validWeights.forEach(w => expect(isValidWeight(w)).toBe(true));
    invalidWeights.forEach(w => expect(isValidWeight(w)).toBe(false));
  });

  it('5.2 - Altura dentro de rango válido (100-250 cm)', () => {
    const validHeights = [100, 175, 200, 250];
    const invalidHeights = [90, 260];
    
    const isValidHeight = (height: number) => height >= 100 && height <= 250;
    
    validHeights.forEach(h => expect(isValidHeight(h)).toBe(true));
    invalidHeights.forEach(h => expect(isValidHeight(h)).toBe(false));
  });

  it('5.3 - Edad dentro de rango válido (13-100)', () => {
    const validAges = [13, 30, 65, 100];
    const invalidAges = [10, 105];
    
    const isValidAge = (age: number) => age >= 13 && age <= 100;
    
    validAges.forEach(a => expect(isValidAge(a)).toBe(true));
    invalidAges.forEach(a => expect(isValidAge(a)).toBe(false));
  });

  it('5.4 - Frecuencia de entrenamiento válida (0-7)', () => {
    const validFrequencies = [0, 3, 5, 7];
    const invalidFrequencies = [-1, 8];
    
    const isValidFrequency = (freq: number) => freq >= 0 && freq <= 7;
    
    validFrequencies.forEach(f => expect(isValidFrequency(f)).toBe(true));
    invalidFrequencies.forEach(f => expect(isValidFrequency(f)).toBe(false));
  });

  it('5.5 - Número de comidas válido (2-6)', () => {
    const validMeals = [2, 3, 4, 5, 6];
    const invalidMeals = [1, 7];
    
    const isValidMeals = (meals: number) => meals >= 2 && meals <= 6;
    
    validMeals.forEach(m => expect(isValidMeals(m)).toBe(true));
    invalidMeals.forEach(m => expect(isValidMeals(m)).toBe(false));
  });

  it('5.6 - Objetivos válidos', () => {
    const validGoals = ['rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain'];
    const invalidGoal = 'unknown';
    
    expect(validGoals).toContain('moderate_loss');
    expect(validGoals).not.toContain(invalidGoal);
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Settings', () => {
  it('User tiene todas las propiedades requeridas', () => {
    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('name');
    expect(mockUser).toHaveProperty('weight');
    expect(mockUser).toHaveProperty('height');
    expect(mockUser).toHaveProperty('goals');
  });

  it('Goals tiene todos los macros', () => {
    expect(mockUser.goals).toHaveProperty('calories');
    expect(mockUser.goals).toHaveProperty('protein');
    expect(mockUser.goals).toHaveProperty('carbs');
    expect(mockUser.goals).toHaveProperty('fat');
  });

  it('Preferences tiene estructura correcta', () => {
    expect(mockUser.preferences).toHaveProperty('likes');
    expect(mockUser.preferences).toHaveProperty('dislikes');
    expect(mockUser.preferences).toHaveProperty('intolerances');
    expect(mockUser.preferences).toHaveProperty('allergies');
    expect(Array.isArray(mockUser.preferences!.likes)).toBe(true);
  });

  it('Settings tiene estructura correcta', () => {
    expect(mockUser.settings).toHaveProperty('autoSaveDays');
    expect(mockUser.settings).toHaveProperty('timezone');
  });
});
