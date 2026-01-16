# 🚨 DIAGNÓSTICO CRÍTICO - ERROR 401 EN PRODUCCIÓN

**Fecha**: 16 Enero 2026  
**Usuario afectado**: joaniphone2002@gmail.com  
**Estado**: 🔴 CRÍTICO - App no funciona

---

## 🔍 PROBLEMA IDENTIFICADO

### Error Principal
Todos los endpoints (públicos y autenticados) están fallando con **401 Unauthorized**:
- ❌ `/global-ingredients` - 401
- ❌ `/custom-meals` - 401  
- ❌ `/daily-logs` - 401
- ❌ `/user` - 401
- ❌ `/training-plan` - 401
- ❌ Todos los demás endpoints autenticados - 401

### Causa Raíz
**El usuario tiene un token JWT con algoritmo ES256 (ECDSA) en lugar de HS256 (HMAC)**

**Evidencia**:
```bash
# Token del usuario (según console logs):
Token preview: eyJhbGciOiJFUzI1NiIs...
                        ^^^^^^^^^ 
                        ES256 - ECDSA

# Token correcto de Supabase Auth:
Token preview: eyJhbGciOiJIUzI1NiIs...
                        ^^^^^^^^^ 
                        HS256 - HMAC
```

**Decodificación del header**:
```json
// Token usuario (INCORRECTO):
{"alg":"ES256", "typ":"JWT"}

// Token esperado (CORRECTO):  
{"alg":"HS256", "typ":"JWT"}
```

---

## 🧪 TESTS DE VERIFICACIÓN

### ✅ Test con Anon Key (HS256)
```bash
curl "https://.../global-ingredients" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
  
Resultado: ✅ 200 OK - 60 ingredientes retornados
```

### ❌ Test con Token Usuario (ES256)
```bash
# Token del usuario en producción
Authorization: Bearer eyJhbGciOiJFUzI1NiIs...

Resultado: ❌ 401 Unauthorized
```

---

## 🎯 POSIBLES CAUSAS

### 1. Login con OAuth Provider
El usuario se autenticó con Google/GitHub/otro proveedor OAuth que emite tokens ES256.

### 2. Token Antiguo en localStorage
Hay un token viejo guardado de una sesión anterior con configuración diferente.

### 3. Configuración de Supabase Auth
El proyecto de Supabase puede tener configuración mixta de algoritmos.

---

## ✅ SOLUCIÓN INMEDIATA

### Para el Usuario (Joan):

**PASO 1**: Limpiar sesión completamente
```
1. Abrir DevTools (F12)
2. Ir a Application → Storage
3. Click en "Clear site data"
4. Confirmar
5. Recargar página (Cmd+R)
```

**PASO 2**: Hacer login de nuevo
```
1. Usar email/password normal
2. NO usar "Sign in with Google" u otros proveedores
3. Marcar "Recordar sesión"
4. Verificar en console que token empieza con "eyJhbGciOiJIUzI1NiIs"
```

---

## 🔧 SOLUCIÓN TÉCNICA (Backend)

### Opción 1: Soporte para ES256 (Recomendado)
Modificar `getUserIdFromToken()` para aceptar ambos algoritmos y validar correctamente.

```typescript
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Decodificar header para detectar algoritmo
    const header = JSON.parse(atob(token.split('.')[0]));
    console.log(`[AUTH] Token algorithm: ${header.alg}`);
    
    if (header.alg !== 'HS256' && header.alg !== 'ES256') {
      console.log('[AUTH] Unsupported algorithm:', header.alg);
      return null;
    }
    
    // Para ES256 y HS256, validar con Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.log('[AUTH] Token validation failed:', error);
      return null;
    }
    
    return data.user.id;
    
  } catch (error) {
    console.log('[AUTH] Exception during token validation:', error);
    return null;
  }
}
```

### Opción 2: Forzar Solo HS256
Rechazar tokens ES256 con mensaje claro.

```typescript
const header = JSON.parse(atob(token.split('.')[0]));
if (header.alg !== 'HS256') {
  console.log('[AUTH] Only HS256 tokens accepted, got:', header.alg);
  console.log('[AUTH] Please log out and sign in again with email/password');
  return null;
}
```

---

## 📊 IMPACTO

### Afectación
- 🔴 **CRÍTICA** - Usuario no puede usar la app
- 🔴 **100% de funcionalidad bloqueada**
- 🔴 **Todos los endpoints fallan**

### Usuarios Afectados
- Probablemente solo usuarios que:
  - Se logearon con OAuth providers
  - Tienen sesiones antiguas guardadas
  - Migraron de configuración anterior

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### Prioridad 1: Usuario (Joan)
1. ✅ **AHORA**: Limpiar localStorage y hacer login nuevo
2. ✅ **VERIFICAR**: Token correcto (HS256)
3. ✅ **PROBAR**: Que endpoints funcionen

### Prioridad 2: Backend
1. 🔧 **HOY**: Implementar soporte para ES256 O validación mejor
2. 🔧 **HOY**: Mensajes de error más claros
3. 🔧 **HOY**: Logging del algoritmo del token

### Prioridad 3: Frontend
1. 📝 **MAÑANA**: Detectar token ES256 en startup
2. 📝 **MAÑANA**: Auto-logout si algoritmo incorrecto
3. 📝 **MAÑANA**: Mensaje al usuario para re-login

---

## 📝 CHECKLIST DE RESOLUCIÓN

### Inmediato (Próximos 5 minutos):
- [ ] Usuario limpia localStorage
- [ ] Usuario hace login nuevo
- [ ] Verificar token es HS256
- [ ] Probar que endpoints funcionen

### Corto Plazo (Hoy):
- [ ] Implementar mejor validación de tokens
- [ ] Logging mejorado del algoritmo
- [ ] Mensajes de error claros

### Medio Plazo (Esta semana):
- [ ] Documentar tipos de autenticación soportados
- [ ] Auto-detección de tokens inválidos
- [ ] Migración automática de sesiones

---

## 🎓 LECCIONES APRENDIDAS

1. **Siempre loguear el algoritmo del token** para diagnóstico rápido
2. **Validar con Supabase Auth directamente** en lugar de decode manual
3. **Mensajes de error claros** que guíen al usuario
4. **Detectar problemas en frontend** antes de enviar requests

---

## 📞 SIGUIENTE PASO AHORA

**Usuario debe hacer esto AHORA:**

1. Presionar **F12** (DevTools)
2. Ir a pestaña **Application**
3. Click en **Storage** (barra izquierda)
4. Click en **"Clear site data"**
5. Confirmar
6. Recargar la página
7. Hacer **login de nuevo** con email/password
8. **NO** usar "Sign in with Google"
9. Reportar si funciona

---

**Status**: ⏳ ESPERANDO ACCIÓN DEL USUARIO
