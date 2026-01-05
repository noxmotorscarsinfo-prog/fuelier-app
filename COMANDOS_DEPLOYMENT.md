# 🚀 COMANDOS RÁPIDOS - DEPLOYMENT

**Copia y pega estos comandos en orden**

---

## 📦 PASO 1: VERIFICAR Y COMPILAR

```bash
# Compilar proyecto (verificar que funcione)
npm run build
```

**✅ Espera a que diga:** `✓ built in XXXms`

---

## 📝 PASO 2: SUBIR A GITHUB

### Si es la primera vez:

```bash
# Inicializar Git (si no está)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Deploy Fuelier - Version 1.0"

# Crear branch main
git branch -M main

# Agregar remote (REEMPLAZA TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/fuelier-app.git

# Subir código
git push -u origin main
```

---

### Si ya existe el repositorio (actualización):

```bash
# Agregar cambios
git add .

# Commit con mensaje
git commit -m "Update Fuelier app - $(date +'%Y-%m-%d')"

# Subir a GitHub
git push
```

---

## 🌐 PASO 3: DEPLOYMENT EN VERCEL

### Opción A: Por interfaz web (Recomendado)

1. **Ir a:** https://vercel.com/new
2. **Importar** tu repositorio `fuelier-app`
3. **Agregar variables de entorno:**
   ```
   VITE_SUPABASE_URL = [tu_url]
   VITE_SUPABASE_ANON_KEY = [tu_key]
   VITE_SUPABASE_SERVICE_ROLE_KEY = [tu_service_key]
   ```
4. **Click:** Deploy
5. **Esperar 2-3 minutos**
6. **✅ Listo!**

---

### Opción B: Por CLI (Avanzado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir instrucciones en pantalla
```

---

## 🎯 PASO 4: VERIFICAR

```bash
# Tu app estará en:
# https://fuelier-app-xxx.vercel.app

# Admin access:
# https://fuelier-app-xxx.vercel.app/#adminfueliercardano
```

---

## 🔄 ACTUALIZACIONES FUTURAS

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en el código

# 2. Commit y push
git add .
git commit -m "Update: [descripción de cambios]"
git push

# 3. ✅ Vercel redeploya automáticamente (30 segundos)
```

---

## 🐛 COMANDOS DE DEBUGGING

### Si algo falla, usa estos:

```bash
# Ver status de Git
git status

# Ver logs de build
npm run build

# Ver remotes configurados
git remote -v

# Ver archivos ignorados
cat .gitignore

# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Ver versión de Node
node --version

# Ver versión de npm
npm --version
```

---

## 📋 CHECKLIST RÁPIDO

```bash
# Ejecuta esto para verificar todo:
echo "🔍 Verificando proyecto..."
npm run build && echo "✅ Build OK" || echo "❌ Build FAILED"
git status && echo "✅ Git OK" || echo "❌ Git not initialized"
echo "✅ Verificación completa"
```

---

## 🎉 LISTO PARA DEPLOYMENT

Si todos los comandos pasaron sin error:

**1. Sube a GitHub** (comandos arriba)  
**2. Ve a Vercel:** https://vercel.com/new  
**3. Importa y deploya**  
**4. ✅ ¡Listo en 3 minutos!**

---

**¿Necesitas ayuda con algún comando?** Dime en cuál te quedaste 🚀
