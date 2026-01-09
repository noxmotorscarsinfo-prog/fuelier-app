import { useState, useEffect, useMemo } from 'react';
import { Meal, MealType, User, Ingredient } from '../types';
import { BREAKFASTS_FROM_DB, LUNCHES_FROM_DB, SNACKS_FROM_DB, DINNERS_FROM_DB } from '../../data/mealsWithIngredients';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Coffee, UtensilsCrossed, Apple, Moon, FileText, Package, Search, Check, Sparkles, AlertCircle, Upload, Download } from 'lucide-react';
import { generateSystemDocumentationPDF } from '../utils/generateSystemDocumentation';
import * as api from '../utils/api';
import { INGREDIENTS_DATABASE, getCustomIngredients, saveCustomIngredient, getAllIngredients } from '../../data/ingredientsDatabase';
import { MealIngredientReference, Ingredient as DBIngredient, calculateMacrosFromIngredients } from '../../data/ingredientsDatabase';
import { migrateMealsToStructured } from '../utils/mealMigration';
import CSVImporter from './CSVImporter';
import * as XLSX from 'xlsx';

// Interface para ingredientes seleccionados en el formulario
interface SelectedIngredient {
  ingredientId: string;
  amountInGrams: number;
}

// ⭐ NUEVO: Interface para crear nuevo ingrediente
interface NewIngredientData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

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
  
  // NUEVO: Estados para el sistema avanzado de ingredientes en platos
  const [selectedMealIngredients, setSelectedMealIngredients] = useState<SelectedIngredient[]>([]);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  
  // ⭐ NUEVO: Estados para crear ingrediente personalizado desde el selector
  const [showNewIngredientModal, setShowNewIngredientModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState<NewIngredientData>({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  
  // ⭐ NUEVO: Estados para preparación y tips
  const [preparationSteps, setPreparationSteps] = useState<string[]>(['']);
  const [tips, setTips] = useState<string[]>(['']);
  const [showTips, setShowTips] = useState(false);
  
  // NUEVO: Estado para importador CSV
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [csvImporterType, setCSVImporterType] = useState<'ingredients' | 'meals'>('ingredients');
  
  // NUEVO: Estado para selección múltiple de ingredientes
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(new Set());
  
  // NUEVO: Estado para eliminar desde un número específico
  const [deleteFromNumber, setDeleteFromNumber] = useState<string>('');
  
  // Estados del formulario de comida (simplificado - solo nombre y tipos)
  const [mealFormData, setMealFormData] = useState({
    name: '',
    types: [] as MealType[]
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
    console.log('🔄 Cargando datos globales desde el servidor...');
    
    let meals = await api.getGlobalMeals();
    const ingredients = await api.getGlobalIngredients();
    
    console.log(`📊 Recibidos del servidor: ${meals.length} platos, ${ingredients.length} ingredientes`);
    
    // 🔄 MIGRACIÓN AUTOMÁTICA: Convertir platos viejos sin ingredientes
    const originalMealsCount = meals.length;
    meals = migrateMealsToStructured(meals);
    
    // Si se migraron platos, guardarlos automáticamente
    const hadMigrations = meals.some((meal: any) => meal._migrated);
    if (hadMigrations && originalMealsCount > 0) {
      console.log('💾 Guardando platos migrados en la base de datos...');
      await api.saveGlobalMeals(meals);
      console.log('✅ Platos migrados guardados correctamente');
    }
    
    // Si no hay datos en el backend, cargar los platos e ingredientes existentes de la app
    let allMeals = meals;
    let allIngredients = ingredients;
    
    if (meals.length === 0) {
      // Cargar SOLO platos con ingredientes detallados de mealsWithIngredients
      const existingMeals = [
        ...BREAKFASTS_FROM_DB,
        ...LUNCHES_FROM_DB,
        ...SNACKS_FROM_DB,
        ...DINNERS_FROM_DB
      ];
      allMeals = existingMeals;
      console.log('✅ Cargados', existingMeals.length, 'platos con ingredientes detallados desde hardcode');
    }
    
    if (ingredients.length === 0) {
      // Cargar ingredientes existentes de la app (sistema + personalizados)
      allIngredients = INGREDIENTS_DATABASE;
      console.log('✅ Cargados', INGREDIENTS_DATABASE.length, 'ingredientes del sistema desde hardcode');
    } else {
      console.log(`✅ Usando ${ingredients.length} ingredientes del servidor`);
    }
    
    // Organizar comidas por tipo
    const organized = {
      breakfast: allMeals.filter(m => m.type === 'breakfast' || (Array.isArray(m.type) && m.type.includes('breakfast'))),
      lunch: allMeals.filter(m => m.type === 'lunch' || (Array.isArray(m.type) && m.type.includes('lunch'))),
      snack: allMeals.filter(m => m.type === 'snack' || (Array.isArray(m.type) && m.type.includes('snack'))),
      dinner: allMeals.filter(m => m.type === 'dinner' || (Array.isArray(m.type) && m.type.includes('dinner')))
    };
    
    setGlobalMeals(organized);
    setGlobalIngredients(allIngredients);
    setIsLoading(false);
  };

  // Función para exportar ingredientes a CSV
  const exportIngredientsToCSV = () => {
    if (globalIngredients.length === 0) {
      alert('No hay ingredientes para exportar');
      return;
    }

    // Crear el contenido CSV
    const headers = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,porcion';
    const rows = globalIngredients.map(ing => {
      return `${ing.name},${ing.calories},${ing.protein},${ing.carbs},${ing.fat},${ing.category || 'general'},${ing.portion || '100g'}`;
    });
    
    const csvContent = headers + '\n' + rows.join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `fuelier_ingredientes_${timestamp}.csv`;
    
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exportados ${globalIngredients.length} ingredientes a CSV`);
  };

  // Función para exportar comidas a CSV
  const exportMealsToCSV = () => {
    const allMeals = [
      ...globalMeals.breakfast,
      ...globalMeals.lunch,
      ...globalMeals.snack,
      ...globalMeals.dinner
    ];

    if (allMeals.length === 0) {
      alert('No hay comidas para exportar');
      return;
    }

    // Crear el contenido CSV
    const headers = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,tipo';
    const rows = allMeals.map(meal => {
      const types = Array.isArray(meal.type) ? meal.type.join('|') : meal.type;
      return `${meal.name},${meal.calories},${meal.protein},${meal.carbs},${meal.fat},${meal.category || 'general'},${types}`;
    });
    
    const csvContent = headers + '\n' + rows.join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `fuelier_comidas_${timestamp}.csv`;
    
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exportadas ${allMeals.length} comidas a CSV`);
  };

  // Función para exportar ingredientes y comidas a Excel con dos hojas
  const exportToExcel = () => {
    if (globalIngredients.length === 0) {
      alert('No hay ingredientes para exportar');
      return;
    }

    // Preparar datos de ingredientes
    const ingredientsData = globalIngredients.map(ing => ({
      nombre: ing.name,
      calorias: ing.calories,
      proteinas: ing.protein,
      carbohidratos: ing.carbs,
      grasas: ing.fat,
      categoria: ing.category || 'general',
      porcion: ing.portion || '100g'
    }));

    // Preparar datos de comidas
    const allMeals = [
      ...globalMeals.breakfast,
      ...globalMeals.lunch,
      ...globalMeals.snack,
      ...globalMeals.dinner
    ];

    const mealsData = allMeals.map(meal => ({
      nombre: meal.name,
      calorias: meal.calories,
      proteinas: meal.protein,
      carbohidratos: meal.carbs,
      grasas: meal.fat,
      categoria: meal.category || 'general',
      tipo: Array.isArray(meal.type) ? meal.type.join('|') : meal.type
    }));

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Crear hoja de ingredientes
    const ingredientsSheet = XLSX.utils.json_to_sheet(ingredientsData);
    XLSX.utils.book_append_sheet(workbook, ingredientsSheet, 'Ingredientes');

    // Crear hoja de comidas
    const mealsSheet = XLSX.utils.json_to_sheet(mealsData);
    XLSX.utils.book_append_sheet(workbook, mealsSheet, 'Comidas');

    // Generar archivo
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `fuelier_datos_completos_${timestamp}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(workbook, filename);

    console.log(`✅ Exportados ${globalIngredients.length} ingredientes y ${allMeals.length} comidas a Excel`);
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
      breakfast: <Coffee className="w-5 h-5" />,
      lunch: <UtensilsCrossed className="w-5 h-5" />,
      snack: <Apple className="w-5 h-5" />,
      dinner: <Moon className="w-5 h-5" />
    };
    return icons[type];
  };

  // ==================== FUNCIONES DE INGREDIENTES PARA PLATOS ====================

  // Función auxiliar para buscar un ingrediente en todas las fuentes disponibles
  const findIngredientById = (ingredientId: string): DBIngredient | null => {
    // 1. Buscar en INGREDIENTS_DATABASE (hardcodeados)
    const fromDB = INGREDIENTS_DATABASE.find(ing => ing.id === ingredientId);
    if (fromDB) return fromDB;
    
    // 2. Buscar en globalIngredients (creados por admin en Supabase)
    const fromGlobal = globalIngredients.find(gi => gi.id === ingredientId);
    if (fromGlobal) {
      return {
        id: fromGlobal.id,
        name: fromGlobal.name,
        category: fromGlobal.category as any,
        caloriesPer100g: fromGlobal.calories,
        proteinPer100g: fromGlobal.protein,
        carbsPer100g: fromGlobal.carbs,
        fatPer100g: fromGlobal.fat,
        isCustom: false
      };
    }
    
    return null;
  };

  const handleAddIngredientToMeal = (ingredientId: string) => {
    // Verificar si ya está añadido
    if (selectedMealIngredients.some(si => si.ingredientId === ingredientId)) {
      alert('Este ingrediente ya está añadido');
      return;
    }

    // Añadir con cantidad por defecto de 100g
    setSelectedMealIngredients([
      ...selectedMealIngredients,
      { ingredientId, amountInGrams: 100 }
    ]);
    setShowIngredientSelector(false);
    setIngredientSearchTerm('');
  };

  const handleUpdateIngredientAmount = (ingredientId: string, newAmount: number) => {
    setSelectedMealIngredients(
      selectedMealIngredients.map(si =>
        si.ingredientId === ingredientId
          ? { ...si, amountInGrams: newAmount }
          : si
      )
    );
  };

  const handleRemoveIngredientFromMeal = (ingredientId: string) => {
    setSelectedMealIngredients(
      selectedMealIngredients.filter(si => si.ingredientId !== ingredientId)
    );
  };

  // Calcular macros totales desde los ingredientes seleccionados
  const calculatedMacros = useMemo(() => {
    if (selectedMealIngredients.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return calculateMacrosFromIngredients(selectedMealIngredients);
  }, [selectedMealIngredients]);

  // Filtrar ingredientes para el selector
  const filteredIngredients = useMemo(() => {
    // ⭐ FIXED: Combinar ingredientes hardcodeados + ingredientes globales de Supabase
    const allAvailableIngredients: DBIngredient[] = [
      ...INGREDIENTS_DATABASE,
      // Convertir globalIngredients (formato Ingredient) a DBIngredient
      ...globalIngredients.map(gi => ({
        id: gi.id,
        name: gi.name,
        category: gi.category as any,
        caloriesPer100g: gi.calories,
        proteinPer100g: gi.protein,
        carbsPer100g: gi.carbs,
        fatPer100g: gi.fat,
        isCustom: false
      }))
    ];
    
    // Eliminar duplicados por NOMBRE (case-insensitive) - prioriza ingredientes hardcodeados
    const seenNames = new Set<string>();
    const uniqueIngredients = allAvailableIngredients.filter(ing => {
      const nameLower = ing.name.toLowerCase();
      if (seenNames.has(nameLower)) {
        return false; // Ya existe, omitir duplicado
      }
      seenNames.add(nameLower);
      return true;
    });
    
    return uniqueIngredients.filter(ing =>
      ing.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
    );
  }, [ingredientSearchTerm, globalIngredients]);

  // ==================== FUNCIONES DE PREPARACIÓN Y TIPS ====================

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
    if (tips.length > 1) {
      setTips(tips.filter((_, i) => i !== index));
    }
  };

  const updateTip = (index: number, value: string) => {
    setTips(tips.map((tip, i) => 
      i === index ? value : tip
    ));
  };

  // ==================== FUNCIONES DE PLATOS ====================

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setMealFormData({
      name: meal.name,
      types: Array.isArray(meal.type) ? meal.type : [meal.type]
    });
    
    // Cargar ingredientes si tiene ingredientReferences
    if (meal.ingredientReferences && meal.ingredientReferences.length > 0) {
      setSelectedMealIngredients(
        meal.ingredientReferences.map(ref => ({
          ingredientId: ref.ingredientId,
          amountInGrams: ref.amountInGrams
        }))
      );
    } else {
      setSelectedMealIngredients([]);
    }
    
    // ⭐ NUEVO: Cargar preparación y tips
    setPreparationSteps(meal.preparationSteps && meal.preparationSteps.length > 0 ? meal.preparationSteps : ['']);
    setTips(meal.tips && meal.tips.length > 0 ? meal.tips : ['']);
    setShowTips(meal.tips && meal.tips.length > 0);
    
    setIsCreating(false);
  };

  const handleCreateMeal = () => {
    setEditingMeal(null);
    setMealFormData({
      name: '',
      types: [selectedMealType]
    });
    setSelectedMealIngredients([]);
    
    // ⭐ NUEVO: Limpiar preparación y tips
    setPreparationSteps(['']);
    setTips(['']);
    setShowTips(false);
    
    setIsCreating(true);
  };

  const toggleMealType = (type: MealType) => {
    setMealFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handleSaveMeal = async () => {
    if (!mealFormData.name) {
      alert('Por favor ingresa el nombre del plato');
      return;
    }

    if (mealFormData.types.length === 0) {
      alert('Por favor selecciona al menos un tipo de comida');
      return;
    }

    if (selectedMealIngredients.length === 0) {
      alert('Por favor añade al menos un ingrediente');
      return;
    }

    // Convertir SelectedIngredient[] a MealIngredientReference[]
    const ingredientReferences: MealIngredientReference[] = selectedMealIngredients.map(si => ({
      ingredientId: si.ingredientId,
      amountInGrams: si.amountInGrams
    }));

    // Generar ingredientes como strings para legacy
    const ingredientStrings = selectedMealIngredients.map(si => {
      const dbIng = findIngredientById(si.ingredientId);
      return dbIng ? `${si.amountInGrams}g ${dbIng.name}` : '';
    }).filter(s => s);

    const newMeal: Meal = {
      id: editingMeal ? editingMeal.id : `global-${Date.now()}`,
      name: mealFormData.name,
      type: mealFormData.types.length === 1 ? mealFormData.types[0] : mealFormData.types,
      calories: calculatedMacros.calories,
      protein: calculatedMacros.protein,
      carbs: calculatedMacros.carbs,
      fat: calculatedMacros.fat,
      ingredients: ingredientStrings,
      ingredientReferences: ingredientReferences, // ⭐ CLAVE: Referencias estructuradas
      baseQuantity: 1,
      isCustom: false,
      isGlobal: true,
      createdBy: user.email,
      // ⭐ NUEVO: Guardar preparación y tips (opcional)
      preparationSteps: preparationSteps.filter(step => step.trim()).length > 0 
        ? preparationSteps.filter(step => step.trim()) 
        : undefined,
      tips: tips.filter(tip => tip.trim()).length > 0 
        ? tips.filter(tip => tip.trim()) 
        : undefined
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
    handleCancel();
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

  // ==================== FUNCIONES DE INGREDIENTES ====================

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
    handleCancel();
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    if (confirm('¿Estás seguro de eliminar este ingrediente? Esto lo quitará para TODOS los usuarios.')) {
      const updatedIngredients = globalIngredients.filter(ing => ing.id !== ingredientId);
      
      await api.saveGlobalIngredients(updatedIngredients);
      await loadGlobalData();
    }
  };

  // ==================== FUNCIONES DE SELECCIÓN MÚLTIPLE ====================

  const toggleIngredientSelection = (ingredientId: string) => {
    setSelectedIngredientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const selectAllIngredients = () => {
    const allIds = new Set(globalIngredients.map(ing => ing.id));
    setSelectedIngredientIds(allIds);
  };

  const deselectAllIngredients = () => {
    setSelectedIngredientIds(new Set());
  };

  const handleDeleteSelectedIngredients = async () => {
    if (selectedIngredientIds.size === 0) {
      alert('No hay ingredientes seleccionados');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar ${selectedIngredientIds.size} ingrediente(s)? Esto lo quitará para TODOS los usuarios.`)) {
      const updatedIngredients = globalIngredients.filter(
        ing => !selectedIngredientIds.has(ing.id)
      );
      
      await api.saveGlobalIngredients(updatedIngredients);
      await loadGlobalData();
      setSelectedIngredientIds(new Set());
    }
  };

  const handleDeleteFromNumber = async () => {
    const startIndex = parseInt(deleteFromNumber);
    
    if (isNaN(startIndex) || startIndex < 1) {
      alert('Por favor ingresa un número válido (mayor a 0)');
      return;
    }

    if (startIndex > globalIngredients.length) {
      alert(`No hay ingredientes a partir del #${startIndex}. Total: ${globalIngredients.length}`);
      return;
    }

    const ingredientsToDelete = globalIngredients.length - startIndex + 1;
    
    if (confirm(`¿Estás seguro de eliminar ${ingredientsToDelete} ingrediente(s) desde el #${startIndex} hasta el #${globalIngredients.length}? Esto lo quitará para TODOS los usuarios.`)) {
      // Mantener solo los ingredientes antes del índice especificado
      const updatedIngredients = globalIngredients.slice(0, startIndex - 1);
      
      await api.saveGlobalIngredients(updatedIngredients);
      await loadGlobalData();
      setSelectedIngredientIds(new Set());
      setDeleteFromNumber('');
    }
  };

  const handleCancel = () => {
    setEditingMeal(null);
    setEditingIngredient(null);
    setIsCreating(false);
    setMealFormData({
      name: '',
      types: []
    });
    setSelectedMealIngredients([]);
    // ⭐ NUEVO: Limpiar preparación y tips
    setPreparationSteps(['']);
    setTips(['']);
    setShowTips(false);
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
    // Limpiar selección múltiple
    setSelectedIngredientIds(new Set());
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 sm:px-6 pt-10 sm:pt-12 pb-4 sm:pb-6 sticky top-0 z-20 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <button
              onClick={onBack}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Panel de Administración</h1>
              <p className="text-purple-100 text-[10px] sm:text-xs md:text-sm truncate">Gestiona platos e ingredientes globales • Sin límites</p>
            </div>
          </div>

          {/* Main Tabs - Comidas vs Ingredientes */}
          <div className="flex gap-2 mb-3 sm:mb-4">
            <button
              onClick={() => setAdminTab('meals')}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base active:scale-95 ${
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
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base active:scale-95 ${
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
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedMealType(type)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm active:scale-95 ${
                    selectedMealType === type
                      ? 'bg-white text-purple-600 font-semibold'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {getMealTypeIcon(type)}
                  <span className="hidden sm:inline whitespace-nowrap">{getMealTypeLabel(type)}</span>
                  <span className="bg-purple-600/20 px-1.5 py-0.5 rounded text-xs font-bold">
                    {globalMeals[type].length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Botón Descargar Documentación */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2 text-sm sm:text-base">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Documentación Técnica del Sistema</span>
              </h3>
              <p className="text-xs sm:text-sm text-indigo-700 line-clamp-2 sm:line-clamp-none">
                Descarga el PDF completo que documenta la arquitectura, lógica y funcionamiento del sistema
              </p>
            </div>
            <button
              onClick={generateSystemDocumentationPDF}
              className="sm:ml-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base active:scale-95"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Descargar PDF</span>
              <span className="sm:hidden">Descargar</span>
            </button>
          </div>
        </div>

        {/* Botón Crear Nuevo */}
        {adminTab === 'meals' && !isCreating && !editingMeal && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleCreateMeal}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg text-sm sm:text-base active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Crear Nuevo Plato
            </button>
            <button
              onClick={() => {
                setCSVImporterType('meals');
                setShowCSVImporter(true);
              }}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-sm sm:text-base active:scale-95"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Importar desde CSV
            </button>
            <button
              onClick={exportToExcel}
              disabled={globalIngredients.length === 0}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm sm:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Exportar Excel
            </button>
          </div>
        )}

        {adminTab === 'ingredients' && !isCreating && !editingIngredient && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleCreateIngredient}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg text-sm sm:text-base active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Crear Nuevo Ingrediente
            </button>
            <button
              onClick={() => {
                setCSVImporterType('ingredients');
                setShowCSVImporter(true);
              }}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-sm sm:text-base active:scale-95"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Importar desde CSV
            </button>
            <button
              onClick={exportToExcel}
              disabled={globalIngredients.length === 0}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm sm:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Exportar Excel
            </button>
          </div>
        )}

        {/* ==================== FORMULARIO DE EDICIÓN/CREACIÓN - PLATOS ==================== */}
        {adminTab === 'meals' && (editingMeal || isCreating) && (
          <div className="bg-white border-2 border-purple-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-xl font-bold text-neutral-800">
                {editingMeal ? 'Editar Plato Global' : 'Crear Nuevo Plato Global'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-neutral-400 hover:text-neutral-600 transition-colors active:scale-95"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Nombre del Plato */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                Nombre del Plato *
              </label>
              <input
                type="text"
                value={mealFormData.name}
                onChange={(e) => setMealFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Pollo a la Plancha con Arroz Integral"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Tipos de Comida */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                Tipos de Comida * (Selecciona uno o varios)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleMealType(type)}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
                      mealFormData.types.includes(type)
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {getMealTypeIcon(type)}
                    <span className="text-xs sm:text-sm">
                      {type === 'breakfast' && 'Desayuno'}
                      {type === 'lunch' && 'Comida'}
                      {type === 'snack' && 'Merienda'}
                      {type === 'dinner' && 'Cena'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredientes Seleccionados */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <label className="block text-xs sm:text-sm font-medium text-neutral-700">
                  Ingredientes * ({selectedMealIngredients.length})
                </label>
                <button
                  onClick={() => setShowIngredientSelector(true)}
                  className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Ingrediente
                </button>
              </div>

              {selectedMealIngredients.length === 0 ? (
                <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-4 sm:p-6 text-center">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-500 text-xs sm:text-sm">
                    No hay ingredientes añadidos. Haz clic en "Añadir Ingrediente" para empezar.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedMealIngredients.map((si) => {
                    const dbIng = findIngredientById(si.ingredientId);
                    if (!dbIng) return null;

                    // Calcular macros para esta cantidad
                    const factor = si.amountInGrams / 100;
                    const cals = Math.round(dbIng.caloriesPer100g * factor);
                    const prot = Math.round(dbIng.proteinPer100g * factor * 10) / 10;
                    const carb = Math.round(dbIng.carbsPer100g * factor * 10) / 10;
                    const fat = Math.round(dbIng.fatPer100g * factor * 10) / 10;

                    return (
                      <div key={si.ingredientId} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-800 text-sm sm:text-base truncate">{dbIng.name}</h4>
                            <p className="text-[10px] sm:text-xs text-neutral-500 truncate">
                              {cals} kcal • {prot}g prot • {carb}g carbs • {fat}g grasas
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveIngredientFromMeal(si.ingredientId)}
                            className="text-red-500 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                            aria-label="Eliminar ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs sm:text-sm text-neutral-600 font-medium">Cantidad:</label>
                          <input
                            type="number"
                            value={si.amountInGrams}
                            onChange={(e) => handleUpdateIngredientAmount(si.ingredientId, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-20 sm:w-24 px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-xs sm:text-sm text-neutral-600">g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Macros Calculados */}
            {selectedMealIngredients.length > 0 && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-emerald-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  📊 Macros Totales (calculados automáticamente)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white rounded-lg p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Calorías</p>
                    <p className="text-base sm:text-xl font-bold text-red-600">{calculatedMacros.calories}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Proteína</p>
                    <p className="text-base sm:text-xl font-bold text-blue-600">{calculatedMacros.protein}g</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Carbohidratos</p>
                    <p className="text-base sm:text-xl font-bold text-amber-600">{calculatedMacros.carbs}g</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-neutral-500 mb-0.5 sm:mb-1">Grasas</p>
                    <p className="text-base sm:text-xl font-bold text-orange-600">{calculatedMacros.fat}g</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preparación (Opcional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Preparación (Opcional)
              </label>
              <div className="space-y-3">
                {preparationSteps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updatePreparationStep(index, e.target.value)}
                      placeholder={`Paso ${index + 1} de la preparación...`}
                      className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {preparationSteps.length > 1 && (
                      <button
                        onClick={() => removePreparationStep(index)}
                        className="flex-shrink-0 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPreparationStep}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Añadir paso
                </button>
              </div>
            </div>

            {/* Tips (Opcional) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Tips y Consejos (Opcional)
                </label>
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {showTips ? 'Ocultar tips' : 'Añadir tips'}
                </button>
              </div>
              
              {showTips && (
                <div className="space-y-3 bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-8 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        💡
                      </div>
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => updateTip(index, e.target.value)}
                        placeholder={`Tip ${index + 1}...`}
                        className="flex-1 px-4 py-2.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {tips.length > 1 && (
                        <button
                          onClick={() => removeTip(index)}
                          className="flex-shrink-0 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTip}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir tip
                  </button>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6 border-t border-neutral-200">
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
                Guardar Plato
              </button>
            </div>
          </div>
        )}

        {/* Modal Selector de Ingredientes */}
        {showIngredientSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-neutral-800">Seleccionar Ingrediente</h2>
                  <button
                    onClick={() => {
                      setShowIngredientSelector(false);
                      setIngredientSearchTerm('');
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={ingredientSearchTerm}
                    onChange={(e) => setIngredientSearchTerm(e.target.value)}
                    placeholder="Buscar ingrediente..."
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  {filteredIngredients.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => handleAddIngredientToMeal(ing.id)}
                      className="w-full bg-neutral-50 hover:bg-purple-50 border border-neutral-200 hover:border-purple-300 rounded-xl p-4 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-800 mb-1">{ing.name}</h3>
                          <p className="text-xs text-neutral-500">
                            Por 100g: {ing.caloriesPer100g} kcal • {ing.proteinPer100g}g prot • {ing.carbsPer100g}g carbs • {ing.fatPer100g}g grasas
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-purple-600 flex-shrink-0 ml-3" />
                      </div>
                    </button>
                  ))}
                  {filteredIngredients.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 mb-2">No se encontraron ingredientes</p>
                      {ingredientSearchTerm && (
                        <>
                          <p className="text-sm text-neutral-400 mb-4">
                            Buscando: "{ingredientSearchTerm}"
                          </p>
                          <button
                            onClick={() => {
                              setNewIngredientData({ 
                                name: ingredientSearchTerm, 
                                calories: '',
                                protein: '',
                                carbs: '',
                                fat: ''
                              });
                              setShowNewIngredientModal(true);
                              setShowIngredientSelector(false);
                              setIngredientSearchTerm('');
                            }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            Crear "{ingredientSearchTerm}"
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Ingrediente Personalizado */}
        {showNewIngredientModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-neutral-800">Crear Ingrediente Personalizado</h2>
                  <button
                    onClick={() => {
                      setShowNewIngredientModal(false);
                      setNewIngredientData({
                        name: '',
                        calories: '',
                        protein: '',
                        carbs: '',
                        fat: ''
                      });
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nombre del Ingrediente *
                    </label>
                    <input
                      type="text"
                      value={newIngredientData.name}
                      onChange={(e) => setNewIngredientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Pan integral"
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
                      value={newIngredientData.calories}
                      onChange={(e) => setNewIngredientData(prev => ({ ...prev, calories: e.target.value }))}
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
                      value={newIngredientData.protein}
                      onChange={(e) => setNewIngredientData(prev => ({ ...prev, protein: e.target.value }))}
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
                      value={newIngredientData.carbs}
                      onChange={(e) => setNewIngredientData(prev => ({ ...prev, carbs: e.target.value }))}
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
                      value={newIngredientData.fat}
                      onChange={(e) => setNewIngredientData(prev => ({ ...prev, fat: e.target.value }))}
                      placeholder="24"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      setShowNewIngredientModal(false);
                      setNewIngredientData({
                        name: '',
                        calories: '',
                        protein: '',
                        carbs: '',
                        fat: ''
                      });
                    }}
                    className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-xl hover:bg-neutral-300 transition-all font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!newIngredientData.name) {
                        alert('Por favor completa al menos el nombre del ingrediente');
                        return;
                      }

                      const newIngredient: Ingredient = {
                        id: `global-ingredient-${Date.now()}`,
                        name: newIngredientData.name,
                        unit: 'g',
                        defaultAmount: 100,
                        calories: parseInt(newIngredientData.calories) || 0,
                        protein: parseInt(newIngredientData.protein) || 0,
                        carbs: parseInt(newIngredientData.carbs) || 0,
                        fat: parseInt(newIngredientData.fat) || 0,
                        category: 'otro',
                        isGlobal: true,
                        createdBy: user.email
                      };

                      let updatedIngredients: Ingredient[];
                      
                      // Crear nuevo ingrediente
                      updatedIngredients = [...globalIngredients, newIngredient];

                      // Guardar en Supabase
                      await api.saveGlobalIngredients(updatedIngredients);
                      
                      // Recargar datos
                      await loadGlobalData();

                      // Limpiar formulario
                      handleCancel();

                      // Cerrar modal
                      setShowNewIngredientModal(false);
                      setNewIngredientData({
                        name: '',
                        calories: '',
                        protein: '',
                        carbs: '',
                        fat: ''
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Guardar Ingrediente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FORMULARIO DE EDICIÓN/CREACIÓN - INGREDIENTES ==================== */}
        {adminTab === 'ingredients' && (editingIngredient || isCreating) && (
          <div className="bg-white border-2 border-purple-300 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-800">
                {editingIngredient ? 'Editar Ingrediente Global' : 'Crear Nuevo Ingrediente Global'}
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
                  placeholder="Ej: Pan integral"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Unidad *
                </label>
                <select
                  value={ingredientFormData.unit}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, unit: e.target.value as 'g' | 'ml' | 'unidades' }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="unidades">unidades</option>
                </select>
              </div>

              {/* Cantidad Predeterminada */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cantidad Predeterminada *
                </label>
                <input
                  type="number"
                  value={ingredientFormData.defaultAmount}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, defaultAmount: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
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
                  value={ingredientFormData.calories}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
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
                  value={ingredientFormData.protein}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
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
                  value={ingredientFormData.carbs}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, carbs: parseInt(e.target.value) || 0 }))}
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
                  value={ingredientFormData.fat}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, fat: parseInt(e.target.value) || 0 }))}
                  placeholder="24"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={ingredientFormData.category}
                  onChange={(e) => setIngredientFormData(prev => ({ ...prev, category: e.target.value as 'proteína' | 'carbohidrato' | 'grasa' | 'vegetal' | 'fruta' | 'lácteo' | 'cereal' | 'legumbre' | 'otro' }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="proteína">Proteína</option>
                  <option value="carbohidrato">Carbohidrato</option>
                  <option value="grasa">Grasa</option>
                  <option value="vegetal">Vegetal</option>
                  <option value="fruta">Fruta</option>
                  <option value="lácteo">Lácteo</option>
                  <option value="cereal">Cereal</option>
                  <option value="legumbre">Legumbre</option>
                  <option value="otro">Otro</option>
                </select>
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
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar Ingrediente
              </button>
            </div>
          </div>
        )}

        {/* ==================== LISTA DE PLATOS ==================== */}
        {adminTab === 'meals' && !isCreating && !editingMeal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {globalMeals[selectedMealType].map((meal, index) => (
              <div
                key={meal.id}
                className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg flex-shrink-0">
                        #{index + 1}
                      </span>
                      <h3 className="font-bold text-neutral-800 text-sm sm:text-base truncate">{meal.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-2">
                      <span className="bg-red-50 text-red-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium whitespace-nowrap">
                        {meal.calories} kcal
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium whitespace-nowrap">
                        {meal.protein}g prot
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium whitespace-nowrap">
                        {meal.carbs}g carbs
                      </span>
                      <span className="bg-orange-50 text-orange-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium whitespace-nowrap">
                        {meal.fat}g grasas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditMeal(meal)}
                      className="bg-blue-50 text-blue-600 p-1.5 sm:p-2 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                      aria-label="Editar plato"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="bg-red-50 text-red-600 p-1.5 sm:p-2 rounded-lg hover:bg-red-100 transition-colors active:scale-95"
                      aria-label="Eliminar plato"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {meal.ingredientReferences && meal.ingredientReferences.length > 0 && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-200">
                    <p className="text-[10px] sm:text-xs font-medium text-neutral-600 mb-1.5 sm:mb-2">Ingredientes:</p>
                    <div className="space-y-0.5 sm:space-y-1">
                      {meal.ingredientReferences.slice(0, 3).map((ref, i) => {
                        const dbIng = findIngredientById(ref.ingredientId);
                        return dbIng ? (
                          <div key={i} className="text-[10px] sm:text-xs text-neutral-600 truncate">
                            • {ref.amountInGrams}g de {dbIng.name}
                          </div>
                        ) : null;
                      })}
                      {meal.ingredientReferences.length > 3 && (
                        <div className="text-[10px] sm:text-xs text-neutral-500">
                          +{meal.ingredientReferences.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {globalMeals[selectedMealType].length === 0 && (
              <div className="sm:col-span-2 text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🍽️</div>
                <p className="text-neutral-500 text-sm sm:text-base mb-3 sm:mb-4">
                  No hay platos creados aún para {getMealTypeLabel(selectedMealType).toLowerCase()}
                </p>
                <button
                  onClick={handleCreateMeal}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto text-sm sm:text-base active:scale-95"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Crear Primer Plato
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== LISTA DE INGREDIENTES ==================== */}
        {adminTab === 'ingredients' && !isCreating && !editingIngredient && (
          <>
            {/* Barra de Herramientas de Selección */}
            {globalIngredients.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 space-y-3">
                {/* Primera fila: Selección */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllIngredients}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={deselectAllIngredients}
                      className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-all font-semibold text-sm"
                    >
                      Deseleccionar Todos
                    </button>
                  </div>
                  
                  {selectedIngredientIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-purple-700">
                        {selectedIngredientIds.size} seleccionado(s)
                      </span>
                      <button
                        onClick={handleDeleteSelectedIngredients}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold text-sm flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar Seleccionados
                      </button>
                    </div>
                  )}
                </div>

                {/* Segunda fila: Eliminar desde número específico */}
                <div className="pt-3 border-t border-purple-200">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm font-medium text-purple-700">
                      Eliminar desde el ingrediente #:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={globalIngredients.length}
                      value={deleteFromNumber}
                      onChange={(e) => setDeleteFromNumber(e.target.value)}
                      placeholder="Ej: 63"
                      className="w-24 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                      onClick={handleDeleteFromNumber}
                      disabled={!deleteFromNumber}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar desde #{deleteFromNumber || '?'}
                    </button>
                    <span className="text-xs text-purple-600">
                      Total: {globalIngredients.length} ingredientes
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalIngredients.map((ingredient, index) => {
                const isSelected = selectedIngredientIds.has(ingredient.id);
                return (
              <div
                key={ingredient.id}
                className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-white border-2 ${
                  isSelected ? 'border-purple-500 bg-purple-50' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox de selección */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleIngredientSelection(ingredient.id)}
                      className="mt-1 w-5 h-5 text-purple-600 border-neutral-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-neutral-800">{ingredient.name}</h3>
                      </div>
                      <div className="flex gap-2 text-xs mt-2">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded-lg font-medium">
                          {ingredient.calories} kcal
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {ingredient.protein}g prot
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">
                          {ingredient.carbs}g carbs
                        </span>
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-medium">
                          {ingredient.fat}g grasas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleEditIngredient(ingredient)}
                      className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
                );
              })}

            {globalIngredients.length === 0 && (
              <div className="md:col-span-2 text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-neutral-500">
                  No hay ingredientes creados aún
                </p>
                <button
                  onClick={handleCreateIngredient}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto"
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

      {/* CSV Importer Modal */}
      {showCSVImporter && (
        <CSVImporter
          type={csvImporterType}
          onClose={() => setShowCSVImporter(false)}
          onSuccess={async () => {
            setShowCSVImporter(false);
            // Pequeño delay adicional para asegurar que el servidor ha persistido completamente
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadGlobalData();
          }}
        />
      )}
    </div>
  );
}