# 🚀 GUÍA COMPLETA DE DEPLOYMENT - FUELIER

**Fecha:** 3 de Enero de 2026  
**Plataforma:** Vercel (Recomendada)  
**Tiempo estimado:** 10-15 minutos

---

## 📋 REQUISITOS PREVIOS

### ✅ Lo que necesitas:

1. **Cuenta de GitHub** (gratis)
   - Si no tienes: https://github.com/join

2. **Cuenta de Vercel** (gratis)
   - Si no tienes: https://vercel.com/signup

3. **Git instalado** en tu computadora
   - Verificar: Abre terminal y escribe `git --version`
   - Si no tienes: https://git-scm.com/downloads

4. **Proyecto Fuelier** en tu computadora

---

## 🎯 PASO 1: PREPARAR EL PROYECTO

### 1.1 Crear archivo .gitignore (si no existe)

Abre terminal en la carpeta del proyecto y ejecuta:

```bash
# Crear .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.production.local
.env.development.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories
.vscode/
.idea/
*.sublime-*

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
.cache/
EOF
```

---

## 🎯 PASO 2: CREAR REPOSITORIO EN GITHUB

### 2.1 Inicializar Git (si no está inicializado)

```bash
# Verificar si ya está inicializado
git status

# Si da error "not a git repository", inicializar:
git init
```

### 2.2 Agregar todos los archivos

```bash
# Agregar todos los archivos al staging
git add .

# Hacer primer commit
git commit -m "Initial commit - Fuelier app ready for deployment"
```

### 2.3 Crear repositorio en GitHub

1. **Ve a GitHub:** https://github.com/new
2. **Nombre del repositorio:** `fuelier-app` (o el que prefieras)
3. **Visibilidad:** Private (recomendado) o Public
4. **NO marques:** "Initialize with README" (ya tenemos código)
5. **Click:** "Create repository"

### 2.4 Conectar proyecto local con GitHub

GitHub te mostrará comandos. Copia y ejecuta:

```bash
# Agregar remote (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/fuelier-app.git

# Renombrar branch a main
git branch -M main

# Subir código
git push -u origin main
```

**✅ Checkpoint:** Refresca la página de GitHub y deberías ver todos tus archivos.

---

## 🎯 PASO 3: DEPLOYMENT EN VERCEL

### 3.1 Ir a Vercel

1. **Abre:** https://vercel.com
2. **Login** con tu cuenta de GitHub
3. **Click:** "Add New..." → "Project"

### 3.2 Importar repositorio

1. Verás una lista de tus repositorios de GitHub
2. **Busca:** `fuelier-app` (o el nombre que pusiste)
3. **Click:** "Import"

### 3.3 Configurar proyecto

Vercel detectará automáticamente que es un proyecto Vite. Configuración:

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**✅ Estos valores ya están por defecto, NO cambies nada.**

### 3.4 Variables de entorno

**IMPORTANTE:** Necesitas agregar tus credenciales de Supabase.

1. **Click:** "Environment Variables"
2. **Agregar estas 3 variables:**

```
Name: VITE_SUPABASE_URL
Value: [TU_SUPABASE_URL]

Name: VITE_SUPABASE_ANON_KEY
Value: [TU_SUPABASE_ANON_KEY]

Name: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: [TU_SUPABASE_SERVICE_ROLE_KEY]
```

**¿Dónde encontrar estos valores?**
- Ve a tu proyecto de Supabase: https://supabase.com/dashboard
- Click en tu proyecto
- Settings → API
- Copia los valores

### 3.5 Deploy!

1. **Click:** "Deploy"
2. **Espera 2-3 minutos** mientras Vercel:
   - ✅ Instala dependencias
   - ✅ Compila el proyecto
   - ✅ Sube a producción

---

## 🎯 PASO 4: VERIFICAR DEPLOYMENT

### 4.1 Acceder a la app

Una vez completado, verás:

```
🎉 Congratulations! Your project has been deployed!

Visit: https://fuelier-app-xxx.vercel.app
```

**Click en el link** para abrir tu app en producción.

### 4.2 Probar acceso admin

1. **Copia el link de producción**
2. **Agrega al final:** `#adminfueliercardano`
3. **Ejemplo:** `https://fuelier-app-xxx.vercel.app/#adminfueliercardano`
4. **Login:**
   - Email: `admin@fuelier.com`
   - Password: `Fuelier2025!`

✅ **Si funciona, deployment exitoso!**

---

## 🎯 PASO 5: CONFIGURAR DOMINIO PERSONALIZADO (Opcional)

### 5.1 Si tienes un dominio

1. En Vercel, ve a tu proyecto
2. **Settings** → **Domains**
3. **Add domain:** `tudominio.com`
4. Vercel te dará instrucciones DNS
5. Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.)
6. Agrega los registros DNS que Vercel te indica
7. Espera 10-60 minutos para propagación

### 5.2 Si NO tienes dominio

Vercel te da gratis: `fuelier-app-xxx.vercel.app`

**¡Esto es suficiente para empezar!**

---

## 🔄 PASO 6: ACTUALIZAR LA APP (Deployments futuros)

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en tu código

# 2. Guardar y hacer commit
git add .
git commit -m "Descripción de los cambios"

# 3. Subir a GitHub
git push

# 4. ✅ Vercel detecta automáticamente y redeploya
```

**¡Así de fácil!** Vercel hace deployment automático cada vez que haces push.

---

## 📊 MONITOREO Y ANALYTICS

### Ver estadísticas en Vercel:

1. **Dashboard:** https://vercel.com/dashboard
2. **Tu proyecto** → Analytics
3. Verás:
   - Visitantes
   - Páginas vistas
   - Performance
   - Errores

---

## 🐛 TROUBLESHOOTING

### ❌ Error: "Build failed"

**Solución:**
1. Ve a Vercel → Deployments → Click en el deployment fallido
2. Lee los logs
3. Busca el error
4. Común: Dependencias faltantes

```bash
# En local, verifica que compile:
npm run build

# Si falla local, arregla el error
# Si funciona local, puede ser error de env variables
```

---

### ❌ Error: "Pantalla blanca en producción"

**Solución:**
1. Abre consola del navegador (F12)
2. Ve a "Console"
3. Busca errores
4. Común: Falta configurar variables de entorno

**Verificar:**
- Settings → Environment Variables
- Asegúrate de tener las 3 variables de Supabase

---

### ❌ Error: "Cannot connect to Supabase"

**Solución:**
1. Verifica que las variables de entorno estén correctas
2. En Supabase, verifica que el proyecto esté activo
3. Verifica que las URLs no tengan espacios extras

---

### ❌ Error: "Admin route not working"

**Solución:**
El hash `#adminfueliercardano` funciona en Vercel.

Si no funciona:
1. Intenta: `?adminfueliercardano=true`
2. Abre consola (F12) y busca: `🔐 Admin route detected`
3. Si no aparece, puede ser cache. Presiona `Ctrl+Shift+R`

---

## 📝 CHECKLIST FINAL

- [ ] Código en GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Deployment exitoso (verde ✅)
- [ ] App accesible en URL de producción
- [ ] Login funciona
- [ ] Admin accesible con `#adminfueliercardano`
- [ ] Supabase conectado correctamente

---

## 🎉 ¡LISTO!

Tu app está en producción. Comparte el link:

```
https://fuelier-app-xxx.vercel.app
```

**Admin access:**
```
https://fuelier-app-xxx.vercel.app/#adminfueliercardano
```

---

## 📞 SOPORTE

Si algo no funciona, dime:
1. ¿En qué paso estás?
2. ¿Qué error ves?
3. Screenshot si es posible

¡Y lo arreglamos! 🚀
