# 🔧 Migración Completa de Tabla training_completed

## ⚠️ ACCIÓN REQUERIDA EN SUPABASE

La tabla `training_completed` debe actualizarse completamente a la nueva estructura.

---

## 📋 SCRIPT DE MIGRACIÓN COMPLETO

Ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- ==========================================
-- MIGRACIÓN: training_completed
-- ==========================================

-- PASO 1: Verificar si la tabla existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'training_completed'
  ) THEN
    -- Si no existe, crear tabla con estructura nueva
    CREATE TABLE training_completed (
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      day_plan_index INTEGER NOT NULL,
      day_plan_name TEXT,
      exercise_reps JSONB,
      exercise_weights JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (user_id, date)
    );
    
    -- Índices
    CREATE INDEX idx_training_completed_user_id ON training_completed(user_id);
    CREATE INDEX idx_training_completed_date ON training_completed(date);
    
    -- RLS
    ALTER TABLE training_completed ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Tabla training_completed creada con estructura nueva';
  ELSE
    RAISE NOTICE 'Tabla training_completed ya existe, procediendo con migración...';
  END IF;
END $$;

-- PASO 2: Agregar columnas nuevas si no existen
DO $$ 
BEGIN
  -- Agregar day_plan_name si no existe
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_plan_name'
  ) THEN
    ALTER TABLE training_completed ADD COLUMN day_plan_name TEXT;
    RAISE NOTICE 'Columna day_plan_name agregada';
  END IF;

  -- Agregar day_plan_index si no existe
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_plan_index'
  ) THEN
    ALTER TABLE training_completed ADD COLUMN day_plan_index INTEGER;
    RAISE NOTICE 'Columna day_plan_index agregada';
  END IF;
END $$;

-- PASO 3: Migrar datos de day_index a day_plan_index (si existe day_index)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_index'
  ) THEN
    -- Copiar datos de day_index a day_plan_index
    UPDATE training_completed 
    SET day_plan_index = day_index 
    WHERE day_plan_index IS NULL;
    
    -- Generar day_plan_name basado en day_index
    UPDATE training_completed 
    SET day_plan_name = CONCAT('Día ', day_index + 1)
    WHERE day_plan_name IS NULL;
    
    RAISE NOTICE 'Datos migrados de day_index a day_plan_index';
  END IF;
END $$;

-- PASO 4: Hacer day_plan_index NOT NULL
DO $$ 
BEGIN
  -- Primero llenar cualquier NULL con 0 (por seguridad)
  UPDATE training_completed 
  SET day_plan_index = 0 
  WHERE day_plan_index IS NULL;
  
  -- Luego hacer la columna NOT NULL
  ALTER TABLE training_completed 
  ALTER COLUMN day_plan_index SET NOT NULL;
  
  RAISE NOTICE 'Columna day_plan_index configurada como NOT NULL';
END $$;

-- PASO 5: Eliminar columna day_index antigua (si existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_index'
  ) THEN
    ALTER TABLE training_completed DROP COLUMN day_index;
    RAISE NOTICE 'Columna day_index eliminada';
  ELSE
    RAISE NOTICE 'Columna day_index no existe, nada que eliminar';
  END IF;
END $$;

-- PASO 6: Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_completed' 
ORDER BY ordinal_position;
```

---

## ✅ ESTRUCTURA FINAL ESPERADA

Después de ejecutar el script, la tabla debe tener:

```
training_completed:
├── user_id (uuid, NOT NULL, FK)
├── date (date, NOT NULL, PK)
├── day_plan_index (integer, NOT NULL) ← NUEVA
├── day_plan_name (text, NULLABLE) ← NUEVA  
├── exercise_reps (jsonb)
├── exercise_weights (jsonb)
├── created_at (timestamp with time zone)
└── updated_at (timestamp with time zone)

PRIMARY KEY: (user_id, date)
INDEXES:
  - idx_training_completed_user_id
  - idx_training_completed_date
```

---

## 🔍 VERIFICACIÓN

Después de ejecutar el script, verifica que todo está correcto:

```sql
-- 1. Verificar estructura de columnas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_completed';

-- 2. Verificar que day_index ya no existe
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'training_completed' 
  AND column_name = 'day_index'
) AS old_column_exists; -- Debe retornar FALSE

-- 3. Verificar que day_plan_index y day_plan_name existen
SELECT 
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_plan_index'
  ) AS has_day_plan_index,
  EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'training_completed' 
    AND column_name = 'day_plan_name'
  ) AS has_day_plan_name;
-- Ambos deben retornar TRUE

-- 4. Ver datos migrados (si hay)
SELECT 
  date, 
  day_plan_index, 
  day_plan_name,
  user_id 
FROM training_completed 
ORDER BY date DESC 
LIMIT 10;
```

---

## 📊 ESTADO DEL CÓDIGO

- ✅ **Backend:** `/supabase/functions/make-server-b0e879f0/index.ts` - Actualizado para usar SOLO `day_plan_index` y `day_plan_name`
- ✅ **Frontend:** `/src/app/components/TrainingDashboardNew.tsx` - Ya usa `dayPlanIndex` y `dayPlanName`
- ✅ **API Client:** `/src/app/utils/api.ts` - No requiere cambios
- ⚠️ **Base de datos:** **PENDIENTE** - Ejecutar script SQL de arriba

---

## 🐛 Bugs Corregidos

Una vez ejecutes la migración, se solucionarán:

1. ✅ **"Día NaN"** - `dayPlanIndex` estaba `undefined` porque la columna se llamaba `day_index`
2. ✅ **"Siguiente: Día 1 siempre"** - El cálculo del siguiente día fallaba por datos undefined
3. ✅ **Sin info de músculos entrenados** - Ahora se guarda `dayPlanName` (ej: "Día 1: Pecho + Tríceps")

---

## ⚡ PASOS PARA EJECUTAR

1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia y pega todo el script SQL de arriba
5. Haz clic en **Run**
6. Verifica con las queries de verificación
7. Recarga la aplicación

---

## 🔄 ¿Qué hace el script?

1. **Verifica** si la tabla existe, si no la crea con estructura nueva
2. **Agrega** columnas `day_plan_index` y `day_plan_name` si no existen
3. **Migra** datos de `day_index` → `day_plan_index` (si hay datos antiguos)
4. **Genera** nombres genéricos para `day_plan_name` si están vacíos
5. **Hace** `day_plan_index` NOT NULL
6. **Elimina** la columna `day_index` antigua
7. **Muestra** la estructura final

El script es **idempotente**: puedes ejecutarlo varias veces sin problemas.
