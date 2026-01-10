# 🔴 DEBUGGING SISTEMÁTICO - Error 401

## 📋 PASOS A SEGUIR

### **PASO 1: Verificar que el backend está deployado**

```bash
curl https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health
```

**Esperado:**
```json
{"status":"ok","timestamp":"2026-01-09T..."}
```

Si NO funciona → **El backend NO está deployado**. Ejecutar:
```bash
supabase functions deploy make-server-b0e879f0
```

---

### **PASO 2: Crear cuenta de prueba**

1. Abre la consola del navegador (F12)
2. Borra el cache y cookies
3. Recarga la página
4. Click en "Crear cuenta"
5. Email: `debug-test@example.com`
6. Password: `123456`
7. Name: `Debug Test`
8. Click en "Crear cuenta"

---

### **PASO 3: Capturar logs del navegador**

En la consola del navegador, busca estas líneas:

```
[API] Signing up: debug-test@example.com
[API] Signup successful for: debug-test@example.com
[API] Setting auth token after signup

(Completa el onboarding)

[API] 💾 Guardando usuario: debug-test@example.com
[API] 🔑 DEBUG - Full token: [COPIAR ESTE TOKEN COMPLETO]
[API] 🔑 DEBUG - Token type: string
[API] 🔑 DEBUG - Token length: [COPIAR ESTE NÚMERO]
[API] 🔑 DEBUG - Token is null?: false
[API] 🔑 DEBUG - Token from localStorage: [COPIAR ESTE TOKEN]
[API] 🔑 DEBUG - Tokens match?: true
[API] 🔑 DEBUG - Headers being sent: { Authorization: "Bearer eyJhbG...", ... }
[API] 📡 Response status: 401
```

**COPIAR:**
1. ¿Cuál es el token completo?
2. ¿Cuál es el length del token?
3. ¿Los tokens match?
4. ¿Qué headers se enviaron?

---

### **PASO 4: Capturar logs del backend**

**Opción A: Dashboard de Supabase**

1. Ve a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions/make-server-b0e879f0/logs
2. Filtra por "SAVE USER"
3. Busca los logs del intento de guardar usuario
4. **COPIAR TODO EL LOG**

**Opción B: CLI**

```bash
supabase functions logs make-server-b0e879f0 --follow
```

Mientras el comando está corriendo, intenta crear la cuenta otra vez.

**BUSCAR:**
```
SAVE USER - Email: debug-test@example.com
SAVE USER - Auth header present: [true/false]
SAVE USER - Token extracted, length: [número]
SAVE USER - Validating token with anon key...
```

**COPIAR TODO EL OUTPUT**

---

### **PASO 5: Test manual del token**

Abre la consola del navegador después del signup exitoso y ejecuta:

```javascript
// 1. Verificar que el token existe
const token = localStorage.getItem('fuelier_auth_token');
console.log('Token:', token);
console.log('Token length:', token?.length);

// 2. Verificar que el token es válido llamando al endpoint de session
fetch('https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/auth/session', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Session check:', data))
.catch(e => console.error('Session error:', e));
```

**COPIAR EL OUTPUT**

---

### **PASO 6: Test directo del endpoint /user**

```javascript
const token = localStorage.getItem('fuelier_auth_token');
const testUser = {
  email: 'debug-test@example.com',
  name: 'Debug Test',
  sex: 'male',
  age: 25,
  weight: 75,
  height: 175,
  goal: 'lose_weight',
  goals: { calories: 2000, protein: 150, carbs: 200, fat: 60 }
};

fetch('https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(testUser)
})
.then(async r => {
  console.log('Status:', r.status);
  const text = await r.text();
  console.log('Response:', text);
  return text;
})
.catch(e => console.error('Error:', e));
```

**COPIAR TODO EL OUTPUT**

---

## 🔍 ANÁLISIS

Con los datos de los 6 pasos anteriores, podemos identificar:

1. ✅ **Token existe?** → Ver PASO 3
2. ✅ **Token es válido?** → Ver PASO 5 (session check debe retornar success: true)
3. ✅ **Backend recibe el token?** → Ver PASO 4 (debe decir "Auth header present: true")
4. ✅ **Backend valida el token?** → Ver PASO 4 (debe decir "Token valid!")
5. ✅ **Test directo funciona?** → Ver PASO 6 (debe retornar 200)

---

## 🎯 POSIBLES PROBLEMAS Y SOLUCIONES

### **Problema 1: Token es null/undefined**

**Síntoma:**
```
[API] 🔑 DEBUG - Token is null?: true
```

**Solución:**
- El signup NO guardó el token correctamente
- Verificar que `setAuthToken()` se llama después del signup
- Verificar que `data.access_token` existe en la respuesta del signup

---

### **Problema 2: Token es válido pero backend dice que no**

**Síntoma:**
```
[API] 🔑 DEBUG - Token length: 234 (existe)
SAVE USER - Invalid token (backend rechaza)
```

**Solución:**
- El backend NO está usando ANON_KEY para validar
- Verificar que el backend usa `createClient(supabaseUrl, supabaseAnonKey)`
- Verificar que el backend está deployado con el código correcto

---

### **Problema 3: Backend no recibe el header**

**Síntoma:**
```
SAVE USER - Auth header present: false
```

**Solución:**
- CORS bloqueando el header
- Verificar que el backend permite el header "Authorization"
- Verificar que `getHeaders()` retorna el header correctamente

---

### **Problema 4: Token expirado**

**Síntoma:**
```
SAVE USER - Invalid token. Error: JWT expired
```

**Solución:**
- El token expiró antes de completar el onboarding
- Aumentar el tiempo de expiración del token
- O regenerar el token antes de guardar

---

## 📝 ENVÍAME ESTOS DATOS

Para que pueda ayudarte, necesito:

1. ✅ **Output del PASO 1** (health check)
2. ✅ **Output del PASO 3** (logs del navegador)
3. ✅ **Output del PASO 4** (logs del backend)
4. ✅ **Output del PASO 5** (session check)
5. ✅ **Output del PASO 6** (test directo)

Con esos datos, puedo identificar EXACTAMENTE qué está fallando.

---

## 🚀 SIGUIENTE ACCIÓN

**AHORA MISMO:**

1. Verifica que el backend esté deployado (PASO 1)
2. Crea una cuenta nueva (PASO 2)
3. Copia TODOS los logs del navegador (PASO 3)
4. Ve a los logs del backend y copia TODO (PASO 4)
5. Ejecuta el test del PASO 5 y PASO 6

**Y pégame los resultados aquí.**

Así podré ver EXACTAMENTE qué está pasando.
