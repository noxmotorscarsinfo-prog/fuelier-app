import { describe, it, expect } from 'vitest';
import {
  analyzeProgress,
  applyAutomaticAdjustment,
  detectMetabolicAdaptation,
  generateWeeklyProgress,
} from '../adaptiveSystem';
import { User, WeeklyProgressRecord } from '../../types';
import { createMockUser } from '../../../tests/mocks/mockData';

describe('Adaptive System', () => {
  describe('analyzeProgress', () => {
    it('should require at least 2 weeks of data', () => {
      const user = createMockUser({
        weeklyProgress: [
          {
            weekNumber: 1,
            startWeight: 80,
            endWeight: 79.5,
            weightChange: -0.5,
            calorieAdherence: 95,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(false);
      expect(analysis.reason).toContain('al menos 2 semanas');
      expect(analysis.confidence).toBe('low');
    });

    it('should warn when adherence is below 70%', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: -0.3,
            calorieAdherence: 60,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: -0.2,
            calorieAdherence: 65,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(false);
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.warnings[0]).toContain('adherencia');
      expect(analysis.confidence).toBe('low');
    });

    it('should not adjust when progress is on track (within 15% deviation)', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: -0.6,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: -0.65,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: -0.7,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(false);
      expect(analysis.adjustmentType).toBe('none');
      expect(analysis.reason).toContain('perfectamente');
      expect(analysis.confidence).toBe('high');
    });

    it('should decrease calories when not losing weight on a loss goal', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.0,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.1,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.05,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(true);
      expect(analysis.adjustmentType).toBe('decrease');
      expect(analysis.adjustmentAmount).toBeGreaterThan(0);
      expect(analysis.confidence).toBe('high');
    });

    it('should increase calories when losing weight too fast', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: -1.2,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: -1.3,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: -1.1,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(true);
      expect(analysis.adjustmentType).toBe('increase');
      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.confidence).toBe('medium');
    });

    it('should increase calories when not gaining weight on a gain goal', () => {
      const user = createMockUser({
        goal: 'moderate_gain',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.0,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.05,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.0,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(true);
      expect(analysis.adjustmentType).toBe('increase');
      expect(analysis.adjustmentAmount).toBeGreaterThan(0);
      expect(analysis.confidence).toBe('high');
    });

    it('should decrease calories when gaining weight too fast', () => {
      const user = createMockUser({
        goal: 'moderate_gain',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.8,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.9,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.85,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(true);
      expect(analysis.adjustmentType).toBe('decrease');
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it('should adjust maintenance goal when weight is changing significantly', () => {
      const user = createMockUser({
        goal: 'maintenance',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.3,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.35,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.4,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.needsAdjustment).toBe(true);
      expect(analysis.adjustmentType).toBe('decrease');
    });

    it('should detect stagnant weight and warn', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.05,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.0,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: -0.05,
            calorieAdherence: 88,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it('should limit adjustment amounts between 50 and 300 kcal', () => {
      const user = createMockUser({
        goal: 'rapid_loss',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 2.0,
            calorieAdherence: 90,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 2.5,
            calorieAdherence: 92,
          } as WeeklyProgressRecord,
        ],
      });

      const analysis = analyzeProgress(user);

      expect(Math.abs(analysis.adjustmentAmount)).toBeLessThanOrEqual(300);
      expect(Math.abs(analysis.adjustmentAmount)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyAutomaticAdjustment', () => {
    it('should not modify macros when no adjustment is needed', () => {
      const user = createMockUser({
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67,
        },
      });

      const analysis = {
        needsAdjustment: false,
        adjustmentType: 'none' as const,
        adjustmentAmount: 0,
        reason: 'On track',
        confidence: 'high' as const,
        warnings: [],
      };

      const newGoals = applyAutomaticAdjustment(user, analysis);

      expect(newGoals).toEqual(user.goals);
    });

    it('should increase calories and proportionally adjust macros', () => {
      const user = createMockUser({
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67,
        },
      });

      const analysis = {
        needsAdjustment: true,
        adjustmentType: 'increase' as const,
        adjustmentAmount: 200,
        reason: 'Not gaining',
        confidence: 'high' as const,
        warnings: [],
      };

      const newGoals = applyAutomaticAdjustment(user, analysis);

      expect(newGoals.calories).toBe(2200);
      expect(newGoals.protein).toBeGreaterThan(user.goals.protein);
      expect(newGoals.carbs).toBeGreaterThan(user.goals.carbs);
      expect(newGoals.fat).toBeGreaterThan(user.goals.fat);
    });

    it('should decrease calories and proportionally adjust macros', () => {
      const user = createMockUser({
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67,
        },
      });

      const analysis = {
        needsAdjustment: true,
        adjustmentType: 'decrease' as const,
        adjustmentAmount: 200,
        reason: 'Not losing',
        confidence: 'high' as const,
        warnings: [],
      };

      const newGoals = applyAutomaticAdjustment(user, analysis);

      expect(newGoals.calories).toBe(1800);
      expect(newGoals.protein).toBeLessThan(user.goals.protein);
      expect(newGoals.carbs).toBeLessThan(user.goals.carbs);
      expect(newGoals.fat).toBeLessThan(user.goals.fat);
    });

    it('should never set calories below 1200', () => {
      const user = createMockUser({
        goals: {
          calories: 1300,
          protein: 100,
          carbs: 130,
          fat: 40,
        },
      });

      const analysis = {
        needsAdjustment: true,
        adjustmentType: 'decrease' as const,
        adjustmentAmount: 300,
        reason: 'Not losing',
        confidence: 'high' as const,
        warnings: [],
      };

      const newGoals = applyAutomaticAdjustment(user, analysis);

      expect(newGoals.calories).toBeGreaterThanOrEqual(1200);
    });

    it('should maintain macro ratios after adjustment', () => {
      const user = createMockUser({
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 67,
        },
      });

      const originalProteinRatio = (150 * 4) / 2000;
      const originalCarbsRatio = (200 * 4) / 2000;
      const originalFatRatio = (67 * 9) / 2000;

      const analysis = {
        needsAdjustment: true,
        adjustmentType: 'increase' as const,
        adjustmentAmount: 200,
        reason: 'Not gaining',
        confidence: 'high' as const,
        warnings: [],
      };

      const newGoals = applyAutomaticAdjustment(user, analysis);

      const newProteinRatio = (newGoals.protein * 4) / newGoals.calories;
      const newCarbsRatio = (newGoals.carbs * 4) / newGoals.calories;
      const newFatRatio = (newGoals.fat * 9) / newGoals.calories;

      expect(newProteinRatio).toBeCloseTo(originalProteinRatio, 2);
      expect(newCarbsRatio).toBeCloseTo(originalCarbsRatio, 2);
      expect(newFatRatio).toBeCloseTo(originalFatRatio, 2);
    });
  });

  describe('detectMetabolicAdaptation', () => {
    it('should require at least 4 weeks of data', () => {
      const user = createMockUser({
        weeklyProgress: [
          { weekNumber: 1, weightChange: -0.5, calorieAdherence: 90 } as WeeklyProgressRecord,
          { weekNumber: 2, weightChange: -0.4, calorieAdherence: 92 } as WeeklyProgressRecord,
          { weekNumber: 3, weightChange: -0.3, calorieAdherence: 88 } as WeeklyProgressRecord,
        ],
      });

      const result = detectMetabolicAdaptation(user);

      expect(result.isAdapted).toBe(false);
      expect(result.level).toBe('none');
      expect(result.recommendedAction).toContain('Continúa tracking');
    });

    it('should detect mild adaptation with 2 flags', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        sex: 'female',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: -0.05,
            calorieAdherence: 90,
            averageCalories: 1350,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.0,
            calorieAdherence: 92,
            averageCalories: 1350,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.05,
            calorieAdherence: 88,
            averageCalories: 1350,
          } as WeeklyProgressRecord,
          {
            weekNumber: 4,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1350,
          } as WeeklyProgressRecord,
        ],
      });

      const result = detectMetabolicAdaptation(user);

      expect(result.isAdapted).toBe(true);
      expect(result.level).toBe('mild');
      expect(result.recommendedAction).toContain('Refeed');
    });

    it('should detect moderate adaptation with 3 flags', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        sex: 'female',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1300,
            energyLevels: ['low', 'low', 'low', 'medium', 'low', 'low', 'low'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.0,
            calorieAdherence: 92,
            averageCalories: 1300,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'medium', 'low'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.05,
            calorieAdherence: 88,
            averageCalories: 1300,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'low', 'medium'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 4,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1300,
            energyLevels: ['low', 'low', 'low', 'medium', 'low', 'low', 'low'],
          } as WeeklyProgressRecord,
        ],
      });

      const result = detectMetabolicAdaptation(user);

      expect(result.isAdapted).toBe(true);
      expect(result.level).toBe('moderate');
      expect(result.recommendedAction).toContain('Diet Break');
    });

    it('should detect severe adaptation with 4+ flags', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        sex: 'female',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1200,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'low', 'low'],
            hungerLevels: ['very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry'],
            workoutQuality: ['poor', 'ok', 'poor', 'ok', 'poor', 'ok', 'poor'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.0,
            calorieAdherence: 92,
            averageCalories: 1200,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'low', 'low'],
            hungerLevels: ['very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry'],
            workoutQuality: ['poor', 'ok', 'poor', 'ok', 'poor', 'ok', 'poor'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.0,
            calorieAdherence: 88,
            averageCalories: 1200,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'low', 'low'],
            hungerLevels: ['very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry'],
            workoutQuality: ['poor', 'ok', 'poor', 'ok', 'poor', 'ok', 'poor'],
          } as WeeklyProgressRecord,
          {
            weekNumber: 4,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1200,
            energyLevels: ['low', 'low', 'low', 'low', 'low', 'low', 'low'],
            hungerLevels: ['very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry', 'hungry', 'very_hungry'],
            workoutQuality: ['poor', 'ok', 'poor', 'ok', 'poor', 'ok', 'poor'],
          } as WeeklyProgressRecord,
        ],
      });

      const result = detectMetabolicAdaptation(user);

      expect(result.isAdapted).toBe(true);
      expect(result.level).toBe('severe');
      expect(result.recommendedAction).toContain('REVERSE DIET');
    });

    it('should detect low calories for male threshold', () => {
      const user = createMockUser({
        goal: 'moderate_loss',
        sex: 'male',
        weeklyProgress: [
          {
            weekNumber: 1,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1750,
          } as WeeklyProgressRecord,
          {
            weekNumber: 2,
            weightChange: 0.0,
            calorieAdherence: 92,
            averageCalories: 1750,
          } as WeeklyProgressRecord,
          {
            weekNumber: 3,
            weightChange: 0.0,
            calorieAdherence: 88,
            averageCalories: 1750,
          } as WeeklyProgressRecord,
          {
            weekNumber: 4,
            weightChange: 0.0,
            calorieAdherence: 90,
            averageCalories: 1750,
          } as WeeklyProgressRecord,
        ],
      });

      const result = detectMetabolicAdaptation(user);

      expect(result.isAdapted).toBe(true);
      expect(result.level).toBe('mild');
    });
  });

  describe('generateWeeklyProgress', () => {
    it('should return null when insufficient daily logs', () => {
      const user = createMockUser();
      const dailyLogs = [
        { date: '2026-01-01', breakfast: { calories: 500 } },
        { date: '2026-01-02', breakfast: { calories: 500 } },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).toBeNull();
    });

    it('should calculate average calories correctly', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      });

      const dailyLogs = [
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 450 }, lunch: { calories: 550 }, snack: { calories: 250 }, dinner: { calories: 750 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 450 }, lunch: { calories: 550 }, snack: { calories: 250 }, dinner: { calories: 750 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).not.toBeNull();
      expect(result!.averageCalories).toBe(2000);
      expect(result!.daysLogged).toBe(5);
    });

    it('should calculate adherence percentage', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      });

      const dailyLogs = [
        { breakfast: { calories: 400 }, lunch: { calories: 400 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 400 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 400 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 400 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 400 }, snack: { calories: 200 }, dinner: { calories: 800 } },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).not.toBeNull();
      expect(result!.averageCalories).toBe(1800);
      expect(result!.calorieAdherence).toBe(90);
    });

    it('should detect losing_fast trend', () => {
      const user = createMockUser({
        weight: 79,
        weeklyProgress: [
          { weekNumber: 1, endWeight: 80 } as WeeklyProgressRecord,
        ],
      });

      const dailyLogs = [
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).not.toBeNull();
      expect(result!.weightChange).toBe(-1);
      expect(result!.weeklyAnalysis.trend).toBe('losing_fast');
    });

    it('should detect maintaining trend', () => {
      const user = createMockUser({
        weight: 80,
        weeklyProgress: [
          { weekNumber: 1, endWeight: 80 } as WeeklyProgressRecord,
        ],
      });

      const dailyLogs = [
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
        { breakfast: { calories: 400 }, lunch: { calories: 600 }, snack: { calories: 200 }, dinner: { calories: 800 } },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).not.toBeNull();
      expect(result!.weightChange).toBe(0);
      expect(result!.weeklyAnalysis.trend).toBe('maintaining');
    });

    it('should include extra foods in calorie calculation', () => {
      const user = createMockUser({
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      });

      const dailyLogs = [
        {
          breakfast: { calories: 400 },
          lunch: { calories: 600 },
          snack: { calories: 200 },
          dinner: { calories: 600 },
          extraFoods: [{ name: 'Snack', calories: 200 }],
        },
        {
          breakfast: { calories: 400 },
          lunch: { calories: 600 },
          snack: { calories: 200 },
          dinner: { calories: 600 },
          extraFoods: [{ name: 'Snack', calories: 200 }],
        },
        {
          breakfast: { calories: 400 },
          lunch: { calories: 600 },
          snack: { calories: 200 },
          dinner: { calories: 600 },
          extraFoods: [{ name: 'Snack', calories: 200 }],
        },
        {
          breakfast: { calories: 400 },
          lunch: { calories: 600 },
          snack: { calories: 200 },
          dinner: { calories: 600 },
          extraFoods: [{ name: 'Snack', calories: 200 }],
        },
        {
          breakfast: { calories: 400 },
          lunch: { calories: 600 },
          snack: { calories: 200 },
          dinner: { calories: 600 },
          extraFoods: [{ name: 'Snack', calories: 200 }],
        },
      ];

      const result = generateWeeklyProgress(user, dailyLogs);

      expect(result).not.toBeNull();
      expect(result!.averageCalories).toBe(2000);
    });
  });
});
