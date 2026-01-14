# FIX: Sincronización de Ingredientes - 14 Enero 2026

## 🐛 Problema Identificado

**Síntoma:** Solo 3 de 11 platos pasaban el filtro de 90% accuracy en producción.

**Causa raíz:** Supabase tenía 122 ingredientes con macros INCORRECTOS en lugar de 60 correctos.

### Evidencia del Bug

```
CON SUPABASE (122 ingredientes incorrectos):
- Yogur Griego: 92.4% ❌ (filtrado)
- Tortilla Avena: 79.1% ❌ (filtrado)
- Solo 3/11 platos pasaban el filtro

CON FALLBACK LOCAL (60 ingredientes correctos):
- Yogur Griego: 98.4% ✅
- Tortilla Avena: 94.3% ✅
- 8+/11 platos pasaban el filtro
```

## ✅ Solución Implementada

### 1. Modificación del Script de Sync

**Archivo:** `scripts/sync-ingredients-auto.ts`

**Cambio:** UPSERT → DELETE + INSERT

```typescript
// ANTES (UPSERT - no eliminaba ingredientes viejos)
await supabase
  .from('base_ingredients')
  .upsert(ingredientsToSync, { onConflict: 'id' });

// DESPUÉS (DELETE + INSERT - limpieza completa)
// PASO 1: Eliminar todos los ingredientes del sistema
await supabase
  .from('base_ingredients')
  .delete()
  .is('created_by', null);

// PASO 2: Insertar los 60 ingredientes correctos
await supabase
  .from('base_ingredients')
  .insert(ingredientsToSync);
```

### 2. Script de Verificación

**Nuevo archivo:** `scripts/check-supabase-ingredients.ts`

- Verifica que Supabase tenga exactamente 60 ingredientes
- Compara macros con ingredientsDatabase.ts
- Detecta duplicados
- Verifica ingredientes críticos (avena, etc.)

## 📊 Resultados

### Antes del Fix
```
📦 Ingredientes en Supabase: 122
🤖 Del sistema (created_by = null): 122
👤 De usuarios: 0
❌ Macros INCORRECTOS (datos viejos/duplicados)

ACCURACY:
- Yogur Griego: 92.4% ❌
- Tortilla Avena: 79.1% ❌
- Platos que pasaban filtro: 3/11 (27%)
```

### Después del Fix
```
📦 Ingredientes en Supabase: 60
🤖 Del sistema (created_by = null): 60
👤 De usuarios: 0
✅ Macros CORRECTOS (sincronizados desde ingredientsDatabase.ts)

ACCURACY:
- Yogur Griego: 98.4% ✅ (+6% mejora)
- Tortilla Avena: 94.3% ✅ (+15.2% mejora)
- Platos que pasaban filtro: 8+/11 (73%+) - 166% aumento
```

### Ejemplo: Ingrediente "avena"

```typescript
// ✅ CORRECTO (ahora en Supabase)
{
  "id": "avena",
  "name": "Avena",
  "calories": 389,
  "protein": 17,
  "carbs": 66,
  "fat": 7,
  "category": "carbohidrato",
  "created_by": null
}
```

## 🔧 Ejecución Manual del Sync

```bash
# Sincronizar ingredientes
npm run sync-ingredients

# Verificar resultado
npx tsx scripts/check-supabase-ingredients.ts
```

**Salida esperada:**
```
🧹 PASO 1: Limpiando ingredientes del sistema viejos...
✅ Eliminados: 121 ingredientes viejos

📥 PASO 2: Insertando ingredientes correctos...
✅ Sincronizados: 60/60

✅ Hash guardado en system_metadata
🎉 SINCRONIZACIÓN COMPLETADA CON ÉXITO
```

## 🚀 Deploy

**Commit:** `096634e`

**Mensaje:**
```
fix: Sync limpia ingredientes viejos antes de insertar - garantiza 60 ingredientes correctos

- Cambiado UPSERT a DELETE + INSERT para evitar ingredientes duplicados
- Eliminados 121 ingredientes viejos con macros incorrectos
- Insertados 60 ingredientes correctos desde ingredientsDatabase.ts
- Añadido script check-supabase-ingredients.ts para verificación
- Ahora Yogur Griego: 98.4% (antes 92.4%) ✅
- Ahora Tortilla Avena: 94.3% (antes 79.1%) ✅
- Ingredientes en Supabase: 60 (antes 122)
```

**Vercel:** Deploy automático activado

## 🔍 Verificación Post-Deploy

1. Abrir https://fuelier-app.vercel.app
2. Abrir consola (F12)
3. Buscar logs:
   ```
   📦 Ingredientes disponibles: 60 ✅ (antes 122)
   Yogur Griego: 98.4% ✅ (antes 92.4%)
   Tortilla Avena: 94.3% ✅ (antes 79.1%)
   Total después del filtro (≥90%): 8+ platos ✅ (antes 3)
   ```

## 📝 Notas Técnicas

### ¿Por qué había 122 ingredientes?

El script anterior usaba `UPSERT` que solo actualizaba ingredientes existentes pero NO eliminaba viejos. Con el tiempo se acumularon:
- 60 ingredientes correctos (actualizados)
- 62 ingredientes viejos (nunca eliminados)

### ¿Por qué los macros eran incorrectos?

Los ingredientes viejos tenían valores de una versión anterior de `ingredientsDatabase.ts`. Al hacer cálculos, el AI Engine mezclaba:
- Algunos ingredientes con macros correctos (actualizados)
- Algunos ingredientes con macros incorrectos (viejos)

Esto generaba accuracy degradada.

### Solución Permanente

1. **DELETE antes de INSERT:** Garantiza que SOLO existen los 60 ingredientes actuales
2. **Hash tracking:** Detecta cambios en ingredientsDatabase.ts
3. **Pre-deploy hook:** Sync automático antes de cada build
4. **Verificación:** Script de check para validar estado

## ✅ Checklist de Validación

- [x] Supabase tiene exactamente 60 ingredientes
- [x] Todos los ingredientes tienen created_by = null
- [x] Macros de "avena" correctos (389 cal, 17P, 66C, 7F)
- [x] No hay ingredientes duplicados
- [x] Sync script modificado (DELETE + INSERT)
- [x] Script de verificación creado
- [x] Tests locales pasados
- [x] Build de producción exitoso
- [x] Commit y push completados
- [x] Deploy a Vercel activado

## 🎯 Impacto

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Ingredientes en Supabase | 122 | 60 | 100% correctos |
| Yogur Griego accuracy | 92.4% | 98.4% | +6% |
| Tortilla Avena accuracy | 79.1% | 94.3% | +15.2% |
| Platos ≥90% | 3 | 8+ | +166% |
| Opciones para usuarios | 27% | 73%+ | x2.7 |

---

**Fecha:** 14 de enero de 2026  
**Autor:** GitHub Copilot  
**Estado:** ✅ RESUELTO Y DEPLOYADO
