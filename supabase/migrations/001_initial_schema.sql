-- =====================================================
-- FUELIER - Schema Completo de Base de Datos
-- =====================================================

-- 1. TABLA: profiles (usuarios)
-- Extiende auth.users de Supabase con datos adicionales
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age >= 10 AND age <= 120),
  birthdate DATE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  height DECIMAL(5,2) NOT NULL CHECK (height > 0),
  
  -- Composición corporal
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  lean_body_mass DECIMAL(5,2),
  
  -- Actividad física
  training_frequency INTEGER NOT NULL CHECK (training_frequency >= 0 AND training_frequency <= 7),
  training_intensity TEXT CHECK (training_intensity IN ('light', 'moderate', 'intense')),
  training_type TEXT CHECK (training_type IN ('strength', 'cardio', 'mixed', 'hiit', 'crossfit')),
  training_time_preference TEXT CHECK (training_time_preference IN ('morning', 'afternoon', 'evening')),
  lifestyle_activity TEXT CHECK (lifestyle_activity IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  occupation TEXT CHECK (occupation IN ('desk_job', 'standing_job', 'walking_job', 'physical_job')),
  daily_steps INTEGER,
  
  -- Objetivos
  goal TEXT NOT NULL CHECK (goal IN ('rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain')),
  meals_per_day INTEGER NOT NULL CHECK (meals_per_day >= 2 AND meals_per_day <= 5),
  selected_macro_option TEXT CHECK (selected_macro_option IN ('maintenance', 'light', 'moderate-low', 'moderate-high', 'aggressive')),
  
  -- Macros objetivos
  goal_calories INTEGER NOT NULL,
  goal_protein DECIMAL(6,2) NOT NULL,
  goal_carbs DECIMAL(6,2) NOT NULL,
  goal_fat DECIMAL(6,2) NOT NULL,
  
  -- Distribución de comidas (JSON)
  meal_distribution JSONB DEFAULT '{"breakfast": 25, "lunch": 35, "snack": 10, "dinner": 30}'::jsonb,
  
  -- Historial metabólico (JSON)
  previous_diet_history JSONB,
  
  -- Adaptación metabólica (JSON)
  metabolic_adaptation JSONB,
  
  -- Preferencias alimenticias (JSON)
  preferences JSONB NOT NULL DEFAULT '{
    "likes": [], 
    "dislikes": [], 
    "intolerances": [], 
    "allergies": [],
    "portionPreferences": {}
  }'::jsonb,
  
  -- Comidas aceptadas/rechazadas (arrays)
  accepted_meals TEXT[] DEFAULT '{}',
  rejected_meals TEXT[] DEFAULT '{}',
  
  -- Ingredientes favoritos
  favorite_ingredient_ids TEXT[] DEFAULT '{}',
  
  -- Permisos
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Settings adicionales (JSON)
  settings JSONB DEFAULT '{"autoSaveDays": false, "timezone": "Europe/Madrid"}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);

-- =====================================================
-- 2. TABLA: base_ingredients (ingredientes base del sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.base_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  calories DECIMAL(6,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  category TEXT, -- 'proteins-meat', 'proteins-fish', 'carbs-cereals', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para base_ingredients
CREATE INDEX idx_base_ingredients_name ON public.base_ingredients(name);
CREATE INDEX idx_base_ingredients_category ON public.base_ingredients(category);

-- =====================================================
-- 3. TABLA: custom_ingredients (ingredientes personalizados de usuarios)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories DECIMAL(6,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario no puede tener 2 ingredientes con el mismo nombre
  UNIQUE(user_id, name)
);

-- Índices para custom_ingredients
CREATE INDEX idx_custom_ingredients_user_id ON public.custom_ingredients(user_id);
CREATE INDEX idx_custom_ingredients_name ON public.custom_ingredients(name);

-- =====================================================
-- 4. TABLA: base_meals (platos base del sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.base_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  meal_types TEXT[] NOT NULL, -- ['breakfast', 'lunch', 'snack', 'dinner']
  variant TEXT,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  ingredients TEXT[] NOT NULL, -- Array de strings (legacy)
  base_quantity INTEGER NOT NULL DEFAULT 100,
  
  -- Referencias a ingredientes con cantidades (JSON)
  ingredient_references JSONB, -- [{"ingredientId": "ing_1", "amountInGrams": 150}]
  
  -- Ingredientes detallados (JSON)
  detailed_ingredients JSONB, -- [{"ingredientId": "ing_1", "ingredientName": "Pollo", "amount": 150, ...}]
  
  -- Preparación y tips (JSON)
  preparation_steps TEXT[],
  tips TEXT[],
  
  -- Estadísticas de uso
  times_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para base_meals
CREATE INDEX idx_base_meals_name ON public.base_meals(name);
CREATE INDEX idx_base_meals_meal_types ON public.base_meals USING GIN(meal_types);
CREATE INDEX idx_base_meals_times_used ON public.base_meals(times_used);

-- =====================================================
-- 5. TABLA: custom_meals (platos personalizados de usuarios)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_types TEXT[] NOT NULL,
  variant TEXT,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  base_quantity INTEGER NOT NULL DEFAULT 100,
  
  -- Ingredientes detallados (JSON)
  detailed_ingredients JSONB NOT NULL,
  
  -- Preparación y tips
  preparation_steps TEXT[],
  tips TEXT[],
  
  -- Favorito
  is_favorite BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Índices para custom_meals
CREATE INDEX idx_custom_meals_user_id ON public.custom_meals(user_id);
CREATE INDEX idx_custom_meals_name ON public.custom_meals(name);
CREATE INDEX idx_custom_meals_is_favorite ON public.custom_meals(is_favorite);

-- =====================================================
-- 6. TABLA: daily_logs (registro diario de comidas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Comidas del día (JSON completo de cada Meal)
  breakfast JSONB,
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  
  -- Comidas extra
  extra_foods JSONB, -- [{"name": "Café", "calories": 5, ...}]
  
  -- Comidas complementarias
  complementary_meals JSONB, -- [Meal, Meal]
  
  -- Peso del día
  weight DECIMAL(5,2),
  
  -- Estado
  is_saved BOOLEAN DEFAULT FALSE,
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario solo puede tener un log por día
  UNIQUE(user_id, date)
);

-- Índices para daily_logs
CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX idx_daily_logs_user_date ON public.daily_logs(user_id, date);
CREATE INDEX idx_daily_logs_is_saved ON public.daily_logs(is_saved);

-- =====================================================
-- 7. TABLA: saved_diets (plantillas de dietas guardadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_diets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Comidas (JSON)
  breakfast JSONB,
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  
  -- Totales
  total_calories INTEGER NOT NULL,
  total_protein DECIMAL(6,2) NOT NULL,
  total_carbs DECIMAL(6,2) NOT NULL,
  total_fat DECIMAL(6,2) NOT NULL,
  
  -- Tags
  tags TEXT[],
  
  -- Favorito
  is_favorite BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para saved_diets
CREATE INDEX idx_saved_diets_user_id ON public.saved_diets(user_id);
CREATE INDEX idx_saved_diets_name ON public.saved_diets(name);
CREATE INDEX idx_saved_diets_is_favorite ON public.saved_diets(is_favorite);

-- =====================================================
-- 8. TABLA: weekly_progress (progreso semanal)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  
  -- Mediciones físicas
  start_weight DECIMAL(5,2) NOT NULL,
  end_weight DECIMAL(5,2) NOT NULL,
  weight_change DECIMAL(5,2) NOT NULL,
  average_weight DECIMAL(5,2) NOT NULL,
  
  -- Composición corporal
  start_body_fat DECIMAL(4,2),
  end_body_fat DECIMAL(4,2),
  body_fat_change DECIMAL(4,2),
  
  -- Adherencia nutricional
  days_logged INTEGER NOT NULL CHECK (days_logged >= 0 AND days_logged <= 7),
  average_calories DECIMAL(6,2) NOT NULL,
  target_calories DECIMAL(6,2) NOT NULL,
  calorie_adherence DECIMAL(5,2) NOT NULL,
  
  average_protein DECIMAL(6,2) NOT NULL,
  average_carbs DECIMAL(6,2) NOT NULL,
  average_fat DECIMAL(6,2) NOT NULL,
  
  -- Feedback subjetivo (JSON arrays)
  energy_levels TEXT[],
  hunger_levels TEXT[],
  workout_quality TEXT[],
  
  -- Rendimiento
  workouts_done INTEGER,
  workouts_planned INTEGER,
  workout_adherence DECIMAL(5,2),
  
  -- Análisis del sistema
  needs_adjustment BOOLEAN DEFAULT FALSE,
  adjustment_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- Índices para weekly_progress
CREATE INDEX idx_weekly_progress_user_id ON public.weekly_progress(user_id);
CREATE INDEX idx_weekly_progress_week_start_date ON public.weekly_progress(week_start_date);

-- =====================================================
-- 9. TABLA: meal_adaptations (historial de adaptaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.meal_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  date DATE NOT NULL,
  portion_multiplier DECIMAL(4,2) NOT NULL,
  was_accepted BOOLEAN NOT NULL,
  user_adjusted_portion DECIMAL(4,2),
  
  -- Contexto (JSON)
  goal_completion JSONB,
  context_at_time JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para meal_adaptations
CREATE INDEX idx_meal_adaptations_user_id ON public.meal_adaptations(user_id);
CREATE INDEX idx_meal_adaptations_meal_id ON public.meal_adaptations(meal_id);
CREATE INDEX idx_meal_adaptations_date ON public.meal_adaptations(date);

-- =====================================================
-- 10. TABLA: bug_reports (reportes de bugs y features)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved', 'closed')),
  
  -- Comentarios del admin (JSON)
  admin_notes JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para bug_reports
CREATE INDEX idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_priority ON public.bug_reports(priority);
CREATE INDEX idx_bug_reports_category ON public.bug_reports(category);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_ingredients_updated_at BEFORE UPDATE ON public.base_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_ingredients_updated_at BEFORE UPDATE ON public.custom_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_meals_updated_at BEFORE UPDATE ON public.base_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_meals_updated_at BEFORE UPDATE ON public.custom_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_diets_updated_at BEFORE UPDATE ON public.saved_diets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_progress_updated_at BEFORE UPDATE ON public.weekly_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para base_ingredients (todos pueden leer, solo admin puede modificar)
CREATE POLICY "Everyone can view base ingredients"
  ON public.base_ingredients FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only admins can insert base ingredients"
  ON public.base_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update base ingredients"
  ON public.base_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete base ingredients"
  ON public.base_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para custom_ingredients
CREATE POLICY "Users can view their own custom ingredients"
  ON public.custom_ingredients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom ingredients"
  ON public.custom_ingredients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom ingredients"
  ON public.custom_ingredients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom ingredients"
  ON public.custom_ingredients FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all custom ingredients"
  ON public.custom_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para base_meals (todos pueden leer, solo admin puede modificar)
CREATE POLICY "Everyone can view base meals"
  ON public.base_meals FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only admins can insert base meals"
  ON public.base_meals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update base meals"
  ON public.base_meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete base meals"
  ON public.base_meals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para custom_meals (usuarios ven los suyos, admin ve todos)
CREATE POLICY "Users can view their own custom meals"
  ON public.custom_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom meals"
  ON public.custom_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom meals"
  ON public.custom_meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom meals"
  ON public.custom_meals FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all custom meals"
  ON public.custom_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para daily_logs
CREATE POLICY "Users can view their own daily logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily logs"
  ON public.daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para saved_diets
CREATE POLICY "Users can view their own saved diets"
  ON public.saved_diets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved diets"
  ON public.saved_diets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved diets"
  ON public.saved_diets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved diets"
  ON public.saved_diets FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para weekly_progress
CREATE POLICY "Users can view their own weekly progress"
  ON public.weekly_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly progress"
  ON public.weekly_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly progress"
  ON public.weekly_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all weekly progress"
  ON public.weekly_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para meal_adaptations
CREATE POLICY "Users can view their own meal adaptations"
  ON public.meal_adaptations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal adaptations"
  ON public.meal_adaptations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all meal adaptations"
  ON public.meal_adaptations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para bug_reports
CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bug reports"
  ON public.bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bug reports"
  ON public.bug_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all bug reports"
  ON public.bug_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios con datos antropométricos y configuración';
COMMENT ON TABLE public.base_ingredients IS 'Ingredientes base del sistema (administrados por admins)';
COMMENT ON TABLE public.custom_ingredients IS 'Ingredientes personalizados creados por usuarios';
COMMENT ON TABLE public.base_meals IS 'Platos base del sistema (200 platos predefinidos)';
COMMENT ON TABLE public.custom_meals IS 'Platos personalizados creados por usuarios';
COMMENT ON TABLE public.daily_logs IS 'Registro diario de comidas consumidas por cada usuario';
COMMENT ON TABLE public.saved_diets IS 'Plantillas de dietas guardadas por usuarios';
COMMENT ON TABLE public.weekly_progress IS 'Progreso semanal de cada usuario (peso, adherencia, etc.)';
COMMENT ON TABLE public.meal_adaptations IS 'Historial de adaptaciones de comidas para aprendizaje del sistema';
COMMENT ON TABLE public.bug_reports IS 'Reportes de bugs y solicitudes de features de los usuarios';
