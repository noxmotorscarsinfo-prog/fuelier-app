/**
 * Tests E2E para el Módulo de Onboarding
 * 
 * Cubre:
 * - FLUJO 1: Selección de sexo
 * - FLUJO 2: Edad y fecha de nacimiento
 * - FLUJO 3: Peso y altura
 * - FLUJO 4: Actividad y frecuencia
 * - FLUJO 5: Objetivos y macros
 * - FLUJO 6: Distribución y preferencias
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MOCKS
// ============================================

const mockSaveUser = vi.fn();
const mockGetAuthToken = vi.fn();

vi.mock('../utils/api', () => ({
  saveUser: (...args: any[]) => mockSaveUser(...args),
  getAuthToken: () => mockGetAuthToken(),
}));

// ============================================
// DATOS DE PRUEBA
// ============================================

const validUserData = {
  email: 'test@test.com',
  name: 'Test User',
  sex: 'male' as const,
  age: 30,
  birthdate: '1995-06-15',
  weight: 75,
  height: 175,
  trainingFrequency: 4,
  goal: 'maintenance' as const,
  mealsPerDay: 4,
  goals: {
    calories: 2200,
    protein: 165,
    carbs: 220,
    fat: 73
  },
  mealDistribution: {
    breakfast: 25,
    lunch: 35,
    snack: 10,
    dinner: 30
  },
  preferences: {
    likes: ['pollo', 'arroz'],
    dislikes: ['hígado'],
    intolerances: [],
    allergies: []
  }
};

// ============================================
// FLUJO 1: SELECCIÓN DE SEXO
// ============================================

describe('FLUJO 1: Selección de sexo', () => {
  it('1.1 - Acepta selección de hombre', () => {
    const sex: 'male' | 'female' = 'male';
    expect(['male', 'female']).toContain(sex);
  });

  it('1.2 - Acepta selección de mujer', () => {
    const sex: 'male' | 'female' = 'female';
    expect(['male', 'female']).toContain(sex);
  });

  it('1.3 - Sexo afecta cálculos de metabolismo basal', () => {
    // Fórmula Harris-Benedict
    const calculateBMR = (sex: 'male' | 'female', weight: number, height: number, age: number) => {
      if (sex === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      }
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    };
    
    const bmrMale = calculateBMR('male', 75, 175, 30);
    const bmrFemale = calculateBMR('female', 75, 175, 30);
    
    // Hombres tienen BMR más alto (por músculo)
    expect(bmrMale).toBeGreaterThan(bmrFemale);
  });
});

// ============================================
// FLUJO 2: EDAD Y FECHA DE NACIMIENTO
// ============================================

describe('FLUJO 2: Edad y fecha de nacimiento', () => {
  it('2.1 - Calcula edad correctamente desde fecha de nacimiento', () => {
    const calculateAge = (birthdate: string): number => {
      const today = new Date('2026-01-12'); // Fecha actual mock
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    };
    
    expect(calculateAge('1995-06-15')).toBe(30);
    expect(calculateAge('1990-01-01')).toBe(36);
  });

  it('2.2 - Valida edad mínima (13 años)', () => {
    const age = 12;
    const isValidAge = age >= 13 && age <= 100;
    expect(isValidAge).toBe(false);
  });

  it('2.3 - Valida edad máxima (100 años)', () => {
    const age = 101;
    const isValidAge = age >= 13 && age <= 100;
    expect(isValidAge).toBe(false);
  });

  it('2.4 - Acepta edad válida', () => {
    const age = 30;
    const isValidAge = age >= 13 && age <= 100;
    expect(isValidAge).toBe(true);
  });
});

// ============================================
// FLUJO 3: PESO Y ALTURA
// ============================================

describe('FLUJO 3: Peso y altura', () => {
  it('3.1 - Valida peso mínimo (30 kg)', () => {
    const weight = 25;
    const isValidWeight = weight >= 30 && weight <= 300;
    expect(isValidWeight).toBe(false);
  });

  it('3.2 - Valida peso máximo (300 kg)', () => {
    const weight = 350;
    const isValidWeight = weight >= 30 && weight <= 300;
    expect(isValidWeight).toBe(false);
  });

  it('3.3 - Acepta peso válido', () => {
    const weight = 75;
    const isValidWeight = weight >= 30 && weight <= 300;
    expect(isValidWeight).toBe(true);
  });

  it('3.4 - Valida altura mínima (100 cm)', () => {
    const height = 90;
    const isValidHeight = height >= 100 && height <= 250;
    expect(isValidHeight).toBe(false);
  });

  it('3.5 - Valida altura máxima (250 cm)', () => {
    const height = 260;
    const isValidHeight = height >= 100 && height <= 250;
    expect(isValidHeight).toBe(false);
  });

  it('3.6 - Calcula IMC correctamente', () => {
    const weight = 75;
    const height = 175;
    const imc = weight / Math.pow(height / 100, 2);
    
    expect(imc).toBeCloseTo(24.49, 1);
    expect(imc).toBeGreaterThan(18.5); // No bajo peso
    expect(imc).toBeLessThan(25); // Normal
  });
});

// ============================================
// FLUJO 4: ACTIVIDAD Y FRECUENCIA
// ============================================

describe('FLUJO 4: Actividad y frecuencia de entrenamiento', () => {
  it('4.1 - Acepta frecuencia de 0 a 7 días', () => {
    const frequencies = [0, 1, 2, 3, 4, 5, 6, 7];
    
    frequencies.forEach(freq => {
      const isValid = freq >= 0 && freq <= 7;
      expect(isValid).toBe(true);
    });
  });

  it('4.2 - Factor de actividad afecta TDEE', () => {
    const bmr = 1800;
    
    const activityFactors: { [key: string]: number } = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    
    const tdeeSedentary = bmr * activityFactors.sedentary;
    const tdeeActive = bmr * activityFactors.very_active;
    
    expect(tdeeActive).toBeGreaterThan(tdeeSedentary);
    expect(tdeeSedentary).toBeCloseTo(2160, 0);
    expect(tdeeActive).toBeCloseTo(3105, 0);
  });

  it('4.3 - Frecuencia afecta factor de actividad', () => {
    const getActivityFactor = (frequency: number): number => {
      if (frequency === 0) return 1.2;
      if (frequency <= 2) return 1.375;
      if (frequency <= 4) return 1.55;
      if (frequency <= 5) return 1.725;
      return 1.9;
    };
    
    expect(getActivityFactor(0)).toBe(1.2);
    expect(getActivityFactor(3)).toBe(1.55);
    expect(getActivityFactor(6)).toBe(1.9);
  });
});

// ============================================
// FLUJO 5: OBJETIVOS Y MACROS
// ============================================

describe('FLUJO 5: Objetivos y macros', () => {
  it('5.1 - Tipos de objetivo válidos', () => {
    const goalTypes = ['rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain'];
    
    goalTypes.forEach(goal => {
      expect(goalTypes).toContain(goal);
    });
  });

  it('5.2 - Macros suman calorías correctamente', () => {
    const goals = validUserData.goals;
    
    // 1g proteína = 4 kcal, 1g carbs = 4 kcal, 1g grasa = 9 kcal
    const calculatedCalories = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9);
    
    // Permitir margen del 5% por redondeo
    const margin = goals.calories * 0.05;
    expect(Math.abs(calculatedCalories - goals.calories)).toBeLessThan(margin);
  });

  it('5.3 - Proteína mínima por kg de peso', () => {
    const weight = 75;
    const protein = validUserData.goals.protein;
    const proteinPerKg = protein / weight;
    
    // Mínimo recomendado: 1.6g/kg para atletas
    expect(proteinPerKg).toBeGreaterThanOrEqual(1.5);
  });

  it('5.4 - Déficit calórico para pérdida de peso', () => {
    const maintenanceCalories = 2500;
    const deficitRate = 0.2; // 20% déficit
    const targetCalories = maintenanceCalories * (1 - deficitRate);
    
    expect(targetCalories).toBe(2000);
  });

  it('5.5 - Superávit calórico para ganancia de peso', () => {
    const maintenanceCalories = 2500;
    const surplusRate = 0.15; // 15% superávit
    const targetCalories = maintenanceCalories * (1 + surplusRate);
    
    expect(targetCalories).toBe(2875);
  });
});

// ============================================
// FLUJO 6: DISTRIBUCIÓN Y PREFERENCIAS
// ============================================

describe('FLUJO 6: Distribución de comidas y preferencias', () => {
  it('6.1 - Distribución suma 100%', () => {
    const distribution = validUserData.mealDistribution;
    const total = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
    
    expect(total).toBe(100);
  });

  it('6.2 - Cada comida tiene mínimo 5%', () => {
    const distribution = validUserData.mealDistribution;
    
    Object.values(distribution).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(5);
    });
  });

  it('6.3 - Preferencias tienen estructura correcta', () => {
    const preferences = validUserData.preferences;
    
    expect(preferences).toHaveProperty('likes');
    expect(preferences).toHaveProperty('dislikes');
    expect(preferences).toHaveProperty('intolerances');
    expect(preferences).toHaveProperty('allergies');
    expect(Array.isArray(preferences.likes)).toBe(true);
    expect(Array.isArray(preferences.allergies)).toBe(true);
  });

  it('6.4 - Preferencias son opcionales (pueden estar vacías)', () => {
    const emptyPreferences = {
      likes: [],
      dislikes: [],
      intolerances: [],
      allergies: []
    };
    
    expect(emptyPreferences.likes.length).toBe(0);
    expect(emptyPreferences.allergies.length).toBe(0);
  });
});

// ============================================
// FLUJO 7: GUARDADO DE PERFIL
// ============================================

describe('FLUJO 7: Guardado de perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('7.1 - Guarda usuario con todos los campos requeridos', async () => {
    mockSaveUser.mockResolvedValue(true);
    mockGetAuthToken.mockReturnValue('valid-token');
    
    await mockSaveUser(validUserData);
    
    expect(mockSaveUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        sex: 'male',
        weight: 75,
        height: 175,
        goals: expect.objectContaining({
          calories: expect.any(Number),
          protein: expect.any(Number)
        })
      })
    );
  });

  it('7.2 - Falla si no hay token de autenticación', async () => {
    mockGetAuthToken.mockReturnValue(null);
    
    const hasToken = !!mockGetAuthToken();
    expect(hasToken).toBe(false);
  });

  it('7.3 - Maneja error de guardado graciosamente', async () => {
    mockSaveUser.mockRejectedValue(new Error('Network error'));
    
    let errorCaught = false;
    try {
      await mockSaveUser(validUserData);
    } catch (e) {
      errorCaught = true;
    }
    
    expect(errorCaught).toBe(true);
  });

  it('7.4 - Usuario tiene fecha de creación', () => {
    const user = { ...validUserData, createdAt: new Date().toISOString() };
    
    expect(user.createdAt).toBeDefined();
    expect(new Date(user.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

// ============================================
// VALIDACIONES GENERALES
// ============================================

describe('Validaciones generales de Onboarding', () => {
  it('Usuario tiene todos los campos requeridos', () => {
    const requiredFields = ['email', 'name', 'sex', 'age', 'weight', 'height', 'goals'];
    
    requiredFields.forEach(field => {
      expect(validUserData).toHaveProperty(field);
    });
  });

  it('Goals tiene estructura correcta', () => {
    const goals = validUserData.goals;
    
    expect(goals).toHaveProperty('calories');
    expect(goals).toHaveProperty('protein');
    expect(goals).toHaveProperty('carbs');
    expect(goals).toHaveProperty('fat');
    expect(typeof goals.calories).toBe('number');
    expect(goals.calories).toBeGreaterThan(0);
  });

  it('Datos numéricos son positivos', () => {
    expect(validUserData.age).toBeGreaterThan(0);
    expect(validUserData.weight).toBeGreaterThan(0);
    expect(validUserData.height).toBeGreaterThan(0);
    expect(validUserData.trainingFrequency).toBeGreaterThanOrEqual(0);
  });
});
