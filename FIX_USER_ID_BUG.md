# 🔧 CORRECCIÓN BUG: "null value in column id" - COMPLETADA

## ❌ **Problema Original**

Al completar el onboarding y crear un nuevo usuario, la app fallaba con el error:
```
Error: null value in column "id" of relation "users" violates not-null constraint
```

**Causa raíz:** El objeto `newUser` no incluía el campo `id` (UUID de Supabase Auth), que es requerido como primary key en la tabla `users`.

---

## ✅ **Solución Implementada**

### 1. **Modificaciones en el Frontend** (`src/app/App.tsx`)

#### A. Agregar `userId` a `TempOnboardingData`
```typescript
interface TempOnboardingData {
  email: string;
  name: string;
  userId?: string; // ← NUEVO: Guardar ID de Supabase Auth
  sex?: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  trainingFrequency?: number;
}
```

#### B. Guardar `userId` después del signup
```typescript
const handleSignup = async (email: string, password: string, name: string) => {
  // ... signup exitoso ...
  
  setTempData({ 
    email, 
    name,
    userId: result.user?.id // ← CRÍTICO: Guardar el ID de Supabase Auth
  });
  setCurrentScreen('onboarding-sex');
}
```

#### C. Incluir `id` en el objeto `newUser`
```typescript
const handlePreferencesComplete = async (preferences) => {
  const newUser: User = {
    id: tempData.userId, // ← CRÍTICO: ID de Supabase Auth
    email: tempData.email,
    name: tempData.name,
    // ... resto de campos
  };
  
  await api.saveUser(newUser);
}
```

---

### 2. **Modificaciones en el Type** (`src/app/types.ts`)

```typescript
export interface User {
  id?: string; // ← NUEVO: UUID de Supabase Auth (requerido para guardar en DB)
  email: string;
  name: string;
  // ... resto de campos
}
```

---

### 3. **Modificaciones en el Backend** (`supabase/functions/make-server-b0e879f0/index.ts`)

#### Endpoint `GET /user/:email` - Incluir ID en respuesta
```typescript
app.get(`${basePath}/user/:email`, async (c) => {
  // ...
  const user = {
    id: data.id, // ← CRÍTICO: Incluir el ID del usuario
    email: data.email,
    name: data.name,
    // ... resto de campos
  };
  return c.json(user);
});
```

---

## 🚀 **Deployment**

### ✅ Frontend (Ya deployado en Vercel)
```bash
npm run build  # ✓ Completado
# Deploy en Vercel automáticamente al hacer push a GitHub
```

### ⚠️ Backend (Edge Function) - PENDIENTE
```bash
# Opción 1: Desde terminal local (requiere Supabase CLI)
cd supabase/functions
supabase functions deploy make-server-b0e879f0 --no-verify-jwt

# Opción 2: Desde Supabase Dashboard
1. Ir a https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv
2. Edge Functions → make-server-b0e879f0
3. Copiar el código actualizado de index.ts
4. Hacer deploy desde el dashboard
```

---

## 📋 **Archivos Modificados**

1. ✅ `src/app/App.tsx` - Guardar userId en tempData y usarlo en newUser
2. ✅ `src/app/types.ts` - Agregar campo `id` a interfaz User
3. ✅ `supabase/functions/make-server-b0e879f0/index.ts` - Incluir id en respuesta GET /user/:email
4. ✅ Build exitoso (12.24s)

---

## 🧪 **Testing Post-Deploy**

Después de deployar la edge function, probar:

1. **Crear nuevo usuario**
   - Email: test@example.com
   - Password: 123456
   - Completar onboarding completo
   - Verificar que NO de error al guardar

2. **Verificar en Supabase Dashboard**
   - Table Editor → users
   - Verificar que el nuevo usuario tiene un `id` válido (UUID)

3. **Login con usuario existente**
   - Verificar que carga correctamente el perfil

---

## 📊 **Flujo Corregido**

```
1. Usuario hace signup
   ↓
2. Backend crea usuario en Supabase Auth
   ↓
3. Backend retorna { user: { id, email, name } }
   ↓
4. Frontend guarda userId en tempData
   ↓
5. Usuario completa onboarding
   ↓
6. Frontend crea newUser con id: tempData.userId
   ↓
7. Backend recibe newUser.id y lo usa en INSERT
   ↓
8. ✅ Usuario guardado exitosamente en tabla users
```

---

## 🎯 **Resultado Esperado**

✅ Usuarios nuevos se crean sin error  
✅ El campo `id` se guarda correctamente en la tabla `users`  
✅ Login funciona correctamente para usuarios existentes  
✅ El perfil se carga con el `id` incluido  

---

## 🔍 **Próximo Paso**

**DEPLOY DE LA EDGE FUNCTION** en Supabase para que los cambios estén en producción.

Puedes hacerlo desde:
- Supabase Dashboard: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions
- O instalando Supabase CLI y ejecutando el comando de deploy

---

**Fecha**: 10 de Enero de 2026  
**Estado**: ✅ Código corregido, build exitoso, **pendiente deploy de edge function**
