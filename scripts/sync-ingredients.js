/**
 * Script para sincronizar ingredientes con la base de datos de Supabase
 * Ejecutar: node scripts/sync-ingredients.js
 */

// Base de datos de ingredientes con valores nutricionales reales por 100g
const INGREDIENTS_WITH_MACROS = [
  // PROTEÍNAS
  { id: 'pollo-pechuga', name: 'Pechuga de Pollo', category: 'proteina', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { id: 'pavo-pechuga', name: 'Pechuga de Pavo', category: 'proteina', calories_per_100g: 135, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 1 },
  { id: 'ternera-magra', name: 'Ternera Magra', category: 'proteina', calories_per_100g: 250, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 15 },
  { id: 'salmon', name: 'Salmón', category: 'proteina', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13 },
  { id: 'atun-natural', name: 'Atún Natural', category: 'proteina', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1 },
  { id: 'merluza', name: 'Merluza', category: 'proteina', calories_per_100g: 90, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 2 },
  { id: 'bacalao', name: 'Bacalao', category: 'proteina', calories_per_100g: 82, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 0.7 },
  { id: 'lubina', name: 'Lubina', category: 'proteina', calories_per_100g: 97, protein_per_100g: 19, carbs_per_100g: 0, fat_per_100g: 2 },
  { id: 'dorada', name: 'Dorada', category: 'proteina', calories_per_100g: 100, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 2.3 },
  { id: 'huevos', name: 'Huevos', category: 'proteina', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { id: 'tofu', name: 'Tofu', category: 'proteina', calories_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8 },
  { id: 'proteina-whey', name: 'Proteína Whey', category: 'proteina', calories_per_100g: 400, protein_per_100g: 80, carbs_per_100g: 8, fat_per_100g: 6 },
  { id: 'lentejas', name: 'Lentejas Cocidas', category: 'proteina', calories_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4 },
  { id: 'garbanzos', name: 'Garbanzos Cocidos', category: 'proteina', calories_per_100g: 164, protein_per_100g: 8.9, carbs_per_100g: 27, fat_per_100g: 2.6 },
  { id: 'gambas', name: 'Gambas', category: 'proteina', calories_per_100g: 99, protein_per_100g: 21, carbs_per_100g: 0.2, fat_per_100g: 1.4 },
  { id: 'seitan', name: 'Seitán', category: 'proteina', calories_per_100g: 370, protein_per_100g: 75, carbs_per_100g: 14, fat_per_100g: 2 },
  { id: 'tempeh', name: 'Tempeh', category: 'proteina', calories_per_100g: 193, protein_per_100g: 19, carbs_per_100g: 9, fat_per_100g: 11 },
  { id: 'jamon-serrano', name: 'Jamón Serrano', category: 'proteina', calories_per_100g: 195, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 8 },
  { id: 'jamon-york', name: 'Jamón York', category: 'proteina', calories_per_100g: 105, protein_per_100g: 21, carbs_per_100g: 1, fat_per_100g: 2 },
  { id: 'pechuga-pavo-lonchas', name: 'Pechuga de Pavo Lonchas', category: 'proteina', calories_per_100g: 105, protein_per_100g: 20, carbs_per_100g: 1, fat_per_100g: 2 },
  
  // CARBOHIDRATOS
  { id: 'arroz-blanco', name: 'Arroz Blanco', category: 'carbohidrato', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  { id: 'arroz-integral', name: 'Arroz Integral', category: 'carbohidrato', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
  { id: 'arroz-basmati', name: 'Arroz Basmati', category: 'carbohidrato', calories_per_100g: 121, protein_per_100g: 2.7, carbs_per_100g: 25, fat_per_100g: 0.4 },
  { id: 'pasta-integral', name: 'Pasta Integral', category: 'carbohidrato', calories_per_100g: 124, protein_per_100g: 5, carbs_per_100g: 26, fat_per_100g: 0.5 },
  { id: 'pasta-blanca', name: 'Pasta Blanca', category: 'carbohidrato', calories_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1 },
  { id: 'patata', name: 'Patata', category: 'carbohidrato', calories_per_100g: 77, protein_per_100g: 2, carbs_per_100g: 17, fat_per_100g: 0.1 },
  { id: 'boniato', name: 'Boniato', category: 'carbohidrato', calories_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1 },
  { id: 'pan-integral', name: 'Pan Integral', category: 'carbohidrato', calories_per_100g: 247, protein_per_100g: 13, carbs_per_100g: 41, fat_per_100g: 3.5 },
  { id: 'pan-centeno', name: 'Pan de Centeno', category: 'carbohidrato', calories_per_100g: 259, protein_per_100g: 8.5, carbs_per_100g: 48, fat_per_100g: 3.3 },
  { id: 'avena', name: 'Avena', category: 'carbohidrato', calories_per_100g: 389, protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7 },
  { id: 'quinoa', name: 'Quinoa', category: 'carbohidrato', calories_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9 },
  { id: 'tortitas-arroz', name: 'Tortitas de Arroz', category: 'carbohidrato', calories_per_100g: 387, protein_per_100g: 8, carbs_per_100g: 81, fat_per_100g: 3 },
  { id: 'cuscus', name: 'Cuscús', category: 'carbohidrato', calories_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23, fat_per_100g: 0.2 },
  { id: 'mijo', name: 'Mijo', category: 'carbohidrato', calories_per_100g: 119, protein_per_100g: 3.5, carbs_per_100g: 24, fat_per_100g: 1 },
  { id: 'bulgur', name: 'Bulgur', category: 'carbohidrato', calories_per_100g: 83, protein_per_100g: 3.1, carbs_per_100g: 18, fat_per_100g: 0.2 },
  
  // GRASAS SALUDABLES
  { id: 'aceite-oliva', name: 'Aceite de Oliva', category: 'grasa', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { id: 'aguacate', name: 'Aguacate', category: 'grasa', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15 },
  { id: 'nueces', name: 'Nueces', category: 'grasa', calories_per_100g: 654, protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65 },
  { id: 'almendras', name: 'Almendras', category: 'grasa', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
  { id: 'mantequilla-cacahuete', name: 'Mantequilla de Cacahuete', category: 'grasa', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50 },
  { id: 'cacahuetes', name: 'Cacahuetes', category: 'grasa', calories_per_100g: 567, protein_per_100g: 26, carbs_per_100g: 16, fat_per_100g: 49 },
  { id: 'anacardos', name: 'Anacardos', category: 'grasa', calories_per_100g: 553, protein_per_100g: 18, carbs_per_100g: 30, fat_per_100g: 44 },
  { id: 'pistachos', name: 'Pistachos', category: 'grasa', calories_per_100g: 562, protein_per_100g: 20, carbs_per_100g: 28, fat_per_100g: 45 },
  { id: 'semillas-chia', name: 'Semillas de Chía', category: 'grasa', calories_per_100g: 486, protein_per_100g: 17, carbs_per_100g: 42, fat_per_100g: 31 },
  { id: 'semillas-lino', name: 'Semillas de Lino', category: 'grasa', calories_per_100g: 534, protein_per_100g: 18, carbs_per_100g: 29, fat_per_100g: 42 },
  { id: 'aceite-coco', name: 'Aceite de Coco', category: 'grasa', calories_per_100g: 862, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { id: 'tahini', name: 'Tahini', category: 'grasa', calories_per_100g: 595, protein_per_100g: 17, carbs_per_100g: 21, fat_per_100g: 54 },
  
  // VEGETALES
  { id: 'brocoli', name: 'Brócoli', category: 'vegetal', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
  { id: 'espinacas', name: 'Espinacas', category: 'vegetal', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
  { id: 'tomate', name: 'Tomate', category: 'vegetal', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
  { id: 'lechuga', name: 'Lechuga', category: 'vegetal', calories_per_100g: 15, protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2 },
  { id: 'zanahoria', name: 'Zanahoria', category: 'vegetal', calories_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2 },
  { id: 'pimiento', name: 'Pimiento', category: 'vegetal', calories_per_100g: 31, protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.3 },
  { id: 'cebolla', name: 'Cebolla', category: 'vegetal', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9, fat_per_100g: 0.1 },
  { id: 'calabacin', name: 'Calabacín', category: 'vegetal', calories_per_100g: 17, protein_per_100g: 1.2, carbs_per_100g: 3.1, fat_per_100g: 0.3 },
  { id: 'berenjena', name: 'Berenjena', category: 'vegetal', calories_per_100g: 25, protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.2 },
  { id: 'pepino', name: 'Pepino', category: 'vegetal', calories_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1 },
  { id: 'coliflor', name: 'Coliflor', category: 'vegetal', calories_per_100g: 25, protein_per_100g: 1.9, carbs_per_100g: 5, fat_per_100g: 0.3 },
  { id: 'judias-verdes', name: 'Judías Verdes', category: 'vegetal', calories_per_100g: 31, protein_per_100g: 1.8, carbs_per_100g: 7, fat_per_100g: 0.1 },
  { id: 'champiñones', name: 'Champiñones', category: 'vegetal', calories_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3 },
  { id: 'esparragos', name: 'Espárragos', category: 'vegetal', calories_per_100g: 20, protein_per_100g: 2.2, carbs_per_100g: 3.9, fat_per_100g: 0.1 },
  { id: 'rucula', name: 'Rúcula', category: 'vegetal', calories_per_100g: 25, protein_per_100g: 2.6, carbs_per_100g: 3.7, fat_per_100g: 0.7 },
  { id: 'kale', name: 'Kale', category: 'vegetal', calories_per_100g: 35, protein_per_100g: 3.3, carbs_per_100g: 6, fat_per_100g: 0.7 },
  { id: 'col', name: 'Col', category: 'vegetal', calories_per_100g: 25, protein_per_100g: 1.3, carbs_per_100g: 5.8, fat_per_100g: 0.1 },
  { id: 'apio', name: 'Apio', category: 'vegetal', calories_per_100g: 14, protein_per_100g: 0.7, carbs_per_100g: 3, fat_per_100g: 0.2 },
  { id: 'puerro', name: 'Puerro', category: 'vegetal', calories_per_100g: 61, protein_per_100g: 1.5, carbs_per_100g: 14, fat_per_100g: 0.3 },
  { id: 'tomate-frito-mercadona', name: 'Tomate Frito Mercadona', category: 'vegetal', calories_per_100g: 74, protein_per_100g: 1.3, carbs_per_100g: 7.8, fat_per_100g: 4 },
  { id: 'guisantes', name: 'Guisantes', category: 'vegetal', calories_per_100g: 81, protein_per_100g: 5.4, carbs_per_100g: 14, fat_per_100g: 0.4 },
  { id: 'calabaza', name: 'Calabaza', category: 'vegetal', calories_per_100g: 26, protein_per_100g: 1, carbs_per_100g: 6.5, fat_per_100g: 0.1 },
  
  // LÁCTEOS
  { id: 'leche-desnatada', name: 'Leche Desnatada', category: 'lacteo', calories_per_100g: 34, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 0.1 },
  { id: 'leche-entera', name: 'Leche Entera', category: 'lacteo', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3 },
  { id: 'leche-semidesnatada', name: 'Leche Semidesnatada', category: 'lacteo', calories_per_100g: 46, protein_per_100g: 3.3, carbs_per_100g: 4.8, fat_per_100g: 1.6 },
  { id: 'yogur-griego', name: 'Yogur Griego Natural', category: 'lacteo', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
  { id: 'yogur-natural', name: 'Yogur Natural', category: 'lacteo', calories_per_100g: 61, protein_per_100g: 3.5, carbs_per_100g: 4.7, fat_per_100g: 3.3 },
  { id: 'queso-fresco', name: 'Queso Fresco Batido 0%', category: 'lacteo', calories_per_100g: 72, protein_per_100g: 13, carbs_per_100g: 4, fat_per_100g: 0.2 },
  { id: 'queso-mozzarella', name: 'Queso Mozzarella Light', category: 'lacteo', calories_per_100g: 254, protein_per_100g: 24, carbs_per_100g: 3, fat_per_100g: 16 },
  { id: 'queso-cottage', name: 'Queso Cottage', category: 'lacteo', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.4, fat_per_100g: 4.3 },
  { id: 'requesón', name: 'Requesón', category: 'lacteo', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.4, fat_per_100g: 4.3 },
  { id: 'kefir', name: 'Kéfir', category: 'lacteo', calories_per_100g: 41, protein_per_100g: 3.4, carbs_per_100g: 4.5, fat_per_100g: 1 },
  { id: 'skyr', name: 'Skyr', category: 'lacteo', calories_per_100g: 63, protein_per_100g: 11, carbs_per_100g: 4, fat_per_100g: 0.2 },
  { id: 'nata-cocina', name: 'Nata para Cocinar', category: 'lacteo', calories_per_100g: 195, protein_per_100g: 2.1, carbs_per_100g: 4, fat_per_100g: 19 },
  { id: 'queso-parmesano', name: 'Queso Parmesano', category: 'lacteo', calories_per_100g: 431, protein_per_100g: 38, carbs_per_100g: 4.1, fat_per_100g: 29 },
  { id: 'queso-cheddar', name: 'Queso Cheddar', category: 'lacteo', calories_per_100g: 403, protein_per_100g: 25, carbs_per_100g: 1.3, fat_per_100g: 33 },
  { id: 'leche-avena', name: 'Leche de Avena', category: 'lacteo', calories_per_100g: 47, protein_per_100g: 1, carbs_per_100g: 6.5, fat_per_100g: 1.5 },
  { id: 'leche-almendras', name: 'Leche de Almendras', category: 'lacteo', calories_per_100g: 17, protein_per_100g: 0.5, carbs_per_100g: 0.5, fat_per_100g: 1.4 },
  { id: 'leche-soja', name: 'Leche de Soja', category: 'lacteo', calories_per_100g: 33, protein_per_100g: 3, carbs_per_100g: 1, fat_per_100g: 1.8 },
  
  // FRUTAS
  { id: 'platano', name: 'Plátano', category: 'fruta', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
  { id: 'manzana', name: 'Manzana', category: 'fruta', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
  { id: 'fresas', name: 'Fresas', category: 'fruta', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 8, fat_per_100g: 0.3 },
  { id: 'arandanos', name: 'Arándanos', category: 'fruta', calories_per_100g: 57, protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3 },
  { id: 'naranja', name: 'Naranja', category: 'fruta', calories_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1 },
  { id: 'kiwi', name: 'Kiwi', category: 'fruta', calories_per_100g: 61, protein_per_100g: 1.1, carbs_per_100g: 15, fat_per_100g: 0.5 },
  { id: 'pera', name: 'Pera', category: 'fruta', calories_per_100g: 57, protein_per_100g: 0.4, carbs_per_100g: 15, fat_per_100g: 0.1 },
  { id: 'melocoton', name: 'Melocotón', category: 'fruta', calories_per_100g: 39, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.3 },
  { id: 'piña', name: 'Piña', category: 'fruta', calories_per_100g: 50, protein_per_100g: 0.5, carbs_per_100g: 13, fat_per_100g: 0.1 },
  { id: 'mango', name: 'Mango', category: 'fruta', calories_per_100g: 60, protein_per_100g: 0.8, carbs_per_100g: 15, fat_per_100g: 0.4 },
  { id: 'uvas', name: 'Uvas', category: 'fruta', calories_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18, fat_per_100g: 0.2 },
  { id: 'sandia', name: 'Sandía', category: 'fruta', calories_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 8, fat_per_100g: 0.2 },
  { id: 'melon', name: 'Melón', category: 'fruta', calories_per_100g: 34, protein_per_100g: 0.8, carbs_per_100g: 8, fat_per_100g: 0.2 },
  { id: 'frambuesas', name: 'Frambuesas', category: 'fruta', calories_per_100g: 52, protein_per_100g: 1.2, carbs_per_100g: 12, fat_per_100g: 0.7 },
  { id: 'granada', name: 'Granada', category: 'fruta', calories_per_100g: 83, protein_per_100g: 1.7, carbs_per_100g: 19, fat_per_100g: 1.2 },
  { id: 'cerezas', name: 'Cerezas', category: 'fruta', calories_per_100g: 63, protein_per_100g: 1, carbs_per_100g: 16, fat_per_100g: 0.2 },
  { id: 'datiles', name: 'Dátiles', category: 'fruta', calories_per_100g: 282, protein_per_100g: 2.5, carbs_per_100g: 75, fat_per_100g: 0.4 },
  { id: 'pasas', name: 'Pasas', category: 'fruta', calories_per_100g: 299, protein_per_100g: 3.1, carbs_per_100g: 79, fat_per_100g: 0.5 },
  
  // CONDIMENTOS
  { id: 'sal', name: 'Sal', category: 'condimento', calories_per_100g: 0, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 0 },
  { id: 'pimienta', name: 'Pimienta', category: 'condimento', calories_per_100g: 251, protein_per_100g: 10, carbs_per_100g: 64, fat_per_100g: 3.3 },
  { id: 'ajo', name: 'Ajo', category: 'condimento', calories_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33, fat_per_100g: 0.5 },
  { id: 'oregano', name: 'Orégano', category: 'condimento', calories_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 69, fat_per_100g: 4 },
  { id: 'comino', name: 'Comino', category: 'condimento', calories_per_100g: 375, protein_per_100g: 18, carbs_per_100g: 44, fat_per_100g: 22 },
  { id: 'pimenton', name: 'Pimentón', category: 'condimento', calories_per_100g: 282, protein_per_100g: 14, carbs_per_100g: 54, fat_per_100g: 13 },
  { id: 'curry', name: 'Curry', category: 'condimento', calories_per_100g: 325, protein_per_100g: 14, carbs_per_100g: 56, fat_per_100g: 14 },
  { id: 'jengibre', name: 'Jengibre', category: 'condimento', calories_per_100g: 80, protein_per_100g: 1.8, carbs_per_100g: 18, fat_per_100g: 0.8 },
  { id: 'canela', name: 'Canela', category: 'condimento', calories_per_100g: 247, protein_per_100g: 4, carbs_per_100g: 81, fat_per_100g: 1.2 },
  { id: 'miel', name: 'Miel', category: 'condimento', calories_per_100g: 304, protein_per_100g: 0.3, carbs_per_100g: 82, fat_per_100g: 0 },
  { id: 'vinagre', name: 'Vinagre', category: 'condimento', calories_per_100g: 21, protein_per_100g: 0, carbs_per_100g: 0.9, fat_per_100g: 0 },
  { id: 'mostaza', name: 'Mostaza', category: 'condimento', calories_per_100g: 66, protein_per_100g: 4, carbs_per_100g: 6, fat_per_100g: 4 },
  { id: 'salsa-soja', name: 'Salsa de Soja', category: 'condimento', calories_per_100g: 53, protein_per_100g: 8, carbs_per_100g: 5, fat_per_100g: 0 },
  { id: 'limón', name: 'Limón (Zumo)', category: 'condimento', calories_per_100g: 29, protein_per_100g: 1.1, carbs_per_100g: 9, fat_per_100g: 0.3 },
];

// URL del API
const API_URL = 'https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dnNicGdxZnViYnFtcXF4bXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NDA3MjYsImV4cCI6MjA2MDIxNjcyNn0.LzGqEZLkxZYhOqMWFWdpkKdvGdKaWwfcBqJvzruKhBs';

async function syncIngredients() {
  console.log(`🚀 Sincronizando ${INGREDIENTS_WITH_MACROS.length} ingredientes con Supabase...`);
  
  try {
    const response = await fetch(`${API_URL}/global-ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ ingredients: INGREDIENTS_WITH_MACROS })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Ingredientes sincronizados correctamente:', result);
    console.log(`📊 Total: ${INGREDIENTS_WITH_MACROS.length} ingredientes con macros reales`);
  } catch (error) {
    console.error('❌ Error sincronizando ingredientes:', error);
  }
}

syncIngredients();
