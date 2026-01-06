# ✅ VERIFICACIÓN PRE-DEPLOYMENT - FUELIER

**Fecha:** 6 de Enero de 2026  
**Objetivo:** Asegurar que todo esté listo antes de desplegar

---

## 🔍 CHECKLIST TÉCNICO

### 1. Configuración de Supabase ✅
- [x] Project ID: `fzvsbpgqfubbqmqqxmwv`
- [x] Anon Key configurada
- [x] Archivo `/utils/supabase/info.tsx` presente

### 2. Archivos Clave Presentes ✅
- [x] `/vercel.json` - Configuración de Vercel
- [x] `/package.json` - Dependencias correctas
- [x] `/vite.config.ts` - Build configuration
- [x] `/supabase/functions/server/index.tsx` - Edge function
- [x] `/supabase/functions/server/kv_store.tsx` - KV Store utilities

### 3. Componentes Críticos Actualizados ✅
- [x] `/src/app/components/AdminPanel.tsx` - Con sistema de ingredientes globales
- [x] `/src/app/components/CreateMeal.tsx` - Con carga de ingredientes múltiples fuentes
- [x] `/src/data/ingredientsDatabase.ts` - Base de datos de ingredientes
- [x] `/src/data/mealsWithIngredients.ts` - Platos con ingredientes detallados

### 4. Funcionalidades Core ✅
- [x] Login/Registro con Supabase Auth
- [x] Onboarding completo (7 pasos)
- [x] Dashboard con macros
- [x] Sistema de escalado inteligente
- [x] Panel de administración
- [x] Ingredientes globales (NUEVO)
- [x] Eliminación de duplicados (NUEVO)

---

## 🚀 PREPARACIÓN PARA DEPLOYMENT

### A. GitHub - Repository Setup

```bash
# 1. Verificar que estás en la rama correcta
git branch
# Debería mostrar: * main

# 2. Ver estado actual
git status

# 3. Si hay cambios sin commitear, hacerlo ahora:
git add .
git commit -m "feat: Sistema ingredientes globales + corrección duplicados"

# 4. Push a GitHub
git push origin main
```

### B. Vercel - Variables de Entorno

**⚠️ IMPORTANTE:** Antes de desplegar, configurar estas variables en Vercel Dashboard:

1. Ir a: https://vercel.com/dashboard
2. Seleccionar tu proyecto (o crear uno nuevo)
3. Settings → Environment Variables
4. Agregar:

```env
VITE_SUPABASE_URL=https://fzvsbpgqfubbqmqqxmwv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM
```

**Seleccionar ambientes:** Production, Preview, Development

### C. Supabase - Database Schema

**Verificar que existan estas tablas:**

1. Ir a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv
2. SQL Editor
3. Ejecutar este query de verificación:

```sql
-- Verificar tablas existentes
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tablas esperadas:**
- `kv_store_b0e879f0` (Key-Value Store)
- `users` (Usuarios)
- `daily_logs` (Logs diarios)
- `saved_diets` (Dietas guardadas)
- `favorite_meals` (Comidas favoritas)
- `bug_reports` (Reportes de bugs)

**Si falta alguna tabla**, ejecutar el SQL de `/DEPLOYMENT_ACTUALIZADO_2026.md`

### D. Supabase - Edge Functions

**Verificar que la Edge Function esté desplegada:**

1. Ir a: Edge Functions en Supabase Dashboard
2. Buscar función: `make-server-b0e879f0`
3. Status: Debe estar **Active**

**Si no existe o está inactiva:**

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref fzvsbpgqfubbqmqqxmwv

# Desplegar Edge Function
cd supabase/functions
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

**Configurar variables de entorno de la Edge Function:**
En Supabase Dashboard → Edge Functions → Settings → Secrets:

```
SUPABASE_URL=https://fzvsbpgqfubbqmqqxmwv.supabase.co
SUPABASE_ANON_KEY=[Tu Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Tu Service Role Key - obtenerlo de Supabase Settings → API]
SUPABASE_DB_URL=[Tu Database URL - obtenerlo de Supabase Settings → Database]
```

---

## 🎯 DEPLOYMENT PASO A PASO

### Método 1: Deploy desde Vercel Dashboard (Recomendado)

**Paso 1: Conectar GitHub (Solo primera vez)**
1. Ir a https://vercel.com
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Autorizar acceso a GitHub
5. Seleccionar tu repositorio de Fuelier

**Paso 2: Configurar Proyecto**
1. Project Name: `fuelier-app` (o el que prefieras)
2. Framework Preset: Vite (auto-detectado)
3. Root Directory: `./` (dejar por defecto)
4. Build Command: `npm run build` (auto-detectado)
5. Output Directory: `dist` (auto-detectado)
6. Install Command: `npm install` (auto-detectado)

**Paso 3: Agregar Environment Variables**
1. Expandir "Environment Variables"
2. Agregar:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://fzvsbpgqfubbqmqqxmwv.supabase.co`
   - Environments: [x] Production [x] Preview [x] Development

3. Agregar:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM`
   - Environments: [x] Production [x] Preview [x] Development

**Paso 4: Deploy!**
1. Click "Deploy"
2. Esperar 2-3 minutos mientras Vercel:
   - Clona el repo
   - Instala dependencias (`npm install`)
   - Ejecuta build (`npm run build`)
   - Despliega a producción

**Paso 5: Verificar**
1. Una vez termine, Vercel te dará una URL: `https://fuelier-app-xxx.vercel.app`
2. Click en la URL para abrir la app
3. Verificar que cargue correctamente

---

### Método 2: Deploy desde CLI

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login a Vercel
vercel login
# Seguir instrucciones en navegador

# 3. Deploy a producción
vercel --prod

# Responder preguntas:
# - Set up and deploy? → Y
# - Which scope? → Tu cuenta personal
# - Link to existing project? → N (primera vez) / Y (si ya existe)
# - Project name? → fuelier-app
# - Directory? → ./
# - Override settings? → N

# 4. Esperar deployment
# Vercel mostrará la URL cuando termine
```

---

## ✅ POST-DEPLOYMENT TESTING

### Test 1: Página Principal (1 min)
1. Abrir: `https://[TU_URL].vercel.app`
2. ✅ Debería cargar la pantalla de login
3. ✅ No debe haber errores en consola (F12)

### Test 2: Login/Registro (2 min)
1. Click "Registrarse"
2. Crear cuenta nueva:
   - Email: `test@fuelier.com`
   - Password: `Test123!`
3. ✅ Debería redireccionar a Onboarding
4. ✅ Completar onboarding (datos de prueba)
5. ✅ Debería llegar al Dashboard

### Test 3: Dashboard (2 min)
1. ✅ Verificar que muestra macros del día
2. ✅ Verificar que las 4 comidas están vacías
3. ✅ Click en "Agregar Desayuno"
4. ✅ Debería mostrar lista de desayunos
5. ✅ Seleccionar uno
6. ✅ Debería mostrar opciones de macros
7. ✅ Confirmar
8. ✅ Verificar que se agregó al dashboard

### Test 4: Panel de Admin (3 min)
1. Ir a: `https://[TU_URL].vercel.app/loginfuelier123456789`
2. Login:
   - Email: `admin@fuelier.com`
   - Password: `Fuelier2025!`
3. Click "Panel de Administración"
4. ✅ Tab "Ingredientes Globales"
5. ✅ Click "Crear Nuevo Ingrediente"
6. ✅ Crear ingrediente de prueba
7. ✅ Guardar
8. ✅ Verificar que aparece en la lista
9. ✅ Tab "Platos Globales"
10. ✅ Click "Crear Nuevo Plato"
11. ✅ Click "Añadir Ingrediente"
12. ✅ Buscar el ingrediente creado
13. ✅ **Verificar que aparece UNA SOLA VEZ**
14. ✅ Añadirlo y crear plato

### Test 5: Performance (2 min)
1. Abrir Chrome DevTools (F12)
2. Tab "Lighthouse"
3. Click "Analyze page load"
4. ✅ Performance Score > 70
5. ✅ Accessibility Score > 80
6. ✅ Best Practices Score > 80

---

## 🐛 SI ALGO FALLA

### Error: "Failed to build"
**Revisar logs de Vercel:**
1. Vercel Dashboard → Deployments
2. Click en el deployment fallido
3. Ver "Build Logs"
4. Copiar error completo

**Solución común:**
```bash
# Test build localmente
npm install
npm run build

# Si funciona local pero falla en Vercel:
# - Verificar que package.json esté commiteado
# - Verificar que vite.config.ts esté commiteado
# - Limpiar cache en Vercel y redesplegar
```

### Error: "Supabase connection failed"
**Verificar:**
1. Variables de entorno en Vercel están correctas
2. Tienen el prefijo `VITE_`
3. Redesplegar después de agregar variables:
   - Vercel Dashboard → Deployments → Latest → Redeploy

### Error: Página en blanco
**Verificar consola del navegador (F12):**
1. Ver errores en Console
2. Ver errores en Network

**Solución común:**
```bash
# Verificar rutas en vite.config.ts
# Verificar que index.html esté en la raíz
# Verificar que /src/main.tsx exista
```

---

## 📊 MÉTRICAS A MONITOREAR

### Primeras 24 Horas
- [ ] **Vercel Analytics:** Page views, unique visitors
- [ ] **Vercel Logs:** Errores de runtime
- [ ] **Supabase Dashboard:** Queries ejecutados
- [ ] **Supabase Logs:** Errores de base de datos
- [ ] **Browser Console:** Errores JavaScript

### Primera Semana
- [ ] Tasa de registro de usuarios
- [ ] Tasa de completación del onboarding
- [ ] Comidas agregadas por día
- [ ] Días completados
- [ ] Uso del panel de admin

---

## 🎉 DEPLOYMENT COMPLETADO

Una vez que todos los tests pasen:

✅ **App desplegada en producción**  
✅ **Database funcionando**  
✅ **Edge Functions activas**  
✅ **Panel de admin accesible**  
✅ **Sistema de ingredientes globales operativo**

### URLs Finales
```
🌐 Producción: https://[TU_DOMINIO].vercel.app
🔐 Panel Admin: https://[TU_DOMINIO].vercel.app/loginfuelier123456789
📊 Vercel Dashboard: https://vercel.com/dashboard
🗄️ Supabase Dashboard: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv
```

### Siguientes Pasos
1. Compartir URL con usuarios beta
2. Recopilar feedback
3. Monitorear métricas
4. Iterar y mejorar

---

**¡Fuelier está en producción y listo para ayudar a miles de usuarios! 💪🥗**

_Última verificación: 6 de Enero de 2026_
