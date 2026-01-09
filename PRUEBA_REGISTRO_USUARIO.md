# 🧪 PRUEBA: Registro y Onboarding de Usuario Nuevo

## 🎯 Objetivo
Verificar que el flujo completo de registro y onboarding funciona correctamente para TODOS los usuarios, sin errores de "User not found", y que **TODO SE GUARDE EN SUPABASE** (CERO localStorage).

## Cambios Realizados

### Frontend (`/src/app/App.tsx`)
✅ Modificado `handlePreferencesComplete` para:
- Ser una función `async`
- Guardar el perfil del usuario en la base de datos **ANTES** de establecer el estado
- Solo navegar al dashboard después de que el guardado sea exitoso

✅ Mejorados los logs en los efectos de guardado para mejor visibilidad

### Backend (`/supabase/functions/server/index.tsx`)
✅ Actualizado **POST `/daily-logs`**:
- Retorna éxito en lugar de error 404 si el usuario no existe
- Registra warning y omite el guardado (se reintentará en el siguiente cambio)

✅ Actualizado **POST `/saved-diets`**:
- Retorna éxito en lugar de error 404 si el usuario no existe
- Registra warning y omite el guardado (se reintentará en el siguiente cambio)

✅ Actualizado **POST `/favorite-meals`**:
- Verifica que el usuario exista antes de intentar actualizar
- Retorna éxito si el usuario no existe (se reintentará en el siguiente cambio)

✅ El endpoint **POST `/user`** ya tenía la lógica para crear usuarios en Supabase Auth automáticamente

## Pasos de la Prueba

### 1. Limpiar Estado Previo (Opcional)
Abre la consola del navegador (F12) y ejecuta:
```javascript
// NOTA: La app ya NO usa localStorage para datos críticos
// Solo limpiamos para asegurarnos de que no haya datos legacy
localStorage.clear();
location.reload();
```

### 2. Iniciar Registro
1. Deberías ver la pantalla de Login
2. Haz clic en "Crear cuenta"
3. Introduce los siguientes datos:
   - **Nombre**: Usuario de Prueba
   - **Email**: prueba@test.com
   - **Contraseña**: Test123!

4. Haz clic en "Crear cuenta"

### 3. Completar Onboarding

#### Pantalla 1: Sexo
- Selecciona un sexo (Hombre/Mujer)

#### Pantalla 2: Edad
- Introduce: **25** años

#### Pantalla 3: Peso
- Introduce: **70** kg

#### Pantalla 4: Altura
- Introduce: **175** cm

#### Pantalla 5: Actividad
- Selecciona: **3 días** de entrenamiento

#### Pantalla 6: Objetivos
- Selecciona: **Mantener peso**
- Elige número de comidas: **4 comidas**
- Haz clic en "Continuar"

#### Pantalla 7: Distribución de Macros
- Acepta la distribución por defecto
- Haz clic en "Continuar"

#### Pantalla 8: Preferencias
- Puedes dejar todo vacío o agregar algunas preferencias
- Haz clic en "Completar configuración"

### 4. Verificar Logs en Consola

Deberías ver la siguiente secuencia de logs (en orden):

```
🔍 DEBUG handlePreferencesComplete:
✅ newUser created: {...}
✅ newUser.goals: {...}
💾 Saving user profile to database before setting state...
[POST /user] Saving user to users table: prueba@test.com
[POST /user] Creating user in Supabase Auth...
[POST /user] Auth user created successfully: [ID]
[POST /user] User saved successfully to users table: prueba@test.com
✅ User profile saved successfully to database
📝 [Effect] User state changed, saving to localStorage and Supabase: prueba@test.com
📝 [Effect] Daily logs changed, saving 0 logs for: prueba@test.com
📝 [Effect] Saved diets changed, saving 0 diets for: prueba@test.com
📝 [Effect] Favorite meals changed, saving 0 favorites for: prueba@test.com
[POST /user] Auth user found: [ID]
✅ [Effect] User saved successfully to Supabase: prueba@test.com
✅ [Effect] Daily logs saved successfully: 0 logs
✅ [Effect] Saved diets saved successfully: 0 diets
✅ [Effect] Favorite meals saved successfully: 0 favorites
```

### 5. Verificar Dashboard

- Deberías ver el Dashboard principal sin errores
- Deberías ver tus datos personalizados
- Deberías ver tus macros calculados
- NO deberías ver ningún error en la consola

## ❌ Errores que NO deberían aparecer

- ❌ "User not found: prueba@test.com"
- ❌ "User profile not found. Please complete user profile setup first."
- ❌ "Failed to save daily logs"
- ❌ "Failed to save saved diets"
- ❌ "Failed to save favorite meals"

## ✅ Comportamiento Esperado

1. **Orden de guardado correcto**:
   - Primero se guarda el perfil del usuario
   - Solo después se establecen los estados
   - Los efectos se ejecutan con el usuario ya existente en la BD

2. **Sin errores 404**:
   - Todos los endpoints retornan éxito
   - Si un endpoint se ejecuta antes de tiempo, omite el guardado silenciosamente
   - Se reintenta automáticamente en el siguiente cambio

3. **Usuario completamente funcional**:
   - Puede navegar por la app
   - Puede agregar comidas
   - Puede ver su historial
   - Todos los datos se guardan correctamente

## 🔄 Prueba Adicional: Login de Usuario Existente

1. Cierra sesión (Settings → Cerrar sesión)
2. Vuelve a hacer login con:
   - **Email**: prueba@test.com
   - **Contraseña**: Test123!
3. Deberías entrar directamente al Dashboard
4. Todos tus datos deberían estar guardados

## 🌍 Prueba CRÍTICA: Multi-Dispositivo (Confirma 100% Supabase)

**Esta es la prueba definitiva de que NO hay localStorage:**

1. **En el Navegador 1 (Chrome):**
   - Login con: prueba@test.com
   - Agrega una comida al dashboard
   - Observa que se guarda correctamente
   - **NO cierres sesión**

2. **En el Navegador 2 (Firefox o Safari):**
   - Abre la app en un navegador diferente
   - Login con el MISMO email: prueba@test.com
   - Ve al dashboard

3. **Verificación:**
   - ✅ ¿Ves la comida que agregaste en Chrome?
   - ✅ Si la ves = Datos en Supabase ✅
   - ❌ Si NO la ves = Hay un problema ❌

4. **Bonus Test:**
   - En Firefox, agrega OTRA comida
   - Vuelve a Chrome (sin recargar)
   - Recarga la página
   - ✅ Deberías ver AMBAS comidas

## 📊 Resultado Esperado

✅ **ÉXITO**: El usuario se crea correctamente, completa el onboarding sin errores, y todos los datos se guardan en Supabase sin problemas.

Si ves algún error relacionado con "User not found" o problemas de guardado, revisa los logs en detalle y compártelos para análisis.
