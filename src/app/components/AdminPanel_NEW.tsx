import { useState, useEffect } from 'react';
import { Meal, MealType, User, Ingredient } from '../types';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Coffee, UtensilsCrossed, Apple, Moon, FileText, Package, Sparkles } from 'lucide-react';
import { generateSystemDocumentationPDF } from '../utils/generateSystemDocumentation';
import * as api from '../utils/api';

interface AdminPanelProps {
  onBack: () => void;
  user: User;
}

type AdminTab = 'meals' | 'ingredients';

export default function AdminPanel({ onBack, user }: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<AdminTab>('meals');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [globalMeals, setGlobalMeals] = useState<{
    breakfast: Meal[];
    lunch: Meal[];
    snack: Meal[];
    dinner: Meal[];
  }>({
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  });
  const [globalIngredients, setGlobalIngredients] = useState<Ingredient[]>([]);
  
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados del formulario de comida
  const [mealFormData, setMealFormData] = useState({
    name: '',
    description: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: ['']
  });

  // Estados del formulario de ingrediente
  const [ingredientFormData, setIngredientFormData] = useState({
    name: '',
    unit: 'g' as 'g' | 'ml' | 'unidades',
    defaultAmount: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    category: 'otro' as 'proteína' | 'carbohidrato' | 'grasa' | 'vegetal' | 'fruta' | 'lácteo' | 'cereal' | 'legumbre' | 'otro'
  });

  // Cargar datos globales al montar
  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    setIsLoading(true);
    const meals = await api.getGlobalMeals();
    const ingredients = await api.getGlobalIngredients();
    
    // Organizar comidas por tipo
    const organized = {
      breakfast: meals.filter(m => {
        if (Array.isArray(m.type)) {
          return m.type.includes('breakfast');
        }
        return m.type === 'breakfast';
      }),
      lunch: meals.filter(m => {
        if (Array.isArray(m.type)) {
          return m.type.includes('lunch');
        }
        return m.type === 'lunch';
      }),
      snack: meals.filter(m => {
        if (Array.isArray(m.type)) {
          return m.type.includes('snack');
        }
        return m.type === 'snack';
      }),
      dinner: meals.filter(m => {
        if (Array.isArray(m.type)) {
          return m.type.includes('dinner');
        }
        return m.type === 'dinner';
      })
    };
    
    setGlobalMeals(organized);
    setGlobalIngredients(ingredients);
    setIsLoading(false);
  };

  const getMealTypeLabel = (type: MealType) => {
    const labels = {
      breakfast: 'Desayunos',
      lunch: 'Comidas',
      snack: 'Meriendas',
      dinner: 'Cenas'
    };
    return labels[type];
  };

  const getMealTypeIcon = (type: MealType) => {
    const icons = {
      breakfast: <Coffee className="w-4 md:w-5 h-4 md:h-5" />,
      lunch: <UtensilsCrossed className="w-4 md:w-5 h-4 md:h-5" />,
      snack: <Apple className="w-4 md:w-5 h-4 md:h-5" />,
      dinner: <Moon className="w-4 md:w-5 h-4 md:h-5" />
    };
    return icons[type];
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'proteína': '🥩',
      'carbohidrato': '🍞',
      'grasa': '🥑',
      'vegetal': '🥦',
      'fruta': '🍎',
      'lácteo': '🥛',
      'cereal': '🌾',
      'legumbre': '🫘',
      'otro': '📦'
    };
    return icons[category] || '📦';
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setMealFormData({
      name: meal.name,
      description: meal.description || '',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      ingredients: meal.ingredients || ['']
    });
    setIsCreating(false);
  };

  const handleCreateMeal = () => {
    setEditingMeal(null);
    setMealFormData({
      name: '',
      description: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: ['']
    });
    setIsCreating(true);
  };

  const handleSaveMeal = async () => {
    if (!mealFormData.name || mealFormData.calories === 0) {
      alert('Por favor completa al menos el nombre y las calorías');
      return;
    }

    const newMeal: Meal = {
      id: editingMeal ? editingMeal.id : `global-${selectedMealType}-${Date.now()}`,
      name: mealFormData.name,
      description: mealFormData.description,
      type: selectedMealType,
      calories: mealFormData.calories,
      protein: mealFormData.protein,
      carbs: mealFormData.carbs,
      fat: mealFormData.fat,
      ingredients: mealFormData.ingredients.filter(ing => ing.trim() !== ''),
      baseQuantity: 100,
      isCustom: false,
      isGlobal: true,
      createdBy: user.email
    };

    let updatedMeals: Meal[];
    
    if (editingMeal) {
      // Actualizar comida existente
      updatedMeals = [
        ...globalMeals.breakfast,
        ...globalMeals.lunch,
        ...globalMeals.snack,
        ...globalMeals.dinner
      ].map(m => m.id === editingMeal.id ? newMeal : m);
    } else {
      // Crear nueva comida
      updatedMeals = [
        ...globalMeals.breakfast,
        ...globalMeals.lunch,
        ...globalMeals.snack,
        ...globalMeals.dinner,
        newMeal
      ];
    }

    // Guardar en Supabase
    await api.saveGlobalMeals(updatedMeals);
    
    // Recargar datos
    await loadGlobalData();

    // Limpiar formulario
    setEditingMeal(null);
    setIsCreating(false);
    setMealFormData({
      name: '',
      description: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: ['']
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (confirm('¿Estás seguro de eliminar este plato? Esto lo quitará para TODOS los usuarios.')) {
      const updatedMeals = [
        ...globalMeals.breakfast,
        ...globalMeals.lunch,
        ...globalMeals.snack,
        ...globalMeals.dinner
      ].filter(m => m.id !== mealId);
      
      await api.saveGlobalMeals(updatedMeals);
      await loadGlobalData();
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      defaultAmount: ingredient.defaultAmount,
      calories: ingredient.calories,
      protein: ingredient.protein,
      carbs: ingredient.carbs,
      fat: ingredient.fat,
      category: ingredient.category
    });
    setIsCreating(false);
  };

  const handleCreateIngredient = () => {
    setEditingIngredient(null);
    setIngredientFormData({
      name: '',
      unit: 'g',
      defaultAmount: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'otro'
    });
    setIsCreating(true);
  };

  const handleSaveIngredient = async () => {
    if (!ingredientFormData.name) {
      alert('Por favor completa al menos el nombre del ingrediente');
      return;
    }

    const newIngredient: Ingredient = {
      id: editingIngredient ? editingIngredient.id : `global-ingredient-${Date.now()}`,
      name: ingredientFormData.name,
      unit: ingredientFormData.unit,
      defaultAmount: ingredientFormData.defaultAmount,
      calories: ingredientFormData.calories,
      protein: ingredientFormData.protein,
      carbs: ingredientFormData.carbs,
      fat: ingredientFormData.fat,
      category: ingredientFormData.category,
      isGlobal: true,
      createdBy: user.email
    };

    let updatedIngredients: Ingredient[];
    
    if (editingIngredient) {
      // Actualizar ingrediente existente
      updatedIngredients = globalIngredients.map(ing => 
        ing.id === editingIngredient.id ? newIngredient : ing
      );
    } else {
      // Crear nuevo ingrediente
      updatedIngredients = [...globalIngredients, newIngredient];
    }

    // Guardar en Supabase
    await api.saveGlobalIngredients(updatedIngredients);
    
    // Recargar datos
    await loadGlobalData();

    // Limpiar formulario
    setEditingIngredient(null);
    setIsCreating(false);
    setIngredientFormData({
      name: '',
      unit: 'g',
      defaultAmount: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'otro'
    });
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    if (confirm('¿Estás seguro de eliminar este ingrediente? Esto lo quitará para TODOS los usuarios.')) {
      const updatedIngredients = globalIngredients.filter(ing => ing.id !== ingredientId);
      
      await api.saveGlobalIngredients(updatedIngredients);
      await loadGlobalData();
    }
  };

  const handleCancel = () => {
    setEditingMeal(null);
    setEditingIngredient(null);
    setIsCreating(false);
    setMealFormData({
      name: '',
      description: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: ['']
    });
    setIngredientFormData({
      name: '',
      unit: 'g',
      defaultAmount: 100,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'otro'
    });
  };

  const addIngredient = () => {
    setMealFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setMealFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setMealFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando datos globales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header - RESPONSIVE */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 md:px-6 pt-8 md:pt-12 pb-4 md:pb-6 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <button
              onClick={onBack}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">Panel de Administración</h1>
              <p className="text-purple-100 text-xs md:text-sm">Gestiona contenido global • Sin límites</p>
            </div>
          </div>

          {/* Main Tabs - Comidas vs Ingredientes */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAdminTab('meals')}
              className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm md:text-base ${
                adminTab === 'meals'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Platos Globales</span>
              <span className="sm:hidden">Platos</span>
            </button>
            <button
              onClick={() => setAdminTab('ingredients')}
              className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm md:text-base ${
                adminTab === 'ingredients'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Ingredientes Globales</span>
              <span className="sm:hidden">Ingredientes</span>
            </button>
          </div>

          {/* Meal Type Tabs - Solo si estamos en "meals" */}
          {adminTab === 'meals' && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedMealType(type)}
                  className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm ${
                    selectedMealType === type
                      ? 'bg-white text-purple-600 font-semibold'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {getMealTypeIcon(type)}
                  <span className="hidden sm:inline">{getMealTypeLabel(type)}</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">
                    {globalMeals[type].length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Botón Descargar Documentación */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentación Técnica del Sistema
              </h3>
              <p className="text-xs md:text-sm text-indigo-700">
                Descarga el PDF completo del sistema Fuelier
              </p>
            </div>
            <button
              onClick={generateSystemDocumentationPDF}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FileText className="w-4 md:w-5 h-4 md:h-5" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* SECCIÓN DE PLATOS */}
        {adminTab === 'meals' && (
          <>
            {/* Info y Botón Crear */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Platos Globales • Sin Límites
                  </h3>
                  <p className="text-xs md:text-sm text-emerald-700">
                    Los platos que crees aquí estarán disponibles para TODOS los usuarios de la app
                  </p>
                </div>
                <button
                  onClick={handleCreateMeal}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  Crear Plato
                </button>
              </div>
            </div>

            {/* Formulario de Edición/Creación de Comida */}
            {(editingMeal || (isCreating && adminTab === 'meals')) && (
              <div className="bg-white border-2 border-purple-300 rounded-2xl p-4 md:p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-neutral-800">
                    {editingMeal ? 'Editar Plato' : 'Crear Nuevo Plato'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nombre del Plato *
                    </label>
                    <input
                      type="text"
                      value={mealFormData.name}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Tostadas con Aguacate y Huevo"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={mealFormData.description}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ej: 2 tostadas integrales, 1/2 aguacate, 2 huevos revueltos"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Calorías */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Calorías *
                    </label>
                    <input
                      type="number"
                      value={mealFormData.calories}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                      placeholder="450"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Proteína */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Proteína (g)
                    </label>
                    <input
                      type="number"
                      value={mealFormData.protein}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                      placeholder="22"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Carbohidratos */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Carbohidratos (g)
                    </label>
                    <input
                      type="number"
                      value={mealFormData.carbs}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, carbs: parseInt(e.target.value) || 0 }))}
                      placeholder="35"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Grasas */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Grasas (g)
                    </label>
                    <input
                      type="number"
                      value={mealFormData.fat}
                      onChange={(e) => setMealFormData(prev => ({ ...prev, fat: parseInt(e.target.value) || 0 }))}
                      placeholder="24"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Ingredientes */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        Ingredientes
                      </label>
                      <button
                        onClick={addIngredient}
                        className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir ingrediente
                      </button>
                    </div>
                    <div className="space-y-2">
                      {mealFormData.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={ingredient}
                            onChange={(e) => updateIngredient(index, e.target.value)}
                            placeholder="Ej: Pan integral"
                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          {mealFormData.ingredients.length > 1 && (
                            <button
                              onClick={() => removeIngredient(index)}
                              className="text-red-500 hover:bg-red-50 px-3 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-xl hover:bg-neutral-300 transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveMeal}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Platos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalMeals[selectedMealType].map((meal, index) => (
                <div
                  key={meal.id}
                  className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-neutral-800 truncate">{meal.name}</h3>
                      </div>
                      {meal.description && (
                        <p className="text-xs md:text-sm text-neutral-500 mb-2 line-clamp-2">{meal.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded-lg font-medium">
                          {meal.calories} kcal
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {meal.protein}g P
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">
                          {meal.carbs}g C
                        </span>
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-medium">
                          {meal.fat}g G
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <p className="text-xs font-medium text-neutral-600 mb-1">Ingredientes:</p>
                      <div className="flex flex-wrap gap-1">
                        {meal.ingredients.slice(0, 3).map((ingredient, i) => (
                          <span
                            key={i}
                            className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-lg"
                          >
                            {ingredient}
                          </span>
                        ))}
                        {meal.ingredients.length > 3 && (
                          <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-lg">
                            +{meal.ingredients.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {globalMeals[selectedMealType].length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-neutral-500 mb-4">
                    No hay platos creados aún para {getMealTypeLabel(selectedMealType).toLowerCase()}
                  </p>
                  <button
                    onClick={handleCreateMeal}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Primer Plato
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* SECCIÓN DE INGREDIENTES */}
        {adminTab === 'ingredients' && (
          <>
            {/* Info y Botón Crear */}
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Ingredientes Globales • Sin Límites
                  </h3>
                  <p className="text-xs md:text-sm text-amber-700">
                    Los ingredientes que crees aquí estarán disponibles para TODOS los usuarios
                  </p>
                </div>
                <button
                  onClick={handleCreateIngredient}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  Crear Ingrediente
                </button>
              </div>
            </div>

            {/* Formulario de Edición/Creación de Ingrediente */}
            {(editingIngredient || (isCreating && adminTab === 'ingredients')) && (
              <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 md:p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-neutral-800">
                    {editingIngredient ? 'Editar Ingrediente' : 'Crear Nuevo Ingrediente'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nombre del Ingrediente *
                    </label>
                    <input
                      type="text"
                      value={ingredientFormData.name}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Pollo Pechuga"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Unidad */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Unidad de Medida
                    </label>
                    <select
                      value={ingredientFormData.unit}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, unit: e.target.value as 'g' | 'ml' | 'unidades' }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="g">Gramos (g)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="unidades">Unidades</option>
                    </select>
                  </div>

                  {/* Cantidad por defecto */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Cantidad de Referencia
                    </label>
                    <input
                      type="number"
                      value={ingredientFormData.defaultAmount}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, defaultAmount: parseInt(e.target.value) || 100 }))}
                      placeholder="100"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Categoría */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={ingredientFormData.category}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="proteína">🥩 Proteína</option>
                      <option value="carbohidrato">🍞 Carbohidrato</option>
                      <option value="grasa">🥑 Grasa</option>
                      <option value="vegetal">🥦 Vegetal</option>
                      <option value="fruta">🍎 Fruta</option>
                      <option value="lácteo">🥛 Lácteo</option>
                      <option value="cereal">🌾 Cereal</option>
                      <option value="legumbre">🫘 Legumbre</option>
                      <option value="otro">📦 Otro</option>
                    </select>
                  </div>

                  {/* Calorías */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Calorías (por {ingredientFormData.defaultAmount}{ingredientFormData.unit})
                    </label>
                    <input
                      type="number"
                      value={ingredientFormData.calories}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                      placeholder="165"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Proteína */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Proteína (g)
                    </label>
                    <input
                      type="number"
                      value={ingredientFormData.protein}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                      placeholder="31"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Carbohidratos */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Carbohidratos (g)
                    </label>
                    <input
                      type="number"
                      value={ingredientFormData.carbs}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, carbs: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Grasas */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Grasas (g)
                    </label>
                    <input
                      type="number"
                      value={ingredientFormData.fat}
                      onChange={(e) => setIngredientFormData(prev => ({ ...prev, fat: parseInt(e.target.value) || 0 }))}
                      placeholder="3.6"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-xl hover:bg-neutral-300 transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveIngredient}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Ingredientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {globalIngredients.map((ingredient, index) => (
                <div
                  key={ingredient.id}
                  className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(ingredient.category)}</span>
                        <h3 className="font-bold text-neutral-800 text-sm truncate">{ingredient.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-medium">
                          {ingredient.defaultAmount}{ingredient.unit}
                        </span>
                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-lg">
                          {ingredient.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg">
                          {ingredient.calories} kcal
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">
                          {ingredient.protein}g P
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">
                          {ingredient.carbs}g C
                        </span>
                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg">
                          {ingredient.fat}g G
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => handleEditIngredient(ingredient)}
                        className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {globalIngredients.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-neutral-500 mb-4">
                    No hay ingredientes creados aún
                  </p>
                  <button
                    onClick={handleCreateIngredient}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Primer Ingrediente
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
