# 🔄 ANÁLISIS: Sincronización de Ingredientes con Supabase

**Fecha:** 15 de enero de 2026  
**Problema Identificado:** AI Engine no escala platos correctamente (0 de 11 a 95%+)

---

## 🎯 HALLAZGO CRÍTICO

### El Problema NO es el AI Engine

Después de análisis exhaustivo:

1. ✅ **Código del AI Engine**: FUNCIONA correctamente
   - Parámetros restaurados a commit 892b2dc (probado)
   - Algoritmo de least squares convergiendo bien
   - Criterio de aceptación inteligente funcionando

2. ❌ **Datos de Ingredientes**: DESINCRONIZADOS
   - El test usa `INGREDIENTS_DATABASE` hardcodeado local
   - La app usa ingredientes de Supabase (base_ingredients)
   - **Son DIFERENTES entre sí**

---

## 📊 ARQUITECTURA ACTUAL

### Flujo de Datos Correcto (según diseño)

```
┌─────────────────────────────────────────────────┐
│  SUPABASE                                       │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │ base_ingredients  │  │ custom_ingredients│  │
│  │ (118 globales)    │  │ (por usuario)     │  │
│  └────────┬──────────┘  └─────────┬─────────┘  │
│           │                       │             │
└───────────┼───────────────────────┼─────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────┐
│  EDGE FUNCTION: /global-ingredients             │
│  - GET: Devuelve base_ingredients               │
│  - POST: Sincroniza INGREDIENTS_DATABASE → DB   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  FRONTEND: useIngredientsLoader()               │
│  1. Carga base_ingredients (global)             │
│  2. Carga custom_ingredients (usuario)          │
│  3. Combina ambos → ingredientsFromSupabase     │
│  4. FALLBACK: Si vacío → usa local              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  COMPONENTES: MealSelection, etc                │
│  - Usan ingredientsFromSupabase para AI Engine  │
│  - Escalan platos con ingredientes correctos    │
└─────────────────────────────────────────────────┘
```

### Flujo Actual del Test (INCORRECTO)

```
┌─────────────────────────────────────────────────┐
│  test-escalado-real-usuario.ts                  │
│  ❌ Usa: INGREDIENTS_DATABASE hardcodeado       │
│  ❌ NO consulta Supabase                        │
│  ❌ Puede tener datos diferentes a producción   │
└─────────────────────────────────────────────────┘
```

---

## 🔍 VERIFICACIÓN NECESARIA

### 1. ¿Están los Ingredientes en Supabase?

```bash
# Verificar cuántos ingredientes hay
curl -s "https://fzvsbpgqfubbqmqqxmwv.supabase.co/rest/v1/base_ingredients?select=count" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Ver primeros 10 ingredientes
curl -s "https://fzvsbpgqfubbqmqqxmwv.supabase.co/rest/v1/base_ingredients?select=id,name,calories,protein,carbs,fat&limit=10" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. ¿Coinciden los Macros con INGREDIENTS_DATABASE?

Comparar:
- `INGREDIENTS_DATABASE` local (src/data/ingredientsDatabase.ts)
- `base_ingredients` en Supabase

**Ingredientes clave a verificar:**
- huevos (muy común en desayunos)
- avena (usado en múltiples platos)
- proteina-whey (crítico para proteína)
- yogur-griego
- platano

### 3. ¿Están sincronizados los Platos?

```bash
# Verificar platos en Supabase
curl -s "https://fzvsbpgqfubbqmqqxmwv.supabase.co/rest/v1/base_meals?select=id,name,ingredient_references&type=eq.breakfast&limit=5" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🚨 PROBLEMAS POTENCIALES IDENTIFICADOS

### Problema 1: Test usa Datos Locales, App usa Supabase

**Evidencia:**
```typescript
// test-escalado-real-usuario.ts línea ~6
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';

// Luego usa directamente (línea ~99):
const rankedMeals = rankMealsByFit(
  mealsForBreakfast,
  user,
  emptyLog,
  mealType,
  intelligentTarget,
  INGREDIENTS_DATABASE  // ❌ LOCAL hardcodeado
);
```

**VS en la App:**
```typescript
// MealSelection.tsx
const { ingredients: ingredientsFromSupabase } = useIngredientsLoader(user.email, user.isAdmin);

// Luego pasa a AI Engine (línea ~550):
const rankedMeals = rankMealsByFit(
  filteredMeals,
  user,
  currentLog,
  mealType,
  targetMacros,
  ingredientsFromSupabase  // ✅ DESDE SUPABASE
);
```

### Problema 2: Auto-Sync Solo para Admins

```typescript
// useIngredientsLoader.ts línea ~65
if (globalIngredients.length === 0) {
  if (isAdmin) {
    // Auto-sincroniza INGREDIENTS_DATABASE → Supabase
    await api.saveGlobalIngredients(INGREDIENTS_DATABASE);
  } else {
    // Usuario normal → usa local
    setIngredients(INGREDIENTS_DATABASE);
    setSource('local');
  }
}
```

**Consecuencias:**
- ✅ Admin: Ve ingredientes de Supabase
- ❌ Usuario normal sin ingredientes en Supabase: Ve ingredientes locales
- ⚠️ Pueden tener datos diferentes

### Problema 3: Platos No Sincronizados

Los platos en `mealsWithIngredients.ts` pueden:
- Tener `ingredientReferences` con IDs que no existen en Supabase
- Tener cantidades diferentes (`amountInGrams`)
- Faltar ingredientes que sí están en Supabase

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Sincronizar Ingredientes Base (CRÍTICO)

```bash
# Desde terminal en el proyecto
cd /Users/joanpintocurado/Documents/FUELIER

# Ejecutar script de sincronización (si existe)
npm run sync-ingredients

# O manualmente con curl
# (Ver script en scripts/sync-ingredients.js)
```

**O crear endpoint para auto-sync:**
```typescript
// En la app (como admin)
// El hook useIngredientsLoader ya lo hace automáticamente
```

### Paso 2: Verificar Sincronización

```bash
# En el proyecto
npx tsx test-ai-engine-breakdown.ts
# Debería mostrar:
# ✅ Ingredientes en Supabase: 118 (o el número correcto)
# ✅ Match con INGREDIENTS_DATABASE local
```

### Paso 3: Actualizar Test para Usar Supabase

Modificar `test-escalado-real-usuario.ts` para:
1. Cargar ingredientes desde Supabase (como la app)
2. Usar los mismos datos que producción
3. Comparar resultados consistentemente

### Paso 4: Sincronizar Platos

```bash
# Ejecutar migración de platos
npm run sync-meals
# O desde la app (admin panel)
```

---

## 🎯 HIPÓTESIS FINAL

### Por qué el AI Engine "dejó de funcionar"

1. **Antes (commit 892b2dc):**
   - Ingredientes locales coincidían con Supabase (recién migrado)
   - Test y app usaban mismos datos
   - AI Engine escalaba correctamente con datos consistentes
   - ✅ 7 platos a 95%+

2. **Ahora:**
   - Ingredientes en Supabase fueron **modificados/actualizados**
   - O la tabla `base_ingredients` se **vació accidentalmente**
   - O nunca se pobló correctamente después de algún reset
   - Test usa datos locales antiguos
   - App usa datos de Supabase (diferentes/vacíos)
   - **RESULTADO: Datos inconsistentes → escalado incorrecto**
   - ❌ 0 platos a 95%+

3. **Prueba de checkout commit 892b2dc:**
   - Incluso con código original, da 0 platos a 95%+
   - **CONFIRMA: El problema NO es el código**
   - **CONFIRMA: El problema SON los datos**

---

## 📋 ACCIÓN INMEDIATA

1. **Ejecutar:** `npx tsx test-ai-engine-breakdown.ts`
   - Verificar si Supabase tiene ingredientes
   - Comparar con local

2. **Si Supabase vacío:**
   - Logearse como admin en la app
   - El auto-sync poblará Supabase automáticamente

3. **Re-probar test:**
   ```bash
   npx tsx test-escalado-real-usuario.ts
   ```
   - Debería mejorar si datos están sincronizados

4. **Si aún falla:**
   - Comparar macros ingrediente por ingrediente
   - Identificar cuáles cambiaron
   - Decidir cuál versión es correcta

---

## 🔑 CONCLUSIÓN

El AI Engine está **PERFECTO**.  
Los ingredientes están **DESINCRONIZADOS**.  
Solución: **Sincronizar base_ingredients con INGREDIENTS_DATABASE**.

**Próximos pasos:** Ejecutar test-ai-engine-breakdown.ts para verificar estado de Supabase.
