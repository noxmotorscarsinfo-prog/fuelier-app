-- SINCRONIZACIÓN DE INGREDIENTES BASE
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Esto sobrescribe los ingredientes base con los valores correctos de ingredientsDatabase.ts

-- PROTEÍNAS CARNE
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('pechuga-pollo', 'Pechuga de Pollo', 'proteina', 165, 31, 0, 3.6),
('pechuga-pavo', 'Pechuga de Pavo', 'proteina', 135, 30, 0, 1),
('ternera-magra', 'Ternera Magra', 'proteina', 250, 26, 0, 15),
('salmon', 'Salmón', 'proteina', 208, 20, 0, 13),
('atun-natural', 'Atún Natural', 'proteina', 132, 28, 0, 0.6),
('merluza', 'Merluza', 'proteina', 86, 17, 0, 1.3),
('bacalao', 'Bacalao', 'proteina', 82, 18, 0, 0.7),
('lubina', 'Lubina', 'proteina', 97, 18, 0, 2),
('dorada', 'Dorada', 'proteina', 96, 19.8, 0, 1.2),
('huevos', 'Huevos', 'proteina', 155, 13, 1.1, 11),
('clara-huevo', 'Clara de Huevo', 'proteina', 52, 11, 0.7, 0.2),
('tofu', 'Tofu', 'proteina', 76, 8, 1.9, 4.8),
('proteina-whey', 'Proteína Whey', 'proteina', 400, 80, 10, 5),
('lentejas', 'Lentejas Cocidas', 'proteina', 116, 9, 20, 0.4),
('garbanzos', 'Garbanzos Cocidos', 'proteina', 164, 8.9, 27, 2.6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- CARBOHIDRATOS
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('arroz-blanco', 'Arroz Blanco', 'carbohidrato', 130, 2.7, 28, 0.3),
('arroz-integral', 'Arroz Integral', 'carbohidrato', 111, 2.6, 23, 0.9),
('pasta-integral', 'Pasta Integral', 'carbohidrato', 131, 5.5, 26, 1.1),
('pasta-blanca', 'Pasta Blanca', 'carbohidrato', 131, 5, 25, 1.1),
('patata', 'Patata', 'carbohidrato', 77, 2, 17, 0.1),
('boniato', 'Boniato', 'carbohidrato', 86, 1.6, 20, 0.1),
('pan-integral', 'Pan Integral', 'carbohidrato', 247, 13, 41, 3.4),
('avena', 'Avena', 'carbohidrato', 389, 17, 66, 7),
('quinoa', 'Quinoa', 'carbohidrato', 120, 4.4, 21, 1.9),
('arroz-basmati', 'Arroz Basmati', 'carbohidrato', 121, 3.5, 25, 0.9),
('tortitas-arroz', 'Tortitas de Arroz', 'carbohidrato', 387, 7.5, 82, 2.8),
('pan-centeno', 'Pan de Centeno', 'carbohidrato', 259, 8.5, 48, 3.3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- GRASAS
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('aceite-oliva', 'Aceite de Oliva', 'grasa', 884, 0, 0, 100),
('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15),
('nueces', 'Nueces', 'grasa', 654, 15, 14, 65),
('almendras', 'Almendras', 'grasa', 579, 21, 22, 50),
('mantequilla-cacahuete', 'Mantequilla de Cacahuete', 'grasa', 588, 25, 20, 50),
('aceite-coco', 'Aceite de Coco', 'grasa', 862, 0, 0, 100)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- VEGETALES
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('brocoli', 'Brócoli', 'vegetal', 34, 2.8, 7, 0.4),
('espinacas', 'Espinacas', 'vegetal', 23, 2.9, 3.6, 0.4),
('tomate', 'Tomate', 'vegetal', 18, 0.9, 3.9, 0.2),
('lechuga', 'Lechuga', 'vegetal', 15, 1.4, 2.9, 0.2),
('zanahoria', 'Zanahoria', 'vegetal', 41, 0.9, 10, 0.2),
('pimiento', 'Pimiento', 'vegetal', 31, 1, 6, 0.3),
('cebolla', 'Cebolla', 'vegetal', 40, 1.1, 9.3, 0.1),
('calabacin', 'Calabacín', 'vegetal', 17, 1.2, 3.1, 0.3),
('berenjena', 'Berenjena', 'vegetal', 25, 1, 6, 0.2),
('esparragos', 'Espárragos', 'vegetal', 20, 2.2, 3.9, 0.1),
('champinones', 'Champiñones', 'vegetal', 22, 3.1, 3.3, 0.3),
('pepino', 'Pepino', 'vegetal', 15, 0.7, 3.6, 0.1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- LÁCTEOS
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('leche-desnatada', 'Leche Desnatada', 'lacteo', 34, 3.4, 5, 0.1),
('yogur-griego', 'Yogur Griego Natural', 'lacteo', 59, 10, 3.6, 0.4),
('queso-fresco', 'Queso Fresco Batido 0%', 'lacteo', 72, 13, 4, 0.2),
('queso-mozzarella', 'Queso Mozzarella Light', 'lacteo', 254, 24, 3, 16),
('requesón', 'Requesón', 'lacteo', 98, 11, 3.4, 4.3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- FRUTAS
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3),
('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2),
('fresas', 'Fresas', 'fruta', 32, 0.7, 8, 0.3),
('arandanos', 'Arándanos', 'fruta', 57, 0.7, 14, 0.3),
('kiwi', 'Kiwi', 'fruta', 61, 1.1, 15, 0.5),
('naranja', 'Naranja', 'fruta', 47, 0.9, 12, 0.1),
('melocotón', 'Melocotón', 'fruta', 39, 0.9, 10, 0.3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- CONDIMENTOS
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) VALUES
('sal', 'Sal', 'condimento', 0, 0, 0, 0),
('pimienta', 'Pimienta', 'condimento', 251, 10, 64, 3.3),
('ajo', 'Ajo', 'condimento', 149, 6.4, 33, 0.5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();

-- Verificar total
SELECT COUNT(*) as total_ingredientes FROM base_ingredients;
