# 🎯 PROPUESTA: Escalado Inteligente con Preservación de Esencia

## 🔴 PROBLEMAS ACTUALES

### Problema 1: Ingredientes se distorsionan
**Actual:**
```typescript
// LP Solver escala ingredientes independientemente
pollo: 150g → 220g (+47%)
arroz: 100g → 60g (-40%)
aceite: 10g → 25g (+150%)
```

**Impacto:**
- Pierde proporciones nutricionales reales
- Macros no corresponden a la realidad del ingrediente
- Usuario ve cantidades irreales

### Problema 2: Platos pierden su esencia
**Ejemplo: "Pollo con Arroz Integral"**

**Original (esencia):**
- 60% pollo, 40% arroz
- Ratio: 1.5:1 proteína/carbohidratos
- Identidad: plato proteico con carbohidratos complejos

**Después del AI Engine:**
- 80% pollo, 20% arroz (o peor)
- Ratio: 4:1 proteína/carbohidratos
- YA NO ES el mismo plato

---

## ✅ SOLUCIÓN: Sistema de Escalado en 3 Niveles

### NIVEL 1: Escalado Proporcional Puro (Preservación Total)
**Cuándo usar:**
- Platos con identidad muy definida
- Diferencia <15% entre base y target
- Usuario prefiere autenticidad

**Lógica:**
```typescript
function proportionalScaling(meal, target) {
  // Calcular factor global
  const baseCalories = meal.totalCalories;
  const scaleFactor = target.calories / baseCalories;
  
  // Escalar TODOS los ingredientes por igual
  meal.ingredients.forEach(ing => {
    ing.amount *= scaleFactor;
    ing.calories *= scaleFactor;
    ing.protein *= scaleFactor;
    ing.carbs *= scaleFactor;
    ing.fat *= scaleFactor;
  });
  
  return meal;
}
```

**Ventajas:**
- ✅ Mantiene proporciones 100%
- ✅ Macros escalan correctamente
- ✅ Esencia del plato preservada

**Desventajas:**
- ❌ Puede no alcanzar target exacto (solo aproximación)
- ❌ No compensa desvíos del día

---

### NIVEL 2: Escalado Inteligente con Core Fijo (Preservación Alta)
**Cuándo usar:**
- Diferencia 15-30% entre base y target
- Necesitas compensar un poco el día
- Plato tiene ingredientes "core" vs "flexibles"

**Lógica:**
```typescript
function smartScalingWithCore(meal, target, dayContext) {
  // PASO 1: Identificar ingredientes CORE vs FLEXIBLE
  const coreIngredients = identifyCore(meal); // Proteína principal, carbo principal
  const flexibleIngredients = identifyFlexible(meal); // Verduras, grasas, condimentos
  
  // PASO 2: Escalar CORE proporcionalmente
  const coreScaleFactor = calculateCoreScale(coreIngredients, target);
  coreIngredients.forEach(ing => scaleProportionally(ing, coreScaleFactor));
  
  // PASO 3: Ajustar FLEXIBLE para cerrar gap
  const remainingGap = target - getCurrentMacros();
  adjustFlexibleIngredients(flexibleIngredients, remainingGap, dayContext);
  
  return meal;
}

function identifyCore(meal) {
  // Core = ingredientes que definen la identidad del plato
  return meal.ingredients.filter(ing => {
    const category = ing.category?.toLowerCase();
    const isProteinCore = category.includes('proteina') && ing.calories > 100; // Proteína principal
    const isCarbCore = category.includes('carbohidrato') && ing.calories > 80; // Carbo principal
    return isProteinCore || isCarbCore;
  });
}

function identifyFlexible(meal) {
  // Flexible = verduras, grasas, condimentos, lacteos pequeños
  return meal.ingredients.filter(ing => {
    const category = ing.category?.toLowerCase();
    return category.includes('vegetal') || 
           category.includes('grasa') || 
           category.includes('condimento') ||
           (category.includes('lacteo') && ing.calories < 50);
  });
}
```

**Ventajas:**
- ✅ Preserva esencia del plato (core intacto)
- ✅ Permite compensación del día (flexible se ajusta)
- ✅ Macros más precisos que Nivel 1

**Desventajas:**
- ❌ Requiere clasificar ingredientes correctamente
- ❌ Puede no alcanzar 95%+ accuracy en casos extremos

---

### NIVEL 3: Escalado Full Adaptativo (Preservación Media)
**Cuándo usar:**
- Diferencia >30% entre base y target
- Necesitas compensar mucho el día
- Prioridad en accuracy sobre esencia

**Lógica:**
```typescript
function adaptiveScaling(meal, target, dayContext) {
  // PASO 1: Escalar proporcionalmente PRIMERO (base)
  const baseScaled = proportionalScaling(meal, target);
  
  // PASO 2: Si accuracy <90%, aplicar ajustes inteligentes
  if (accuracy < 90) {
    // Identificar macro con mayor gap
    const priorityMacro = findBiggestGap(baseScaled, target);
    
    // Ajustar ingredientes que aportan ese macro
    const relevantIngredients = meal.ingredients.filter(ing => 
      ing[priorityMacro] / ing.calories > 0.2 // >20% de calorías del macro
    );
    
    // Ajustar SOLO esos ingredientes (no todos)
    adjustIngredients(relevantIngredients, target, dayContext);
  }
  
  // PASO 3: Límites de desviación por ingrediente
  meal.ingredients.forEach(ing => {
    const originalRatio = ing.amountOriginal / meal.totalAmount;
    const currentRatio = ing.amount / meal.totalAmount;
    
    // NO permitir que un ingrediente cambie >50% su proporción
    if (Math.abs(currentRatio - originalRatio) > 0.5 * originalRatio) {
      ing.amount = ing.amountOriginal * 1.5; // Max 1.5x
    }
  });
  
  return meal;
}
```

**Ventajas:**
- ✅ Balance entre esencia y accuracy
- ✅ Puede alcanzar 95%+ accuracy
- ✅ Compensa bien el día

**Desventajas:**
- ❌ Puede alterar un poco la esencia (limitado al 50%)

---

## 🎯 SISTEMA DE DECISIÓN AUTOMÁTICA

```typescript
function chooseScalingStrategy(meal, target, dayContext, userPreferences) {
  const baseMacros = calculateBaseMacros(meal);
  const deviation = calculateDeviation(baseMacros, target);
  
  // CRITERIO 1: Desviación
  if (deviation < 0.15) {
    return 'proportional'; // Nivel 1
  }
  
  // CRITERIO 2: Compatibilidad del plato (desde mealCompatibilityScorer)
  const compatibilityScore = scoreMealCompatibility(meal, target);
  if (compatibilityScore.score >= 80) {
    return 'smart_with_core'; // Nivel 2
  }
  
  // CRITERIO 3: Preferencias del usuario
  if (userPreferences.prioritize === 'authenticity') {
    return 'smart_with_core'; // Nivel 2 (preserva más)
  }
  
  if (userPreferences.prioritize === 'accuracy') {
    return 'adaptive'; // Nivel 3 (accuracy)
  }
  
  // CRITERIO 4: Contexto del día
  if (dayContext.mealsLeft === 1) {
    // Última comida → necesita cerrar al 100%
    return 'adaptive'; // Nivel 3
  }
  
  // DEFAULT: Balance
  return deviation < 0.3 ? 'smart_with_core' : 'adaptive';
}
```

---

## 📊 COMPARATIVA DE ESTRATEGIAS

| Estrategia | Preservación Esencia | Accuracy Esperado | Compensación Día | Uso |
|------------|---------------------|-------------------|------------------|-----|
| **Nivel 1: Proporcional** | ⭐⭐⭐⭐⭐ 100% | 85-92% | ❌ No | Desayuno/Snacks |
| **Nivel 2: Smart Core** | ⭐⭐⭐⭐ 80-90% | 92-96% | ✅ Moderada | Comida/Cena |
| **Nivel 3: Adaptativo** | ⭐⭐⭐ 60-80% | 95-98% | ✅✅ Alta | Última comida |

---

## 🔧 INTEGRACIÓN CON SISTEMA ACTUAL

### Modificar fuelierAIEngine.ts

```typescript
export async function adaptMealToTarget(
  meal: Meal,
  target: MacroTargets,
  user: User,
  dailyLog: DailyLog | null,
  allIngredients: Ingredient[],
  options?: {
    preserveEssence?: boolean; // NUEVO
    scalingStrategy?: 'auto' | 'proportional' | 'smart_core' | 'adaptive'; // NUEVO
  }
): Promise<Meal> {
  // PASO 1: Decidir estrategia
  const strategy = options?.scalingStrategy || 'auto';
  const chosenStrategy = strategy === 'auto' 
    ? chooseScalingStrategy(meal, target, dayContext, user.preferences)
    : strategy;
  
  // PASO 2: Aplicar estrategia correspondiente
  switch (chosenStrategy) {
    case 'proportional':
      return applyProportionalScaling(meal, target);
    
    case 'smart_core':
      return applySmartCoreScaling(meal, target, dayContext, allIngredients);
    
    case 'adaptive':
      return applyAdaptiveScaling(meal, target, dayContext, allIngredients);
    
    default:
      throw new Error(`Unknown strategy: ${chosenStrategy}`);
  }
}
```

---

## 🎯 EJEMPLO REAL

### Input:
**Plato:** Pollo con Arroz Integral
```
Ingredientes base:
- Pechuga de pollo: 150g (248kcal, 46.5g P, 0g C, 5.4g G)
- Arroz integral: 80g (296kcal, 6.6g P, 62.2g C, 2.3g G)
- Aceite de oliva: 10g (88kcal, 0g P, 0g C, 10g G)
TOTAL: 632kcal, 53.1P, 62.2C, 17.7G
```

**Target:** 750kcal, 70P, 65C, 20G (usuario necesita más proteína)

---

### OUTPUT con cada estrategia:

#### ❌ ACTUAL (LP Solver sin control):
```
- Pechuga de pollo: 220g (+47%) → 365kcal, 68.2P
- Arroz integral: 45g (-44%) → 166kcal, 3.7P, 35.1C
- Aceite: 18g (+80%) → 158kcal, 20G
TOTAL: 689kcal, 71.9P, 35.1C, 20G

PROBLEMA: El plato dejó de ser "Pollo con Arroz"
→ Ahora es "Pollo con un poco de arroz"
→ Esencia perdida
```

#### ✅ NIVEL 1: Proporcional
```
Factor: 750/632 = 1.19x

- Pechuga de pollo: 178g (+19%) → 295kcal, 55.3P
- Arroz integral: 95g (+19%) → 352kcal, 7.8P, 74C
- Aceite: 12g (+19%) → 105kcal, 11.9G
TOTAL: 752kcal, 63.1P, 74C, 11.9G

Accuracy: 88.7% (no llega al target exacto)
Esencia: 100% preservada (60/40 pollo/arroz intacto)
```

#### ✅ NIVEL 2: Smart Core
```
Core (pollo + arroz): escalar a 1.15x
Flexible (aceite): ajustar para cerrar gap

- Pechuga de pollo: 173g (+15%) → 286kcal, 53.5P ← CORE
- Arroz integral: 92g (+15%) → 340kcal, 7.6P, 71.5C ← CORE
- Aceite: 14g (+40%) → 123kcal, 14G ← FLEXIBLE

TOTAL: 749kcal, 61.1P, 71.5C, 14G

Accuracy: 91.2%
Esencia: 85% preservada (core intacto, aceite ajustado)
```

#### ✅ NIVEL 3: Adaptativo
```
Paso 1: Escalar base a 1.19x
Paso 2: Gap mayor en proteína → ajustar pollo
Paso 3: Límite 50% desviación

- Pechuga de pollo: 200g (+33%) → 331kcal, 62P ← Ajustado
- Arroz integral: 88g (+10%) → 325kcal, 7.3P, 68.6C ← Ligeramente ajustado
- Aceite: 11g (+10%) → 97kcal, 11G

TOTAL: 753kcal, 69.3P, 68.6C, 11G

Accuracy: 96.8%
Esencia: 75% preservada (proporciones alteradas pero controladas)
```

---

## 🎯 RECOMENDACIÓN FINAL

**Implementar los 3 niveles con selección automática:**

1. **Desayuno/Snacks**: Nivel 1 (Proporcional) - Priorizar esencia
2. **Comida**: Nivel 2 (Smart Core) - Balance
3. **Cena**: Nivel 2 o 3 según contexto - Accuracy para cerrar día
4. **Última comida del día**: Nivel 3 (Adaptativo) - Cerrar 100%

**Ventajas del sistema:**
- ✅ Platos mantienen su identidad
- ✅ Ingredientes mantienen proporciones nutricionales reales
- ✅ Compensa el día de forma inteligente
- ✅ Usuario puede elegir prioridad (esencia vs accuracy)
- ✅ Sistema decide automáticamente lo mejor

**Próximos pasos:**
1. Implementar las 3 funciones de escalado
2. Crear sistema de clasificación core/flexible
3. Integrar con mealCompatibilityScorer existente
4. Testear con los 34 platos
5. Validar preservación de esencia + accuracy

¿Quieres que implemente esta solución?
