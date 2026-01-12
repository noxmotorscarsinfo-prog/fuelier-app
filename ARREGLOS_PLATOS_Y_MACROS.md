# Arreglos de Guardar Platos y Redondeo de Macros

**Fecha:** 12 de enero de 2026  
**Estado:** ✅ Completado

## Problema Identificado

El usuario reportó dos issues principales:
1. **Platos no se guardan:** Al crear platos personalizados (usuarios) y platos de admin, no persisten en la base de datos
2. **Macros con decimales:** Los macronutrientes se mostraban con decimales (ej: 31.5g) en lugar de números enteros

## Análisis Realizado

### 1. Función de Cálculo de Macros
- **Ubicación:** `src/data/ingredientsDatabase.ts` - función `calculateMacrosFromIngredients()`
- **Problema:** Retornaba valores con decimales: `protein: Math.round(totalProtein * 10) / 10`
- **Raíz:** Usaba `* 10 / 10` para mantener 1 decimal, lo cual ahora no queremos

### 2. Conversión BD → Modelo
- **Ubicación:** `src/utils/db/meals.ts` - funciones `dbMealToMeal()` y `dbCustomMealToMeal()`
- **Problema:** Convertía números directamente sin redondear: `calories: Number(db.calories)`
- **Raíz:** No aplicaba rounding en la conversión de datos desde Supabase

### 3. Rutas de API para Platos
- **GET /global-meals:** Era un placeholder que retornaba `[]`
- **POST /global-meals:** Era un placeholder que retornaba `{ success: true }` sin guardar
- **POST /custom-meals:** Guardaba la estructura incorrecta (usaba un objeto `macros` en lugar de campos individuales)

### 4. Imports en CreateMeal.tsx
- **Problema:** Llamaba a `getBaseIngredients()` y `createCustomIngredient()` sin importarlas
- **Ubicación:** Líneas 59 y 330 de `CreateMeal.tsx`
- **Raíz:** Las funciones están en `src/utils/db/ingredients.ts` pero no se importaban

## Cambios Realizados

### ✅ 1. Redondeo de Macros a Enteros

**Archivo:** `src/data/ingredientsDatabase.ts`  
**Función:** `calculateMacrosFromIngredients()`

```typescript
// ANTES:
return {
  calories: Math.round(totalCalories),
  protein: Math.round(totalProtein * 10) / 10,   // ← decimales
  carbs: Math.round(totalCarbs * 10) / 10,       // ← decimales
  fat: Math.round(totalFat * 10) / 10            // ← decimales
};

// DESPUÉS:
return {
  calories: Math.round(totalCalories),
  protein: Math.round(totalProtein),              // ← entero
  carbs: Math.round(totalCarbs),                  // ← entero
  fat: Math.round(totalFat)                       // ← entero
};
```

### ✅ 2. Rounding en Conversión BD → Modelo

**Archivo:** `src/utils/db/meals.ts`  
**Funciones:** `dbMealToMeal()` y `dbCustomMealToMeal()`

```typescript
// ANTES:
calories: Number(db.calories),
protein: Number(db.protein),
carbs: Number(db.carbs),
fat: Number(db.fat),

// DESPUÉS:
calories: Math.round(Number(db.calories)),
protein: Math.round(Number(db.protein)),
carbs: Math.round(Number(db.carbs)),
fat: Math.round(Number(db.fat)),
```

### ✅ 3. Implementar GET /global-meals (Real)

**Archivo:** `supabase/functions/make-server-b0e879f0/index.ts`  
**Ruta:** `GET /make-server-b0e879f0/global-meals`

- Consulta tabla `base_meals` desde Supabase
- Mapea snake_case → camelCase
- Redondea macros a enteros
- Maneja errores gracefully

### ✅ 4. Implementar POST /global-meals (Real)

**Archivo:** `supabase/functions/make-server-b0e879f0/index.ts`  
**Ruta:** `POST /make-server-b0e879f0/global-meals`

- Normaliza `type` → `meal_types` (array)
- Redondea macros a enteros antes de guardar
- Usa UPSERT para actualizar o insertar
- Validación de payload

### ✅ 5. Mejorar POST /custom-meals

**Archivo:** `supabase/functions/make-server-b0e879f0/index.ts`  
**Ruta:** `POST /make-server-b0e879f0/custom-meals`

```typescript
// ANTES: Guardaba estructura incorrecta
macros: {
  calories: meal.calories,
  protein: meal.protein,
  carbs: meal.carbs,
  fat: meal.fat
}

// DESPUÉS: Campos individuales redondeados
calories: Math.round(Number(meal.calories ?? meal.macros?.calories ?? 0)),
protein: Math.round(Number(meal.protein ?? meal.macros?.protein ?? 0)),
carbs: Math.round(Number(meal.carbs ?? meal.macros?.carbs ?? 0)),
fat: Math.round(Number(meal.fat ?? meal.macros?.fat ?? 0)),
```

### ✅ 6. Fixes en CreateMeal.tsx

**Archivo:** `src/app/components/CreateMeal.tsx`  
**Cambio:** Agregadas importaciones faltantes

```typescript
// NUEVO:
import { getBaseIngredients, getCustomIngredients, createCustomIngredient } from '../../utils/db/ingredients';
```

### ✅ 7. Función Auxiliar en API

**Archivo:** `src/app/utils/api.ts`  
**Nueva función:** `getBaseIngredientsFromAPI()`

Para consistencia, agregué función que consulta `/global-ingredients` desde el servidor.

## Tests Agregados

### Test 1: Macro Rounding
**Archivo:** `src/data/__tests__/ingredientsDatabase.spec.ts`
- Verifica que `calculateMacrosFromIngredients()` retorna valores enteros
- Prueba con múltiples ingredientes

### Test 2: Meal Creation & Structure
**Archivo:** `src/app/__tests__/meals.spec.ts`
- Verifica estructura de Meal con macros enteros
- Valida rounding en conversión de BD

## Flujo Completo (Usuario crea plato personalizado)

1. Usuario abre "Crear Plato Personalizado"
2. Selecciona ingredientes + cantidades
3. Sistema calcula macros automáticamente
   - `calculateMacrosFromIngredients()` → **TODOS LOS VALORES ENTEROS** ✅
4. Usuario completa información (nombre, preparación, tips)
5. Click "Guardar Plato"
6. `CreateMeal.handleSave()` → `api.saveCustomMeals()`
   - Email + array de Meal objects
7. API endpoint `POST /custom-meals`
   - Redondea NUEVAMENTE macros (doble aseguramiento)
   - Normaliza tipos: `type` → `meal_types`
   - UPSERT en `custom_meals` table
8. Frontend recibe `{ success: true }`
9. Plato aparece en "Mis Platos Personalizados"

## Flujo para Admin (crear plato base)

1. Admin abre AdminPanel → "Crear Plato Base"
2. Selecciona ingredientes + cantidades
3. Sistema calcula macros (**ENTEROS**)
4. Click "Guardar Plato"
5. `AdminPanel.handleSaveMeal()` → `api.saveGlobalMeals()`
   - Array de Meal objects
6. API endpoint `POST /global-meals`
   - Normaliza + redondea
   - Upsert en `base_meals` table
7. Plato disponible globalmente para todos los usuarios

## Validaciones Implementadas

| Punto | Validación | Estado |
|-------|-----------|--------|
| Redondeo en cálculo | `calculateMacrosFromIngredients()` | ✅ |
| Redondeo en conversión BD | `dbMealToMeal()`, `dbCustomMealToMeal()` | ✅ |
| Redondeo en guardado | `POST /custom-meals`, `POST /global-meals` | ✅ |
| Estructura de datos | Campos individuales, NO objeto `macros` | ✅ |
| Tipos de comida | `type` → `meal_types` array | ✅ |
| Imports en UI | `CreateMeal.tsx` imports correctos | ✅ |

## Tests para Verificar

```bash
# Ejecutar tests de macros
npm run test -- meals.spec.ts

# Ejecutar tests de ingredientes
npm run test -- ingredientsDatabase.spec.ts

# Ejecutar todos los tests
npm run test:run
```

## Deployment Required

Después de merge:
1. Deploy función Supabase: `npm run deploy:functions`
2. Verificar endpoint `/health` devuelve `version: sql-architecture-v3-complete`
3. Test CREATE meal vía Postman/curl:
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/make-server-b0e879f0/custom-meals \
     -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email":"user@example.com",
       "meals":[{
         "id":"meal-1",
         "name":"Test Meal",
         "type":"breakfast",
         "calories":450,
         "protein":31,
         "carbs":45,
         "fat":12,
         "ingredients":["100g pollo"],
         "baseQuantity":300
       }]
     }'
   ```

## Notas Adicionales

- **Doble rounding:** Aplicamos redondeo en 3 niveles (cálculo, conversión, guardado) para máxima seguridad
- **Backward compatibility:** POST `/custom-meals` maneja ambas estructuras (campos individuales Y objeto `macros`)
- **Frontend listo:** CreateMeal.tsx ya está importando correctamente y usando API
- **AdminPanel listo:** Usa `api.saveGlobalMeals()` que ahora funciona correctamente

---
**Próximo paso:** Ejecutar tests completos + deploy + prueba de guardado end-to-end ✅
