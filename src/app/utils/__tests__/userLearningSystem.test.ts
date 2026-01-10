/**
 * Tests para userLearningSystem.ts
 * 
 * Prueba el sistema de aprendizaje y personalización de preferencias del usuario
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeUserPatterns,
  applyUserPreferences,
  generatePersonalizedInsights,
  getUserStats
} from '../userLearningSystem';
import { createMockUser } from '@/tests/mocks/mockData';
import { MealAdaptationRecord, MealType } from '@/app/types';

// Helper to create mock adaptation record
const createMockAdaptation = (overrides?: Partial<MealAdaptationRecord>): MealAdaptationRecord => ({
  mealId: 'meal-1',
  mealName: 'Test Meal',
  mealType: 'lunch',
  date: '2024-01-01',
  portionMultiplier: 1.0,
  wasAccepted: true,
  userAdjustedPortion: undefined,
  ...overrides
});

describe('userLearningSystem', () => {
  describe('analyzeUserPatterns', () => {
    it('should return default values when no adaptation history', () => {
      const user = createMockUser({
        adaptationHistory: []
      });

      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.totalAdaptations).toBe(0);
      expect(patterns.confidenceLevel).toBe('low');
      expect(patterns.preferredPortionTrend).toBe('normal');
      expect(patterns.mostAcceptedMeals).toEqual([]);
      expect(patterns.leastAcceptedMeals).toEqual([]);
      expect(patterns.averagePortionByMealType.breakfast).toBe(1.0);
      expect(patterns.averagePortionByMealType.lunch).toBe(1.0);
      expect(patterns.averagePortionByMealType.snack).toBe(1.0);
      expect(patterns.averagePortionByMealType.dinner).toBe(1.0);
    });

    it('should detect tends_smaller trend', () => {
      const history: MealAdaptationRecord[] = Array.from({ length: 15 }, (_, i) => 
        createMockAdaptation({
          portionMultiplier: 0.7, // Small portions
          userAdjustedPortion: 0.7,
          wasAccepted: true
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.preferredPortionTrend).toBe('tends_smaller');
      expect(patterns.totalAdaptations).toBe(15);
      expect(patterns.confidenceLevel).toBe('medium'); // 10-30 = medium
    });

    it('should detect tends_larger trend', () => {
      const history: MealAdaptationRecord[] = Array.from({ length: 35 }, (_, i) => 
        createMockAdaptation({
          portionMultiplier: 1.3, // Large portions
          userAdjustedPortion: 1.3,
          wasAccepted: true
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.preferredPortionTrend).toBe('tends_larger');
      expect(patterns.totalAdaptations).toBe(35);
      expect(patterns.confidenceLevel).toBe('high'); // >= 30 = high
    });

    it('should calculate average portion by meal type', () => {
      const history: MealAdaptationRecord[] = [
        createMockAdaptation({ mealType: 'breakfast', portionMultiplier: 0.8 }),
        createMockAdaptation({ mealType: 'breakfast', portionMultiplier: 1.0 }),
        createMockAdaptation({ mealType: 'breakfast', portionMultiplier: 1.2 }),
        createMockAdaptation({ mealType: 'lunch', portionMultiplier: 1.5 }),
        createMockAdaptation({ mealType: 'lunch', portionMultiplier: 1.3 }),
        createMockAdaptation({ mealType: 'dinner', portionMultiplier: 0.9 })
      ];

      const user = createMockUser({ adaptationHistory: history });
      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.averagePortionByMealType.breakfast).toBe(1.0); // (0.8+1.0+1.2)/3
      expect(patterns.averagePortionByMealType.lunch).toBe(1.4); // (1.5+1.3)/2
      expect(patterns.averagePortionByMealType.dinner).toBe(0.9); // 0.9/1
      expect(patterns.averagePortionByMealType.snack).toBe(1.0); // Default when no data
    });

    it('should calculate acceptance rate by portion size', () => {
      const history: MealAdaptationRecord[] = [
        // Small portions (< 0.8): 2/3 accepted
        createMockAdaptation({ portionMultiplier: 0.6, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 0.7, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 0.75, wasAccepted: false }),
        // Normal portions (0.8-1.2): 3/4 accepted
        createMockAdaptation({ portionMultiplier: 0.9, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 1.0, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 1.1, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 1.15, wasAccepted: false }),
        // Large portions (> 1.2): 1/2 accepted
        createMockAdaptation({ portionMultiplier: 1.3, wasAccepted: true }),
        createMockAdaptation({ portionMultiplier: 1.5, wasAccepted: false })
      ];

      const user = createMockUser({ adaptationHistory: history });
      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.acceptanceRateByPortion.small).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
      expect(patterns.acceptanceRateByPortion.normal).toBe(75); // 3/4 = 75%
      expect(patterns.acceptanceRateByPortion.large).toBe(50); // 1/2 = 50%
    });

    it('should identify most and least accepted meals', () => {
      const history: MealAdaptationRecord[] = [
        // meal-1: 3/3 accepted (100%)
        createMockAdaptation({ mealId: 'meal-1', mealName: 'Favorite', wasAccepted: true }),
        createMockAdaptation({ mealId: 'meal-1', mealName: 'Favorite', wasAccepted: true }),
        createMockAdaptation({ mealId: 'meal-1', mealName: 'Favorite', wasAccepted: true }),
        // meal-2: 2/3 accepted (66%)
        createMockAdaptation({ mealId: 'meal-2', mealName: 'Ok meal', wasAccepted: true }),
        createMockAdaptation({ mealId: 'meal-2', mealName: 'Ok meal', wasAccepted: true }),
        createMockAdaptation({ mealId: 'meal-2', mealName: 'Ok meal', wasAccepted: false }),
        // meal-3: 0/2 accepted (0%)
        createMockAdaptation({ mealId: 'meal-3', mealName: 'Disliked', wasAccepted: false }),
        createMockAdaptation({ mealId: 'meal-3', mealName: 'Disliked', wasAccepted: false }),
        // meal-4: only 1 attempt - should be filtered out
        createMockAdaptation({ mealId: 'meal-4', mealName: 'Single', wasAccepted: true })
      ];

      const user = createMockUser({ adaptationHistory: history });
      const patterns = analyzeUserPatterns(user);
      
      expect(patterns.mostAcceptedMeals).toContain('meal-1');
      expect(patterns.mostAcceptedMeals).toContain('meal-2');
      expect(patterns.leastAcceptedMeals).toContain('meal-3');
      expect(patterns.mostAcceptedMeals).not.toContain('meal-4'); // Filtered (< 2 attempts)
    });

    it('should set confidence level based on data quantity', () => {
      const lowHistory = Array.from({ length: 5 }, () => createMockAdaptation());
      const mediumHistory = Array.from({ length: 20 }, () => createMockAdaptation());
      const highHistory = Array.from({ length: 50 }, () => createMockAdaptation());

      expect(analyzeUserPatterns(createMockUser({ adaptationHistory: lowHistory })).confidenceLevel).toBe('low');
      expect(analyzeUserPatterns(createMockUser({ adaptationHistory: mediumHistory })).confidenceLevel).toBe('medium');
      expect(analyzeUserPatterns(createMockUser({ adaptationHistory: highHistory })).confidenceLevel).toBe('high');
    });
  });

  describe('applyUserPreferences', () => {
    it('should apply small portion preference', () => {
      const user = createMockUser({
        preferences: {
          portionPreferences: {
            breakfast: 'small',
            lunch: 'normal',
            snack: 'normal',
            dinner: 'normal'
          }
        }
      });

      const adjusted = applyUserPreferences(1.0, user, 'breakfast');
      
      expect(adjusted).toBe(0.85); // 1.0 * 0.85
    });

    it('should apply large portion preference', () => {
      const user = createMockUser({
        preferences: {
          portionPreferences: {
            breakfast: 'normal',
            lunch: 'large',
            snack: 'normal',
            dinner: 'normal'
          }
        }
      });

      const adjusted = applyUserPreferences(1.0, user, 'lunch');
      
      expect(adjusted).toBe(1.15); // 1.0 * 1.15
    });

    it('should not modify when preference is normal', () => {
      const user = createMockUser({
        preferences: {
          portionPreferences: {
            breakfast: 'normal',
            lunch: 'normal',
            snack: 'normal',
            dinner: 'normal'
          }
        }
      });

      const adjusted = applyUserPreferences(1.0, user, 'lunch');
      
      expect(adjusted).toBe(1.0);
    });

    it('should apply historical learning when confidence is high', () => {
      const history = Array.from({ length: 35 }, () => 
        createMockAdaptation({
          mealType: 'breakfast',
          portionMultiplier: 1.5,
          userAdjustedPortion: 1.5
        })
      );

      const user = createMockUser({
        adaptationHistory: history,
        preferences: {}
      });

      const adjusted = applyUserPreferences(1.0, user, 'breakfast');
      
      // Should blend 70% base + 30% historical
      // 1.0 * 0.7 + 1.5 * 0.3 = 0.7 + 0.45 = 1.15
      expect(adjusted).toBeCloseTo(1.15, 2);
    });

    it('should not apply historical learning when confidence is low', () => {
      const history = Array.from({ length: 3 }, () => 
        createMockAdaptation({
          mealType: 'breakfast',
          portionMultiplier: 1.5
        })
      );

      const user = createMockUser({
        adaptationHistory: history,
        preferences: {}
      });

      const adjusted = applyUserPreferences(1.0, user, 'breakfast');
      
      // Low confidence, should not blend historical data
      expect(adjusted).toBe(1.0);
    });

    it('should increase portion for preferred heavy meal time', () => {
      const user = createMockUser({
        preferences: {
          timingPreferences: {
            heavyMealTime: 'morning'
          }
        }
      });

      const adjusted = applyUserPreferences(1.0, user, 'breakfast');
      
      expect(adjusted).toBe(1.1); // 1.0 * 1.1 (10% increase)
    });

    it('should combine multiple adjustments', () => {
      const history = Array.from({ length: 35 }, () => 
        createMockAdaptation({
          mealType: 'lunch',
          portionMultiplier: 1.2,
          userAdjustedPortion: 1.2
        })
      );

      const user = createMockUser({
        adaptationHistory: history,
        preferences: {
          portionPreferences: {
            breakfast: 'normal',
            lunch: 'small',
            snack: 'normal',
            dinner: 'normal'
          },
          timingPreferences: {
            heavyMealTime: 'midday'
          }
        }
      });

      const adjusted = applyUserPreferences(1.0, user, 'lunch');
      
      // 1. Small preference: 1.0 * 0.85 = 0.85
      // 2. Historical blend: 0.85 * 0.7 + 1.2 * 0.3 = 0.595 + 0.36 = 0.955
      // 3. Heavy meal time: 0.955 * 1.1 = 1.0505
      expect(adjusted).toBeCloseTo(1.0505, 2);
    });
  });

  describe('generatePersonalizedInsights', () => {
    it('should return empty array when no adaptation history', () => {
      const user = createMockUser({
        adaptationHistory: []
      });

      const insights = generatePersonalizedInsights(user);
      
      expect(insights).toHaveLength(1); // Only tip about low data
      expect(insights[0].type).toBe('tip');
      expect(insights[0].message).toContain('Registra más comidas');
    });

    it('should detect smaller portions pattern', () => {
      const history = Array.from({ length: 15 }, () => 
        createMockAdaptation({
          portionMultiplier: 0.7,
          userAdjustedPortion: 0.7
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const insights = generatePersonalizedInsights(user);
      
      const patternInsight = insights.find(i => i.title === 'Patrón detectado');
      expect(patternInsight).toBeDefined();
      expect(patternInsight?.message).toContain('porciones más pequeñas');
    });

    it('should detect larger portions pattern', () => {
      const history = Array.from({ length: 35 }, () => 
        createMockAdaptation({
          portionMultiplier: 1.3,
          userAdjustedPortion: 1.3
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const insights = generatePersonalizedInsights(user);
      
      const patternInsight = insights.find(i => i.title === 'Patrón detectado');
      expect(patternInsight).toBeDefined();
      expect(patternInsight?.message).toContain('porciones más grandes');
    });

    it('should show favorites identified with high confidence', () => {
      const history = Array.from({ length: 50 }, (_, i) => 
        createMockAdaptation({
          mealId: `meal-${i % 10}`,
          wasAccepted: true
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const insights = generatePersonalizedInsights(user);
      
      const favoritesInsight = insights.find(i => i.title === 'Favoritos identificados');
      expect(favoritesInsight).toBeDefined();
      expect(favoritesInsight?.type).toBe('achievement');
    });

    it('should show achievement for many adaptations', () => {
      const history = Array.from({ length: 60 }, () => 
        createMockAdaptation()
      );

      const user = createMockUser({ adaptationHistory: history });
      const insights = generatePersonalizedInsights(user);
      
      const progressInsight = insights.find(i => i.title === '¡Gran progreso!');
      expect(progressInsight).toBeDefined();
      expect(progressInsight?.message).toContain('60 comidas');
    });
  });

  describe('getUserStats', () => {
    it('should return zero stats when no history', () => {
      const user = createMockUser({
        adaptationHistory: []
      });

      const stats = getUserStats(user);
      
      expect(stats.totalMealsLogged).toBe(0);
      expect(stats.averageAcceptanceRate).toBe(0);
      expect(stats.favoriteTimeOfDay).toBeNull();
      expect(stats.learningProgress).toBe(0);
      expect(stats.topMeals).toEqual([]);
    });

    it('should calculate total meals logged', () => {
      const history = Array.from({ length: 25 }, () => 
        createMockAdaptation()
      );

      const user = createMockUser({ adaptationHistory: history });
      const stats = getUserStats(user);
      
      expect(stats.totalMealsLogged).toBe(25);
    });

    it('should calculate average acceptance rate', () => {
      const history = [
        ...Array.from({ length: 7 }, () => createMockAdaptation({ wasAccepted: true })),
        ...Array.from({ length: 3 }, () => createMockAdaptation({ wasAccepted: false }))
      ];

      const user = createMockUser({ adaptationHistory: history });
      const stats = getUserStats(user);
      
      expect(stats.averageAcceptanceRate).toBe(70); // 7/10 = 70%
    });

    it('should identify favorite time of day', () => {
      const history = [
        createMockAdaptation({ mealType: 'breakfast', wasAccepted: true }),
        createMockAdaptation({ mealType: 'breakfast', wasAccepted: true }),
        createMockAdaptation({ mealType: 'breakfast', wasAccepted: true }),
        createMockAdaptation({ mealType: 'lunch', wasAccepted: true }),
        createMockAdaptation({ mealType: 'lunch', wasAccepted: true }),
        createMockAdaptation({ mealType: 'dinner', wasAccepted: true }),
        createMockAdaptation({ mealType: 'snack', wasAccepted: false }) // Not accepted, shouldn't count
      ];

      const user = createMockUser({ adaptationHistory: history });
      const stats = getUserStats(user);
      
      expect(stats.favoriteTimeOfDay).toBe('breakfast'); // 3 accepted vs 2 for lunch
    });

    it('should calculate learning progress', () => {
      const history25 = Array.from({ length: 25 }, () => createMockAdaptation());
      const history50 = Array.from({ length: 50 }, () => createMockAdaptation());
      const history100 = Array.from({ length: 100 }, () => createMockAdaptation());

      expect(getUserStats(createMockUser({ adaptationHistory: history25 })).learningProgress).toBe(50); // 25/50 * 100
      expect(getUserStats(createMockUser({ adaptationHistory: history50 })).learningProgress).toBe(100); // Capped at 100
      expect(getUserStats(createMockUser({ adaptationHistory: history100 })).learningProgress).toBe(100); // Capped at 100
    });

    it('should identify top meals by acceptance rate', () => {
      const history = [
        // meal-1: 5/5 = 100%
        ...Array.from({ length: 5 }, () => createMockAdaptation({ 
          mealId: 'meal-1', 
          mealName: 'Best Meal', 
          wasAccepted: true 
        })),
        // meal-2: 3/4 = 75%
        ...Array.from({ length: 3 }, () => createMockAdaptation({ 
          mealId: 'meal-2', 
          mealName: 'Good Meal', 
          wasAccepted: true 
        })),
        createMockAdaptation({ mealId: 'meal-2', mealName: 'Good Meal', wasAccepted: false }),
        // meal-3: 1/2 = 50%
        createMockAdaptation({ mealId: 'meal-3', mealName: 'Ok Meal', wasAccepted: true }),
        createMockAdaptation({ mealId: 'meal-3', mealName: 'Ok Meal', wasAccepted: false }),
        // meal-4: only 1 attempt - should be filtered out
        createMockAdaptation({ mealId: 'meal-4', mealName: 'Single', wasAccepted: true })
      ];

      const user = createMockUser({ adaptationHistory: history });
      const stats = getUserStats(user);
      
      expect(stats.topMeals).toHaveLength(3); // Only meals with >= 2 attempts
      expect(stats.topMeals[0].id).toBe('meal-1');
      expect(stats.topMeals[0].acceptanceRate).toBe(100);
      expect(stats.topMeals[1].id).toBe('meal-2');
      expect(stats.topMeals[1].acceptanceRate).toBe(75);
      expect(stats.topMeals[2].id).toBe('meal-3');
      expect(stats.topMeals[2].acceptanceRate).toBe(50);
    });

    it('should limit top meals to 5', () => {
      const history = Array.from({ length: 60 }, (_, i) => 
        createMockAdaptation({
          mealId: `meal-${i % 10}`,
          mealName: `Meal ${i % 10}`,
          wasAccepted: i % 3 !== 0 // ~66% acceptance
        })
      );

      const user = createMockUser({ adaptationHistory: history });
      const stats = getUserStats(user);
      
      expect(stats.topMeals.length).toBeLessThanOrEqual(5);
    });
  });
});
