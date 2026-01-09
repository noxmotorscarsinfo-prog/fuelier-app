# 🔍 DEBUG: Error al Crear Cuenta

**Fecha:** 2026-01-09  
**Problema:** Usuario intenta crear cuenta y da error

---

## 🎯 PASOS PARA DIAGNOSTICAR

### **1. Abrir Consola del Navegador**

**Chrome/Edge/Firefox:**
1. Presiona `F12` o `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)
2. Ve a la pestaña **"Console"**
3. Limpia la consola (ícono de 🚫 o 🗑️)
4. Intenta crear cuenta de nuevo
5. **Copia TODO el texto que aparece**

**Buscar específicamente:**
```
[handleSignup] Attempting signup for: ...
[API] Signing up: ...
[API] Signup failed: ...
```

---

### **2. Ver Error de Red**

**En la misma ventana de Developer Tools:**
1. Ve a la pestaña **"Network"** (Red)
2. Limpia (ícono de 🚫)
3. Intenta crear cuenta de nuevo
4. Busca una petición llamada **"signup"**
5. Haz clic en ella
6. Ve a **"Response"** (Respuesta)
7. **Copia el contenido**

---

### **3. Verificar URL de API**

**En la consola, escribe:**
```javascript
console.log(`API: https://${window.projectId || 'UNDEFINED'}.supabase.co/functions/v1/make-server-b0e879f0/auth/signup`)
```

**Debe mostrar algo como:**
```
API: https://abc123xyz.supabase.co/functions/v1/make-server-b0e879f0/auth/signup
```

---

## 🔍 POSIBLES CAUSAS DEL ERROR

### **A. Error de Red (CORS o Timeout)**

**Síntomas:**
- Error: `Failed to fetch`
- Error: `CORS policy`
- Error: `net::ERR_FAILED`

**Causa:**
- El servidor Supabase Edge Function no está corriendo
- La URL está mal configurada
- Problema de red

**Solución:**
1. Verificar que la Edge Function esté desplegada en Supabase
2. Verificar la URL en `/utils/supabase/info.tsx`

---

### **B. Error de Validación**

**Síntomas:**
- Error: `Email, password and name are required`
- Error: `La contraseña debe tener al menos 6 caracteres`

**Causa:**
- Algún campo está vacío
- Password muy corta

**Solución:**
- Verificar que todos los campos estén llenos
- Password mínimo 6 caracteres

---

### **C. Error de Email Duplicado**

**Síntomas:**
- Error: `Este correo ya está registrado`
- Code: `email_exists`

**Causa:**
- Ya existe una cuenta con ese email

**Solución:**
- Usar otro email
- O hacer login con ese email

---

### **D. Error de Supabase Auth**

**Síntomas:**
- Error: `Failed to create user`
- Error: `User creation verification failed`

**Causa:**
- Problema con Supabase Auth
- Variables de entorno mal configuradas

**Solución:**
1. Verificar en Supabase Dashboard → Settings → API
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Verificar que estén configuradas en la Edge Function

---

### **E. Error de Verificación (Login Test Fallido)**

**Síntomas:**
- Error: `Account was created but login failed`
- Code: `login_test_failed`

**Causa:**
- Usuario se creó pero no puede hacer login inmediatamente
- Problema con Supabase Auth

**Solución:**
- Esperar 1 minuto y probar login manual
- Si funciona: problema temporal de Supabase
- Si NO funciona: revisar logs del servidor

---

## 📋 CHECKLIST DE VERIFICACIÓN

### **✅ Verificar Configuración**

1. **Archivo `/utils/supabase/info.tsx`:**
   ```typescript
   export const projectId = "abc123xyz"; // ← Debe tener tu project ID
   export const publicAnonKey = "eyJ..."; // ← Debe tener tu anon key
   ```

2. **Edge Function desplegada:**
   - Ir a Supabase Dashboard
   - Edge Functions → make-server-b0e879f0
   - Estado: ✅ Active

3. **Variables de entorno en Edge Function:**
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

---

### **✅ Verificar Backend**

**Probar endpoint directamente:**

```bash
# Abrir terminal o Postman

curl -X POST https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-b0e879f0/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -d '{
    "email": "test123@test.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Respuesta esperada (si funciona):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test123@test.com",
    "name": "Test User"
  }
}
```

**Si da error:**
- Copiar el mensaje de error completo

---

### **✅ Verificar Frontend**

**En la consola del navegador:**

```javascript
// 1. Verificar que la API está bien configurada
console.log(localStorage.getItem('fuelier_auth_token'));
// Debe ser null si no has hecho login

// 2. Probar signup manualmente
const testSignup = async () => {
  const response = await fetch('https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-b0e879f0/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TU_ANON_KEY'
    },
    body: JSON.stringify({
      email: 'test999@test.com',
      password: 'password123',
      name: 'Test User'
    })
  });
  
  const data = await response.json();
  console.log('Response:', data);
};

testSignup();
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### **1. "Failed to fetch"**

**Causa:** La Edge Function no está corriendo

**Solución:**
```bash
# 1. Ir a Supabase Dashboard
# 2. Edge Functions
# 3. Verificar que "make-server-b0e879f0" esté Active
# 4. Si no está, hacer deploy de nuevo
```

---

### **2. "Network request failed"**

**Causa:** Problema de CORS o red

**Solución:**
- Verificar que CORS esté habilitado en el servidor
- Verificar conexión a internet

---

### **3. "Email already registered" pero es email nuevo**

**Causa:** Existe en la base de datos de intento anterior

**Solución:**
```sql
-- Ir a Supabase Dashboard → Authentication → Users
-- Buscar el email
-- Si existe, eliminarlo
-- Intentar signup de nuevo
```

---

### **4. "User creation verification failed"**

**Causa:** Usuario se creó pero no se encuentra al verificar

**Solución:**
- Esperar 5 segundos y verificar en Supabase Auth si el usuario existe
- Si existe pero sigue dando error: problema de sincronización de Supabase
- Contactar soporte de Supabase

---

### **5. "Invalid credentials" después de signup exitoso**

**Causa:** Usuario se creó pero no se confirmó el email

**Solución:**
- El código YA incluye `email_confirm: true`
- Si sigue fallando: verificar que la Edge Function tenga el código actualizado

---

## 📝 INFORMACIÓN NECESARIA PARA DEBUG

Por favor proporciona:

1. ✅ **Mensaje exacto del error** (captura de pantalla o texto)
2. ✅ **Logs de la consola** (todo lo que aparece en Console)
3. ✅ **Response del servidor** (pestaña Network → signup → Response)
4. ✅ **Email que intentaste usar** (para verificar si existe en Supabase)
5. ✅ **¿Es la primera vez que intentas crear cuenta o ya lo habías hecho antes?**

---

## 🎯 SIGUIENTE PASO

**Por favor ejecuta estos comandos en la Consola del navegador y pégame los resultados:**

```javascript
// 1. Verificar configuración
console.log('Project ID:', window.location.hostname);

// 2. Ver si hay token guardado
console.log('Auth Token:', localStorage.getItem('fuelier_auth_token'));

// 3. Probar conexión al servidor
fetch('https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-b0e879f0/health')
  .then(r => r.json())
  .then(d => console.log('Health check:', d))
  .catch(e => console.error('Health check failed:', e));
```

**Reemplaza `TU_PROJECT_ID` con tu project ID real**

---

**Con esta información podré identificar exactamente qué está fallando** 🔍
