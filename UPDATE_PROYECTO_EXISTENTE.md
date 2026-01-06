# ⚡ ACTUALIZACIÓN RÁPIDA - PROYECTO EXISTENTE

**Para proyectos que YA ESTÁN en Vercel** 🔄

---

## 🚀 PASOS PARA ACTUALIZAR (3 minutos)

### 1️⃣ Push a GitHub

```bash
# Ver cambios
git status

# Agregar todos los cambios
git add .

# Commit
git commit -m "feat: Sistema ingredientes globales + fix duplicados"

# Push
git push origin main
```

**✅ AUTOMÁTICO:** Vercel detectará el push y desplegará automáticamente

---

### 2️⃣ Verificar Variables de Entorno (solo si es primera vez)

**Ir a:** https://vercel.com/dashboard → Tu Proyecto → Settings → Environment Variables

**Verificar que existan:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Si NO existen, agregarlas:**
```
VITE_SUPABASE_URL=https://fzvsbpgqfubbqmqqxmwv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTA4OTIsImV4cCI6MjA4MjUyNjg5Mn0.tLKyWdfwluNOVZoHBZn0l2oTA1RdSRUCgCamnDqUJwM
```

⚠️ Si agregas variables nuevas, necesitas **redesplegar**:
- Deployments → Latest → "Redeploy"

---

### 3️⃣ Monitorear Deployment

**Ir a:** https://vercel.com/dashboard → Tu Proyecto → Deployments

**Ver:**
- 🟡 "Building" - Está compilando (1-2 min)
- 🟢 "Ready" - ¡Desplegado exitosamente!
- 🔴 "Error" - Ver logs y corregir

---

### 4️⃣ Testing Rápido (2 minutos)

Una vez que diga "Ready":

```bash
# 1. Abrir tu URL en navegador
# https://[TU_PROYECTO].vercel.app

# 2. Abrir DevTools (F12)
# - Console: Sin errores ✅
# - Network: Requests exitosos ✅

# 3. Ir al Panel de Admin:
# https://[TU_PROYECTO].vercel.app/loginfuelier123456789

# 4. Login:
# Email: admin@fuelier.com
# Password: Fuelier2025!

# 5. Panel de Administración → Tab "Platos Globales"

# 6. Click "Crear Nuevo Plato" → "Añadir Ingrediente"

# 7. Buscar "pechuga de pollo"

# 8. VERIFICAR: Aparece UNA SOLA VEZ ✅✅✅
```

---

## 🎯 VERIFICACIÓN DE SUPABASE

### Solo si es la primera vez con ingredientes globales:

**Ir a:** https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/editor

**Ejecutar en SQL Editor:**

```sql
-- Verificar si existe kv_store
SELECT COUNT(*) as existe 
FROM information_schema.tables 
WHERE table_name = 'kv_store_b0e879f0';
```

**Si devuelve 0, crear la tabla:**

```sql
CREATE TABLE IF NOT EXISTS kv_store_b0e879f0 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_b0e879f0 USING btree (key text_pattern_ops);

ALTER TABLE kv_store_b0e879f0 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to kv_store" ON kv_store_b0e879f0
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 🐛 SI ALGO FALLA

### Error: Build Failed en Vercel

```bash
# 1. Ver logs en Vercel Dashboard
# Deployments → Click en el deployment fallido → View Logs

# 2. Test build local
npm install
npm run build

# 3. Si funciona local pero falla en Vercel:
# - Limpiar cache: Deployments → Redeploy (sin cache)
```

### Error: Ingredientes duplicados siguen apareciendo

```bash
# 1. Hard refresh en navegador:
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 2. Verificar que el código se desplegó:
# - Vercel Dashboard → Deployments → Latest
# - Ver fecha/hora del último deployment
# - Debe ser DESPUÉS de tu último push

# 3. Si aún aparecen duplicados:
# - Abrir DevTools (F12) → Application → Clear storage
# - Recargar página
```

### Error: "Supabase connection failed"

```bash
# Verificar variables de entorno en Vercel:
# Settings → Environment Variables
# Deben tener prefijo VITE_

# Si faltan o están mal:
# 1. Corregirlas
# 2. Deployments → Redeploy
```

---

## ✅ CHECKLIST ACTUALIZACIÓN

- [ ] ✅ `git push origin main` ejecutado
- [ ] ✅ Vercel muestra "Building" → "Ready"
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ App carga sin errores
- [ ] ✅ Panel admin accesible
- [ ] ✅ Ingredientes globales funcionan
- [ ] ✅ NO hay duplicados al buscar ingredientes

---

## 📊 MONITOREO POST-UPDATE

### Primeras Horas

**Verificar en Vercel Dashboard:**
- Analytics → Ver si hay picos de errores
- Logs → Buscar mensajes de error

**Verificar en Supabase Dashboard:**
- Database → Usage → Ver queries ejecutados
- Logs → Buscar errores

**Verificar en Navegador:**
- Abrir consola (F12)
- Buscar errores JavaScript
- Probar flujos principales

---

## 🔄 ROLLBACK SI ES NECESARIO

Si algo sale mal:

1. **Ir a:** Vercel Dashboard → Deployments
2. **Encontrar:** Deployment anterior que funcionaba
3. **Click:** Menú (⋮) → "Promote to Production"
4. **Confirmar:** "Promote"

Esto vuelve a la versión anterior inmediatamente.

---

## 🎉 ¡LISTO!

Una vez que todos los checks pasen, tu app estará actualizada con:

✅ Sistema de ingredientes globales funcional  
✅ Corrección de duplicados  
✅ Búsqueda optimizada  
✅ Panel de admin mejorado

---

**Próxima vez que quieras actualizar, solo:**

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

**Vercel se encarga del resto automáticamente** 🚀

---

_Actualización: 6 de Enero de 2026_
