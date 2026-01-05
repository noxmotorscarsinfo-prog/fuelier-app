import { Meal } from '../types';

// Función para obtener todos los platos personalizados
export const getCustomMeals = (): Meal[] => {
  try {
    const customMeals = localStorage.getItem('customMeals');
    return customMeals ? JSON.parse(customMeals) : [];
  } catch (error) {
    console.error('Error parsing custom meals from localStorage:', error);
    return [];
  }
};

// Función para guardar un plato personalizado
export const saveCustomMeal = (meal: Meal): void => {
  try {
    const customMeals = getCustomMeals();
    customMeals.push({ ...meal, isCustom: true });
    localStorage.setItem('customMeals', JSON.stringify(customMeals));
  } catch (error) {
    console.error('Error saving custom meal to localStorage:', error);
  }
};

// Función para actualizar un plato personalizado
export const updateCustomMeal = (mealId: string, updatedMeal: Meal): void => {
  try {
    const customMeals = getCustomMeals();
    const index = customMeals.findIndex(m => m.id === mealId);
    if (index !== -1) {
      customMeals[index] = { ...updatedMeal, isCustom: true };
      localStorage.setItem('customMeals', JSON.stringify(customMeals));
    }
  } catch (error) {
    console.error('Error updating custom meal in localStorage:', error);
  }
};

// Función para eliminar un plato personalizado
export const deleteCustomMeal = (mealId: string): void => {
  try {
    const customMeals = getCustomMeals();
    const filtered = customMeals.filter(m => m.id !== mealId);
    localStorage.setItem('customMeals', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom meal from localStorage:', error);
  }
};

// Función para obtener un plato personalizado por ID
export const getCustomMealById = (mealId: string): Meal | undefined => {
  try {
    const customMeals = getCustomMeals();
    return customMeals.find(m => m.id === mealId);
  } catch (error) {
    console.error('Error getting custom meal by ID from localStorage:', error);
    return undefined;
  }
};