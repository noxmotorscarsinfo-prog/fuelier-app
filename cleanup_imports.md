# Imports a Limpiar en MealSelection.tsx

## Imports NO UTILIZADOS (a eliminar):
1. `mealMatchesType` - No se usa en el código
2. `calculateRemainingMacros` - Se calcula manualmente con useMemo
3. `calculateSimplePortion` - No se usa
4. `adaptMealToUser`, `AdaptedMeal` - No se usan
5. `scaleMealWithIngredients` - No se usa  
6. `calculateExactPortion` - No se usa
7. `calculateRemainingMacrosForDay` - No se usa (se calcula manualmente)
8. `applyMultiplierToMeal` - No se usa
9. `calculateMacroFitScore` - No se usa
10. `scaleToRemainingMacros` - No se usa
11. `Minus`, `Plus`, `Trophy` - Iconos no utilizados

## Imports UTILIZADOS (mantener):
- `getMealPool` - Se usa para filtrar comidas
- `recommendMeals` - Se usa en el sistema de recomendaciones
- `getMacroNeedsMessage` - Se usa para mostrar mensajes
- `MealScore` - Interface utilizada
- `getMealTarget` - Se usa en línea 1828
- `rankMealsByFit` - CRÍTICO - se usa para el nuevo sistema de ranking
- `ALL_MEALS_FROM_DB` - Se usa para obtener las comidas de BD
- Iconos: `ArrowLeft`, `Search`, `Check`, `Sparkles`, `Heart`, `ChefHat`, `Star`, `Filter`, `X`
