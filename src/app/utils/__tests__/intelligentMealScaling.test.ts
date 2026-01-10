import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scaleToExactTarget,
  rankMealsByFit,
} from '../intelligentMealScaling';
import { Meal, User, DailyLog, MealType } from '../../types';
import { createMockUser, createMockMeal, createMockDailyLog } from '../../../tests/mocks/mockData';
import * as ingredientsDB from '../../../data/ingredientsDatabase';

// Mock calculateMacrosFromIngredients to return predictable values
vi.mock('../../../data/ingredientsDatabase', async () => {
  const actual = await vi.importActual('../../../data/ingredientsDatabase');
  return {
    ...actual,
    calculateMacrosFromIngredients: vi.fn((refs: any[]) => {
      // Simple proportional calculation for testing
      const totalGrams = refs.reduce((sum, ref) => sum + ref.amountInGrams, 0);
      return {
        calories: totalGrams * 1.5,
        protein: totalGrams * 0.2,
        carbs: totalGrams * 0.25,
        fat: totalGrams * 0.1,
      };
    }),
  };
});

describe('Intelligent Meal Scaling', () => {
  // Suppress console logs during tests
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scaleToExactTarget', () => {
    it('should scale meal proportionally to match target calories', () => {
      const meal = createMockMeal({
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        ingredientReferences: [
          { ingredientId: 'rice', amountInGrams: 100 },
          { ingredientId: 'chicken', amountInGrams: 150 },
        ],
      });

      const targetMacros = {
        calories: 750,
        protein: 45,
        carbs: 75,
        fat: 30,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      // Should scale up by approximately 1.5x
      expect(scaled.ingredientReferences).toBeDefined();
      expect(scaled.ingredientReferences![0].amountInGrams).toBeGreaterThanOrEqual(145);
      expect(scaled.ingredientReferences![0].amountInGrams).toBeLessThanOrEqual(155);
      expect(scaled.ingredientReferences![1].amountInGrams).toBeGreaterThanOrEqual(220);
      expect(scaled.ingredientReferences![1].amountInGrams).toBeLessThanOrEqual(230);
      expect(scaled.scaledForTarget).toBe(true);
    });

    it('should apply perfect matching for last meal', () => {
      const meal = createMockMeal({
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        ingredientReferences: [
          { ingredientId: 'rice', amountInGrams: 100 },
          { ingredientId: 'chicken', amountInGrams: 150 },
        ],
      });

      const targetMacros = {
        calories: 612,
        protein: 38,
        carbs: 61,
        fat: 24,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, true);

      // Last meal should match exactly
      expect(scaled.calories).toBe(612);
      expect(scaled.protein).toBe(38);
      expect(scaled.carbs).toBe(61);
      expect(scaled.fat).toBe(24);
      expect(scaled.isLastMeal).toBe(true);
      expect(scaled.perfectMatch).toBe(true);
    });

    it('should handle meals without ingredient references', () => {
      const meal = createMockMeal({
        calories: 400,
        protein: 25,
        carbs: 40,
        fat: 15,
        ingredientReferences: undefined,
      });

      const targetMacros = {
        calories: 600,
        protein: 37.5,
        carbs: 60,
        fat: 22.5,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      expect(scaled.calories).toBeGreaterThan(400);
      expect(scaled._scaled).toBe(true);
      expect(scaled.ingredientReferences).toBeUndefined();
    });

    it('should scale down when target is smaller', () => {
      const meal = createMockMeal({
        calories: 800,
        protein: 50,
        carbs: 80,
        fat: 30,
        ingredientReferences: [
          { ingredientId: 'rice', amountInGrams: 200 },
          { ingredientId: 'chicken', amountInGrams: 200 },
        ],
      });

      const targetMacros = {
        calories: 400,
        protein: 25,
        carbs: 40,
        fat: 15,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      // Should scale down by approximately 0.5x
      expect(scaled.ingredientReferences![0].amountInGrams).toBeGreaterThanOrEqual(95);
      expect(scaled.ingredientReferences![0].amountInGrams).toBeLessThanOrEqual(105);
      expect(scaled.ingredientReferences![1].amountInGrams).toBeGreaterThanOrEqual(95);
      expect(scaled.ingredientReferences![1].amountInGrams).toBeLessThanOrEqual(105);
    });

    it('should handle zero base macros gracefully', () => {
      const meal = createMockMeal({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        ingredientReferences: [
          { ingredientId: 'water', amountInGrams: 100 },
        ],
      });

      const targetMacros = {
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      expect(scaled).toBeDefined();
      expect(scaled.scaledForTarget).toBe(true);
    });

    it('should preserve meal metadata when scaling', () => {
      const meal = createMockMeal({
        name: 'Chicken Rice Bowl',
        isCustom: true,
        isGlobal: false,
        calories: 600,
        protein: 40,
        carbs: 60,
        fat: 20,
        ingredientReferences: [
          { ingredientId: 'rice', amountInGrams: 150 },
          { ingredientId: 'chicken', amountInGrams: 200 },
        ],
      });

      const targetMacros = {
        calories: 900,
        protein: 60,
        carbs: 90,
        fat: 30,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      expect(scaled.name).toBe('Chicken Rice Bowl');
      expect(scaled.isCustom).toBe(true);
      expect(scaled.isGlobal).toBe(false);
    });

    it('should set baseQuantity multiplier', () => {
      const meal = createMockMeal({
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        ingredientReferences: [
          { ingredientId: 'rice', amountInGrams: 100 },
        ],
      });

      const targetMacros = {
        calories: 1000,
        protein: 60,
        carbs: 100,
        fat: 40,
      };

      const scaled = scaleToExactTarget(meal, targetMacros, false);

      expect(scaled.baseQuantity).toBeDefined();
      expect(scaled.baseQuantity).toBeGreaterThan(1);
    });
  });

  describe('rankMealsByFit', () => {
    const user = createMockUser({
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67,
      },
    });

    const emptyLog = createMockDailyLog({
      breakfast: null,
      lunch: null,
      snack: null,
      dinner: null,
    });

    it('should rank meals by best fit to target', () => {
      const meals = [
        createMockMeal({
          name: 'High Protein',
          calories: 600,
          protein: 50,
          carbs: 50,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'chicken', amountInGrams: 200 }],
        }),
        createMockMeal({
          name: 'Balanced',
          calories: 500,
          protein: 30,
          carbs: 50,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'rice', amountInGrams: 150 }],
        }),
        createMockMeal({
          name: 'Low Cal',
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 8,
          ingredientReferences: [{ ingredientId: 'salad', amountInGrams: 100 }],
        }),
      ];

      const targetMacros = {
        calories: 500,
        protein: 35,
        carbs: 50,
        fat: 18,
      };

      const ranked = rankMealsByFit(meals, user, emptyLog, 'breakfast', targetMacros);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].fitScore).toBeGreaterThanOrEqual(ranked[1].fitScore);
      expect(ranked[1].fitScore).toBeGreaterThanOrEqual(ranked[2].fitScore);
    });

    it('should scale all meals to target', () => {
      const meals = [
        createMockMeal({
          calories: 300,
          protein: 20,
          carbs: 30,
          fat: 10,
          ingredientReferences: [{ ingredientId: 'meal1', amountInGrams: 100 }],
        }),
        createMockMeal({
          calories: 600,
          protein: 40,
          carbs: 60,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'meal2', amountInGrams: 200 }],
        }),
      ];

      const targetMacros = {
        calories: 450,
        protein: 30,
        carbs: 45,
        fat: 15,
      };

      const ranked = rankMealsByFit(meals, user, emptyLog, 'lunch', targetMacros);

      ranked.forEach(result => {
        expect(result.scaledMeal.scaledForTarget).toBe(true);
        expect(result.scaledMeal.ingredientReferences).toBeDefined();
      });
    });

    it('should calculate fit scores between 0 and 100', () => {
      const meals = [
        createMockMeal({
          calories: 500,
          protein: 30,
          carbs: 50,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'meal', amountInGrams: 150 }],
        }),
      ];

      const targetMacros = {
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
      };

      const ranked = rankMealsByFit(meals, user, emptyLog, 'dinner', targetMacros);

      expect(ranked[0].fitScore).toBeGreaterThanOrEqual(0);
      expect(ranked[0].fitScore).toBeLessThanOrEqual(100);
    });

    it('should handle last meal flag correctly', () => {
      const meals = [
        createMockMeal({
          calories: 500,
          protein: 30,
          carbs: 50,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'meal', amountInGrams: 150 }],
        }),
      ];

      const targetMacros = {
        calories: 487,
        protein: 32,
        carbs: 51,
        fat: 19,
        isLastMeal: true,
      };

      const ranked = rankMealsByFit(meals, user, emptyLog, 'dinner', targetMacros);

      expect(ranked[0].scaledMeal.isLastMeal).toBe(true);
      expect(ranked[0].scaledMeal.perfectMatch).toBe(true);
      expect(ranked[0].scaledMeal.calories).toBe(487);
      expect(ranked[0].scaledMeal.protein).toBe(32);
    });

    it('should preserve original meal data', () => {
      const originalMeal = createMockMeal({
        name: 'Original',
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        ingredientReferences: [{ ingredientId: 'meal', amountInGrams: 150 }],
      });

      const targetMacros = {
        calories: 750,
        protein: 45,
        carbs: 75,
        fat: 30,
      };

      const ranked = rankMealsByFit([originalMeal], user, emptyLog, 'breakfast', targetMacros);

      expect(ranked[0].meal).toEqual(originalMeal);
      expect(ranked[0].scaledMeal).not.toEqual(originalMeal);
    });

    it('should return empty array for empty meals input', () => {
      const targetMacros = {
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
      };

      const ranked = rankMealsByFit([], user, emptyLog, 'breakfast', targetMacros);

      expect(ranked).toHaveLength(0);
    });

    it('should handle meals with similar macros', () => {
      const meals = [
        createMockMeal({
          name: 'Meal A',
          calories: 500,
          protein: 30,
          carbs: 50,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'a', amountInGrams: 150 }],
        }),
        createMockMeal({
          name: 'Meal B',
          calories: 505,
          protein: 31,
          carbs: 51,
          fat: 20,
          ingredientReferences: [{ ingredientId: 'b', amountInGrams: 152 }],
        }),
      ];

      const targetMacros = {
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
      };

      const ranked = rankMealsByFit(meals, user, emptyLog, 'lunch', targetMacros);

      expect(ranked).toHaveLength(2);
      expect(ranked[0].fitScore).toBeCloseTo(ranked[1].fitScore, 0);
    });
  });
});
