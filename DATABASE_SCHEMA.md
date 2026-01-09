# 🗄️ FUELIER - ESQUEMA DE BASE DE DATOS

## 📊 DIAGRAMA DE TABLAS

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE POSTGRES                       │
│                    (10 Tablas Estructuradas)                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 1. USERS (Perfiles de Usuario)                                      │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK, FK → auth.users)                                     │
│ • email (TEXT, UNIQUE)                                               │
│ • name, sex, age, birthdate                                          │
│ • weight, height, body_fat_percentage, lean_body_mass                │
│ • training_frequency, training_intensity, training_type              │
│ • lifestyle_activity, occupation, daily_steps                        │
│ • goal, meals_per_day                                                │
│ • target_calories, target_protein, target_carbs, target_fat          │
│ • selected_macro_option, meal_distribution (JSONB)                   │
│ • previous_diet_history (JSONB), metabolic_adaptation (JSONB)        │
│ • preferences (JSONB) → likes, dislikes, allergies, intolerances    │
│ • accepted_meal_ids[], rejected_meal_ids[], favorite_meal_ids[]      │
│ • favorite_ingredient_ids[]                                          │
│ • custom_meals (JSONB), custom_ingredients (JSONB)                   │
│ • custom_exercises (JSONB)                                           │
│ • is_admin (BOOLEAN)                                                 │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 📌 Indexes: email                                                    │
│ 🔐 RLS: Users can only view/edit their own data                     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 2. DAILY_LOGS (Registro Diario de Comidas)                          │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • log_date (DATE)                                                    │
│ • breakfast (JSONB), lunch (JSONB), snack (JSONB), dinner (JSONB)   │
│ • extra_foods (JSONB), complementary_meals (JSONB)                   │
│ • weight (DECIMAL), is_saved (BOOLEAN), notes (TEXT)                 │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 🔒 UNIQUE: (user_id, log_date) → Un log por usuario por día         │
│ 📌 Indexes: user_id, log_date, (user_id, log_date)                  │
│ 🔐 RLS: Users can only view/edit their own logs                     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 3. SAVED_DIETS (Dietas Guardadas/Favoritas)                         │
├──────────────────────────────────────────────────────────────────────┤
│ • id (TEXT, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • name (TEXT), description (TEXT)                                    │
│ • breakfast (JSONB), lunch (JSONB), snack (JSONB), dinner (JSONB)   │
│ • total_calories, total_protein, total_carbs, total_fat (DECIMAL)   │
│ • tags (TEXT[]), is_favorite (BOOLEAN)                               │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 📌 Indexes: user_id                                                  │
│ 🔐 RLS: Users can only view/edit their own saved diets              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 4. BASE_MEALS (Catálogo Global de Comidas)                          │
├──────────────────────────────────────────────────────────────────────┤
│ • id (TEXT, PK)                                                      │
│ • name (TEXT), meal_types (TEXT[]), variant (TEXT)                  │
│ • calories, protein, carbs, fat (DECIMAL) → por 100g base           │
│ • base_quantity (DECIMAL, default 100)                               │
│ • ingredients (JSONB), ingredient_references (JSONB)                 │
│ • preparation_steps (TEXT[]), tips (TEXT[])                          │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 📌 Indexes: meal_types (GIN index para búsqueda rápida)             │
│ 🔐 RLS: Public READ, Admin WRITE                                     │
│ 👑 Administrado por: Admins (is_admin = true)                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 5. BASE_INGREDIENTS (Catálogo Global de Ingredientes)               │
├──────────────────────────────────────────────────────────────────────┤
│ • id (TEXT, PK)                                                      │
│ • name (TEXT), category (TEXT)                                       │
│ • calories, protein, carbs, fat (DECIMAL) → por 100g                │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 📌 Indexes: category, name                                           │
│ 🔐 RLS: Public READ, Admin WRITE                                     │
│ 👑 Administrado por: Admins (is_admin = true)                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 6. BUG_REPORTS (Reportes de Bugs)                                   │
├──────────────────────────────────────────────────────────────────────┤
│ • id (TEXT, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • user_email (TEXT), user_name (TEXT)                                │
│ • title (TEXT), description (TEXT)                                   │
│ • category (TEXT), priority (TEXT), status (TEXT)                    │
│ • admin_notes (TEXT), resolved_at (TIMESTAMPTZ)                      │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 📌 Indexes: status, user_id                                          │
│ 🔐 RLS: Users see own, Admins see all                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 7. TRAINING_DATA (Configuración de Entrenamiento)                   │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • training_config (JSONB) → Configuración completa de entrenamiento │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 🔒 UNIQUE: user_id → Una configuración activa por usuario           │
│ 📌 Indexes: user_id                                                  │
│ 🔐 RLS: Users can only view/edit their own training data            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 8. COMPLETED_WORKOUTS (Historial de Entrenamientos Completados)     │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • workout_date (DATE)                                                │
│ • day_index (INTEGER), exercises_completed (JSONB)                   │
│ • duration_minutes (INTEGER), notes (TEXT)                           │
│ • created_at                                                         │
├──────────────────────────────────────────────────────────────────────┤
│ 🔒 UNIQUE: (user_id, workout_date, created_at)                      │
│ 📌 Indexes: user_id, workout_date, (user_id, workout_date)          │
│ 🔐 RLS: Users can only view/edit their own workouts                 │
│ 📝 Nota: Permite múltiples workouts por día                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 9. TRAINING_PLANS (Plan Semanal de Entrenamiento)                   │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • week_plan (JSONB) → Plan completo de la semana                    │
│ • plan_name (TEXT)                                                   │
│ • created_at, updated_at                                             │
├──────────────────────────────────────────────────────────────────────┤
│ 🔒 UNIQUE: user_id → Un plan activo por usuario                     │
│ 📌 Indexes: user_id                                                  │
│ 🔐 RLS: Users can only view/edit their own training plan            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 10. TRAINING_PROGRESS (Progreso en Tiempo Real)                     │
├──────────────────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                                      │
│ • user_id (UUID, FK → users.id)                                      │
│ • date (DATE)                                                        │
│ • day_index (INTEGER)                                                │
│ • exercise_reps (JSONB), exercise_weights (JSONB)                    │
│ • timestamp (TIMESTAMPTZ)                                            │
├──────────────────────────────────────────────────────────────────────┤
│ 🔒 UNIQUE: (user_id, date) → Un progreso por usuario por día        │
│ 📌 Indexes: user_id, date                                            │
│ 🔐 RLS: Users can only view/edit their own progress                 │
│ 📝 Nota: Se elimina al completar el workout                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 RELACIONES ENTRE TABLAS

```
                        ┌──────────────┐
                        │  AUTH.USERS  │ (Supabase Auth)
                        │  (Built-in)  │
                        └──────┬───────┘
                               │
                               │ 1:1
                               ▼
                        ┌──────────────┐
                        │    USERS     │ (Perfiles)
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         1:N    ▼       1:N    ▼       1:N    ▼       1:N
    ┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  DAILY_LOGS    │ │SAVED_DIETS │ │BUG_REPORTS │ │TRAINING_   │
    │                │ │            │ │            │ │DATA        │
    └────────────────┘ └────────────┘ └────────────┘ └────────────┘
    
         1:N    ▼       1:N    ▼       1:N    ▼
    ┌────────────────┐ ┌────────────┐ ┌────────────┐
    │  COMPLETED_    │ │TRAINING_   │ │TRAINING_   │
    │  WORKOUTS      │ │PLANS       │ │PROGRESS    │
    └────────────────┘ └────────────┘ └────────────┘

         INDEPENDIENTES (No FK):
    ┌────────────────┐ ┌────────────────┐
    │  BASE_MEALS    │ │ BASE_          │
    │  (Admin)       │ │ INGREDIENTS    │
    │                │ │ (Admin)        │
    └────────────────┘ └────────────────┘
```

---

## 🔐 POLÍTICAS DE SEGURIDAD (RLS)

### ✅ Tablas de Usuario (7 tablas):
**Regla:** Los usuarios solo pueden ver/editar **SUS PROPIOS DATOS**

- `users` → WHERE user_id = auth.uid()
- `daily_logs` → WHERE user_id = auth.uid()
- `saved_diets` → WHERE user_id = auth.uid()
- `training_data` → WHERE user_id = auth.uid()
- `completed_workouts` → WHERE user_id = auth.uid()
- `training_plans` → WHERE user_id = auth.uid()
- `training_progress` → WHERE user_id = auth.uid()

### 🌍 Tablas Globales (2 tablas):
**Regla:** Lectura pública, escritura solo admins

- `base_meals` → SELECT: true, INSERT/UPDATE/DELETE: is_admin
- `base_ingredients` → SELECT: true, INSERT/UPDATE/DELETE: is_admin

### 🐛 Tabla de Bug Reports (1 tabla):
**Regla:** Usuarios ven sus reportes, admins ven todos

- `bug_reports` → SELECT: user_id = auth.uid() OR is_admin

---

## 📊 ESTADÍSTICAS DE LA BASE DE DATOS

### Capacidad de Almacenamiento:

| Tabla | Estimado por Usuario | 100 Usuarios | 1000 Usuarios |
|-------|---------------------|--------------|---------------|
| `users` | 5 KB | 500 KB | 5 MB |
| `daily_logs` (365 días) | 150 KB | 15 MB | 150 MB |
| `saved_diets` (10 dietas) | 20 KB | 2 MB | 20 MB |
| `training_data` | 10 KB | 1 MB | 10 MB |
| `completed_workouts` (50) | 25 KB | 2.5 MB | 25 MB |
| `training_plans` | 15 KB | 1.5 MB | 15 MB |
| **TOTAL por usuario** | ~225 KB | ~22.5 MB | ~225 MB |

### Datos Globales (compartidos):

| Tabla | Estimado |
|-------|----------|
| `base_meals` (500 comidas) | 2 MB |
| `base_ingredients` (1000 ingredientes) | 500 KB |

### 🎯 Conclusión:
- ✅ **500 usuarios** = ~115 MB
- ✅ **1000 usuarios** = ~230 MB
- ✅ **10,000 usuarios** = ~2.3 GB

**Plan Free de Supabase:** 500 MB ✅  
**Plan Pro de Supabase:** 8 GB ✅

---

## ⚡ OPTIMIZACIONES IMPLEMENTADAS

### 1️⃣ Indexes Estratégicos:
- ✅ Email lookups (users)
- ✅ Date range queries (daily_logs, completed_workouts)
- ✅ User-specific queries (todas las tablas con user_id)
- ✅ Meal type searches (GIN index en base_meals)
- ✅ Status filtering (bug_reports)

### 2️⃣ Triggers Automáticos:
- ✅ `updated_at` se actualiza automáticamente en EVERY UPDATE
- ✅ Aplicado en 7 tablas principales

### 3️⃣ Foreign Keys con CASCADE:
- ✅ `ON DELETE CASCADE` → Si se elimina un usuario, se eliminan todos sus datos
- ✅ Mantiene integridad referencial

### 4️⃣ JSONB para Flexibilidad:
- ✅ `preferences` → likes, dislikes, allergies, etc.
- ✅ `meal_distribution` → breakfast %, lunch %, etc.
- ✅ `training_config` → configuración completa
- ✅ `week_plan` → plan semanal completo
- ✅ Permite agregar campos sin migración

### 5️⃣ Unique Constraints:
- ✅ Un log por usuario por día (daily_logs)
- ✅ Una configuración de training por usuario (training_data)
- ✅ Un plan de training por usuario (training_plans)
- ✅ Un progreso por usuario por día (training_progress)

---

## 🚀 VENTAJAS DE ESTA ARQUITECTURA

### ✅ vs KV Store:
| KV Store | Postgres Estructurado |
|----------|----------------------|
| ❌ Sin relaciones | ✅ Foreign Keys con CASCADE |
| ❌ Sin indexes | ✅ 30+ indexes optimizados |
| ❌ Sin validación | ✅ Constraints y tipos estrictos |
| ❌ Queries lentas | ✅ Queries optimizadas con indexes |
| ❌ Difícil de mantener | ✅ Schema documentado y versionado |

### ✅ vs localStorage:
| localStorage | Supabase Cloud |
|--------------|----------------|
| ❌ Solo 5-10 MB | ✅ Ilimitado (escalable) |
| ❌ Un solo dispositivo | ✅ Multi-dispositivo |
| ❌ Se pierde al limpiar navegador | ✅ Persistente en la nube |
| ❌ Sin sincronización | ✅ Sincronización automática |
| ❌ Sin backup | ✅ Backups automáticos diarios |

---

## 📝 NOTAS IMPORTANTES

1. **Auth Token en localStorage:**
   - Es el **ÚNICO** localStorage usado
   - Es una **limitación de Supabase Auth**
   - NO se puede evitar en apps web
   - Todos los DATOS están 100% en Postgres

2. **Custom Data en users:**
   - `custom_meals`, `custom_ingredients`, `custom_exercises`
   - Están en la tabla `users` como JSONB
   - Esto evita crear tablas adicionales
   - Simplifica queries y mantiene datos juntos

3. **RLS Habilitado:**
   - **NUNCA** deshabilitar RLS
   - Es crítico para la seguridad
   - Las políticas están optimizadas

4. **Migrations:**
   - El schema está en `/supabase/migrations/schema.sql`
   - Ejecutar UNA SOLA VEZ en SQL Editor
   - Crear nuevas migrations para cambios futuros

---

## ✅ CHECKLIST DE VALIDACIÓN

Para confirmar que la BD está correctamente configurada:

- [ ] Existen 10 tablas (no más, no menos)
- [ ] RLS está habilitado en todas las tablas
- [ ] Existen 30+ indexes
- [ ] Existen 10+ políticas RLS
- [ ] Los triggers `updated_at` funcionan
- [ ] Los foreign keys tienen CASCADE
- [ ] La tabla `kv_store_b0e879f0` fue eliminada
- [ ] Los usuarios pueden crear cuentas
- [ ] Los datos se guardan correctamente
- [ ] La sincronización multi-dispositivo funciona

**¡Si todos los checkboxes están marcados, tu BD está lista! ✅**
