# 🤖 ESTRATEGIA DE SINCRONIZACIÓN AUTOMÁTICA INCREMENTAL

## 🎯 OBJETIVO
Sincronizar los 3 archivos grandes restantes usando IA de forma incremental y segura.

---

## 📋 PLAN DE EJECUCIÓN

### FASE 1: Backend Index.ts (CRÍTICO) ⏱️ 15-20 min
**Archivo:** `/supabase/functions/make-server-b0e879f0/index.ts` (57 KB, ~1400 líneas)

#### Estrategia:
1. **Leer archivo actual** completo en Figma Make (por secciones)
2. **Obtener diff del commit** de GitHub para identificar cambios exactos
3. **Aplicar cambios incrementales** usando fast_apply_tool
4. **Verificar** después de cada cambio

#### Cambios críticos a aplicar:
- ✅ Training Plan endpoints (POST /training-plan)
- ✅ Mapeo day_plan_index y day_plan_name
- ✅ Middleware de auth ES256/HS256
- ✅ Endpoints global-meals/ingredients
- ✅ Custom meals con mapeo meal_types → type

#### Método:
- División en 5-7 bloques lógicos
- Aplicar cambios uno por uno
- Verificar sintaxis después de cada bloque

---

### FASE 2: API Frontend ⏱️ 10-15 min
**Archivo:** `/src/app/utils/api.ts` (42 KB, ~1200 líneas)

#### Estrategia:
1. **Leer archivo actual** por secciones
2. **Identificar funciones a actualizar**
3. **Aplicar cambios incrementales**

#### Cambios críticos:
- ✅ getGlobalMeals(), getGlobalIngredients()
- ✅ getCustomMeals() con mapeo meal_types → type
- ✅ getTrainingPlan(), saveTrainingPlan()
- ✅ updateTrainingDay(), deleteTrainingDay()

#### Método:
- División en 4-6 bloques de funciones
- Actualizar función por función
- Mantener estructura existente

---

### FASE 3: App.tsx ⏱️ 10-15 min
**Archivo:** `/src/app/App.tsx` (66 KB, ~1800 líneas)

#### Estrategia:
1. **Leer secciones clave** (recoverSession, auth)
2. **Aplicar cambios puntuales**
3. **Verificar imports y exports**

#### Cambios críticos:
- ✅ Auto-detección tokens ES256 en recoverSession()
- ✅ Forzar signOut si token es ES256
- ✅ Actualizar imports si es necesario

#### Método:
- Cambios quirúrgicos en funciones específicas
- No reescribir todo el archivo
- Solo tocar lo necesario

---

## 🔧 HERRAMIENTAS A USAR

### 1. Lectura de archivos
```
read → Para ver archivo actual en secciones
```

### 2. Obtener información de GitHub
```
call_mcp_tool → Para obtener diffs del commit
```

### 3. Aplicar cambios
```
fast_apply_tool → Para ediciones incrementales (PREFERIDO)
edit_tool → Solo si fast_apply_tool falla
```

### 4. Verificación
```
file_search → Buscar patrones específicos
read → Verificar cambios aplicados
```

---

## 📊 PROGRESO ESTIMADO

```
FASE 1: Backend index.ts
├─ Bloque 1: Imports y setup           [████░░░░] 10 min
├─ Bloque 2: Auth middleware           [████░░░░] 10 min
├─ Bloque 3: Training endpoints        [████░░░░] 15 min
├─ Bloque 4: Custom meals endpoints    [████░░░░] 10 min
└─ Bloque 5: Global meals/ingredients  [████░░░░] 10 min
                                       TOTAL: ~15-20 min

FASE 2: API Frontend
├─ Bloque 1: Training functions        [████░░░░] 10 min
├─ Bloque 2: Custom meals functions    [████░░░░] 8 min
└─ Bloque 3: Global functions          [████░░░░] 7 min
                                       TOTAL: ~10-15 min

FASE 3: App.tsx
├─ Bloque 1: recoverSession update     [████░░░░] 8 min
└─ Bloque 2: Imports verification      [████░░░░] 5 min
                                       TOTAL: ~10-15 min

═══════════════════════════════════════════════════════
TIEMPO TOTAL ESTIMADO: 35-50 minutos
```

---

## ✅ CRITERIOS DE ÉXITO

### Para cada archivo:
- ✅ Sintaxis válida (sin errores TypeScript)
- ✅ Imports correctos
- ✅ Funciones actualizadas según commit
- ✅ Compatibilidad con archivos ya sincronizados

### Para backend index.ts:
- ✅ Health check responde correctamente
- ✅ Endpoints de training-plan funcionan
- ✅ Middleware de auth detecta ES256

### Para api.ts:
- ✅ Funciones exportadas correctamente
- ✅ Tipos coinciden con types.ts sincronizado
- ✅ Mapeos de meal_types correctos

### Para App.tsx:
- ✅ recoverSession detecta ES256
- ✅ signOut automático funciona
- ✅ App renderiza sin errores

---

## 🛡️ ESTRATEGIA DE SEGURIDAD

### Backups automáticos:
Antes de cada cambio mayor, el sistema mantiene versión anterior

### Rollback:
Si un cambio causa error, revertir al estado anterior

### Validación incremental:
Después de cada bloque, verificar que el código es válido

### Checkpoints:
Guardar estado después de cada fase completada

---

## 🚀 VENTAJAS DE ESTE MÉTODO

✅ **Seguro:** Cambios incrementales, fácil de revertir
✅ **Trazable:** Cada cambio documentado
✅ **Verificable:** Validación después de cada paso
✅ **Completo:** Sincronización 100% sin intervención manual
✅ **Rápido:** 35-50 minutos vs. 15 minutos manual (pero automatizado)

---

## 📝 REGISTRO DE PROGRESO

### Estado Inicial:
- Backend index.ts: ⏳ Pendiente
- API api.ts: ⏳ Pendiente  
- App App.tsx: ⏳ Pendiente

### Análisis Completado (Backend index.ts):
✅ Training Plan endpoints: **YA EXISTEN** (líneas 483-548)
✅ day_plan_index y day_plan_name: **YA MAPEADOS** (líneas 799-830)
✅ Global meals endpoints: **YA EXISTEN** (líneas 557-645)
✅ Global ingredients endpoints: **YA EXISTEN** (líneas 647-710)
✅ Training completed mapping: **CORRECTO**

❌ Custom meals GET mapeo meal_types → type: **FALTA** (línea 374-380)
❌ Middleware ES256/HS256: **NO EXISTE**

### Cambios reales necesarios en backend:
1. Agregar mapeo meal_types → type en GET /custom-meals
2. Agregar middleware de validación de tokens ES256/HS256

**Prioridad:** BAJA - El backend está 95% sincronizado

### Actualización en tiempo real:
Se irá actualizando a medida que avanza la sincronización.

---

## 🎯 SIGUIENTE PASO

**Iniciar FASE 1:** Sincronización de backend index.ts

Comando para iniciar:
```
Confirmar inicio de sincronización automática
```

---

_Estrategia creada: 26 de enero de 2026_  
_Método: Sincronización incremental asistida por IA_