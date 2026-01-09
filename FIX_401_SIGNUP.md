# 🔧 FIX: Error 401 al guardar perfil después de signup

**Fecha:** 2026-01-09  
**Problema:** Usuario crea cuenta exitosamente pero al completar onboarding da error 401  
**Solución:** Retornar y guardar el access_token después del signup

---

## 🐛 PROBLEMA IDENTIFICADO

### **Error reportado:**
```
Failed to load resource: the server responded with a status of 401 ()
[API] ❌ Error al guardar usuario en backend
[API] Status: 401
[API] Error: Error 401: No se pudo guardar el usuario
```

### **Flujo que fallaba:**

```
1. Usuario completa signup
   → POST /auth/signup
   → ✅ Usuario creado exitosamente
   → ❌ NO se retornaba access_token
   
2. Usuario completa onboarding (6 pantallas)
   → Datos guardados en tempData (estado local)
   
3. Usuario llega a la última pantalla (distribución de comidas)
   → POST /user (guardar perfil completo)
   → ❌ Request va con publicAnonKey en lugar de access_token
   → ❌ Servidor responde: 401 Unauthorized
```

---

## ✅ CAUSA RAÍZ

### **Backend (Servidor):**

El endpoint `/auth/signup` hacía un **test de login** para verificar que el usuario puede iniciar sesión:

```typescript
// Línea 126-131
const { data: testLogin, error: testLoginError } = await testSupabase.auth.signInWithPassword({
  email,
  password
});
```

**Pero NO retornaba el access_token:**

```typescript
// ❌ ANTES (línea 161-168):
return c.json({ 
  success: true, 
  user: {
    id: authData.user.id,
    email: authData.user.email,
    name
  }
  // ❌ Falta: access_token
});
```

### **Frontend (API):**

La función `signup()` no esperaba ni guardaba el token:

```typescript
// ❌ ANTES:
console.log(`[API] Signup successful for: ${email}`);
return { success: true, user: data.user };
// ❌ NO guardaba el token
```

### **Resultado:**

Cuando el usuario completaba onboarding y se intentaba guardar el perfil:

```typescript
// POST /user usa getHeaders()
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}` // ← usaba publicAnonKey
  };
};
```

El servidor recibe `publicAnonKey` pero requiere un `access_token` de usuario autenticado → **401**

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1. Backend - Retornar access_token en signup**

**Archivo:** `/supabase/functions/server/index.tsx`

```typescript
// ✅ DESPUÉS (línea 157-169):
console.log(`[POST /auth/signup] ✅ Login test SUCCESSFUL!`);
console.log(`[POST /auth/signup] 🎉 SIGNUP COMPLETE AND VERIFIED - User can now login`);
console.log(`[POST /auth/signup] Note: User profile will be created after onboarding completion`);

return c.json({ 
  success: true, 
  access_token: testLogin.session.access_token, // ✅ NUEVO: Retornar token
  user: {
    id: authData.user.id,
    email: authData.user.email,
    name
  }
});
```

**Beneficios:**
- Ya teníamos el token del test de login
- Solo faltaba retornarlo al frontend
- El usuario queda autenticado inmediatamente después del signup

---

### **2. Frontend - Guardar access_token después de signup**

**Archivo:** `/src/app/utils/api.ts`

```typescript
// ✅ DESPUÉS (línea 39-70):
export const signup = async (email: string, password: string, name: string): Promise<{ 
  success: boolean; 
  error?: string; 
  code?: string; 
  access_token?: string; // ✅ NUEVO: Tipo incluye access_token
  user?: any 
}> => {
  try {
    console.log(`[API] Signing up: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API] Signup failed:', data);
      return { 
        success: false, 
        error: data.error || data.details || 'Failed to sign up',
        code: data.code
      };
    }
    
    console.log(`[API] Signup successful for: ${email}`);
    
    // ✅ NUEVO: Guardar el token de autenticación
    if (data.access_token) {
      console.log(`[API] Setting auth token after signup`);
      setAuthToken(data.access_token); // ← Guarda en localStorage
    }
    
    return { success: true, access_token: data.access_token, user: data.user };
  } catch (error) {
    console.error('[API] Error in signup:', error);
    return { success: false, error: 'Failed to sign up. Connection error.' };
  }
};
```

**Beneficios:**
- Guarda el token automáticamente después del signup
- El usuario NO necesita hacer login manual
- Todas las peticiones siguientes van con el token correcto

---

## ✅ FLUJO ACTUALIZADO

### **Nuevo flujo (correcto):**

```
1. Usuario completa signup
   → POST /auth/signup
   → ✅ Servidor crea usuario
   → ✅ Servidor hace test de login
   → ✅ Servidor retorna: { success: true, access_token, user }
   → ✅ Frontend guarda token en localStorage
   
2. Usuario completa onboarding (6 pantallas)
   → Datos guardados en tempData (estado local)
   
3. Usuario llega a la última pantalla
   → POST /user (guardar perfil completo)
   → ✅ Request va con access_token del usuario
   → ✅ Servidor valida token
   → ✅ Servidor guarda perfil
   → ✅ Usuario ve el Dashboard
```

---

## 📊 ANTES vs DESPUÉS

### **ANTES (con error):**

| Paso | Acción | Token usado | Resultado |
|------|--------|-------------|-----------|
| 1 | Signup | - | ✅ Usuario creado |
| 2 | Onboarding | - | ✅ Datos en estado local |
| 3 | Guardar perfil | `publicAnonKey` | ❌ 401 Unauthorized |

### **DESPUÉS (correcto):**

| Paso | Acción | Token usado | Resultado |
|------|--------|-------------|-----------|
| 1 | Signup | - | ✅ Usuario creado + Token guardado |
| 2 | Onboarding | `access_token` | ✅ Datos en estado local |
| 3 | Guardar perfil | `access_token` | ✅ Perfil guardado |

---

## 🎯 ARCHIVOS MODIFICADOS

### **1. Backend:**
- `/supabase/functions/server/index.tsx` (línea 162)
  - ✅ Agregado: `access_token: testLogin.session.access_token`

### **2. Frontend:**
- `/src/app/utils/api.ts` (líneas 39-70)
  - ✅ Tipo de retorno incluye `access_token`
  - ✅ Guardar token con `setAuthToken()`
  - ✅ Retornar token al llamador

---

## ✅ VERIFICACIÓN

### **Para confirmar que funciona:**

1. **Crear cuenta nueva:**
   ```
   Email: test-fix@example.com
   Password: password123
   Nombre: Test User
   ```

2. **Ver en Consola del navegador:**
   ```
   [API] Signup successful for: test-fix@example.com
   [API] Setting auth token after signup    ← ✅ NUEVO LOG
   ```

3. **Completar onboarding (6 pantallas)**

4. **Al llegar al Dashboard:**
   ```
   [API] 📡 Guardando usuario en backend...
   [API] 📡 Response status: 200    ← ✅ NO más 401
   [API] ✅ Usuario guardado correctamente
   ```

5. **Verificar en localStorage:**
   ```javascript
   console.log(localStorage.getItem('fuelier_auth_token'));
   // Debe retornar: "eyJ..." (token de Supabase)
   ```

---

## 🚀 DEPLOYMENT NECESARIO

### ⚠️ **SÍ, necesitas hacer deploy para que funcione:**

**Razón:**
- Modificamos el servidor (`/supabase/functions/server/index.tsx`)
- Modificamos el frontend (`/src/app/utils/api.ts`)
- Ambos cambios son necesarios para el flujo completo

**Pasos:**
1. Commit de cambios
2. Deploy del servidor (Supabase Edge Function)
3. Deploy del frontend (Vercel/Netlify)
4. Probar signup completo

---

## 📝 NOTAS TÉCNICAS

### **¿Por qué el test de login?**

El signup incluye un test de login para **verificar que el usuario realmente puede iniciar sesión**:

```typescript
// Verificación automática
const testLogin = await supabase.auth.signInWithPassword({ email, password });

if (testLoginError) {
  // Si no puede hacer login, eliminar el usuario
  await supabase.auth.admin.deleteUser(authData.user.id);
  return error;
}
```

**Beneficios:**
- Garantiza que si signup retorna success, el usuario PUEDE hacer login
- Elimina automáticamente usuarios en estado inconsistente
- Aprovechamos el token del test para autenticar inmediatamente

---

### **¿Por qué usar el token del test y no crear una sesión nueva?**

**Opción A (la que usamos):** Usar el token del test de login
```typescript
access_token: testLogin.session.access_token
```

**Ventajas:**
- ✅ Ya lo teníamos
- ✅ No requiere código adicional
- ✅ Más eficiente

**Opción B:** Crear una sesión nueva
```typescript
const { data: session } = await supabase.auth.admin.createSession({ user_id: authData.user.id });
access_token: session.access_token
```

**Desventajas:**
- ❌ Requiere llamada adicional a Supabase
- ❌ Más lento
- ❌ No agrega valor (ya tenemos el token)

---

## ✅ CONCLUSIÓN

### **Problema:**
- Usuario se creaba pero NO quedaba autenticado
- Al guardar perfil → 401 Unauthorized

### **Solución:**
- Retornar `access_token` en signup
- Guardar token automáticamente
- Usuario queda autenticado inmediatamente

### **Resultado:**
- ✅ Signup funciona de principio a fin
- ✅ NO más error 401
- ✅ Usuario puede completar onboarding y usar la app
- ✅ UX mejorada (no necesita hacer login manual)

---

**Estado:** ✅ FIXED - Requiere deployment  
**Archivos modificados:** 2  
**Impacto:** CRÍTICO (sin esto el signup no funciona)  
**Test:** Crear cuenta nueva y completar onboarding

---

**Última actualización:** 2026-01-09
