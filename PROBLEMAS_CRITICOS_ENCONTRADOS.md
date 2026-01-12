# 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

## Estado: Verificación completada - Se encontraron 4 problemas críticos

---

## PROBLEMA 1: ExtraFood - Props mismatch ⚠️ CRÍTICO
**Archivo:** `src/app/App.tsx` línea 1478-1484  
**Severidad:** 🔴 BLOQUEANTE

### Síntoma
ExtraFood.tsx espera prop `onAdd` pero App.tsx lo pasa como `onSave`.

### Código actual (INCORRECTO)
```tsx
// App.tsx línea 1478
{showExtraFood && (
  <ExtraFood
    currentLog={getCurrentLog()}
    onClose={() => setShowExtraFood(false)}
    onSave={(food) => {  // ❌ INCORRECTO
      // ...
    }}
    onDelete={(index) => {
      // ...
    }}
  />
)}
```

### Código esperado
```tsx
interface ExtraFoodProps {
  user: User;
  currentLog: DailyLog;
  onClose: () => void;
  onAdd: (extraFood: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void; // ✅ ESPERADO
}
```

### Impacto
- ❌ El callback nunca se ejecuta (prop no existe)
- ❌ Las comidas extra no se guardan
- ❌ El usuario agrega comida extra pero no persiste

### Fix requerido
Cambiar `onSave` por `onAdd` en App.tsx línea 1483

---

## PROBLEMA 2: calculateTotals() no suma extraFoods ⚠️ CRÍTICO
**Archivo:** `src/app/components/Dashboard.tsx` línea 204-226  
**Severidad:** 🔴 BLOQUEANTE

### Síntoma
La función `calculateTotals()` calcula macros del día pero omite las `extraFoods`.

### Código actual (INCOMPLETO)
```tsx
const calculateTotals = () => {
  // Solo sumar las comidas activas según configuración del usuario
  const baseTotals = activeMealTypes.reduce(
    (acc, type) => {
      const meal = currentLog[type];
      if (meal) {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Añadir comidas complementarias
  if (currentLog.complementaryMeals && currentLog.complementaryMeals.length > 0) {
    currentLog.complementaryMeals.forEach(meal => {
      baseTotals.calories += meal.calories;
      baseTotals.protein += meal.protein;
      baseTotals.carbs += meal.carbs;
      baseTotals.fat += meal.fat;
    });
  }

  return baseTotals;  // ❌ NO INCLUYE EXTRAFODOS
};
```

### Impacto
- ❌ Macros mostrados en Dashboard son INCORRECTOS
- ❌ Si usuario agrega comida extra, no aparece en total
- ❌ Proyecciones de macros son inexactas
- ❌ Usuario se confunde con números que no cierran

### Fix requerido
Agregar bloque que sume `currentLog.extraFoods` al total

```tsx
// Añadir comidas extra
if (currentLog.extraFoods && currentLog.extraFoods.length > 0) {
  currentLog.extraFoods.forEach(extra => {
    baseTotals.calories += extra.calories;
    baseTotals.protein += extra.protein;
    baseTotals.carbs += extra.carbs;
    baseTotals.fat += extra.fat;
  });
}
```

---

## PROBLEMA 3: CalendarView no muestra extraFoods ⚠️ IMPORTANTE
**Archivo:** `src/app/components/CalendarView.tsx`  
**Severidad:** 🟠 IMPORTANTE

### Síntoma
Cuando usuario ve histórico en calendario, no ve desglose de comidas extra que agregó.

### Impacto
- ❌ Datos históricos incompletos
- ❌ Usuario no puede ver qué comidas extra registró
- ❌ Análisis de historial inexacto

### Datos esperados en desglose
```
Desayuno: Avena (350 cal, 15p, 45c, 10g)
Comida: Pollo (500 cal, 50p, 0c, 25g)
Merienda: [sin plato]
Cena: Pasta (600 cal, 20p, 80c, 10g)
===================================
COMIDAS EXTRA:
  - Café con leche: 50 cal, 2p, 6c, 1g
  - Chocolate: 150 cal, 2p, 20c, 8g
===================================
TOTAL: 1650 cal, 89p, 151c, 54g
```

### Fix requerido
Actualizar CalendarView para mostrar `extraFoods` en desglose de macros

---

## PROBLEMA 4: SavedDiets no está completamente verificado ⚠️ RIESGO
**Archivo:** `src/app/components/SavedDiets.tsx`  
**Severidad:** 🟡 REQUIERE REVISIÓN

### Estado
- SavedDiets.tsx existe
- Tiene componente `onApplyDiet`
- Pero lógica de guardado/carga no está clara

### Riesgo
- ¿Se guardan correctamente en Supabase?
- ¿Se cargan correctamente?
- ¿Se aplican correctamente al día?
- ¿Qué información se guarda? (solo meals o también extraFoods?)

### Fix requerido
Auditoría completa de SavedDiets end-to-end

---

## RESUMEN DE FIXES REQUERIDOS

| # | Problema | Archivo | Línea | Criticidad | Tipo |
|---|----------|---------|-------|-----------|------|
| 1 | ExtraFood props | App.tsx | 1483 | BLOQUEANTE | Prop incorrecta |
| 2 | calculateTotals | Dashboard.tsx | 226 | BLOQUEANTE | Lógica incompleta |
| 3 | CalendarView | CalendarView.tsx | TBD | IMPORTANTE | Visualización |
| 4 | SavedDiets | SavedDiets.tsx | TBD | RIESGO | Auditoría |

---

## ORDEN DE IMPLEMENTACIÓN

1. ✅ **PRIMERO**: Fix ExtraFood props (30 seg)
2. ✅ **SEGUNDO**: Fix calculateTotals extraFoods (2 min)
3. ✅ **TERCERO**: Fix CalendarView (5-10 min)
4. ✅ **CUARTO**: Auditoría SavedDiets (10 min)
5. ✅ **QUINTO**: Tests E2E (15-20 min)
6. ✅ **SEXTO**: Validación manual (5 min)

**Tiempo total estimado:** 45-60 minutos

---

**Status:** 🟡 LISTO PARA IMPLEMENTAR FIXES
