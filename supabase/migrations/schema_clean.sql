-- =====================================================
-- FUELIER APP - CLEAN SCHEMA (IDEMPOTENT)
-- Este script puede ejecutarse múltiples veces sin errores
-- =====================================================

-- ===== ELIMINAR POLÍTICAS EXISTENTES =====
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can manage own logs" ON daily_logs;

DROP POLICY IF EXISTS "Users can view own diets" ON saved_diets;
DROP POLICY IF EXISTS "Users can manage own diets" ON saved_diets;

DROP POLICY IF EXISTS "Users can view own training data" ON training_data;
DROP POLICY IF EXISTS "Users can manage own training data" ON training_data;

DROP POLICY IF EXISTS "Users can view own workouts" ON completed_workouts;
DROP POLICY IF EXISTS "Users can manage own workouts" ON completed_workouts;

DROP POLICY IF EXISTS "Users can view own plans" ON training_plans;
DROP POLICY IF EXISTS "Users can manage own plans" ON training_plans;

DROP POLICY IF EXISTS "Users can view own progress" ON training_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON training_progress;

DROP POLICY IF EXISTS "Anyone can view base meals" ON base_meals;
DROP POLICY IF EXISTS "Admins can manage base meals" ON base_meals;

DROP POLICY IF EXISTS "Anyone can view base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Admins can manage base ingredients" ON base_ingredients;

DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can manage all bug reports" ON bug_reports;

-- ===== ELIMINAR TRIGGERS EXISTENTES =====
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON daily_logs;
DROP TRIGGER IF EXISTS update_saved_diets_updated_at ON saved_diets;
DROP TRIGGER IF EXISTS update_base_meals_updated_at ON base_meals;
DROP TRIGGER IF EXISTS update_base_ingredients_updated_at ON base_ingredients;
DROP TRIGGER IF EXISTS update_bug_reports_updated_at ON bug_reports;
DROP TRIGGER IF EXISTS update_training_data_updated_at ON training_data;
DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;

-- ===== CORE USER TABLE =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  -- Anthropometric data
  sex TEXT,
  age INTEGER,
  birthdate TEXT,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  lean_body_mass DECIMAL(5,2),
  
  -- Activity & Training data
  training_frequency INTEGER DEFAULT 0,
  training_intensity TEXT,
  training_type TEXT,
  training_time_preference TEXT,
  lifestyle_activity TEXT,
  occupation TEXT,
  daily_steps INTEGER,
  
  -- Goals & Macros
  goal TEXT,
  meals_per_day INTEGER DEFAULT 4,
  target_calories INTEGER DEFAULT 2000,
  target_protein DECIMAL(6,2) DEFAULT 150,
  target_carbs DECIMAL(6,2) DEFAULT 200,
  target_fat DECIMAL(6,2) DEFAULT 60,
  selected_macro_option TEXT,
  meal_distribution JSONB DEFAULT '{"breakfast":25,"lunch":30,"snack":15,"dinner":30}'::jsonb,
  
  -- History & Adaptation
  previous_diet_history JSONB,
  metabolic_adaptation JSONB,
  
  -- Preferences & Favorites
  preferences JSONB DEFAULT '{"likes":[],"dislikes":[],"allergies":[],"intolerances":[],"portionPreferences":{}}'::jsonb,
  accepted_meal_ids TEXT[] DEFAULT '{}',
  rejected_meal_ids TEXT[] DEFAULT '{}',
  favorite_meal_ids TEXT[] DEFAULT '{}',
  favorite_ingredient_ids TEXT[] DEFAULT '{}',
  
  -- Custom data (stored in users table for simplicity)
  custom_meals JSONB DEFAULT '[]'::jsonb,
  custom_ingredients JSONB DEFAULT '[]'::jsonb,
  custom_exercises JSONB DEFAULT '[]'::jsonb,
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===== DAILY LOGS TABLE =====
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Meals
  breakfast JSONB,
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  extra_foods JSONB DEFAULT '[]'::jsonb,
  complementary_meals JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  weight DECIMAL(5,2),
  is_saved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one log per user per date
  UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);

-- ===== SAVED DIETS TABLE =====
CREATE TABLE IF NOT EXISTS saved_diets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Meals
  breakfast JSONB,
  lunch JSONB,
  snack JSONB,
  dinner JSONB,
  
  -- Totals
  total_calories DECIMAL(7,2),
  total_protein DECIMAL(6,2),
  total_carbs DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_diets_user ON saved_diets(user_id);

-- ===== BASE MEALS TABLE =====
CREATE TABLE IF NOT EXISTS base_meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  meal_types TEXT[] NOT NULL,
  variant TEXT,
  
  -- Macros (per 100g base)
  calories DECIMAL(6,2) NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fat DECIMAL(5,2) NOT NULL,
  base_quantity DECIMAL(6,2) DEFAULT 100,
  
  -- Ingredients & Preparation
  ingredients JSONB DEFAULT '[]'::jsonb,
  ingredient_references JSONB,
  preparation_steps TEXT[] DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_base_meals_types ON base_meals USING GIN(meal_types);

-- ===== BASE INGREDIENTS TABLE =====
CREATE TABLE IF NOT EXISTS base_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Macros (per 100g)
  calories DECIMAL(6,2) NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fat DECIMAL(5,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_base_ingredients_category ON base_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_base_ingredients_name ON base_ingredients(name);

-- ===== BUG REPORTS TABLE =====
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Report details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  
  -- Admin handling
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);

-- ===== TRAINING DATA TABLE =====
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Training configuration (full JSON structure)
  training_config JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One training config per user
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_training_data_user ON training_data(user_id);

-- ===== COMPLETED WORKOUTS TABLE =====
CREATE TABLE IF NOT EXISTS completed_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  
  -- Workout details
  day_index INTEGER,
  exercises_completed JSONB,
  duration_minutes INTEGER,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multiple workouts per day allowed
  UNIQUE(user_id, workout_date, created_at)
);

CREATE INDEX IF NOT EXISTS idx_completed_workouts_user ON completed_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_date ON completed_workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_user_date ON completed_workouts(user_id, workout_date);

-- ===== TRAINING PLANS TABLE =====
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan details
  week_plan JSONB NOT NULL,
  plan_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active plan per user
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);

-- ===== TRAINING PROGRESS TABLE =====
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Progress tracking
  day_index INTEGER NOT NULL,
  exercise_reps JSONB,
  exercise_weights JSONB,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- One progress entry per user per date
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_date ON training_progress(date);

-- ===== ENABLE ROW LEVEL SECURITY =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- ===== CREATE RLS POLICIES =====

-- Users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily logs table
CREATE POLICY "Users can view own logs" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- Saved diets table
CREATE POLICY "Users can view own diets" ON saved_diets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own diets" ON saved_diets FOR ALL USING (auth.uid() = user_id);

-- Training data table
CREATE POLICY "Users can view own training data" ON training_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own training data" ON training_data FOR ALL USING (auth.uid() = user_id);

-- Completed workouts table
CREATE POLICY "Users can view own workouts" ON completed_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workouts" ON completed_workouts FOR ALL USING (auth.uid() = user_id);

-- Training plans table
CREATE POLICY "Users can view own plans" ON training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own plans" ON training_plans FOR ALL USING (auth.uid() = user_id);

-- Training progress table
CREATE POLICY "Users can view own progress" ON training_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON training_progress FOR ALL USING (auth.uid() = user_id);

-- Base meals: Public read, admin write
CREATE POLICY "Anyone can view base meals" ON base_meals FOR SELECT USING (true);
CREATE POLICY "Admins can manage base meals" ON base_meals FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Base ingredients: Public read, admin write
CREATE POLICY "Anyone can view base ingredients" ON base_ingredients FOR SELECT USING (true);
CREATE POLICY "Admins can manage base ingredients" ON base_ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- Bug reports: Users can view own, admins can view all
CREATE POLICY "Users can view own bug reports" ON bug_reports FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);
CREATE POLICY "Users can create bug reports" ON bug_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bug reports" ON bug_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- ===== CREATE FUNCTION FOR AUTO-UPDATE =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== CREATE TRIGGERS =====
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_diets_updated_at BEFORE UPDATE ON saved_diets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_meals_updated_at BEFORE UPDATE ON base_meals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_ingredients_updated_at BEFORE UPDATE ON base_ingredients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON bug_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_data_updated_at BEFORE UPDATE ON training_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON training_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== OPCIONAL: ELIMINAR KV STORE =====
DROP TABLE IF EXISTS kv_store_b0e879f0 CASCADE;

-- =====================================================
-- FINALIZADO ✅
-- =====================================================
-- 10 tablas creadas
-- 30+ indexes creados
-- 10+ políticas RLS creadas
-- 8 triggers creados
-- KV store eliminado
-- =====================================================
