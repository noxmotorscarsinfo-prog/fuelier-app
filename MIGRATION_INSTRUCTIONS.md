# INSTRUCCIONES: Aplicar Migración de Training Fields

## Problema Identificado
Los campos `training_onboarded` y `training_days` NO estaban guardándose en la base de datos Supabase.
Esto causaba que después de logout/login, el sistema no recordara que el usuario ya había completado el onboarding de entrenamiento.

## Solución Implementada

### 1. Backend (✅ YA COMPLETADO)
- Actualizado `supabase/functions/make-server-b0e879f0/index.ts`
- Agregados campos en POST /user (guardar)
- Agregados campos en GET /user/:email (cargar)

### 2. Base de Datos (⚠️ REQUIERE ACCIÓN MANUAL)

Necesitas ejecutar el siguiente SQL en tu base de datos Supabase:

```sql
-- Add training onboarding fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS training_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_days INTEGER;

-- Add comment to document the fields
COMMENT ON COLUMN users.training_onboarded IS 'Whether the user has completed the training onboarding wizard';
COMMENT ON COLUMN users.training_days IS 'Number of days per week the user trains';
```

## Cómo Aplicar la Migración

### Opción 1: SQL Editor (RECOMENDADO)
1. Ve a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/editor
2. Haz clic en "SQL Editor" en el menú lateral
3. Copia y pega el SQL de arriba
4. Haz clic en "Run" (▶️)
5. Verifica que aparezca "Success"

### Opción 2: Table Editor (Visual)
1. Ve a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/editor
2. Selecciona la tabla `users`
3. Haz clic en "+" para agregar columna
4. Agrega:
   - Nombre: `training_onboarded`
   - Tipo: `boolean`
   - Default: `false`
5. Repite para `training_days`:
   - Nombre: `training_days`
   - Tipo: `integer`
   - Default: `null`

## Verificación

Después de aplicar la migración:

1. **Redeploy del Edge Function:**
   ```powershell
   cd supabase/functions/make-server-b0e879f0
   # El Edge Function se actualizará automáticamente con git push si tienes GitHub Actions
   # O manualmente desde Supabase Dashboard > Edge Functions
   ```

2. **Prueba el flujo completo:**
   - Crea una rutina de entrenamiento
   - Completa el primer día
   - Cierra sesión
   - Inicia sesión nuevamente
   - Ve al apartado "Entrenamiento"
   - **Resultado esperado:** Ver el dashboard con tu rutina, NO el popup de onboarding

## Archivos Modificados

- `supabase/functions/make-server-b0e879f0/index.ts` - Backend actualizado
- `supabase/migrations/002_add_training_fields.sql` - Script de migración SQL
- `src/app/components/Dashboard.tsx` - Ya tenía useEffect de sincronización

## Diagnóstico del Problema Original

El flujo era:
1. Usuario completa onboarding de entrenamiento
2. `handleTrainingOnboardingComplete` llama a `onUpdateUser({ ...user, trainingOnboarded: true })`
3. App.tsx hace `setUser(updatedUser)`
4. useEffect en App.tsx llama a `api.saveUser(user)` 
5. **❌ FALLO:** Backend NO guardaba `trainingOnboarded` en DB
6. Al recargar, `getUser()` devolvía `trainingOnboarded: false` (o undefined)
7. Dashboard mostraba onboarding nuevamente

Ahora el flujo será:
1-4. Igual
5. **✅ FIX:** Backend GUARDA `training_onboarded: true` en DB
6. Al recargar, `getUser()` devuelve `trainingOnboarded: true`
7. Dashboard muestra el training dashboard correctamente
