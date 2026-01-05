# 🔐 GUÍA DE ACCESO ADMIN - FUELIER

**Actualizado:** 3 de Enero de 2026

---

## 🎯 MÚLTIPLES FORMAS DE ACCEDER

He implementado **8 formas diferentes** de acceder al panel de administración para máxima flexibilidad:

---

### ✅ MÉTODO 1: Por hash #admin
**El más simple y recomendado**

```
https://[TU_DOMINIO]/#admin
```

**Cómo usarlo:**
1. Abre la app normalmente
2. Agrega `#admin` al final de la URL en el navegador
3. Presiona Enter
4. ✅ Debe mostrar la pantalla de login admin morada

**Ejemplo:**
```
http://localhost:5173/#admin
```

---

### ✅ MÉTODO 2: Por hash #/admin
**Alternativa con slash**

```
https://[TU_DOMINIO]/#/admin
```

---

### ✅ MÉTODO 3: Por query parameter ?admin=true
**Bueno para compartir links**

```
https://[TU_DOMINIO]/?admin=true
```

---

### ✅ MÉTODO 4: Por query parameter ?mode=admin

```
https://[TU_DOMINIO]/?mode=admin
```

---

### ✅ MÉTODO 5: Por ruta completa (si el servidor lo permite)

```
https://[TU_DOMINIO]/loginfuelier123456789
```

**Nota:** En Vercel/Netlify, puede que necesites configurar redirects.

---

### ✅ MÉTODO 6: Desde el Dashboard (si eres admin)

Si ya tienes un usuario con flag `isAdmin: true`:

1. Login normal
2. En el Dashboard, aparece botón "Admin" en el header
3. Click → Acceso directo al panel

---

### ✅ MÉTODO 7: Crear usuario admin automáticamente

**Emails que activan admin automáticamente:**
- `admin@fuelier.com`
- `test@test.com`
- `admin@admin.com`

**Pasos:**
1. Registrarse con uno de estos emails
2. Completar onboarding
3. El usuario se crea con `isAdmin: true`
4. Aparece botón Admin en dashboard

---

### ✅ MÉTODO 8: Desde el Login con credenciales admin

1. Acceder por cualquiera de los métodos 1-5
2. Ingresar credenciales:
   - **Email:** `admin@fuelier.com`
   - **Password:** `Fuelier2025!`
3. Click "Iniciar Sesión"
4. ✅ Acceso al panel admin

---

## 🧪 TESTING RÁPIDO

### Test en localhost:

```bash
# 1. Iniciar la app
npm run dev

# 2. Abrir en navegador (cualquiera de estos):
http://localhost:5173/#admin
http://localhost:5173/?admin=true
http://localhost:5173/?mode=admin
```

### Test en producción:

```bash
# Reemplazar [DOMINIO] por tu dominio de Vercel
https://[DOMINIO].vercel.app/#admin
https://[DOMINIO].vercel.app/?admin=true
```

---

## 🔍 DEBUGGING

### Si no funciona el acceso:

1. **Abrir consola del navegador** (F12)
2. **Buscar logs de debug:**
   ```
   Current path: /
   Hash: #admin
   Search params: 
   Full URL: http://localhost:5173/#admin
   🔐 Admin route detected, showing admin login
   ```

3. **Verificar que veas el mensaje:** `🔐 Admin route detected`

4. **Si NO ves el mensaje:**
   - Refrescar la página (F5)
   - Limpiar caché (Ctrl+Shift+R)
   - Probar con otro método de acceso

---

## 📸 PANTALLA ESPERADA

Cuando accedas correctamente, deberías ver:

```
┌─────────────────────────────────────────┐
│                                         │
│        🛡️  (Ícono de escudo)            │
│                                         │
│    Panel de Administrador               │
│    Fuelier - Acceso Restringido         │
│                                         │
│    ┌─────────────────────────────┐     │
│    │ 📧 Correo Electrónico       │     │
│    │ [admin@fuelier.com    ]     │     │
│    └─────────────────────────────┘     │
│                                         │
│    ┌─────────────────────────────┐     │
│    │ 🔒 Contraseña               │     │
│    │ [••••••••••••••••    ]      │     │
│    └─────────────────────────────┘     │
│                                         │
│    [  Iniciar Sesión  ]                │
│                                         │
│    🔒 Este panel es de acceso          │
│       exclusivo para administradores   │
│                                         │
│    ← Volver a Fuelier                  │
└─────────────────────────────────────────┘
```

**Características de la pantalla:**
- ✅ Fondo: Gradiente morado/índigo
- ✅ Ícono: Escudo blanco
- ✅ Formulario con campos email y password
- ✅ Botón blanco "Iniciar Sesión"
- ✅ Link para volver a la app

---

## 🔑 CREDENCIALES DE ACCESO

```
Email:    admin@fuelier.com
Password: Fuelier2025!
```

**⚠️ IMPORTANTE:**
- El email y password están **hardcoded** en el código
- Es case-sensitive (respeta mayúsculas/minúsculas)
- Si fallas las credenciales, muestra error rojo

---

## ✅ DESPUÉS DEL LOGIN

Una vez que ingreses las credenciales correctas:

1. **Si NO existe usuario admin:**
   - Se crea automáticamente con datos dummy
   - Email: admin@fuelier.com
   - Sexo: Hombre
   - Edad: 30
   - Peso: 75kg
   - Altura: 175cm
   - `isAdmin: true`

2. **Redirige a:** Panel Admin (`currentScreen: 'admin'`)

3. **Panel Admin muestra:**
   - Estadísticas globales
   - Lista de bug reports
   - Gestión de usuarios
   - Opciones de administración

---

## 🎛️ DESDE EL PANEL ADMIN

**Acciones disponibles:**
- Ver bug reports
- Cambiar estado de bugs
- Ver usuarios registrados
- Estadísticas de la app
- Botón "Volver" para ir al dashboard

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: No aparece la pantalla de admin

**Solución:**
```bash
# 1. Revisar consola del navegador
# Debe aparecer: "🔐 Admin route detected"

# 2. Si no aparece, probar:
- Limpiar localStorage
- Refrescar con Ctrl+Shift+R
- Probar con otro método (#admin, ?admin=true)
```

---

### Problema 2: Credenciales incorrectas aunque sean correctas

**Solución:**
```bash
# Verificar que estás usando EXACTAMENTE:
Email: admin@fuelier.com (todo minúsculas)
Password: Fuelier2025! (F mayúscula, resto como está)
```

---

### Problema 3: Muestra login normal en vez de admin

**Posible causa:** El useEffect no detectó la ruta

**Solución:**
```bash
# Opción 1: Agregar el hash DESPUÉS de cargar
1. Cargar la app: http://localhost:5173
2. En la barra de URL, agregar: #admin
3. Presionar Enter

# Opción 2: Usar query param
http://localhost:5173/?admin=true
```

---

### Problema 4: Dice "isLoading" infinito

**Solución:**
```bash
# El useEffect debe poner setIsLoading(false)
# Si no lo hace, verificar en consola:
console.log('isAdminRoute:', isAdminRoute)
```

---

## 🔒 SEGURIDAD

### En producción, considera:

1. **Cambiar las credenciales hardcoded**
2. **Implementar autenticación real con Supabase Auth**
3. **Agregar 2FA para admin**
4. **Rate limiting en intentos de login**
5. **Logs de auditoría de acciones admin**

---

## 📝 RESUMEN RÁPIDO

**Para acceder AHORA:**

1. **Localhost:**
   ```
   http://localhost:5173/#admin
   ```

2. **Login:**
   ```
   Email: admin@fuelier.com
   Password: Fuelier2025!
   ```

3. **¡Listo!** Panel admin accesible

---

## 🎉 CONFIRMACIÓN DE ACCESO

Si ves esto, ✅ **HAS ACCEDIDO CORRECTAMENTE:**

- Pantalla morada con escudo
- Formulario de login admin
- Al ingresar credenciales → Panel Admin
- Estadísticas y bug reports visibles
- Botón "Volver" funcional

---

## 📞 SI AÚN NO FUNCIONA

**Dame más información:**
1. ¿Qué método estás usando?
2. ¿Qué ves en la consola del navegador?
3. ¿Qué pantalla aparece?
4. ¿Algún error?

Y lo arreglaré inmediatamente 🚀
