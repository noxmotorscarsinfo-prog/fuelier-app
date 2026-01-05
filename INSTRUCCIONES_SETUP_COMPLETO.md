# 🚀 Instrucciones Completas para Configurar Fuelier

## ✅ ¿Qué acabamos de implementar?

Hemos completado la implementación del **Panel de Administración Completo** de Fuelier con:

### 📊 Dashboard
- Resumen general de estadísticas
- Total de ingredientes, platos y reportes
- Distribución de platos por tipo de comida
- Estado de reportes de bugs

### 🥬 Gestión de Ingredientes Base
- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Búsqueda en tiempo real
- ✅ Filtros por categorías (Carnes, Pescados, Lácteos, etc.)
- ✅ Estadísticas por tipo
- ✅ Integración con Supabase

### 🍽️ Gestión de Platos Base (NUEVO)
- ✅ CRUD completo para platos
- ✅ Soporte para múltiples tipos de comida (desayuno, almuerzo, snack, cena)
- ✅ Búsqueda y filtros por tipo
- ✅ Información nutricional completa
- ✅ Integración con Supabase

### 🐛 Gestión de Bug Reports (NUEVO)
- ✅ Lista completa de reportes
- ✅ Cambio de estado (Pendiente → En Progreso → Resuelto → Cerrado)
- ✅ Filtros por estado
- ✅ Visualización de prioridad y categoría
- ✅ Eliminar reportes
- ✅ Integración con Supabase

---

## 📋 Pasos para Configurar Supabase (15 minutos)

### Paso 1: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en **"New Project"**
4. Completa los datos:
   - **Name:** Fuelier
   - **Database Password:** (anota tu contraseña en un lugar seguro)
   - **Region:** Selecciona la más cercana (ej: South America - São Paulo)
   - **Pricing Plan:** Free (suficiente para comenzar)
5. Haz clic en **"Create new project"**
6. Espera 2-3 minutos mientras se crea el proyecto ☕

---

### Paso 2: Ejecutar el Schema SQL

**IMPORTANTE:** Ya tenemos las credenciales de Supabase configuradas en el código, así que solo necesitas crear las tablas.

1. En el dashboard de Supabase, ve a **SQL Editor** (icono `</>` en la barra lateral)
2. Haz clic en **"+ New query"**
3. Abre el archivo `/supabase/schema.sql` de este proyecto
4. **Copia TODO el contenido** (son ~500 líneas)
5. **Pégalo** en el editor SQL de Supabase
6. Haz clic en **"Run"** (o presiona `Cmd/Ctrl + Enter`)
7. Deberías ver: ✅ **"Success. No rows returned"**

**Esto creará 10 tablas:**
- ✅ `users` - Usuarios de la app
- ✅ `base_ingredients` - Ingredientes base (60)
- ✅ `custom_ingredients` - Ingredientes personalizados
- ✅ `base_meals` - Platos base (200)
- ✅ `custom_meals` - Platos personalizados
- ✅ `daily_logs` - Registro diario
- ✅ `saved_diets` - Dietas guardadas
- ✅ `bug_reports` - Reportes de bugs
- ✅ `weekly_progress` - Progreso semanal
- ✅ `meal_adaptations` - Historial de adaptaciones

---

### Paso 3: Migrar los 200 Platos Iniciales

**Opción A: Desde la Consola del Navegador (Recomendado)**

1. **Abre tu app Fuelier** en el navegador
2. **Abre DevTools:**
   - Chrome/Edge: `F12` o `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12`
3. **Ve a la pestaña "Console"**
4. **Pega este código** y presiona Enter:

```javascript
// Importar las funciones de migración
const { migrateToSupabase, checkMigrationStatus } = await import('/src/utils/migrations/migrateToSupabase.ts');

// Verificar estado actual (opcional)
console.log('📊 Verificando estado actual...');
const status = await checkMigrationStatus();
console.log('Estado actual:', status);

// Ejecutar migración completa
console.log('🚀 Iniciando migración...');
const result = await migrateToSupabase();
console.log('Resultado:', result);

// Verificar resultado final
const finalStatus = await checkMigrationStatus();
console.log('Estado final:', finalStatus);
```

5. **Espera** a que termine (1-2 minutos)
6. Deberías ver:

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

Estado final: {
  ingredients: 60,
  meals: 200,
  bugReports: 0,
  users: 0
}
```

**Opción B: Verificar la Migración en Supabase**

1. En el dashboard de Supabase, ve a **Database → Table Editor**
2. Selecciona la tabla `base_meals`
3. Deberías ver **200 platos** con nombres como:
   - "Pollo a la Plancha"
   - "Ensalada César con Pollo"
   - "Tostadas de Aguacate y Huevo"
   - etc.
4. Selecciona la tabla `base_ingredients`
5. Deberías ver **60 ingredientes**

---

### Paso 4: Crear Usuario Admin (Opcional)

**Para acceder al Panel de Admin con autenticación completa (próximamente):**

1. En Supabase, ve a **Authentication → Users**
2. Haz clic en **"Add user"**
3. Completa:
   - **Email:** `admin@fuelier.com`
   - **Password:** `Fuelier2025!`
   - **Auto Confirm User:** ✅ Activado
4. Haz clic en **"Create user"**
5. **Copia el User ID** (es un UUID como `e1f234ab-5678-...`)
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
  'PEGA-AQUI-EL-USER-ID',  -- ⬅️ Reemplaza con el UUID copiado
  'admin@fuelier.com',
  'Administrador',
  'male',
  30,
  70.0,
  170.0,
  3,
  'maintenance',
  4,
  2000,
  150.0,
  200.0,
  65.0,
  TRUE  -- ⬅️ Esto marca al usuario como admin
);
```

---

## 🎯 Cómo Usar el Panel de Admin

### 1. Acceder al Panel

**Opción Actual (Sin Autenticación):**
1. Ve directamente a la ruta: `/loginfuelier123456789`
2. El panel se abrirá directamente

**Opción Futura (Con Autenticación - en desarrollo):**
1. Ve a `/loginfuelier123456789`
2. Ingresa:
   - **Email:** `admin@fuelier.com`
   - **Password:** `Fuelier2025!`
3. El panel se abrirá después del login

---

### 2. Usar las Tabs del Panel

#### 📊 **Dashboard**
- **Vista general** de estadísticas
- **Totales:** Ingredientes, Platos, Reportes activos
- **Distribución:** Platos por tipo de comida
- **Estados:** Reportes por estado

#### 🥬 **Ingredientes**
- **Ver todos** los ingredientes base (60)
- **Buscar** por nombre
- **Filtrar** por categoría (Carnes, Pescados, Lácteos, etc.)
- **Crear** nuevo ingrediente con el botón `+ Nuevo Ingrediente`
- **Editar** ingrediente (aparece al pasar el mouse sobre un ingrediente)
- **Eliminar** ingrediente (botón rojo de basura)

**Crear un ingrediente:**
1. Haz clic en `+ Nuevo Ingrediente`
2. Completa el formulario:
   - **Nombre:** Ej: "Tofu"
   - **Calorías:** Ej: 76 (por 100g)
   - **Proteína:** Ej: 8 (gramos por 100g)
   - **Carbohidratos:** Ej: 2 (gramos por 100g)
   - **Grasas:** Ej: 4.8 (gramos por 100g)
3. Haz clic en **Guardar**
4. El ingrediente se guardará en Supabase automáticamente

#### 🍽️ **Platos**
- **Ver todos** los platos base (200)
- **Buscar** por nombre
- **Filtrar** por tipo (Desayunos, Almuerzos, Snacks, Cenas)
- **Crear** nuevo plato con el botón `+ Nuevo Plato`
- **Editar** plato (aparece al pasar el mouse)
- **Eliminar** plato (botón rojo de basura)

**Crear un plato:**
1. Haz clic en `+ Nuevo Plato`
2. Completa el formulario:
   - **Nombre:** Ej: "Ensalada de Quinoa con Vegetales"
   - **Tipos de Comida:** Selecciona uno o varios (Desayuno, Almuerzo, Snack, Cena)
   - **Cantidad Base:** Ej: 1 (porción)
   - **Macros:**
     - **Calorías:** Ej: 350
     - **Proteína:** Ej: 12g
     - **Carbohidratos:** Ej: 45g
     - **Grasas:** Ej: 12g
3. Haz clic en **Guardar**
4. El plato se guardará en Supabase automáticamente

#### 🐛 **Reportes**
- **Ver todos** los bug reports
- **Buscar** por título o descripción
- **Filtrar** por estado (Todos, Pendientes, En Progreso, Resueltos, Cerrados)
- **Cambiar estado** de un reporte con los botones de estado
- **Eliminar** reporte con el botón de basura

**Gestionar un reporte:**
1. Busca el reporte en la lista
2. Lee la información:
   - **Título** y **Descripción**
   - **Usuario** que lo reportó
   - **Prioridad** (Low, Medium, High)
   - **Categoría** (Bug, Feature, Improvement, Other)
3. **Cambia el estado** haciendo clic en los botones:
   - `Pendiente` → Recién reportado
   - `En Progreso` → Trabajando en ello
   - `Resuelto` → Solucionado
   - `Cerrado` → Archivado
4. **Elimina** el reporte si ya no es necesario

---

## 🔧 Troubleshooting

### ❌ Error: "relation does not exist"

**Causa:** Las tablas no se crearon en Supabase.

**Solución:**
1. Ve a Supabase → **SQL Editor**
2. Ejecuta de nuevo el archivo `/supabase/schema.sql` completo
3. Verifica que aparezca ✅ "Success"

---

### ❌ Error: "new row violates row-level security policy"

**Causa:** Las políticas de Row Level Security (RLS) están bloqueando la inserción.

**Solución:**
1. Ve a Supabase → **Database → Tables**
2. Selecciona la tabla con problemas (ej: `base_ingredients`)
3. Ve a la pestaña **Policies**
4. Verifica que existan políticas como:
   - "Anyone can view base ingredients"
   - "Only admins can insert base ingredients"
5. Si no existen, ejecuta de nuevo el schema SQL

**Solución alternativa (solo para desarrollo):**
```sql
-- Deshabilitar RLS temporalmente en la tabla
ALTER TABLE base_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE base_meals DISABLE ROW LEVEL SECURITY;
```

---

### ❌ Error: "duplicate key value violates unique constraint"

**Causa:** Ya ejecutaste la migración antes.

**Solución:** ¡No pasa nada! Los datos ya están en Supabase. Puedes ignorar este error.

---

### ❌ Los platos no aparecen en el panel

**Causa 1:** La migración no se ejecutó correctamente.

**Solución:**
1. Abre la consola del navegador
2. Ejecuta:
```javascript
const { checkMigrationStatus } = await import('/src/utils/migrations/migrateToSupabase.ts');
const status = await checkMigrationStatus();
console.log(status);
```
3. Si `meals: 0`, ejecuta la migración de nuevo

**Causa 2:** Las credenciales de Supabase están mal configuradas.

**Solución:**
1. Verifica que el archivo `/src/utils/supabaseClient.ts` tenga las credenciales correctas
2. Deberían ser:
   - **URL:** `https://fzvsbpgqfubbqmqqxmwv.supabase.co`
   - **Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (la que ya está en el código)

---

### ⚠️ Advertencia: No puedo crear ingredientes/platos

**Causa:** Necesitas ser admin o tener los permisos correctos.

**Solución:**
1. Verifica que estés en el panel de admin (`/loginfuelier123456789`)
2. Si tienes autenticación habilitada, asegúrate de estar logueado como admin
3. Verifica en Supabase que tu usuario tenga `is_admin = TRUE`

---

## 📊 Verificar que Todo Funciona

### Checklist Final ✅

- [ ] **Proyecto Supabase creado**
- [ ] **Schema SQL ejecutado** (10 tablas creadas)
- [ ] **Migración ejecutada exitosamente**
- [ ] **Panel de admin accesible** en `/loginfuelier123456789`
- [ ] **Tab Dashboard muestra estadísticas correctas**
- [ ] **Tab Ingredientes muestra 60 ingredientes**
- [ ] **Tab Platos muestra 200 platos**
- [ ] **Tab Reportes está vacío (0 reportes)**
- [ ] **Puedo crear un nuevo ingrediente**
- [ ] **Puedo editar un ingrediente existente**
- [ ] **Puedo crear un nuevo plato**
- [ ] **Puedo filtrar platos por tipo**
- [ ] **Los datos persisten al recargar la página**

### Verificación Rápida en Supabase

1. Ve a **Database → Table Editor**
2. Verifica:
   - `base_ingredients`: **60 filas**
   - `base_meals`: **200 filas**
   - `bug_reports`: **0 filas** (inicialmente vacío)
   - `users`: **0 o 1 filas** (si creaste el admin)

---

## 🚀 Próximos Pasos (Opcionales)

### 1. Habilitar Autenticación Completa
- Implementar login real con Supabase Auth
- Crear sistema de sesiones
- Proteger rutas de admin

### 2. Migrar Usuarios desde localStorage
- Crear función de migración de usuarios
- Importar datos históricos

### 3. Agregar Más Funcionalidades al Admin
- Ver usuarios registrados
- Ver platos personalizados de usuarios
- Promover platos personalizados a base
- Dashboard con gráficos avanzados

### 4. Deploy
- Desplegar en Vercel/Netlify
- Configurar variables de entorno
- Configurar dominio personalizado

---

## 💡 Comandos Útiles en la Consola

```javascript
// Ver estado de la migración
const { checkMigrationStatus } = await import('/src/utils/migrations/migrateToSupabase.ts');
await checkMigrationStatus();

// Ejecutar migración completa
const { migrateToSupabase } = await import('/src/utils/migrations/migrateToSupabase.ts');
await migrateToSupabase();

// Limpiar todos los datos (⚠️ PELIGROSO)
const { clearAllSupabaseData } = await import('/src/utils/migrations/migrateToSupabase.ts');
await clearAllSupabaseData();
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs en Supabase → **Logs**
3. Verifica que el schema SQL se ejecutó correctamente
4. Asegúrate de que la migración terminó sin errores

---

## ✅ Resumen

**Lo que tienes ahora:**
- ✅ Panel de administración completo y funcional
- ✅ Gestión de 60 ingredientes base
- ✅ Gestión de 200 platos base
- ✅ Sistema de bug reports
- ✅ Todo integrado con Supabase
- ✅ Funciones async/await correctamente implementadas
- ✅ UI moderna y responsive

**Lo que falta (opcional):**
- ❌ Autenticación completa con Supabase Auth
- ❌ Gestión de usuarios
- ❌ Dashboard con gráficos avanzados

¡Felicidades! 🎉 Tu sistema está listo para usar.
