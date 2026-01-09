# 🚀 Deploy Manual de Edge Function en Supabase

**Problema:** El backend no se actualizó, el frontend sí  
**Solución:** Deploy manual usando Supabase CLI (más fácil que copiar/pegar)

---

## ✅ OPCIÓN 1: Deploy con Supabase CLI (RECOMENDADO)

### **Paso 1: Instalar Supabase CLI**

**MacOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows (PowerShell):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternativa (NPM - cualquier OS):**
```bash
npm install -g supabase
```

---

### **Paso 2: Login a Supabase**

```bash
supabase login
```

- Se abrirá tu navegador
- Inicia sesión con tu cuenta de Supabase
- Autoriza el CLI

---

### **Paso 3: Link al proyecto**

```bash
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
```

- Te pedirá la **Database Password**
- Es la contraseña que usaste cuando creaste el proyecto

---

### **Paso 4: Deploy la función**

```bash
supabase functions deploy make-server-b0e879f0
```

**Debería mostrar:**
```
Deploying function make-server-b0e879f0...
✓ Function deployed successfully
```

---

## ❌ SI NO TIENES SUPABASE CLI: Opción 2 (Dashboard)

### **Paso 1: Ve al Dashboard**

Abre en tu navegador:
```
https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions/make-server-b0e879f0
```

---

### **Paso 2: Usar GitHub Integration (más fácil)**

Si tu proyecto está en GitHub:

1. En el Dashboard de Supabase
2. **Settings** → **Functions**
3. **Connect to GitHub**
4. Selecciona tu repositorio
5. Haz push a GitHub → Auto-deploy

---

### **Paso 3: Deploy Manual (si no usas GitHub)**

**⚠️ Esto es complicado porque el archivo tiene 1784 líneas**

Si realmente necesitas hacerlo así:

1. En Dashboard → **Edge Functions** → **make-server-b0e879f0**
2. Verás un editor de código
3. Necesitas pegar el contenido completo de `/supabase/functions/server/index.tsx`

**Problema:** El archivo es MUY grande para copiar/pegar manualmente

---

## 🎯 RECOMENDACIÓN

### **Usa la Opción 1 (Supabase CLI)**

**Ventajas:**
- ✅ Rápido (2 comandos)
- ✅ No hay errores de copy/paste
- ✅ Deploy en ~30 segundos
- ✅ Útil para futuros deploys

**Instalación solo toma 2 minutos:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
supabase functions deploy make-server-b0e879f0
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### **1. Test con cURL:**

```bash
curl https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health
```

**Debe responder:**
```json
{"status":"ok"}
```

---

### **2. Ver logs en Dashboard:**

1. Ve a: https://supabase.com/dashboard/project/fzvsbpgqfubbqmqqxmwv/functions/make-server-b0e879f0/logs
2. Deberías ver requests recientes
3. Si ves errores → investigar

---

### **3. Probar signup en la app:**

1. Abre la app
2. Crea cuenta nueva
3. Ver en Consola del navegador:
   ```
   [API] Signup successful for: ...
   [API] Setting auth token after signup    ← Debe aparecer
   ```
4. Completar onboarding
5. NO debe dar error 401 ✅

---

## 🚨 TROUBLESHOOTING

### **Error: "Database password is incorrect"**

**Solución:**
```bash
# Resetear link
supabase unlink
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
```

---

### **Error: "Function not found"**

**Significa:** No existe una Edge Function con ese nombre

**Solución:**
```bash
# Crear la función primero
supabase functions new make-server-b0e879f0

# Luego copiar el código a:
# supabase/functions/make-server-b0e879f0/index.ts

# Deploy
supabase functions deploy make-server-b0e879f0
```

---

### **Error: "Unauthorized"**

**Solución:**
```bash
# Re-login
supabase logout
supabase login
```

---

## 📋 COMANDOS ÚTILES

### **Ver todas las funciones:**
```bash
supabase functions list
```

### **Ver logs en tiempo real:**
```bash
supabase functions logs make-server-b0e879f0 --follow
```

### **Eliminar y recrear función:**
```bash
supabase functions delete make-server-b0e879f0
supabase functions deploy make-server-b0e879f0
```

---

## ✅ RESULTADO ESPERADO

Después del deploy:

```
[handleSignup] Attempting signup for: test@test.com
[API] Signing up: test@test.com
[API] Signup successful for: test@test.com
[API] Setting auth token after signup        ← ✅ NUEVO
[handleSignup] Signup successful, starting onboarding

... completa onboarding ...

[API] 📡 Guardando usuario en backend...
[API] 📡 Response status: 200               ← ✅ NO más 401
[API] ✅ Usuario guardado correctamente
```

---

## 🎯 RESUMEN

**Más fácil:**
1. `npm install -g supabase`
2. `supabase login`
3. `supabase link --project-ref fzvsbpgqfubbqmqqxmwv`
4. `supabase functions deploy make-server-b0e879f0`
5. ✅ Listo en 2 minutos

**Si no puedes instalar CLI:**
- Usa GitHub integration
- O usa el workaround que agregué al frontend (ya está funcionando)

---

**¿Cuál opción prefieres?** 🚀
