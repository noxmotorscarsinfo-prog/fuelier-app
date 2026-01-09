# 🏗️ FUELIER - ARQUITECTURA 100% CLOUD

## 📊 VISIÓN GENERAL

Fuelier es una aplicación móvil **100% cloud** de gestión personal de dieta y macros con backend Supabase Postgres. **NO utiliza KV store** - todos los datos están organizados en tablas relacionales estructuradas.

---

## 🗄️ BASE DE DATOS (POSTGRES)

### **Tablas Principales:**

#### 1️⃣ **users** - Perfiles de usuario
- Datos antropométricos (peso, altura, grasa corporal, masa magra)
- Actividad física (frecuencia, intensidad, tipo de entrenamiento)
- Objetivos y macros (calorías, proteína, carbohidratos, grasas)
- Preferencias y favoritos (gustos, alergias, comidas rechazadas)
- Datos personalizados (custom_meals, custom_ingredients, custom_exercises en JSONB)

#### 2️⃣ **daily_logs** - Registro diario de comidas
- Una entrada por usuario por fecha
- 4 comidas principales (breakfast, lunch, snack, dinner)
- Extra foods y complementary meals
- Peso del día y notas

#### 3️⃣ **saved_diets** - Dietas guardadas
- Combinaciones de comidas favoritas del usuario
- Macros totales precalculados
- Tags y marcador de favorito

#### 4️⃣ **base_meals** - Catálogo global de comidas
- Administrado por admins
- Comidas base con macros por 100g
- Ingredientes y pasos de preparación

#### 5️⃣ **base_ingredients** - Catálogo global de ingredientes
- Administrado por admins
- Macros por 100g
- Categorizado (proteína, carbohidrato, grasa, etc.)

#### 6️⃣ **bug_reports** - Reportes de bugs
- Enviados por usuarios
- Gestionados por admins (status, notas, resolución)

#### 7️⃣ **training_data** - Configuración de entrenamiento
- Una configuración activa por usuario
- Toda la configuración en JSONB (training_config)

#### 8️⃣ **completed_workouts** - Historial de entrenamientos
- Múltiples entrenamientos por fecha
- Ejercicios completados, duración, notas

#### 9️⃣ **training_plans** - Plan semanal de entrenamiento
- Un plan activo por usuario
- Plan completo en JSONB (week_plan)

#### 🔟 **training_progress** - Progreso en tiempo real
- Seguimiento de ejercicio en progreso
- Se elimina al completar el workout

---

## 🔐 SEGURIDAD (RLS - Row Level Security)

Todas las tablas tienen **RLS habilitado** con políticas:
- ✅ Usuarios solo ven/editan **sus propios datos**
- ✅ Base meals/ingredients: **lectura pública, escritura admin**
- ✅ Bug reports: **usuarios ven los suyos, admins ven todos**

---

## 🚀 BACKEND (SUPABASE EDGE FUNCTIONS)

**Servidor:** `/supabase/functions/server/index.tsx`

### **Endpoints API (36 total):**

#### 🔑 Autenticación (4)
- `POST /auth/signup` - Crear usuario
- `POST /auth/signin` - Login
- `GET /auth/session` - Validar sesión
- `POST /auth/signout` - Logout

#### 👤 Usuario (2)
- `GET /user/:email` - Obtener perfil
- `POST /user` - Guardar/actualizar perfil

#### 📅 Daily Logs (2)
- `GET /daily-logs/:email` - Obtener historial
- `POST /daily-logs` - Guardar logs

#### 💾 Dietas Guardadas (2)
- `GET /saved-diets/:email` - Obtener dietas
- `POST /saved-diets` - Guardar dietas

#### ⭐ Favoritos (2)
- `GET /favorite-meals/:email` - Obtener favoritos
- `POST /favorite-meals` - Guardar favoritos

#### 🐛 Bug Reports (2)
- `GET /bug-reports` - Obtener todos (admin)
- `POST /bug-reports` - Guardar reportes

#### 🍽️ Meals Globales (2)
- `GET /global-meals` - Obtener catálogo
- `POST /global-meals` - Guardar catálogo (admin)

#### 🥗 Ingredients Globales (2)
- `GET /global-ingredients` - Obtener catálogo
- `POST /global-ingredients` - Guardar catálogo (admin)

#### 💪 Training Data (2)
- `GET /training/:email` - Obtener configuración
- `POST /training` - Guardar configuración

#### ✅ Completed Workouts (2)
- `GET /training-completed/:email` - Obtener historial
- `POST /training-completed` - Guardar historial

#### 📋 Training Plans (2)
- `GET /training-plan/:email` - Obtener plan
- `POST /training-plan` - Guardar plan

#### 📈 Training Progress (3)
- `GET /training-progress/:email/:date` - Obtener progreso
- `POST /training-progress` - Guardar progreso
- `DELETE /training-progress/:email/:date` - Eliminar progreso

#### 🍱 Custom Meals (2)
- `GET /custom-meals/:email` - Obtener comidas custom
- `POST /custom-meals` - Guardar comidas custom

#### 🏋️ Custom Exercises (2)
- `GET /custom-exercises/:email` - Obtener ejercicios custom
- `POST /custom-exercises` - Guardar ejercicios custom

#### 🥕 Custom Ingredients (2)
- `GET /custom-ingredients/:email` - Obtener ingredientes custom
- `POST /custom-ingredients` - Guardar ingredientes custom

#### 📤 CSV Import (2)
- `POST /import-ingredients-csv` - Importar ingredientes
- `POST /import-meals-csv` - Importar comidas

#### 🏥 Health Check (1)
- `GET /health` - Status del servidor

---

## 💻 FRONTEND (REACT)

**Archivo principal:** `/src/app/api.ts`

### **37 Funciones API:**
Todas las funciones llaman al backend usando `fetch()` con:
- ✅ `Authorization: Bearer ${token}` para rutas protegidas
- ✅ Manejo de errores con try/catch
- ✅ Logging en consola para debugging

### **Estado Global (App.tsx):**
- `user` - Perfil del usuario
- `dailyLogs` - Historial completo de comidas
- `savedDiets` - Dietas guardadas
- `globalMeals` - Catálogo de comidas
- `globalIngredients` - Catálogo de ingredientes
- `customMeals` - Comidas personalizadas del usuario
- `customIngredients` - Ingredientes personalizados

**TODO se sincroniza automáticamente** con Supabase mediante `useEffect` que escucha cambios en el estado.

---

## 🔄 FLUJO DE DATOS

```
┌──────────────┐
│   USUARIO    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐     API Calls      ┌────────────────┐
│  React Frontend  │ ◄────────────────► │ Supabase Edge  │
│    (App.tsx)     │    (fetch + JWT)   │   Functions    │
└──────────────────┘                    └────────┬───────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │   Postgres     │
                                        │   Database     │
                                        │  (10 tables)   │
                                        └────────────────┘
```

---

## 📦 ALMACENAMIENTO

### ✅ **EN SUPABASE POSTGRES (100% CLOUD):**
- ✅ Perfiles de usuario
- ✅ Daily logs (365+ días de historial)
- ✅ Dietas guardadas
- ✅ Comidas e ingredientes globales
- ✅ Comidas e ingredientes personalizados
- ✅ Training data, plans, y completed workouts
- ✅ Training progress
- ✅ Bug reports

### ⚠️ **EN localStorage (SOLO AUTH TOKEN):**
- 🔐 `supabase_auth_token` - **REQUERIDO** por Supabase Auth
  - **NO SE PUEDE EVITAR** - Es una limitación técnica de Supabase
  - Solo guarda el token JWT para mantener la sesión

### ❌ **ELIMINADO POR COMPLETO:**
- ❌ KV Store (`kv_store_b0e879f0`) - Ya no se usa
- ❌ localStorage para datos de la app - Todo migrado a Postgres

---

## 🎯 CARACTERÍSTICAS CLAVE

### ✨ **100% Cloud:**
- ✅ Sincronización multi-dispositivo real
- ✅ Sin límites de almacenamiento (Postgres escalable)
- ✅ Backup automático por Supabase
- ✅ Arquitectura profesional con tablas relacionales

### 🔒 **Seguridad:**
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ JWT authentication con Supabase Auth
- ✅ Service Role Key solo en backend (nunca expuesto al frontend)
- ✅ CORS configurado correctamente

### ⚡ **Performance:**
- ✅ Indexes en todas las columnas críticas
- ✅ Queries optimizados con `.select()` específicos
- ✅ Triggers para auto-update de `updated_at`
- ✅ Políticas RLS optimizadas

### 📊 **Escalabilidad:**
- ✅ Arquitectura de 3 capas (Frontend → API → DB)
- ✅ Separación clara de responsabilidades
- ✅ Fácil agregar nuevas tablas/endpoints
- ✅ JSONB para datos flexibles (custom meals, preferences, etc.)

---

## 🚨 NOTA IMPORTANTE

**El único localStorage utilizado es para el auth token de Supabase Auth.**
Esto es una **LIMITACIÓN TÉCNICA DE SUPABASE** que no se puede evitar en aplicaciones web.
Todos los **DATOS DE LA APP** están 100% en Postgres cloud.

---

## 📝 MIGRACIÓN

Para aplicar el schema a tu instancia de Supabase:

```sql
-- Ejecutar el archivo /supabase/migrations/schema.sql
-- en el SQL Editor de Supabase Dashboard
```

Esto creará:
- ✅ 10 tablas estructuradas
- ✅ 30+ indexes para performance
- ✅ Políticas RLS completas
- ✅ Triggers automáticos
- ✅ Foreign keys con CASCADE

---

## ✅ CONCLUSIÓN

Fuelier es una **app 100% cloud profesional** con:
- 🗄️ **10 tablas Postgres** bien estructuradas
- 🔌 **36 endpoints API** completos
- 🔐 **Seguridad RLS** en todas las tablas
- ⚡ **Performance optimizado** con indexes
- 🌐 **Sincronización real** multi-dispositivo
- 📊 **Escalabilidad** ilimitada

**CERO datos locales excepto auth token (requerido por Supabase).**
