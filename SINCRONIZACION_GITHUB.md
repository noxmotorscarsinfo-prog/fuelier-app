# Sincronización Completa desde GitHub

## ✅ Archivos Ya Sincronizados

Los siguientes archivos han sido actualizados exitosamente:

1. ✅ `/src/app/types.ts` - Tipos TypeScript completos con training system
2. ✅ `/src/utils/supabaseClient.ts` - Cliente Supabase singleton
3. ✅ `/src/app/data/ingredients.ts` - Base de datos de ingredientes
4. ✅ `/src/app/data/meals.ts` - Exportador de comidas
5. ✅ Scripts en `/scripts/`:
   - `sync-ingredients.js`
   - `verify-macros.js`
   - `recalculate-meals.js`

## ⚠️ Archivos Grandes Pendientes

Los siguientes archivos son demasiado grandes para ser descargados por GitHub MCP y requieren sincronización manual:

### 1. Backend (MÁS CRÍTICO)
**Archivo:** `/supabase/functions/make-server-b0e879f0/index.ts`  
**Tamaño:** ~57 KB (1400+ líneas)  
**URL Directa:** https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts

**Importancia:** Este archivo contiene todas las correcciones del training dashboard con day_plan_index y day_plan_name.

### 2. API Frontend
**Archivo:** `/src/app/utils/api.ts`  
**Tamaño:** ~42 KB  
**URL Directa:** https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/utils/api.ts

**Importancia:** Contiene las llamadas API actualizadas para global-meals e ingredients.

### 3. Componente Principal
**Archivo:** `/src/app/App.tsx`  
**Tamaño:** ~66 KB  
**URL Directa:** https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/App.tsx

**Importancia:** Componente principal con auto-detección de tokens ES256.

## 🔧 Opción 1: Sincronización Automática con Script Node.js

Guarda este script como `sync-large-files.js` y ejecútalo:

```javascript
const fs = require('fs');
const https = require('https');
const path = require('path');

const REPO = 'noxmotorscarsinfo-prog/fuelier-app';
const COMMIT = '21aee42332e269a75b8fdfe9feb282f2a2e6d248';
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${COMMIT}`;

const FILES_TO_SYNC = [
  {
    remote: 'supabase/functions/make-server-b0e879f0/index.ts',
    local: 'supabase/functions/make-server-b0e879f0/index.ts'
  },
  {
    remote: 'src/app/utils/api.ts',
    local: 'src/app/utils/api.ts'
  },
  {
    remote: 'src/app/App.tsx',
    local: 'src/app/App.tsx'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function syncAll() {
  console.log('🚀 Iniciando sincronización de archivos grandes desde GitHub...\\n');
  
  for (const file of FILES_TO_SYNC) {
    const url = `${BASE_URL}/${file.remote}`;
    const localPath = file.local;
    
    // Crear directorio si no existe
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    try {
      console.log(`📥 Descargando: ${file.remote}`);
      await downloadFile(url, localPath);
      const stats = fs.statSync(localPath);
      console.log(`✅ Completado: ${localPath} (${stats.size} bytes)\\n`);
    } catch (error) {
      console.error(`❌ Error: ${file.remote}:`, error.message);
    }
  }
  
  console.log('\\n✨ Sincronización completada');
}

syncAll().catch(console.error);
```

**Ejecutar:**
```bash
node sync-large-files.js
```

## 🔧 Opción 2: Sincronización Manual (Recomendado)

### Paso 1: Abrir VS Code con tu proyecto local conectado a GitHub

### Paso 2: Copiar archivos manualmente

1. **Backend index.ts:**
   - Abre: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/supabase/functions/make-server-b0e879f0/index.ts
   - Copia todo el contenido
   - Pégalo en tu archivo local: `/supabase/functions/make-server-b0e879f0/index.ts`

2. **API Frontend:**
   - Abre: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/src/app/utils/api.ts
   - Copia todo el contenido
   - Pégalo en tu archivo local: `/src/app/utils/api.ts`

3. **App.tsx:**
   - Abre: https://github.com/noxmotorscarsinfo-prog/fuelier-app/blob/main/src/app/App.tsx
   - Copia todo el contenido
   - Pégalo en tu archivo local: `/src/app/App.tsx`

### Paso 3: Verificar Sincronización

Después de copiar, verifica que los archivos estén correctamente actualizados:

```bash
git status
git diff
```

## 🎯 Información del Commit

**Commit más reciente:** `21aee42332e269a75b8fdfe9feb282f2a2e6d248`  
**Fecha:** 16 de enero de 2026  
**Mensaje:** "Fix CRÍTICO: Mapear meal_types de BD a type en frontend"

Este commit incluye:
- Mapeo correcto de meal_types → type en custom meals
- Soporte para day_plan_index y day_plan_name en training
- Correcciones de tokens ES256
- Endpoints completos de global-meals/ingredients

## 📋 Checklist de Verificación

Después de sincronizar, verifica:

- [ ] Backend index.ts tiene los endpoints `/training-plan` actualizados
- [ ] API.ts tiene las funciones `getGlobalMeals()` y `getGlobalIngredients()`
- [ ] App.tsx tiene la auto-detección de tokens ES256
- [ ] types.ts incluye las interfaces de training con day_plan_index
- [ ] Los scripts de sincronización están actualizados

## 🚀 Siguiente Paso

Una vez sincronizados todos los archivos, debes hacer **deploy del backend** desde VS Code:

```bash
# Desde VS Code terminal
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

Esto resolverá el problema del dashboard de entrenamiento donde dayPlanIndex y dayPlanName aparecen como null.

## 💡 Nota Importante

La versión de GitHub es la fuente de verdad. Tu repositorio local está perfectamente actualizado. Este entorno de Figma Make necesita sincronizarse con esa versión para que todo funcione correctamente.
