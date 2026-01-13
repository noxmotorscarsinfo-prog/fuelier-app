# 🚨 DIAGNÓSTICO: Ingredientes No Encontrados

## Problema Crítico Identificado

Los logs muestran:
```
⚠️ Ingrediente no encontrado: pavo-pechuga
⚠️ Ingrediente no encontrado: quinoa
⚠️ Ingrediente no encontrado: pimiento
⚠️ Ingrediente no encontrado: cebolla
⚠️ Ingrediente no encontrado: espinacas
⚠️ Ingrediente no encontrado: aceite-oliva
```

Y también:
```
🔢 Ingredientes optimizados (61 iteraciones, error máx: 544.44%):
   huevos: 180g → 334g (+154g)
```

## Análisis Técnico

### 1. El Algoritmo Funciona Correctamente ✅
- Se ejecuta `scaleToExactTarget()` 
- Se llama a `findOptimalMultiplier()`
- Se ejecutan 61 iteraciones
- Se encuentra un multiplicador (1.856x para la tortilla)

### 2. El Problema: `allIngredients` está VACÍO ❌

Cuando el sistema intenta buscar los ingredientes:
```typescript
const ingredient = getIngredientById(ref.ingredientId, allIngredients);
if (!ingredient) {
  console.warn(`Ingrediente no encontrado: ${ref.ingredientId}`);
  continue; // ⚠️ SALTA sin calcular macros
}
```

**Resultado**: `allIngredients` no contiene los ingredientes globales.

### 3. Causa Raíz

Revisando el código:

**MealSelection.tsx** (líneas 60-62):
```typescript
const baseIngredients = await api.getGlobalIngredients();
console.log(`✅ Cargados ${baseIngredients.length} ingredientes globales`);
setGlobalIngredients(baseIngredients);
```

**MealSelection.tsx** (líneas 78-80):
```typescript
const ingredientsFromSupabase = useMemo(() => {
  return [...globalIngredients, ...customIngredients];
}, [globalIngredients, customIngredients]);
```

**MealSelection.tsx** (línea 392):
```typescript
const rankedMeals = rankMealsByFit(
  mealsOfType, 
  user, 
  currentLog, 
  mealType,
  intelligentTarget,
  ingredientsFromSupabase  // ⬅️ DEBERÍA contener los ingredientes
);
```

### 4. Verificación Necesaria

**¿Los ingredientes globales están en Supabase?**

Los logs del usuario NO muestran:
```
✅ Cargados X ingredientes globales
```

Solo vemos:
```
✅ Cargados 0 ingredientes personalizados para filtro
```

## Soluciones

### Opción A: Verificar si los ingredientes están en Supabase (URGENTE)

```sql
-- Ejecutar en Supabase SQL Editor
SELECT COUNT(*) FROM base_ingredients;
SELECT id, name FROM base_ingredients LIMIT 20;
```

Si la tabla está **vacía**:

### Opción B: Insertar los ingredientes globales en Supabase

```sql
-- Ejecutar la migración completa de ingredientes
-- Ver: FUELIER_MIGRACION_COMPLETA.sql
```

O desde el código (si eres admin):

```typescript
// En la consola del navegador (F12)
import { INGREDIENTS_DATABASE } from './src/data/ingredientsDatabase';
import * as api from './src/app/utils/api';

// Guardar todos los ingredientes globales
await api.saveGlobalIngredients(INGREDIENTS_DATABASE);
```

### Opción C: Añadir logging para confirmar

Añadir log en `MealSelection.tsx` después de cargar ingredientes:

```typescript
useEffect(() => {
  const loadIngredients = async () => {
    try {
      const baseIngredients = await api.getGlobalIngredients();
      console.log(`✅ Cargados ${baseIngredients.length} ingredientes globales`);
      console.log('🔍 Primeros 5 ingredientes:', baseIngredients.slice(0, 5).map(i => i.id));
      setGlobalIngredients(baseIngredients);
      
      if (user.email) {
        const userIngredients = await api.getCustomIngredients(user.email);
        console.log(`✅ Cargados ${userIngredients.length} ingredientes personalizados`);
        setCustomIngredients(userIngredients);
      }
      
      // 🆕 LOG CRÍTICO
      const combined = [...baseIngredients, ...(user.email ? userIngredients : [])];
      console.log(`📊 TOTAL INGREDIENTES DISPONIBLES: ${combined.length}`);
      console.log('🔍 Incluye "pavo-pechuga"?', combined.find(i => i.id === 'pavo-pechuga') ? '✅ SÍ' : '❌ NO');
      
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
    }
  };
  loadIngredients();
}, [user.email]);
```

## Próximos Pasos

1. **URGENTE**: Verifica si `base_ingredients` tiene datos en Supabase
2. Si está vacía: Ejecuta la migración SQL o usa `saveGlobalIngredients()`
3. Si tiene datos: Verifica que el endpoint `/global-ingredients` funciona correctamente
4. Añade logging para confirmar cuántos ingredientes se cargan en el frontend

## Evidencia del Problema

### Logs del Usuario (Producción)
```
⚠️ Ingrediente no encontrado: pavo-pechuga
⚠️ Ingrediente no encontrado: quinoa
...
│  📊 Calorías:  587/863 kcal (68.0%)                         │
│  💪 Proteína:  69/87g (79.3%)                               │
│  🍚 Carbos:    43/102g (42.2%)                              │
│  🥑 Grasas:    15/9g (166.7%)                               │
│  ⭐ Completitud mínima:   42.2%                              │
│  📊 Completitud promedio: 89.0%                             │
│  ⚠️ Error máximo:         66.7%                             │
```

### Resultado Final
```
│  DIFERENCIA (Consumido - Objetivo):                 │
│  • Calorías:  -276 kcal                             │
│  • Proteína:  -18.0g                                │
│  • Carbos:    -59.0g                                │
│  • Grasas:    +6.0g                                 │
```

**El sistema debería haber alcanzado 100% exacto en la última comida, pero solo llegó al 68% de calorías y 42% de carbos** porque los ingredientes no se encontraron y no se pudieron escalar correctamente.
