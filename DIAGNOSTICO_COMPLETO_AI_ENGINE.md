# 🔍 DIAGNÓSTICO COMPLETO DEL AI ENGINE - 15 ENE 2026

## 📊 RESUMEN EJECUTIVO

**Estado:** ⚠️ **SISTEMA FUNCIONAL PERO NECESITA OPTIMIZACIÓN**

- ✅ AI Engine funciona correctamente
- ✅ Ingredientes cargados desde Supabase (60 ingredientes)
- ✅ Conversión ingredientReferences → mealIngredients funcional
- ❌ **0 de 11 platos alcanzan 95%+ accuracy**
- ⚠️ Todos los platos usan "fallback proporcional" (LP/LS no encuentra soluciones)

---

## 🐛 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### ✅ **PROBLEMA 1: TARGET con `calories: NaN` (RESUELTO)**

**Síntoma:**
```
🎯 TARGET CALCULADO:
   Calorías: NaN kcal  ← ❌
   Proteína: 60g
   Carbos:   84g
   Grasa:    21g
```

**Causa:** `mockUser` usaba `goals.dailyCalories` pero el tipo `User` espera `goals.calories`

**Solución Aplicada:**
```typescript
// ANTES:
const mockUser = {
  goals: { dailyCalories: 2500, protein: 200, carbs: 280, fat: 70 }
}

// DESPUÉS:
const mockUser: User = {
  sex: 'male',
  age: 30,
  weight: 75,
  height: 175,
  trainingFrequency: 4,
  goal: 'maintenance',
  mealsPerDay: 4,
  goals: {
    calories: 2500,  // ✅ Correcto
    protein: 200,
    carbs: 280,
    fat: 70
  },
  // ... resto de campos requeridos
}
```

**Estado:** ✅ RESUELTO

---

### ✅ **PROBLEMA 2: Ingredientes con esquema incompatible (RESUELTO)**

**Síntoma:**
```
❌ Cannot read properties of undefined (reading 'reduce')
```

**Causa:** Ingredientes de Supabase usan `proteinPer100g`, pero el código esperaba `protein`

**Solución Aplicada:**
```typescript
// test-ai-engine-completo.ts - conversión correcta
const mealIngredients: MealIngredient[] = meal.ingredientReferences?.map(ref => {
  const ingredient = allIngredients.find(i => i.id === ref.ingredientId);
  
  // ✅ Usar macrosPer100g de ingredientes de Supabase
  const ratio = ref.amountInGrams / 100;
  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    amount: ref.amountInGrams,
    calories: (ingredient as any).caloriesPer100g * ratio,
    protein: (ingredient as any).proteinPer100g * ratio,
    carbs: (ingredient as any).carbsPer100g * ratio,
    fat: (ingredient as any).fatPer100g * ratio
  };
});
```

**Estado:** ✅ RESUELTO

---

### ⚠️ **PROBLEMA 3: AI Engine usa fallback en lugar de LP/LS (ACTIVO)**

**Síntoma:**
```
📊 Plato clasificado como: balanced
⚠️ No se encontró solución aceptable, usando fallback proporcional
❌ Accuracy: 85.0%
   Obtenido: 625kcal | 36P | 75C | 22G
   Target:   625kcal | 50P | 70C | 18G
```

**Todos los platos:**
- Usan fallback proporcional
- No se encuentra solución con LP
- Accuracy máximo: 91% (Yogur Griego)
- Accuracy mínimo: 55% (Revuelto de Huevos con Salmón)

**Posibles Causas:**
1. ⚠️ **LP solver falla siempre** → Cae al fallback proporcional
2. ⚠️ **Tolerancias muy estrechas** → Incluso con multiplicadores (1x, 1.5x, 2x, 3x, 5x, 8x) no se encuentra solución
3. ⚠️ **Targets inalcanzables** → Algunos platos no pueden alcanzar el ratio P:C:G requerido

**Investigación Necesaria:**
- ¿Por qué LP solver falla en TODOS los casos?
- ¿Las tolerancias progresivas (1x→8x) están funcionando?
- ¿Los ingredientes base tienen macros correctos?

**Estado:** ⚠️ PENDIENTE INVESTIGACIÓN

---

### ⚠️ **PROBLEMA 4: MAX error reporting incorrecto (ACTIVO)**

**Síntoma:**
```
❌ Accuracy: 85.0% (MAX error: 0.0%)  ← ⚠️ MAX error debería ser ~28% (14.1P de error en 50P)
   Error: 0kcal | 14.1P | 5.0C | 4.4G
```

**Causa:** Posiblemente `calculateAccuracyMaxError()` no está calculando correctamente o no se está llamando.

**Estado:** ⚠️ PENDIENTE INVESTIGACIÓN

---

## 📈 RESULTADOS ACTUALES

### TOP 5 MEJORES PLATOS:
1. **Yogur Griego con Granola y Frutos Rojos:** 91.0%
   - Obtenido: 625kcal | 43P | 81C | 17G
   - Target:   625kcal | 50P | 70C | 18G
   - Error: 7.2P | 11.0C | 1.1G

2. **Tostadas de Pan Integral con Pavo y Aguacate:** 89.5%
   - Obtenido: 625kcal | 60P | 61C | 17G
   - Target:   625kcal | 50P | 70C | 18G
   - Error: 10.5P | 9.4C | 1.4G

3. **Batido Proteico de Plátano y Avena:** 88.2%

4. **Pancakes Proteicos con Frutos Rojos:** 85.9%

5. **Tortilla de Avena con Frutas:** 85.0%

### TOP 5 PEORES PLATOS:
1. **Revuelto de Huevos con Salmón Ahumado:** 55.2% ❌
2. **Tostada de Centeno con Salmón y Aguacate:** 63.3% ❌
3. **Tortilla de Claras con Verduras:** 64.4% ❌
4. **Porridge de Avena con Frutas Mixtas:** 74.1% ⚠️
5. **Bowl de Avena con Mantequilla de Cacahuete:** 77.6% ⚠️

**Patrón:** Platos con salmón y platos con muchas verduras tienen peor performance. Posiblemente porque el target requiere más carbohidratos de los que pueden aportar.

---

## 🎯 TARGET USADO

```
Target para breakfast (25% del total diario):
  Calorías: 625 kcal (25% de 2500)
  Proteína: 50g
  Carbos:   70g  
  Grasa:    18g
```

**Análisis del target:**
- Calculado correctamente por `calculateIntelligentTarget`
- Usa distribución por defecto: breakfast 25% | lunch 35% | snack 15% | dinner 25%
- Macros ajustados por `getMealGoals()` según el % de calorías

---

## 🧪 ESTRUCTURA DE DATOS VERIFICADA

### ✅ Ingredientes (60 en Supabase):
```typescript
{
  id: 'huevos',
  name: 'Huevos',
  category: 'proteina',
  caloriesPer100g: 155,
  proteinPer100g: 13,
  carbsPer100g: 1.1,
  fatPer100g: 11
}
```

### ✅ MealIngredients generados correctamente:
```typescript
{
  ingredientId: 'huevos',
  ingredientName: 'Huevos',
  amount: 150,  // gramos
  calories: 233,  // 155 * 1.5
  protein: 19.5,  // 13 * 1.5
  carbs: 1.7,     // 1.1 * 1.5
  fat: 16.5       // 11 * 1.5
}
```

### ✅ Meals con ingredientReferences:
```typescript
{
  id: 'tortilla-avena-frutas',
  name: 'Tortilla de Avena con Frutas',
  type: 'breakfast',
  ingredientReferences: [
    { ingredientId: 'huevos', amountInGrams: 150 },
    { ingredientId: 'avena', amountInGrams: 50 },
    { ingredientId: 'platano', amountInGrams: 100 },
    // ...
  ]
}
```

**Conclusión:** ✅ Estructura de datos es correcta. El problema está en el algoritmo de optimización.

---

## 🔧 PRÓXIMOS PASOS

### 1️⃣ **URGENTE: Investigar por qué LP solver siempre falla**

```typescript
// Agregar logging detallado en fuelierAIEngine.ts
function solveWithHybridApproach() {
  for (const multiplier of [1, 1.5, 2, 3, 5, 8]) {
    try {
      const lpSolution = solveWithLP(...);
      console.log(`✅ LP exitoso con tolerancia ${multiplier}x`);
      return lpSolution;
    } catch (error) {
      console.log(`❌ LP falló con tolerancia ${multiplier}x:`, error.message);
      // Continuar con siguiente multiplier
    }
  }
  // Si todos fallan → fallback
}
```

**Hipótesis:** El LP solver puede estar fallando porque:
- La librería LP no está instalada/configurada
- Las restricciones son imposibles de satisfacer
- Hay un bug en `solveWithLP()`

### 2️⃣ **Verificar implementación de LP solver**

```bash
# Buscar la implementación
grep -r "solveWithLP" src/app/utils/
```

### 3️⃣ **Ajustar tolerancias o usar LS directamente**

Si LP no funciona, el código debería caer a Least Squares:

```typescript
// Opción: Llamar directamente a LS si LP falla
if (lpFailed) {
  const lsSolution = refineWithLeastSquares(
    mealIngredients,
    targetMacros,
    strategy,
    plateClassification.tolerances,
    100,
    allIngredients
  );
  return lsSolution;
}
```

### 4️⃣ **Analizar platos que fallan**

Platos con salmón tienen bajo accuracy (55-63%). Posible razón:
- **Salmón tiene grasas muy altas** (13g por 100g)
- **Target requiere solo 18g de grasa total**
- Con 100g salmón (13g grasa) + aceite (5g) + aguacate (15g) = **33g grasa** (excede el target)
- El solver no puede reducir grasas sin eliminar ingredientes

**Solución posible:**
- Usar targets personalizados por tipo de plato
- Permitir añadir ingredientes "complementarios" con perfil macro adecuado
- Aumentar tolerancia de grasas para platos "fat-focused"

---

## 💡 RECOMENDACIONES FINALES

### Para alcanzar 95%+ accuracy:

1. **Opción A: Mejorar el solver**
   - Arreglar LP solver (si está roto)
   - Usar LS con más iteraciones (100→200)
   - Implementar gradiente descendente como backup

2. **Opción B: Ajustar targets**
   - Usar targets más flexibles para breakfast (±10% en lugar de ±5%)
   - Personalizar target por perfil de plato (protein-focused, carb-focused, etc.)
   - Permitir que grasas tengan mayor tolerancia (±15%)

3. **Opción C: Mejorar composición de platos**
   - Añadir ingredientes "comodín" (proteína whey, claras de huevo, aceite)
   - Permitir al AI Engine añadir ingredientes estratégicos automáticamente
   - Ajustar cantidades base de ingredientes en platos problemáticos

---

## 🎯 OBJETIVO

**Alcanzar:**
- ✅ 8+ platos con ≥95% accuracy
- ✅ Todos los platos con ≥90% accuracy
- ✅ 0 platos usando fallback proporcional

**Estado actual:**
- ❌ 0 platos con ≥95% accuracy
- ❌ 3 platos con ≥90% accuracy
- ❌ 11/11 platos usando fallback

**Gap:** Necesitamos **+15-20 puntos de accuracy** en promedio.

---

**CONCLUSIÓN:** El sistema funciona pero necesita optimización del solver y/o ajuste de targets/tolerancias para alcanzar el 95%+ requerido.
