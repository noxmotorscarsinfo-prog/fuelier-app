# 🚀 Configuración de Supabase para Fuelier

## 📋 Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en **"New Project"**
4. Completa:
   - **Name:** Fuelier (o el nombre que prefieras)
   - **Database Password:** (guárdalo en un lugar seguro)
   - **Region:** Selecciona la más cercana a tus usuarios
   - **Pricing Plan:** Free (suficiente para empezar)
5. Haz clic en **"Create new project"**
6. Espera 2-3 minutos mientras se crea el proyecto

---

## 📋 Paso 2: Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (icono </> en la barra lateral)
2. Haz clic en **"+ New query"**
3. Copia TODO el contenido del archivo `/supabase/schema.sql`
4. Pégalo en el editor SQL
5. Haz clic en **"Run"** (o presiona Cmd/Ctrl + Enter)
6. Verás el mensaje: **"Success. No rows returned"** ✅

Esto creará todas las tablas necesarias:
- ✅ `users` - Usuarios de la app
- ✅ `base_ingredients` - Ingredientes base
- ✅ `custom_ingredients` - Ingredientes personalizados
- ✅ `base_meals` - Platos base (200)
- ✅ `custom_meals` - Platos personalizados
- ✅ `daily_logs` - Registro diario
- ✅ `saved_diets` - Dietas guardadas
- ✅ `bug_reports` - Reportes de bugs
- ✅ `weekly_progress` - Progreso semanal
- ✅ `meal_adaptations` - Historial de adaptaciones

---

## 📋 Paso 3: Configurar Variables de Entorno

1. En el dashboard de Supabase, ve a **Settings > API**
2. Copia los siguientes valores:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example`):

```bash
cp .env.example .env
```

4. Edita `.env` y pega tus valores:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Paso 4: Configurar Autenticación

### 4.1. Habilitar Email/Password

1. Ve a **Authentication > Providers**
2. Asegúrate de que **Email** esté habilitado
3. Deshabilita **"Confirm email"** (para desarrollo rápido)
   - Esto permite crear usuarios sin verificar email

### 4.2. Crear Usuario Admin

Tienes 2 opciones:

#### Opción A: Desde el Dashboard (Recomendado)

1. Ve a **Authentication > Users**
2. Haz clic en **"Add user"**
3. Completa:
   - **Email:** `admin@fuelier.com`
   - **Password:** `Fuelier2025!`
   - **Auto Confirm User:** ✅ Activado
4. Haz clic en **"Create user"**
5. Copia el **User ID** (UUID)
6. Ve a **SQL Editor** y ejecuta:

```sql
-- Insertar datos del admin en la tabla users
INSERT INTO users (
  id,
  email,
  name,
  sex,
  age,
  weight,
  height,
  training_frequency,
  goal,
  meals_per_day,
  target_calories,
  target_protein,
  target_carbs,
  target_fat,
  is_admin
) VALUES (
  'PEGA-AQUI-EL-USER-ID',  -- ⬅️ Reemplaza con el UUID del usuario
  'admin@fuelier.com',
  'Administrador',
  'male',
  30,
  70,
  170,
  3,
  'maintenance',
  4,
  2000,
  150,
  200,
  65,
  TRUE  -- ⬅️ Esto marca al usuario como admin
);
```

#### Opción B: Desde la App (después de migración)

1. Ejecuta la migración (ver Paso 5)
2. Ve a `/loginfuelier123456789`
3. Haz clic en "¿Primera vez? Crear cuenta de Admin"
4. Completa el formulario de registro
5. El primer usuario creado será admin automáticamente

---

## 📋 Paso 5: Migrar Datos Iniciales

### 5.1. Abrir la Consola del Navegador

1. Abre tu app en el navegador
2. Abre DevTools (F12 o Cmd+Option+I)
3. Ve a la pestaña **Console**

### 5.2. Ejecutar Migración

Copia y pega esto en la consola:

```javascript
import { migrateToSupabase, checkMigrationStatus } from '/src/utils/migrations/migrateToSupabase.ts';

// Verificar estado actual
await checkMigrationStatus();

// Ejecutar migración
await migrateToSupabase();
```

Verás algo como:

```
🚀 Iniciando migración a Supabase...
📦 Migrando ingredientes base...
✅ 60 ingredientes migrados
🍽️ Migrando platos base...
   Insertados 100 / 200 platos...
   Insertados 200 / 200 platos...
✅ 200 platos migrados
🐛 Migrando bug reports...
✅ 0 bug reports migrados
🎉 Migración completada con éxito!
```

### 5.3. Verificar Migración

En la consola:

```javascript
await checkMigrationStatus();
```

Deberías ver:

```
{
  ingredients: 60,
  meals: 200,
  bugReports: 0,
  users: 1
}
```

---

## 📋 Paso 6: Verificar Row Level Security (RLS)

Las políticas de RLS ya están configuradas automáticamente en el schema. Verifica:

1. Ve a **Database > Tables**
2. Selecciona cualquier tabla (ej: `base_ingredients`)
3. Haz clic en la pestaña **Policies**
4. Deberías ver políticas como:
   - "Anyone can view base ingredients"
   - "Only admins can insert base ingredients"
   - etc.

Si NO ves políticas, ejecuta de nuevo el schema SQL.

---

## 📋 Paso 7: Probar la App

### 7.1. Iniciar la App

```bash
npm run dev
```

### 7.2. Login como Admin

1. Ve a `http://localhost:5173/loginfuelier123456789`
2. Ingresa:
   - **Email:** `admin@fuelier.com`
   - **Password:** `Fuelier2025!`
3. Deberías entrar al Dashboard

### 7.3. Acceder al Panel de Admin

1. En el Dashboard, haz clic en el botón **⚙️ Admin** (top-right)
2. Deberías ver el Panel de Administración
3. Verifica:
   - ✅ Tab "Ingredientes" muestra 60 ingredientes
   - ✅ Tab "Platos" (próximamente)

---

## 🔧 Troubleshooting

### Error: "Invalid API key"

**Solución:**
- Verifica que copiaste correctamente la URL y la key en `.env`
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "relation does not exist"

**Solución:**
- Las tablas no se crearon. Ejecuta de nuevo el schema SQL (Paso 2)

### Error: "new row violates row-level security policy"

**Solución:**
- El usuario no tiene permisos. Asegúrate de que `is_admin = TRUE` en la tabla users

### Error: "duplicate key value violates unique constraint"

**Solución:**
- Ya ejecutaste la migración antes. No pasa nada, los datos ya están en Supabase

### Los ingredientes/platos no aparecen

**Solución:**
1. Verifica en el dashboard de Supabase: **Database > Table Editor > base_ingredients**
2. Si está vacío, ejecuta la migración de nuevo
3. Si hay datos, verifica las políticas de RLS

---

## 📊 Monitorear la Base de Datos

### Ver Datos en Tiempo Real

1. Ve a **Database > Table Editor**
2. Selecciona una tabla
3. Verás todos los datos en formato tabla
4. Puedes editar, agregar o eliminar filas manualmente

### Ver Consultas en Tiempo Real

1. Ve a **Database > Replication**
2. Activa "Enable database replication"
3. Podrás ver todas las queries en tiempo real

### Ver Logs

1. Ve a **Logs**
2. Selecciona **Postgres Logs** para ver errores de base de datos
3. Selecciona **API Logs** para ver requests a la API

---

## 🚀 Próximos Pasos

Una vez completado el setup:

1. ✅ Implementar gestión de platos base en el Admin Panel
2. ✅ Implementar gestión de bug reports
3. ✅ Crear dashboard de estadísticas
4. ✅ Migrar toda la app de localStorage a Supabase
5. ✅ Implementar autenticación real (signup, login, logout)
6. ✅ Sincronización en tiempo real

---

## 📝 Notas Importantes

### Límites del Plan Free

- **Espacio en DB:** 500 MB
- **Transferencia:** 5 GB/mes
- **Rows:** Ilimitadas (dentro del espacio)
- **API Requests:** 50,000 autenticaciones/mes

Esto es suficiente para desarrollo y para ~100-200 usuarios activos.

### Seguridad

- ✅ RLS está habilitado en todas las tablas
- ✅ Solo admins pueden modificar ingredientes/platos base
- ✅ Usuarios solo ven sus propios datos
- ✅ Las passwords están hasheadas por Supabase Auth

### Backup

Supabase hace backups automáticos en el plan Free:
- **Daily backups:** Último 7 días
- Para backups manuales, usa el botón "Download backup" en **Database > Backups**

---

## ✅ Checklist Final

Antes de continuar al desarrollo, verifica que tienes:

- [ ] Proyecto creado en Supabase
- [ ] Schema SQL ejecutado (10 tablas creadas)
- [ ] Variables de entorno configuradas (.env)
- [ ] Autenticación Email/Password habilitada
- [ ] Usuario admin creado (`admin@fuelier.com`)
- [ ] Migración ejecutada (60 ingredientes + 200 platos)
- [ ] Login exitoso en la app
- [ ] Panel de admin accesible
- [ ] Ingredientes visibles en el admin panel

Si todos están ✅, estás listo para desarrollar! 🎉
