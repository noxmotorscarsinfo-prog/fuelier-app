# 🚀 GUÍA DE DEPLOYMENT PRODUCCIÓN - FUELIER APP

## ✅ PRE-DEPLOYMENT CHECKLIST

### Correcciones Aplicadas
- ✅ Bug crítico: Ingredientes faltantes - Agregado fallback robusto
- ✅ Bug crítico: Validación de peso (20-300 kg)
- ✅ Bug menor: Manejo de errores en localStorage (try-catch)
- ✅ Bug menor: Manejo de errores en JSON.parse
- ✅ Configuración: package.json actualizado (v1.0.0)
- ✅ Configuración: .gitignore creado
- ✅ Configuración: .env.example creado
- ✅ Build: Compilación exitosa sin errores

### Estado del Build
```
✓ 2531 modules transformed
✓ Build completado en 18.18s
✓ Tamaño total: ~2.5 MB (comprimido: ~680 KB)
✓ Sin errores de TypeScript
✓ Sin errores de compilación
```

⚠️ **Advertencia**: Chunk principal > 500 KB
- Recomendación: Implementar code-splitting para mejorar carga inicial
- Para v1.0: Aceptable, optimizar en v1.1

---

## 📋 PASOS PARA DEPLOYMENT

### 1. Vercel (Frontend)

#### A. Preparación
```bash
# Verificar que el build funciona localmente
npm run build
npm run preview

# El sitio debería estar en http://localhost:4173
```

#### B. Deploy en Vercel
```bash
# Instalar Vercel CLI (si no está instalado)
npm install -g vercel

# Login en Vercel
vercel login

# Deploy
vercel --prod
```

#### C. Configuración en Vercel Dashboard
1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto "fuelier-app"
3. Ir a Settings → Environment Variables
4. NO es necesario agregar variables (están hardcodeadas en utils/supabase/info.tsx)
5. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### D. Dominio Personalizado (Opcional)
1. Settings → Domains
2. Agregar dominio custom (ej: app.fuelier.com)
3. Configurar DNS según instrucciones de Vercel

---

### 2. Supabase (Backend)

#### A. Edge Function Ya Deployada
La función `make-server-b0e879f0` ya está deployada en Supabase.

#### B. Verificar Estado
```bash
# Ver funciones deployadas
supabase functions list

# Si necesitas re-deployar
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

#### C. Configuración de Tablas
Todas las tablas ya están creadas:
- ✅ users
- ✅ daily_logs
- ✅ saved_diets
- ✅ base_meals
- ✅ base_ingredients
- ✅ bug_reports
- ✅ training_data
- ✅ completed_workouts
- ✅ training_plans
- ✅ training_progress

#### D. Políticas RLS
19 políticas de Row Level Security ya configuradas.

---

## 🔐 CREDENCIALES DE PRODUCCIÓN

### Supabase
- **Project ID**: fzvsbpgqfubbqmqqxmwv
- **URL**: https://fzvsbpgqfubbqmqqxmwv.supabase.co
- **Anon Key**: (Ver utils/supabase/info.tsx)
- **Service Key**: (Solo en Supabase Dashboard)

### Admin Panel
- **URL**: https://tu-dominio.vercel.app/#adminfueliercardano
- **Email**: admin@fuelier.com
- **Password**: Fuelier2025!

---

## 🧪 TESTING POST-DEPLOYMENT

### 1. Smoke Test Básico
```
✅ Cargar sitio principal
✅ Registro de nuevo usuario
✅ Login con usuario existente
✅ Completar onboarding
✅ Ver dashboard
✅ Seleccionar comidas
✅ Guardar día completo
✅ Ver historial
✅ Acceder a admin panel
```

### 2. Test de Integración
```
✅ Crear usuario → DB actualizada
✅ Guardar comida → daily_logs actualizado
✅ Actualizar peso → Recalcula macros
✅ Sistema adaptativo → Ajuste semanal
✅ Bug report → Guardado en DB
```

### 3. Test de Performance
```
⏱️ Tiempo de carga inicial: < 3s
⏱️ Time to Interactive: < 5s
⏱️ API response time: < 500ms
```

---

## 📊 MONITOREO

### Vercel Analytics
1. Activar Vercel Analytics en Dashboard
2. Monitorear:
   - Page Views
   - Unique Visitors
   - Performance Metrics
   - Error Rate

### Supabase Dashboard
1. Database → Monitoring
2. Edge Functions → Logs
3. Authentication → Users
4. Storage → Usage

---

## 🐛 DEBUGGING EN PRODUCCIÓN

### Ver Logs de Vercel
```bash
vercel logs
```

### Ver Logs de Supabase
1. Dashboard → Edge Functions → Logs
2. Filtrar por función: make-server-b0e879f0
3. Ver errores en tiempo real

### Console Logs del Usuario
Los usuarios pueden reportar bugs desde:
- Settings → Report Bug
- Los reportes se guardan en `bug_reports`

---

## 🔄 ROLLBACK (Si algo sale mal)

### Vercel
```bash
# Ver deployments
vercel ls

# Rollback al deployment anterior
vercel rollback [deployment-url]
```

### Supabase
```bash
# Re-deploy función anterior
git checkout [commit-anterior]
supabase functions deploy make-server-b0e879f0 --no-verify-jwt
```

---

## 📈 PRÓXIMOS PASOS (Post-Launch)

1. **Optimizaciones v1.1**
   - Code-splitting para reducir bundle size
   - Lazy loading de componentes pesados
   - Comprimir imágenes y assets

2. **Nuevas Features v1.2**
   - Exportación de dietas a PDF
   - Integración con wearables
   - Modo offline con Service Workers

3. **Monitoreo Continuo**
   - Configurar alertas de errores
   - Analytics de uso
   - Feedback de usuarios beta

---

## 🆘 SOPORTE

- **Documentación Técnica**: Ver `INDICE_MAESTRO_FINAL.md`
- **Problemas Conocidos**: Ver `BUGS_CORREGIDOS_FINAL.md`
- **Arquitectura**: Ver `ARCHITECTURE.md`

---

**Estado Final**: ✅ LISTO PARA PRODUCCIÓN

**Última Actualización**: 10 de Enero de 2026
**Build Version**: 1.0.0
**Build Hash**: [Obtener de `git rev-parse HEAD`]

---

## 🎉 ¡A DEPLOYAR!

```bash
# Comando único para deploy completo
vercel --prod
```

**URL Esperada**: https://fuelier-app-[random].vercel.app
