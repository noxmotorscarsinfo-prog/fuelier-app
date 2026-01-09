# ✅ SOLUCIÓN - Error 401 al Guardar Usuario

## 🔴 PROBLEMA

Después del signup exitoso, al terminar el onboarding y guardar el perfil, aparece:

```
❌ Error 401 al guardar usuario
❌ Auth token: Present
```

**LOGS:**
```
fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/user:1 
Failed to load resource: the server responded with a status of 401 ()

[API] 📡 Response status: 401
[API] ❌ Error al guardar usuario en backend
[API] Status: 401
[API] Error: Unknown error
```

---

## 🔍 CAUSA RAÍZ

El endpoint `/make-server-b0e879f0/user` (POST) **NO estaba validando el token de autenticación**.

### **CÓDIGO ANTERIOR:**

```typescript
app.post("/make-server-b0e879f0/user", async (c) => {
  const user = await c.req.json();
  
  // ❌ NO HAY VERIFICACIÓN DE TOKEN
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Buscaba el usuario por email sin verificar auth
  const authUser = authUsers.users.find(u => u.email === user.email);
  
  // Guardaba directamente
  await supabase.from('users').upsert(dbUser);
});
```

**PROBLEMAS:**
1. ❌ No verifica el header `Authorization`
2. ❌ No valida que el token sea válido
3. ❌ Cualquiera podría modificar el perfil de cualquier usuario
4. ❌ Riesgo de seguridad grave

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **CÓDIGO NUEVO:**

```typescript
app.post("/make-server-b0e879f0/user", async (c) => {
  const user = await c.req.json();
  
  // ✅ PASO 1: Verificar que haya header de autenticación
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    console.error("SAVE USER - No authorization header");
    return c.json({ error: "No authorization header" }, 401);
  }
  
  const accessToken = authHeader.replace('Bearer ', '');
  
  // ✅ PASO 2: Verificar que el token sea válido
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: authData, error: authCheckError } = await supabase.auth.getUser(accessToken);
  
  if (authCheckError || !authData.user) {
    console.error("SAVE USER - Invalid token:", authCheckError?.message);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  
  console.log("SAVE USER - Authenticated user ID:", authData.user.id);
  
  // ✅ PASO 3: Verificar que el email coincida
  if (authData.user.email !== user.email) {
    console.error("SAVE USER - Email mismatch");
    return c.json({ error: "Email mismatch" }, 403);
  }
  
  // ✅ PASO 4: Guardar usando el ID del usuario autenticado
  const dbUser = {
    id: authData.user.id, // ID del token, NO del body
    email: user.email,
    name: user.name,
    // ... resto de campos
  };
  
  await supabase.from('users').upsert(dbUser);
});
```

---

## 📊 FLUJO COMPLETO

### **1. Signup**

```
FRONTEND:
[API] Signing up: test@example.com

BACKEND:
SIGNUP - Creating user in Auth...
SIGNUP - User created, ID: abc123
SIGNUP - Testing login...
SIGNUP - SUCCESS! Returning token

FRONTEND:
[API] Signup successful
[API] Setting auth token: eyJhbGciOiJIUzI1Ni...
```

✅ **Token guardado en:**
- Variable en memoria: `accessToken`
- LocalStorage: `fuelier_auth_token`

---

### **2. Onboarding**

```
FRONTEND:
(Usuario completa los pasos)
```

---

### **3. Guardar Perfil (NUEVO)**

```
FRONTEND:
[API] 💾 Guardando usuario: test@example.com
[API] 🔑 Current auth token: eyJhbGciOiJIUzI1Ni...

REQUEST:
POST /user
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1Ni...
  Content-Type: application/json
Body:
  { email, name, sex, age, ... }

BACKEND:
SAVE USER - Email: test@example.com
SAVE USER - Authenticated user ID: abc123
SAVE USER - Auth verified, proceeding to save
SAVE USER - Upserting to database...
SAVE USER - SUCCESS

FRONTEND:
[API] 📡 Response status: 200
[API] ✅ Usuario guardado exitosamente
✅ User profile saved successfully to database
```

---

## 🚀 DESPLEGAR LA SOLUCIÓN

```bash
supabase functions deploy make-server-b0e879f0
```

---

## ✅ VERIFICACIÓN

### **Test 1: Signup + Onboarding Completo**

1. Abre la app
2. Crea una cuenta nueva: `test-401@example.com`
3. Completa el onboarding
4. **Verifica en la consola:**

```
✅ [API] 🔑 Current auth token: eyJhbGciOiJIUzI1Ni... (no "NO TOKEN")
✅ SAVE USER - Authenticated user ID: abc123
✅ SAVE USER - Auth verified, proceeding to save
✅ SAVE USER - SUCCESS
✅ [API] 📡 Response status: 200 (no 401)
✅ ✅ User profile saved successfully to database
```

---

### **Test 2: Sin Token (Error Esperado)**

1. Abre la consola del navegador
2. Ejecuta: `localStorage.removeItem('fuelier_auth_token')`
3. Intenta cambiar algo en el perfil
4. **Verifica:**

```
❌ [API] 🔑 Current auth token: NO TOKEN
❌ SAVE USER - No authorization header
❌ [API] 📡 Response status: 401
```

---

### **Test 3: Token Inválido (Error Esperado)**

1. Abre la consola del navegador
2. Ejecuta: `localStorage.setItem('fuelier_auth_token', 'fake-token-123')`
3. Intenta cambiar algo en el perfil
4. **Verifica:**

```
❌ SAVE USER - Invalid token
❌ [API] 📡 Response status: 401
```

---

## 🔒 SEGURIDAD

### **ANTES:**
- ❌ Cualquiera podía modificar cualquier perfil
- ❌ Solo necesitabas saber el email
- ❌ Sin verificación de autenticación

### **AHORA:**
- ✅ Solo el usuario autenticado puede modificar su propio perfil
- ✅ Token validado en cada request
- ✅ Email debe coincidir con el del token
- ✅ Token expirado = Error 401
- ✅ Token inválido = Error 401
- ✅ Sin token = Error 401

---

## 📝 ARCHIVOS MODIFICADOS

1. `/supabase/functions/server/index.tsx`
   - Endpoint `/user` (POST) ahora valida autenticación

2. `/src/app/utils/api.ts`
   - Agregado logging del token en `saveUser()`

---

## 🎯 RESUMEN

| Problema | Solución |
|----------|----------|
| ❌ Error 401 al guardar perfil | ✅ Backend valida token de autenticación |
| ❌ Endpoint sin seguridad | ✅ Token verificado en cada request |
| ❌ "Auth token: Present" pero falla | ✅ Token validado con `getUser()` |
| ❌ Sin logs de debugging | ✅ Logs detallados en backend |

---

## 🚀 DEPLOY Y PRUEBA

```bash
# 1. Deploy del backend
supabase functions deploy make-server-b0e879f0

# 2. Verifica health
curl https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health

# 3. Crea una cuenta nueva y completa el onboarding

# 4. Verifica en la consola del navegador:
#    ✅ [API] 📡 Response status: 200
#    ✅ ✅ User profile saved successfully to database
```

---

**¡Listo para desplegar!** 🚀
