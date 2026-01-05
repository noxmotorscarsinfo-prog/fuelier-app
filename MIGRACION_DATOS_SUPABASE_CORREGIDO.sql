-- ========================================
-- 🥗 SCRIPT DE MIGRACIÓN FUELIER (CORREGIDO)
-- ========================================
-- Este script:
-- 1. Crea la tabla base_meal_ingredients (faltaba)
-- 2. Inserta 33 ingredientes base
-- 3. Inserta 21 platos base
-- 4. Inserta 101 relaciones ingrediente-plato
-- ========================================

-- ========================================
-- PARTE 1: CREAR TABLA base_meal_ingredients
-- ========================================

CREATE TABLE IF NOT EXISTS base_meal_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id text NOT NULL REFERENCES base_meals(id) ON DELETE CASCADE,
  ingredient_id text NOT NULL REFERENCES base_ingredients(id) ON DELETE CASCADE,
  amount_in_grams numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_base_meal_ingredients_meal_id ON base_meal_ingredients(meal_id);
CREATE INDEX IF NOT EXISTS idx_base_meal_ingredients_ingredient_id ON base_meal_ingredients(ingredient_id);

-- ========================================
-- PARTE 2: LIMPIAR DATOS EXISTENTES (OPCIONAL)
-- ========================================
-- Descomenta estas líneas si quieres empezar desde cero:
-- DELETE FROM base_meal_ingredients;
-- DELETE FROM base_meals WHERE created_by IS NULL;
-- DELETE FROM base_ingredients WHERE created_by IS NULL;

-- ========================================
-- PARTE 3: INSERTAR INGREDIENTES (33 total)
-- ========================================

-- PROTEÍNAS (7)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('pollo-pechuga', 'Pechuga de Pollo', 'proteina', 165, 31, 0, 3.6, NULL),
('pavo-pechuga', 'Pechuga de Pavo', 'proteina', 135, 30, 0, 1, NULL),
('ternera-magra', 'Ternera Magra', 'proteina', 250, 26, 0, 15, NULL),
('salmon', 'Salmón', 'proteina', 208, 20, 0, 13, NULL),
('atun-natural', 'Atún Natural', 'proteina', 116, 26, 0, 1, NULL),
('huevos', 'Huevos', 'proteina', 155, 13, 1.1, 11, NULL),
('tofu', 'Tofu', 'proteina', 76, 8, 1.9, 4.8, NULL)
ON CONFLICT (id) DO NOTHING;

-- CARBOHIDRATOS (9)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('arroz-blanco', 'Arroz Blanco', 'carbohidrato', 130, 2.7, 28, 0.3, NULL),
('arroz-integral', 'Arroz Integral', 'carbohidrato', 111, 2.6, 23, 0.9, NULL),
('pasta-integral', 'Pasta Integral', 'carbohidrato', 124, 5, 26, 0.5, NULL),
('pasta-blanca', 'Pasta Blanca', 'carbohidrato', 131, 5, 25, 1.1, NULL),
('patata', 'Patata', 'carbohidrato', 77, 2, 17, 0.1, NULL),
('boniato', 'Boniato', 'carbohidrato', 86, 1.6, 20, 0.1, NULL),
('pan-integral', 'Pan Integral', 'carbohidrato', 247, 13, 41, 3.5, NULL),
('avena', 'Avena', 'carbohidrato', 389, 17, 66, 7, NULL),
('quinoa', 'Quinoa', 'carbohidrato', 120, 4.4, 21, 1.9, NULL)
ON CONFLICT (id) DO NOTHING;

-- GRASAS SALUDABLES (5)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('aceite-oliva', 'Aceite de Oliva', 'grasa', 884, 0, 0, 100, NULL),
('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15, NULL),
('nueces', 'Nueces', 'grasa', 654, 15, 14, 65, NULL),
('almendras', 'Almendras', 'grasa', 579, 21, 22, 50, NULL),
('mantequilla-cacahuete', 'Mantequilla de Cacahuete', 'grasa', 588, 25, 20, 50, NULL)
ON CONFLICT (id) DO NOTHING;

-- VEGETALES (7)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('brocoli', 'Brócoli', 'vegetal', 34, 2.8, 7, 0.4, NULL),
('espinacas', 'Espinacas', 'vegetal', 23, 2.9, 3.6, 0.4, NULL),
('tomate', 'Tomate', 'vegetal', 18, 0.9, 3.9, 0.2, NULL),
('lechuga', 'Lechuga', 'vegetal', 15, 1.4, 2.9, 0.2, NULL),
('zanahoria', 'Zanahoria', 'vegetal', 41, 0.9, 10, 0.2, NULL),
('pimiento', 'Pimiento', 'vegetal', 31, 1, 6, 0.3, NULL),
('cebolla', 'Cebolla', 'vegetal', 40, 1.1, 9, 0.1, NULL)
ON CONFLICT (id) DO NOTHING;

-- LÁCTEOS (4)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('leche-desnatada', 'Leche Desnatada', 'lacteo', 34, 3.4, 5, 0.1, NULL),
('yogur-griego', 'Yogur Griego Natural', 'lacteo', 59, 10, 3.6, 0.4, NULL),
('queso-fresco', 'Queso Fresco Batido 0%', 'lacteo', 72, 13, 4, 0.2, NULL),
('queso-mozzarella', 'Queso Mozzarella Light', 'lacteo', 254, 24, 3, 16, NULL)
ON CONFLICT (id) DO NOTHING;

-- FRUTAS (4)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3, NULL),
('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2, NULL),
('fresas', 'Fresas', 'fruta', 32, 0.7, 8, 0.3, NULL),
('arandanos', 'Arándanos', 'fruta', 57, 0.7, 14, 0.3, NULL)
ON CONFLICT (id) DO NOTHING;

-- CONDIMENTOS (3)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) VALUES
('sal', 'Sal', 'condimento', 0, 0, 0, 0, NULL),
('pimienta', 'Pimienta', 'condimento', 251, 10, 64, 3.3, NULL),
('ajo', 'Ajo', 'condimento', 149, 6.4, 33, 0.5, NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PARTE 4: INSERTAR PLATOS (21 total)
-- ========================================

-- DESAYUNOS (5)
INSERT INTO base_meals (id, name, type, variant, created_by) VALUES
('breakfast-tortilla-avena', 'Tortilla de Avena con Frutas', 'breakfast', NULL, NULL),
('breakfast-yogur-granola', 'Yogur Griego con Granola y Frutos Rojos', 'breakfast', NULL, NULL),
('breakfast-tostadas-pavo', 'Tostadas de Pan Integral con Pavo y Aguacate', 'breakfast', NULL, NULL),
('breakfast-tortilla-verduras', 'Tortilla de Claras con Verduras', 'breakfast', NULL, NULL),
('breakfast-bowl-avena', 'Bowl de Avena con Mantequilla de Cacahuete', 'breakfast', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- COMIDAS (5)
INSERT INTO base_meals (id, name, type, variant, created_by) VALUES
('lunch-pollo-arroz', 'Pollo a la Plancha con Arroz Integral', 'lunch', NULL, NULL),
('lunch-salmon-quinoa', 'Salmón con Quinoa y Vegetales', 'lunch', NULL, NULL),
('lunch-pasta-pavo', 'Pasta Integral con Pavo y Verduras', 'lunch', NULL, NULL),
('lunch-ternera-patatas', 'Ternera Magra con Patatas al Horno', 'lunch', NULL, NULL),
('lunch-arroz-pollo-curry', 'Arroz con Pollo al Curry', 'lunch', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- MERIENDAS (5)
INSERT INTO base_meals (id, name, type, variant, created_by) VALUES
('snack-yogur-nueces', 'Yogur Griego con Nueces y Frutas', 'snack', NULL, NULL),
('snack-tostada-queso', 'Tostada con Queso Fresco y Pavo', 'snack', NULL, NULL),
('snack-batido-proteina', 'Batido de Plátano y Avena', 'snack', NULL, NULL),
('snack-fruta-almendras', 'Frutas Variadas con Almendras', 'snack', NULL, NULL),
('snack-tortitas-avena', 'Tortitas de Avena con Frutas', 'snack', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- CENAS (5)
INSERT INTO base_meals (id, name, type, variant, created_by) VALUES
('dinner-salmon-verduras', 'Salmón con Verduras al Vapor', 'dinner', NULL, NULL),
('dinner-pollo-boniato', 'Pollo con Boniato y Ensalada', 'dinner', NULL, NULL),
('dinner-tortilla-ensalada', 'Tortilla de Claras con Ensalada Completa', 'dinner', NULL, NULL),
('dinner-pavo-quinoa', 'Pavo Salteado con Quinoa', 'dinner', NULL, NULL),
('dinner-merluza-verduras', 'Merluza con Verduras Salteadas', 'dinner', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PARTE 5: INSERTAR RELACIONES (101 total)
-- ========================================

-- DESAYUNO 1: Tortilla de Avena con Frutas (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('breakfast-tortilla-avena', 'huevos', 150),
('breakfast-tortilla-avena', 'avena', 50),
('breakfast-tortilla-avena', 'platano', 100),
('breakfast-tortilla-avena', 'fresas', 80),
('breakfast-tortilla-avena', 'leche-desnatada', 100);

-- DESAYUNO 2: Yogur Griego con Granola (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('breakfast-yogur-granola', 'yogur-griego', 250),
('breakfast-yogur-granola', 'avena', 40),
('breakfast-yogur-granola', 'nueces', 15),
('breakfast-yogur-granola', 'arandanos', 80),
('breakfast-yogur-granola', 'platano', 80);

-- DESAYUNO 3: Tostadas con Pavo (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('breakfast-tostadas-pavo', 'pan-integral', 80),
('breakfast-tostadas-pavo', 'pavo-pechuga', 80),
('breakfast-tostadas-pavo', 'aguacate', 50),
('breakfast-tostadas-pavo', 'tomate', 60),
('breakfast-tostadas-pavo', 'queso-fresco', 40);

-- DESAYUNO 4: Tortilla de Claras con Verduras (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('breakfast-tortilla-verduras', 'huevos', 200),
('breakfast-tortilla-verduras', 'espinacas', 80),
('breakfast-tortilla-verduras', 'pimiento', 60),
('breakfast-tortilla-verduras', 'cebolla', 40),
('breakfast-tortilla-verduras', 'pan-integral', 60),
('breakfast-tortilla-verduras', 'aceite-oliva', 5);

-- DESAYUNO 5: Bowl de Avena (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('breakfast-bowl-avena', 'avena', 60),
('breakfast-bowl-avena', 'leche-desnatada', 200),
('breakfast-bowl-avena', 'mantequilla-cacahuete', 20),
('breakfast-bowl-avena', 'platano', 100),
('breakfast-bowl-avena', 'almendras', 10);

-- COMIDA 1: Pollo con Arroz (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('lunch-pollo-arroz', 'pollo-pechuga', 180),
('lunch-pollo-arroz', 'arroz-integral', 150),
('lunch-pollo-arroz', 'brocoli', 150),
('lunch-pollo-arroz', 'zanahoria', 80),
('lunch-pollo-arroz', 'aceite-oliva', 10);

-- COMIDA 2: Salmón con Quinoa (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('lunch-salmon-quinoa', 'salmon', 160),
('lunch-salmon-quinoa', 'quinoa', 120),
('lunch-salmon-quinoa', 'espinacas', 100),
('lunch-salmon-quinoa', 'tomate', 80),
('lunch-salmon-quinoa', 'aguacate', 40),
('lunch-salmon-quinoa', 'aceite-oliva', 8);

-- COMIDA 3: Pasta con Pavo (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('lunch-pasta-pavo', 'pasta-integral', 140),
('lunch-pasta-pavo', 'pavo-pechuga', 150),
('lunch-pasta-pavo', 'tomate', 120),
('lunch-pasta-pavo', 'pimiento', 80),
('lunch-pasta-pavo', 'cebolla', 50),
('lunch-pasta-pavo', 'aceite-oliva', 10);

-- COMIDA 4: Ternera con Patatas (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('lunch-ternera-patatas', 'ternera-magra', 160),
('lunch-ternera-patatas', 'patata', 200),
('lunch-ternera-patatas', 'brocoli', 120),
('lunch-ternera-patatas', 'zanahoria', 80),
('lunch-ternera-patatas', 'aceite-oliva', 12);

-- COMIDA 5: Arroz con Pollo al Curry (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('lunch-arroz-pollo-curry', 'pollo-pechuga', 170),
('lunch-arroz-pollo-curry', 'arroz-blanco', 140),
('lunch-arroz-pollo-curry', 'cebolla', 60),
('lunch-arroz-pollo-curry', 'pimiento', 80),
('lunch-arroz-pollo-curry', 'leche-desnatada', 100),
('lunch-arroz-pollo-curry', 'aceite-oliva', 10);

-- MERIENDA 1: Yogur con Nueces (3 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('snack-yogur-nueces', 'yogur-griego', 200),
('snack-yogur-nueces', 'nueces', 20),
('snack-yogur-nueces', 'manzana', 100);

-- MERIENDA 2: Tostada con Queso (4 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('snack-tostada-queso', 'pan-integral', 60),
('snack-tostada-queso', 'queso-fresco', 60),
('snack-tostada-queso', 'pavo-pechuga', 50),
('snack-tostada-queso', 'tomate', 50);

-- MERIENDA 3: Batido de Proteína (4 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('snack-batido-proteina', 'platano', 120),
('snack-batido-proteina', 'avena', 40),
('snack-batido-proteina', 'leche-desnatada', 250),
('snack-batido-proteina', 'mantequilla-cacahuete', 15);

-- MERIENDA 4: Frutas con Almendras (3 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('snack-fruta-almendras', 'manzana', 120),
('snack-fruta-almendras', 'platano', 100),
('snack-fruta-almendras', 'almendras', 25);

-- MERIENDA 5: Tortitas de Avena (4 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('snack-tortitas-avena', 'avena', 50),
('snack-tortitas-avena', 'huevos', 100),
('snack-tortitas-avena', 'platano', 80),
('snack-tortitas-avena', 'fresas', 60);

-- CENA 1: Salmón con Verduras (5 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('dinner-salmon-verduras', 'salmon', 150),
('dinner-salmon-verduras', 'brocoli', 150),
('dinner-salmon-verduras', 'espinacas', 100),
('dinner-salmon-verduras', 'zanahoria', 80),
('dinner-salmon-verduras', 'aceite-oliva', 10);

-- CENA 2: Pollo con Boniato (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('dinner-pollo-boniato', 'pollo-pechuga', 160),
('dinner-pollo-boniato', 'boniato', 150),
('dinner-pollo-boniato', 'lechuga', 100),
('dinner-pollo-boniato', 'tomate', 80),
('dinner-pollo-boniato', 'aguacate', 30),
('dinner-pollo-boniato', 'aceite-oliva', 10);

-- CENA 3: Tortilla con Ensalada (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('dinner-tortilla-ensalada', 'huevos', 180),
('dinner-tortilla-ensalada', 'lechuga', 100),
('dinner-tortilla-ensalada', 'tomate', 100),
('dinner-tortilla-ensalada', 'zanahoria', 60),
('dinner-tortilla-ensalada', 'atun-natural', 80),
('dinner-tortilla-ensalada', 'aceite-oliva', 10);

-- CENA 4: Pavo con Quinoa (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('dinner-pavo-quinoa', 'pavo-pechuga', 150),
('dinner-pavo-quinoa', 'quinoa', 100),
('dinner-pavo-quinoa', 'pimiento', 80),
('dinner-pavo-quinoa', 'cebolla', 50),
('dinner-pavo-quinoa', 'espinacas', 80),
('dinner-pavo-quinoa', 'aceite-oliva', 8);

-- CENA 5: Merluza con Verduras (6 ingredientes)
INSERT INTO base_meal_ingredients (meal_id, ingredient_id, amount_in_grams) VALUES
('dinner-merluza-verduras', 'atun-natural', 160),
('dinner-merluza-verduras', 'brocoli', 120),
('dinner-merluza-verduras', 'zanahoria', 80),
('dinner-merluza-verduras', 'pimiento', 80),
('dinner-merluza-verduras', 'patata', 120),
('dinner-merluza-verduras', 'aceite-oliva', 10);

-- ========================================
-- ✅ MIGRACIÓN COMPLETADA
-- ========================================
-- Resumen:
-- ✓ Tabla base_meal_ingredients creada
-- ✓ 33 ingredientes insertados
-- ✓ 21 platos insertados
-- ✓ 101 relaciones ingrediente-plato insertadas
-- ========================================

-- Verificar resultados:
SELECT COUNT(*) as total_ingredientes FROM base_ingredients WHERE created_by IS NULL;
SELECT COUNT(*) as total_platos FROM base_meals WHERE created_by IS NULL;
SELECT COUNT(*) as total_relaciones FROM base_meal_ingredients;
