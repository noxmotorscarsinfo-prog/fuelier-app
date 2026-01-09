# ✅ SISTEMA COMPLETAMENTE MIGRADO A TABLAS RELACIONALES

## 🎯 **ESTADO ACTUAL - TODO VERIFICADO**

### ✅ **100% FUNCIONAL CON TABLAS RELACIONALES:**

| Categoría | Tabla Supabase | Estado | Endpoints |
|-----------|----------------|--------|-----------|
| **👤 Perfiles de usuario** | `users` | ✅ REAL | GET/POST `/user/:email` |
| **🍽️ Comidas diarias** | `daily_logs` | ✅ REAL | GET/POST `/daily-logs/:email` |
| **💾 Dietas guardadas** | `saved_diets` | ✅ REAL | GET/POST `/saved-diets/:email` |
| **⭐ Comidas favoritas** | `users.favorite_meal_ids` | ✅ REAL | GET/POST `/favorite-meals/:email` |
| **🍲 Base de comidas** | `base_meals` | ✅ REAL | GET/POST `/global-meals` |
| **🥑 Base de ingredientes** | `base_ingredients` | ✅ REAL | GET/POST `/global-ingredients` |
| **🐛 Reportes de bugs** | `bug_reports` | ✅ REAL | GET/POST `/bug-reports` |

---

## 📊 **TABLAS QUE NO SE ESTÁN USANDO (TODAVÍA)**

Estas tablas existen en la base de datos pero no están siendo utilizadas por la app:

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `custom_meals` | Comidas personalizadas por usuario | ⚠️ No utilizada |
| `custom_ingredients` | Ingredientes personalizados por usuario | ⚠️ No utilizada |
| `meal_adaptations` | Adaptaciones inteligentes de comidas | ⚠️ No utilizada |
| `weekly_progress` | Progreso semanal del usuario | ⚠️ No utilizada |
| `training_plans` | Planes de entrenamiento (existe pero endpoint stub) | ⚠️ No utilizada |
| `completed_workouts` | Entrenamientos completados (existe pero endpoint stub) | ⚠️ No utilizada |

---

## 🔄 **FLUJO COMPLETO DEL USUARIO**

### **1️⃣ Registro (Signup)**
```
Usuario → Email/Password → 
Backend: POST /auth/signup → 
Supabase Auth: Crea usuario →
✅ Usuario creado en Auth (sin perfil todavía)
```

### **2️⃣ Onboarding**
```
Usuario completa formulario → 
Frontend: saveUser() →
Backend: POST /user →
✅ Registro creado en tabla `users` con TODOS los datos
```

### **3️⃣ Login**
```
Usuario → Email/Password →
Backend: POST /auth/signin →
Supabase Auth: Valida credenciales →
Backend: GET /user/:email →
Tabla `users`: Busca perfil →
✅ Carga TODOS los datos del usuario
```

### **4️⃣ Uso diario**
```
Usuario agrega comidas →
Frontend: saveDailyLogs() →
Backend: POST /daily-logs →
✅ Guardado en tabla `daily_logs`

Usuario guarda dieta →
Frontend: saveSavedDiets() →
Backend: POST /saved-diets →
✅ Guardado en tabla `saved_diets`
```

---

## 🗄️ **ESTRUCTURA DE DATOS EN TABLAS**

### **`users` - Perfil completo del usuario**
```sql
- id (UUID from Supabase Auth)
- email (unique)
- name, sex, age, birthdate
- weight, height, body_fat_percentage, lean_body_mass
- training_frequency, training_intensity, training_type
- lifestyle_activity, occupation, daily_steps
- goal (rapid_loss, moderate_loss, maintenance, moderate_gain, rapid_gain)
- meals_per_day
- target_calories, target_protein, target_carbs, target_fat
- selected_macro_option
- meal_distribution (JSONB)
- previous_diet_history (JSONB)
- metabolic_adaptation (JSONB)
- preferences (JSONB - likes, dislikes, allergies, intolerances)
- accepted_meal_ids, rejected_meal_ids, favorite_meal_ids, favorite_ingredient_ids (ARRAY)
- is_admin
- created_at, updated_at
```

### **`daily_logs` - Registro diario de comidas**
```sql
- id (UUID)
- user_id (FK to users.id)
- log_date (DATE)
- breakfast, lunch, snack, dinner (JSONB)
- extra_foods, complementary_meals (JSONB)
- weight
- is_saved
- notes
- created_at, updated_at
```

### **`saved_diets` - Dietas guardadas por el usuario**
```sql
- id (TEXT)
- user_id (FK to users.id)
- name, description
- breakfast, lunch, snack, dinner (JSONB)
- total_calories, total_protein, total_carbs, total_fat
- tags (ARRAY)
- is_favorite
- created_at, updated_at
```

### **`base_meals` - Base de datos global de comidas**
```sql
- id (TEXT)
- name
- meal_types (ARRAY - breakfast, lunch, snack, dinner)
- variant
- calories, protein, carbs, fat
- base_quantity
- ingredients (ARRAY)
- ingredient_references (JSONB)
- preparation_steps, tips (ARRAY)
- created_by (FK to users.id - nullable)
- created_at, updated_at
```

### **`base_ingredients` - Base de datos global de ingredientes**
```sql
- id (TEXT)
- name
- calories, protein, carbs, fat
- category
- created_by (FK to users.id - nullable)
- created_at, updated_at
```

### **`bug_reports` - Reportes de bugs**
```sql
- id (TEXT)
- user_id (FK to users.id)
- user_email, user_name
- title, description
- category (bug, feature, improvement, other)
- priority (low, medium, high)
- status (pending, in-progress, resolved, closed)
- admin_notes
- resolved_at
- created_at, updated_at
```

---

## 🔐 **SEGURIDAD (RLS - Row Level Security)**

Todas las tablas tienen **RLS habilitado** con políticas que aseguran:

✅ Los usuarios **SOLO** pueden ver sus propios datos  
✅ Los usuarios **SOLO** pueden modificar sus propios datos  
✅ Las comidas/ingredientes globales son visibles para todos  
✅ Los bug reports son visibles para todos (pero solo el owner puede modificar)

---

## ⚡ **ENDPOINTS DEL BACKEND**

### **Authentication**
- `POST /auth/signup` - Crear cuenta (Supabase Auth)
- `POST /auth/signin` - Iniciar sesión (devuelve access_token)
- `GET /auth/session` - Validar sesión actual
- `POST /auth/signout` - Cerrar sesión

### **User Management**
- `GET /user/:email` - Obtener perfil completo (desde tabla `users`)
- `POST /user` - Guardar/actualizar perfil (en tabla `users`)

### **Daily Logs**
- `GET /daily-logs/:email` - Obtener todos los logs (desde tabla `daily_logs`)
- `POST /daily-logs` - Guardar logs (en tabla `daily_logs`)

### **Saved Diets**
- `GET /saved-diets/:email` - Obtener dietas guardadas (desde tabla `saved_diets`)
- `POST /saved-diets` - Guardar dietas (en tabla `saved_diets`)

### **Favorite Meals**
- `GET /favorite-meals/:email` - Obtener favoritos (desde `users.favorite_meal_ids`)
- `POST /favorite-meals` - Actualizar favoritos (en `users.favorite_meal_ids`)

### **Global Meals (Admin)**
- `GET /global-meals` - Obtener todas las comidas (desde tabla `base_meals`)
- `POST /global-meals` - Guardar comidas globales (en tabla `base_meals`)

### **Global Ingredients (Admin)**
- `GET /global-ingredients` - Obtener todos los ingredientes (desde tabla `base_ingredients`)
- `POST /global-ingredients` - Guardar ingredientes globales (en tabla `base_ingredients`)

### **Bug Reports**
- `GET /bug-reports` - Obtener todos los reportes (desde tabla `bug_reports`)
- `POST /bug-reports` - Guardar reportes (en tabla `bug_reports`)

### **CSV Import (Admin)**
- `POST /import-ingredients-csv` - Importar ingredientes desde CSV
- `POST /import-meals-csv` - Importar comidas desde CSV

### **Training (STUB - Por implementar)**
- `GET /training/:email` - Obtener datos de entrenamiento (devuelve null)
- `POST /training` - Guardar datos de entrenamiento (devuelve success)
- `GET /training-completed/:email` - Obtener entrenamientos completados (devuelve [])
- `POST /training-completed` - Guardar entrenamientos completados (devuelve success)
- `GET /training-plan/:email` - Obtener plan de entrenamiento (devuelve 404)
- `POST /training-plan` - Guardar plan de entrenamiento (devuelve success)

---

## ❌ **LO QUE YA NO SE USA**

### **Tabla `kv_store_b0e879f0`**
Esta tabla de clave-valor **YA NO SE USA**. Todo el backend ha sido migrado a tablas relacionales. 

La tabla todavía existe en Supabase pero:
- ✅ Todos los datos nuevos van a tablas relacionales
- ✅ El backend NO lee ni escribe en `kv_store_b0e879f0`
- ⚠️ Datos antiguos en KV store NO se migran automáticamente

---

## ✅ **VERIFICACIÓN COMPLETA**

### **Checklist de funcionalidad:**

- [x] Registro de usuarios → Crea en Supabase Auth
- [x] Onboarding → Guarda en tabla `users`
- [x] Login → Carga datos desde tabla `users`
- [x] Agregar comidas → Guarda en tabla `daily_logs`
- [x] Guardar dietas → Guarda en tabla `saved_diets`
- [x] Marcar favoritos → Actualiza `users.favorite_meal_ids`
- [x] Reportar bugs → Guarda en tabla `bug_reports`
- [x] Admin: Gestionar comidas → Usa tabla `base_meals`
- [x] Admin: Gestionar ingredientes → Usa tabla `base_ingredients`
- [x] Persistencia de datos → ✅ 100% garantizada
- [x] Seguridad RLS → ✅ Cada usuario solo ve sus datos

---

## 🚀 **PRÓXIMOS PASOS OPCIONALES**

Si en el futuro quieres implementar:

1. **Training completo** → Implementar endpoints usando `training_plans` y `completed_workouts`
2. **Weekly progress** → Usar tabla `weekly_progress` para análisis semanal
3. **Custom meals/ingredients** → Activar `custom_meals` y `custom_ingredients`
4. **Meal adaptations** → Usar `meal_adaptations` para el sistema de aprendizaje

Por ahora, **el sistema core está 100% funcional** con persistencia real en tablas relacionales.

---

## 📝 **NOTAS TÉCNICAS**

### **Transformación de datos:**
El backend transforma automáticamente entre:
- **Formato App** (camelCase): `bodyFatPercentage`, `favoriteMealIds`
- **Formato DB** (snake_case): `body_fat_percentage`, `favorite_meal_ids`

### **Manejo de errores:**
- Usuario no encontrado → 404
- Usuario sin perfil en onboarding → 404 (esperado)
- Auth inválido → 401
- Errores de DB → 500 con detalles en `details`

### **Optimizaciones:**
- ✅ Índices en `email`, `user_id`, `log_date`
- ✅ Triggers automáticos para `updated_at`
- ✅ Validaciones de constraints en DB
- ✅ RLS habilitado en todas las tablas

---

**✅ TODO EL SISTEMA ESTÁ CONECTADO A TABLAS RELACIONALES REALES**  
**✅ NO SE USA MÁS LA TABLA KV_STORE**  
**✅ PERSISTENCIA 100% GARANTIZADA**  
**✅ LISTO PARA USUARIOS REALES**
