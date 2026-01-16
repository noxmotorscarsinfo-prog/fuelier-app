# 🔧 SOLUCIÓN RÁPIDA - Error 401 en FUELIER APP

## ⚡ PROBLEMA
La app muestra error 401 en todos los endpoints y no carga los platos.

## ✅ SOLUCIÓN EN 3 PASOS (2 minutos)

---

### PASO 1: Limpiar datos de la app

1. **Abrir DevTools**:
   - Windows/Linux: Presiona `F12`
   - Mac: Presiona `Cmd + Option + I`

2. **Ir a Application** (pestaña arriba)

3. **Limpiar datos**:
   - En la barra izquierda, busca "Storage"
   - Click en "Clear site data"
   - Click en el botón "Clear site data"
   - Confirmar

![Paso 1](https://i.imgur.com/clear-storage.png)

---

### PASO 2: Recargar la página

1. Cerrar DevTools (presiona `F12` de nuevo)
2. Recargar la página completamente:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

### PASO 3: Hacer login de nuevo

1. Ir a https://fuelier-app.vercel.app
2. Click en "Iniciar Sesión"
3. Introducir tu email y password
4. ✅ **IMPORTANTE**: Marcar "Recordar sesión"
5. Click en "Entrar"

**⚠️ NO uses "Sign in with Google" u otros proveedores por ahora**

---

## ✅ VERIFICAR QUE FUNCIONA

Después de hacer login, deberías ver:

1. ✅ Dashboard carga correctamente
2. ✅ Platos aparecen en la selección
3. ✅ Ingredientes se cargan
4. ✅ NO hay errores 401 en la consola

---

## 🔍 VERIFICACIÓN TÉCNICA (Opcional)

Si quieres verificar que el token es correcto:

1. Abre DevTools (`F12`)
2. Ve a pestaña **Console**
3. Busca el mensaje:
   ```
   🔑 [API] JWT issued at: ...
   ```
4. El token debería empezar con: `eyJhbGciOiJIUzI1NiIs...`
   - ✅ Si dice `HS256` = CORRECTO
   - ❌ Si dice `ES256` = Repetir Paso 1-3

---

## 🚨 SI SIGUE SIN FUNCIONAR

Si después de estos pasos sigue dando error:

1. Captura de pantalla de la consola (F12 → Console)
2. Reporta en el chat con:
   - La captura de pantalla
   - El email con el que hiciste login
   - Si usaste "Sign in with Google" o email/password

---

## 🎯 ¿QUÉ PASÓ?

**Explicación técnica simple**:
- Tenías un token antiguo guardado con un formato diferente (ES256)
- El backend esperaba el formato nuevo (HS256)
- Al limpiar localStorage y hacer login nuevo, obtienes el token correcto
- Ahora el backend soporta ambos formatos, pero es mejor usar el nuevo

---

## ⏰ TIEMPO ESTIMADO

- ⏱️ **2-3 minutos** para completar los 3 pasos
- 🚀 La app debería funcionar inmediatamente después

---

## 📞 SOPORTE

Si tienes problemas, contacta con el equipo de soporte indicando:
- Fecha y hora del problema
- Email de tu cuenta
- Captura de pantalla de la consola

---

**Actualizado**: 16 Enero 2026  
**Versión**: 1.0  
**Status**: ✅ Solución verificada y desplegada
