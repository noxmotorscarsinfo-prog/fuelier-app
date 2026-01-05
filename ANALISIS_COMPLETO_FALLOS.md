# 🔍 ANÁLISIS COMPLETO DE FALLOS - FUELIER APP

## ⚠️ PROBLEMAS CRÍTICOS DETECTADOS

### 🔴 **PROBLEMA #1: CONFLICTO EN CÁLCULO DE MACROS**
**Severidad:** CRÍTICA  
**Impacto:** Los macros del usuario son inconsistentes

**Descripción:**
- Existen DOS sistemas diferentes para calcular macros:
  - `macroCalculations.ts` → Fórmula Mifflin-St Jeor (CORRECTA Y COMPLETA)
  - `mealDistribution.ts` → Fórmula simplificada y antigua
- `Settings.tsx` importa de `mealDistribution.ts` en lugar de `macroCalculations.ts`
- Esto causa que los macros calculados en Settings sean diferentes a los del onboarding

**Solución:**
- Settings debe importar `calculateMacros` de `macroCalculations.ts`
- Eliminar la función `calculateMacros` duplicada de `mealDistribution.ts`
- Unificar TODO el cálculo de macros en un solo archivo

---

### 🔴 **PROBLEMA #2: SISTEMA DE OBJETIVOS INCONSISTENTE**
**Severidad:** CRÍTICA  
**Impacto:** Los objetivos nutricionales no funcionan correctamente

**Descripción:**
- El tipo `User` tiene 5 objetivos: `rapid_loss | moderate_loss | maintenance | moderate_gain | rapid_gain`
- Pero `mealDistribution.ts` usa el sistema ANTIGUO de 3 objetivos: `lose_weight | maintain | gain_muscle`
- Existe un mapeo en `macroCalculations.ts` pero NO se usa en todos los sitios
- Cuando el usuario cambia su objetivo, puede que no se aplique correctamente

**Ejemplo del fallo:**
```typescript
// En types.ts
goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'

// Pero en mealDistribution.ts línea 56
switch (user.goal) {
  case 'lose_weight': // ❌ Este valor NO EXISTE en el tipo User
  case 'maintain':    // ❌ Este valor NO EXISTE
  case 'gain_muscle': // ❌ Este valor NO EXISTE
}
```

**Solución:**
- Actualizar `mealDistribution.ts` para usar los 5 objetivos correctos
- Usar la función `mapUserGoalToInternalGoal()` consistentemente
- Validar que TODOS los switch/case usen los objetivos correctos

---

### 🟠 **PROBLEMA #3: GRAMOS DE INGREDIENTES NO SE ADAPTAN**
**Severidad:** ALTA  
**Impacto:** Las cantidades de ingredientes no se ajustan cuando cambias la porción

**Descripción:**
- Los platos predefinidos tienen `ingredients: string[]` (solo nombres, sin gramos)
- Los platos custom tienen `detailedIngredients?: MealIngredient[]` (con gramos)
- Cuando ajustas una porción (ej: 1.5x), los MACROS se multiplican pero los GRAMOS de ingredientes NO
- El usuario ve "100g de pollo" cuando debería ver "150g de pollo"

**Ejemplo del problema:**
```typescript
// Plato original: "Pollo con Arroz"
ingredients: ["200g Pechuga de pollo", "150g Arroz blanco"]
calories: 450, protein: 45, carbs: 50, fat: 8

// Usuario selecciona 1.5 porciones
// ✅ BIEN: calories: 675, protein: 67.5, carbs: 75, fat: 12
// ❌ MAL: ingredients sigue mostrando ["200g Pechuga de pollo", "150g Arroz blanco"]
// ✅ DEBERÍA: ["300g Pechuga de pollo", "225g Arroz blanco"]
```

**Solución:**
- Parsear los ingredientes de platos predefinidos para extraer cantidades
- Crear función `scaleIngredients(ingredients: string[], multiplier: number)`
- Aplicar el multiplicador a TODAS las cantidades en gramos
- Mostrar ingredientes escalados en MealDetail y MealSelection

---

### 🟠 **PROBLEMA #4: DISTRIBUCIÓN DE MACROS POR COMIDA INCORRECTA**
**Severidad:** ALTA  
**Impacto:** Los macros recomendados por comida no suman correctamente

**Descripción:**
- La función `getMacroDistributionForMeal()` tiene ratios que NO suman 1.0
- Ejemplo breakfast: `proteinRatio: 0.25, carbsRatio: 0.35, fatRatio: 0.20` = **0.80** (falta 0.20)
- Esto causa que los macros totales del día NO coincidan con el objetivo del usuario

**Datos del fallo:**
```typescript
// Línea 172 de mealDistribution.ts
case 'breakfast':
  return { proteinRatio: 0.25, carbsRatio: 0.35, fatRatio: 0.20 }; // = 0.80 ❌

case 'lunch':
  return { proteinRatio: 0.35, carbsRatio: 0.35, fatRatio: 0.35 }; // = 1.05 ❌

case 'snack':
  return { proteinRatio: 0.20, carbsRatio: 0.15, fatRatio: 0.15 }; // = 0.50 ❌
```

**Solución:**
- Los ratios deben sumar exactamente 1.0 para cada tipo de comida
- O MEJOR: Calcular los macros de cada comida directamente desde el total del día
- Validar que la suma de todas las comidas = objetivo diario exacto

---

### 🟠 **PROBLEMA #5: PORCIÓN ÓPTIMA PUEDE SER EXTREMA**
**Severidad:** MEDIA  
**Impacto:** El sistema puede sugerir porciones imposibles de comer

**Descripción:**
- `calculateOptimalPortion()` puede devolver valores entre 0.25 y 4.0 porciones
- Para la "última comida del día" permite hasta 4.0 porciones
- Un plato de 800 kcal × 4.0 = **3200 kcal en una sola comida** (imposible)
- No valida que el resultado sea realista para comer

**Ejemplo problemático:**
```typescript
// Usuario tiene objetivo de 2000 kcal/día
// Ha comido solo 400 kcal en 3 comidas (comió muy poco)
// Última comida (cena): el sistema calcula que faltan 1600 kcal
// Selecciona "Ensalada César" (600 kcal)
// Porción sugerida: 1600 / 600 = 2.67 porciones
// Resultado: "Cómete 2.67 ensaladas" ❌ (poco realista)
```

**Solución:**
- Limitar la porción máxima a 2.0 incluso en última comida
- Si falta mucho para completar, sugerir complementos en lugar de aumentar porción
- Validar que la porción × calorías del plato < 1000 kcal (límite razonable por comida)

---

### 🟡 **PROBLEMA #6: SISTEMA DE COMPLEMENTOS DESACTIVADO**
**Severidad:** MEDIA  
**Impacto:** Funcionalidad prometida que no funciona

**Descripción:**
- El código tiene toda la lógica de complementos implementada
- Pero está comentada/desactivada en el flujo principal
- `showComplementsModal` nunca se pone a `true`
- La función `handleSelectComplement` existe pero nunca se llama

**Estado actual:**
```typescript
// En MealSelection.tsx línea 241
const handleConfirmPortion = () => {
  // ... código que DEBERÍA mostrar complementos ...
  // Pero en su lugar hace esto:
  onSelectMeal(adjustedMeal); // ❌ Guarda directo sin mostrar complementos
  setIsSelectingComplement(false);
};
```

**Solución:**
- Reactivar el flujo de complementos cuando la porción es < 0.8
- Mostrar `ComplementsModal` cuando el plato se queda corto
- Permitir al usuario agregar un complemento o rechazarlo

---

### 🔴 **PROBLEMA #7: MACROS PERSONALIZADOS NO INTERRELACIONADOS**
**Severidad:** CRÍTICA  
**Impacto:** Los sliders de macros custom no funcionan correctamente

**Descripción:**
- El documento `/CAMBIOS_DETALLADOS.md` describe cambios necesarios
- **ESTOS CAMBIOS NO SE HAN APLICADO**
- Los sliders de calorías, proteína, carbos y grasas funcionan independientemente
- No respetan la fórmula: `Calorías = (Proteína × 4) + (Carbos × 4) + (Grasas × 9)`
- El selector duplicado de "Goal" sigue en Perfil Físico (debería estar solo en Objetivos)

**Cambios pendientes:**
1. ❌ Eliminar selector duplicado de Goal (líneas 357-374 de Settings.tsx)
2. ❌ Agregar handlers `handleCaloriesChange`, `handleProteinChange`, etc.
3. ❌ Actualizar `onChange` de los 4 sliders
4. ❌ Hacer que botones de objetivos apliquen cambios automáticamente

**Solución:**
- Aplicar los 4 cambios descritos en `/CAMBIOS_DETALLADOS.md`
- Ver instrucciones detalladas en ese archivo

---

### 🟠 **PROBLEMA #8: DOS CÁLCULOS DIFERENTES DE TDEE**
**Severidad:** ALTA  
**Impacto:** El gasto calórico diario es inconsistente

**Descripción:**
- `macroCalculations.ts` tiene factores de actividad más precisos (9 niveles)
- `mealDistribution.ts` tiene factores simplificados (4 niveles)
- Dependiendo de dónde se calcule, el TDEE es diferente

**Comparación:**
```typescript
// macroCalculations.ts (CORRECTO)
trainingFrequency === 1 → 1.375
trainingFrequency === 2 → 1.465
trainingFrequency === 3 → 1.55
trainingFrequency === 4 → 1.6
trainingFrequency === 5 → 1.725

// mealDistribution.ts (SIMPLIFICADO)
trainingFrequency <= 1 → 1.2
trainingFrequency <= 3 → 1.375
trainingFrequency <= 5 → 1.55
trainingFrequency >= 6 → 1.725
```

**Solución:**
- Usar SOLO los factores de `macroCalculations.ts`
- Eliminar `calculateTDEE` de `mealDistribution.ts`
- Importar desde `macroCalculations.ts` en todos los archivos

---

### 🟡 **PROBLEMA #9: MIGRACIÓN DE USUARIOS INCOMPLETA**
**Severidad:** MEDIA  
**Impacto:** Usuarios antiguos pueden tener datos inconsistentes

**Descripción:**
- `App.tsx` tiene migraciones en `useEffect` de carga de usuario
- Migra `preferences`, `sex`, `age`, `goal`
- Pero NO migra `mealsPerDay` (puede ser undefined)
- Tampoco actualiza correctamente el `goal` al sistema nuevo de 5 opciones

**Migraciones pendientes:**
```typescript
// FALTAN estas migraciones en App.tsx
if (!parsedUser.mealsPerDay) {
  parsedUser.mealsPerDay = 3; // Valor por defecto
}

if (parsedUser.goal === 'lose_weight') {
  parsedUser.goal = 'moderate_loss'; // Mapear valores antiguos
}
if (parsedUser.goal === 'maintain') {
  parsedUser.goal = 'maintenance';
}
if (parsedUser.goal === 'gain_muscle') {
  parsedUser.goal = 'moderate_gain';
}
```

**Solución:**
- Agregar migraciones para `mealsPerDay`
- Mapear valores antiguos de `goal` a los nuevos

---

### 🟡 **PROBLEMA #10: PLATOS PREDEFINIDOS SIN GRAMOS DETALLADOS**
**Severidad:** MEDIA  
**Impacto:** Los usuarios no ven cantidades exactas en platos predefinidos

**Descripción:**
- Los 200 platos generados tienen `ingredients: string[]` con descripciones vagas
- Ejemplo: `["Pechuga de pollo", "Arroz", "Verduras"]` (sin cantidades)
- Los platos custom SÍ tienen `detailedIngredients: MealIngredient[]` con gramos exactos
- Esta inconsistencia confunde al usuario

**Diferencia:**
```typescript
// Plato PREDEFINIDO (sin detalle)
{
  name: "Pollo con Arroz",
  ingredients: ["Pechuga de pollo", "Arroz blanco", "Brócoli"],
  calories: 450,
  // ❌ El usuario no sabe cuántos gramos de cada ingrediente
}

// Plato CUSTOM (con detalle)
{
  name: "Mi Pollo con Arroz",
  detailedIngredients: [
    { ingredientName: "Pechuga de pollo", amount: 200, calories: 220, protein: 46, ... },
    { ingredientName: "Arroz blanco", amount: 150, calories: 195, protein: 4, ... },
  ],
  // ✅ El usuario ve exactamente 200g pollo, 150g arroz
}
```

**Solución:**
- Generar `detailedIngredients` para todos los platos predefinidos
- O parsear los `ingredients: string[]` para extraer cantidades
- Mostrar siempre cantidades en gramos al usuario

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICOS (BLOQUEAN LA APP)
1. Conflicto en cálculo de macros (#1)
2. Sistema de objetivos inconsistente (#2)
3. Macros personalizados no interrelacionados (#7)

### 🟠 ALTOS (AFECTAN FUNCIONALIDAD PRINCIPAL)
3. Gramos de ingredientes no se adaptan (#3)
4. Distribución de macros incorrecta (#4)
5. Dos cálculos diferentes de TDEE (#8)

### 🟡 MEDIOS (MEJORAS NECESARIAS)
6. Porción óptima puede ser extrema (#5)
7. Sistema de complementos desactivado (#6)
8. Migración de usuarios incompleta (#9)
9. Platos predefinidos sin gramos (#10)

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: ARREGLAR CÁLCULOS (CRÍTICO)
1. Unificar sistema de cálculo de macros
2. Arreglar sistema de objetivos (5 opciones consistentes)
3. Implementar handlers de macros personalizados
4. Unificar cálculo de TDEE

### FASE 2: ARREGLAR DISTRIBUCIÓN DE COMIDAS
5. Corregir ratios de macros por comida
6. Validar que distribución sume 100% del objetivo diario
7. Implementar escalado de ingredientes por porción

### FASE 3: MEJORAR EXPERIENCIA
8. Limitar porciones óptimas a rangos realistas
9. Reactivar sistema de complementos
10. Agregar gramos detallados a platos predefinidos
11. Completar migraciones de usuarios antiguos

---

## ✅ VALIDACIONES NECESARIAS DESPUÉS DE ARREGLAR

- [ ] Los macros en Settings coinciden con los del onboarding
- [ ] Cambiar objetivo recalcula macros correctamente
- [ ] Los 5 objetivos funcionan (rapid_loss, moderate_loss, maintenance, moderate_gain, rapid_gain)
- [ ] Ajustar porción escala los gramos de ingredientes
- [ ] La suma de macros de todas las comidas = objetivo diario exacto
- [ ] Porción óptima nunca supera 2.0x
- [ ] Sistema de complementos se muestra cuando porción < 0.8
- [ ] Sliders de macros custom respetan fórmula de calorías
- [ ] TDEE es el mismo en todos los cálculos
- [ ] Usuarios antiguos se migran correctamente

---

**TOTAL DE FALLOS DETECTADOS:** 10  
**FALLOS CRÍTICOS:** 3  
**FALLOS ALTOS:** 3  
**FALLOS MEDIOS:** 4

**ESTIMACIÓN DE TRABAJO:** 4-6 horas para arreglar todos los fallos críticos y altos
