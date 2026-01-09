# 📚 ÍNDICE MAESTRO - DOCUMENTACIÓN FUELIER

## 🎯 INICIO RÁPIDO

¿Nuevo en el proyecto? Empieza aquí:

1. **📄 [RESUMEN_EJECUTIVO_FINAL.md](RESUMEN_EJECUTIVO_FINAL.md)** ← **EMPIEZA AQUÍ**
   - Visión general completa
   - Antes vs Después
   - Beneficios clave

2. **✅ [CHECKLIST_VERIFICACION_FINAL.md](CHECKLIST_VERIFICACION_FINAL.md)**
   - Pasos para verificar que todo funciona
   - Tests de funcionalidad
   - Troubleshooting

3. **🔍 [VERIFICACION_100_CLOUD.md](VERIFICACION_100_CLOUD.md)**
   - Arquitectura técnica detallada
   - 10 tablas explicadas
   - API endpoints completos

---

## 📊 DOCUMENTACIÓN POR CATEGORÍA

### 🗄️ BASE DE DATOS

#### Schema y Migraciones:
- **[supabase/migrations/schema_final.sql](supabase/migrations/schema_final.sql)** ⭐
  - Schema completo ejecutado en Supabase
  - 10 tablas estructuradas
  - 17 índices
  - 19 políticas RLS
  - 8 triggers

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
  - Documentación del schema
  - Relaciones entre tablas

- [MIGRACION_100_COMPLETA.md](MIGRACION_100_COMPLETA.md)
  - Historia de la migración de KV a Postgres

---

### 🔧 BACKEND (API)

#### Servidor Principal:
- **[supabase/functions/server/index.tsx](supabase/functions/server/index.tsx)** ⭐
  - API completa con 24+ endpoints
  - Autenticación
  - CRUD de todas las entidades
  - Validación y transformación de datos

#### Archivos Obsoletos:
- ⚠️ [supabase/functions/server/kv_store.tsx](supabase/functions/server/kv_store.tsx)
  - **OBSOLETO** - No se usa
  - Existe pero no se importa en ningún lado
  - Puedes ignorarlo

---

### 💻 FRONTEND

#### Componentes Principales:
- **[src/app/App.tsx](src/app/App.tsx)** ⭐
  - App principal
  - Routing y navegación
  - Estados globales
  - **SIN localStorage** (excepto auth token)

- [src/app/utils/api.ts](src/app/utils/api.ts) ⭐
  - Cliente API para servidor
  - Todos los endpoints del frontend

- [src/utils/supabase/client.ts](src/utils/supabase/client.ts)
  - Cliente Supabase inicializado

#### Componentes de UI:
- [src/app/components/Dashboard.tsx](src/app/components/Dashboard.tsx) - Dashboard principal
- [src/app/components/MealSelection.tsx](src/app/components/MealSelection.tsx) - Selector de comidas
- [src/app/components/History.tsx](src/app/components/History.tsx) - Historial
- [src/app/components/Settings.tsx](src/app/components/Settings.tsx) - Configuración
- [src/app/components/AdminPanel.tsx](src/app/components/AdminPanel.tsx) - Panel admin

---

### 🔐 AUTENTICACIÓN

#### Configuración:
- [utils/supabase/info.tsx](utils/supabase/info.tsx) ⭐
  - Project ID
  - Public Anon Key
  - **NO contiene Service Role Key** (seguro)

#### Flujo de Auth:
1. Usuario hace signup/login
2. Supabase Auth retorna access token
3. Frontend guarda token (único uso de localStorage permitido)
4. Cada request incluye token en header
5. Servidor valida token
6. RLS filtra datos por usuario

---

### 📈 SISTEMA ADAPTATIVO

#### Cálculo de Macros:
- [src/app/utils/automaticTargetCalculator.ts](src/app/utils/automaticTargetCalculator.ts)
  - Cálculo científico de macros
  - Basado en antropometría y actividad

- [src/app/utils/macroCalculations.ts](src/app/utils/macroCalculations.ts)
  - Opciones de macros (balanced, high protein, etc.)

#### Sistema de Aprendizaje:
- [src/app/utils/adaptiveSystem.ts](src/app/utils/adaptiveSystem.ts)
  - Aprende patrones del usuario
  - Ajusta recomendaciones

- [src/app/utils/userLearningSystem.ts](src/app/utils/userLearningSystem.ts)
  - Tracking de preferencias
  - Algoritmo de recomendación

---

### 🍽️ COMIDAS E INGREDIENTES

#### Base de Datos Local (Seed Data):
- [src/data/mealsWithIngredients.ts](src/data/mealsWithIngredients.ts)
  - Comidas pre-definidas con ingredientes
  - Usadas para sembrar base_meals

- [src/data/ingredientsDatabase.ts](src/data/ingredientsDatabase.ts)
  - Ingredientes pre-definidos
  - Usados para sembrar base_ingredients

#### Lógica de Escalado:
- [src/app/utils/intelligentMealScaling.ts](src/app/utils/intelligentMealScaling.ts)
  - Escala comidas a macros exactos
  - Preserva proporciones

- [src/app/utils/exactPortionCalculator.ts](src/app/utils/exactPortionCalculator.ts)
  - Cálculo preciso de porciones
  - Redondeo inteligente

---

### 💪 SISTEMA DE ENTRENAMIENTO

#### Componentes:
- [src/app/components/TrainingDashboardNew.tsx](src/app/components/TrainingDashboardNew.tsx)
  - Dashboard de entrenamiento
  - Tracking de ejercicios

- [src/app/components/TrainingOnboarding.tsx](src/app/components/TrainingOnboarding.tsx)
  - Configuración inicial de entrenamiento

#### Base de Datos:
- [src/app/data/exerciseDatabase.ts](src/app/data/exerciseDatabase.ts)
  - Catálogo de ejercicios
  - Organizados por grupo muscular

---

## 🎯 CASOS DE USO COMUNES

### "Quiero entender cómo funciona la app"
→ Lee: [RESUMEN_EJECUTIVO_FINAL.md](RESUMEN_EJECUTIVO_FINAL.md)

### "Quiero verificar que la migración funcionó"
→ Sigue: [CHECKLIST_VERIFICACION_FINAL.md](CHECKLIST_VERIFICACION_FINAL.md)

### "Quiero ver la estructura de la base de datos"
→ Ve: [supabase/migrations/schema_final.sql](supabase/migrations/schema_final.sql)

### "Quiero entender un endpoint específico"
→ Busca en: [supabase/functions/server/index.tsx](supabase/functions/server/index.tsx)

### "Quiero agregar una nueva comida"
→ Usa: Admin Panel → Global Meals → Add New

### "Quiero modificar el cálculo de macros"
→ Edita: [src/app/utils/automaticTargetCalculator.ts](src/app/utils/automaticTargetCalculator.ts)

### "Quiero agregar un nuevo endpoint"
→ Modifica: [supabase/functions/server/index.tsx](supabase/functions/server/index.tsx)

### "Quiero cambiar el diseño de un componente"
→ Edita el archivo en: [src/app/components/](src/app/components/)

---

## 🚀 DEPLOYMENT

### Vercel (Frontend):
- [GUIA_DEPLOYMENT_VERCEL.md](GUIA_DEPLOYMENT_VERCEL.md)
  - Pasos para deploy a Vercel
  - Variables de entorno
  - Configuración

- [vercel.json](vercel.json)
  - Configuración de Vercel
  - Rewrites y headers

### Supabase (Backend + DB):
- Ya está deployed automáticamente
- Edge Functions se actualizan con git push
- No requiere configuración adicional

---

## 🐛 DEBUGGING

### Ver logs del servidor:
1. Ir a Supabase Dashboard
2. Edge Functions → make-server-b0e879f0
3. Ver "Logs" tab

### Ver logs de la base de datos:
1. Ir a Supabase Dashboard
2. Logs → Postgres Logs
3. Filtrar por tabla o error

### Ver errores del frontend:
1. Abrir DevTools (F12)
2. Ver Console tab
3. Buscar errores rojos

### Probar queries manualmente:
1. Ir a Supabase Dashboard
2. SQL Editor → New query
3. Ejecutar query de prueba

---

## 📝 CONVENCIONES

### Nombres de Tablas:
- `snake_case` (ejemplo: `daily_logs`, `base_meals`)

### Nombres de Campos en DB:
- `snake_case` (ejemplo: `user_id`, `log_date`)

### Nombres en TypeScript:
- `camelCase` (ejemplo: `userId`, `logDate`)

### Transformación DB ↔ App:
```typescript
// En servidor (index.tsx):
const dbUser = {
  user_id: user.userId,    // DB usa snake_case
  log_date: user.logDate
};

const appUser = {
  userId: dbUser.user_id,  // App usa camelCase
  logDate: dbUser.log_date
};
```

---

## 🎨 ESTRUCTURA DEL PROYECTO

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                    ← App principal
│   │   ├── components/                ← Componentes UI
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MealSelection.tsx
│   │   │   ├── History.tsx
│   │   │   └── ...
│   │   ├── utils/                     ← Lógica de negocio
│   │   │   ├── api.ts                 ← Cliente API
│   │   │   ├── macroCalculations.ts
│   │   │   └── ...
│   │   └── data/                      ← Data seed
│   │       ├── meals.ts
│   │       └── ingredients.ts
│   ├── utils/
│   │   └── supabase/
│   │       └── client.ts              ← Cliente Supabase
│   └── data/                          ← Data global
│       ├── mealsWithIngredients.ts
│       └── ingredientsDatabase.ts
├── supabase/
│   ├── functions/
│   │   └── server/
│   │       ├── index.tsx              ← API del servidor ⭐
│   │       └── kv_store.tsx           ← OBSOLETO
│   └── migrations/
│       └── schema_final.sql           ← Schema ejecutado ⭐
├── utils/
│   └── supabase/
│       └── info.tsx                   ← Config de Supabase
└── [DOCS]/
    ├── RESUMEN_EJECUTIVO_FINAL.md     ← Empieza aquí ⭐
    ├── CHECKLIST_VERIFICACION_FINAL.md
    ├── VERIFICACION_100_CLOUD.md
    └── INDICE_MAESTRO.md              ← Estás aquí
```

---

## 🔗 ENLACES ÚTILES

### Supabase Dashboard:
https://supabase.com/dashboard/project/[PROJECT_ID]

### Supabase Docs:
- [Authentication](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

### Postgres Docs:
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## 📊 ESTADÍSTICAS DEL PROYECTO

```
Líneas de código:     ~15,000
Componentes React:    50+
API Endpoints:        24+
Tablas DB:           10
Índices:             17+
Políticas RLS:       19
Triggers:            8
Comidas pre-cargadas: 100+
Ingredientes:        200+
Ejercicios:          50+
```

---

## 🎊 ESTADO ACTUAL

```
[████████████████████████████████████] 100%

✅ Migración completa a Postgres Cloud
✅ KV Store eliminado
✅ Sin localStorage (excepto auth)
✅ 10 tablas estructuradas
✅ RLS habilitado
✅ Multi-dispositivo funcional
✅ Admin panel completo
✅ Sistema de entrenamiento
✅ Sistema adaptativo
✅ Production ready
```

---

## 📞 ¿NECESITAS AYUDA?

### 1. Revisa la documentación:
Busca tu pregunta en este índice arriba ⬆️

### 2. Verifica los logs:
- Supabase Dashboard → Logs
- Browser DevTools → Console

### 3. Ejecuta el checklist:
[CHECKLIST_VERIFICACION_FINAL.md](CHECKLIST_VERIFICACION_FINAL.md)

### 4. Lee el código:
Los archivos principales están marcados con ⭐

---

**¡BIENVENIDO A FUELIER 2.0!** 🚀

Todo está organizado, documentado y listo para usar.

---

**Última actualización:** 2026-01-09  
**Versión:** 2.0 (Cloud-Native)  
**Mantenedor:** AI Assistant
