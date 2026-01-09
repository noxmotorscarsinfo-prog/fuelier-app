# 🐛 PROBLEMA: Onboarding Se Repite en Cada Login

**Fecha:** 2026-01-09  
**Estado:** ✅ PROBLEMA IDENTIFICADO Y SOLUCIONADO

---

## 🔍 DIAGNÓSTICO

### Problema Reportado:
Usuario completa el onboarding, cierra sesión, vuelve a iniciar sesión, y **el sistema le obliga a repetir el onboarding** otra vez.

### Causa Raíz Identificada:
El usuario **SÍ** se crea en la tabla `users` de Supabase, PERO sus datos de onboarding **NO se están guardando** correctamente.

---

## 🚨 EL BUG CRÍTICO

### En `/src/app/utils/api.ts`:

```typescript
// ❌ ANTES (CÓDIGO CON BUG):
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[API] Backend unavailable, user data saved locally only');
      console.log('[API] Details:', errorData.details || errorData.error);
      // ⚠️ BUG: Return true anyway - app can function without backend persistence
      return true;  // <-- ⚠️⚠️⚠️ PROBLEMA: SIEMPRE RETORNA TRUE AUNQUE FALLE
    }
    
    console.log(`[API] User saved successfully to backend: ${user.email}`);
    return true;
  } catch (error) {
    console.log('[API] Backend error, user data saved locally only');
    console.log('[API] Error:', error.message);
    // ⚠️ BUG: Return true - app can still function
    return true;  // <-- ⚠️⚠️⚠️ PROBLEMA: SIEMPRE RETORNA TRUE AUNQUE FALLE
  }
};
```

### ¿Qué pasaba?

1. Usuario completa el onboarding (8 pasos)
2. `handlePreferencesComplete` llama a `api.saveUser(newUser)`
3. **El servidor RECHAZA la petición** (por validación, token inválido, o cualquier error)
4. `saveUser` detecta el error PERO **retorna `true` igual** 🤯
5. `handlePreferencesComplete` piensa que se guardó exitosamente
6. Redirige al Dashboard
7. Usuario cierra sesión
8. Usuario vuelve a iniciar sesión
9. `getUser(email)` NO encuentra los datos (porque nunca se guardaron)
10. Sistema detecta que no tiene perfil completo
11. **Obliga a repetir el onboarding** 🔁

---

## ✅ LA SOLUCIÓN

### Cambio en `/src/app/utils/api.ts`:

```typescript
// ✅ DESPUÉS (CÓDIGO CORREGIDO):
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    console.log(`[API] 💾 Guardando usuario: ${user.email}`);
    console.log(`[API] 📊 Datos a guardar:`, {
      email: user.email,
      name: user.name,
      sex: user.sex,
      age: user.age,
      weight: user.weight,
      height: user.height,
      goal: user.goal,
      hasGoals: !!user.goals,
      goalCalories: user.goals?.calories
    });
    
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    
    console.log(`[API] 📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] ❌ Error al guardar usuario en backend');
      console.error('[API] Status:', response.status);
      console.error('[API] Error:', errorData.error || errorData.details || 'Unknown error');
      
      // ✅ CRÍTICO: NO retornar true si falló - lanzar error
      throw new Error(errorData.error || errorData.details || `Error ${response.status}: No se pudo guardar el usuario`);
    }
    
    console.log(`[API] ✅ Usuario guardado exitosamente en backend: ${user.email}`);
    return true;
  } catch (error: any) {
    console.error('[API] ❌ Excepción al guardar usuario');
    console.error('[API] Error:', error.message);
    // ✅ CRÍTICO: Re-lanzar el error para que handlePreferencesComplete lo maneje
    throw error;
  }
};
```

### ¿Qué cambia?

1. Usuario completa el onboarding (8 pasos)
2. `handlePreferencesComplete` llama a `api.saveUser(newUser)`
3. **Si el servidor RECHAZA la petición**:
   - `saveUser` **lanza un error** (no retorna true)
   - El `catch` en `handlePreferencesComplete` captura el error
   - Se muestra un mensaje: **"❌ Error al guardar perfil. Por favor, intenta de nuevo."**
   - El usuario **NO es redirigido al Dashboard**
   - Puede intentar completar el onboarding de nuevo
4. **Si el servidor ACEPTA la petición**:
   - `saveUser` retorna `true`
   - Usuario es redirigido al Dashboard
   - Al cerrar sesión y volver a entrar, sus datos están guardados ✅

---

## 📊 FLUJO ANTES VS DESPUÉS

### ❌ ANTES (CON BUG):
```
Usuario completa onboarding
    ↓
Llama api.saveUser()
    ↓
Servidor responde 400 (error de validación)
    ↓
saveUser retorna TRUE (ignora el error)
    ↓
App piensa que se guardó
    ↓
Redirige a Dashboard
    ↓
Usuario cierra sesión
    ↓
Usuario vuelve a iniciar sesión
    ↓
getUser() NO encuentra datos (porque no se guardaron)
    ↓
❌ OBLIGA A REPETIR ONBOARDING
```

### ✅ DESPUÉS (CORREGIDO):
```
Usuario completa onboarding
    ↓
Llama api.saveUser()
    ↓
Servidor responde 400 (error de validación)
    ↓
saveUser LANZA ERROR (no retorna true)
    ↓
catch en handlePreferencesComplete captura error
    ↓
Muestra mensaje: "❌ Error al guardar perfil. Por favor, intenta de nuevo."
    ↓
Usuario NO es redirigido (puede reintentarse)
    ↓
Usuario corrige el problema e intenta de nuevo
    ↓
Servidor responde 200 OK
    ↓
saveUser retorna TRUE
    ↓
✅ Redirige a Dashboard
    ↓
Al volver a iniciar sesión, los datos ESTÁN guardados
    ↓
✅ VA DIRECTO AL DASHBOARD (no repite onboarding)
```

---

## 🔧 ARCHIVOS MODIFICADOS

### 1. `/src/app/utils/api.ts`
- ✅ `saveUser` ahora lanza error cuando falla
- ✅ Logs detallados de qué datos se están guardando
- ✅ Logs del status de la respuesta
- ✅ Logs del error específico

### 2. `/src/app/App.tsx` (ya estaba bien)
- ✅ `handlePreferencesComplete` ya tenía el `catch` correcto
- ✅ Ya mostraba mensaje de error al usuario
- ✅ Ya evitaba redirigir si fallaba

---

## 📝 LOGS ESPERADOS AHORA

### ✅ Caso Exitoso:
```
[API] 💾 Guardando usuario: test@test.com
[API] 📊 Datos a guardar: { email, name, sex, age, weight, height, goal, hasGoals: true, goalCalories: 2000 }
[API] 📡 Response status: 200
[POST /user] ✅ Validaciones pasadas, guardando usuario: test@test.com
[POST /user] User saved successfully to users table: test@test.com with ID: abc123
[API] ✅ Usuario guardado exitosamente en backend: test@test.com
```

### ❌ Caso con Error (ahora se detecta correctamente):
```
[API] 💾 Guardando usuario: test@test.com
[API] 📊 Datos a guardar: { ... }
[API] 📡 Response status: 400
[API] ❌ Error al guardar usuario en backend
[API] Status: 400
[API] Error: Edad debe estar entre 15 y 100 años
[API] ❌ Excepción al guardar usuario
[API] Error: Edad debe estar entre 15 y 100 años
❌ Error al guardar perfil. Por favor, intenta de nuevo.
```

---

## 🎯 POSIBLES CAUSAS DEL ERROR ORIGINAL

Ahora que el error se va a mostrar correctamente, veremos el error real. Probablemente sea uno de estos:

### Causa 1: Validación de datos (más probable)
```
Error: Edad debe estar entre 15 y 100 años
Error: Peso debe estar entre 30 y 300 kg
Error: Altura debe estar entre 100 y 250 cm
Error: Nombre es requerido
```
**Solución:** Verificar que todos los datos del onboarding son válidos

### Causa 2: Token de auth inválido
```
Error 401: Unauthorized
```
**Solución:** Verificar que el token se guarda correctamente después del signup

### Causa 3: Permisos RLS en Supabase
```
Error: new row violates row-level security policy
```
**Solución:** Ajustar políticas de RLS en la tabla `users`

### Causa 4: Usuario ya existe
```
Error: duplicate key value violates unique constraint "users_pkey"
```
**Solución:** Verificar que no se intente crear el mismo usuario dos veces

---

## 🚀 PRÓXIMOS PASOS

### 1. Hacer Deploy
Haz deploy de estos cambios a production.

### 2. Probar con Cuenta Nueva
1. Abre la app en **modo incógnito**
2. Abre **DevTools** (F12) → Console
3. Crea cuenta: `debug-test-${random}@test.com`
4. Completa el onboarding
5. **MIRA LOS LOGS EN LA CONSOLA**
6. Si hay error, copia TODO el mensaje de error
7. Si no hay error, cierra sesión y vuelve a entrar
8. Debería ir directo al Dashboard ✅

### 3. Si Sigue Fallando
Si después de este fix sigue obligando a repetir el onboarding:

1. **Copia todos los logs de la consola** (desde "Guardando usuario" hasta el error)
2. **Ejecuta esta query en Supabase**:
   ```sql
   SELECT * FROM users WHERE email = 'tu-email@test.com';
   ```
3. **Envíame**:
   - Los logs completos
   - El resultado de la query
   - El mensaje de error exacto que se mostró

---

## ✅ RESULTADO ESPERADO

Después de este fix:

- ✅ Si hay un error al guardar, el usuario LO VERÁ
- ✅ Si hay un error al guardar, NO será redirigido al Dashboard
- ✅ Si NO hay error, los datos se guardan correctamente
- ✅ Al volver a iniciar sesión, va directo al Dashboard
- ✅ NO se repite el onboarding

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [REVISION_FINAL_COMPLETA.md](REVISION_FINAL_COMPLETA.md) - Problemas 1-4
- [REVISION_PROFUNDA_ADICIONAL.md](REVISION_PROFUNDA_ADICIONAL.md) - Problemas 5-6
- [DEBUG_LOGIN_ONBOARDING.md](DEBUG_LOGIN_ONBOARDING.md) - Instrucciones de debug

---

**Última actualización:** 2026-01-09  
**Estado:** ✅ PROBLEMA SOLUCIONADO - LISTO PARA DEPLOY  
**Siguiente paso:** Hacer deploy y probar con cuenta nueva
