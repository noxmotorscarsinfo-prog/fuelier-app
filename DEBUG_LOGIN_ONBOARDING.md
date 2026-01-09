# 🐛 DEBUG: Login Obliga a Repetir Onboarding

**Problema reportado:** Usuario completa onboarding, cierra sesión, inicia sesión nuevamente, y el sistema lo obliga a repetir el onboarding.

**Estado:** Investigando - Logs agregados para diagnóstico

---

## 🔧 CAMBIOS REALIZADOS

### 1. Mejorados los logs en `handleLogin` (App.tsx)
```typescript
// Ahora verás logs detallados como:
[handleLogin] ===== INICIANDO LOGIN =====
[handleLogin] Email: test@test.com
[handleLogin] ✅ Auth exitosa, token guardado
[handleLogin] 🔄 Cargando perfil desde base de datos...
[handleLogin] 🔍 Resultado de getUser: ✅ ENCONTRADO | ❌ NULL
[handleLogin] ✅ Perfil encontrado en base de datos
[handleLogin] 📊 Datos del usuario: { email, name, hasGoals, goalCalories }
[handleLogin] ===== FIN LOGIN =====
```

### 2. Mejorados los logs en `getUser` (api.ts)
```typescript
[API] 📥 Getting user: test@test.com
[API] Response status: 200
[API] User found in database: test@test.com
```

---

## 📋 INSTRUCCIONES PARA DEBUG

### Paso 1: Hacer Deploy de los Cambios
```bash
# Asegúrate de que los cambios estén guardados
# Haz push a production
```

### Paso 2: Limpiar Todo y Probar
1. **Abrir la aplicación en modo incógnito** (para evitar caché)
2. **Abrir DevTools** (F12) → Pestaña "Console"
3. **Crear cuenta nueva**:
   - Email: `debug-test-$(RANDOM_NUMBER)@test.com`
   - Password: `Test1234!`
   - Nombre: `Debug Test`
4. **Completar TODO el onboarding** (los 8 pasos)
5. **Verificar que llega al Dashboard**
6. **Cerrar sesión**
7. **Iniciar sesión con el mismo email y password**
8. **COPIAR TODOS LOS LOGS DE LA CONSOLA**

---

## 🔍 LOGS QUE NECESITAMOS VER

### ✅ Caso Exitoso (debería verse así):
```
[handleLogin] ===== INICIANDO LOGIN =====
[handleLogin] Email: debug-test-123@test.com
[handleLogin] ✅ Auth exitosa, token guardado
[handleLogin] 🔄 Cargando perfil desde base de datos...
[API] 📥 Getting user: debug-test-123@test.com
[API] Response status: 200
[API] User found in database: debug-test-123@test.com
[handleLogin] 🔍 Resultado de getUser: ✅ ENCONTRADO
[handleLogin] ✅ Perfil encontrado en base de datos
[handleLogin] 📊 Datos del usuario: { 
  email: "debug-test-123@test.com",
  name: "Debug Test",
  hasGoals: true,
  goalCalories: 2000
}
[handleLogin] ===== FIN LOGIN =====
```

### ❌ Caso Fallido (probablemente veremos):
```
[handleLogin] ===== INICIANDO LOGIN =====
[handleLogin] Email: debug-test-123@test.com
[handleLogin] ✅ Auth exitosa, token guardado
[handleLogin] 🔄 Cargando perfil desde base de datos...
[API] 📥 Getting user: debug-test-123@test.com
[API] Response status: 404     <-- ⚠️ PROBLEMA: Usuario no existe en tabla users
[API] User not found in database: debug-test-123@test.com
[handleLogin] 🔍 Resultado de getUser: ❌ NULL
[handleLogin] ⚠️ Perfil NO encontrado en base de datos
[handleLogin] ℹ️ Esto significa que el usuario se autenticó pero no completó el onboarding
```

---

## 🎯 POSIBLES CAUSAS

### Causa 1: Usuario no se guarda al completar onboarding
**Verificar:**
- ¿Se muestra el log `[POST /user] ✅ Validaciones pasadas, guardando usuario: ...`?
- ¿Se muestra el log `[POST /user] User saved successfully to users table: ...`?

**Solución si falla:**
- El problema está en `handlePreferencesComplete` no guardando el usuario

### Causa 2: Email con mayúsculas/minúsculas diferentes
**Verificar:**
- ¿El email en signup es `Test@Test.com`?
- ¿El email en login es `test@test.com`?
- ¿La búsqueda en la BD es case-sensitive?

**Solución si falla:**
- Normalizar emails a minúsculas en ambos lados

### Causa 3: Usuario se guarda en Auth pero NO en tabla `users`
**Verificar:**
- Logs del servidor: `[POST /user] Saving user to users table: ...`
- Logs del servidor: `[POST /user] Database error:` (si hay error)

**Solución si falla:**
- Revisar permisos de RLS en Supabase
- Revisar que la tabla `users` exista

### Causa 4: Token de auth expirado o inválido
**Verificar:**
- ¿El token se guarda correctamente después del login?
- ¿La petición `/user/:email` incluye el header `Authorization`?

**Solución si falla:**
- Verificar que `getHeaders()` retorna el token correcto

---

## 🔬 QUERIES DE DEBUG EN SUPABASE

### Verificar que el usuario existe en la tabla `users`:
```sql
SELECT 
  email,
  name,
  target_calories,
  target_protein,
  target_carbs,
  target_fat,
  created_at,
  updated_at
FROM users
WHERE email = 'debug-test-123@test.com';
```

**Resultado esperado:**
- ✅ 1 fila con todos los datos completos
- ❌ 0 filas → El usuario NO se guardó al completar onboarding

### Verificar que el usuario existe en Auth:
```sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'debug-test-123@test.com';
```

**Resultado esperado:**
- ✅ 1 fila → Usuario existe en Auth
- ❌ 0 filas → Usuario NO se creó en Auth

### Ver todos los usuarios en la tabla users:
```sql
SELECT email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10;
```

---

## 🚀 PRÓXIMOS PASOS

### 1. Hacer el test y copiar los logs
Ejecuta los pasos del "Paso 2" arriba y copia **TODOS** los logs de la consola.

### 2. Ejecutar las queries en Supabase
Ve a tu proyecto en Supabase → SQL Editor → Ejecuta las queries arriba.

### 3. Reportar los resultados
Envía:
- ✅ Logs completos de la consola del navegador
- ✅ Resultados de las queries SQL
- ✅ Email exacto que usaste para la prueba

---

## 📝 TEMPLATE PARA REPORTAR

```
## Logs del Navegador:
[Pegar aquí todos los logs desde "INICIANDO LOGIN" hasta "FIN LOGIN"]

## Resultados de SQL:
Query 1 (SELECT * FROM users WHERE email = '...'):
[Resultado]

Query 2 (SELECT * FROM auth.users WHERE email = '...'):
[Resultado]

## Email usado:
debug-test-XXX@test.com
```

---

## ✅ UNA VEZ IDENTIFICADO EL PROBLEMA

Basándome en los logs y las queries, podré decirte exactamente:

1. **Dónde está fallando** (signup, onboarding, o login)
2. **Por qué está fallando** (permiso, validación, o lógica)
3. **Cómo arreglarlo** (código específico a cambiar)

---

**IMPORTANTE:** No hagas más pruebas con cuentas reales hasta que identifiquemos el problema. Usa siempre emails de debug como `debug-test-123@test.com`.

---

**Archivo:** `/DEBUG_LOGIN_ONBOARDING.md`  
**Última actualización:** 2026-01-09  
**Estado:** 🔍 ESPERANDO LOGS PARA DIAGNÓSTICO
