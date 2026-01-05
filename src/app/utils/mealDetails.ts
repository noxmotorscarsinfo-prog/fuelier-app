import { Meal, MealType } from '../types';

export interface DetailedIngredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PreparationStep {
  step: number;
  instruction: string;
  time?: string;
  tip?: string;
}

export interface CookingTip {
  title: string;
  description: string;
  icon: string;
}

export interface MealVariation {
  id: string;
  name: string;
  description: string;
  caloriesDiff: number;
  proteinDiff: number;
  tag: string;
}

/**
 * Base de datos de preparaciones específicas por plato
 */
const specificPreparations: Record<string, PreparationStep[]> = {
  // DESAYUNOS
  'Huevos Revueltos con Tostada': [
    { step: 1, instruction: 'Bate 3 huevos en un bol con una pizca de sal y pimienta', time: '1 min' },
    { step: 2, instruction: 'Tuesta 2 rebanadas de pan integral', time: '3 min' },
    { step: 3, instruction: 'Calienta una sartén antiadherente con un poco de aceite', time: '1 min', tip: 'Fuego medio para que no se sequen' },
    { step: 4, instruction: 'Añade los huevos y remueve suavemente con espátula hasta que cuajen', time: '3-4 min' },
    { step: 5, instruction: 'Sirve los huevos sobre las tostadas inmediatamente', time: '1 min' }
  ],
  'Avena con Plátano y Canela': [
    { step: 1, instruction: 'Calienta 200ml de leche desnatada en una olla', time: '2 min' },
    { step: 2, instruction: 'Añade 60g de copos de avena y remueve', time: '1 min' },
    { step: 3, instruction: 'Cocina a fuego medio removiendo ocasionalmente', time: '5 min', tip: 'Hasta que espese y esté cremosa' },
    { step: 4, instruction: 'Corta el plátano en rodajas', time: '1 min' },
    { step: 5, instruction: 'Sirve la avena en un bol, añade el plátano y espolvorea canela', time: '1 min' }
  ],
  'Tostadas con Aguacate y Huevo': [
    { step: 1, instruction: 'Tuesta 2 rebanadas de pan integral hasta que estén doradas', time: '3 min' },
    { step: 2, instruction: 'Hierve agua y prepara un huevo poché (3-4 min en agua hirviendo)', time: '5 min', tip: 'Añade una gota de vinagre al agua' },
    { step: 3, instruction: 'Machaca medio aguacate con un tenedor y sazona con sal y limón', time: '2 min' },
    { step: 4, instruction: 'Unta el aguacate sobre las tostadas', time: '1 min' },
    { step: 5, instruction: 'Coloca el huevo poché encima y añade pimienta', time: '1 min' }
  ],
  'Yogurt Griego con Frutos Rojos': [
    { step: 1, instruction: 'Sirve 200g de yogurt griego 0% en un bol', time: '30 seg' },
    { step: 2, instruction: 'Lava 100g de frutos rojos frescos', time: '1 min' },
    { step: 3, instruction: 'Coloca los frutos rojos sobre el yogurt', time: '30 seg' },
    { step: 4, instruction: 'Añade 20g de miel en hilo por encima', time: '30 seg', tip: 'Opcional: añade granola para textura crujiente' }
  ],
  'Tortilla Francesa de 3 Huevos': [
    { step: 1, instruction: 'Bate 3 huevos con sal en un bol', time: '1 min' },
    { step: 2, instruction: 'Calienta aceite de oliva en una sartén antiadherente', time: '1 min' },
    { step: 3, instruction: 'Vierte los huevos batidos en la sartén caliente', time: '30 seg' },
    { step: 4, instruction: 'Cocina a fuego medio-bajo, doblando los bordes hacia el centro', time: '3 min', tip: 'No la cuajes demasiado, debe quedar ligeramente cremosa' },
    { step: 5, instruction: 'Dobla la tortilla por la mitad y sirve inmediatamente', time: '1 min' }
  ],
  'Pancakes de Avena Proteicos': [
    { step: 1, instruction: 'Mezcla 2 huevos, 60g de avena y 1 scoop de proteína', time: '2 min' },
    { step: 2, instruction: 'Añade un chorrito de leche hasta conseguir consistencia de masa', time: '1 min' },
    { step: 3, instruction: 'Calienta una sartén antiadherente a fuego medio', time: '2 min' },
    { step: 4, instruction: 'Vierte porciones de masa y cocina 2-3 min por lado', time: '10 min', tip: 'Espera a ver burbujas antes de voltear' },
    { step: 5, instruction: 'Sirve con sirope sin azúcar', time: '1 min' }
  ],
  'Smoothie Verde Detox': [
    { step: 1, instruction: 'Pela y corta 1 plátano y 1 kiwi', time: '2 min' },
    { step: 2, instruction: 'Lava bien 100g de espinacas frescas', time: '1 min' },
    { step: 3, instruction: 'Añade todos los ingredientes a la batidora con 200ml de leche de almendras', time: '1 min' },
    { step: 4, instruction: 'Bate a máxima potencia hasta textura suave', time: '2 min', tip: 'Añade hielo si lo quieres más frío' },
    { step: 5, instruction: 'Sirve inmediatamente y disfruta', time: '30 seg' }
  ],
  'Bowl de Açaí con Granola': [
    { step: 1, instruction: 'Bate 200g de açaí congelado con un poco de agua o leche', time: '2 min' },
    { step: 2, instruction: 'Sirve en un bol', time: '30 seg' },
    { step: 3, instruction: 'Decora con 50g de granola', time: '30 seg' },
    { step: 4, instruction: 'Añade rodajas de plátano y un hilo de miel', time: '1 min', tip: 'Consume inmediatamente para que no se derrita' }
  ],
  'Tostada con Crema de Cacahuete': [
    { step: 1, instruction: 'Tuesta 2 rebanadas de pan integral', time: '3 min' },
    { step: 2, instruction: 'Unta 30g de crema de cacahuete natural', time: '1 min' },
    { step: 3, instruction: 'Corta medio plátano en rodajas', time: '1 min' },
    { step: 4, instruction: 'Coloca las rodajas sobre la crema de cacahuete', time: '30 seg', tip: 'Espolvorea canela para más sabor' }
  ],
  'Revuelto de Claras con Espinacas': [
    { step: 1, instruction: 'Separa 6 claras de huevo y bátelas con sal', time: '2 min' },
    { step: 2, instruction: 'Lava y pica 100g de espinacas frescas', time: '2 min' },
    { step: 3, instruction: 'Lamina 50g de champiñones', time: '2 min' },
    { step: 4, instruction: 'Saltea espinacas y champiñones en una sartén', time: '3 min', tip: 'Hasta que las espinacas se reduzcan' },
    { step: 5, instruction: 'Añade las claras y remueve hasta cuajar', time: '3 min' }
  ],
  
  // COMIDAS
  'Pechuga de Pollo a la Plancha con Arroz': [
    { step: 1, instruction: 'Lava y cuece 80g de arroz blanco según instrucciones del paquete', time: '15 min' },
    { step: 2, instruction: 'Sazona la pechuga (150g) con sal, pimienta y especias al gusto', time: '2 min' },
    { step: 3, instruction: 'Calienta una plancha o sartén con un chorrito de aceite', time: '2 min' },
    { step: 4, instruction: 'Cocina la pechuga 6-7 min por cada lado hasta dorar', time: '14 min', tip: 'No la muevas constantemente para que selle bien' },
    { step: 5, instruction: 'Deja reposar 3 min antes de cortar', time: '3 min' },
    { step: 6, instruction: 'Sirve con el arroz y ensalada fresca', time: '2 min' }
  ],
  'Salmón al Horno con Brócoli': [
    { step: 1, instruction: 'Precalienta el horno a 180°C', time: '10 min' },
    { step: 2, instruction: 'Lava y corta 200g de brócoli en floretes', time: '3 min' },
    { step: 3, instruction: 'Coloca el salmón (140g) y el brócoli en una bandeja con papel', time: '2 min' },
    { step: 4, instruction: 'Rocía con aceite de oliva, sal, pimienta y un chorrito de limón', time: '1 min', tip: 'El limón realza el sabor del pescado' },
    { step: 5, instruction: 'Hornea durante 15-18 minutos hasta que el salmón esté cocido', time: '18 min' },
    { step: 6, instruction: 'Sirve caliente con una rodaja de limón adicional', time: '1 min' }
  ],
  'Pasta Integral con Pollo y Verduras': [
    { step: 1, instruction: 'Pon a hervir agua con sal para la pasta', time: '5 min' },
    { step: 2, instruction: 'Cuece 80g de pasta integral según indicaciones', time: '10 min' },
    { step: 3, instruction: 'Corta 120g de pechuga de pollo en tiras', time: '3 min' },
    { step: 4, instruction: 'Saltea el pollo con verduras (pimiento, cebolla, calabacín)', time: '8 min', tip: 'Añade ajo y especias para más sabor' },
    { step: 5, instruction: 'Escurre la pasta y mézclala con el salteado', time: '2 min' },
    { step: 6, instruction: 'Opcional: añade un toque de queso parmesano', time: '1 min' }
  ],
  'Ensalada César con Pollo': [
    { step: 1, instruction: 'Cocina 150g de pechuga de pollo a la plancha y córtala en tiras', time: '12 min' },
    { step: 2, instruction: 'Lava y corta la lechuga romana en trozos', time: '3 min' },
    { step: 3, instruction: 'Prepara la salsa césar mezclando yogurt, mostaza, ajo y anchoas', time: '3 min', tip: 'Usa yogurt griego para hacerla más saludable' },
    { step: 4, instruction: 'En un bol grande, mezcla la lechuga con el pollo', time: '2 min' },
    { step: 5, instruction: 'Añade la salsa, parmesano rallado y croutones', time: '2 min' },
    { step: 6, instruction: 'Mezcla bien y sirve inmediatamente', time: '1 min' }
  ],
  'Ternera Salteada con Quinoa': [
    { step: 1, instruction: 'Enjuaga 80g de quinoa y cuécela en doble de agua', time: '15 min' },
    { step: 2, instruction: 'Corta 140g de ternera en tiras finas', time: '3 min' },
    { step: 3, instruction: 'Calienta un wok o sartén grande a fuego alto', time: '2 min' },
    { step: 4, instruction: 'Saltea la ternera con verduras variadas', time: '7 min', tip: 'Mantén el fuego alto para sellar la carne' },
    { step: 5, instruction: 'Sazona con salsa de soja y especias', time: '1 min' },
    { step: 6, instruction: 'Sirve sobre la quinoa cocida', time: '2 min' }
  ],
  'Lentejas Guisadas con Verduras': [
    { step: 1, instruction: 'Remoja 200g de lentejas durante 2 horas (opcional)', time: '2h' },
    { step: 2, instruction: 'Pica zanahoria, cebolla y tomate', time: '5 min' },
    { step: 3, instruction: 'Sofríe las verduras en una olla con aceite', time: '5 min' },
    { step: 4, instruction: 'Añade las lentejas y cubre con agua', time: '2 min', tip: 'Añade una hoja de laurel' },
    { step: 5, instruction: 'Cuece a fuego medio durante 30-40 min', time: '40 min' },
    { step: 6, instruction: 'Rectifica de sal y sirve caliente', time: '2 min' }
  ],
  'Atún a la Plancha con Patata Cocida': [
    { step: 1, instruction: 'Lava y cuece 200g de patata en agua con sal', time: '20 min' },
    { step: 2, instruction: 'Seca bien el atún (150g) y sazona', time: '2 min' },
    { step: 3, instruction: 'Calienta una plancha a fuego muy alto', time: '3 min' },
    { step: 4, instruction: 'Sella el atún 1-2 min por lado', time: '4 min', tip: 'El centro debe quedar rosado' },
    { step: 5, instruction: 'Corta en rodajas y sirve con patata y verduras', time: '3 min' }
  ],
  'Pollo al Curry con Arroz Basmati': [
    { step: 1, instruction: 'Cuece 80g de arroz basmati según instrucciones', time: '15 min' },
    { step: 2, instruction: 'Corta 150g de pechuga de pollo en cubos', time: '3 min' },
    { step: 3, instruction: 'Sofríe cebolla y ajo picados', time: '3 min' },
    { step: 4, instruction: 'Añade el pollo y dora', time: '5 min' },
    { step: 5, instruction: 'Incorpora curry en polvo y leche de coco', time: '2 min', tip: 'Ajusta la cantidad de curry a tu gusto' },
    { step: 6, instruction: 'Cocina a fuego medio 10 min y sirve sobre arroz', time: '10 min' }
  ],
  
  // MERIENDAS
  'Manzana con Crema de Almendras': [
    { step: 1, instruction: 'Lava y corta 1 manzana en rodajas o gajos', time: '2 min' },
    { step: 2, instruction: 'Sirve con 20g de crema de almendras natural', time: '1 min', tip: 'Elige crema 100% almendras sin azúcar añadido' },
    { step: 3, instruction: 'Moja cada trozo de manzana en la crema antes de comer', time: '1 min' }
  ],
  'Batido de Proteína Chocolate': [
    { step: 1, instruction: 'Añade 1 scoop de proteína de chocolate a un shaker', time: '30 seg' },
    { step: 2, instruction: 'Agrega 250-300ml de agua fría o leche desnatada', time: '30 seg', tip: 'Con leche queda más cremoso' },
    { step: 3, instruction: 'Cierra bien y agita vigorosamente durante 20-30 segundos', time: '30 seg' },
    { step: 4, instruction: 'Sirve inmediatamente para mejor textura', time: '10 seg' }
  ],
  'Yogurt con Nueces': [
    { step: 1, instruction: 'Sirve 200g de yogurt natural o griego en un bol', time: '30 seg' },
    { step: 2, instruction: 'Trocea 20g de nueces', time: '1 min' },
    { step: 3, instruction: 'Espolvorea las nueces sobre el yogurt', time: '30 seg', tip: 'Opcional: añade un toque de miel o canela' }
  ],
  'Plátano con Mantequilla de Cacahuete': [
    { step: 1, instruction: 'Pela 1 plátano maduro', time: '30 seg' },
    { step: 2, instruction: 'Corta en rodajas o por la mitad a lo largo', time: '1 min' },
    { step: 3, instruction: 'Unta o sirve con 20g de mantequilla de cacahuete', time: '1 min', tip: 'Espolvorea canela o semillas de chía' }
  ],
  'Tortitas de Arroz con Aguacate': [
    { step: 1, instruction: 'Prepara 60g de aguacate machacado con sal y limón', time: '2 min' },
    { step: 2, instruction: 'Unta el aguacate sobre 3 tortitas de arroz', time: '1 min' },
    { step: 3, instruction: 'Opcional: añade tomates cherry cortados', time: '1 min', tip: 'Añade pimienta negra molida' }
  ],
  'Hummus con Palitos de Zanahoria': [
    { step: 1, instruction: 'Lava y pela 150g de zanahorias', time: '3 min' },
    { step: 2, instruction: 'Corta en palitos largos y finos', time: '3 min' },
    { step: 3, instruction: 'Sirve con 60g de hummus en un bol', time: '30 seg', tip: 'Puedes usar también apio o pepino' }
  ],

  // CENAS
  'Pechuga de Pavo a la Plancha con Ensalada': [
    { step: 1, instruction: 'Sazona 150g de pechuga de pavo con sal, pimienta y hierbas', time: '2 min' },
    { step: 2, instruction: 'Calienta una plancha a fuego medio-alto', time: '2 min' },
    { step: 3, instruction: 'Cocina el pavo 5-6 min por cada lado hasta que esté bien hecho', time: '12 min', tip: 'El pavo debe alcanzar 74°C internamente' },
    { step: 4, instruction: 'Mientras, prepara una ensalada mixta con lechuga, tomate y pepino', time: '5 min' },
    { step: 5, instruction: 'Aliña la ensalada con aceite de oliva y vinagre', time: '1 min' },
    { step: 6, instruction: 'Sirve el pavo fileteado sobre la ensalada', time: '2 min' }
  ],
  'Merluza al Vapor con Verduras': [
    { step: 1, instruction: 'Prepara 160g de merluza limpia y sazonada', time: '2 min' },
    { step: 2, instruction: 'Corta verduras (brócoli, zanahoria, judías) en trozos pequeños', time: '5 min' },
    { step: 3, instruction: 'Coloca agua en una vaporera y lleva a ebullición', time: '5 min' },
    { step: 4, instruction: 'Cocina las verduras al vapor durante 8 minutos', time: '8 min', tip: 'Deben quedar al dente' },
    { step: 5, instruction: 'Añade la merluza y cocina 6-8 min más hasta que esté opaca', time: '8 min' },
    { step: 6, instruction: 'Sirve con un chorrito de limón y aceite de oliva', time: '2 min' }
  ],
  'Tortilla de Espinacas': [
    { step: 1, instruction: 'Lava y escurre bien 150g de espinacas frescas', time: '2 min' },
    { step: 2, instruction: 'Saltea las espinacas en una sartén hasta que reduzcan', time: '3 min' },
    { step: 3, instruction: 'Bate 3 huevos con sal y pimienta', time: '1 min' },
    { step: 4, instruction: 'Añade las espinacas a los huevos batidos y mezcla', time: '1 min', tip: 'Asegúrate de que estén bien distribuidas' },
    { step: 5, instruction: 'Vierte la mezcla en la sartén con aceite caliente', time: '1 min' },
    { step: 6, instruction: 'Cocina a fuego medio 3-4 min, voltea y cocina 2-3 min más', time: '6 min' }
  ],
  'Pescado Blanco al Limón': [
    { step: 1, instruction: 'Sazona 160g de pescado blanco con sal y pimienta', time: '2 min' },
    { step: 2, instruction: 'Coloca en una sartén con aceite de oliva', time: '1 min' },
    { step: 3, instruction: 'Cocina 3-4 min por lado a fuego medio', time: '8 min', tip: 'No lo muevas demasiado' },
    { step: 4, instruction: 'Añade zumo de limón fresco al final', time: '1 min' },
    { step: 5, instruction: 'Sirve con patata cocida y verduras', time: '2 min' }
  ],
  'Revuelto de Champiñones y Espinacas': [
    { step: 1, instruction: 'Limpia y lamina 150g de champiñones', time: '3 min' },
    { step: 2, instruction: 'Lava y pica 100g de espinacas', time: '2 min' },
    { step: 3, instruction: 'Saltea los champiñones hasta dorar', time: '5 min' },
    { step: 4, instruction: 'Añade las espinacas y cocina hasta que reduzcan', time: '2 min', tip: 'Añade un poco de ajo picado' },
    { step: 5, instruction: 'Bate 3 huevos y viértelos en la sartén', time: '1 min' },
    { step: 6, instruction: 'Remueve suavemente hasta cuajar', time: '3 min' }
  ],
};

/**
 * Consejos específicos por tipo de plato
 */
const specificTips: Record<string, CookingTip[]> = {
  'Pechuga de Pollo a la Plancha con Arroz': [
    { title: 'Temperatura Perfecta', description: 'El pollo debe alcanzar 74°C en su interior para estar completamente cocido y jugoso.', icon: '🌡️' },
    { title: 'Sella el Exterior', description: 'No muevas el pollo constantemente. Déjalo 6-7 min por lado para que se forme una costra dorada.', icon: '🔥' },
    { title: 'Reposo Importante', description: 'Dejar reposar 3 min antes de cortar permite que los jugos se redistribuyan.', icon: '⏱️' }
  ],
  'Salmón al Horno con Brócoli': [
    { title: 'Rico en Omega-3', description: 'El salmón es una excelente fuente de grasas saludables para el corazón.', icon: '❤️' },
    { title: 'No te Pases', description: 'El salmón se seca fácilmente. 15-18 min a 180°C es suficiente.', icon: '⏲️' },
    { title: 'El Limón es Clave', description: 'Un chorrito de limón antes y después de hornear realza todo el sabor.', icon: '🍋' }
  ],
  'Avena con Plátano y Canela': [
    { title: 'Energía de Liberación Lenta', description: 'La avena proporciona energía sostenida durante toda la mañana.', icon: '⚡' },
    { title: 'Textura Perfecta', description: 'Si queda muy espesa, añade un poco más de leche. Si está muy líquida, cocina 1-2 min más.', icon: '🥣' },
    { title: 'Personalízala', description: 'Prueba con diferentes frutas de temporada o un toque de miel.', icon: '🍯' }
  ],
  'Tortilla de Espinacas': [
    { title: 'Espinacas Bien Escurridas', description: 'Escurre muy bien las espinacas para que la tortilla no quede aguada.', icon: '💧' },
    { title: 'Fuego Medio', description: 'Un fuego demasiado alto quemará el exterior antes de que cuaje el interior.', icon: '🔥' },
    { title: 'Rica en Hierro', description: 'Las espinacas aportan hierro y vitaminas mientras mantienes las calorías bajas.', icon: '💪' }
  ],
};

/**
 * Genera ingredientes detallados basándose en la receta del plato
 * MEJORADO: Ahora estima cantidades realistas en gramos
 */
export const generateDetailedIngredients = (meal: Meal): DetailedIngredient[] => {
  // Si el plato ya tiene ingredientes, parsearlos e intentar extraer gramos
  if (meal.ingredients && meal.ingredients.length > 0) {
    return meal.ingredients.map((ing, index) => {
      // Intentar extraer cantidad en gramos del string
      const gramMatch = ing.match(/(\d+)\s*g/i);
      const hasGrams = gramMatch !== null;
      
      if (hasGrams) {
        // El ingrediente YA tiene gramos especificados
        const grams = parseInt(gramMatch[1]);
        const name = ing.replace(/\d+\s*g\s*/i, '').trim();
        
        // Estimar macros basándose en los gramos y el tipo de ingrediente
        const { calories, protein, carbs, fat } = estimateMacrosFromIngredient(name, grams);
        
        return {
          name,
          amount: `${grams}g`,
          calories,
          protein,
          carbs,
          fat
        };
      } else {
        // No tiene gramos → distribuir macros proporcionalmente
        const ingredientCount = meal.ingredients!.length;
        const proportion = 1 / ingredientCount;
        
        // Estimar gramos basándose en el nombre del ingrediente
        const estimatedGrams = estimateGramsFromIngredientName(ing);
        
        return {
          name: ing,
          amount: `${estimatedGrams}g`,
          calories: Math.round(meal.calories * proportion),
          protein: Math.round(meal.protein * proportion),
          carbs: Math.round(meal.carbs * proportion),
          fat: Math.round(meal.fat * proportion)
        };
      }
    });
  }

  // Fallback: generar ingredientes realistas basados en el nombre del plato
  return generateIngredientsFromMealName(meal);
};

/**
 * NUEVO: Estima cantidades en gramos basándose en el nombre del ingrediente
 */
function estimateGramsFromIngredientName(ingredientName: string): number {
  const name = ingredientName.toLowerCase();
  
  // Proteínas principales
  if (name.includes('pollo') || name.includes('pechuga')) return 150;
  if (name.includes('salmón') || name.includes('atún') || name.includes('pescado')) return 140;
  if (name.includes('ternera') || name.includes('carne') || name.includes('res')) return 140;
  if (name.includes('pavo')) return 150;
  if (name.includes('huevo')) return 150; // ~3 huevos
  
  // Carbohidratos
  if (name.includes('arroz')) return 80;
  if (name.includes('pasta')) return 80;
  if (name.includes('quinoa')) return 80;
  if (name.includes('avena')) return 60;
  if (name.includes('pan') || name.includes('tostada')) return 60;
  if (name.includes('patata')) return 200;
  if (name.includes('boniato')) return 150;
  
  // Verduras
  if (name.includes('brócoli') || name.includes('brócoli')) return 200;
  if (name.includes('espinaca')) return 100;
  if (name.includes('lechuga') || name.includes('ensalada')) return 150;
  if (name.includes('tomate')) return 150;
  if (name.includes('pepino')) return 100;
  if (name.includes('zanahoria')) return 100;
  if (name.includes('calabacín')) return 150;
  
  // Grasas y lácteos
  if (name.includes('aguacate')) return 100;
  if (name.includes('aceite')) return 10;
  if (name.includes('yogur') || name.includes('yogurt')) return 200;
  if (name.includes('queso')) return 30;
  if (name.includes('leche')) return 200;
  
  // Frutos secos y semillas
  if (name.includes('nueces') || name.includes('almendras') || name.includes('frutos secos')) return 30;
  if (name.includes('semillas')) return 20;
  
  // Default
  return 100;
}

/**
 * NUEVO: Estima macros basándose en el ingrediente y cantidad
 */
function estimateMacrosFromIngredient(ingredientName: string, grams: number): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const name = ingredientName.toLowerCase();
  
  // Proteínas magras (pollo, pavo, pescado blanco)
  if (name.includes('pollo') || name.includes('pavo') || name.includes('pechuga')) {
    return {
      calories: Math.round(grams * 1.1), // ~110 kcal/100g
      protein: Math.round(grams * 0.23), // ~23g/100g
      carbs: 0,
      fat: Math.round(grams * 0.01) // ~1g/100g
    };
  }
  
  // Pescado azul (salmón, atún)
  if (name.includes('salmón') || name.includes('atún')) {
    return {
      calories: Math.round(grams * 2.0), // ~200 kcal/100g
      protein: Math.round(grams * 0.20), // ~20g/100g
      carbs: 0,
      fat: Math.round(grams * 0.13) // ~13g/100g
    };
  }
  
  // Arroz, pasta
  if (name.includes('arroz') || name.includes('pasta')) {
    return {
      calories: Math.round(grams * 3.5), // ~350 kcal/100g crudo
      protein: Math.round(grams * 0.08), // ~8g/100g
      carbs: Math.round(grams * 0.75), // ~75g/100g
      fat: Math.round(grams * 0.01) // ~1g/100g
    };
  }
  
  // Avena
  if (name.includes('avena')) {
    return {
      calories: Math.round(grams * 3.7), // ~370 kcal/100g
      protein: Math.round(grams * 0.13), // ~13g/100g
      carbs: Math.round(grams * 0.60), // ~60g/100g
      fat: Math.round(grams * 0.07) // ~7g/100g
    };
  }
  
  // Verduras en general
  if (name.includes('brócoli') || name.includes('espinaca') || name.includes('lechuga') || 
      name.includes('tomate') || name.includes('pepino') || name.includes('calabacín')) {
    return {
      calories: Math.round(grams * 0.3), // ~30 kcal/100g promedio
      protein: Math.round(grams * 0.03), // ~3g/100g
      carbs: Math.round(grams * 0.05), // ~5g/100g
      fat: 0
    };
  }
  
  // Aguacate
  if (name.includes('aguacate')) {
    return {
      calories: Math.round(grams * 1.6), // ~160 kcal/100g
      protein: Math.round(grams * 0.02), // ~2g/100g
      carbs: Math.round(grams * 0.09), // ~9g/100g
      fat: Math.round(grams * 0.15) // ~15g/100g
    };
  }
  
  // Huevos (50g por huevo)
  if (name.includes('huevo')) {
    const numEggs = Math.round(grams / 50);
    return {
      calories: numEggs * 70,
      protein: numEggs * 6,
      carbs: numEggs * 1,
      fat: numEggs * 5
    };
  }
  
  // Yogurt griego
  if (name.includes('yogur') || name.includes('yogurt')) {
    return {
      calories: Math.round(grams * 0.6), // ~60 kcal/100g (0% grasa)
      protein: Math.round(grams * 0.10), // ~10g/100g
      carbs: Math.round(grams * 0.04), // ~4g/100g
      fat: 0
    };
  }
  
  // Default: estimación conservadora
  return {
    calories: Math.round(grams * 1.0),
    protein: Math.round(grams * 0.05),
    carbs: Math.round(grams * 0.10),
    fat: Math.round(grams * 0.03)
  };
}

/**
 * NUEVO: Genera ingredientes realistas basándose en el nombre del plato
 */
function generateIngredientsFromMealName(meal: Meal): DetailedIngredient[] {
  const name = meal.name.toLowerCase();
  const ingredients: DetailedIngredient[] = [];
  
  // Intentar detectar componentes del plato
  // Ejemplo: "Pollo con Arroz y Brócoli"
  
  if (name.includes('pollo') || name.includes('pechuga')) {
    const grams = 150;
    ingredients.push({
      name: 'Pechuga de pollo',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('pollo', grams)
    });
  }
  
  if (name.includes('salmón')) {
    const grams = 140;
    ingredients.push({
      name: 'Salmón',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('salmón', grams)
    });
  }
  
  if (name.includes('arroz')) {
    const grams = 80;
    ingredients.push({
      name: 'Arroz blanco',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('arroz', grams)
    });
  }
  
  if (name.includes('pasta')) {
    const grams = 80;
    ingredients.push({
      name: 'Pasta integral',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('pasta', grams)
    });
  }
  
  if (name.includes('brócoli') || name.includes('brócoli')) {
    const grams = 200;
    ingredients.push({
      name: 'Brócoli',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('brócoli', grams)
    });
  }
  
  if (name.includes('avena')) {
    const grams = 60;
    ingredients.push({
      name: 'Copos de avena',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('avena', grams)
    });
  }
  
  if (name.includes('huevo')) {
    const grams = 150; // ~3 huevos
    ingredients.push({
      name: 'Huevos',
      amount: `${grams}g`,
      ...estimateMacrosFromIngredient('huevo', grams)
    });
  }
  
  // Si no se detectó ningún ingrediente, crear uno genérico
  if (ingredients.length === 0) {
    return [{
      name: meal.name,
      amount: '1 porción',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    }];
  }
  
  // Ajustar macros para que coincidan con el total del plato
  const totalCals = ingredients.reduce((sum, ing) => sum + ing.calories, 0);
  const totalProtein = ingredients.reduce((sum, ing) => sum + ing.protein, 0);
  const totalCarbs = ingredients.reduce((sum, ing) => sum + ing.carbs, 0);
  const totalFat = ingredients.reduce((sum, ing) => sum + ing.fat, 0);
  
  // Aplicar factor de corrección
  const caloriesFactor = meal.calories / totalCals;
  
  return ingredients.map(ing => ({
    ...ing,
    calories: Math.round(ing.calories * caloriesFactor),
    protein: Math.round(ing.protein * (meal.protein / totalProtein)),
    carbs: Math.round(ing.carbs * (meal.carbs / totalCarbs)),
    fat: Math.round(ing.fat * (meal.fat / totalFat))
  }));
};

/**
 * Genera pasos de preparación específicos o genéricos
 */
export const generatePreparationSteps = (meal: Meal): PreparationStep[] => {
  // PRIMERO: Si el plato tiene pasos de preparación personalizados, usarlos
  if (meal.preparationSteps && meal.preparationSteps.length > 0) {
    return meal.preparationSteps.map((instruction, index) => ({
      step: index + 1,
      instruction
    }));
  }

  // Buscar preparación específica
  if (specificPreparations[meal.name]) {
    return specificPreparations[meal.name];
  }

  // Generar pasos genéricos basados en el tipo y nombre
  const name = meal.name.toLowerCase();
  const steps: PreparationStep[] = [];

  // Patrones comunes
  if (name.includes('plancha') || name.includes('a la plancha')) {
    return [
      { step: 1, instruction: 'Sazona el ingrediente principal con sal, pimienta y especias', time: '2 min' },
      { step: 2, instruction: 'Calienta una plancha o sartén con un chorrito de aceite', time: '2 min' },
      { step: 3, instruction: 'Cocina el ingrediente hasta que esté dorado por ambos lados', time: '10-15 min', tip: 'No muevas constantemente' },
      { step: 4, instruction: 'Deja reposar unos minutos antes de servir', time: '3 min' },
      { step: 5, instruction: 'Acompaña con guarnición de verduras o ensalada', time: '2 min' }
    ];
  }

  if (name.includes('horno') || name.includes('al horno')) {
    return [
      { step: 1, instruction: 'Precalienta el horno a 180-200°C', time: '10 min' },
      { step: 2, instruction: 'Prepara y sazona todos los ingredientes', time: '5 min' },
      { step: 3, instruction: 'Coloca en una bandeja con papel de horno', time: '2 min' },
      { step: 4, instruction: 'Hornea durante el tiempo necesario según el ingrediente', time: '20-30 min', tip: 'Revisa a mitad de cocción' },
      { step: 5, instruction: 'Deja enfriar ligeramente y sirve', time: '5 min' }
    ];
  }

  if (name.includes('ensalada')) {
    return [
      { step: 1, instruction: 'Lava y seca bien todas las verduras', time: '5 min' },
      { step: 2, instruction: 'Corta los ingredientes en trozos del tamaño deseado', time: '5 min' },
      { step: 3, instruction: 'Si lleva proteína, prepárala por separado', time: '10 min' },
      { step: 4, instruction: 'Mezcla todos los ingredientes en un bol grande', time: '2 min', tip: 'Aliña justo antes de servir' },
      { step: 5, instruction: 'Añade el aliño y mezcla suavemente', time: '1 min' }
    ];
  }

  if (name.includes('batido') || name.includes('smoothie')) {
    return [
      { step: 1, instruction: 'Reúne todos los ingredientes', time: '1 min' },
      { step: 2, instruction: 'Añádelos a una batidora o shaker', time: '1 min' },
      { step: 3, instruction: 'Bate o agita vigorosamente hasta obtener textura homogénea', time: '1-2 min', tip: 'Añade hielo para que esté más frío' },
      { step: 4, instruction: 'Sirve inmediatamente', time: '30 seg' }
    ];
  }

  if (name.includes('tortilla') || name.includes('revuelto')) {
    return [
      { step: 1, instruction: 'Bate los huevos en un bol con sal', time: '1 min' },
      { step: 2, instruction: 'Prepara y cocina los ingredientes adicionales si los hay', time: '3 min' },
      { step: 3, instruction: 'Calienta una sartén con aceite', time: '1 min' },
      { step: 4, instruction: 'Vierte la mezcla y cocina a fuego medio', time: '5-6 min', tip: 'Baja el fuego si se dora demasiado rápido' },
      { step: 5, instruction: 'Sirve caliente', time: '1 min' }
    ];
  }

  // Pasos genéricos por defecto
  return [
    { step: 1, instruction: 'Reúne y prepara todos los ingredientes necesarios', time: '5 min' },
    { step: 2, instruction: 'Sigue el método de cocción apropiado para el plato', time: '15 min', tip: 'Ajusta tiempos según tu experiencia' },
    { step: 3, instruction: 'Sazona al gusto', time: '1 min' },
    { step: 4, instruction: 'Sirve y disfruta', time: '1 min' }
  ];
};

/**
 * Genera tips específicos o genéricos
 */
export const generateCookingTips = (meal: Meal): CookingTip[] => {
  // PRIMERO: Si el plato tiene tips personalizados, usarlos
  if (meal.tips && meal.tips.length > 0) {
    return meal.tips.map((description) => ({
      title: '💡 Consejo',
      description,
      icon: '💡'
    }));
  }

  const tips: CookingTip[] = [];

  // Buscar tips específicos primero
  if (specificTips[meal.name]) {
    return specificTips[meal.name];
  }

  // Tips genéricos basados en características
  const name = meal.name.toLowerCase();

  if (name.includes('pollo') || name.includes('pavo') || name.includes('ternera')) {
    tips.push({
      title: 'Temperatura Interna',
      description: 'Usa un termómetro de cocina para asegurar la cocción perfecta: 74°C para aves, 63°C para ternera.',
      icon: '🌡️'
    });
  }

  if (name.includes('pescado') || name.includes('salmón') || name.includes('atún') || name.includes('merluza')) {
    tips.push({
      title: 'Pescado Jugoso',
      description: 'El pescado se cocina rápido. No lo pases de cocción o quedará seco. Debe estar opaco pero jugoso.',
      icon: '🐟'
    });
  }

  if (meal.protein >= 30) {
    tips.push({
      title: 'Alto en Proteína',
      description: 'Este plato tiene más de 30g de proteína, ideal para recuperación muscular y saciedad prolongada.',
      icon: '💪'
    });
  }

  if (meal.calories <= 300) {
    tips.push({
      title: 'Opción Ligera',
      description: 'Con menos de 300 calorías, este plato es perfecto para cenas o para controlar el aporte calórico.',
      icon: '🌿'
    });
  }

  tips.push({
    title: 'Personalízalo',
    description: 'No dudes en ajustar cantidades o sustituir ingredientes según tu gusto y disponibilidad.',
    icon: '🎨'
  });

  tips.push({
    title: 'Precisión en Macros',
    description: 'Usa una báscula de cocina para pesar los ingredientes y alcanzar tus objetivos nutricionales exactos.',
    icon: '⚖️'
  });

  return tips;
};

/**
 * Genera variaciones similares
 */
export const generateMealVariations = (meal: Meal, allMeals: Meal[]): MealVariation[] => {
  const variations: MealVariation[] = [];
  
  const sameMeals = allMeals.filter(m => 
    m.type === meal.type && 
    m.id !== meal.id
  );

  // Rango de calorías similares (±20%)
  const calorieRange = meal.calories * 0.25;
  const similarByMacros = sameMeals.filter(m => 
    Math.abs(m.calories - meal.calories) <= calorieRange
  );

  // Tomar hasta 5 variaciones
  similarByMacros.slice(0, 5).forEach(m => {
    variations.push({
      id: m.id,
      name: m.name,
      description: m.variant || 'Opción similar',
      caloriesDiff: m.calories - meal.calories,
      proteinDiff: m.protein - meal.protein,
      tag: m.protein > meal.protein + 5 ? 'Más proteína' : 
           m.calories < meal.calories - 50 ? 'Más ligero' : 
           m.calories > meal.calories + 50 ? 'Más energía' : 'Similar'
    });
  });

  // Si no hay suficientes, tomar aleatorias del mismo tipo
  if (variations.length < 5) {
    const remaining = 5 - variations.length;
    const random = sameMeals
      .filter(m => !variations.some(v => v.id === m.id))
      .slice(0, remaining);
    
    random.forEach(m => {
      variations.push({
        id: m.id,
        name: m.name,
        description: m.variant || 'Alternativa',
        caloriesDiff: m.calories - meal.calories,
        proteinDiff: m.protein - meal.protein,
        tag: 'Alternativa'
      });
    });
  }

  return variations;
};