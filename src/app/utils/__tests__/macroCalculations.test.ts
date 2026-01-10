import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateMacrosFromUser,
} from '../macroCalculations';

describe('Macro Calculations', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male correctly using Mifflin-St Jeor formula', () => {
      const bmr = calculateBMR('male', 80, 180, 30);
      // Formula: (10 * weight) + (6.25 * height) - (5 * age) + 5
      // (10 * 80) + (6.25 * 180) - (5 * 30) + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(bmr).toBeCloseTo(1780, 0);
    });

    it('should calculate BMR for female correctly using Mifflin-St Jeor formula', () => {
      const bmr = calculateBMR('female', 60, 165, 25);
      // Formula: (10 * weight) + (6.25 * height) - (5 * age) - 161
      // (10 * 60) + (6.25 * 165) - (5 * 25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(bmr).toBeCloseTo(1345, 0);
    });

    it('should handle minimum weight edge case', () => {
      const bmr = calculateBMR('female', 20, 150, 18);
      expect(bmr).toBeGreaterThan(0);
      expect(bmr).toBeLessThan(2000);
    });

    it('should handle maximum weight edge case', () => {
      const bmr = calculateBMR('male', 300, 200, 40);
      expect(bmr).toBeGreaterThan(0);
      expect(bmr).toBeGreaterThan(3000);
    });

    it('should produce different results for male vs female with same stats', () => {
      const maleBMR = calculateBMR('male', 70, 170, 28);
      const femaleBMR = calculateBMR('female', 70, 170, 28);
      
      expect(maleBMR).toBeGreaterThan(femaleBMR);
      expect(maleBMR - femaleBMR).toBeCloseTo(166, 0); // Difference should be ~166
    });
  });

  describe('calculateTDEE', () => {
    it('should apply correct multiplier for sedentary lifestyle', () => {
      const bmr = 1800;
      const tdee = calculateTDEE(bmr, 0);
      
      // Sedentary multiplier should be 1.2
      expect(tdee).toBeCloseTo(bmr * 1.2, 50);
    });

    it('should apply correct multiplier for moderate activity', () => {
      const bmr = 1800;
      const tdee = calculateTDEE(bmr, 3);
      
      // Moderate activity (3x/week) multiplier is 1.55
      expect(tdee).toBeCloseTo(bmr * 1.55, 50);
    });

    it('should apply correct multiplier for intense training', () => {
      const bmr = 1800;
      const tdee = calculateTDEE(bmr, 6);
      
      // Intense training 6x/week multiplier is 1.725
      expect(tdee).toBeCloseTo(bmr * 1.725, 50);
    });

    it('should increase TDEE with higher training frequency', () => {
      const bmr = 1800;
      const tdee1 = calculateTDEE(bmr, 1);
      const tdee3 = calculateTDEE(bmr, 3);
      const tdee6 = calculateTDEE(bmr, 6);
      
      expect(tdee3).toBeGreaterThan(tdee1);
      expect(tdee6).toBeGreaterThan(tdee3);
    });

    it('should never return less than BMR', () => {
      const bmr = 1800;
      const tdee = calculateTDEE(bmr, 0);
      
      expect(tdee).toBeGreaterThanOrEqual(bmr);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute macros correctly for maintenance', () => {
      const macros = calculateMacros(2000, 80, 'male', 'maintenance');
      
      expect(macros.calories).toBe(2000);
      expect(macros.protein).toBeGreaterThan(0);
      expect(macros.carbs).toBeGreaterThan(0);
      expect(macros.fat).toBeGreaterThan(0);
      
      // Total calories from macros should approximately equal target
      const totalCals = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
      expect(totalCals).toBeGreaterThan(1800);
      expect(totalCals).toBeLessThan(2200);
    });

    it('should prioritize protein for moderate_bulk goal', () => {
      const macros = calculateMacros(2500, 80, 'male', 'moderate-bulk');
      
      // For muscle gain, protein should be at least 1.6g per kg
      expect(macros.protein).toBeGreaterThanOrEqual(80 * 1.6);
    });

    it('should adjust macros for moderate_cut goal', () => {
      const macros = calculateMacros(1800, 80, 'male', 'moderate-cut');
      
      expect(macros.calories).toBe(1800);
      // Protein should be high to preserve muscle (2.2g/kg for male in cut)
      expect(macros.protein).toBeGreaterThan(80 * 2.0);
    });

    it('should adjust macros for aggressive_cut goal', () => {
      const macros = calculateMacros(1500, 80, 'male', 'aggressive-cut');
      
      expect(macros.calories).toBe(1500);
      // Protein should be very high to prevent muscle loss
      expect(macros.protein).toBeGreaterThan(80 * 2.0);
    });

    it('should increase calories for moderate_bulk goal', () => {
      const maintMacros = calculateMacros(2000, 80, 'male', 'maintenance');
      const bulkMacros = calculateMacros(2300, 80, 'male', 'moderate-bulk');
      
      expect(bulkMacros.calories).toBeGreaterThan(maintMacros.calories);
      expect(bulkMacros.protein).toBeGreaterThanOrEqual(maintMacros.protein);
    });

    it('should never return negative macro values', () => {
      const macros = calculateMacros(1200, 50, 'female', 'aggressive-cut');
      
      expect(macros.protein).toBeGreaterThan(0);
      expect(macros.carbs).toBeGreaterThan(0);
      expect(macros.fat).toBeGreaterThan(0);
    });

    it('should maintain minimum fat for hormone health', () => {
      const macros = calculateMacros(1500, 70, 'female', 'aggressive-cut');
      
      // Fat should never be too low (minimum 40g for health)
      expect(macros.fat).toBeGreaterThanOrEqual(40);
    });
  });

  describe('calculateMacrosFromUser', () => {
    const mockUser = {
      sex: 'male' as const,
      age: 30,
      weight: 80,
      height: 180,
      trainingFrequency: 4,
      goal: 'moderate_loss' as const,
    };

    it('should calculate complete macros from user data', () => {
      const macros = calculateMacrosFromUser(mockUser);
      
      expect(macros.calories).toBeGreaterThan(0);
      expect(macros.protein).toBeGreaterThan(0);
      expect(macros.carbs).toBeGreaterThan(0);
      expect(macros.fat).toBeGreaterThan(0);
    });

    it('should provide higher calories for taller/heavier individuals', () => {
      const smallUser = calculateMacrosFromUser({
        sex: 'female', age: 25, weight: 55, height: 160, trainingFrequency: 3, goal: 'maintenance'
      });
      const largeUser = calculateMacrosFromUser({
        sex: 'male', age: 25, weight: 95, height: 190, trainingFrequency: 3, goal: 'maintenance'
      });
      
      expect(largeUser.calories).toBeGreaterThan(smallUser.calories);
    });

    it('should provide lower calories for older individuals with same stats', () => {
      const youngUser = calculateMacrosFromUser({
        sex: 'male', age: 25, weight: 80, height: 180, trainingFrequency: 3, goal: 'maintenance'
      });
      const olderUser = calculateMacrosFromUser({
        sex: 'male', age: 55, weight: 80, height: 180, trainingFrequency: 3, goal: 'maintenance'
      });
      
      // Older individuals have lower BMR
      expect(olderUser.calories).toBeLessThan(youngUser.calories);
    });

    it('should integrate all calculations correctly', () => {
      const macros = calculateMacrosFromUser({
        sex: 'male', age: 30, weight: 80, height: 180, trainingFrequency: 4, goal: 'moderate_loss'
      });
      
      // Verify the pipeline: BMR -> TDEE -> Macros
      const bmr = calculateBMR('male', 80, 180, 30);
      const tdee = calculateTDEE(bmr, 4);
      
      // For moderate loss (15% deficit), calories should be less than TDEE
      expect(macros.calories).toBeLessThan(tdee);
      expect(macros.calories).toBeGreaterThan(bmr);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle zero training frequency', () => {
      const macros = calculateMacrosFromUser({
        sex: 'female', age: 25, weight: 60, height: 165, trainingFrequency: 0, goal: 'maintenance'
      });
      
      expect(macros.calories).toBeGreaterThan(0);
      expect(macros.calories).toBeLessThan(2500); // Sedentary should have moderate calories
    });

    it('should handle maximum training frequency', () => {
      const macros = calculateMacrosFromUser({
        sex: 'male', age: 25, weight: 85, height: 185, trainingFrequency: 7, goal: 'rapid_gain'
      });
      
      expect(macros.calories).toBeGreaterThan(2500); // High activity needs high calories
    });

    it('should produce consistent results for same inputs', () => {
      const macros1 = calculateMacrosFromUser({
        sex: 'male', age: 30, weight: 80, height: 180, trainingFrequency: 4, goal: 'maintenance'
      });
      const macros2 = calculateMacrosFromUser({
        sex: 'male', age: 30, weight: 80, height: 180, trainingFrequency: 4, goal: 'maintenance'
      });
      
      expect(macros1.calories).toBe(macros2.calories);
      expect(macros1.protein).toBe(macros2.protein);
      expect(macros1.carbs).toBe(macros2.carbs);
      expect(macros1.fat).toBe(macros2.fat);
    });
  });
});
