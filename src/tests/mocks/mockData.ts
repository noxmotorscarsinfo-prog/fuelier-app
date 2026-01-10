import { User, DailyLog, Meal, SavedDiet } from '../app/types';
import { faker } from '@faker-js/faker';

/**
 * Generate mock user data for testing
 */
export const createMockUser = (overrides?: Partial<User>): User => {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    sex: faker.helpers.arrayElement(['male', 'female'] as const),
    age: faker.number.int({ min: 18, max: 65 }),
    birthdate: faker.date.past({ years: 30 }).toISOString().split('T')[0],
    weight: faker.number.int({ min: 50, max: 120 }),
    height: faker.number.int({ min: 150, max: 200 }),
    bodyFatPercentage: faker.number.int({ min: 10, max: 35 }),
    leanBodyMass: faker.number.int({ min: 40, max: 80 }),
    trainingFrequency: faker.number.int({ min: 0, max: 7 }),
    trainingIntensity: faker.helpers.arrayElement(['light', 'moderate', 'intense'] as const),
    trainingType: faker.helpers.arrayElement(['strength', 'cardio', 'mixed'] as const),
    trainingTimePreference: faker.helpers.arrayElement(['morning', 'afternoon', 'evening'] as const),
    lifestyleActivity: faker.helpers.arrayElement(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const),
    occupation: faker.person.jobTitle(),
    dailySteps: faker.number.int({ min: 2000, max: 15000 }),
    goal: faker.helpers.arrayElement(['rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain'] as const),
    mealsPerDay: faker.helpers.arrayElement([3, 4, 5, 6]),
    goals: {
      calories: faker.number.int({ min: 1500, max: 3500 }),
      protein: faker.number.int({ min: 100, max: 250 }),
      carbs: faker.number.int({ min: 150, max: 400 }),
      fat: faker.number.int({ min: 40, max: 120 }),
    },
    selectedMacroOption: 'balanced',
    mealDistribution: {
      breakfast: 25,
      lunch: 35,
      snack: 15,
      dinner: 25,
    },
    previousDietHistory: faker.lorem.sentence(),
    metabolicAdaptation: faker.number.float({ min: 0.9, max: 1.1 }),
    preferences: {
      dietType: 'standard',
      allergies: [],
      dislikes: [],
    },
    acceptedMealIds: [],
    rejectedMealIds: [],
    favoriteMealIds: [],
    favoriteIngredientIds: [],
    isAdmin: false,
    settings: {
      autoSaveDays: false,
      timezone: 'America/New_York',
    },
    ...overrides,
  };
};

/**
 * Generate mock meal data
 */
export const createMockMeal = (overrides?: Partial<Meal>): Meal => {
  return {
    id: faker.string.uuid(),
    name: faker.food.dish(),
    type: faker.helpers.arrayElement(['breakfast', 'lunch', 'snack', 'dinner'] as const),
    ingredients: [
      {
        id: faker.string.uuid(),
        name: faker.food.ingredient(),
        amount: faker.number.int({ min: 50, max: 300 }),
        unit: 'g',
        calories: faker.number.int({ min: 50, max: 300 }),
        protein: faker.number.int({ min: 5, max: 30 }),
        carbs: faker.number.int({ min: 10, max: 50 }),
        fat: faker.number.int({ min: 2, max: 20 }),
      },
    ],
    calories: faker.number.int({ min: 200, max: 800 }),
    protein: faker.number.int({ min: 15, max: 60 }),
    carbs: faker.number.int({ min: 20, max: 100 }),
    fat: faker.number.int({ min: 5, max: 40 }),
    image: faker.image.url(),
    isCustom: false,
    ...overrides,
  };
};

/**
 * Generate mock daily log
 */
export const createMockDailyLog = (overrides?: Partial<DailyLog>): DailyLog => {
  return {
    date: faker.date.recent().toISOString().split('T')[0],
    breakfast: Math.random() > 0.5 ? createMockMeal({ type: 'breakfast' }) : null,
    lunch: Math.random() > 0.5 ? createMockMeal({ type: 'lunch' }) : null,
    snack: Math.random() > 0.5 ? createMockMeal({ type: 'snack' }) : null,
    dinner: Math.random() > 0.5 ? createMockMeal({ type: 'dinner' }) : null,
    extraFoods: [],
    complementaryMeals: [],
    isSaved: faker.datatype.boolean(),
    weight: faker.number.int({ min: 50, max: 120 }),
    ...overrides,
  };
};

/**
 * Generate mock saved diet
 */
export const createMockSavedDiet = (overrides?: Partial<SavedDiet>): SavedDiet => {
  return {
    id: faker.string.uuid(),
    name: faker.lorem.words(3),
    meals: {
      breakfast: createMockMeal({ type: 'breakfast' }),
      lunch: createMockMeal({ type: 'lunch' }),
      snack: createMockMeal({ type: 'snack' }),
      dinner: createMockMeal({ type: 'dinner' }),
    },
    macros: {
      calories: faker.number.int({ min: 1500, max: 3000 }),
      protein: faker.number.int({ min: 100, max: 250 }),
      carbs: faker.number.int({ min: 150, max: 400 }),
      fat: faker.number.int({ min: 40, max: 100 }),
    },
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

/**
 * Generate array of mock daily logs for testing progress tracking
 */
export const createMockDailyLogsSequence = (
  count: number,
  options?: {
    startDate?: string;
    isSaved?: boolean;
    includeWeight?: boolean;
  }
): DailyLog[] => {
  const logs: DailyLog[] = [];
  const startDate = options?.startDate
    ? new Date(options.startDate)
    : new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);

    logs.push(
      createMockDailyLog({
        date: date.toISOString().split('T')[0],
        isSaved: options?.isSaved ?? true,
        weight: options?.includeWeight ? faker.number.int({ min: 70, max: 90 }) : undefined,
      })
    );
  }

  return logs;
};
