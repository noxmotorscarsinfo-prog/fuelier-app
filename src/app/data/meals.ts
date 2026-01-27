import { Meal } from '../types';
import { getMealsData as getGeneratedMeals } from './mealsGenerator';

// Exportar las 200 comidas (50 por tipo)
export const getMealsData = (): Meal[] => {
  return getGeneratedMeals();
};