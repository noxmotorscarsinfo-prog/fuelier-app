# 🔐 ERROR: Invalid Login Credentials

**Error:** `AuthApiError: Invalid login credentials`  
**Fecha:** 2026-01-09  
**Estado:** ⚠️ PROBLEMA DE DATOS - REQUIERE VERIFICACIÓN

---

## ❓ ¿Qué significa este error?

Este error significa que **el email o la contraseña son incorrectos**, o que **el usuario no existe en Supabase Auth**.

---

## 🔍 CAUSAS POSIBLES

### Causa 1: Usuario completó onboarding ANTES del fix (más probable)
Si el usuario completó el onboarding antes de nuestro fix de `saveUser`, es posible que:
- ✅ El usuario existe en la tabla `users` (perfil)
- ❌ El usuario NO existe en `auth.users` (autenticación)

Esto puede pasar porque el signup falló pero no se notificó el error.

### Causa 2: Email o contraseña incorrectos
El usuario está escribiendo mal:
- Email incorrecto
- Contraseña incorrecta
- Mayúsculas/minúsculas diferentes

### Causa 3: Usuario no existe
El usuario nunca completó el signup, solo tiene un perfil parcial en la BD.

---

## ✅ SOLUCIÓN RÁPIDA

### Opción A: Crear cuenta nueva (RECOMENDADO)
1. **NO intentes iniciar sesión** con ese email
2. **Usa un email diferente** para crear una cuenta nueva
3. Completa el onboarding completo
4. Esta vez el usuario se guardará correctamente ✅

### Opción B: Resetear la cuenta problemática (Avanzado)
Si necesitas usar ese email específico:

1. **Eliminar el usuario de Auth** (si existe):
   ```sql
   -- Ve a Supabase Dashboard → Authentication → Users
   -- Busca el email y elimínalo manualmente
   -- O ejecuta en SQL Editor:
   DELETE FROM auth.users WHERE email = 'tu-email@test.com';
   ```

2. **Eliminar el perfil de la tabla users**:
   ```sql
   DELETE FROM users WHERE email = 'tu-email@test.com';
   ```

3. **Crear cuenta de nuevo**:
   - Ahora podrás crear una cuenta nueva con ese email
   - Completa el onboarding completo

---

## 🔬 VERIFICACIÓN EN SUPABASE

### Paso 1: Verificar si el usuario existe en Auth
```sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'tu-email@test.com';
```

**Resultados posibles:**
- ✅ **1 fila**: Usuario existe en Auth → El problema es la contraseña incorrecta
- ❌ **0 filas**: Usuario NO existe en Auth → Crear cuenta nueva o resetear

### Paso 2: Verificar si el usuario existe en tabla users
```sql
SELECT 
  email,
  name,
  target_calories,
  target_protein,
  target_carbs,
  target_fat,
  created_at
FROM users
WHERE email = 'tu-email@test.com';
```

**Resultados posibles:**
- ✅ **1 fila con datos completos**: Perfil completo existe
- ✅ **1 fila con datos NULL**: Perfil incompleto (onboarding no terminado)
- ❌ **0 filas**: No existe perfil

### Paso 3: Interpretación de resultados

| Auth? | Perfil? | Diagnóstico | Solución |
|-------|---------|-------------|----------|
| ✅ Sí | ✅ Sí completo | Contraseña incorrecta | Resetear contraseña o crear cuenta nueva |
| ✅ Sí | ❌ No | Onboarding no terminado | Iniciar sesión y completar onboarding |
| ❌ No | ✅ Sí | Signup falló (bug antiguo) | Eliminar perfil y crear cuenta nueva |
| ❌ No | ❌ No | Usuario no existe | Crear cuenta nueva |

---

## 🚀 INSTRUCCIONES PASO A PASO

### Si NO tienes acceso a Supabase Dashboard:

**Simplemente crea una cuenta nueva con un email diferente:**
```
Email antiguo: test@test.com (problemático)
Email nuevo: test2@test.com (funcional) ✅
```

### Si SÍ tienes acceso a Supabase Dashboard:

**1. Ejecuta las queries de verificación** (arriba)

**2. Según los resultados:**

- **Si el usuario existe en Auth:**
  ```
  → Verifica que la contraseña sea correcta
  → O resetea la contraseña desde Supabase Dashboard
  ```

- **Si el usuario NO existe en Auth pero SÍ en perfil:**
  ```sql
  -- Elimina el perfil huérfano
  DELETE FROM users WHERE email = 'tu-email@test.com';
  
  -- Ahora crea la cuenta de nuevo desde la app
  ```

- **Si el usuario NO existe en ningún lado:**
  ```
  → Simplemente crea la cuenta desde la app
  ```

---

## 🔧 MEJORAS IMPLEMENTADAS

### 1. Logs mejorados en el servidor (`/supabase/functions/server/index.tsx`)
```typescript
[POST /auth/signin] ===== SIGNIN ATTEMPT =====
[POST /auth/signin] Email: test@test.com
[POST /auth/signin] 🔐 Attempting to sign in with Supabase Auth...
[POST /auth/signin] ❌ Auth error: Invalid login credentials
[POST /auth/signin] Error code: invalid_credentials
[POST /auth/signin] Error status: 400
```

### 2. Mensaje mejorado en el frontend (`/src/app/App.tsx`)
```typescript
alert(
  `❌ Error al iniciar sesión\n\n` +
  `Credenciales inválidas. Verifica tu email y contraseña.\n\n` +
  `💡 Sugerencias:\n` +
  `• Verifica que tu email sea correcto\n` +
  `• Verifica que tu contraseña sea correcta\n` +
  `• Si olvidaste tu contraseña, contáctanos\n` +
  `• Si no tienes cuenta, haz clic en "Crear cuenta"`
);
```

---

## 📋 TEMPLATE PARA REPORTAR

Si el problema persiste, reporta con esta información:

```
## Email usado:
tu-email@test.com

## Query 1: Usuario en Auth
SELECT * FROM auth.users WHERE email = 'tu-email@test.com';
Resultado: [PEGAR AQUÍ]

## Query 2: Usuario en tabla users
SELECT * FROM users WHERE email = 'tu-email@test.com';
Resultado: [PEGAR AQUÍ]

## Contraseña usada:
[Confirma que la contraseña tiene al menos 6 caracteres]

## Logs del servidor:
[PEGAR logs desde "SIGNIN ATTEMPT" hasta el error]
```

---

## ⚠️ IMPORTANTE: PREVENCIÓN FUTURA

Este problema NO debería volver a ocurrir con cuentas nuevas porque:

1. ✅ `saveUser` ahora lanza error si falla (no retorna `true` silenciosamente)
2. ✅ `handlePreferencesComplete` detecta el error y no redirige al Dashboard
3. ✅ El usuario ve el mensaje de error y puede reintentarlo
4. ✅ Solo se completa el onboarding si los datos se guardan exitosamente

**Para cuentas antiguas creadas antes del fix:**
- ✅ Elimínalas manualmente de Supabase
- ✅ Crea cuentas nuevas
- ✅ Las nuevas cuentas funcionarán correctamente

---

## 🎯 ACCIÓN RECOMENDADA

**OPCIÓN A (Más rápido):**
1. Usa un email diferente
2. Crea cuenta nueva
3. Completa onboarding
4. ✅ Todo funcionará

**OPCIÓN B (Si necesitas ese email específico):**
1. Ejecuta queries de verificación
2. Elimina usuario de Auth y tabla users
3. Crea cuenta de nuevo
4. ✅ Todo funcionará

---

**Última actualización:** 2026-01-09  
**Estado:** ⚠️ Problema conocido con cuentas antiguas - Solucionado para cuentas nuevas  
**Siguiente paso:** Verificar datos en Supabase o crear cuenta nueva
