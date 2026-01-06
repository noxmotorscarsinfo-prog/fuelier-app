# 🚀 DEPLOYMENT ACTUALIZADO - FUELIER APP
**Fecha:** 6 de Enero de 2026  
**Versión:** 0.0.2 - Con Ingredientes Globales  
**Estado:** ✅ LISTO PARA DEPLOYMENT

---

## 📋 CAMBIOS RECIENTES

### ✨ Nuevas Funcionalidades
1. **Sistema de Ingredientes Globales** - Los administradores pueden crear ingredientes globales desde el Panel de Admin
2. **Ingredientes en Platos Globales** - Al crear platos, ahora se pueden usar ingredientes hardcodeados + globales
3. **Eliminación de Duplicados** - Sistema inteligente que elimina ingredientes duplicados por nombre
4. **Migración Automática** - Los platos antiguos se migran automáticamente al nuevo formato estructurado

### 🔧 Correcciones Técnicas
- ✅ Solucionado: Ingredientes globales no aparecían al crear platos
- ✅ Solucionado: Duplicados de ingredientes en el selector
- ✅ Optimizado: `filteredIngredients` ahora combina todas las fuentes
- ✅ Optimizado: `findIngredientById` busca en múltiples fuentes

---

## 🎯 PASOS DE DEPLOYMENT

### 1️⃣ Preparar GitHub

```bash
# 1. Verificar cambios
git status

# 2. Agregar todos los cambios
git add .

# 3. Crear commit descriptivo
git commit -m "feat: Sistema de ingredientes globales + corrección duplicados"

# 4. Push a GitHub
git push origin main
```

---

### 2️⃣ Configurar Supabase

#### A. Verificar Tablas Existentes
Ir a **Supabase Dashboard → SQL Editor** y ejecutar:

```sql
-- Verificar que existan las tablas necesarias
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

#### B. Crear Tabla KV Store (Si no existe)
```sql
-- Tabla de Key-Value Store para datos globales
CREATE TABLE IF NOT EXISTS kv_store_b0e879f0 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por prefijo
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_b0e879f0 USING btree (key text_pattern_ops);

-- Habilitar RLS
ALTER TABLE kv_store_b0e879f0 ENABLE ROW LEVEL SECURITY;

-- Política pública (necesaria para que funcione el backend)
CREATE POLICY "Public access to kv_store" ON kv_store_b0e879f0
  FOR ALL USING (true) WITH CHECK (true);
```

#### C. Crear Tablas de Usuarios y Logs (Si no existen)
Copiar y ejecutar el SQL completo de `/DEPLOYMENT_FINAL_GUIDE.md` líneas 106-231.

#### D. Verificar Edge Functions
En **Supabase Dashboard → Edge Functions**, asegurarse de que existe la función `make-server-b0e879f0`.

Si no existe, desplegarla:
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref [TU_PROJECT_ID]

# Deploy edge function
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

---

### 3️⃣ Configurar Vercel

#### A. Variables de Entorno Frontend
En **Vercel Dashboard → Settings → Environment Variables**, agregar:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://[TU_PROJECT_ID].supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Tu Anon Key de Supabase | Production, Preview, Development |

**📍 Dónde encontrar las credenciales:**
- Supabase Dashboard → Settings → API
- Copia `Project URL` y `anon/public key`

#### B. Verificar Build Settings
En **Vercel Dashboard → Settings → General**, verificar:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

---

### 4️⃣ Deployment Automático

#### Opción A: Deploy desde GitHub (Recomendado)
1. **Conectar Repositorio** (si no está conectado)
   - Ir a https://vercel.com
   - Click "Add New Project"
   - Seleccionar tu repositorio de GitHub
   - Click "Import"

2. **Configurar y Deploy**
   - Vercel detectará automáticamente que es un proyecto Vite
   - Agregar las variables de entorno
   - Click "Deploy"

3. **Auto-Deploy en cada Push**
   - Cada vez que hagas `git push`, Vercel desplegará automáticamente
   - Main branch → Production
   - Otras branches → Preview

#### Opción B: Deploy Manual con CLI
```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy a producción
vercel --prod

# 4. Seguir instrucciones del CLI
```

---

### 5️⃣ Configurar Supabase Edge Function ENV

Las Edge Functions necesitan variables de entorno. Configurarlas en:
**Supabase Dashboard → Edge Functions → Settings**

```bash
SUPABASE_URL=https://[TU_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[TU_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[TU_SERVICE_ROLE_KEY]
SUPABASE_DB_URL=[TU_DB_URL]
```

**⚠️ CRÍTICO:**
- El `SERVICE_ROLE_KEY` **SOLO** debe estar en Supabase Edge Functions
- **NUNCA** exponerlo en variables de Vercel (frontend)

---

## ✅ CHECKLIST POST-DEPLOYMENT

### Testing Básico (5 min)
- [ ] La app carga en `https://[TU_DOMINIO].vercel.app`
- [ ] Login funciona correctamente
- [ ] Registro de nuevo usuario funciona
- [ ] Dashboard carga sin errores

### Testing Ingredientes Globales (10 min)
- [ ] Ir a `/loginfuelier123456789`
- [ ] Login como admin (admin@fuelier.com / Fuelier2025!)
- [ ] Ir a Panel de Administración
- [ ] Tab "Ingredientes Globales"
- [ ] Click "Crear Nuevo Ingrediente"
- [ ] Crear ingrediente de prueba (ej: "Quinoa Test")
- [ ] Guardar
- [ ] Ir a Tab "Platos Globales"
- [ ] Click "Crear Nuevo Plato"
- [ ] Click "Añadir Ingrediente"
- [ ] Buscar "Quinoa Test"
- [ ] **Verificar que aparece UNA SOLA VEZ** ✅
- [ ] Añadirlo y crear el plato

### Testing Sistema Completo (15 min)
- [ ] Crear una comida custom
- [ ] Agregar ingredientes (verificar que aparecen todos)
- [ ] Guardar comida
- [ ] Verificar que los macros se calculan correctamente
- [ ] Ir a Dashboard y agregar esa comida
- [ ] Verificar que el sistema escala correctamente
- [ ] Verificar que la última comida cierra al 100%

### Performance Check
- [ ] Abrir Chrome DevTools → Lighthouse
- [ ] Run audit en modo producción
- [ ] Verificar Performance Score > 80
- [ ] Verificar que no hay errores en Console

---

## 🐛 TROUBLESHOOTING COMÚN

### 1. "Cannot find module ingredientsDatabase"
**Causa:** Import path incorrecto  
**Solución:** Verificar que los imports sean:
```typescript
import { INGREDIENTS_DATABASE } from '../../data/ingredientsDatabase';
```

### 2. Ingredientes duplicados siguen apareciendo
**Causa:** Cache del navegador  
**Solución:** 
```bash
# Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. "Supabase connection failed"
**Causa:** Variables de entorno mal configuradas  
**Solución:**
1. Verificar en Vercel Dashboard → Settings → Environment Variables
2. Asegurarse que tengan el prefijo `VITE_`
3. Redesplegar: `vercel --prod --force`

### 4. Edge Function no responde
**Causa:** Variables de entorno faltantes  
**Solución:**
1. Ir a Supabase Dashboard → Edge Functions → Settings
2. Agregar todas las variables necesarias
3. Redesplegar función

### 5. Build falla en Vercel
**Causa:** Dependencias faltantes o TypeScript errors  
**Solución:**
```bash
# Probar build localmente
npm install
npm run build

# Si funciona local, limpiar cache de Vercel
# Vercel Dashboard → Deployments → [Último deployment] → Redeploy
```

---

## 📊 MONITOREO POST-DEPLOYMENT

### Primeras 24 Horas
1. **Verificar Logs en Vercel**
   - Vercel Dashboard → Deployments → View Function Logs
   - Buscar errores o warnings

2. **Verificar Métricas en Supabase**
   - Supabase Dashboard → Database → Usage
   - Verificar queries ejecutados
   - Verificar que no haya errores RLS

3. **Verificar Analytics**
   - Vercel Dashboard → Analytics
   - Monitorear Page Views, Unique Visitors
   - Revisar Web Vitals

### Primera Semana
- Recopilar feedback de usuarios
- Monitorear errores recurrentes
- Optimizar queries lentas
- Ajustar RLS policies si es necesario

---

## 🔄 ACTUALIZACIONES FUTURAS

### Para hacer cambios después del deployment:

1. **Desarrollo Local**
   ```bash
   # Hacer cambios en tu código
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin main
   ```

2. **Auto-Deploy**
   - Vercel detectará el push y desplegará automáticamente
   - Monitorear el deployment en Vercel Dashboard
   - Verificar que todo funciona en producción

3. **Rollback si algo falla**
   - Vercel Dashboard → Deployments
   - Click en deployment anterior que funcionaba
   - Click "Promote to Production"

---

## 📞 ACCESO RÁPIDO

### URLs Importantes
```
App en Producción: https://[TU_DOMINIO].vercel.app
Panel Admin: https://[TU_DOMINIO].vercel.app/loginfuelier123456789
Vercel Dashboard: https://vercel.com/dashboard
Supabase Dashboard: https://supabase.com/dashboard
GitHub Repo: https://github.com/[TU_USUARIO]/[TU_REPO]
```

### Credenciales Admin
```
Email: admin@fuelier.com
Password: Fuelier2025!
```

---

## ✨ RESUMEN EJECUTIVO

### Status Actual
- ✅ **Código:** Completamente funcional con ingredientes globales
- ✅ **Build:** Sin errores, optimizado
- ✅ **Features:** 100% operativos + nuevas funcionalidades
- ✅ **Database:** Estructura actualizada
- ✅ **Performance:** Optimizado para producción

### Cambios Clave en Esta Versión
1. Sistema de ingredientes globales completamente funcional
2. Eliminación inteligente de duplicados
3. Migración automática de platos antiguos
4. Mejor experiencia de usuario en Panel de Admin

### Próximos Pasos Recomendados
1. Desplegar a producción siguiendo esta guía
2. Realizar testing exhaustivo (30 min)
3. Monitorear métricas primeras 24h
4. Recopilar feedback de usuarios beta
5. Iterar y mejorar basándose en feedback

---

**¡Fuelier v0.0.2 está listo para transformar la nutrición de miles de usuarios! 💪🥗**

_Última actualización: 6 de Enero de 2026_
