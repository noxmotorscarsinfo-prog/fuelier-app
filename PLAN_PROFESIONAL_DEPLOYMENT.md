# 🚀 PLAN PROFESIONAL - DEPLOYMENT PARA TESTERS
**Fecha:** 16 de enero de 2026  
**Objetivo:** Resolver errores críticos y preparar app para testing beta  
**Tiempo estimado total:** 2-3 horas

---

## 📋 ESTADO ACTUAL

### ❌ Problemas Identificados
1. **CRÍTICO:** Endpoints devuelven 401 → Platos no cargan
2. **ALTO:** Auto-login no funciona → Usuario debe re-loguearse siempre
3. **Consecuencia:** App NO funcional para testers

### ✅ Correcciones Ya Aplicadas
- ✅ Endpoint `/global-ingredients` corregido (ahora público)
- ✅ Logging detallado agregado para debugging
- ✅ Sistema de renovación automática de tokens implementado

---

## 🎯 PLAN DE ACCIÓN - 8 PASOS

### PASO 1: Corregir Validación de Tokens en Edge Function
**Tiempo:** 15 minutos  
**Prioridad:** 🔴 CRÍTICO  
**Archivo:** `supabase/functions/make-server-b0e879f0/index.ts`

#### Acción
Reemplazar `getUserIdFromToken()` con decodificación JWT directa:

```typescript
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    console.log(`[AUTH] Authorization header: ${authHeader ? 'PRESENT' : 'MISSING'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH] Invalid auth header format`);
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log(`[AUTH] Token extracted: ${token.substring(0, 20)}...`);
    
    try {
      // Decodificar JWT directamente (sin llamada a Supabase)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[AUTH] Invalid JWT format');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log(`[AUTH] Token decoded, checking expiration...`);
      
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
      
      console.log(`[AUTH] ✅ Token validated for user: ${userId}`);
      return userId;
      
    } catch (decodeError) {
      console.log('[AUTH] Token decode error:', decodeError);
      return null;
    }
    
  } catch (error) {
    console.log('[AUTH] Exception during token validation:', error);
    return null;
  }
}
```

#### Resultado Esperado
- ✅ Tokens válidos pasan la validación
- ✅ Logs muestran `[AUTH] ✅ Token validated for user: {uuid}`
- ✅ Errores 401 desaparecen

#### Verificación
```bash
# Ver logs en consola de Supabase después del deploy
# Debe mostrar: [AUTH] ✅ Token validated for user: ...
```

---

### PASO 2: Desplegar Edge Function Corregida
**Tiempo:** 5 minutos  
**Prioridad:** 🔴 CRÍTICO

#### Acción
```bash
cd /Users/joanpintocurado/Documents/FUELIER
supabase functions deploy make-server-b0e879f0
```

#### Resultado Esperado
```
✅ Deployed Functions on project fzvsbpgqfubbqmqqxmwv: make-server-b0e879f0
```

#### Verificación
- Comprobar que no hay errores de compilación
- El deployment se completa exitosamente

---

### PASO 3: Probar Endpoints Autenticados
**Tiempo:** 10 minutos  
**Prioridad:** 🔴 CRÍTICO

#### Acción
Hacer login en la app y copiar el token de localStorage:

1. Abrir la app en el navegador
2. Abrir DevTools → Application → Local Storage
3. Copiar valor de `fuelier_auth_token`
4. Probar endpoints:

```bash
# Guardar token en variable
TOKEN="eyJhbGciOiJFUzI1NiIs..." # ← Pegar token aquí

# Probar custom-meals
curl -X GET \
  "https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/custom-meals/joaniphone2002@gmail.com" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Probar custom-ingredients
curl -X GET \
  "https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/custom-ingredients/joaniphone2002@gmail.com" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Probar daily-logs
curl -X GET \
  "https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/daily-logs/joaniphone2002@gmail.com" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Resultado Esperado
- ✅ Status 200 (no 401)
- ✅ Datos JSON válidos
- ✅ Sin errores en respuesta

#### Si falla
- Ver logs del Edge Function en Dashboard de Supabase
- Buscar línea `[AUTH] Token validation failed`
- Ajustar lógica de decodificación si es necesario

---

### PASO 4: Implementar Auto-Login en App.tsx
**Tiempo:** 20 minutos  
**Prioridad:** 🟡 ALTO  
**Archivo:** `src/app/App.tsx`

#### Acción
Modificar el useEffect inicial para recuperar sesión:

```typescript
// REEMPLAZAR el useEffect actual por este:
useEffect(() => {
  const isAdminRoute = window.location.pathname === '/adminfueliercardano' || 
                      window.location.pathname.includes('/adminfueliercardano') ||
                      window.location.hash === '#adminfueliercardano' ||
                      window.location.hash === '#/adminfueliercardano';
  
  // Si estamos en la ruta de admin, no cargar usuario automáticamente
  if (isAdminRoute) {
    setIsLoading(false);
    return;
  }
  
  const recoverSession = async () => {
    try {
      console.log('🔄 [App] Checking for existing session...');
      
      // ✅ Inicializar sistema de autenticación con renovación automática
      await api.initializeAuth();
      console.log('🔄 [App] Auth system initialized');
      
      // Verificar si el usuario quiere recordar sesión
      const rememberSession = localStorage.getItem('fuelier_remember_session');
      console.log(`🔄 [App] Remember session: ${rememberSession}`);
      
      if (rememberSession !== 'true') {
        console.log('🔄 [App] User does not want to remember session');
        setIsLoading(false);
        return;
      }
      
      // Intentar recuperar sesión de Supabase
      const { supabase } = await import('../utils/supabaseClient');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('🔄 [App] Error getting session:', error.message);
        setIsLoading(false);
        return;
      }
      
      if (!session?.user) {
        console.log('🔄 [App] No active session found');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ [App] Session recovered for:', session.user.email);
      
      // Establecer token en api.ts
      if (session.access_token) {
        api.setAuthToken(session.access_token);
      }
      
      // Cargar datos del usuario desde base de datos
      const userData = await api.getUser(session.user.email!);
      
      if (userData) {
        console.log('✅ [App] User data loaded from database');
        setUser(userData);
        setCurrentScreen('dashboard');
      } else {
        console.log('⚠️ [App] User authenticated but no profile found - starting onboarding');
        setTempData({ 
          email: session.user.email!, 
          name: session.user.user_metadata?.name || 'Usuario' 
        });
        setCurrentScreen('onboarding-sex');
      }
      
    } catch (error) {
      console.error('❌ [App] Error recovering session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  recoverSession();
}, []);
```

#### Resultado Esperado
- ✅ Al recargar la página, la sesión se recupera automáticamente
- ✅ Usuario va directo al dashboard sin hacer login
- ✅ Logs muestran `✅ [App] Session recovered for: {email}`

---

### PASO 5: Configurar persistSession en signin
**Tiempo:** 10 minutos  
**Prioridad:** 🟡 ALTO  
**Archivo:** `src/app/utils/api.ts`

#### Acción
Verificar y actualizar la función `signin()`:

```typescript
export const signin = async (email: string, password: string): Promise<{ 
  success: boolean; 
  error?: string; 
  code?: string; 
  access_token?: string; 
  user?: any 
}> => {
  try {
    console.log(`🔑 [API] Attempting signin for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // ✅ CRÍTICO: Mantener sesión persistente entre recargas
        persistSession: true
      }
    });

    if (error) {
      console.log(`🔑 [API] Signin failed: ${error.message}`);
      
      // Mapear errores específicos
      if (error.message.includes('Invalid login credentials')) {
        const userExists = await checkUserExists(email);
        if (!userExists) {
          return { success: false, error: 'Usuario no encontrado', code: 'user_not_found' };
        }
        return { success: false, error: 'Contraseña incorrecta', code: 'wrong_password' };
      }
      
      return { success: false, error: error.message };
    }

    if (!data.session?.access_token) {
      console.log(`🔑 [API] No access token in response`);
      return { success: false, error: 'No se pudo obtener el token de acceso' };
    }

    // Analizar el token para debugging
    const token = data.session.access_token;
    console.log(`🔑 [API] signin successful - analyzing token...`);
    console.log(`🔑 [API] Token type: ${typeof token}`);
    console.log(`🔑 [API] Token length: ${token.length}`);
    console.log(`🔑 [API] Token preview: ${token.substring(0, 50)}...`);
    
    // Decodificar el JWT para ver su contenido
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const issuedAt = new Date(payload.iat * 1000);
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const validFor = payload.exp - payload.iat;
      
      console.log(`🔑 [API] JWT issued at: ${issuedAt}`);
      console.log(`🔑 [API] JWT expires at: ${expiresAt}`);
      console.log(`🔑 [API] Current time: ${now}`);
      console.log(`🔑 [API] JWT valid for: ${validFor} seconds`);
      console.log(`🔑 [API] JWT is: ${expiresAt > now ? '✅ VALID' : '❌ EXPIRED'}`);
    } catch (e) {
      console.warn(`🔑 [API] Could not decode JWT:`, e);
    }

    // Guardar token
    setAuthToken(token);

    return { 
      success: true, 
      access_token: token,
      user: data.user
    };
  } catch (error: any) {
    console.error(`🔑 [API] Exception during signin:`, error);
    return { 
      success: false, 
      error: error.message || 'Error de conexión' 
    };
  }
};
```

#### Resultado Esperado
- ✅ La sesión persiste en el navegador
- ✅ `supabase.auth.getSession()` devuelve sesión válida después de recargar
- ✅ Token se guarda en localStorage

---

### PASO 6: Desplegar Frontend a Vercel
**Tiempo:** 10 minutos  
**Prioridad:** 🟡 ALTO

#### Acción
```bash
cd /Users/joanpintocurado/Documents/FUELIER

# Hacer commit de los cambios
git add .
git commit -m "🔧 Fix: Auto-login y validación de tokens corregida

✅ CORRECCIONES CRÍTICAS:
- getUserIdFromToken ahora decodifica JWT directamente (sin llamada a Supabase)
- Implementado auto-login al iniciar la app usando supabase.auth.getSession()
- Configurado persistSession: true en signin para mantener sesión
- Agregado logging detallado para debugging

🚀 MEJORAS:
- Usuario ya no necesita re-loguearse cada vez
- Tokens se validan correctamente → Platos cargan sin errores 401
- Sesión persiste entre recargas del navegador

Listo para testing beta con usuarios reales"

# Push al repositorio
git push

# Deploy a producción
vercel --prod
```

#### Resultado Esperado
```
✅ Production: https://fuelier-j4yw91ra5-fuelier-apps-projects.vercel.app
```

#### Verificación
- Esperar a que el deployment se complete
- Abrir la URL de producción
- Verificar que la app carga sin errores

---

### PASO 7: Testing Completo de Flujo
**Tiempo:** 30 minutos  
**Prioridad:** 🔴 CRÍTICO

#### Test Suite Completa

##### Test 1: Login y Autenticación
```
1. Abrir app en producción
2. Hacer login con credenciales válidas
3. ✅ VERIFICAR: Dashboard se carga correctamente
4. ✅ VERIFICAR: No hay errores 401 en consola
5. ✅ VERIFICAR: Token está en localStorage
```

##### Test 2: Carga de Platos
```
1. Desde dashboard, click en "Desayuno"
2. ✅ VERIFICAR: Se muestran platos (>30 opciones)
3. ✅ VERIFICAR: No aparece "No hay platos disponibles"
4. ✅ VERIFICAR: No hay errores en consola
5. Repetir para Comida, Cena, Snack
```

##### Test 3: Auto-Login (Recordar Sesión)
```
1. Hacer login con "Recordar sesión" ✅ activado
2. Verificar que llega al dashboard
3. Cerrar completamente el navegador
4. Abrir el navegador de nuevo
5. Ir a la URL de la app
6. ✅ VERIFICAR: Automáticamente carga el dashboard
7. ✅ VERIFICAR: NO muestra pantalla de login
8. ✅ VERIFICAR: Datos del usuario están cargados
```

##### Test 4: Custom Meals (Mis Platos)
```
1. Login exitoso
2. Ir a "Mis Platos" desde menú
3. ✅ VERIFICAR: Se muestran los platos personalizados
4. Click en "Crear Plato"
5. Crear un plato nuevo
6. ✅ VERIFICAR: El plato se guarda correctamente
7. ✅ VERIFICAR: Aparece en la lista de "Mis Platos"
8. Ir a "Desayuno"
9. ✅ VERIFICAR: El plato personalizado aparece en la lista
```

##### Test 5: Persistencia de Datos
```
1. Agregar una comida al log diario
2. Recargar la página
3. ✅ VERIFICAR: La comida sigue en el log
4. Cambiar objetivo de macros en Settings
5. Recargar la página
6. ✅ VERIFICAR: Los nuevos objetivos se mantienen
```

##### Test 6: Logout y Re-Login
```
1. Hacer logout desde Settings
2. ✅ VERIFICAR: Vuelve a pantalla de login
3. Hacer login de nuevo
4. ✅ VERIFICAR: Todos los datos están intactos
5. ✅ VERIFICAR: Los logs diarios se mantienen
```

#### Checklist de Verificación

- [ ] ✅ Login funciona correctamente
- [ ] ✅ Platos cargan en todas las comidas (desayuno/comida/cena/snack)
- [ ] ✅ Auto-login funciona (no pide login al recargar)
- [ ] ✅ "Mis Platos" muestra platos personalizados
- [ ] ✅ Crear nuevo plato funciona
- [ ] ✅ Datos persisten después de recargar
- [ ] ✅ No hay errores 401 en consola
- [ ] ✅ No hay errores de ingredientes faltantes
- [ ] ✅ Logout funciona correctamente

---

### PASO 8: Documentar Guía para Testers
**Tiempo:** 20 minutos  
**Prioridad:** 🟢 MEDIA

#### Acción
Crear documento con:
- Cómo acceder a la app
- Funcionalidades a probar
- Cómo reportar bugs
- Casos de uso principales

#### Contenido

```markdown
# 🧪 GUÍA PARA TESTERS - FUELIER BETA

## Acceso a la App
URL: https://fuelier-j4yw91ra5-fuelier-apps-projects.vercel.app

## Crear Cuenta
1. Click en "Crear cuenta"
2. Usar email válido + contraseña (min 6 caracteres)
3. Completar onboarding (2 minutos)

## Funcionalidades a Probar

### ✅ Login y Sesión
- [ ] Login con credenciales funciona
- [ ] "Recordar sesión" mantiene login al recargar
- [ ] Logout funciona correctamente

### ✅ Selección de Comidas
- [ ] Desayuno muestra platos disponibles
- [ ] Comida muestra platos disponibles
- [ ] Cena muestra platos disponibles
- [ ] Snack muestra platos disponibles

### ✅ Mis Platos (Custom Meals)
- [ ] Crear plato personalizado funciona
- [ ] Plato creado aparece en "Mis Platos"
- [ ] Plato personalizado aparece en selección de comidas
- [ ] Editar plato funciona
- [ ] Eliminar plato funciona

### ✅ Dashboard y Logs
- [ ] Dashboard muestra macros del día
- [ ] Agregar comida actualiza macros
- [ ] Logs se guardan al cambiar de día
- [ ] Ver historial funciona

### ✅ Configuración
- [ ] Cambiar objetivos de macros funciona
- [ ] Cambiar distribución de comidas funciona
- [ ] Preferencias alimentarias se guardan

## Reportar Bugs
Si encuentras un error:
1. Captura de pantalla
2. Descripción del problema
3. Pasos para reproducir
4. Consola del navegador (F12 → Console)

Enviar a: [tu email o canal de comunicación]

## Casos de Uso Principales

### Caso 1: Primer Día de Uso
1. Crear cuenta
2. Completar onboarding
3. Seleccionar desayuno
4. Agregar al log
5. Repetir para todas las comidas del día

### Caso 2: Usar Platos Personalizados
1. Ir a "Mis Platos"
2. Crear un plato nuevo
3. Usar ese plato en una comida
4. Verificar que los macros se calculan bien

### Caso 3: Seguimiento Semanal
1. Usar la app 7 días seguidos
2. Registrar todas las comidas
3. Ver historial
4. Verificar progreso
```

---

## 📊 RESUMEN DE TIEMPOS

| Paso | Descripción | Tiempo | Prioridad |
|------|-------------|--------|-----------|
| 1 | Corregir getUserIdFromToken | 15 min | 🔴 CRÍTICO |
| 2 | Deploy Edge Function | 5 min | 🔴 CRÍTICO |
| 3 | Probar endpoints | 10 min | 🔴 CRÍTICO |
| 4 | Implementar auto-login | 20 min | 🟡 ALTO |
| 5 | Configurar persistSession | 10 min | 🟡 ALTO |
| 6 | Deploy frontend | 10 min | 🟡 ALTO |
| 7 | Testing completo | 30 min | 🔴 CRÍTICO |
| 8 | Guía para testers | 20 min | 🟢 MEDIA |
| **TOTAL** | | **2h 0min** | |

---

## 🎯 CRITERIOS DE ÉXITO

### Antes de Lanzar a Testers

- [ ] ✅ TODOS los endpoints responden correctamente (no 401)
- [ ] ✅ Platos cargan en todas las secciones
- [ ] ✅ Auto-login funciona perfectamente
- [ ] ✅ Custom meals (Mis Platos) funciona
- [ ] ✅ Datos persisten correctamente
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ App deployada en producción
- [ ] ✅ Guía para testers creada

### KPIs para Medir con Testers

- **Tasa de registro exitoso:** >95%
- **Tasa de login exitoso:** 100%
- **Tasa de carga de platos:** 100%
- **Bugs críticos reportados:** 0
- **Satisfacción de UX:** >4/5

---

## 🚨 SI ALGO FALLA

### Edge Function no despliega
```bash
# Ver logs de deployment
supabase functions serve make-server-b0e879f0 --debug

# O revisar en Dashboard de Supabase
https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions
```

### Endpoints siguen con 401
1. Ver logs del Edge Function en Dashboard
2. Buscar línea `[AUTH] Token validation failed`
3. Copiar token del localStorage
4. Decodificar en https://jwt.io
5. Verificar que `exp` no está expirado

### Auto-login no funciona
1. Verificar en DevTools → Application → Local Storage
2. Debe existir: `fuelier_remember_session: "true"`
3. Debe existir: `fuelier_auth_token: "ey..."`
4. Verificar en consola: logs de `[App] Checking for existing session...`

### Frontend no se despliega en Vercel
```bash
# Ver logs de Vercel
vercel logs

# O forzar re-deploy
vercel --prod --force
```

---

## 📞 CONTACTO Y SOPORTE

- **Dashboard Supabase:** https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Logs Edge Functions:** Ver en Dashboard de Supabase → Functions → make-server-b0e879f0

---

**Creado por:** GitHub Copilot  
**Última actualización:** 16 de enero de 2026, 17:30 CET  
**Versión:** 1.0

---

## 🎬 ¿LISTO PARA COMENZAR?

El plan está listo. Podemos empezar con el **PASO 1** ahora mismo.

¿Quieres que implemente las correcciones?
