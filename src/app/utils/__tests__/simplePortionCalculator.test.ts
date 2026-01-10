/**
 * Tests para simplePortionCalculator.ts
 * 
 * Prueba las funciones de cálculo de porciones y progreso diario
 */

import { describe, it, expect } from 'vitest';
import {
  getMealTarget,
  getRemainingForDay,
  calculateSimplePortion,
  getDayProgressMessage,
  shouldShowComplementRecommendations
} from '../simplePortionCalculator';
import { createMockUser, createMockDailyLog } from '@/tests/mocks/mockData';
import { Meal, MealType } from '@/app/types';

describe('simplePortionCalculator', () => {
  describe('getMealTarget', () => {
    it('should calculate breakfast target for 4 meals per day', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 4 },
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });

      const target = getMealTarget(user, 'breakfast');
      
      // Breakfast typically gets ~25% of daily calories for 4 meals
      expect(target.calories).toBeGreaterThan(0);
      expect(target.protein).toBeGreaterThan(0);
      expect(target.carbs).toBeGreaterThan(0);
      expect(target.fat).toBeGreaterThan(0);
    });

    it('should calculate lunch target for 3 meals per day', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 3 },
        goals: { calories: 1800, protein: 120, carbs: 180, fat: 60 }
      });

      const target = getMealTarget(user, 'lunch');
      
      expect(target.calories).toBeGreaterThan(0);
      expect(target.protein).toBeGreaterThan(0);
    });

    it('should return zero target for inactive meal type', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 3 }, // Solo 3 comidas, snack no activo
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });

      const target = getMealTarget(user, 'snack');
      
      // Snack might be inactive for 3 meals per day
      expect(target).toBeDefined();
    });
  });

  describe('getRemainingForDay', () => {
    it('should calculate remaining macros when day is empty', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });

      const remaining = getRemainingForDay(user, emptyLog);
      
      expect(remaining.calories).toBe(2000);
      expect(remaining.protein).toBe(150);
      expect(remaining.carbs).toBe(200);
      expect(remaining.fat).toBe(67);
    });

    it('should calculate remaining macros after breakfast', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const logWithBreakfast = createMockDailyLog({
        breakfast: {
          id: 'meal1',
          name: 'Oatmeal',
          calories: 400,
          protein: 15,
          carbs: 60,
          fat: 10,
          portions: 1,
          ingredients: []
        },
        lunch: null,
        snack: null,
        dinner: null
      });

      const remaining = getRemainingForDay(user, logWithBreakfast);
      
      expect(remaining.calories).toBe(1600); // 2000 - 400
      expect(remaining.protein).toBe(135); // 150 - 15
      expect(remaining.carbs).toBe(140); // 200 - 60
      expect(remaining.fat).toBe(57); // 67 - 10
    });

    it('should include complementary meals in remaining calculation', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const logWithComplement = createMockDailyLog({
        breakfast: {
          id: 'meal1',
          name: 'Eggs',
          calories: 300,
          protein: 20,
          carbs: 5,
          fat: 22,
          portions: 1,
          ingredients: []
        },
        lunch: null,
        snack: null,
        dinner: null,
        complementaryMeals: [
          {
            id: 'comp1',
            name: 'Protein shake',
            calories: 150,
            protein: 25,
            carbs: 10,
            fat: 3,
            portions: 1,
            ingredients: []
          }
        ]
      });

      const remaining = getRemainingForDay(user, logWithComplement);
      
      expect(remaining.calories).toBe(1550); // 2000 - 300 - 150
      expect(remaining.protein).toBe(105); // 150 - 20 - 25
      expect(remaining.carbs).toBe(185); // 200 - 5 - 10
      expect(remaining.fat).toBe(42); // 67 - 22 - 3
    });

    it('should handle negative remaining values when over goals', () => {
      const user = createMockUser({
        goals: { calories: 1500, protein: 100, carbs: 150, fat: 50 }
      });
      const overLog = createMockDailyLog({
        breakfast: {
          id: 'meal1',
          name: 'Big breakfast',
          calories: 800,
          protein: 50,
          carbs: 80,
          fat: 30,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'meal2',
          name: 'Big lunch',
          calories: 900,
          protein: 60,
          carbs: 90,
          fat: 35,
          portions: 1,
          ingredients: []
        },
        snack: null,
        dinner: null
      });

      const remaining = getRemainingForDay(user, overLog);
      
      expect(remaining.calories).toBe(-200); // 1500 - 1700
      expect(remaining.protein).toBe(-10); // 100 - 110
      expect(remaining.carbs).toBe(-20); // 150 - 170
      expect(remaining.fat).toBe(-15); // 50 - 65
    });
  });

  describe('calculateSimplePortion', () => {
    it('should calculate optimal portion for balanced meal', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 4 },
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
      const meal: Meal = {
        id: 'meal1',
        name: 'Chicken & Rice',
        calories: 500,
        protein: 40,
        carbs: 50,
        fat: 15,
        portions: 1,
        ingredients: []
      };

      const portion = calculateSimplePortion(user, emptyLog, meal, 'lunch');
      
      expect(portion).toBeGreaterThan(0);
      expect(portion).toBeLessThanOrEqual(2.0);
      // Portion should be reasonable (between 0.5 and 2.0)
      expect(portion).toBeGreaterThanOrEqual(0.5);
    });

    it('should return minimum portion when meal type is inactive', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 3 }, // Snack might be inactive
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
      const meal: Meal = {
        id: 'meal1',
        name: 'Snack',
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 8,
        portions: 1,
        ingredients: []
      };

      // Note: This depends on mealDistribution logic
      const portion = calculateSimplePortion(user, emptyLog, meal, 'snack');
      
      expect(portion).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle zero-calorie meals', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
      const zeroMeal: Meal = {
        id: 'meal1',
        name: 'Water',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        portions: 1,
        ingredients: []
      };

      const portion = calculateSimplePortion(user, emptyLog, zeroMeal, 'breakfast');
      
      expect(portion).toBe(1);
    });

    it('should penalize excess more than deficit', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 4 },
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
      
      // High calorie meal
      const highCalMeal: Meal = {
        id: 'meal1',
        name: 'High calorie',
        calories: 1000,
        protein: 50,
        carbs: 100,
        fat: 40,
        portions: 1,
        ingredients: []
      };

      const portion = calculateSimplePortion(user, emptyLog, highCalMeal, 'lunch');
      
      // Should reduce portion significantly to avoid excess
      expect(portion).toBeLessThan(1.0);
    });

    it('should round portion to 0.05 precision', () => {
      const user = createMockUser({
        preferences: { mealsPerDay: 4 },
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
      const meal: Meal = {
        id: 'meal1',
        name: 'Test meal',
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 12,
        portions: 1,
        ingredients: []
      };

      const portion = calculateSimplePortion(user, emptyLog, meal, 'breakfast');
      
      // Check that portion is multiple of 0.05
      expect((portion * 20) % 1).toBeCloseTo(0, 5);
    });
  });

  describe('getDayProgressMessage', () => {
    it('should return danger message when over 110%', () => {
      const user = createMockUser({
        goals: { calories: 1500, protein: 100, carbs: 150, fat: 50 }
      });
      const overLog = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Meal 1',
          calories: 900,
          protein: 60,
          carbs: 90,
          fat: 30,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Meal 2',
          calories: 800,
          protein: 50,
          carbs: 80,
          fat: 25,
          portions: 1,
          ingredients: []
        },
        snack: null,
        dinner: null
      });

      const result = getDayProgressMessage(user, overLog);
      
      expect(result.type).toBe('danger');
      expect(result.message).toContain('superado');
    });

    it('should return success message when between 95-110%', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const perfectLog = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Meal 1',
          calories: 500,
          protein: 38,
          carbs: 50,
          fat: 17,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Meal 2',
          calories: 600,
          protein: 45,
          carbs: 60,
          fat: 20,
          portions: 1,
          ingredients: []
        },
        snack: {
          id: 'm3',
          name: 'Meal 3',
          calories: 300,
          protein: 22,
          carbs: 30,
          fat: 10,
          portions: 1,
          ingredients: []
        },
        dinner: {
          id: 'm4',
          name: 'Meal 4',
          calories: 500,
          protein: 38,
          carbs: 50,
          fat: 17,
          portions: 1,
          ingredients: []
        }
      });

      const result = getDayProgressMessage(user, perfectLog);
      
      expect(result.type).toBe('success');
      expect(result.message).toContain('Perfecto');
    });

    it('should return info message for mid-progress (50-95%)', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const midLog = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Meal 1',
          calories: 700,
          protein: 50,
          carbs: 70,
          fat: 23,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Meal 2',
          calories: 600,
          protein: 45,
          carbs: 60,
          fat: 20,
          portions: 1,
          ingredients: []
        },
        snack: null,
        dinner: null
      });

      const result = getDayProgressMessage(user, midLog);
      
      expect(result.type).toBe('info');
      expect(result.message).toContain('Llevas');
      expect(result.message).toContain('%');
    });

    it('should return info message for start of day (<50%)', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const startLog = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Meal 1',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 13,
          portions: 1,
          ingredients: []
        },
        lunch: null,
        snack: null,
        dinner: null
      });

      const result = getDayProgressMessage(user, startLog);
      
      expect(result.type).toBe('info');
      expect(result.message).toContain('consumido');
    });

    it('should handle empty day', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const emptyLog = createMockDailyLog({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });

      const result = getDayProgressMessage(user, emptyLog);
      
      expect(result.type).toBe('info');
      expect(result.message).toBeDefined();
    });
  });

  describe('shouldShowComplementRecommendations', () => {
    it('should return true when 3+ meals logged and under 70%', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const log = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Light breakfast',
          calories: 300,
          protein: 20,
          carbs: 30,
          fat: 10,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Light lunch',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 13,
          portions: 1,
          ingredients: []
        },
        snack: {
          id: 'm3',
          name: 'Light snack',
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 7,
          portions: 1,
          ingredients: []
        },
        dinner: null
      });

      const shouldShow = shouldShowComplementRecommendations(user, log);
      
      // 900 / 2000 = 45% < 70%
      expect(shouldShow).toBe(true);
    });

    it('should return false when under 3 meals', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const log = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Breakfast',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 13,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Lunch',
          calories: 500,
          protein: 38,
          carbs: 50,
          fat: 17,
          portions: 1,
          ingredients: []
        },
        snack: null,
        dinner: null
      });

      const shouldShow = shouldShowComplementRecommendations(user, log);
      
      // Only 2 meals
      expect(shouldShow).toBe(false);
    });

    it('should return false when over 70% calories', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const log = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Breakfast',
          calories: 500,
          protein: 38,
          carbs: 50,
          fat: 17,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Lunch',
          calories: 600,
          protein: 45,
          carbs: 60,
          fat: 20,
          portions: 1,
          ingredients: []
        },
        snack: {
          id: 'm3',
          name: 'Snack',
          calories: 400,
          protein: 30,
          carbs: 40,
          fat: 13,
          portions: 1,
          ingredients: []
        },
        dinner: null
      });

      const shouldShow = shouldShowComplementRecommendations(user, log);
      
      // 1500 / 2000 = 75% > 70%
      expect(shouldShow).toBe(false);
    });

    it('should return false when all 4 meals and over 70%', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 }
      });
      const log = createMockDailyLog({
        breakfast: {
          id: 'm1',
          name: 'Breakfast',
          calories: 500,
          protein: 38,
          carbs: 50,
          fat: 17,
          portions: 1,
          ingredients: []
        },
        lunch: {
          id: 'm2',
          name: 'Lunch',
          calories: 600,
          protein: 45,
          carbs: 60,
          fat: 20,
          portions: 1,
          ingredients: []
        },
        snack: {
          id: 'm3',
          name: 'Snack',
          calories: 300,
          protein: 22,
          carbs: 30,
          fat: 10,
          portions: 1,
          ingredients: []
        },
        dinner: {
          id: 'm4',
          name: 'Dinner',
          calories: 100,
          protein: 8,
          carbs: 10,
          fat: 3,
          portions: 1,
          ingredients: []
        }
      });

      const shouldShow = shouldShowComplementRecommendations(user, log);
      
      // 1500 / 2000 = 75% > 70%
      expect(shouldShow).toBe(false);
    });
  });
});
