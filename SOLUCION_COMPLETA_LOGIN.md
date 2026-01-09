# ✅ SOLUCIÓN COMPLETA: Invalid Login Credentials

**Error:** `[POST /auth/signin] ❌ Auth error: Invalid login credentials`  
**Fecha:** 2026-01-09  
**Estado:** ✅ MEJORAS IMPLEMENTADAS + GUÍA COMPLETA

---

## 🎯 SOLUCIÓN INMEDIATA (NO REQUIERE SUPABASE)

### ✅ Usa un email completamente nuevo:

```bash
# ❌ NO USES estos emails si ya los probaste:
test@test.com
admin@admin.com
cualquier-email-que-ya-intentaste@test.com

# ✅ USA UN EMAIL NUEVO Y ÚNICO:
test-2026-01-09-v1@test.com
prueba-nueva-123@test.com
debug-fresh-start@test.com
```

### 📝 PASOS PARA CREAR CUENTA LIMPIA:

1. **Abre en modo incógnito** (Ctrl + Shift + N)
2. **Crea cuenta con email NUEVO**
   - Email: `test-nuevo-$(date +%s)@test.com` (usa algo único)
   - Password: mínimo 6 caracteres (ej: `test123456`)
   - Nombre: cualquier nombre
3. **Completa TODO el onboarding sin cerrar**
   - Sexo → Edad → Peso → Altura → Actividad → Objetivos → Distribución → Preferencias
4. **Verifica que llegues al Dashboard**
5. **GUARDA las credenciales** (email + password)
6. **Cierra sesión**
7. **Vuelve a iniciar sesión** con esas credenciales
8. ✅ **Debería funcionar**

---

## 🔧 MEJORAS IMPLEMENTADAS

### 1. **Logs mejorados en servidor** (`/supabase/functions/server/index.tsx`)

```typescript
[POST /auth/signin] ===== SIGNIN ATTEMPT =====
[POST /auth/signin] Email: test@test.com
[POST /auth/signin] 🔐 Attempting to sign in with Supabase Auth...
[POST /auth/signin] ❌ Auth error: Invalid login credentials
[POST /auth/signin] Error code: invalid_credentials
[POST /auth/signin] Error status: 400
```

### 2. **Mensaje mejorado en frontend** (`/src/app/App.tsx`)

Ahora cuando falla el login, el usuario ve:

```
❌ USUARIO NO ENCONTRADO

El email "test@test.com" no existe en el sistema o la contraseña es incorrecta.

━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 SOLUCIÓN RÁPIDA:
━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Si ya tienes cuenta:
   • Verifica que el email esté correcto
   • Verifica que la contraseña sea correcta

2️⃣ Si NO tienes cuenta:
   • Haz clic en "Crear cuenta"
   • Usa mínimo 6 caracteres en la contraseña

3️⃣ Si completaste el registro pero no funciona:
   • Tu cuenta puede tener un problema
   • USA UN EMAIL DIFERENTE
   • Ejemplo: test-nuevo@test.com

💡 TIP: Si sigues con problemas, usa un
email completamente diferente.
```

### 3. **Función `saveUser` corregida** (`/src/app/utils/api.ts`)

Ya implementado anteriormente - ahora lanza error cuando falla en vez de retornar `true`.

---

## 🔬 DIAGNÓSTICO CON SUPABASE (Opcional)

Si tienes acceso a Supabase Dashboard:

### Script de Diagnóstico Rápido:

```sql
-- Ejecuta en SQL Editor de Supabase
-- Cambia 'test@test.com' por tu email

DO $$
DECLARE
    target_email TEXT := 'test@test.com'; -- ⚠️ CAMBIA ESTO
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 DIAGNÓSTICO: %', target_email;
    RAISE NOTICE '========================================';
    
    -- Verificar Auth
    PERFORM email FROM auth.users WHERE email = target_email;
    IF FOUND THEN
        RAISE NOTICE '✅ Existe en auth.users';
        RAISE NOTICE '   → Las credenciales están mal escritas';
    ELSE
        RAISE NOTICE '❌ NO existe en auth.users';
        RAISE NOTICE '   → Debes crear la cuenta de nuevo';
    END IF;
    
    -- Verificar Users
    PERFORM email FROM users WHERE email = target_email;
    IF FOUND THEN
        RAISE NOTICE '✅ Existe en tabla users';
    ELSE
        RAISE NOTICE '❌ NO existe en tabla users';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
```

### Script de Limpieza (Eliminar usuario específico):

```sql
-- ⚠️ CAMBIA EL EMAIL
DO $$
DECLARE
    target_email TEXT := 'test@test.com'; -- ⚠️ CAMBIA ESTO
BEGIN
    DELETE FROM auth.users WHERE email = target_email;
    DELETE FROM users WHERE email = target_email;
    
    RAISE NOTICE '✅ Usuario eliminado: %', target_email;
    RAISE NOTICE '👉 Ahora puedes crear la cuenta de nuevo';
END $$;
```

### Script de Limpieza Total (Eliminar TODOS los usuarios de prueba):

```sql
-- ⚠️ ESTO ELIMINA TODO EXCEPTO ADMINS
DO $$
DECLARE
    admin_emails TEXT[] := ARRAY['admin@fuelier.com', 'admin@admin.com'];
    deleted INT;
BEGIN
    SELECT COUNT(*) INTO deleted FROM auth.users WHERE email != ALL(admin_emails);
    
    DELETE FROM auth.users WHERE email != ALL(admin_emails);
    DELETE FROM users WHERE email != ALL(admin_emails);
    
    RAISE NOTICE '🧹 Eliminados % usuario(s) de prueba', deleted;
    RAISE NOTICE '✅ Base de datos limpia';
END $$;
```

---

## 📊 TABLA DE DIAGNÓSTICO

| Auth? | Users? | Diagnóstico | Solución |
|-------|--------|-------------|----------|
| ❌ No | ❌ No | Usuario no existe | Crear cuenta nueva |
| ❌ No | ✅ Sí | Bug antiguo (perfil huérfano) | Eliminar perfil y crear cuenta nueva |
| ✅ Sí | ❌ No | Onboarding incompleto | Iniciar sesión y completar onboarding |
| ✅ Sí | ✅ Sí | Credenciales incorrectas | Verificar email/password o crear nueva cuenta |

---

## ⚠️ IMPORTANTE: Por qué pasa esto

### Problema con cuentas antiguas (antes del fix):

```
Usuario completa signup
    ↓
Se crea en auth.users ✅
    ↓
Usuario completa onboarding
    ↓
saveUser() FALLA silenciosamente 🐛
    ↓
Retorna TRUE (bug antiguo)
    ↓
App piensa que se guardó
    ↓
Usuario ve Dashboard
    ↓
Al volver a entrar → ❌ Error (perfil no existe)
```

### Con el fix actual (cuentas nuevas):

```
Usuario completa signup
    ↓
Se crea en auth.users ✅
    ↓
Usuario completa onboarding
    ↓
saveUser() FALLA
    ↓
Lanza ERROR ✅
    ↓
Muestra mensaje de error
    ↓
NO redirige al Dashboard
    ↓
Usuario puede reintentar
```

---

## ✅ VERIFICACIÓN: ¿Funcionó?

Después de crear una cuenta nueva, verifica:

### ✅ Checklist de Éxito:

1. [ ] ¿Viste el mensaje "✅ Signup successful" en consola?
2. [ ] ¿Completaste TODO el onboarding (8 pasos)?
3. [ ] ¿Viste "✅ Usuario guardado exitosamente" en consola?
4. [ ] ¿Llegaste al Dashboard?
5. [ ] ¿Guardaste las credenciales (email + password)?
6. [ ] ¿Cerraste sesión?
7. [ ] ¿Volviste a iniciar sesión con las MISMAS credenciales?
8. [ ] ¿Llegaste al Dashboard sin repetir onboarding?

Si TODOS son ✅ → **¡Funciona perfectamente!**

---

## 🚨 SI AÚN FALLA DESPUÉS DE TODO

Si después de:
- ✅ Usar un email completamente nuevo
- ✅ Completar el onboarding completo
- ✅ Ver el mensaje "Usuario guardado exitosamente"
- ✅ Llegar al Dashboard
- ❌ **Aún así falla al volver a iniciar sesión**

Entonces hay un problema más profundo. Reporta con:

### 📋 Template de Reporte:

```markdown
## Datos del test:
- Email usado: test-nuevo-XXXX@test.com
- Password: [Confirma que tiene mínimo 6 caracteres]
- Modo incógnito: ✅ Sí

## Logs del signup (consola del navegador):
[handleSignup] Attempting signup for: ...
[handleSignup] Signup successful, starting onboarding
[Copiar TODOS los logs desde aquí]

## Logs del onboarding (consola del navegador):
[handlePreferencesComplete] ...
[API] 💾 Guardando usuario: ...
[API] ✅ Usuario guardado exitosamente en backend: ...
[Copiar TODOS los logs]

## Logs del signin (consola del navegador):
[handleLogin] ===== INICIANDO LOGIN =====
[handleLogin] Email: ...
[Copiar TODOS los logs hasta el error]

## Logs del servidor (Supabase Logs):
[POST /auth/signin] ===== SIGNIN ATTEMPT =====
[POST /auth/signin] Email: ...
[POST /auth/signin] ❌ Auth error: Invalid login credentials
[Copiar TODOS los logs]

## Query en Supabase:
SELECT email, created_at FROM auth.users 
WHERE email = 'test-nuevo-XXXX@test.com';

Resultado: [PEGAR AQUÍ]
```

---

## 📚 DOCUMENTOS RELACIONADOS

- [PROBLEMA_ONBOARDING_SOLUCION.md](PROBLEMA_ONBOARDING_SOLUCION.md) - Fix de saveUser
- [ERROR_INVALID_CREDENTIALS.md](ERROR_INVALID_CREDENTIALS.md) - Guía detallada
- [DIAGNOSTICO_USUARIO.md](DIAGNOSTICO_USUARIO.md) - Scripts de diagnóstico
- [DEBUG_LOGIN_ONBOARDING.md](DEBUG_LOGIN_ONBOARDING.md) - Debug del flujo completo

---

## 🎯 RESUMEN EJECUTIVO

### Para usuarios SIN acceso a Supabase:
```bash
1. Usa email completamente nuevo
2. Crea cuenta en modo incógnito
3. Completa onboarding completo
4. ✅ Debería funcionar
```

### Para usuarios CON acceso a Supabase:
```sql
1. Ejecuta script de diagnóstico
2. Si el usuario existe en Auth → Verifica credenciales
3. Si NO existe en Auth → Elimina de users y crea cuenta nueva
4. ✅ Debería funcionar
```

---

**Última actualización:** 2026-01-09  
**Estado:** ✅ MEJORAS IMPLEMENTADAS - GUÍA COMPLETA DISPONIBLE  
**Acción recomendada:** Usar email nuevo para crear cuenta limpia
