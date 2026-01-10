-- ==============================================================================
-- SCHEMA FOR FUELIER
-- Ejecutar en Supabase > SQL Editor
-- ==============================================================================

-- 1. Tabla para registro diario de comidas (Daily Logs)
-- Almacena el historial completo de lo que el usuario come cada día
CREATE TABLE IF NOT EXISTS public.daily_logs (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- Formato YYYY-MM-DD
    breakfast JSONB,    -- Objeto completo de la comida
    lunch JSONB,
    snack JSONB,
    dinner JSONB,
    extra_foods JSONB,  -- Array de alimentos extra
    complementary_meals JSONB, -- Array de comidas sugeridas
    is_saved BOOLEAN DEFAULT FALSE,
    weight NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, date) -- Un solo registro por usuario y fecha
);

-- Habilitar RLS (Row Level Security) es buena práctica
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
-- Política: El usuario solo puede ver y editar sus propios logs
CREATE POLICY "Users can manage their own daily logs" ON public.daily_logs
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 2. Tabla para dietas guardadas (Saved Diets)
-- Plantillas de días completos que el usuario guarda para reusar
CREATE TABLE IF NOT EXISTS public.saved_diets (
    id TEXT PRIMARY KEY, -- ID generado por el frontend (UUID v4)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meals JSONB NOT NULL, -- Array con todas las comidas del día
    macros JSONB,         -- Resumen nutricional {calories, protein...}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved diets" ON public.saved_diets
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. Tabla para comidas personalizadas (Custom Meals)
-- Recetas creadas por el usuario
CREATE TABLE IF NOT EXISTS public.custom_meals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- 'breakfast', 'lunch', etc.
    ingredients JSONB, -- Lista de ingredientes
    macros JSONB,
    image TEXT,
    is_custom BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.custom_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own custom meals" ON public.custom_meals
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 4. Tabla para planes de entrenamiento (Training Plans)
-- Guarda la rutina semanal activa del usuario
CREATE TABLE IF NOT EXISTS public.training_plans (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    week_plan JSONB NOT NULL, -- Estructura compleja del plan semanal
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own training plans" ON public.training_plans
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Nota: La tabla 'users' ya debería existir por la autenticación o creación previa.
-- Si necesitas asegurarte que existe la tabla pública de perfiles:
/*
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  -- ... otros campos del perfil ...
  updated_at TIMESTAMP WITH TIME ZONE
);
*/
