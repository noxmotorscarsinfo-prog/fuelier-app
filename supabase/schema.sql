-- ============================================
-- FUELIER - SUPABASE DATABASE SCHEMA
-- ============================================
-- Sistema adaptativo de gestión de dieta y macros
-- Versión: 1.0
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: users
-- ============================================
-- Almacena todos los usuarios de la app
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  birthdate DATE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  height DECIMAL(5,2) NOT NULL CHECK (height > 0),
  
  -- Composición corporal
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  lean_body_mass DECIMAL(5,2) CHECK (lean_body_mass >= 0),
  
  -- Actividad física
  training_frequency INTEGER NOT NULL DEFAULT 0 CHECK (training_frequency >= 0 AND training_frequency <= 7),
  training_intensity TEXT CHECK (training_intensity IN ('light', 'moderate', 'intense')),
  training_type TEXT CHECK (training_type IN ('strength', 'cardio', 'mixed', 'hiit', 'crossfit')),
  training_time_preference TEXT CHECK (training_time_preference IN ('morning', 'afternoon', 'evening')),
  lifestyle_activity TEXT CHECK (lifestyle_activity IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  occupation TEXT CHECK (occupation IN ('desk_job', 'standing_job', 'walking_job', 'physical_job')),
  daily_steps INTEGER CHECK (daily_steps >= 0),
  
  -- Objetivos
  goal TEXT NOT NULL CHECK (goal IN ('rapid_loss', 'moderate_loss', 'maintenance', 'moderate_gain', 'rapid_gain')),
  meals_per_day INTEGER NOT NULL DEFAULT 4 CHECK (meals_per_day >= 2 AND meals_per_day <= 5),
  
  -- Macros calculados
  target_calories INTEGER NOT NULL CHECK (target_calories > 0),
  target_protein DECIMAL(6,2) NOT NULL CHECK (target_protein >= 0),
  target_carbs DECIMAL(6,2) NOT NULL CHECK (target_carbs >= 0),
  target_fat DECIMAL(6,2) NOT NULL CHECK (target_fat >= 0),
  selected_macro_option TEXT CHECK (selected_macro_option IN ('maintenance', 'light', 'moderate-low', 'moderate-high', 'aggressive')),
  
  -- Distribución de comidas (JSON)
  meal_distribution JSONB DEFAULT '{"breakfast": 25, "lunch": 30, "snack": 15, "dinner": 30}',
  
  -- Historial metabólico (JSON)
  previous_diet_history JSONB,
  metabolic_adaptation JSONB,
  
  -- Preferencias (JSON)
  preferences JSONB DEFAULT '{"likes": [], "dislikes": [], "intolerances": [], "allergies": [], "portionPreferences": {}}',
  
  -- Arrays de tracking
  accepted_meal_ids TEXT[] DEFAULT '{}',
  rejected_meal_ids TEXT[] DEFAULT '{}',
  favorite_meal_ids TEXT[] DEFAULT '{}',
  favorite_ingredient_ids TEXT[] DEFAULT '{}',
  
  -- Permisos
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 2. TABLA: base_ingredients
-- ============================================
-- Ingredientes base del sistema (solo admin puede modificar)
CREATE TABLE IF NOT EXISTS base_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories DECIMAL(7,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  category TEXT, -- 'proteins-meat', 'proteins-fish', 'carbs-cereals', etc.
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para base_ingredients
CREATE INDEX idx_base_ingredients_name ON base_ingredients(name);
CREATE INDEX idx_base_ingredients_category ON base_ingredients(category);

-- ============================================
-- 3. TABLA: custom_ingredients
-- ============================================
-- Ingredientes personalizados creados por usuarios
CREATE TABLE IF NOT EXISTS custom_ingredients (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories DECIMAL(7,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para custom_ingredients
CREATE INDEX idx_custom_ingredients_user_id ON custom_ingredients(user_id);
CREATE INDEX idx_custom_ingredients_name ON custom_ingredients(name);

-- ============================================
-- 4. TABLA: base_meals
-- ============================================
-- Platos base del sistema (solo admin puede modificar)
CREATE TABLE IF NOT EXISTS base_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  meal_types TEXT[] NOT NULL, -- ['breakfast'] o ['lunch', 'dinner']
  variant TEXT,
  calories DECIMAL(7,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  base_quantity DECIMAL(7,2) NOT NULL DEFAULT 100,
  
  -- Ingredientes (array de strings para compatibilidad legacy)
  ingredients TEXT[] DEFAULT '{}',
  
  -- Referencias detalladas a ingredientes (JSON)
  ingredient_references JSONB, -- [{"ingredientId": "ing_1", "amountInGrams": 150}, ...]
  
  -- Preparación (JSON)
  preparation_steps TEXT[],
  tips TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para base_meals
CREATE INDEX idx_base_meals_name ON base_meals(name);
CREATE INDEX idx_base_meals_meal_types ON base_meals USING GIN(meal_types);
CREATE INDEX idx_base_meals_calories ON base_meals(calories);

-- ============================================
-- 5. TABLA: custom_meals
-- ============================================
-- Platos personalizados creados por usuarios
CREATE TABLE IF NOT EXISTS custom_meals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_types TEXT[] NOT NULL,
  variant TEXT,
  calories DECIMAL(7,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(6,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(6,2) NOT NULL CHECK (fat >= 0),
  base_quantity DECIMAL(7,2) NOT NULL DEFAULT 100,
  
  -- Ingredientes detallados (JSON)
  detailed_ingredients JSONB, -- [{"ingredientId": "ing_1", "ingredientName": "Pollo", "amount": 150, ...}, ...]
  ingredient_references JSONB,
  
  -- Preparación
  preparation_steps TEXT[],
  tips TEXT[],
  
  -- Flags
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para custom_meals
CREATE INDEX idx_custom_meals_user_id ON custom_meals(user_id);
CREATE INDEX idx_custom_meals_name ON custom_meals(name);
CREATE INDEX idx_custom_meals_meal_types ON custom_meals USING GIN(meal_types);
CREATE INDEX idx_custom_meals_is_favorite ON custom_meals(is_favorite);

-- ============================================
-- 6. TABLA: daily_logs
-- ============================================
-- Registro diario de comidas de cada usuario
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Comidas (almacenadas como JSON completo)
  breakfast JSONB, -- Meal completo o null
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  
  -- Comidas extra
  extra_foods JSONB, -- [{"name": "Café", "calories": 5, ...}, ...]
  complementary_meals JSONB, -- Meals complementarias
  
  -- Peso del día
  weight DECIMAL(5,2) CHECK (weight > 0),
  
  -- Metadata
  is_saved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: un log por usuario por día
  UNIQUE(user_id, log_date)
);

-- Índices para daily_logs
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date DESC);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX idx_daily_logs_is_saved ON daily_logs(is_saved);

-- ============================================
-- 7. TABLA: saved_diets
-- ============================================
-- Plantillas de dietas guardadas por usuarios
CREATE TABLE IF NOT EXISTS saved_diets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Comidas de la plantilla (JSON)
  breakfast JSONB,
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  
  -- Totales
  total_calories DECIMAL(7,2) NOT NULL,
  total_protein DECIMAL(6,2) NOT NULL,
  total_carbs DECIMAL(6,2) NOT NULL,
  total_fat DECIMAL(6,2) NOT NULL,
  
  -- Tags
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para saved_diets
CREATE INDEX idx_saved_diets_user_id ON saved_diets(user_id);
CREATE INDEX idx_saved_diets_name ON saved_diets(name);
CREATE INDEX idx_saved_diets_is_favorite ON saved_diets(is_favorite);

-- ============================================
-- 8. TABLA: bug_reports
-- ============================================
-- Reportes de bugs, features y mejoras
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Contenido
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved', 'closed')),
  
  -- Notas del admin (opcional)
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para bug_reports
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX idx_bug_reports_category ON bug_reports(category);
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);

-- ============================================
-- 9. TABLA: weekly_progress
-- ============================================
-- Progreso semanal de usuarios para el sistema adaptativo
CREATE TABLE IF NOT EXISTS weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  
  -- Mediciones físicas
  start_weight DECIMAL(5,2) NOT NULL CHECK (start_weight > 0),
  end_weight DECIMAL(5,2) NOT NULL CHECK (end_weight > 0),
  weight_change DECIMAL(5,2) NOT NULL,
  average_weight DECIMAL(5,2) NOT NULL,
  
  -- Composición corporal
  start_body_fat DECIMAL(4,2),
  end_body_fat DECIMAL(4,2),
  body_fat_change DECIMAL(4,2),
  
  -- Adherencia nutricional
  days_logged INTEGER NOT NULL DEFAULT 0 CHECK (days_logged >= 0 AND days_logged <= 7),
  average_calories DECIMAL(7,2) NOT NULL CHECK (average_calories >= 0),
  target_calories DECIMAL(7,2) NOT NULL CHECK (target_calories > 0),
  calorie_adherence DECIMAL(5,2) CHECK (calorie_adherence >= 0 AND calorie_adherence <= 100),
  
  average_protein DECIMAL(6,2) NOT NULL,
  average_carbs DECIMAL(6,2) NOT NULL,
  average_fat DECIMAL(6,2) NOT NULL,
  
  -- Feedback subjetivo (arrays de 7 elementos)
  energy_levels TEXT[],
  hunger_levels TEXT[],
  workout_quality TEXT[],
  
  -- Rendimiento
  workouts_done INTEGER DEFAULT 0 CHECK (workouts_done >= 0),
  workouts_planned INTEGER DEFAULT 0 CHECK (workouts_planned >= 0),
  workout_adherence DECIMAL(5,2) CHECK (workout_adherence >= 0 AND workout_adherence <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: una semana por usuario
  UNIQUE(user_id, week_start_date)
);

-- Índices para weekly_progress
CREATE INDEX idx_weekly_progress_user_id ON weekly_progress(user_id);
CREATE INDEX idx_weekly_progress_week_start ON weekly_progress(week_start_date DESC);
CREATE INDEX idx_weekly_progress_user_week ON weekly_progress(user_id, week_start_date DESC);

-- ============================================
-- 10. TABLA: meal_adaptations
-- ============================================
-- Historial de adaptaciones de comidas (para aprendizaje)
CREATE TABLE IF NOT EXISTS meal_adaptations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_id TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  
  -- Adaptación
  portion_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  was_accepted BOOLEAN NOT NULL,
  user_adjusted_portion DECIMAL(5,2),
  
  -- Contexto
  goal_completion JSONB, -- {"calories": 95, "protein": 100, ...}
  context_at_time JSONB, -- {"mealsLeftInDay": 2, ...}
  
  -- Timestamp
  adaptation_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para meal_adaptations
CREATE INDEX idx_meal_adaptations_user_id ON meal_adaptations(user_id);
CREATE INDEX idx_meal_adaptations_meal_id ON meal_adaptations(meal_id);
CREATE INDEX idx_meal_adaptations_date ON meal_adaptations(adaptation_date DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_ingredients_updated_at BEFORE UPDATE ON base_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_ingredients_updated_at BEFORE UPDATE ON custom_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_meals_updated_at BEFORE UPDATE ON base_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_meals_updated_at BEFORE UPDATE ON custom_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_diets_updated_at BEFORE UPDATE ON saved_diets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_progress_updated_at BEFORE UPDATE ON weekly_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_adaptations ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::uuid = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para base_ingredients (todos pueden leer, solo admins modifican)
CREATE POLICY "Anyone can view base ingredients" ON base_ingredients
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can insert base ingredients" ON base_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can update base ingredients" ON base_ingredients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can delete base ingredients" ON base_ingredients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para custom_ingredients (usuarios solo ven los suyos)
CREATE POLICY "Users can view their own custom ingredients" ON custom_ingredients
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own custom ingredients" ON custom_ingredients
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own custom ingredients" ON custom_ingredients
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own custom ingredients" ON custom_ingredients
  FOR DELETE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all custom ingredients" ON custom_ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para base_meals (todos pueden leer, solo admins modifican)
CREATE POLICY "Anyone can view base meals" ON base_meals
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can insert base meals" ON base_meals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can update base meals" ON base_meals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Only admins can delete base meals" ON base_meals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para custom_meals (usuarios solo ven los suyos)
CREATE POLICY "Users can view their own custom meals" ON custom_meals
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own custom meals" ON custom_meals
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own custom meals" ON custom_meals
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own custom meals" ON custom_meals
  FOR DELETE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all custom meals" ON custom_meals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para daily_logs
CREATE POLICY "Users can view their own logs" ON daily_logs
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own logs" ON daily_logs
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own logs" ON daily_logs
  FOR DELETE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para saved_diets
CREATE POLICY "Users can view their own saved diets" ON saved_diets
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own saved diets" ON saved_diets
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own saved diets" ON saved_diets
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own saved diets" ON saved_diets
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- Políticas para bug_reports (todos pueden crear, admins pueden ver todos)
CREATE POLICY "Users can view their own bug reports" ON bug_reports
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all bug reports" ON bug_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update all bug reports" ON bug_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

CREATE POLICY "Admins can delete bug reports" ON bug_reports
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para weekly_progress
CREATE POLICY "Users can view their own progress" ON weekly_progress
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own progress" ON weekly_progress
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own progress" ON weekly_progress
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all progress" ON weekly_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- Políticas para meal_adaptations
CREATE POLICY "Users can view their own adaptations" ON meal_adaptations
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own adaptations" ON meal_adaptations
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Admins can view all adaptations" ON meal_adaptations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND is_admin = TRUE)
  );

-- ============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE users IS 'Tabla principal de usuarios con datos antropométricos, objetivos y preferencias';
COMMENT ON TABLE base_ingredients IS 'Ingredientes base del sistema gestionados por administradores';
COMMENT ON TABLE custom_ingredients IS 'Ingredientes personalizados creados por usuarios';
COMMENT ON TABLE base_meals IS 'Platos base del sistema (200 platos predefinidos)';
COMMENT ON TABLE custom_meals IS 'Platos personalizados creados por usuarios';
COMMENT ON TABLE daily_logs IS 'Registro diario de comidas y progreso de cada usuario';
COMMENT ON TABLE saved_diets IS 'Plantillas de dietas guardadas por usuarios';
COMMENT ON TABLE bug_reports IS 'Reportes de bugs, features y mejoras enviados por usuarios';
COMMENT ON TABLE weekly_progress IS 'Progreso semanal para el sistema adaptativo de macros';
COMMENT ON TABLE meal_adaptations IS 'Historial de adaptaciones de comidas para aprendizaje del sistema';
