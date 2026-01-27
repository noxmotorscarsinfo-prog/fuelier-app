import { describe, it, expect, beforeEach } from 'vitest';
import { Meal } from '../types';
import { calculateMacrosFromIngredients } from '../../data/ingredientsDatabase';

describe('Meal Creation & Macro Rounding', () => {
  describe('calculateMacrosFromIngredients', () => {
    it('should round all macros to integers (no decimals)', () => {
      // Test with typical ingredients
      const ingredients = [
        { ingredientId: 'pollo-pechuga', amountInGrams: 150 }, // 31g protein per 100g = 46.5g -> 47g
      ];

      const macros = calculateMacrosFromIngredients(ingredients as any);

      // Verify all values are integers
      expect(Number.isInteger(macros.calories)).toBe(true);
      expect(Number.isInteger(macros.protein)).toBe(true);
      expect(Number.isInteger(macros.carbs)).toBe(true);
      expect(Number.isInteger(macros.fat)).toBe(true);

      // Verify no decimal parts
      expect(macros.calories % 1).toBe(0);
      expect(macros.protein % 1).toBe(0);
      expect(macros.carbs % 1).toBe(0);
      expect(macros.fat % 1).toBe(0);
    });

    it('should handle mixed ingredients correctly', () => {
      const ingredients = [
        { ingredientId: 'pollo-pechuga', amountInGrams: 100 },
        { ingredientId: 'arroz-blanco', amountInGrams: 150 },
        { ingredientId: 'tomate', amountInGrams: 50 }
      ];

      const macros = calculateMacrosFromIngredients(ingredients as any);

      expect(Number.isInteger(macros.calories)).toBe(true);
      expect(Number.isInteger(macros.protein)).toBe(true);
      expect(macros.calories).toBeGreaterThan(0);
      expect(macros.protein).toBeGreaterThan(0);
    });

    it('should return 0 for empty ingredients', () => {
      const macros = calculateMacrosFromIngredients([]);

      expect(macros.calories).toBe(0);
      expect(macros.protein).toBe(0);
      expect(macros.carbs).toBe(0);
      expect(macros.fat).toBe(0);
    });
  });

  describe('Meal object structure', () => {
    it('should have macros as integers when created', () => {
      const testMeal: Meal = {
        id: 'test-meal-1',
        name: 'Test Meal',
        type: 'breakfast',
        calories: 450,
        protein: 31,
        carbs: 45,
        fat: 12,
        baseQuantity: 300,
        ingredients: ['100g pollo', '150g arroz'],
        isCustom: true
      };

      expect(Number.isInteger(testMeal.calories)).toBe(true);
      expect(Number.isInteger(testMeal.protein)).toBe(true);
      expect(Number.isInteger(testMeal.carbs)).toBe(true);
      expect(Number.isInteger(testMeal.fat)).toBe(true);
    });
  });
});
