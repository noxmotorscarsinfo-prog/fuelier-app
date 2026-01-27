import { calculateMacrosFromIngredients } from '../ingredientsDatabase';

describe('calculateMacrosFromIngredients', () => {
  it('rounds macros to integers (no decimals)', () => {
    // 150g pechuga de pollo -> protein 31/100g => 46.5 -> rounds to 47
    const inputs = [
      { ingredientId: 'pollo-pechuga', amountInGrams: 150 }
    ];

    const macros = calculateMacrosFromIngredients(inputs as any);

    expect(macros.protein).toBe(Math.round(31 * 1.5));
    expect(macros.calories).toBe(Math.round(165 * 1.5));
    expect(Number.isInteger(macros.protein)).toBe(true);
    expect(Number.isInteger(macros.carbs)).toBe(true);
    expect(Number.isInteger(macros.fat)).toBe(true);
  });
});