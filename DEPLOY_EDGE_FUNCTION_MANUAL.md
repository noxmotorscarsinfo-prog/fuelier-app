# Cómo Deployar Edge Function Manualmente

## Opción 1: Desde Supabase Dashboard (MÁS FÁCIL)

1. Ve a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions

2. Busca la función `make-server-b0e879f0`

3. Haz clic en los **3 puntos** (⋮) → **"Edit"** o **"Deploy"**

4. **OPCIÓN A - Si aparece un editor:**
   - Copia TODO el contenido de `supabase/functions/make-server-b0e879f0/index.ts`
   - Pégalo en el editor
   - Haz clic en "Deploy"

5. **OPCIÓN B - Si pide subir archivo:**
   - Navega a `supabase/functions/make-server-b0e879f0/`
   - Selecciona `index.ts`
   - Haz clic en "Upload" y luego "Deploy"

6. Espera a que termine el deploy (verás un mensaje de éxito)

---

## Opción 2: Usando Supabase CLI (Si quieres instalarlo)

```powershell
# 1. Instalar Supabase CLI
scoop install supabase
# O descarga desde: https://github.com/supabase/cli/releases

# 2. Login
supabase login

# 3. Link al proyecto
supabase link --project-ref fzvsbpgqfubbqmqqxmwv

# 4. Deploy la función
supabase functions deploy make-server-b0e879f0

# 5. Verificar
supabase functions list
```

---

## Verificar que funcionó

Después del deploy, recarga tu app y prueba:

1. Crear una rutina de entrenamiento
2. Completar el onboarding
3. Cerrar sesión
4. Iniciar sesión
5. Ir a "Entrenamiento"

**Resultado esperado:** Ver tu dashboard de entrenamiento, NO el popup de onboarding.

---

## Logs para verificar

Abre la consola del navegador y busca estos logs:

✅ **BUENO:**
```
[API] 💾 Guardando usuario: tu@email.com
[API] 📊 Datos a guardar: { trainingOnboarded: true, trainingDays: 4, ... }
[API] ✅ Usuario guardado exitosamente en backend
```

Luego al recargar:
```
[API] User found in database: tu@email.com
user: { trainingOnboarded: true, trainingDays: 4, ... }
```

❌ **MALO (significa que el Edge Function NO está actualizado):**
```
user: { trainingOnboarded: undefined, trainingDays: undefined, ... }
```
