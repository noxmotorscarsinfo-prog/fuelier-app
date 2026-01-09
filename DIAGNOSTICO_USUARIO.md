# 🔍 DIAGNÓSTICO: Invalid Login Credentials

**Error:** `Invalid login credentials`  
**Causa:** El usuario NO existe en Supabase Auth o la contraseña es incorrecta

---

## 🚨 SOLUCIÓN INMEDIATA (Sin acceso a Supabase)

Si **NO tienes acceso al Dashboard de Supabase**, simplemente:

### ✅ Usa un email completamente nuevo:

```
❌ NO uses: test@test.com
❌ NO uses: admin@admin.com
❌ NO uses: cualquier email que hayas usado antes

✅ USA un email nuevo:
- test-2026-01-09@test.com
- prueba-123@test.com
- debug-v2@test.com
```

### Pasos:
1. Abre la app en **modo incógnito** (Ctrl + Shift + N)
2. Haz clic en **"Crear cuenta"**
3. Usa un **email completamente nuevo**
4. Usa una contraseña de **mínimo 6 caracteres**
5. Completa el onboarding **sin cerrar la pestaña**
6. Verifica que llegues al Dashboard
7. **Guarda las credenciales** (email + password)
8. Cierra sesión
9. Vuelve a iniciar sesión con esas credenciales
10. ✅ Debería funcionar

---

## 🔬 DIAGNÓSTICO COMPLETO (Con acceso a Supabase)

Si **SÍ tienes acceso al Dashboard de Supabase**, sigue estos pasos:

### Paso 1: Ejecuta este script en SQL Editor

```sql
-- ===== SCRIPT DE DIAGNÓSTICO COMPLETO =====
-- Ejecuta todo este bloque de una vez

-- 🔍 Ver TODOS los usuarios en Auth
SELECT 
  '🔐 AUTH.USERS' as tabla,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 🔍 Ver TODOS los perfiles en tabla users
SELECT 
  '👤 USERS TABLE' as tabla,
  email,
  name,
  target_calories,
  target_protein,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 🔍 Buscar usuario específico (CAMBIA EL EMAIL)
DO $$
DECLARE
    target_email TEXT := 'test@test.com'; -- ⚠️ CAMBIA ESTO por tu email
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 BUSCANDO: %', target_email;
    RAISE NOTICE '========================================';
    
    -- Buscar en Auth
    PERFORM email FROM auth.users WHERE email = target_email;
    IF FOUND THEN
        RAISE NOTICE '✅ EXISTE en auth.users';
    ELSE
        RAISE NOTICE '❌ NO EXISTE en auth.users';
    END IF;
    
    -- Buscar en users
    PERFORM email FROM users WHERE email = target_email;
    IF FOUND THEN
        RAISE NOTICE '✅ EXISTE en tabla users';
    ELSE
        RAISE NOTICE '❌ NO EXISTE en tabla users';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
```

### Paso 2: Interpreta los resultados

**Caso A: Usuario NO existe en Auth, NO existe en Users**
```
❌ NO EXISTE en auth.users
❌ NO EXISTE en tabla users
```
**Solución:** El usuario nunca se creó. Crea una cuenta nueva.

---

**Caso B: Usuario NO existe en Auth, SÍ existe en Users**
```
❌ NO EXISTE en auth.users
✅ EXISTE en tabla users
```
**Solución:** Bug antiguo. El signup falló pero el perfil quedó huérfano.

**Acción:**
```sql
-- Elimina el perfil huérfano
DELETE FROM users WHERE email = 'test@test.com';

-- Ahora crea la cuenta de nuevo desde la app
```

---

**Caso C: Usuario SÍ existe en Auth, NO existe en Users**
```
✅ EXISTE en auth.users
❌ NO EXISTE en tabla users
```
**Solución:** El usuario se autenticó pero nunca completó el onboarding.

**Acción:**
1. Inicia sesión con ese email
2. Completará el onboarding automáticamente
3. ✅ Debería funcionar

---

**Caso D: Usuario SÍ existe en Auth, SÍ existe en Users**
```
✅ EXISTE en auth.users
✅ EXISTE en tabla users
```
**Solución:** Las credenciales están **mal escritas**.

**Acción:**
- Verifica que el email esté correcto (sin espacios, minúsculas)
- Verifica que la contraseña esté correcta (mínimo 6 caracteres)
- Si olvidaste la contraseña, elimina y crea de nuevo

---

## 🗑️ SCRIPT PARA ELIMINAR USUARIO Y EMPEZAR DE CERO

Si quieres eliminar un usuario y empezar de cero:

```sql
-- ===== ELIMINAR USUARIO ESPECÍFICO =====
-- ⚠️ CAMBIA EL EMAIL

DO $$
DECLARE
    target_email TEXT := 'test@test.com'; -- ⚠️ CAMBIA ESTO
BEGIN
    -- Eliminar de Auth
    DELETE FROM auth.users WHERE email = target_email;
    RAISE NOTICE '✅ Eliminado de auth.users: %', target_email;
    
    -- Eliminar de Users
    DELETE FROM users WHERE email = target_email;
    RAISE NOTICE '✅ Eliminado de tabla users: %', target_email;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Usuario eliminado completamente';
    RAISE NOTICE '👉 Ahora puedes crear la cuenta de nuevo';
    RAISE NOTICE '========================================';
END $$;
```

---

## 🗑️ SCRIPT PARA ELIMINAR TODOS LOS USUARIOS DE PRUEBA

Si quieres hacer una **limpieza completa** de todos los usuarios de prueba:

```sql
-- ===== LIMPIAR TODOS LOS USUARIOS DE PRUEBA =====
-- ⚠️ ESTO ELIMINA TODO EXCEPTO ADMINS

DO $$
DECLARE
    admin_emails TEXT[] := ARRAY['admin@fuelier.com', 'admin@admin.com'];
    deleted_auth INT;
    deleted_users INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧹 LIMPIEZA COMPLETA DE USUARIOS DE PRUEBA';
    RAISE NOTICE '========================================';
    
    -- Contar antes
    SELECT COUNT(*) INTO deleted_auth FROM auth.users WHERE email != ALL(admin_emails);
    SELECT COUNT(*) INTO deleted_users FROM users WHERE email != ALL(admin_emails);
    
    RAISE NOTICE '📊 Usuarios a eliminar:';
    RAISE NOTICE '   Auth: % usuario(s)', deleted_auth;
    RAISE NOTICE '   Users: % perfil(es)', deleted_users;
    
    -- Eliminar de Auth
    DELETE FROM auth.users WHERE email != ALL(admin_emails);
    RAISE NOTICE '✅ Eliminados de auth.users';
    
    -- Eliminar de Users
    DELETE FROM users WHERE email != ALL(admin_emails);
    RAISE NOTICE '✅ Eliminados de tabla users';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Limpieza completada!';
    RAISE NOTICE '👉 Ahora puedes crear cuentas nuevas';
    RAISE NOTICE '========================================';
END $$;
```

---

## ✅ CREAR USUARIO DE PRUEBA LIMPIO (DESDE CERO)

Después de eliminar, sigue estos pasos:

### 1. Abre la app en modo incógnito
```
Chrome: Ctrl + Shift + N
Firefox: Ctrl + Shift + P
Safari: Cmd + Shift + N
```

### 2. Crea cuenta con datos limpios
```
Email: test-nuevo-2026@test.com
Password: test123456 (mínimo 6 caracteres)
Nombre: Test User
```

### 3. Completa el onboarding
- **NO cierres la pestaña hasta llegar al Dashboard**
- Completa todos los pasos
- Verifica que llegues al Dashboard

### 4. Prueba el flujo completo
1. Guarda las credenciales
2. Cierra sesión (botón en Dashboard)
3. Vuelve a iniciar sesión
4. ✅ Debería funcionar

---

## 🐛 SI AÚN FALLA DESPUÉS DE TODO

Si después de:
1. Eliminar el usuario de Auth y Users
2. Crear cuenta nueva con email diferente
3. Completar onboarding completo

**Y TODAVÍA fallas al iniciar sesión**, entonces hay un problema más profundo.

**Reporta con esta información:**

```
## Datos del test:
- Email usado: test-nuevo-2026@test.com
- Password: [Confirma longitud mínimo 6 caracteres]
- Modo incógnito: ✅ Sí / ❌ No

## Logs del signup (frontend):
[handleSignup] Attempting signup for: ...
[handleSignup] Signup successful, starting onboarding
...

## Logs del onboarding (frontend):
[handlePreferencesComplete] ...
[API] 💾 Guardando usuario: ...
[API] ✅ Usuario guardado exitosamente...

## Logs del signin (servidor):
[POST /auth/signin] ===== SIGNIN ATTEMPT =====
[POST /auth/signin] Email: ...
[POST /auth/signin] ❌ Auth error: Invalid login credentials

## Query en Supabase:
SELECT email, created_at FROM auth.users WHERE email = '...';
Resultado: [PEGAR AQUÍ]
```

---

## 📋 CHECKLIST RÁPIDO

Antes de reportar, verifica:

- [ ] ¿Eliminaste el usuario viejo de Auth?
- [ ] ¿Eliminaste el usuario viejo de Users?
- [ ] ¿Estás usando un email COMPLETAMENTE NUEVO?
- [ ] ¿La contraseña tiene MÍNIMO 6 caracteres?
- [ ] ¿Estás en modo incógnito?
- [ ] ¿Completaste el onboarding COMPLETO sin cerrar la app?
- [ ] ¿Viste el mensaje "✅ Usuario guardado exitosamente" en los logs?
- [ ] ¿Llegaste al Dashboard después del onboarding?
- [ ] ¿Guardaste las credenciales correctas?
- [ ] ¿Estás usando EXACTAMENTE el mismo email y password para el login?

---

**Última actualización:** 2026-01-09  
**Estado:** ⚠️ Usuario no existe en Auth - Requiere creación de cuenta nueva  
**Acción inmediata:** Usa un email diferente y crea cuenta nueva
