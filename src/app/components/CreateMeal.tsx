import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, X, Save, Info, ChefHat, Sparkles, Search, Check } from 'lucide-react';
import { Meal, MealType } from '../types';
import { saveCustomMeal } from '../data/customMeals';
import { INGREDIENTS_DATABASE, calculateMacrosFromIngredients, Ingredient as DBIngredient, saveCustomIngredient as saveDBIngredient } from '../../data/ingredientsDatabase';
import { getCustomIngredients, createCustomIngredient, getBaseIngredients } from '../utils/supabase';

interface CreateMealProps {
  mealType?: MealType;
  onBack: () => void;
  onSave: (meal: Meal) => void;
  userEmail: string; // NUEVO: Para cargar ingredientes personalizados del usuario
}

interface IngredientInput {
  id: string;
  ingredientId: string;
  name: string;
  grams: string;
  showSuggestions?: boolean;
}

interface NewIngredientData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export default function CreateMeal({ mealType, onBack, onSave, userEmail }: CreateMealProps) {
  const [mealName, setMealName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>(mealType ? [mealType] : []);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: '1', ingredientId: '', name: '', grams: '', showSuggestions: false }
  ]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>(['']);
  const [tips, setTips] = useState<string[]>(['']);
  const [showTips, setShowTips] = useState(false);

  const [showNewIngredientModal, setShowNewIngredientModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState<NewIngredientData>({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);

  // ⭐ NUEVO: Estados para ingredientes de diferentes fuentes
  const [baseIngredients, setBaseIngredients] = useState<DBIngredient[]>([]); // Ingredientes globales de Supabase
  const [customIngredients, setCustomIngredients] = useState<DBIngredient[]>([]); // Ingredientes personalizados del usuario

  // ⭐ NUEVO: Cargar ingredientes globales y personalizados desde Supabase al montar
  useEffect(() => {
    const loadAllIngredients = async () => {
      try {
        // 1. Cargar ingredientes globales (creados por admin en Supabase)
        const globalIngredients = await getBaseIngredients();
        console.log(`✅ Loaded ${globalIngredients?.length || 0} global ingredients from Supabase`);
        
        // 2. Cargar ingredientes personalizados del usuario
        const userIngredients = await getCustomIngredients(userEmail);
        console.log(`✅ Loaded ${userIngredients?.length || 0} custom ingredients from Supabase`);
        
        // Convertir ingredientes de Supabase al formato DBIngredient
        const formattedGlobal = (globalIngredients || []).map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          category: ing.category || 'otros',
          caloriesPer100g: ing.calories_per_100g,
          proteinPer100g: ing.protein_per_100g,
          carbsPer100g: ing.carbs_per_100g,
          fatPer100g: ing.fat_per_100g,
          isCustom: false
        }));
        
        const formattedCustom = (userIngredients || []).map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          category: ing.category || 'otros',
          caloriesPer100g: ing.calories_per_100g,
          proteinPer100g: ing.protein_per_100g,
          carbsPer100g: ing.carbs_per_100g,
          fatPer100g: ing.fat_per_100g,
          isCustom: true
        }));
        
        setBaseIngredients(formattedGlobal);
        setCustomIngredients(formattedCustom);
      } catch (error) {
        console.error('Error loading ingredients:', error);
        setBaseIngredients([]);
        setCustomIngredients([]);
      }
    };

    loadAllIngredients();
  }, [userEmail]);

  // ⭐ Calcular macros automáticamente
  const calculatedMacros = useMemo(() => {
    const validIngredients = ingredients.filter(ing => ing.ingredientId && ing.grams);
    
    if (validIngredients.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0 };
    }

    const ingredientReferences = validIngredients.map(ing => ({
      ingredientId: ing.ingredientId,
      amountInGrams: parseFloat(ing.grams) || 0
    }));

    const macros = calculateMacrosFromIngredients(ingredientReferences);
    const totalGrams = validIngredients.reduce((sum, ing) => sum + (parseFloat(ing.grams) || 0), 0);

    return {
      ...macros,
      totalGrams: Math.round(totalGrams)
    };
  }, [ingredients]);

  const getMealTypeLabel = () => {
    const labels = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      snack: 'Merienda',
      dinner: 'Cena'
    };
    return labels[mealType || 'breakfast'];
  };

  const getMealTypeIcon = () => {
    const icons = {
      breakfast: '🌅',
      lunch: '🍽️',
      snack: '🍎',
      dinner: '🌙'
    };
    return icons[mealType || 'breakfast'];
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), ingredientId: '', name: '', grams: '', showSuggestions: false }]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: 'name' | 'grams', value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value, showSuggestions: field === 'name' && value.length > 0 } : ing
    ));
  };

  const selectIngredientSuggestion = (id: string, ingredientName: string, ingredientId: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, name: ingredientName, ingredientId: ingredientId, showSuggestions: false } : ing
    ));
  };

  const hideSuggestions = (id: string) => {
    setTimeout(() => {
      setIngredients(ingredients.map(ing => 
        ing.id === id ? { ...ing, showSuggestions: false } : ing
      ));
    }, 200);
  };

  const getFilteredSuggestions = (searchText: string) => {
    if (!searchText || searchText.length < 1) return [];
    
    // ⭐ FIXED: Combinar ingredientes base + personalizados de forma síncrona
    const allIngredients: DBIngredient[] = [...INGREDIENTS_DATABASE, ...baseIngredients, ...customIngredients];
    const lowerSearch = searchText.toLowerCase();
    
    return allIngredients
      .filter(ing => ing.name.toLowerCase().includes(lowerSearch))
      .slice(0, 8);
  };

  const addPreparationStep = () => {
    setPreparationSteps([...preparationSteps, '']);
  };

  const removePreparationStep = (index: number) => {
    if (preparationSteps.length > 1) {
      setPreparationSteps(preparationSteps.filter((_, i) => i !== index));
    }
  };

  const updatePreparationStep = (index: number, value: string) => {
    setPreparationSteps(preparationSteps.map((step, i) => 
      i === index ? value : step
    ));
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const updateTip = (index: number, value: string) => {
    setTips(tips.map((tip, i) => 
      i === index ? value : tip
    ));
  };

  const toggleMealType = (type: MealType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSave = () => {
    if (!mealName.trim()) {
      alert('Por favor, ingresa un nombre para el plato');
      return;
    }

    if (selectedTypes.length === 0) {
      alert('Por favor, selecciona al menos un momento del día para este plato');
      return;
    }

    const hasValidIngredients = ingredients.some(ing => ing.ingredientId && ing.grams);
    if (!hasValidIngredients) {
      alert('Por favor, agrega al menos un ingrediente con cantidad');
      return;
    }

    const hasValidPreparation = preparationSteps.some(step => step.trim());
    if (!hasValidPreparation) {
      alert('Por favor, agrega al menos un paso de preparación');
      return;
    }

    // Crear referencias de ingredientes para el escalado
    const ingredientReferences = ingredients
      .filter(ing => ing.ingredientId && ing.grams)
      .map(ing => ({
        ingredientId: ing.ingredientId,
        amountInGrams: parseFloat(ing.grams)
      }));

    const newMeal: Meal = {
      id: `custom-${Date.now()}`,
      name: mealName.trim(),
      type: selectedTypes.length === 1 ? selectedTypes[0] : selectedTypes,
      calories: calculatedMacros.calories,
      protein: calculatedMacros.protein,
      carbs: calculatedMacros.carbs,
      fat: calculatedMacros.fat,
      ingredients: ingredients
        .filter(ing => ing.name.trim() && ing.grams)
        .map(ing => `${ing.grams}g ${ing.name.trim()}`),
      baseQuantity: calculatedMacros.totalGrams,
      isCustom: true,
      ingredientReferences: ingredientReferences, // ⭐ NUEVO: Para escalado automático
      preparationSteps: preparationSteps.filter(step => step.trim()),
      tips: tips.filter(tip => tip.trim()).length > 0 ? tips.filter(tip => tip.trim()) : undefined
    };

    try {
      saveCustomMeal(newMeal);
      console.log('✅ Plato guardado en localStorage:', newMeal);
      onSave(newMeal); // ⭐ Pasar el meal creado
      // ❌ NO llamar a onBack() aquí - el callback onSave se encarga de la navegación
    } catch (error) {
      console.error('Error al guardar el plato:', error);
      alert('Hubo un error al guardar el plato. Por favor, intenta de nuevo.');
    }
  };

  const handleSaveNewIngredient = () => {
    if (!newIngredientData.name.trim()) {
      alert('Por favor, ingresa un nombre para el ingrediente');
      return;
    }

    if (!newIngredientData.calories || !newIngredientData.protein || !newIngredientData.carbs || !newIngredientData.fat) {
      alert('Por favor, completa todos los macronutrientes');
      return;
    }

    // Guardar con el formato correcto de ingredientsDatabase
    const savedIngredient = saveDBIngredient({
      name: newIngredientData.name.trim(),
      category: 'proteina', // Categoría por defecto para ingredientes personalizados
      caloriesPer100g: parseFloat(newIngredientData.calories),
      proteinPer100g: parseFloat(newIngredientData.protein),
      carbsPer100g: parseFloat(newIngredientData.carbs),
      fatPer100g: parseFloat(newIngredientData.fat)
    });

    if (currentIngredientId) {
      setIngredients(ingredients.map(ing => 
        ing.id === currentIngredientId ? { ...ing, name: savedIngredient.name, ingredientId: savedIngredient.id, showSuggestions: false } : ing
      ));
      setCurrentIngredientId(null);
    }

    setShowNewIngredientModal(false);
    setNewIngredientData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Fijo */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 pt-12 pb-6 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onBack}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Crear Plato Personalizado</h1>
                <p className="text-purple-100 text-sm">
                  {mealType ? `Para tu ${getMealTypeLabel()} ${getMealTypeIcon()}` : 'Personaliza tu comida'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6 pb-32">
        {/* 1️⃣ Información del Plato */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-800">Información Básica</h2>
          </div>

          <div className="space-y-4">
            {/* Nombre del Plato */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Nombre del Plato *
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Ej: Tortilla de claras con verduras"
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            {/* Selector Múltiple de Tipos de Comida */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                ¿Para qué momento(s) del día? * <span className="text-xs font-normal text-neutral-500">(puedes seleccionar varios)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'breakfast' as MealType, label: 'Desayuno', icon: '🌅', color: 'emerald' },
                  { type: 'lunch' as MealType, label: 'Comida', icon: '🍽️', color: 'blue' },
                  { type: 'snack' as MealType, label: 'Merienda', icon: '🍎', color: 'amber' },
                  { type: 'dinner' as MealType, label: 'Cena', icon: '🌙', color: 'indigo' }
                ].map(({ type, label, icon, color }) => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleMealType(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `border-${color}-500 bg-${color}-50`
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{icon}</div>
                        <p className={`text-sm font-medium ${isSelected ? `text-${color}-700` : 'text-neutral-600'}`}>
                          {label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                ✨ Este plato aparecerá como opción en todos los momentos seleccionados
              </p>
              {selectedTypes.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Selecciona al menos un momento del día
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2️⃣ Ingredientes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🥗</div>
              <h2 className="text-xl font-bold text-neutral-800">Ingredientes</h2>
            </div>
            <button
              onClick={addIngredient}
              className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl hover:bg-purple-200 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            Busca ingredientes en nuestra base de datos o crea nuevos
          </p>

          <div className="space-y-3">
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className="relative">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                      onFocus={() => setIngredients(ingredients.map(ing => 
                        ing.id === ingredient.id ? { ...ing, showSuggestions: ing.name.length > 0 } : ing
                      ))}
                      onBlur={() => hideSuggestions(ingredient.id)}
                      placeholder="Escribe o selecciona un ingrediente..."
                      className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all"
                    />
                    <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    
                    {/* Dropdown de Sugerencias */}
                    {ingredient.showSuggestions && ingredient.name.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-purple-300 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20">
                        {getFilteredSuggestions(ingredient.name).length > 0 ? (
                          <>
                            <div className="px-4 py-2 bg-purple-50 border-b border-purple-200 sticky top-0">
                              <p className="text-xs text-purple-700 font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Ingredientes disponibles
                              </p>
                            </div>
                            {getFilteredSuggestions(ingredient.name).map((suggestion) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectIngredientSuggestion(ingredient.id, suggestion.name, suggestion.id);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-all flex items-center justify-between group border-b border-neutral-100 last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-all">
                                    🥗
                                  </div>
                                  <div>
                                    <p className="font-medium text-neutral-800 text-sm">{suggestion.name}</p>
                                    <p className="text-xs text-neutral-500">
                                      {suggestion.caloriesPer100g} kcal · {suggestion.proteinPer100g}g prot · {suggestion.carbsPer100g}g carbs · {suggestion.fatPer100g}g grasas
                                      <span className="text-neutral-400 ml-1">(por 100g)</span>
                                    </p>
                                  </div>
                                </div>
                                <Check className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <div className="text-3xl mb-2">🔍</div>
                            <p className="text-sm text-neutral-600 font-medium mb-2">No se encontró "{ingredient.name}"</p>
                            <p className="text-xs text-neutral-500 mb-4">
                              Crea un nuevo ingrediente personalizado
                            </p>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewIngredientData({ ...newIngredientData, name: ingredient.name });
                                setShowNewIngredientModal(true);
                                hideSuggestions(ingredient.id);
                                setCurrentIngredientId(ingredient.id);
                              }}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              Crear "{ingredient.name}"
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={ingredient.grams}
                      onChange={(e) => updateIngredient(ingredient.id, 'grams', e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                  <span className="text-sm text-neutral-500 w-8">g</span>
                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(ingredient.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3️⃣ Macros Calculados Automáticamente */}
        {calculatedMacros.totalGrams > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-900">Macros Calculados Automáticamente</h2>
                <p className="text-xs text-emerald-700">Basados en los ingredientes seleccionados</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                <p className="text-xs text-neutral-500 mb-1">Peso Total</p>
                <p className="text-2xl font-bold text-emerald-600">{calculatedMacros.totalGrams}g</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                <p className="text-xs text-neutral-500 mb-1">Calorías</p>
                <p className="text-2xl font-bold text-red-600">{calculatedMacros.calories}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                <p className="text-xs text-neutral-500 mb-1">Proteína</p>
                <p className="text-2xl font-bold text-blue-600">{calculatedMacros.protein}g</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                <p className="text-xs text-neutral-500 mb-1">Carbohidratos</p>
                <p className="text-2xl font-bold text-amber-600">{calculatedMacros.carbs}g</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
                <p className="text-xs text-neutral-500 mb-1">Grasas</p>
                <p className="text-2xl font-bold text-orange-600">{calculatedMacros.fat}g</p>
              </div>
            </div>
          </div>
        )}

        {/* 4️⃣ Preparación */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">📝</div>
              <h2 className="text-xl font-bold text-neutral-800">Preparación</h2>
            </div>
            <button
              onClick={addPreparationStep}
              className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl hover:bg-purple-200 transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar Paso
            </button>
          </div>

          <div className="space-y-3">
            {preparationSteps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-shrink-0 bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <textarea
                    value={step}
                    onChange={(e) => updatePreparationStep(index, e.target.value)}
                    placeholder="Describe este paso de la preparación..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all resize-none"
                  />
                </div>
                {preparationSteps.length > 1 && (
                  <button
                    onClick={() => removePreparationStep(index)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all mt-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5️⃣ Consejos (Opcional) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">💡</div>
              <h2 className="text-xl font-bold text-neutral-800">Consejos y Tips</h2>
              <span className="text-sm text-neutral-400 italic">(Opcional)</span>
            </div>
            <button
              onClick={() => setShowTips(!showTips)}
              className={`px-4 py-2 rounded-xl transition-all font-medium ${
                showTips 
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {showTips ? 'Ocultar' : 'Agregar Tips'}
            </button>
          </div>

          {showTips && (
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <textarea
                      value={tip}
                      onChange={(e) => updateTip(index, e.target.value)}
                      placeholder="Ej: Para que quede más esponjoso, bate bien las claras antes de cocinar"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={() => removeTip(index)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all mt-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addTip}
                className="w-full py-3 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar otro tip
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6️⃣ Botones de acción - STICKY BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-neutral-200 text-neutral-700 py-4 rounded-xl hover:bg-neutral-300 transition-all font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <Save className="w-5 h-5" />
            Guardar Plato
          </button>
        </div>
      </div>

      {/* Modal para crear un nuevo ingrediente */}
      {showNewIngredientModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-800">Crear Nuevo Ingrediente</h2>
              <button
                onClick={() => setShowNewIngredientModal(false)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              Los valores nutricionales son por cada 100g del ingrediente
            </p>

            <div className="space-y-4">
              {/* Nombre del Ingrediente */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Nombre del Ingrediente *
                </label>
                <input
                  type="text"
                  value={newIngredientData.name}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                  placeholder="Ej: Espárragos"
                  className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Calorías */}
                <div>
                  <label className="block text-sm font-semibold text-emerald-700 mb-2">
                    Calorías *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newIngredientData.calories}
                      onChange={(e) => setNewIngredientData({ ...newIngredientData, calories: e.target.value })}
                      placeholder="20"
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      kcal
                    </span>
                  </div>
                </div>

                {/* Proteína */}
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">
                    Proteína *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newIngredientData.protein}
                      onChange={(e) => setNewIngredientData({ ...newIngredientData, protein: e.target.value })}
                      placeholder="2.2"
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-blue-500 focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      g
                    </span>
                  </div>
                </div>

                {/* Carbohidratos */}
                <div>
                  <label className="block text-sm font-semibold text-amber-700 mb-2">
                    Carbohidratos *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newIngredientData.carbs}
                      onChange={(e) => setNewIngredientData({ ...newIngredientData, carbs: e.target.value })}
                      placeholder="3.9"
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-amber-500 focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      g
                    </span>
                  </div>
                </div>

                {/* Grasas */}
                <div>
                  <label className="block text-sm font-semibold text-orange-700 mb-2">
                    Grasas *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newIngredientData.fat}
                      onChange={(e) => setNewIngredientData({ ...newIngredientData, fat: e.target.value })}
                      placeholder="0.1"
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-orange-500 focus:outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowNewIngredientModal(false)}
                className="flex-1 bg-neutral-200 text-neutral-700 px-4 py-3 rounded-xl hover:bg-neutral-300 transition-all font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewIngredient}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Save className="w-5 h-5" />
                Crear Ingrediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}