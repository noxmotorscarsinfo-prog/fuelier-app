# ✅ CHECKLIST PRE-DEPLOYMENT - FUELIER

**Versión:** 1.0.0-pre-release  
**Fecha:** 8 de Enero de 2026  
**Tiempo estimado total:** 2-3 horas

---

## 🔴 FASE 1: CORRECCIONES CRÍTICAS (BLOQUEANTES)

### 1.1 Dependencias
- [ ] **Eliminar react-router-dom**
  - Comando: `npm uninstall react-router-dom`
  - Verificar: `grep "react-router-dom" package.json` → Sin resultados
  - Ahorro: ~250KB en bundle

### 1.2 Error Handling
- [ ] **App.tsx - Save user (línea 298-305)**
  ```typescript
  api.saveUser(user).catch(error => {
    console.error('❌ [CRITICAL] Error saving user:', error);
  });
  ```

- [ ] **App.tsx - Save daily logs (línea 307-312)**
  ```typescript
  api.saveDailyLogs(user.email, dailyLogs).catch(error => {
    console.error('❌ [CRITICAL] Error saving logs:', error);
  });
  ```

- [ ] **App.tsx - Save saved diets (línea 314-319)**
  ```typescript
  api.saveSavedDiets(user.email, savedDiets).catch(error => {
    console.error('❌ [CRITICAL] Error saving diets:', error);
  });
  ```

- [ ] **App.tsx - Save favorite meals (línea 321-326)**
  ```typescript
  api.saveFavoriteMeals(user.email, favoriteMealIds).catch(error => {
    console.error('❌ [CRITICAL] Error saving favorites:', error);
  });
  ```

- [ ] **App.tsx - Save bug reports (línea 328-333)**
  ```typescript
  api.saveBugReports(bugReports).catch(error => {
    console.error('❌ [CRITICAL] Error saving bug reports:', error);
  });
  ```

### 1.3 Supabase Client
- [ ] **Verificar singleton en `/src/app/utils/supabase.ts`**
  - Solo UNA llamada a `createClient()`
  - Variable `supabaseInstance` correcta

- [ ] **Añadir comentarios clarificadores**
  ```typescript
  // =====================================================
  // CLIENTE SINGLETON DE SUPABASE
  // ⚠️ IMPORTANTE: Este es el ÚNICO lugar donde se crea
  // =====================================================
  ```

### 1.4 Variables de Entorno
- [ ] **Verificar `.env.local` existe**
  ```bash
  VITE_SUPABASE_URL=https://[proyecto].supabase.co
  VITE_SUPABASE_ANON_KEY=[tu-anon-key]
  ```

- [ ] **Verificar variables en Vercel**
  - `VITE_SUPABASE_URL` ✓
  - `VITE_SUPABASE_ANON_KEY` ✓
  - `SUPABASE_URL` ✓
  - `SUPABASE_ANON_KEY` ✓
  - `SUPABASE_SERVICE_ROLE_KEY` ✓
  - `SUPABASE_DB_URL` ✓

### 1.5 Build Local
- [ ] **Ejecutar build local exitoso**
  ```bash
  npm run build
  ```
  - Sin errores ✓
  - Warnings aceptables (< 5) ✓
  - Tamaño < 3MB ✓

---

## 🟡 FASE 2: MEJORAS RECOMENDADAS (IMPORTANTE)

### 2.1 Code Quality
- [ ] **Limpiar console.logs de debug**
  - Dashboard.tsx (múltiples logs)
  - App.tsx (logs de carga)
  - Mantener console.error y console.warn

- [ ] **Añadir keys únicas en listas**
  - Buscar: `map((item, index) =>` sin key
  - Cambiar a: `map((item) => ... key={item.id})`

### 2.2 Performance
- [ ] **Verificar no hay memory leaks**
  - useEffects tienen cleanup
  - Listeners se remueven
  - Intervals se limpian

- [ ] **Dashboard.tsx - Verificar dependencias useEffect**
  - Línea 96-159: useEffect de detección cena
  - Asegurar no hay loops infinitos

### 2.3 Testing Manual
- [ ] **Login Flow**
  - Login con email existente ✓
  - Signup nuevo usuario ✓
  - Admin login (adminfueliercardano) ✓

- [ ] **Onboarding**
  - Sexo → Edad → Peso → Altura → Actividad ✓
  - Cálculo de macros correcto ✓
  - Distribución de comidas ✓
  - Preferencias alimentarias ✓

- [ ] **Dashboard**
  - Carga correctamente ✓
  - Muestra macros del día ✓
  - Cards de comidas activas ✓
  - Peso se guarda ✓

- [ ] **Añadir Comidas**
  - Seleccionar desayuno ✓
  - Seleccionar comida ✓
  - Seleccionar snack (si aplica) ✓
  - Seleccionar cena ✓
  - Escala correctamente ✓

- [ ] **Historial**
  - Muestra días anteriores ✓
  - Calendario funciona ✓
  - Copiar día funciona ✓

- [ ] **Admin Panel**
  - Acceso con credenciales ✓
  - CSV import funciona ✓
  - Ingredientes se cargan ✓
  - Búsqueda funciona ✓
  - Eliminación funciona ✓

---

## 🟢 FASE 3: OPTIMIZACIONES (OPCIONAL)

### 3.1 Bundle Size
- [ ] **Code Splitting**
  ```typescript
  const AdminPanel = lazy(() => import('./components/AdminPanel'));
  const Recharts = lazy(() => import('recharts'));
  ```

- [ ] **Verificar tamaño post-build**
  ```bash
  du -sh dist/
  ls -lh dist/assets/*.js | sort -k5 -hr
  ```

### 3.2 SEO & Meta Tags
- [ ] **index.html - Meta tags**
  - Title: "Fuelier - Gestión Inteligente de Dieta"
  - Description actualizada
  - Open Graph tags

- [ ] **Favicon**
  - Verificar existe en /public
  - Tamaños: 16x16, 32x32, 192x192

### 3.3 Error Boundaries
- [ ] **Componente ErrorBoundary**
  - Crear en `/src/app/components/ErrorBoundary.tsx`
  - Envolver App principal
  - UI de error amigable

---

## 🚀 FASE 4: DEPLOYMENT

### 4.1 Pre-Deployment
- [ ] **Commit final**
  ```bash
  git add .
  git commit -m "fix: correcciones críticas pre-deployment"
  git push origin main
  ```

- [ ] **Tag de versión**
  ```bash
  git tag -a v1.0.0 -m "Release v1.0.0 - MVP"
  git push origin v1.0.0
  ```

### 4.2 Vercel Deployment
- [ ] **Deploy a preview**
  ```bash
  vercel
  ```
  - Verificar preview URL
  - Testing en preview

- [ ] **Deploy a producción**
  ```bash
  vercel --prod
  ```

### 4.3 Post-Deployment
- [ ] **Verificar producción**
  - URL carga correctamente
  - No hay errores en consola
  - Funcionalidades core funcionan

- [ ] **Performance metrics**
  - Lighthouse score > 70
  - First Contentful Paint < 3s
  - Time to Interactive < 5s

- [ ] **Monitorear primeras 24h**
  - Errores en logs
  - Comportamiento de usuarios
  - Performance real

---

## 📊 MÉTRICAS DE ÉXITO

### Build
- ✅ Tamaño total: < 3MB
- ✅ Build time: < 2 minutos
- ✅ Sin errores críticos
- ✅ Warnings: < 5

### Performance
- ✅ Lighthouse Performance: > 70
- ✅ First Contentful Paint: < 3s
- ✅ Time to Interactive: < 5s
- ✅ Cumulative Layout Shift: < 0.1

### Funcionalidad
- ✅ Login/Signup: 100%
- ✅ Onboarding: 100%
- ✅ Dashboard: 100%
- ✅ Añadir comidas: 100%
- ✅ Historial: 100%
- ✅ Admin: 100%

---

## 🎯 SCRIPT AUTOMATIZADO

Para ejecutar todas las correcciones críticas automáticamente:

```bash
chmod +x SCRIPT_CORRECCIONES_AUTO.sh
bash SCRIPT_CORRECCIONES_AUTO.sh
```

Este script:
1. ✅ Elimina react-router-dom
2. ✅ Añade error handling en useEffects
3. ✅ Añade comentarios en supabase.ts
4. ✅ Verifica .env.local
5. ✅ Ejecuta build de prueba
6. ✅ Crea backups automáticos

**Tiempo:** ~10 minutos automatizado

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### "Cannot find module 'react-router-dom'"
```bash
# Buscar imports restantes
grep -r "react-router-dom" src/
# Eliminar todos los imports encontrados
```

### "Multiple GoTrueClient instances detected"
```bash
# Verificar solo un createClient
grep -r "createClient(" src/
# Debe aparecer solo en src/app/utils/supabase.ts
```

### Build falla con error de memoria
```bash
# Aumentar límite de memoria
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### .env.local no se lee
```bash
# Verificar prefijo VITE_
# Variables deben empezar con VITE_
# Reiniciar dev server después de cambios
```

---

## 📞 CONTACTO Y SOPORTE

### Durante deployment:
- 🔍 Revisar logs: `vercel logs [deployment-url]`
- 📊 Dashboard Vercel: monitor de errores
- 🐛 Rollback si es necesario: `vercel rollback`

### Post-deployment:
- 📈 Analytics: configurar en próxima iteración
- 🔔 Monitoring: considerar Sentry
- 📝 Documentación: mantener actualizada

---

## ✨ RESUMEN EJECUTIVO

### Estado actual: CASI LISTO ✅

#### ✅ Funcionando:
- Core de dieta y macros
- Sistema adaptativo
- CSV import
- Backend robusto
- RLS corregido

#### ⚠️ Requiere corrección (1-2h):
- Error handling (30 min)
- Eliminar dependencia (5 min)
- Verificar entorno (5 min)
- Build y test (30 min)

#### 🎯 Recomendación:
**Aplicar correcciones críticas → Testing → DEPLOY**

### Tiempo total estimado:
- **Correcciones automáticas:** 10-15 minutos
- **Testing manual:** 30-45 minutos
- **Deployment:** 15-20 minutos
- **Total:** 1-1.5 horas

---

## 🎬 READY TO DEPLOY?

### Quick Check:
```bash
# 1. Correcciones aplicadas
bash SCRIPT_CORRECCIONES_AUTO.sh

# 2. Testing rápido
npm run build
npx serve dist

# 3. Deploy
vercel --prod
```

### Si todo está ✅:
```
🚀 ¡ADELANTE CON EL DEPLOYMENT!
```

---

**Last updated:** 8 de Enero de 2026  
**Next review:** Post-deployment (primeras 24h)  
**Version:** 1.0.0-pre-release
