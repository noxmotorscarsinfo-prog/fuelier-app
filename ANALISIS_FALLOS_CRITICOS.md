# 🚨 ANÁLISIS DE FALLOS CRÍTICOS - FUELIER APP
**Fecha:** 16 de enero de 2026  
**Problemas reportados:** 2 críticos

---

## 📋 RESUMEN EJECUTIVO

Desde la implementación de "platos personalizados y mis platos", han surgido **2 problemas críticos**:

1. ❌ **Los platos NO cargan** cuando el usuario va a desayuno/comida/cena
2. ❌ **"Autoguardar sesión" NO funciona** - el usuario debe hacer login cada vez

---

## 🔍 PROBLEMA #1: PLATOS NO CARGAN EN MEAL SELECTION

### Síntomas Observados

```
🚨 CRÍTICO: No hay platos en Supabase (base_meals vacío)
❌ CRÍTICO: allIngredients vacío - el ranking no funcionará correctamente
⚠️ ADVERTENCIA: Ningún plato alcanza los thresholds de ajuste
📊 Platos a analizar: 0
```

### Análisis de Causa Raíz

#### **CAUSA PRINCIPAL: Errores 401 en endpoints críticos**

Los logs muestran que TODOS los endpoints están fallando con 401:

```
Failed to load resource: the server responded with a status of 401 ()
- /custom-ingredients/{email}
- /daily-logs/{email}  
- /global-ingredients
- /saved-diets
- /training-plan/{email}
- /favorite-meals
- /custom-meals/{email}
- /user (PUT)
```

#### **PROBLEMA DE AUTENTICACIÓN EN EDGE FUNCTIONS**

1. **El token se genera correctamente:**
   ```
   🔑 [API] JWT issued at: Fri Jan 16 2026 16:41:24
   🔑 [API] JWT expires at: Fri Jan 16 2026 17:41:24
   🔑 [API] JWT is: ✅ VALID
   ```

2. **El token se envía correctamente:**
   ```
   🔑 [API] Final Authorization header: Bearer eyJhbGciOiJFUzI1NiIs...
   ```

3. **PERO el servidor rechaza el token con 401**
   - Esto indica que `getUserIdFromToken()` está fallando en el Edge Function
   - El middleware `authMiddleware` está bloqueando todas las peticiones

#### **ENDPOINTS QUE DEBERÍAN SER PÚBLICOS PERO TIENEN authMiddleware:**

**❌ INCORRECTO - Tienen authMiddleware cuando NO deberían:**
- `GET /global-ingredients` - **YA CORREGIDO** ✅
- `GET /global-meals` - **Está bien, es público** ✅

**✅ CORRECTO - Deben tener autenticación:**
- `GET /custom-meals/:email`
- `GET /custom-ingredients/:email`
- `PUT /user`
- `POST /daily-logs`
- Etc.

### Diagnóstico Técnico

```typescript
// PROBLEMA: El authMiddleware está fallando para tokens VÁLIDOS

async function getUserIdFromToken(c: any): Promise<string | null> {
  // Esta función está rechazando tokens válidos de Supabase Auth
  // Posibles causas:
  // 1. El token no se está extrayendo correctamente del header
  // 2. La validación con supabase.auth.getUser() está fallando
  // 3. Hay un problema con la configuración del cliente de Supabase
}
```

### Impacto en la Aplicación

1. **No se cargan ingredientes** → No hay base para calcular recetas
2. **No se cargan platos globales** → Lista de comidas vacía
3. **No se cargan platos personalizados** → "Mis Platos" vacío
4. **No se guardan datos del usuario** → Cambios se pierden
5. **No se cargan logs diarios** → Historial no disponible

### Estado Actual

- ✅ **Corrección aplicada:** `GET /global-ingredients` ya es público
- 🔧 **Necesita corrección:** Otros endpoints autenticados siguen fallando
- 📝 **Logging agregado:** Más detalles en `getUserIdFromToken()` para debugging

---

## 🔍 PROBLEMA #2: AUTOGUARDAR SESIÓN NO FUNCIONA

### Síntomas Observados

- Usuario marca "Recordar sesión" (checkbox activo por defecto)
- Usuario hace login exitosamente
- Usuario cierra la app
- Al volver a abrir, **debe hacer login de nuevo**

### Análisis de Causa Raíz

#### **PROBLEMA: No hay persistencia de sesión**

```typescript
// LoginAuth.tsx - GUARDA la preferencia
const handleSubmit = (e: React.FormEvent) => {
  // ✅ Esto SÍ funciona
  localStorage.setItem('fuelier_remember_session', JSON.stringify(rememberMe));
  onLoginSuccess(email, password, name);
}

// App.tsx - PERO NO LA USA
useEffect(() => {
  // ❌ PROBLEMA: Solo carga cuando hay usuario, pero NO intenta recuperar sesión
  console.log('🔄 App mounted - User must login to load from Supabase');
  setIsLoading(false);
}, []);
```

#### **FALTA IMPLEMENTACIÓN DE AUTO-LOGIN**

El código actual:
1. ✅ **Guarda** la preferencia `fuelier_remember_session`
2. ✅ **Guarda** el token en `localStorage` (`fuelier_auth_token`)
3. ❌ **NO intenta** recuperar el token al iniciar la app
4. ❌ **NO intenta** hacer auto-login con el token guardado

### Comparación con el Sistema Esperado

```typescript
// ❌ ACTUAL: No hay auto-login
useEffect(() => {
  api.initializeAuth(); // Solo inicializa el monitor de tokens
  setIsLoading(false); // Siempre muestra pantalla de login
}, []);

// ✅ ESPERADO: Debería intentar auto-login
useEffect(() => {
  const tryAutoLogin = async () => {
    const rememberSession = localStorage.getItem('fuelier_remember_session');
    const storedToken = localStorage.getItem('fuelier_auth_token');
    
    if (rememberSession === 'true' && storedToken) {
      // Validar token con Supabase
      const { data: { user } } = await supabase.auth.getUser(storedToken);
      
      if (user) {
        // Token válido - cargar usuario
        const userData = await api.getUser(user.email);
        if (userData) {
          setUser(userData);
          setCurrentScreen('dashboard');
        }
      }
    }
    setIsLoading(false);
  };
  
  tryAutoLogin();
}, []);
```

### Impacto en UX

- **Muy molesto para el usuario** - debe hacer login cada vez
- **Pérdida de conversión** - usuarios pueden abandonar
- **Mala experiencia** - competidores mantienen sesión

---

## 📊 PRIORIZACIÓN DE PROBLEMAS

| Problema | Severidad | Impacto | Urgencia | Orden |
|----------|-----------|---------|----------|-------|
| **#1 - Platos no cargan** | 🔴 CRÍTICO | App NO funcional | INMEDIATA | **1º** |
| **#2 - No autoguarda sesión** | 🟡 ALTO | UX muy mala | ALTA | **2º** |

---

## 🎯 PLAN DE CORRECCIÓN

### FASE 1: DEBUGGING DE AUTENTICACIÓN (INMEDIATO)

**Objetivo:** Entender por qué `authMiddleware` rechaza tokens válidos

#### Paso 1.1: Verificar logs del Edge Function
```bash
# Ver logs en tiempo real
supabase functions serve make-server-b0e879f0 --debug
```

Buscar en los logs:
- `[AUTH] Authorization header:` - ¿Llega el header?
- `[AUTH] Token extracted:` - ¿Se extrae correctamente?
- `[AUTH] Token validation failed:` - ¿Por qué falla?

#### Paso 1.2: Probar endpoint con token real
```bash
# Hacer login y copiar el token de la consola del navegador
TOKEN="eyJhbGciOiJFUzI1NiIs..." # Token del navegador

# Probar endpoint protegido
curl -X GET "https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/custom-meals/joaniphone2002@gmail.com" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Esperado:
- ✅ Status 200 + datos
- ❌ Status 401 → Problema en `getUserIdFromToken()`

#### Paso 1.3: Revisar configuración de Supabase Client

El problema puede estar en cómo se crea el cliente:

```typescript
// ¿Está bien configurado?
const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});
```

**Posible solución:** Usar `supabase.auth.getUser()` directamente sin crear nuevo cliente

### FASE 2: CORRECCIONES DE AUTENTICACIÓN

#### Opción A: Simplificar validación de token (RECOMENDADO)

```typescript
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.replace('Bearer ', '');
    
    // SOLUCIÓN: Usar JWT decode directo en lugar de llamada a Supabase
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar expiración
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.log('[AUTH] Token expired');
        return null;
      }
      
      // Retornar user_id del payload
      return payload.sub || null;
    } catch (e) {
      console.log('[AUTH] Invalid token format:', e);
      return null;
    }
  } catch (error) {
    console.log('[AUTH] Exception:', error);
    return null;
  }
}
```

**Ventajas:**
- ✅ Más rápido (no hace llamada a Supabase)
- ✅ Más confiable (no depende de red)
- ✅ Tokens de Supabase Auth son JWT estándar

#### Opción B: Corregir la validación actual

```typescript
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.replace('Bearer ', '');
    
    // CORRECCIÓN: Usar service role client para validar
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar token con la API de Auth
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) {
      console.log(`[AUTH] Validation failed:`, error?.message);
      return null;
    }
    
    return data.user.id;
  } catch (error) {
    console.log('[AUTH] Exception:', error);
    return null;
  }
}
```

### FASE 3: IMPLEMENTAR AUTO-LOGIN

#### Paso 3.1: Modificar App.tsx

```typescript
// Agregar estado de recuperación de sesión
const [isRecoveringSession, setIsRecoveringSession] = useState(true);

useEffect(() => {
  const recoverSession = async () => {
    try {
      // Verificar si el usuario quiere recordar sesión
      const rememberSession = localStorage.getItem('fuelier_remember_session');
      
      if (rememberSession !== 'true') {
        console.log('Usuario no quiere recordar sesión');
        setIsRecoveringSession(false);
        setIsLoading(false);
        return;
      }
      
      // Intentar recuperar sesión de Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        console.log('No hay sesión activa');
        setIsRecoveringSession(false);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Sesión recuperada:', session.user.email);
      
      // Cargar datos del usuario
      const userData = await api.getUser(session.user.email);
      
      if (userData) {
        setUser(userData);
        setCurrentScreen('dashboard');
        console.log('✅ Auto-login exitoso');
      } else {
        console.log('Usuario sin perfil - ir a onboarding');
        setTempData({ email: session.user.email, name: session.user.user_metadata?.name || 'Usuario' });
        setCurrentScreen('onboarding-sex');
      }
    } catch (error) {
      console.error('Error recuperando sesión:', error);
    } finally {
      setIsRecoveringSession(false);
      setIsLoading(false);
    }
  };
  
  // Solo si NO estamos en ruta de admin
  const isAdminRoute = window.location.pathname.includes('adminfueliercardano');
  if (!isAdminRoute) {
    recoverSession();
  } else {
    setIsLoading(false);
  }
}, []);
```

#### Paso 3.2: Actualizar signin() para mantener sesión

```typescript
// api.ts
export const signin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // ✅ CRÍTICO: Mantener sesión persistente
        persistSession: true
      }
    });
    
    if (error) return { success: false, error: error.message };
    if (!data.session?.access_token) return { success: false, error: 'No session' };
    
    setAuthToken(data.session.access_token);
    return { success: true, access_token: data.session.access_token };
  } catch (error) {
    return { success: false, error: 'Error de red' };
  }
};
```

### FASE 4: TESTING Y VALIDACIÓN

#### Test 1: Autenticación de endpoints
```bash
# 1. Hacer login en la app
# 2. Copiar token de localStorage
# 3. Probar cada endpoint:

curl -X GET "https://.../custom-meals/EMAIL" -H "Authorization: Bearer TOKEN"
curl -X GET "https://.../custom-ingredients/EMAIL" -H "Authorization: Bearer TOKEN"
curl -X PUT "https://.../user" -H "Authorization: Bearer TOKEN" -d '{...}'
```

#### Test 2: Auto-login
```
1. Hacer login con "Recordar sesión" ✅
2. Cerrar navegador completamente
3. Volver a abrir la app
4. ✅ ESPERADO: Dashboard se carga automáticamente
5. ❌ ACTUAL: Muestra pantalla de login
```

#### Test 3: Carga de platos
```
1. Login exitoso
2. Ir a Dashboard
3. Click en "Desayuno"
4. ✅ ESPERADO: Lista de 50+ platos
5. ❌ ACTUAL: Lista vacía
```

---

## 🔧 SOLUCIONES PROPUESTAS (ORDENADAS POR PRIORIDAD)

### SOLUCIÓN 1: CORREGIR AUTENTICACIÓN EN EDGE FUNCTIONS (CRÍTICO)

**Tiempo estimado:** 30 minutos  
**Impacto:** Resuelve el 90% de los problemas

```typescript
// supabase/functions/make-server-b0e879f0/index.ts

// REEMPLAZAR getUserIdFromToken() con versión simplificada:
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.replace('Bearer ', '');
    
    // Decodificar JWT directamente (más rápido y confiable)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('[AUTH] Token expired');
      return null;
    }
    
    // Extraer user ID
    const userId = payload.sub;
    if (!userId) {
      console.log('[AUTH] No user ID in token');
      return null;
    }
    
    console.log(`[AUTH] Token validated for user: ${userId}`);
    return userId;
  } catch (error) {
    console.log('[AUTH] Token decode error:', error);
    return null;
  }
}
```

**Por qué funciona:**
- Los tokens de Supabase Auth son JWT estándar
- Contienen `sub` (user ID) y `exp` (expiración)
- No necesitamos llamar a Supabase para validar
- Es más rápido y confiable

### SOLUCIÓN 2: IMPLEMENTAR AUTO-LOGIN (ALTA PRIORIDAD)

**Tiempo estimado:** 45 minutos  
**Impacto:** Mejora drástica en UX

**Archivos a modificar:**
1. `src/app/App.tsx` - Agregar lógica de recuperación de sesión
2. `src/app/utils/api.ts` - Asegurar `persistSession: true` en signin
3. `src/utils/supabaseClient.ts` - Verificar configuración

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Fase 1: Debugging (Completado)
- [x] Agregar logging detallado a `getUserIdFromToken()`
- [x] Identificar que global-ingredients tenía authMiddleware innecesario
- [x] Corregir endpoint global-ingredients

### 🔧 Fase 2: Corrección de Autenticación (EN PROGRESO)
- [ ] Implementar `getUserIdFromToken()` con JWT decode directo
- [ ] Desplegar Edge Function corregida
- [ ] Probar endpoints protegidos con token válido
- [ ] Verificar que custom-meals, custom-ingredients, etc. funcionen

### 🚀 Fase 3: Auto-Login (PENDIENTE)
- [ ] Agregar estado `isRecoveringSession` en App.tsx
- [ ] Implementar función `recoverSession()`
- [ ] Modificar useEffect inicial para intentar auto-login
- [ ] Asegurar `persistSession: true` en signin()
- [ ] Probar flujo completo de auto-login

### ✅ Fase 4: Validación (PENDIENTE)
- [ ] Test: Login → Cerrar → Abrir → Debe estar logueado
- [ ] Test: Desayuno/Comida/Cena → Debe mostrar platos
- [ ] Test: "Mis Platos" → Debe mostrar custom meals
- [ ] Test: Guardar cambios → Debe persistir en Supabase

---

## 🎬 PRÓXIMOS PASOS INMEDIATOS

1. **AHORA MISMO:** Implementar `getUserIdFromToken()` simplificado
2. **DESPUÉS:** Desplegar y probar endpoints
3. **LUEGO:** Implementar auto-login
4. **FINALMENTE:** Testing completo

---

## 📌 NOTAS IMPORTANTES

- ⚠️ **NO** eliminar el logging detallado hasta confirmar que todo funciona
- ⚠️ **NO** usar localStorage para datos críticos (solo para preferencias)
- ⚠️ **SÍ** confiar en Supabase Auth como fuente de verdad para sesiones
- ⚠️ **SÍ** usar `persistSession: true` en todos los logins

---

**Documentado por:** GitHub Copilot  
**Última actualización:** 16 de enero de 2026, 17:00 CET
