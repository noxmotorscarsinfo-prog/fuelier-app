# ⚡ COMANDOS RÁPIDOS DE DEPLOYMENT

**Copiar y pegar estos comandos en orden** 🚀

---

## 1️⃣ PREPARAR GITHUB

```bash
# Ver qué cambios hay
git status

# Agregar todos los cambios
git add .

# Crear commit
git commit -m "feat: Sistema ingredientes globales v0.0.2"

# Subir a GitHub
git push origin main
```

**✅ Verificar:** Ir a GitHub y confirmar que el código se subió correctamente

---

## 2️⃣ VERIFICAR SUPABASE DATABASE

**Ir a:** https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/editor

**Ejecutar este query en SQL Editor:**

```sql
-- Verificar tablas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tablas esperadas:**
- ✅ `bug_reports`
- ✅ `daily_logs`
- ✅ `favorite_meals`
- ✅ `kv_store_b0e879f0`
- ✅ `saved_diets`
- ✅ `users`

**Si falta `kv_store_b0e879f0`, ejecutar:**

```sql
-- Crear tabla KV Store
CREATE TABLE IF NOT EXISTS kv_store_b0e879f0 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_b0e879f0 USING btree (key text_pattern_ops);

-- Habilitar Row Level Security
ALTER TABLE kv_store_b0e879f0 ENABLE ROW LEVEL SECURITY;

-- Política de acceso público (necesaria para el backend)
CREATE POLICY "Public access to kv_store" ON kv_store_b0e879f0
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 3️⃣ VERIFICAR SUPABASE EDGE FUNCTION

**Ir a:** https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions

**Buscar:** `make-server-b0e879f0`

**Si NO existe, desplegarla:**

```bash
# Instalar Supabase CLI (solo primera vez)
npm install -g supabase

# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref fzvsbpgqfubbqmqqxmwv

# Desplegar Edge Function
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

**Configurar Variables de Entorno de la Edge Function:**

1. Ir a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/settings/functions
2. Click en "Edge Function Secrets"
3. Agregar estos secrets (obtener valores de Settings → API):

```
SUPABASE_URL=https://fzvsbpgqfubbqmqqxmwv.supabase.co
SUPABASE_ANON_KEY=[Copiar de Supabase Settings → API → anon/public]
SUPABASE_SERVICE_ROLE_KEY=[Copiar de Supabase Settings → API → service_role]
SUPABASE_DB_URL=[Copiar de Supabase Settings → Database → Connection String → URI]
```

---

## 4️⃣ DEPLOYMENT EN VERCEL

### Opción A: Desde Dashboard (Recomendado para primera vez)

1. **Ir a:** https://vercel.com
2. **Click:** "Add New Project"
3. **Click:** "Import Git Repository"
4. **Seleccionar:** Tu repositorio de GitHub
5. **Configurar:**
   - Framework Preset: Vite ✅ (auto-detectado)
   - Build Command: `npm run build` ✅
   - Output Directory: `dist` ✅
6. **Agregar Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://fzvsbpgqfubbqmqqxmwv.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM
   ```
   ⚠️ Marcar: [x] Production [x] Preview [x] Development

7. **Click:** "Deploy" 🚀
8. **Esperar:** 2-3 minutos
9. **¡Listo!** Vercel te dará una URL

---

### Opción B: Desde CLI (Para redeploys)

```bash
# Instalar Vercel CLI (solo primera vez)
npm install -g vercel

# Login
vercel login

# Deploy a producción
vercel --prod

# Seguir instrucciones en pantalla
```

---

## 5️⃣ TESTING POST-DEPLOYMENT

### Test Rápido (2 minutos)

**Tu URL de Vercel:** `https://[TU_PROYECTO].vercel.app`

```bash
# 1. Abrir en navegador
# https://[TU_PROYECTO].vercel.app

# 2. Verificar que carga la pantalla de login ✅

# 3. Abrir DevTools (F12) y verificar:
# - Console: Sin errores ✅
# - Network: Requests exitosos ✅

# 4. Crear cuenta de prueba
# Email: test@fuelier.com
# Password: Test123!

# 5. Completar onboarding ✅

# 6. Llegar al Dashboard ✅
```

### Test Panel de Admin (3 minutos)

```bash
# 1. Ir a:
# https://[TU_PROYECTO].vercel.app/loginfuelier123456789

# 2. Login:
# Email: admin@fuelier.com
# Password: Fuelier2025!

# 3. Click "Panel de Administración" ✅

# 4. Tab "Ingredientes Globales" ✅

# 5. Click "Crear Nuevo Ingrediente" ✅

# 6. Crear ingrediente de prueba:
# - Nombre: Quinoa Test
# - Calorías: 120
# - Proteína: 4
# - Carbohidratos: 21
# - Grasas: 2

# 7. Guardar ✅

# 8. Tab "Platos Globales" ✅

# 9. Click "Crear Nuevo Plato" ✅

# 10. Click "Añadir Ingrediente" ✅

# 11. Buscar "Quinoa Test" ✅

# 12. VERIFICAR: Aparece UNA SOLA VEZ ✅✅✅

# 13. Añadirlo y crear plato ✅
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Error: Build Failed

```bash
# Test local
npm install
npm run build

# Si funciona local:
# - Verificar variables de entorno en Vercel
# - Redesplegar con cache limpia
```

### Error: "Supabase connection failed"

```bash
# Verificar en Vercel Dashboard:
# 1. Settings → Environment Variables
# 2. Buscar: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
# 3. Si faltan, agregarlas
# 4. Redesplegar: Deployments → Redeploy
```

### Error: Página en blanco

```bash
# 1. Abrir DevTools (F12)
# 2. Tab Console → Ver errores
# 3. Tab Network → Ver requests fallidos
# 4. Reportar error específico
```

---

## ✅ CHECKLIST FINAL

Antes de considerar el deployment exitoso, verificar:

- [ ] ✅ GitHub tiene el último código
- [ ] ✅ Supabase tiene tabla `kv_store_b0e879f0`
- [ ] ✅ Supabase Edge Function está activa
- [ ] ✅ Vercel tiene las variables de entorno
- [ ] ✅ App carga correctamente
- [ ] ✅ Login funciona
- [ ] ✅ Onboarding funciona
- [ ] ✅ Dashboard funciona
- [ ] ✅ Panel admin accesible
- [ ] ✅ Ingredientes globales funcionan
- [ ] ✅ NO hay duplicados en selector

---

## 🎉 ¡DEPLOYMENT EXITOSO!

**URLs Importantes:**

```
🌐 App en Producción:
   https://[TU_PROYECTO].vercel.app

🔐 Panel de Admin:
   https://[TU_PROYECTO].vercel.app/loginfuelier123456789
   Email: admin@fuelier.com
   Password: Fuelier2025!

📊 Vercel Dashboard:
   https://vercel.com/dashboard

🗄️ Supabase Dashboard:
   https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv
```

---

## 🔄 PARA FUTUROS UPDATES

```bash
# 1. Hacer cambios en código
# 2. Test local
npm run build

# 3. Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin main

# 4. Vercel desplegará automáticamente ✅

# 5. Verificar deployment en:
# https://vercel.com/dashboard
```

---

**¡Ya está! Fuelier está en producción 🚀💪🥗**

_Última actualización: 6 de Enero de 2026_
