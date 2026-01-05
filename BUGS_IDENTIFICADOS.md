# 🐛 BUGS CRÍTICOS IDENTIFICADOS EN FUELIER

## 1. ❌ BUG CRÍTICO: Cálculo Duplicado y Contradictorio de Macros Consumidos

**Archivo**: `/src/app/components/MealSelection.tsx`

**Problema**:
- Existen TRES cálculos diferentes de macros consumidos:
  1. Línea 87-123: `remaining` - ✅ Excluye correctamente la comida actual
  2. Línea 310-324: `consumedMacros` - ❌ Incluye TODAS las comidas (incluyendo la actual!)
  3. Línea 431-448: `consumed` dentro de `recommendedMeals` - ❌ Incluye TODAS las comidas

**Impacto**:
- Las recomendaciones pueden estar basadas en datos incorrectos
- Puede mostrar que has consumido más de lo que realmente has consumido
- Afecta el sistema de scoring y preferencias

**Solución**:
- Consolidar en un ÚNICO cálculo de `consumed` que excluya la comida actual
- Reutilizar este cálculo en todo el componente

---

## 2. ❌ BUG: Imports No Utilizados

**Archivo**: `/src/app/components/MealSelection.tsx`

**Problema**:
Múltiples imports que NO se usan en el código:
- `mealMatchesType` from types
- `calculateRemainingMacros` from mealRecommendation
- `calculateSimplePortion` from simplePortionCalculator
- `adaptMealToUser`, `AdaptedMeal` from intelligentMealAdaptation
- `scaleMealWithIngredients` from scaleIngredients
- `calculateExactPortion`, `calculateRemainingMacrosForDay`, `applyMultiplierToMeal`, `calculateMacroFitScore` from exactPortionCalculator
- `scaleToRemainingMacros` from intelligentMealScaling
- `Minus`, `Plus`, `Trophy` icons from lucide-react

**Impacto**:
- Bundle size innecesariamente grande
- Confusión en el código
- Dificulta el mantenimiento

**Solución**:
- Eliminar todos los imports no utilizados
- Mantener solo los que realmente se usan

---

## 3. ⚠️ POTENCIAL BUG: Cálculo de consumed en recommendedMeals

**Archivo**: `/src/app/components/MealSelection.tsx` línea 431-448

**Problema**:
```typescript
const consumed = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

// Calcular lo que ya consumió en otras comidas
const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
mealTypes.forEach(type => {
  if (currentLog[type]) {
    const meal = currentLog[type]!;
    consumed.calories += meal.calories || 0;
    consumed.protein += meal.protein || 0;
    consumed.carbs += meal.carbs || 0;
    consumed.fat += meal.fat || 0;
  }
});
```

Este código incluye **TODAS** las comidas del día, incluyendo potencialmente la comida actual.

**Solución**:
Excluir explícitamente la comida actual:
```typescript
mealTypes.forEach(type => {
  if (type !== mealType && currentLog[type]) {
    // ...
  }
});
```

---

## 4. 🔧 MEJORA: División por Cero Potencial

**Archivo**: `/src/app/utils/intelligentMealScaling.ts`

**Problema Potencial**:
En `calculateFitScore` línea 84, hay división por `remaining.calories` que podría ser 0.

**Solución**:
Agregar validación para evitar división por cero:
```typescript
if (remaining.calories === 0) {
  return 0; // No se puede calcular fit si no hay objetivo
}
```

---

## 5. ✅ NO ES BUG: Log Excesivo en Consola

**Archivo**: Múltiples archivos

**Situación**:
Hay muchos `console.log` en producción que pueden afectar el rendimiento.

**Recomendación**:
- Mantenerlos por ahora para debugging
- En el futuro, crear un sistema de logging condicional basado en NODE_ENV

---

## RESUMEN DE PRIORIDADES:

### 🔴 CRÍTICO (Arreglar AHORA):
1. Bug #1: Cálculo duplicado de consumed
2. Bug #3: consumed en recommendedMeals incluye comida actual

### 🟡 IMPORTANTE (Arreglar pronto):
1. Bug #2: Imports no utilizados
2. Bug #4: División por cero potencial

### 🟢 MEJORA (Futuro):
1. Optimización de logs
