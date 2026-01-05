-- ========================================
-- 🥗 FUELIER - MIGRACIÓN FINAL (ESTRUCTURA CORRECTA)
-- ========================================
-- Este script inserta:
-- - 33 ingredientes base
-- - 21 platos base con estructura correcta
-- ========================================

-- ========================================
-- PASO 1: INSERTAR INGREDIENTES BASE (33)
-- ========================================

-- PROTEÍNAS (7)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('pollo-pechuga', 'Pechuga de Pollo', 'proteina', 165, 31, 0, 3.6, NULL),
  ('pavo-pechuga', 'Pechuga de Pavo', 'proteina', 135, 30, 0, 1, NULL),
  ('ternera-magra', 'Ternera Magra', 'proteina', 250, 26, 0, 15, NULL),
  ('salmon', 'Salmón', 'proteina', 208, 20, 0, 13, NULL),
  ('atun-natural', 'Atún Natural', 'proteina', 116, 26, 0, 1, NULL),
  ('huevos', 'Huevos', 'proteina', 155, 13, 1.1, 11, NULL),
  ('tofu', 'Tofu', 'proteina', 76, 8, 1.9, 4.8, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- CARBOHIDRATOS (9)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('arroz-blanco', 'Arroz Blanco', 'carbohidrato', 130, 2.7, 28, 0.3, NULL),
  ('arroz-integral', 'Arroz Integral', 'carbohidrato', 111, 2.6, 23, 0.9, NULL),
  ('pasta-integral', 'Pasta Integral', 'carbohidrato', 124, 5, 26, 0.5, NULL),
  ('pasta-blanca', 'Pasta Blanca', 'carbohidrato', 131, 5, 25, 1.1, NULL),
  ('patata', 'Patata', 'carbohidrato', 77, 2, 17, 0.1, NULL),
  ('boniato', 'Boniato', 'carbohidrato', 86, 1.6, 20, 0.1, NULL),
  ('pan-integral', 'Pan Integral', 'carbohidrato', 247, 13, 41, 3.5, NULL),
  ('avena', 'Avena', 'carbohidrato', 389, 17, 66, 7, NULL),
  ('quinoa', 'Quinoa', 'carbohidrato', 120, 4.4, 21, 1.9, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- GRASAS SALUDABLES (5)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('aceite-oliva', 'Aceite de Oliva', 'grasa', 884, 0, 0, 100, NULL),
  ('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15, NULL),
  ('nueces', 'Nueces', 'grasa', 654, 15, 14, 65, NULL),
  ('almendras', 'Almendras', 'grasa', 579, 21, 22, 50, NULL),
  ('mantequilla-cacahuete', 'Mantequilla de Cacahuete', 'grasa', 588, 25, 20, 50, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- VEGETALES (7)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('brocoli', 'Brócoli', 'vegetal', 34, 2.8, 7, 0.4, NULL),
  ('espinacas', 'Espinacas', 'vegetal', 23, 2.9, 3.6, 0.4, NULL),
  ('tomate', 'Tomate', 'vegetal', 18, 0.9, 3.9, 0.2, NULL),
  ('lechuga', 'Lechuga', 'vegetal', 15, 1.4, 2.9, 0.2, NULL),
  ('zanahoria', 'Zanahoria', 'vegetal', 41, 0.9, 10, 0.2, NULL),
  ('pimiento', 'Pimiento', 'vegetal', 31, 1, 6, 0.3, NULL),
  ('cebolla', 'Cebolla', 'vegetal', 40, 1.1, 9, 0.1, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- LÁCTEOS (4)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('leche-desnatada', 'Leche Desnatada', 'lacteo', 34, 3.4, 5, 0.1, NULL),
  ('yogur-griego', 'Yogur Griego Natural', 'lacteo', 59, 10, 3.6, 0.4, NULL),
  ('queso-fresco', 'Queso Fresco Batido 0%', 'lacteo', 72, 13, 4, 0.2, NULL),
  ('queso-mozzarella', 'Queso Mozzarella Light', 'lacteo', 254, 24, 3, 16, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- FRUTAS (4)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3, NULL),
  ('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2, NULL),
  ('fresas', 'Fresas', 'fruta', 32, 0.7, 8, 0.3, NULL),
  ('arandanos', 'Arándanos', 'fruta', 57, 0.7, 14, 0.3, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- CONDIMENTOS (3)
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat, created_by) 
VALUES
  ('sal', 'Sal', 'condimento', 0, 0, 0, 0, NULL),
  ('pimienta', 'Pimienta', 'condimento', 251, 10, 64, 3.3, NULL),
  ('ajo', 'Ajo', 'condimento', 149, 6.4, 33, 0.5, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat;

-- ========================================
-- PASO 2: INSERTAR PLATOS BASE (21)
-- ========================================

-- DESAYUNO 1: Tortilla de Avena con Frutas
INSERT INTO base_meals (
  id, name, meal_types, variant, 
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'breakfast-tortilla-avena',
  'Tortilla de Avena con Frutas',
  ARRAY['breakfast'],
  NULL,
  463.9, 30.6, 60.4, 20.4, 480,
  ARRAY['Huevos', 'Avena', 'Plátano', 'Fresas', 'Leche Desnatada'],
  '[{"id":"huevos","amount":150},{"id":"avena","amount":50},{"id":"platano","amount":100},{"id":"fresas","amount":80},{"id":"leche-desnatada","amount":100}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- DESAYUNO 2: Yogur Griego con Granola
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'breakfast-yogur-granola',
  'Yogur Griego con Granola y Frutos Rojos',
  ARRAY['breakfast'],
  NULL,
  371.5, 39.4, 47.9, 16.7, 445,
  ARRAY['Yogur Griego Natural', 'Avena', 'Nueces', 'Arándanos', 'Plátano'],
  '[{"id":"yogur-griego","amount":250},{"id":"avena","amount":40},{"id":"nueces","amount":15},{"id":"arandanos","amount":80},{"id":"platano","amount":80}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- DESAYUNO 3: Tostadas de Pan Integral con Pavo y Aguacate
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'breakfast-tostadas-pavo',
  'Tostadas de Pan Integral con Pavo y Aguacate',
  ARRAY['breakfast'],
  NULL,
  407.6, 42.2, 44.1, 12.9, 310,
  ARRAY['Pan Integral', 'Pechuga de Pavo', 'Aguacate', 'Tomate', 'Queso Fresco Batido 0%'],
  '[{"id":"pan-integral","amount":80},{"id":"pavo-pechuga","amount":80},{"id":"aguacate","amount":50},{"id":"tomate","amount":60},{"id":"queso-fresco","amount":40}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- DESAYUNO 4: Tortilla de Claras con Verduras
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'breakfast-tortilla-verduras',
  'Tortilla de Claras con Verduras',
  ARRAY['breakfast'],
  NULL,
  496.1, 42.9, 42.5, 28.1, 445,
  ARRAY['Huevos', 'Espinacas', 'Pimiento', 'Cebolla', 'Pan Integral', 'Aceite de Oliva'],
  '[{"id":"huevos","amount":200},{"id":"espinacas","amount":80},{"id":"pimiento","amount":60},{"id":"cebolla","amount":40},{"id":"pan-integral","amount":60},{"id":"aceite-oliva","amount":5}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- DESAYUNO 5: Bowl de Avena con Mantequilla de Cacahuete
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'breakfast-bowl-avena',
  'Bowl de Avena con Mantequilla de Cacahuete',
  ARRAY['breakfast'],
  NULL,
  534.2, 23.9, 75.7, 16.8, 390,
  ARRAY['Avena', 'Leche Desnatada', 'Mantequilla de Cacahuete', 'Plátano', 'Almendras'],
  '[{"id":"avena","amount":60},{"id":"leche-desnatada","amount":200},{"id":"mantequilla-cacahuete","amount":20},{"id":"platano","amount":100},{"id":"almendras","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- COMIDA 1: Pollo a la Plancha con Arroz Integral
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'lunch-pollo-arroz',
  'Pollo a la Plancha con Arroz Integral',
  ARRAY['lunch'],
  NULL,
  589.9, 66.3, 54.3, 17.3, 570,
  ARRAY['Pechuga de Pollo', 'Arroz Integral', 'Brócoli', 'Zanahoria', 'Aceite de Oliva'],
  '[{"id":"pollo-pechuga","amount":180},{"id":"arroz-integral","amount":150},{"id":"brocoli","amount":150},{"id":"zanahoria","amount":80},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- COMIDA 2: Salmón con Quinoa y Vegetales
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'lunch-salmon-quinoa',
  'Salmón con Quinoa y Vegetales',
  ARRAY['lunch'],
  NULL,
  584.0, 49.7, 42.3, 26.6, 488,
  ARRAY['Salmón', 'Quinoa', 'Espinacas', 'Tomate', 'Aguacate', 'Aceite de Oliva'],
  '[{"id":"salmon","amount":160},{"id":"quinoa","amount":120},{"id":"espinacas","amount":100},{"id":"tomate","amount":80},{"id":"aguacate","amount":40},{"id":"aceite-oliva","amount":8}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- COMIDA 3: Pasta Integral con Pavo y Verduras
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'lunch-pasta-pavo',
  'Pasta Integral con Pavo y Verduras',
  ARRAY['lunch'],
  NULL,
  556.6, 60.1, 58.5, 12.7, 550,
  ARRAY['Pasta Integral', 'Pechuga de Pavo', 'Tomate', 'Pimiento', 'Cebolla', 'Aceite de Oliva'],
  '[{"id":"pasta-integral","amount":140},{"id":"pavo-pechuga","amount":150},{"id":"tomate","amount":120},{"id":"pimiento","amount":80},{"id":"cebolla","amount":50},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- COMIDA 4: Ternera Magra con Patatas al Horno
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'lunch-ternera-patatas',
  'Ternera Magra con Patatas al Horno',
  ARRAY['lunch'],
  NULL,
  689.8, 57.7, 62.5, 30.9, 572,
  ARRAY['Ternera Magra', 'Patata', 'Brócoli', 'Zanahoria', 'Aceite de Oliva'],
  '[{"id":"ternera-magra","amount":160},{"id":"patata","amount":200},{"id":"brocoli","amount":120},{"id":"zanahoria","amount":80},{"id":"aceite-oliva","amount":12}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- COMIDA 5: Arroz con Pollo al Curry
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'lunch-arroz-pollo-curry',
  'Arroz con Pollo al Curry',
  ARRAY['lunch'],
  NULL,
  569.9, 63.9, 54.3, 15.6, 560,
  ARRAY['Pechuga de Pollo', 'Arroz Blanco', 'Cebolla', 'Pimiento', 'Leche Desnatada', 'Aceite de Oliva'],
  '[{"id":"pollo-pechuga","amount":170},{"id":"arroz-blanco","amount":140},{"id":"cebolla","amount":60},{"id":"pimiento","amount":80},{"id":"leche-desnatada","amount":100},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- MERIENDA 1: Yogur Griego con Nueces y Frutas
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'snack-yogur-nueces',
  'Yogur Griego con Nueces y Frutas',
  ARRAY['snack'],
  NULL,
  301.0, 22.4, 35.6, 14.3, 320,
  ARRAY['Yogur Griego Natural', 'Nueces', 'Manzana'],
  '[{"id":"yogur-griego","amount":200},{"id":"nueces","amount":20},{"id":"manzana","amount":100}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- MERIENDA 2: Tostada con Queso Fresco y Pavo
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'snack-tostada-queso',
  'Tostada con Queso Fresco y Pavo',
  ARRAY['snack'],
  NULL,
  304.2, 35.9, 28.6, 5.2, 220,
  ARRAY['Pan Integral', 'Queso Fresco Batido 0%', 'Pechuga de Pavo', 'Tomate'],
  '[{"id":"pan-integral","amount":60},{"id":"queso-fresco","amount":60},{"id":"pavo-pechuga","amount":50},{"id":"tomate","amount":50}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- MERIENDA 3: Batido de Plátano y Avena
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'snack-batido-proteina',
  'Batido de Plátano y Avena',
  ARRAY['snack'],
  NULL,
  450.6, 24.1, 71.5, 10.7, 425,
  ARRAY['Plátano', 'Avena', 'Leche Desnatada', 'Mantequilla de Cacahuete'],
  '[{"id":"platano","amount":120},{"id":"avena","amount":40},{"id":"leche-desnatada","amount":250},{"id":"mantequilla-cacahuete","amount":15}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- MERIENDA 4: Frutas Variadas con Almendras
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'snack-fruta-almendras',
  'Frutas Variadas con Almendras',
  ARRAY['snack'],
  NULL,
  349.2, 6.6, 61.8, 13.0, 245,
  ARRAY['Manzana', 'Plátano', 'Almendras'],
  '[{"id":"manzana","amount":120},{"id":"platano","amount":100},{"id":"almendras","amount":25}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- MERIENDA 5: Tortitas de Avena con Frutas
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'snack-tortitas-avena',
  'Tortitas de Avena con Frutas',
  ARRAY['snack'],
  NULL,
  423.4, 24.9, 60.9, 13.2, 290,
  ARRAY['Avena', 'Huevos', 'Plátano', 'Fresas'],
  '[{"id":"avena","amount":50},{"id":"huevos","amount":100},{"id":"platano","amount":80},{"id":"fresas","amount":60}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- CENA 1: Salmón con Verduras al Vapor
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'dinner-salmon-verduras',
  'Salmón con Verduras al Vapor',
  ARRAY['dinner'],
  NULL,
  530.2, 44.0, 30.6, 29.0, 540,
  ARRAY['Salmón', 'Brócoli', 'Espinacas', 'Zanahoria', 'Aceite de Oliva'],
  '[{"id":"salmon","amount":150},{"id":"brocoli","amount":150},{"id":"espinacas","amount":100},{"id":"zanahoria","amount":80},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- CENA 2: Pollo con Boniato y Ensalada
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'dinner-pollo-boniato',
  'Pollo con Boniato y Ensalada',
  ARRAY['dinner'],
  NULL,
  544.4, 59.8, 46.5, 16.4, 530,
  ARRAY['Pechuga de Pollo', 'Boniato', 'Lechuga', 'Tomate', 'Aguacate', 'Aceite de Oliva'],
  '[{"id":"pollo-pechuga","amount":160},{"id":"boniato","amount":150},{"id":"lechuga","amount":100},{"id":"tomate","amount":80},{"id":"aguacate","amount":30},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- CENA 3: Tortilla de Claras con Ensalada Completa
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'dinner-tortilla-ensalada',
  'Tortilla de Claras con Ensalada Completa',
  ARRAY['dinner'],
  NULL,
  550.2, 53.3, 27.9, 28.6, 610,
  ARRAY['Huevos', 'Lechuga', 'Tomate', 'Zanahoria', 'Atún Natural', 'Aceite de Oliva'],
  '[{"id":"huevos","amount":180},{"id":"lechuga","amount":100},{"id":"tomate","amount":100},{"id":"zanahoria","amount":60},{"id":"atun-natural","amount":80},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- CENA 4: Pavo Salteado con Quinoa
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'dinner-pavo-quinoa',
  'Pavo Salteado con Quinoa',
  ARRAY['dinner'],
  NULL,
  471.8, 56.3, 39.8, 10.4, 468,
  ARRAY['Pechuga de Pavo', 'Quinoa', 'Pimiento', 'Cebolla', 'Espinacas', 'Aceite de Oliva'],
  '[{"id":"pavo-pechuga","amount":150},{"id":"quinoa","amount":100},{"id":"pimiento","amount":80},{"id":"cebolla","amount":50},{"id":"espinacas","amount":80},{"id":"aceite-oliva","amount":8}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- CENA 5: Merluza con Verduras Salteadas
INSERT INTO base_meals (
  id, name, meal_types, variant,
  calories, protein, carbs, fat, base_quantity,
  ingredients, ingredient_references, created_by
) VALUES (
  'dinner-merluza-verduras',
  'Merluza con Verduras Salteadas',
  ARRAY['dinner'],
  NULL,
  482.4, 51.8, 50.0, 12.7, 570,
  ARRAY['Atún Natural', 'Brócoli', 'Zanahoria', 'Pimiento', 'Patata', 'Aceite de Oliva'],
  '[{"id":"atun-natural","amount":160},{"id":"brocoli","amount":120},{"id":"zanahoria","amount":80},{"id":"pimiento","amount":80},{"id":"patata","amount":120},{"id":"aceite-oliva","amount":10}]'::jsonb,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  meal_types = EXCLUDED.meal_types,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  base_quantity = EXCLUDED.base_quantity,
  ingredients = EXCLUDED.ingredients,
  ingredient_references = EXCLUDED.ingredient_references;

-- ========================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================

SELECT 
  'Ingredientes base' as tabla,
  COUNT(*) as total 
FROM base_ingredients 
WHERE created_by IS NULL

UNION ALL

SELECT 
  'Platos base' as tabla,
  COUNT(*) as total 
FROM base_meals 
WHERE created_by IS NULL;

-- ========================================
-- 🎉 MIGRACIÓN COMPLETADA
-- ========================================
-- Deberías ver:
-- - Ingredientes base: 33
-- - Platos base: 21
-- ========================================
