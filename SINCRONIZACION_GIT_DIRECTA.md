# 🚀 SINCRONIZACIÓN DIRECTA CON GIT (Método más rápido)

## ⚡ MÉTODO RECOMENDADO: Usar Git directamente desde VS Code

Dado que los archivos grandes no pueden descargarse por GitHub MCP, la forma MÁS RÁPIDA y SEGURA es usar Git directamente.

---

## 📋 OPCIÓN A: Sincronización completa con Git (5 minutos)

### Requisitos:
- VS Code con tu proyecto abierto
- Git instalado
- Conexión a internet

### Pasos:

1. **Abre VS Code en tu proyecto local de fuelier-app:**
   ```bash
   cd /ruta/a/tu/proyecto/fuelier-app
   code .
   ```

2. **Abre la terminal integrada:**
   - Windows/Mac: `Ctrl + ñ` o `View → Terminal`

3. **Verifica que estás en la rama correcta:**
   ```bash
   git status
   git branch
   ```

4. **Descarta cambios locales no guardados (si los hay):**
   ```bash
   # Ver qué archivos han cambiado
   git status
   
   # Si quieres guardar cambios locales primero
   git stash
   
   # O descarta todo (usa con cuidado)
   git reset --hard HEAD
   ```

5. **Haz pull desde GitHub:**
   ```bash
   git pull origin main
   ```

6. **Si hay conflictos, acéptalos del remoto (GitHub tiene la verdad):**
   ```bash
   # Aceptar todo desde origin/main
   git checkout --theirs .
   git add .
   git commit -m "Sync from GitHub"
   ```

7. **Verifica que tienes el commit correcto:**
   ```bash
   git log --oneline -5
   ```
   
   Deberías ver el commit: `21aee42 Fix CRÍTICO: Mapear meal_types de BD a type en frontend`

8. **Copia los 3 archivos desde tu proyecto local a Figma Make:**
   - `/supabase/functions/make-server-b0e879f0/index.ts`
   - `/src/app/utils/api.ts`
   - `/src/app/App.tsx`

9. **Deploy del backend:**
   ```bash
   supabase functions deploy make-server-b0e879f0 --no-verify-jwt
   ```

**¡Listo! 🎉**

---

## 📋 OPCIÓN B: Descargar archivos individuales con curl (10 minutos)

### Si no tienes Git o prefieres descargar archivos específicos:

1. **Abre terminal en tu máquina local (no Figma Make):**

2. **Descarga los 3 archivos grandes:**

   ```bash
   # Backend index.ts
   curl -o backend-index.ts \
     "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts"
   
   # API Frontend
   curl -o frontend-api.ts \
     "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/utils/api.ts"
   
   # App.tsx
   curl -o App.tsx \
     "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/App.tsx"
   ```

3. **Verifica que se descargaron correctamente:**
   ```bash
   ls -lh *.ts *.tsx
   ```
   
   Deberías ver:
   - `backend-index.ts` (~57 KB)
   - `frontend-api.ts` (~42 KB)
   - `App.tsx` (~66 KB)

4. **Copia los archivos a Figma Make:**
   - Abre cada archivo descargado
   - Copia todo el contenido (Ctrl+A, Ctrl+C)
   - Pega en el archivo correspondiente en Figma Make

5. **Deploy del backend:**
   ```bash
   supabase functions deploy make-server-b0e879f0 --no-verify-jwt
   ```

---

## 📋 OPCIÓN C: Clone fresh desde GitHub (15 minutos)

### Si quieres empezar desde cero con garantía 100%:

1. **Clone el repositorio en una carpeta temporal:**
   ```bash
   cd ~/Desktop  # o cualquier carpeta temporal
   git clone https://github.com/noxmotorscarsinfo-prog/fuelier-app.git fuelier-temp
   cd fuelier-temp
   ```

2. **Verifica que estás en el commit correcto:**
   ```bash
   git log --oneline -1
   # Deberías ver: 21aee42 Fix CRÍTICO: Mapear meal_types de BD a type en frontend
   ```

3. **Copia los 3 archivos críticos a Figma Make:**
   ```bash
   # Abre los archivos con tu editor
   code supabase/functions/make-server-b0e879f0/index.ts
   code src/app/utils/api.ts
   code src/app/App.tsx
   ```

4. **Copia manualmente el contenido a Figma Make**

5. **Limpia la carpeta temporal:**
   ```bash
   cd ..
   rm -rf fuelier-temp
   ```

6. **Deploy del backend:**
   ```bash
   cd /ruta/a/tu/proyecto/original
   supabase functions deploy make-server-b0e879f0 --no-verify-jwt
   ```

---

## 📋 OPCIÓN D: Usar wget (alternativa a curl)

### Si tienes wget en lugar de curl:

```bash
# Backend
wget -O backend-index.ts \
  "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts"

# API Frontend
wget -O frontend-api.ts \
  "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/utils/api.ts"

# App.tsx
wget -O App.tsx \
  "https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/src/app/App.tsx"
```

---

## 🎯 RECOMENDACIÓN

**La OPCIÓN A (Git pull) es la MÁS RÁPIDA y SEGURA** porque:
- ✅ Sincroniza TODOS los archivos automáticamente
- ✅ Garantiza que tienes la versión exacta de GitHub
- ✅ No hay riesgo de errores de copy-paste
- ✅ Toma solo 5 minutos

**Usa las otras opciones solo si:**
- ❌ No tienes Git instalado
- ❌ Tienes cambios locales importantes que no quieres perder
- ❌ Solo necesitas actualizar archivos específicos

---

## ✅ VERIFICACIÓN POST-SINCRONIZACIÓN

Después de sincronizar con cualquier método:

1. **Verifica los archivos:**
   ```bash
   # Contar líneas
   wc -l supabase/functions/make-server-b0e879f0/index.ts  # ~1400 líneas
   wc -l src/app/utils/api.ts                              # ~1200 líneas
   wc -l src/app/App.tsx                                   # ~1800 líneas
   ```

2. **Busca las palabras clave críticas:**
   ```bash
   # Backend debe tener training endpoints
   grep -n "training-plan" supabase/functions/make-server-b0e879f0/index.ts
   grep -n "day_plan_index" supabase/functions/make-server-b0e879f0/index.ts
   
   # API debe tener funciones de training
   grep -n "getTrainingPlan" src/app/utils/api.ts
   grep -n "saveTrainingPlan" src/app/utils/api.ts
   
   # App debe tener auto-detección ES256
   grep -n "ES256" src/app/App.tsx
   grep -n "recoverSession" src/app/App.tsx
   ```

3. **Deploy y verifica:**
   ```bash
   supabase functions deploy make-server-b0e879f0 --no-verify-jwt
   
   # Health check
   curl https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health
   ```

4. **Prueba en el navegador:**
   - Login
   - Ve a Training Dashboard
   - Verifica que dayPlanIndex y dayPlanName NO son null
   - Crea un nuevo día de entrenamiento
   - Guarda y recarga
   - Confirma que persiste

---

## 🆘 TROUBLESHOOTING

### Error: "git pull" muestra conflictos
```bash
# Resolver aceptando todo desde remoto
git checkout --theirs .
git add .
git commit -m "Sync from GitHub"
```

### Error: "supabase: command not found"
```bash
# Instalar Supabase CLI
npm install -g supabase

# O con Homebrew (Mac)
brew install supabase/tap/supabase
```

### Error: "curl: command not found" (Windows)
Usa PowerShell con `Invoke-WebRequest`:
```powershell
Invoke-WebRequest -Uri "URL" -OutFile "archivo.ts"
```

### Error: "permission denied" al hacer deploy
```bash
# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref fzvsbpgqfubbqmqqxmwv
```

---

## 💡 TIPS PROFESIONALES

1. **Usa Git siempre que sea posible** - es más confiable
2. **Haz backup antes** de sobrescribir archivos importantes
3. **Verifica el commit SHA** para estar seguro de la versión
4. **Prueba en local antes de hacer deploy** si es posible
5. **Lee los logs** del backend después del deploy

---

## ⏱️ COMPARACIÓN DE TIEMPOS

| Método | Tiempo | Dificultad | Confiabilidad |
|--------|--------|------------|---------------|
| Git pull (A) | 5 min | Muy fácil | ⭐⭐⭐⭐⭐ |
| curl (B) | 10 min | Fácil | ⭐⭐⭐⭐ |
| Clone fresh (C) | 15 min | Fácil | ⭐⭐⭐⭐⭐ |
| Manual (D) | 20 min | Media | ⭐⭐⭐ |

---

**Recomendación final: Usa la Opción A (Git pull) para sincronización más rápida y confiable. 🚀**

---

_Última actualización: 26 de enero de 2026_  
_Commit de referencia: 21aee42332e269a75b8fdfe9feb282f2a2e6d248_
