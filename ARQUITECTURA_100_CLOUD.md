# 🌩️ ARQUITECTURA 100% CLOUD - FUELIER

## ✅ Estado: COMPLETADO

La aplicación FUELIER ahora funciona 100% desde la nube. Todos los datos de ingredientes y platos vienen de **Supabase**, no de datos hardcodeados locales.

---

## 📊 Fuentes de Datos

### Ingredientes
| Fuente | Tabla/Función | Descripción |
|--------|---------------|-------------|
| Ingredientes Globales | `base_ingredients` | 118 ingredientes con macros reales del sistema |
| Ingredientes Personalizados | `custom_ingredients` | Ingredientes creados por cada usuario |ì``ì

### Platos
| Fuente | Tabla/Función | Descripción |
|--------|---------------|-------------|
| Platos Globales | `global_meals` | Platos creados por admin |````ì`
| Platos Personalizados | `custom_meals` | Platos creados por cada usuario |

---

## 📁 Archivos Migrados

### Core Files (100% Cloud)

| Archivo | Estado | Cambios |
|---------|--------|---------|
| `ingredientTypes.ts` | ✅ NUEVO | Interfaces y funciones cloud-only |
| `mealMigration.ts` | ✅ MIGRADO | Recibe `allIngredients` como parámetro |
| `intelligentMealScaling.ts` | ✅ MIGRADO | Recibe `allIngredients` como parámetro |
| `scaleIngredients.ts` | ✅ MIGRADO | Recibe `allIngredients` como parámetro |
| `MealSelection.tsx` | ✅ MIGRADO | Carga ingredientes de Supabase |
| `MealDetail.tsx` | ✅ MIGRADO | Carga ingredientes de Supabase |
| `CreateMeal.tsx` | ✅ MIGRADO | Usa ingredientes de Supabase |
| `AdminPanel.tsx` | ✅ MIGRADO | Usa ingredientes de Supabase |
| `IngredientEditor.tsx` | ✅ MIGRADO | Recibe `allIngredients` como prop |

### Archivos Legacy (Solo Fallback)

| Archivo | Estado | Uso |
|---------|--------|-----|
| `ingredientsDatabase.ts` | 📦 LEGACY | Solo para `mealsWithIngredients.ts` fallback |
| `mealsWithIngredients.ts` | 📦 LEGACY | Platos hardcodeados de fallback |

---

## 🔧 API Endpoints

### GET `/global-ingredients`
```typescript
// Retorna 118 ingredientes con macros reales
await api.getGlobalIngredients();
```

### GET `/custom-ingredients?email=user@example.com`
```typescript
// Retorna ingredientes personalizados del usuario
await api.getCustomIngredients(userEmail);
```

### POST `/custom-ingredients`
```typescript
// Crea un nuevo ingrediente personalizado
await api.createCustomIngredient(ingredient);
```

---

## 🔄 Flujo de Datos

```
┌─────────────────┐     ┌─────────────────┐
│   SUPABASE      │     │   FRONTEND      │
├─────────────────┤     ├─────────────────┤
│ base_ingredients│────▶│ globalIngredients│
│ custom_ingredients│──▶│ customIngredients│
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ ingredientsFromSupabase│
                      │ (combina ambos)     │
                      └────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ rankMealsByFit│ │migrateMeals │  │calculateMacros│
    └─────────────┘   └─────────────┘   └─────────────┘
```

---

## ⚡ Funciones Cloud-Only

Las siguientes funciones ahora requieren `allIngredients` como parámetro:

```typescript
// ingredientTypes.ts
getIngredientById(id, allIngredients)
calculateMacrosFromIngredients(refs, allIngredients)

// mealMigration.ts
migrateMealsToStructured(meals, allIngredients)
migrateMealToStructured(meal, allIngredients)

// intelligentMealScaling.ts
scaleToExactTarget(meal, targetMacros, isLastMeal, allIngredients)
rankMealsByFit(meals, user, currentLog, mealType, targetMacros, allIngredients)

// scaleIngredients.ts
scaleIngredientsForMeal(meal, multiplier, allIngredients)
scaleMealWithIngredients(meal, multiplier, allIngredients)
```

---

## 🚀 Beneficios

1. **Sin Datos Hardcodeados**: Los macros de ingredientes se pueden actualizar en la BD sin redeploy
2. **Ingredientes Personalizados**: Los usuarios pueden crear ingredientes que solo ellos ven
3. **Escalabilidad**: Los datos están centralizados en Supabase
4. **Consistencia**: Todos los componentes usan la misma fuente de datos

---

## 📝 Notas

- El archivo `ingredientsDatabase.ts` se mantiene solo para compatibilidad con tests y fallback
- Los 118 ingredientes globales ya están sincronizados en Supabase con macros reales
- El deploy del frontend requiere `npx vercel --prod` después de estos cambios
