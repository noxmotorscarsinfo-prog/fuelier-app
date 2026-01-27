# 🚀 Instrucciones para Deploy de Edge Functions en Supabase

## ⚠️ Problema Actual

Tu aplicación está devolviendo **Error 401 "Unauthorized"** al intentar guardar usuarios porque:
1. La Edge Function **NO está deployada** en Supabase
2. O las **variables de entorno** no están configuradas correctamente

## 📋 Pasos para Resolver

### 1️⃣ Instalar Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (con Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# O usando npm
npm install -g supabase
```

### 2️⃣ Login en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 3️⃣ Link tu Proyecto

```bash
# Desde la raíz de tu repositorio
supabase link --project-ref <TU_PROJECT_ID>
```

**Encuentra tu PROJECT_ID:**
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto "Fuelier"
- El Project ID está en la URL: `https://supabase.com/dashboard/project/<PROJECT_ID>`
- O en Settings → General → Reference ID

### 4️⃣ Configurar Variables de Entorno

Las Edge Functions necesitan estas variables. Configúralas con:

```bash
# SUPABASE_URL (ya debe estar configurada automáticamente)
supabase secrets set SUPABASE_URL=https://<tu-project-id>.supabase.co

# SUPABASE_ANON_KEY (ya debe estar configurada automáticamente)
supabase secrets set SUPABASE_ANON_KEY=<tu-anon-key>

# SUPABASE_SERVICE_ROLE_KEY (⚠️ CRÍTICO - esta probablemente falta)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

**Encuentra tus Keys:**
1. Ve a https://supabase.com/dashboard/project/<PROJECT_ID>/settings/api
2. Copia:
   - `anon/public` key → SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY ⚠️ **¡Manténla secreta!**

### 5️⃣ Deployar la Edge Function

```bash
# Desde la raíz de tu repositorio
supabase functions deploy make-server-b0e879f0
```

Deberías ver algo como:
```
Deploying make-server-b0e879f0 (project ref: <PROJECT_ID>)
Bundled make-server-b0e879f0 in X ms
Deployed make-server-b0e879f0 to supabase (project ref: <PROJECT_ID>)
```

### 6️⃣ Verificar el Deploy

Abre tu aplicación y presiona **Ctrl+Shift+D** para abrir el panel de debug.

Haz clic en "Ejecutar Tests" y verifica:

✅ **Ping** - debe devolver 200 OK
✅ **Health** - debe mostrar las configuraciones
✅ **Test POST** - debe aceptar datos
✅ **Global Meals** - debe retornar array (vacío o con datos)
✅ **POST User** - debe retornar 200 (o 500 si hay error de DB, pero NO 401)

## 🔍 Diagnóstico de Problemas

### Si obtienes 401 en TODOS los endpoints:

La Edge Function no está deployada o no está respondiendo.

**Solución:**
```bash
# Ver logs en tiempo real
supabase functions logs make-server-b0e879f0

# Re-deployar
supabase functions deploy make-server-b0e879f0
```

### Si obtienes 401 solo en POST /user:

Problema con políticas RLS en la tabla `users`.

**Solución:**
1. Ve a https://supabase.com/dashboard/project/<PROJECT_ID>/editor
2. Selecciona la tabla `users`
3. Ve a la pestaña "RLS" (Row Level Security)
4. Asegúrate de tener estas políticas:

**Política 1: Service Role Full Access**
```sql
CREATE POLICY "Service role can do everything"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Política 2: Users can read their own data**
```sql
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);
```

**Política 3: Users can update their own data**
```sql
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);
```

### Si obtienes 500 en POST /user:

Error en la base de datos (columna faltante, constraint violation, etc.)

**Solución:**
1. Presiona Ctrl+Shift+D
2. Ejecuta tests
3. En el error de "POST User", haz clic en "Ver datos"
4. Busca el mensaje de error que dice qué columna o constraint está fallando
5. Ajusta el schema de la tabla `users` en consecuencia

## 📊 Schema de la Tabla `users` Requerido

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex TEXT,
  age INTEGER,
  birthdate DATE,
  weight NUMERIC,
  height NUMERIC,
  body_fat_percentage NUMERIC,
  lean_body_mass NUMERIC,
  training_frequency INTEGER,
  training_intensity TEXT,
  training_type TEXT,
  training_time_preference TEXT,
  lifestyle_activity TEXT,
  occupation TEXT,
  daily_steps INTEGER,
  goal TEXT,
  meals_per_day INTEGER,
  target_calories NUMERIC,
  target_protein NUMERIC,
  target_carbs NUMERIC,
  target_fat NUMERIC,
  selected_macro_option TEXT,
  meal_distribution JSONB,
  previous_diet_history JSONB,
  metabolic_adaptation JSONB,
  preferences JSONB,
  accepted_meal_ids TEXT[],
  rejected_meal_ids TEXT[],
  favorite_meal_ids TEXT[],
  favorite_ingredient_ids TEXT[],
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas (ver arriba)
```

## 🎯 Resultado Esperado

Después de completar estos pasos:

1. ✅ La aplicación NO debe mostrar errores 401
2. ✅ Los usuarios se guardarán en Supabase
3. ✅ NO habrá fallback a localStorage
4. ✅ Todo funcionará con el backend

## 🆘 Si Sigues Teniendo Problemas

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta crear un usuario
4. Busca la request a `/user`
5. Haz clic derecho → Copy → Copy as cURL
6. Envíame el comando cURL para debug

O alternativamente:

1. Presiona Ctrl+Shift+D en la app
2. Ejecuta tests
3. Captura de pantalla de los resultados
4. Compártela conmigo

---

**Nota importante:** Una vez que la Edge Function esté deployada correctamente, todos los errores 401 desaparecerán y la aplicación funcionará 100% con backend, sin localStorage.
