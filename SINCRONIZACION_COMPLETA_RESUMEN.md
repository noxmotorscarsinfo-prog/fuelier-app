# 🎯 SINCRONIZACIÓN COMPLETA FIGMA MAKE ↔️ GITHUB

## ✅ ARCHIVOS COMPLETAMENTE SINCRONIZADOS (100%)

### 1. Tipos y Configuración Core
- ✅ `/src/app/types.ts` - Tipos TypeScript actualizados con training system completo
- ✅ `/src/utils/supabaseClient.ts` - Cliente Supabase singleton con todos los tipos de BD
- ✅ `/src/utils/supabase/client.ts` - Re-exportación del cliente singleton
- ✅ `/src/main.tsx` - Punto de entrada de la aplicación
- ✅ `/vite.config.ts` - Configuración de Vite con Tailwind v4
- ✅ `/package.json` - Dependencias y scripts actualizados

### 2. Datos e Ingredientes
- ✅ `/src/app/data/ingredients.ts` - Base de datos de ingredientes (62 items)
- ✅ `/src/app/data/meals.ts` - Exportador de comidas
- ✅ `/src/data/ingredientsDatabase.ts` - Base de datos extendida de ingredientes

### 3. Scripts de Sincronización
- ✅ `/scripts/sync-ingredients.js` - Sincronizar ingredientes con Supabase
- ✅ `/scripts/verify-macros.js` - Verificar macros de platos
- ✅ `/scripts/recalculate-meals.js` - Recalcular macros de todos los platos

## ⚠️ ARCHIVOS GRANDES PENDIENTES (Requieren sincronización manual)

Estos archivos son demasiado grandes (>40KB) para ser descargados por GitHub MCP. Debes sincronizarlos manualmente:

### 🔴 CRÍTICO 1: Backend Index.ts
**Archivo:** `/supabase/functions/make-server-b0e879f0/index.ts`  
**Tamaño:** 57 KB (~1400 líneas)  
**Importancia:** MÁXIMA - Contiene todas las correcciones del training dashboard

**URL Directa:**
```
https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts
```

**Qué contiene:**
- ✅ Endpoints `/training-plan` actualizados con day_plan_index y day_plan_name
- ✅ Soporte para crear/actualizar/eliminar días de entrenamiento
- ✅ Endpoints de `/global-meals` y `/global-ingredients`
- ✅ Validación de tokens ES256/HS256
- ✅ Middleware de autenticación mejorado

### 🔴 CRÍTICO 2: API Frontend
**Archivo:** `/src/app/utils/api.ts`  
**Tamaño:** 42 KB (~1200 líneas)  
**Importancia:** ALTA - Contiene todas las llamadas API del frontend

**URL Directa:**
```
https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/utils/api.ts
```

**Qué contiene:**
- ✅ `getGlobalMeals()` - Obtener platos globales desde Supabase
- ✅ `getGlobalIngredients()` - Obtener ingredientes globales
- ✅ `getCustomMeals()` - Con mapeo correcto meal_types → type
- ✅ `getTrainingPlan()` - Obtener plan de entrenamiento con day_plan_index
- ✅ `saveTrainingPlan()` - Guardar plan de entrenamiento
- ✅ Todas las funciones de autenticación actualizadas

### 🔴 CRÍTICO 3: Componente Principal App.tsx
**Archivo:** `/src/app/App.tsx`  
**Tamaño:** 66 KB (~1800 líneas)  
**Importancia:** ALTA - Componente raíz de la aplicación

**URL Directa:**
```
https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/App.tsx
```

**Qué contiene:**
- ✅ Auto-detección de tokens ES256 en `recoverSession()`
- ✅ Forzar signOut automático si token es ES256
- ✅ Sistema de routing completo
- ✅ Gestión de estado global del usuario
- ✅ Integración con todos los componentes

## 📋 INSTRUCCIONES DE SINCRONIZACIÓN MANUAL

### Opción A: Copiar desde GitHub Web (MÁS FÁCIL)

1. **Backend index.ts:**
   ```
   1. Abre en GitHub: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/supabase/functions/make-server-b0e879f0/index.ts
   2. Haz clic en "Raw" (arriba a la derecha)
   3. Selecciona todo (Ctrl+A / Cmd+A)
   4. Copia (Ctrl+C / Cmd+C)
   5. Pega en Figma Make: /supabase/functions/make-server-b0e879f0/index.ts
   ```

2. **API Frontend:**
   ```
   1. Abre en GitHub: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/src/app/utils/api.ts
   2. Haz clic en "Raw"
   3. Selecciona todo y copia
   4. Pega en Figma Make: /src/app/utils/api.ts
   ```

3. **App.tsx:**
   ```
   1. Abre en GitHub: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/src/app/App.tsx
   2. Haz clic en "Raw"
   3. Selecciona todo y copia
   4. Pega en Figma Make: /src/app/App.tsx
   ```

### Opción B: Descargar con Script Node.js

Guarda este código como `download-large-files.js` y ejecútalo con Node.js:

```javascript
const fs = require('fs');
const https = require('https');

const files = [
  {
    url: 'https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts',
    dest: 'backend-index.ts'
  },
  {
    url: 'https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/utils/api.ts',
    dest: 'frontend-api.ts'
  },
  {
    url: 'https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/App.tsx',
    dest: 'App.tsx'
  }
];

files.forEach(file => {
  https.get(file.url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(file.dest, data);
      console.log(`✅ Descargado: ${file.dest} (${data.length} bytes)`);
    });
  });
});
```

Ejecutar:
```bash
node download-large-files.js
```

Luego copia los 3 archivos descargados a sus ubicaciones correspondientes en Figma Make.

## 🎯 INFORMACIÓN DEL COMMIT

**Commit SHA:** `21aee42332e269a75b8fdfe9feb282f2a2e6d248`  
**Fecha:** 16 de enero de 2026, 20:08:40 UTC  
**Autor:** Joan Pinto <noxmotorscarsinfo@gmail.com>  
**Mensaje:** "Fix CRÍTICO: Mapear meal_types de BD a type en frontend"

**Cambios incluidos:**
- ✅ Mapeo meal_types → type en custom meals
- ✅ Soporte completo day_plan_index y day_plan_name
- ✅ Auto-detección y rechazo tokens ES256
- ✅ Endpoints global-meals/ingredients funcionando
- ✅ Tests 100% pasados (4/4)

## 📊 RESUMEN DE ESTADO

### Archivos Sincronizados: 9/12 (75%)
- ✅ types.ts
- ✅ supabaseClient.ts  
- ✅ supabase/client.ts
- ✅ main.tsx
- ✅ vite.config.ts
- ✅ package.json
- ✅ ingredients.ts (x2)
- ✅ meals.ts
- ❌ index.ts (backend) - PENDIENTE
- ❌ api.ts - PENDIENTE
- ❌ App.tsx - PENDIENTE

### Scripts Sincronizados: 3/3 (100%)
- ✅ sync-ingredients.js
- ✅ verify-macros.js
- ✅ recalculate-meals.js

## 🚀 SIGUIENTE PASO DESPUÉS DE SINCRONIZAR

Una vez que hayas copiado manualmente los 3 archivos grandes pendientes:

### 1. Verificar la sincronización
```bash
# En terminal de Figma Make o VS Code
git status
git diff
```

### 2. Hacer DEPLOY del backend
```bash
# Desde VS Code con Supabase CLI
cd /path/to/project
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

### 3. Verificar que funciona
```bash
# Probar el health check
curl https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health
```

Deberías ver:
```json
{
  "status": "ok",
  "version": "sql-architecture-v3-complete",
  "timestamp": "2026-01-26T...",
  "endpoints": [...]
}
```

### 4. Probar el dashboard de entrenamiento
1. Abre la app en el navegador
2. Ve a "Entrenamiento"
3. Verifica que `dayPlanIndex` y `dayPlanName` ya NO son null
4. Crea un nuevo día de entrenamiento
5. Verifica que se guarda correctamente con los campos actualizados

## ✨ RESULTADO FINAL

Después de completar estos pasos:
- ✅ Entorno de Figma Make 100% sincronizado con GitHub
- ✅ Backend desplegado con todas las correcciones
- ✅ Dashboard de entrenamiento funcionando perfectamente
- ✅ day_plan_index y day_plan_name guardándose correctamente
- ✅ Sistema listo para continuar desarrollo

## 🆘 SOPORTE

Si tienes problemas con algún archivo:
1. Verifica que estás usando el commit correcto: `21aee42...`
2. Asegúrate de copiar el contenido COMPLETO (desde la primera línea hasta la última)
3. Verifica que no hay errores de sintaxis después de pegar
4. Comprueba que las rutas de los archivos son correctas

---

**Estado:** En progreso - 9/12 archivos sincronizados (75%)  
**Prioridad:** Alta - 3 archivos críticos pendientes  
**Tiempo estimado:** 10-15 minutos para sincronización manual completa
