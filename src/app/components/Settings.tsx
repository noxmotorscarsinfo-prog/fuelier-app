import { useState, useEffect } from 'react';
import { User, MacroGoals } from '../types';
import { ArrowLeft, User as UserIcon, Target, Mail, LogOut, Save, Scale, Ruler, Dumbbell, Heart, AlertTriangle, Calculator, Info, Zap, Check, Sliders, Clock, Globe, Calendar, X, Plus, Ban, TrendingDown, Minus, TrendingUp, Edit2, UtensilsCrossed, FlaskConical, ChefHat } from 'lucide-react';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacrosFromUser, mapUserGoalToInternalGoal } from '../utils/macroCalculations';
import PreferencesModal from './PreferencesModal';
import MacroDistributionTest from './MacroDistributionTest';

interface SettingsProps {
  user: User;
  onBack: () => void;
  onUpdateGoals: (goals: MacroGoals) => void;
  onUpdateProfile: (weight: number, height: number, trainingFrequency: number, settings?: { autoSaveDays?: boolean; timezone?: string }, age?: number, goal?: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain', mealsPerDay?: number, goals?: MacroGoals) => void;
  onUpdatePreferences?: (preferences: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }) => void; // NUEVA prop
  onNavigateToCustomMeals?: () => void; // NUEVA prop para navegar a Mis Comidas Personalizadas
  onLogout: () => void;
}

export default function Settings({ user, onBack, onUpdateGoals, onUpdateProfile, onUpdatePreferences, onNavigateToCustomMeals, onLogout }: SettingsProps) {
  const [weight, setWeight] = useState(user.weight);
  const [height, setHeight] = useState(user.height);
  const [age, setAge] = useState(user.age || 30);
  const [goal, setGoal] = useState<'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain'>(user.goal || 'maintenance');
  const [trainingFrequency, setTrainingFrequency] = useState(user.trainingFrequency);
  const [mealsPerDay, setMealsPerDay] = useState(user.mealsPerDay || 3); // NUEVO: Estado para número de comidas
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Settings
  const [autoSaveDays, setAutoSaveDays] = useState(user.settings?.autoSaveDays ?? false);
  const [timezone, setTimezone] = useState(user.settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);

  // NUEVO: Preferencias Alimenticias
  const [likes, setLikes] = useState<string[]>(user.preferences?.likes || []);
  const [dislikes, setDislikes] = useState<string[]>(user.preferences?.dislikes || []);
  const [intolerances, setIntolerances] = useState<string[]>(user.preferences?.intolerances || []);
  const [allergies, setAllergies] = useState<string[]>(user.preferences?.allergies || []);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [activePreferenceTab, setActivePreferenceTab] = useState<'likes' | 'dislikes' | 'intolerances' | 'allergies'>('likes');
  const [customPreferenceInput, setCustomPreferenceInput] = useState('');

  // NUEVO: Personalización de macros
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCalories, setCustomCalories] = useState(user.goals.calories);
  const [customProtein, setCustomProtein] = useState(user.goals.protein);
  const [customCarbs, setCustomCarbs] = useState(user.goals.carbs);
  const [customFat, setCustomFat] = useState(user.goals.fat);

  // NUEVO: Funciones para ajustar macros de forma proporcional
  const handleCaloriesChange = (newCalories: number) => {
    setCustomCalories(newCalories);
    
    // Calcular el factor de escala basado en el cambio de calorías
    const oldTotalCalories = (customProtein * 4) + (customCarbs * 4) + (customFat * 9);
    const scaleFactor = newCalories / oldTotalCalories;
    
    // Ajustar macros proporcionalmente
    setCustomProtein(Math.round((customProtein * scaleFactor) / 5) * 5);
    setCustomCarbs(Math.round((customCarbs * scaleFactor) / 5) * 5);
    setCustomFat(Math.round((customFat * scaleFactor) / 5) * 5);
  };

  const handleProteinChange = (newProtein: number) => {
    setCustomProtein(newProtein);
    
    // Recalcular calorías basadas en los macros
    const newCalories = (newProtein * 4) + (customCarbs * 4) + (customFat * 9);
    setCustomCalories(Math.round(newCalories / 10) * 10);
  };

  const handleCarbsChange = (newCarbs: number) => {
    setCustomCarbs(newCarbs);
    
    // Recalcular calorías basadas en los macros
    const newCalories = (customProtein * 4) + (newCarbs * 4) + (customFat * 9);
    setCustomCalories(Math.round(newCalories / 10) * 10);
  };

  const handleFatChange = (newFat: number) => {
    setCustomFat(newFat);
    
    // Recalcular calorías basadas en los macros
    const newCalories = (customProtein * 4) + (customCarbs * 4) + (newFat * 9);
    setCustomCalories(Math.round(newCalories / 10) * 10);
  };

  // NUEVO: Panel de pruebas
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Triple click para abrir panel de pruebas
  const handleTitleClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount === 2) {
      setShowTestPanel(true);
      setClickCount(0);
    }
    setTimeout(() => setClickCount(0), 2000);
  };

  const hasProfileChanges = 
    weight !== user.weight ||
    height !== user.height ||
    age !== user.age ||
    goal !== user.goal ||
    trainingFrequency !== user.trainingFrequency ||
    mealsPerDay !== user.mealsPerDay || // NUEVO: Detectar cambios en número de comidas
    autoSaveDays !== (user.settings?.autoSaveDays ?? false) ||
    timezone !== (user.settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);

  const handleSaveProfile = () => {
    // Crear usuario temporal con los nuevos valores para calcular macros
    const tempUser: User = {
      ...user,
      weight,
      height,
      age,
      goal,
      trainingFrequency,
      mealsPerDay
    };
    
    // Recalcular macros con los nuevos valores
    const newMacros = calculateMacrosFromUser(tempUser);
    
    // IMPORTANTE: Actualizar perfil Y macros en UNA SOLA actualización
    // Esto evita race conditions donde una actualización sobrescribe la otra
    onUpdateProfile(weight, height, trainingFrequency, { autoSaveDays, timezone }, age, goal, mealsPerDay, newMacros);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleResetProfile = () => {
    setWeight(user.weight);
    setHeight(user.height);
    setAge(user.age || 30);
    setGoal(user.goal || 'maintenance');
    setTrainingFrequency(user.trainingFrequency);
    setMealsPerDay(user.mealsPerDay || 3); // NUEVO: Resetear número de comidas
    setAutoSaveDays(user.settings?.autoSaveDays ?? false);
    setTimezone(user.settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  // NUEVO: Funciones para preferencias alimenticias
  const commonFoods = {
    likes: [
      'Pollo', 'Pavo', 'Pescado', 'Huevos', 'Carne roja',
      'Arroz', 'Pasta', 'Pan', 'Avena', 'Quinoa',
      'Brócoli', 'Espinacas', 'Aguacate', 'Tomate', 'Lechuga',
      'Plátano', 'Manzana', 'Fresas', 'Yogurt', 'Queso'
    ],
    dislikes: [
      'Pescado', 'Mariscos', 'Hígado', 'Champiñones',
      'Espinacas', 'Brócoli', 'Coliflor', 'Berenjena',
      'Queso', 'Yogurt', 'Huevos', 'Aguacate'
    ],
    intolerances: [
      'Lactosa', 'Gluten', 'Fructosa', 'Histamina',
      'Sorbitol', 'Cafeína'
    ],
    allergies: [
      'Frutos secos', 'Cacahuetes', 'Mariscos', 'Pescado',
      'Huevos', 'Leche', 'Soja', 'Trigo', 'Sésamo'
    ]
  };

  const getCurrentPreferenceList = () => {
    switch (activePreferenceTab) {
      case 'likes': return likes;
      case 'dislikes': return dislikes;
      case 'intolerances': return intolerances;
      case 'allergies': return allergies;
    }
  };

  const setCurrentPreferenceList = (items: string[]) => {
    switch (activePreferenceTab) {
      case 'likes': setLikes(items); break;
      case 'dislikes': setDislikes(items); break;
      case 'intolerances': setIntolerances(items); break;
      case 'allergies': setAllergies(items); break;
    }
  };

  const togglePreferenceItem = (item: string) => {
    const currentList = getCurrentPreferenceList();
    if (currentList.includes(item)) {
      setCurrentPreferenceList(currentList.filter(i => i !== item));
    } else {
      setCurrentPreferenceList([...currentList, item]);
    }
  };

  const addCustomPreferenceItem = () => {
    if (customPreferenceInput.trim()) {
      const currentList = getCurrentPreferenceList();
      if (!currentList.includes(customPreferenceInput.trim())) {
        setCurrentPreferenceList([...currentList, customPreferenceInput.trim()]);
      }
      setCustomPreferenceInput('');
    }
  };

  const handleSavePreferences = (preferences: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }) => {
    if (onUpdatePreferences) {
      onUpdatePreferences(preferences);
      setShowPreferencesModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Actualizar también el estado local para que se refleje inmediatamente
      setLikes(preferences.likes);
      setDislikes(preferences.dislikes);
      setIntolerances(preferences.intolerances);
      setAllergies(preferences.allergies);
    }
  };

  const hasPreferenceChanges = () => {
    const arraysEqual = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    return !arraysEqual(likes, user.preferences?.likes || []) ||
           !arraysEqual(dislikes, user.preferences?.dislikes || []) ||
           !arraysEqual(intolerances, user.preferences?.intolerances || []) ||
           !arraysEqual(allergies, user.preferences?.allergies || []);
  };

  const calculateBMI = () => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };
  
  // NUEVO: Calcular porcentaje de grasa corporal
  const calculateBodyFat = () => {
    const bmi = parseFloat(calculateBMI());
    // Fórmula de Deurenberg: % Grasa = (1.20 × IMC) + (0.23 × Edad) - (10.8 × Género) - 5.4
    // Género: Hombre = 1, Mujer = 0
    const genderValue = user.sex === 'male' ? 1 : 0;
    const bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * genderValue) - 5.4;
    return bodyFat.toFixed(1);
  };
  
  // Calcular TDEE y calorías objetivo con los valores actuales
  const tempUser: User = { ...user, weight, height, age, goal, trainingFrequency };
  
  // Calcular BMR, TDEE y objetivo de calorías
  const bmr = Math.round((10 * weight) + (6.25 * height) - (5 * age) + (user.sex === 'male' ? 5 : -161));
  const tempBMR = calculateBMR(user.sex, weight, height, age);
  const tdee = Math.round(calculateTDEE(tempBMR, trainingFrequency));
  const internalGoal = mapUserGoalToInternalGoal(goal);
  const targetCalories = calculateTargetCalories(tdee, internalGoal);
  const currentMacros = calculateMacrosFromUser(tempUser);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 sm:px-6 pt-10 sm:pt-12 pb-5 sm:pb-6 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <button
            onClick={onBack}
            className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold" onClick={handleTitleClick}>Configuración</h1>
            <p className="text-emerald-100 text-xs sm:text-sm truncate">Personaliza tu experiencia</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto pb-20">
        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 bg-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50 animate-slide-in">
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Cambios guardados</span>
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6 border border-neutral-200">
          <h3 className="mb-3 sm:mb-4 flex items-center gap-2 font-bold text-neutral-800">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            <span className="text-sm sm:text-base">Información Personal</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Mail className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-neutral-800">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <UserIcon className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Nombre</p>
                <p className="text-neutral-800">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Heart className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Sexo</p>
                <p className="text-neutral-800">{user.sex === 'male' ? '♂️ Hombre' : '♀️ Mujer'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Profile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-neutral-200">
          <h3 className="mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span>Perfil Físico</span>
          </h3>

          {/* TDEE Info Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-blue-100 text-xs mb-1">Tu TDEE Actual</p>
                <p className="text-3xl mb-1">{tdee}</p>
                <p className="text-xs text-blue-100">kcal/día</p>
              </div>
              <Zap className="w-8 h-8 text-blue-200" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-blue-100 text-xs">TMB</p>
                <p>{bmr} kcal</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-blue-100 text-xs">IMC</p>
                <p>{calculateBMI()}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-blue-100 text-xs">% Grasa</p>
                <p>{calculateBodyFat()}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Weight */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                Peso: {weight} kg
              </label>
              <input
                type="range"
                min="40"
                max="150"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>40 kg</span>
                <span>150 kg</span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                Altura: {height} cm
              </label>
              <input
                type="range"
                min="140"
                max="220"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>140 cm</span>
                <span>220 cm</span>
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Edad: {age} años
              </label>
              <input
                type="range"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>18 años</span>
                <span>100 años</span>
              </div>
            </div>

            {/* Training Frequency */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                Actividad: {trainingFrequency} días/semana
              </label>
              <input
                type="range"
                min="0"
                max="7"
                value={trainingFrequency}
                onChange={(e) => setTrainingFrequency(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>Sedentario</span>
                <span>7 días</span>
              </div>
              
              {/* Activity Factor Guide */}
              <div className="mt-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-blue-900 mb-2">📊 Factores de Actividad:</p>
                <div className={`text-xs px-2 py-1 rounded ${trainingFrequency === 0 ? 'bg-blue-500 text-white font-semibold' : 'text-blue-700'}`}>
                  • Sedentario (1.2): Poco o ningún ejercicio
                </div>
                <div className={`text-xs px-2 py-1 rounded ${trainingFrequency >= 1 && trainingFrequency <= 2 ? 'bg-blue-500 text-white font-semibold' : 'text-blue-700'}`}>
                  • Ligero (1.375): 1-2 entrenos/semana
                </div>
                <div className={`text-xs px-2 py-1 rounded ${trainingFrequency >= 3 && trainingFrequency <= 5 ? 'bg-blue-500 text-white font-semibold' : 'text-blue-700'}`}>
                  • Moderado (1.55): 3-5 entrenos/semana ⭐ Más común
                </div>
                <div className={`text-xs px-2 py-1 rounded ${trainingFrequency === 6 || trainingFrequency === 7 ? 'bg-blue-500 text-white font-semibold' : 'text-blue-700'}`}>
                  • Muy activo (1.725): 6-7 entrenos/semana
                </div>
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Objetivo: {goal === 'rapid_loss' ? 'Perder peso rápidamente' : goal === 'moderate_loss' ? 'Perder peso moderadamente' : goal === 'maintenance' ? 'Mantener peso' : goal === 'moderate_gain' ? 'Ganar músculo moderadamente' : 'Ganar músculo rápidamente'}
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain')}
                className="w-full h-10 bg-neutral-50 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rapid_loss">Perder peso rápidamente</option>
                <option value="moderate_loss">Perder peso moderadamente</option>
                <option value="maintenance">Mantener peso</option>
                <option value="moderate_gain">Ganar músculo moderadamente</option>
                <option value="rapid_gain">Ganar músculo rápidamente</option>
              </select>
            </div>

            {/* NUEVO: Número de comidas */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                Comidas al día: {mealsPerDay}
              </label>
              <input
                type="range"
                min="2"
                max="5"
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                <span>2 comidas</span>
                <span>5 comidas</span>
              </div>
              <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-700">
                  💡 <strong>Consejo:</strong> {
                    mealsPerDay === 2 ? 'Ideal para ayuno intermitente o comidas abundantes'
                    : mealsPerDay === 3 ? 'Lo más común: desayuno, comida y cena'
                    : mealsPerDay === 4 ? 'Incluye una merienda entre comidas principales'
                    : 'Perfecto para mantener energía constante durante el día'
                  }
                </p>
              </div>
            </div>
          </div>

          {hasProfileChanges && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Perfil</span>
              </button>
              <button
                onClick={handleResetProfile}
                className="px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all text-neutral-600"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* NUEVA SECCIÓN: Preferencias Alimenticias */}
        {onUpdatePreferences && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-neutral-200">
            <h3 className="mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <span>Preferencias Alimenticias</span>
            </h3>

            <p className="text-sm text-neutral-600 mb-4">
              Configura tus gustos para recibir recomendaciones más personalizadas
            </p>

            {/* Resumen de preferencias */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-emerald-700">Me gusta</p>
                </div>
                <p className="text-lg font-bold text-emerald-700">{likes.length}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <X className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-700">No me gusta</p>
                </div>
                <p className="text-lg font-bold text-red-700">{dislikes.length}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700">Intolerancias</p>
                </div>
                <p className="text-lg font-bold text-amber-700">{intolerances.length}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-orange-700">Alergias</p>
                </div>
                <p className="text-lg font-bold text-orange-700">{allergies.length}</p>
              </div>
            </div>

            <button
              onClick={() => setShowPreferencesModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              <span>Editar Preferencias</span>
            </button>
          </div>
        )}

        {/* NUEVA SECCIÓN: Mis Comidas Personalizadas */}
        {onNavigateToCustomMeals && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-neutral-200">
            <h3 className="mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-purple-600" />
              <span>Mis Comidas</span>
            </h3>

            <p className="text-sm text-neutral-600 mb-4">
              Crea y gestiona tus recetas personalizadas con macros exactos
            </p>

            <button
              onClick={onNavigateToCustomMeals}
              className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <ChefHat className="w-5 h-5" />
              <span>Mis Comidas Personalizadas</span>
            </button>
          </div>
        )}

        {/* Goals Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-neutral-200">
          <h3 className="mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span>Objetivos Nutricionales</span>
          </h3>

          <p className="text-sm text-neutral-600 mb-4">
            Elige tu objetivo nutricional o personaliza tus macros manualmente
          </p>

          {/* Toggle: Predefinido vs Personalizado */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                !isCustomMode
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="text-sm">Objetivos Predefinidos</span>
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                isCustomMode
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Personalizar</span>
            </button>
          </div>

          {/* MODO: Objetivos Predefinidos */}
          {!isCustomMode && (
            <div className="space-y-3">
              {/* Pérdida Rápida */}
              <button
                onClick={() => setGoal('rapid_loss')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  goal === 'rapid_loss'
                    ? 'border-red-500 bg-red-50'
                    : 'border-neutral-200 bg-white hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🔥🔥</div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">Perder Peso Rápidamente</h4>
                      <p className="text-xs text-neutral-500">Déficit del 20% (-{Math.round(tdee * 0.2)} kcal)</p>
                    </div>
                  </div>
                  {goal === 'rapid_loss' && (
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>

              {/* Pérdida Moderada */}
              <button
                onClick={() => setGoal('moderate_loss')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  goal === 'moderate_loss'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-neutral-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl"></div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">Perder Peso Moderadamente</h4>
                      <p className="text-xs text-neutral-500">Déficit del 15% (-{Math.round(tdee * 0.15)} kcal)</p>
                    </div>
                  </div>
                  {goal === 'moderate_loss' && (
                    <div className="bg-orange-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>

              {/* Mantenimiento */}
              <button
                onClick={() => setGoal('maintenance')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  goal === 'maintenance'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-neutral-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">⚖️</div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">Mantener Peso</h4>
                      <p className="text-xs text-neutral-500">Sin déficit ni superávit (±0 kcal)</p>
                    </div>
                  </div>
                  {goal === 'maintenance' && (
                    <div className="bg-emerald-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>

              {/* Ganancia Moderada */}
              <button
                onClick={() => setGoal('moderate_gain')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  goal === 'moderate_gain'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💪</div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">Ganar Músculo Moderadamente</h4>
                      <p className="text-xs text-neutral-500">Superávit del 10% (+{Math.round(tdee * 0.1)} kcal)</p>
                    </div>
                  </div>
                  {goal === 'moderate_gain' && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>

              {/* Ganancia Rápida */}
              <button
                onClick={() => setGoal('rapid_gain')}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  goal === 'rapid_gain'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-neutral-200 bg-white hover:border-violet-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💪💪</div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">Ganar Músculo Rápidamente</h4>
                      <p className="text-xs text-neutral-500">Superávit del 15% (+{Math.round(tdee * 0.15)} kcal)</p>
                    </div>
                  </div>
                  {goal === 'rapid_gain' && (
                    <div className="bg-violet-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>

              {/* Resumen de macros del objetivo seleccionado */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 mt-4">
                <h4 className="text-sm text-emerald-800 mb-3 font-semibold">Macros calculados para tu objetivo</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xl text-emerald-600 font-bold">{targetCalories}</p>
                    <p className="text-xs text-neutral-500 mt-1">kcal</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xl text-blue-600 font-bold">{currentMacros.protein}g</p>
                    <p className="text-xs text-neutral-500 mt-1">Prot</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xl text-amber-600 font-bold">{currentMacros.carbs}g</p>
                    <p className="text-xs text-neutral-500 mt-1">Carb</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xl text-orange-600 font-bold">{currentMacros.fat}g</p>
                    <p className="text-xs text-neutral-500 mt-1">Grasa</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO: Personalización Manual */}
          {isCustomMode && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-800">
                    Personaliza tus macros manualmente. El sistema detectará automáticamente qué objetivo nutricional corresponde a los valores que establezcas.
                  </p>
                </div>
              </div>

              {/* Input de Calorías */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Calorías Diarias
                  </span>
                  <span className="text-lg font-bold text-emerald-600">{customCalories} kcal</span>
                </label>
                <input
                  type="range"
                  min={Math.round(tdee * 0.7)}
                  max={Math.round(tdee * 1.3)}
                  step="10"
                  value={customCalories}
                  onChange={(e) => handleCaloriesChange(Number(e.target.value))}
                  className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>{Math.round(tdee * 0.7)} kcal</span>
                  <span className="text-blue-600 font-semibold">TDEE: {tdee}</span>
                  <span>{Math.round(tdee * 1.3)} kcal</span>
                </div>
              </div>

              {/* Input de Proteína */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Proteína
                  </span>
                  <span className="text-lg font-bold text-blue-600">{customProtein}g</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="5"
                  value={customProtein}
                  onChange={(e) => handleProteinChange(Number(e.target.value))}
                  className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>50g</span>
                  <span className="text-blue-600 font-semibold">{(customProtein / weight).toFixed(1)}g/kg</span>
                  <span>300g</span>
                </div>
              </div>

              {/* Input de Carbohidratos */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    Carbohidratos
                  </span>
                  <span className="text-lg font-bold text-amber-600">{customCarbs}g</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="5"
                  value={customCarbs}
                  onChange={(e) => handleCarbsChange(Number(e.target.value))}
                  className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>50g</span>
                  <span className="text-amber-600 font-semibold">{Math.round((customCarbs * 4 / customCalories) * 100)}% calorías</span>
                  <span>500g</span>
                </div>
              </div>

              {/* Input de Grasas */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    Grasas
                  </span>
                  <span className="text-lg font-bold text-orange-600">{customFat}g</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="150"
                  step="5"
                  value={customFat}
                  onChange={(e) => handleFatChange(Number(e.target.value))}
                  className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>30g</span>
                  <span className="text-orange-600 font-semibold">{Math.round((customFat * 9 / customCalories) * 100)}% calorías</span>
                  <span>150g</span>
                </div>
              </div>

              {/* Mensaje de detección de objetivo */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm text-purple-800 font-semibold mb-1">Objetivo detectado</h5>
                    <p className="text-sm text-purple-700">
                      {(() => {
                        const deficitPercent = ((tdee - customCalories) / tdee) * 100;
                        if (deficitPercent >= 18) {
                          return '🔥🔥 Estos macros corresponden a Pérdida Rápida de Peso (déficit ~20%)';
                        } else if (deficitPercent >= 12) {
                          return '🔥 Estos macros corresponden a Pérdida Moderada de Peso (déficit ~15%)';
                        } else if (deficitPercent >= 5) {
                          return '📉 Estos macros corresponden a un déficit ligero';
                        } else if (deficitPercent <= -13) {
                          return '💪💪 Estos macros corresponden a Ganancia Muscular Rápida (superávit ~15%)';
                        } else if (deficitPercent <= -8) {
                          return '💪 Estos macros corresponden a Ganancia Muscular Moderada (superávit ~10%)';
                        } else if (deficitPercent <= -3) {
                          return '📈 Estos macros corresponden a un superávit ligero';
                        } else {
                          return '⚖️ Estos macros corresponden a Mantenimiento de Peso';
                        }
                      })()}
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      Diferencia con TDEE: {customCalories - tdee > 0 ? '+' : ''}{customCalories - tdee} kcal ({((customCalories - tdee) / tdee * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de aplicar macros personalizados */}
              <button
                onClick={() => {
                  onUpdateGoals({
                    calories: customCalories,
                    protein: customProtein,
                    carbs: customCarbs,
                    fat: customFat
                  });
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Save className="w-5 h-5" />
                <span>Aplicar Macros Personalizados</span>
              </button>
            </div>
          )}
        </div>

        {/* System Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-neutral-200">
          <h3 className="mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <span>Configuración del Sistema</span>
          </h3>

          {/* Auto Save Days */}
          <div className="mb-4">
            <button
              onClick={() => setAutoSaveDays(!autoSaveDays)}
              className="w-full p-4 rounded-xl border-2 border-neutral-200 bg-white hover:border-emerald-300 transition-all flex items-center gap-3"
            >
              <div className={`p-2 rounded-xl ${autoSaveDays ? 'bg-emerald-500' : 'bg-neutral-100'}`}>
                <Clock className={`w-5 h-5 ${autoSaveDays ? 'text-white' : 'text-neutral-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm text-neutral-800">Guardado Automático de Días</h4>
                <p className="text-xs text-neutral-500">Guardar automáticamente cada día a las 23:59 de tu zona horaria</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${autoSaveDays ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-300'}`}>
                {autoSaveDays && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          </div>

          {/* Timezone Display */}
          <div className="mb-4">
            <div className="p-4 rounded-xl border-2 border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-200">
                  <Globe className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm text-neutral-800">Zona Horaria Detectada</h4>
                  <p className="text-xs text-neutral-500">{timezone}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Hora actual: {new Date().toLocaleTimeString('es-ES', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          {autoSaveDays && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-500 rounded-xl p-2 flex-shrink-0">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h5 className="text-sm text-emerald-800 mb-1">Guardado Automático Activado</h5>
                  <p className="text-xs text-emerald-700">
                    Tu día se guardará automáticamente en el calendario cada noche a las <strong>23:59</strong> según tu zona horaria ({timezone}). \n
                    Esto significa que tus macros, comidas y peso del día quedarán registrados en el historial sin que tengas que hacerlo manualmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {(autoSaveDays !== (user.settings?.autoSaveDays ?? false)) && (
            <button
              onClick={handleSaveProfile}
              className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full bg-red-50 border border-red-200 text-red-600 py-4 rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <PreferencesModal
          likes={likes}
          dislikes={dislikes}
          intolerances={intolerances}
          allergies={allergies}
          onSave={handleSavePreferences}
          onClose={() => setShowPreferencesModal(false)}
        />
      )}

      {/* Macro Distribution Test Panel */}
      {showTestPanel && (
        <MacroDistributionTest
          onClose={() => setShowTestPanel(false)}
        />
      )}
    </div>
  );
}