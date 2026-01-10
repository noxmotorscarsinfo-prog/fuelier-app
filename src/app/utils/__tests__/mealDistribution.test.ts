/**
 * Tests para mealDistribution.ts
 * 
 * Prueba las funciones de distribución de macros entre comidas
 */

import { describe, it, expect } from 'vitest';
import { getMealDistribution, getMealGoals } from '../mealDistribution';
import { createMockUser } from '@/tests/mocks/mockData';

describe('mealDistribution', () => {
  describe('getMealDistribution', () => {
    it('should use custom distribution when provided', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 30,
          lunch: 40,
          snack: 10,
          dinner: 20
        }
      });

      const distribution = getMealDistribution(user);
      
      // Should convert percentages to decimals
      expect(distribution.breakfast).toBe(0.30);
      expect(distribution.lunch).toBe(0.40);
      expect(distribution.snack).toBe(0.10);
      expect(distribution.dinner).toBe(0.20);
      
      // Should sum to 1.0
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 2 meals per day with cutting goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 2,
        goal: 'moderate_loss'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0);
      expect(distribution.lunch).toBe(0.60); // 60% for lunch
      expect(distribution.snack).toBe(0);
      expect(distribution.dinner).toBe(0.40); // 40% for dinner
    });

    it('should calculate distribution for 2 meals per day with bulking goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 2,
        goal: 'moderate_gain'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0);
      expect(distribution.lunch).toBe(0.55); // More balanced
      expect(distribution.snack).toBe(0);
      expect(distribution.dinner).toBe(0.45);
    });

    it('should calculate distribution for 3 meals per day with cutting goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 3,
        goal: 'moderate_loss'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.30);
      expect(distribution.lunch).toBe(0.45);
      expect(distribution.snack).toBe(0);
      expect(distribution.dinner).toBe(0.25);
      
      // Should sum to 1.0
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 3 meals per day with bulking goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 3,
        goal: 'moderate_gain'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.25);
      expect(distribution.lunch).toBe(0.40);
      expect(distribution.snack).toBe(0);
      expect(distribution.dinner).toBe(0.35);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 3 meals per day with maintenance goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 3,
        goal: 'maintenance'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.30);
      expect(distribution.lunch).toBe(0.40);
      expect(distribution.snack).toBe(0);
      expect(distribution.dinner).toBe(0.30);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 4 meals per day with cutting goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 4,
        goal: 'moderate_loss'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.30);
      expect(distribution.lunch).toBe(0.35);
      expect(distribution.snack).toBe(0.10);
      expect(distribution.dinner).toBe(0.25);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 4 meals per day with bulking goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 4,
        goal: 'moderate_gain'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.25);
      expect(distribution.lunch).toBe(0.35);
      expect(distribution.snack).toBe(0.15);
      expect(distribution.dinner).toBe(0.25);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 4 meals per day with maintenance goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 4,
        goal: 'maintenance'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.25);
      expect(distribution.lunch).toBe(0.35);
      expect(distribution.snack).toBe(0.15);
      expect(distribution.dinner).toBe(0.25);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 5 meals per day with cutting goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 5,
        goal: 'moderate_loss'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.25);
      expect(distribution.lunch).toBe(0.30);
      expect(distribution.snack).toBe(0.20); // Represents 2 snacks
      expect(distribution.dinner).toBe(0.25);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should calculate distribution for 5 meals per day with bulking goal', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 5,
        goal: 'moderate_gain'
      });

      const distribution = getMealDistribution(user);
      
      expect(distribution.breakfast).toBe(0.20);
      expect(distribution.lunch).toBe(0.30);
      expect(distribution.snack).toBe(0.25); // Represents 2 snacks
      expect(distribution.dinner).toBe(0.25);
      
      const sum = distribution.breakfast + distribution.lunch + distribution.snack + distribution.dinner;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should handle missing mealsPerDay by defaulting to 3', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: undefined as any,
        goal: 'maintenance'
      });

      const distribution = getMealDistribution(user);
      
      // Should default to 3 meals maintenance distribution
      expect(distribution.breakfast).toBe(0.30);
      expect(distribution.lunch).toBe(0.40);
      expect(distribution.dinner).toBe(0.30);
    });
  });

  describe('getMealGoals', () => {
    it('should calculate breakfast goals with custom distribution', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 25,
          lunch: 35,
          snack: 15,
          dinner: 25
        },
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67
        }
      });

      const goals = getMealGoals(user, 'breakfast');
      
      expect(goals.calories).toBe(500); // 2000 * 0.25
      expect(goals.protein).toBe(38); // 150 * 0.25 rounded
      expect(goals.carbs).toBe(50); // 200 * 0.25
      expect(goals.fat).toBe(17); // 67 * 0.25 rounded
    });

    it('should calculate lunch goals with custom distribution', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 25,
          lunch: 35,
          snack: 15,
          dinner: 25
        },
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67
        }
      });

      const goals = getMealGoals(user, 'lunch');
      
      expect(goals.calories).toBe(700); // 2000 * 0.35
      expect(goals.protein).toBe(53); // 150 * 0.35 rounded
      expect(goals.carbs).toBe(70); // 200 * 0.35
      expect(goals.fat).toBe(23); // 67 * 0.35 rounded
    });

    it('should return zero goals for inactive meal types', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 2, // Only lunch and dinner
        goal: 'maintenance',
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67
        }
      });

      const breakfastGoals = getMealGoals(user, 'breakfast');
      const snackGoals = getMealGoals(user, 'snack');
      
      expect(breakfastGoals.calories).toBe(0);
      expect(breakfastGoals.protein).toBe(0);
      expect(breakfastGoals.carbs).toBe(0);
      expect(breakfastGoals.fat).toBe(0);
      
      expect(snackGoals.calories).toBe(0);
      expect(snackGoals.protein).toBe(0);
      expect(snackGoals.carbs).toBe(0);
      expect(snackGoals.fat).toBe(0);
    });

    it('should calculate goals for 3 meals with cutting', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 3,
        goal: 'moderate_loss',
        goals: {
          calories: 1800,
          protein: 135,
          carbs: 180,
          fat: 60
        }
      });

      const breakfastGoals = getMealGoals(user, 'breakfast');
      const lunchGoals = getMealGoals(user, 'lunch');
      const dinnerGoals = getMealGoals(user, 'dinner');
      
      // Distribution: 30%, 45%, 25%
      expect(breakfastGoals.calories).toBe(540); // 1800 * 0.30
      expect(lunchGoals.calories).toBe(810); // 1800 * 0.45
      expect(dinnerGoals.calories).toBe(450); // 1800 * 0.25
      
      // Verify protein distribution
      expect(breakfastGoals.protein).toBe(41); // 135 * 0.30 rounded
      expect(lunchGoals.protein).toBe(61); // 135 * 0.45 rounded
      expect(dinnerGoals.protein).toBe(34); // 135 * 0.25 rounded
    });

    it('should calculate goals for 4 meals with maintenance', () => {
      const user = createMockUser({
        mealDistribution: undefined,
        mealsPerDay: 4,
        goal: 'maintenance',
        goals: {
          calories: 2400,
          protein: 180,
          carbs: 240,
          fat: 80
        }
      });

      const breakfastGoals = getMealGoals(user, 'breakfast');
      const lunchGoals = getMealGoals(user, 'lunch');
      const snackGoals = getMealGoals(user, 'snack');
      const dinnerGoals = getMealGoals(user, 'dinner');
      
      // Distribution: 25%, 35%, 15%, 25%
      expect(breakfastGoals.calories).toBe(600); // 2400 * 0.25
      expect(lunchGoals.calories).toBe(840); // 2400 * 0.35
      expect(snackGoals.calories).toBe(360); // 2400 * 0.15
      expect(dinnerGoals.calories).toBe(600); // 2400 * 0.25
    });

    it('should round macro values correctly', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 33,
          lunch: 33,
          snack: 17,
          dinner: 17
        },
        goals: {
          calories: 1999, // Odd number to test rounding
          protein: 149,
          carbs: 199,
          fat: 66
        }
      });

      const breakfastGoals = getMealGoals(user, 'breakfast');
      
      // Should round to nearest integer
      expect(Number.isInteger(breakfastGoals.calories)).toBe(true);
      expect(Number.isInteger(breakfastGoals.protein)).toBe(true);
      expect(Number.isInteger(breakfastGoals.carbs)).toBe(true);
      expect(Number.isInteger(breakfastGoals.fat)).toBe(true);
    });

    it('should handle zero calorie goals', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 25,
          lunch: 35,
          snack: 15,
          dinner: 25
        },
        goals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      });

      const goals = getMealGoals(user, 'breakfast');
      
      expect(goals.calories).toBe(0);
      expect(goals.protein).toBe(0);
      expect(goals.carbs).toBe(0);
      expect(goals.fat).toBe(0);
    });

    it('should distribute macros proportionally', () => {
      const user = createMockUser({
        mealDistribution: {
          breakfast: 20,
          lunch: 30,
          snack: 20,
          dinner: 30
        },
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 70
        }
      });

      const breakfastGoals = getMealGoals(user, 'breakfast');
      const lunchGoals = getMealGoals(user, 'lunch');
      
      // Breakfast should be 20% of all macros
      expect(breakfastGoals.calories).toBe(400); // 2000 * 0.20
      expect(breakfastGoals.protein).toBe(30); // 150 * 0.20
      expect(breakfastGoals.carbs).toBe(40); // 200 * 0.20
      expect(breakfastGoals.fat).toBe(14); // 70 * 0.20
      
      // Lunch should be 30% of all macros
      expect(lunchGoals.calories).toBe(600); // 2000 * 0.30
      expect(lunchGoals.protein).toBe(45); // 150 * 0.30
      expect(lunchGoals.carbs).toBe(60); // 200 * 0.30
      expect(lunchGoals.fat).toBe(21); // 70 * 0.30
    });
  });
});
