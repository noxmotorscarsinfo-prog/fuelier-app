import { Ingredient } from '../types';

// Base de datos de ingredientes comunes (valores nutricionales por 100g)
export const baseIngredients: Ingredient[] = [
  // PROTEÍNAS - Carnes
  { id: 'ing_1', name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'ing_2', name: 'Pechuga de Pavo', calories: 135, protein: 30, carbs: 0, fat: 1 },
  { id: 'ing_3', name: 'Ternera Magra', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: 'ing_4', name: 'Lomo de Cerdo', calories: 242, protein: 27, carbs: 0, fat: 14 },
  { id: 'ing_5', name: 'Jamón Serrano', calories: 163, protein: 30, carbs: 0, fat: 5 },
  { id: 'ing_6', name: 'Jamón de York', calories: 145, protein: 21, carbs: 1, fat: 6 },

  // PROTEÍNAS - Pescados
  { id: 'ing_7', name: 'Salmón Fresco', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'ing_8', name: 'Atún Natural', calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  { id: 'ing_9', name: 'Merluza', calories: 90, protein: 17, carbs: 0, fat: 2 },
  { id: 'ing_10', name: 'Bacalao', calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { id: 'ing_11', name: 'Lubina', calories: 97, protein: 18, carbs: 0, fat: 2.5 },
  { id: 'ing_12', name: 'Dorada', calories: 96, protein: 19, carbs: 0, fat: 2 },
  { id: 'ing_13', name: 'Sardinas', calories: 208, protein: 25, carbs: 0, fat: 11 },
  { id: 'ing_14', name: 'Gambas', calories: 99, protein: 21, carbs: 1, fat: 1 },

  // PROTEÍNAS - Huevos y Lácteos
  { id: 'ing_15', name: 'Huevo Entero', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 'ing_16', name: 'Clara de Huevo', calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { id: 'ing_17', name: 'Yogurt Griego 0%', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { id: 'ing_18', name: 'Yogurt Natural', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { id: 'ing_19', name: 'Queso Fresco', calories: 264, protein: 20, carbs: 3, fat: 19 },
  { id: 'ing_20', name: 'Queso Cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: 'ing_21', name: 'Leche Desnatada', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { id: 'ing_22', name: 'Leche Entera', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },

  // PROTEÍNAS - Legumbres
  { id: 'ing_23', name: 'Lentejas Cocidas', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 'ing_24', name: 'Garbanzos Cocidos', calories: 164, protein: 9, carbs: 27, fat: 2.6 },
  { id: 'ing_25', name: 'Alubias Cocidas', calories: 127, protein: 9, carbs: 23, fat: 0.5 },
  { id: 'ing_26', name: 'Tofu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },

  // CARBOHIDRATOS - Cereales
  { id: 'ing_27', name: 'Arroz Blanco Crudo', calories: 365, protein: 7, carbs: 80, fat: 0.9 },
  { id: 'ing_28', name: 'Arroz Integral Crudo', calories: 370, protein: 7.9, carbs: 77, fat: 2.9 },
  { id: 'ing_29', name: 'Pasta Blanca Seca', calories: 371, protein: 13, carbs: 75, fat: 1.5 },
  { id: 'ing_30', name: 'Pasta Integral Seca', calories: 348, protein: 14, carbs: 72, fat: 2.5 },
  { id: 'ing_31', name: 'Quinoa Cruda', calories: 368, protein: 14, carbs: 64, fat: 6 },
  { id: 'ing_32', name: 'Avena', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { id: 'ing_33', name: 'Pan Integral', calories: 247, protein: 9, carbs: 49, fat: 3.4 },
  { id: 'ing_34', name: 'Pan Blanco', calories: 265, protein: 9, carbs: 49, fat: 3.2 },

  // CARBOHIDRATOS - Tubérculos
  { id: 'ing_35', name: 'Patata', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 'ing_36', name: 'Boniato/Batata', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },

  // FRUTAS
  { id: 'ing_37', name: 'Plátano', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: 'ing_38', name: 'Manzana', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'ing_39', name: 'Fresas', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'ing_40', name: 'Arándanos', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: 'ing_41', name: 'Naranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { id: 'ing_42', name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5 },
  { id: 'ing_43', name: 'Aguacate', calories: 160, protein: 2, carbs: 8.5, fat: 15 },

  // VERDURAS
  { id: 'ing_44', name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: 'ing_45', name: 'Espinacas', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'ing_46', name: 'Lechuga', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { id: 'ing_47', name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 'ing_48', name: 'Pepino', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 'ing_49', name: 'Pimiento', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
  { id: 'ing_50', name: 'Zanahoria', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: 'ing_51', name: 'Calabacín', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: 'ing_52', name: 'Champiñones', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { id: 'ing_53', name: 'Espárragos', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },

  // GRASAS SALUDABLES
  { id: 'ing_54', name: 'Aceite de Oliva', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'ing_55', name: 'Almendras', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'ing_56', name: 'Nueces', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 'ing_57', name: 'Cacahuetes', calories: 567, protein: 26, carbs: 16, fat: 49 },
  { id: 'ing_58', name: 'Crema de Cacahuete', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'ing_59', name: 'Mantequilla de Almendra', calories: 614, protein: 21, carbs: 19, fat: 56 },
  { id: 'ing_60', name: 'Semillas de Chía', calories: 486, protein: 17, carbs: 42, fat: 31 },

  // OTROS
  { id: 'ing_61', name: 'Proteína Whey', calories: 400, protein: 83, carbs: 7, fat: 4 },
  { id: 'ing_62', name: 'Miel', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
];

// ========== INGREDIENTES PERSONALIZADOS ==========
// ⚠️ MIGRADO A SUPABASE - Ya no usar localStorage
// Los ingredientes personalizados ahora se guardan en Supabase vía API:
// - api.getCustomIngredients(email)
// - api.saveCustomIngredients(email, ingredients)

// Función para obtener todos los ingredientes (base + personalizados desde Supabase)
export const getIngredients = (customIngredients: Ingredient[] = []): Ingredient[] => {
  return [...baseIngredients, ...customIngredients];
};

// Función para obtener ingrediente por ID
export const getIngredientById = (id: string, customIngredients: Ingredient[] = []): Ingredient | undefined => {
  return getIngredients(customIngredients).find(ing => ing.id === id);
};

// Función para obtener ingredientes base del sistema (sin personalizados)
export const getBaseIngredients = (): Ingredient[] => {
  return baseIngredients;
};