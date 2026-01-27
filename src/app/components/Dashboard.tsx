import { DailyLog, MealType, User, BugReport, MealDistribution } from '../types';
import { Flame, Beef, Wheat, Droplet, Plus, BarChart3, History, RotateCcw, Settings as SettingsIcon, User as UserIcon, Target, Zap, TrendingUp, Calendar, Award, Coffee, Save, CheckCircle, UtensilsCrossed, ChefHat, Scale, Users, Share2, Heart, BookmarkCheck, HelpCircle, X, Bug, Send, AlertCircle, MessageSquare, Shield, Sparkles, PieChart, Dumbbell, FileText } from 'lucide-react';
import { calculateAllGoals } from '../utils/macroCalculations';
import { getActiveMealTypes } from '../utils/mealDistribution';
import { useState, useEffect, useRef } from 'react';
import Chatbot from './Chatbot';
import MacroCompletionRecommendations from './MacroCompletionRecommendations';
import BugReportWidget from './BugReportWidget';
import ComplementaryMealsWidget from './ComplementaryMealsWidget';
import MealDistributionModal from './MealDistributionModal';
import WeightTracking from './WeightTracking';
import { analyzeProgress, detectMetabolicAdaptation } from '../utils/adaptiveSystem';
import ProgressHub from './ProgressHub';
import WeeklyProgressWidget from './WeeklyProgressWidget';
import { TrainingOnboarding } from './TrainingOnboarding';
import { TrainingDashboardNew } from './TrainingDashboardNew';
import * as api from '../utils/api';

interface DashboardProps {
  user: User;
  currentLog: DailyLog;
  dailyLogs: DailyLog[];
  onAddMeal: (type: MealType) => void;
  onNavigateToSummary: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onAddExtraFood: () => void;
  onResetDay: () => void;
  onSaveDay: () => void;
  onUpdateWeight: (weight: number, date: string) => void; // ACTUALIZADO: Ahora recibe fecha también
  onOpenSavedDiets: () => void;
  onOpenAdmin?: () => void;
  onOpenTechnicalDocs?: () => void;
  onSubmitBugReport: (report: Omit<BugReport, 'id' | 'userId' | 'userEmail' | 'userName' | 'createdAt' | 'status'>) => void;
  onAddExtraFoodDirect: (food: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onNavigateToCreateMeal?: () => void; // Nueva prop para navegar a crear plato
  onAddComplementaryMeals?: (meals: any[]) => void; // Nueva prop para añadir comidas complementarias
  onRemoveComplementaryMeal?: (index: number) => void; // Nueva prop para eliminar comida complementaria
  onViewMealDetail?: (type: MealType) => void; // NUEVA: Ver detalle de comida existente
  onUpdateMealDistribution?: (distribution: MealDistribution) => void; // NUEVA: Actualizar distribución de comidas
  onUpdateUser?: (updatedUser: User) => void; // NUEVA: Actualizar usuario completo
}

export default function Dashboard({
  user,
  currentLog,
  dailyLogs,
  onAddMeal,
  onViewMealDetail,
  onNavigateToSummary,
  onNavigateToHistory,
  onNavigateToSettings,
  onAddExtraFood,
  onResetDay,
  onSaveDay,
  onUpdateWeight,
  onOpenSavedDiets,
  onOpenAdmin,
  onOpenTechnicalDocs,
  onSubmitBugReport,
  onAddExtraFoodDirect,
  onNavigateToCreateMeal,
  onAddComplementaryMeals,
  onRemoveComplementaryMeal,
  onUpdateMealDistribution,
  onUpdateUser
}: DashboardProps) {
  console.log('📊 Dashboard - Datos recibidos:');
  console.log('user:', user);
  console.log('user.goals:', user.goals);
  console.log('currentLog:', currentLog);
  
  const [weightInput, setWeightInput] = useState<string>(currentLog.weight?.toString() || '');
  const [showWeightSaved, setShowWeightSaved] = useState(false);
  const [showMetabolismInfo, setShowMetabolismInfo] = useState(false);
  const [showMacrosUpdated, setShowMacrosUpdated] = useState(false);
  const [showMacroRecommendations, setShowMacroRecommendations] = useState(false);
  const [selectedComplementaryMeals, setSelectedComplementaryMeals] = useState<any[]>([]); // Comidas seleccionadas en el popup
  const [showMealDistributionModal, setShowMealDistributionModal] = useState(false); // NUEVO: Modal de distribución de comidas
  const [macroRecommendationShownToday, setMacroRecommendationShownToday] = useState(false); // NUEVO: Controla si ya se mostró el modal de recomendaciones hoy
  const prevDinnerRef = useRef<any>(null); // NUEVO: Ref para detectar cambio en la cena
  const [showWeightTracking, setShowWeightTracking] = useState(false); // NUEVO: Modal de tracking de peso
  const [showAdaptiveAlert, setShowAdaptiveAlert] = useState(false); // NUEVO: Alerta de ajuste automático
  const [showProgressHub, setShowProgressHub] = useState(false); // NUEVO: Centro de progreso unificado
  const [activeTab, setActiveTab] = useState<'diet' | 'training'>('diet'); // NUEVO: Tab activo (Dieta/Entrenamiento)

  // NUEVO: Estado para entrenamiento
  const [trainingOnboarded, setTrainingOnboarded] = useState(user.trainingOnboarded || false);
  const [trainingDays, setTrainingDays] = useState(user.trainingDays || 0);
  const [weekPlan, setWeekPlan] = useState<any[]>([]); // Se carga dinámicamente desde Supabase
  const [showTrainingOnboarding, setShowTrainingOnboarding] = useState(false); // NUEVO: Modal de onboarding
  const [isLoadingTrainingPlan, setIsLoadingTrainingPlan] = useState(false); // NUEVO: Estado de carga

  // NUEVO: Obtener tipos de comidas activas según configuración del usuario
  const activeMealTypes = getActiveMealTypes(user.mealsPerDay || 3, user.mealStructure);
  const totalActiveMeals = activeMealTypes.length;

  // NUEVO: Cargar plan de entrenamiento desde Supabase cuando el componente monta
  useEffect(() => {
    const loadTrainingPlan = async () => {
      if (!trainingOnboarded || !user.email) return;
      
      // Evitar recargas innecesarias si ya tenemos el plan
      if (weekPlan.length > 0) return;
      
      setIsLoadingTrainingPlan(true);
      try {
        console.log('[Dashboard] 🏋️ Cargando plan de entrenamiento desde Supabase...');
        const savedPlan = await api.getTrainingPlan(user.email);
        
        if (savedPlan && Array.isArray(savedPlan) && savedPlan.length > 0) {
          // Validar estructura
          const isValidPlan = savedPlan.every(day => 
            day && 
            typeof day === 'object' && 
            'dayName' in day && 
            'exercises' in day && 
            Array.isArray(day.exercises)
          );
          
          if (isValidPlan) {
            console.log('[Dashboard] ✅ Plan cargado:', savedPlan.length, 'días');
            setWeekPlan(savedPlan);
            setTrainingDays(savedPlan.length);
          } else {
            console.warn('[Dashboard] ⚠️ Plan tiene estructura inválida');
          }
        } else {
          console.log('[Dashboard] ℹ️ No hay plan guardado');
        }
      } catch (error) {
        console.error('[Dashboard] ❌ Error cargando plan:', error);
      } finally {
        setIsLoadingTrainingPlan(false);
      }
    };
    
    loadTrainingPlan();
  }, [trainingOnboarded, user.email]); // Solo ejecutar cuando cambia trainingOnboarded o email

  // NUEVO: Efecto para detectar cuando se completa la cena y mostrar el modal de macros complementarios
  // SOLO SE MUESTRA UNA VEZ después de la cena
  useEffect(() => {
    // Solo verificar si:
    // 1. La cena acaba de ser registrada (existe currentLog.dinner)
    // 2. No se ha mostrado el modal hoy (no insistir si lo rechazó)
    // 3. Los goals están definidos
    if (
      currentLog.dinner && 
      prevDinnerRef.current !== currentLog.dinner &&
      !macroRecommendationShownToday &&
      user.goals?.calories
    ) {
      // Actualizar la ref
      prevDinnerRef.current = currentLog.dinner;
      
      // Calcular macros consumidos
      const consumed = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      
      // Sumar todas las comidas activas del día
      activeMealTypes.forEach(type => {
        const meal = currentLog[type];
        if (meal) {
          consumed.calories += meal.calories || 0;
          consumed.protein += meal.protein || 0;
          consumed.carbs += meal.carbs || 0;
          consumed.fat += meal.fat || 0;
        }
      });
      
      // Incluir comidas extra si existen
      if (currentLog.extraFoods) {
        currentLog.extraFoods.forEach(extra => {
          consumed.calories += extra.calories || 0;
          consumed.protein += extra.protein || 0;
          consumed.carbs += extra.carbs || 0;
          consumed.fat += extra.fat || 0;
        });
      }
      
      // Calcular calorías restantes
      const caloriesRemaining = user.goals.calories - consumed.calories;
      
      // Solo mostrar si faltan al menos 150 kcal (umbral razonable)
      const shouldShowModal = caloriesRemaining >= 150;
      
      if (shouldShowModal) {
        // Marcar que ya se mostró el modal hoy
        setMacroRecommendationShownToday(true);
        // Abrir el modal automáticamente
        setShowMacroRecommendations(true);
      } else {
        // Si no se necesita mostrar, marcar como mostrado para no volver a intentar
        setMacroRecommendationShownToday(true);
      }
    }
  }, [currentLog.dinner, macroRecommendationShownToday, user.goals?.calories]);

  const calculateTotals = () => {
    // Solo sumar las comidas activas según configuración del usuario
    const baseTotals = activeMealTypes.reduce(
      (acc, type) => {
        const meal = currentLog[type];
        if (meal) {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Añadir comidas complementarias
    if (currentLog.complementaryMeals && currentLog.complementaryMeals.length > 0) {
      currentLog.complementaryMeals.forEach(meal => {
        baseTotals.calories += meal.calories;
        baseTotals.protein += meal.protein;
        baseTotals.carbs += meal.carbs;
        baseTotals.fat += meal.fat;
      });
    }

    // ✅ NUEVO: Añadir comidas extra
    if (currentLog.extraFoods && currentLog.extraFoods.length > 0) {
      currentLog.extraFoods.forEach(extra => {
        baseTotals.calories += extra.calories;
        baseTotals.protein += extra.protein;
        baseTotals.carbs += extra.carbs;
        baseTotals.fat += extra.fat;
      });
    }

    return baseTotals;
  };

  const totals = calculateTotals();
  const goals = user.goals || { calories: 2000, protein: 150, carbs: 200, fat: 65 }; // Default goals
  
  // ✅ VERIFICACIÓN: Si el día está completo, mostrar resumen de precisión
  useEffect(() => {
    if (!user.goals) return; // Skip if no goals
    const allMealsComplete = activeMealTypes.every(type => currentLog[type]);
    if (allMealsComplete) {
      console.log('\n┌─────────────────────────────────────────────────────┐');
      console.log('│  ✅ DÍA COMPLETO - VERIFICACIÓN FINAL               │');
      console.log('├─────────────────────────────────────────────────────┤');
      console.log('│  COMIDAS DEL DÍA:                                   │');
      activeMealTypes.forEach(type => {
        const meal = currentLog[type];
        if (meal) {
          const label = type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Comida' : type === 'snack' ? 'Merienda' : 'Cena';
          console.log(`│  • ${label.padEnd(9)}: ${meal.calories} kcal, ${meal.protein}g prot`.padEnd(54) + '│');
        }
      });
      console.log('├─────────────────────────────────────────────────────┤');
      console.log('│  TOTAL CONSUMIDO:                                   │');
      console.log(`│  • Calorías:  ${totals.calories} kcal`.padEnd(54) + '│');
      console.log(`│  • Proteína:  ${totals.protein.toFixed(1)}g`.padEnd(54) + '│');
      console.log(`│  • Carbos:    ${totals.carbs.toFixed(1)}g`.padEnd(54) + '│');
      console.log(`│  • Grasas:    ${totals.fat.toFixed(1)}g`.padEnd(54) + '│');
      console.log('├─────────────────────────────────────────────────────┤');
      console.log('│  OBJETIVO DEL DÍA:                                  │');
      console.log(`│  • Calorías:  ${user.goals.calories} kcal`.padEnd(54) + '│');
      console.log(`│  • Proteína:  ${user.goals.protein}g`.padEnd(54) + '│');
      console.log(`│  • Carbos:    ${user.goals.carbs}g`.padEnd(54) + '│');
      console.log(`│  • Grasas:    ${user.goals.fat}g`.padEnd(54) + '│');
      console.log('├─────────────────────────────────────────────────────┤');
      console.log('│  DIFERENCIA (Consumido - Objetivo):                 │');
      
      const diffCal = totals.calories - user.goals.calories;
      const diffProt = totals.protein - user.goals.protein;
      const diffCarbs = totals.carbs - user.goals.carbs;
      const diffFat = totals.fat - user.goals.fat;
      
      const formatDiff = (diff: number, decimals: number = 0) => {
        const rounded = decimals > 0 ? diff.toFixed(decimals) : diff.toString();
        return diff > 0 ? `+${rounded}` : rounded;
      };
      
      console.log(`│  • Calorías:  ${formatDiff(diffCal)} kcal ${Math.abs(diffCal) === 0 ? '⭐ PERFECTO' : ''}`.padEnd(60) + '│');
      console.log(`│  • Proteína:  ${formatDiff(diffProt, 1)}g ${Math.abs(diffProt) < 1 ? '⭐ PERFECTO' : ''}`.padEnd(60) + '│');
      console.log(`│  • Carbos:    ${formatDiff(diffCarbs, 1)}g ${Math.abs(diffCarbs) < 5 ? '✅ Excelente' : ''}`.padEnd(60) + '│');
      console.log(`│  • Grasas:    ${formatDiff(diffFat, 1)}g ${Math.abs(diffFat) < 3 ? '✅ Excelente' : ''}`.padEnd(60) + '│');
      console.log('└─────────────────────────────────────────────────────┘\n');
    }
  }, [activeMealTypes, currentLog, totals, user.goals]);
  
  console.log('📊 DEBUG Dashboard:');
  console.log('user:', user);
  console.log('user.goals:', user.goals);
  console.log('goals.calories:', goals?.calories);
  console.log('goals.protein:', goals?.protein);
  console.log('goals.carbs:', goals?.carbs);
  console.log('goals.fat:', goals?.fat);

  // Calcular TDEE actual
  const calculations = calculateAllGoals(user.sex, user.weight, user.height, user.trainingFrequency, user.age);

  // Calcular comidas activas registradas
  const activeMealsLogged = activeMealTypes.filter(type => currentLog[type] !== null).length;

  // Calcular porcentajes
  const caloriesPercent = (totals.calories / goals.calories) * 100;
  const proteinPercent = (totals.protein / goals.protein) * 100;
  const carbsPercent = (totals.carbs / goals.carbs) * 100;
  const fatPercent = (totals.fat / goals.fat) * 100;

  // Calcular puntuación de un día
  const calculateDayScore = (log: DailyLog) => {
    // Sumar todas las comidas que existan en el log (para compatibilidad con logs antiguos)
    const allMealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
    const dayTotals = allMealTypes.reduce(
      (acc, type) => {
        const meal = log[type];
        if (meal) {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    const caloriesScore = Math.min((dayTotals.calories / goals.calories) * 100, 100);
    const proteinScore = Math.min((dayTotals.protein / goals.protein) * 100, 100);
    const carbsScore = Math.min((dayTotals.carbs / goals.carbs) * 100, 100);
    const fatScore = Math.min((dayTotals.fat / goals.fat) * 100, 100);
    
    return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 90) return 'border-green-500';
    if (score >= 70) return 'border-emerald-500';
    if (score >= 50) return 'border-yellow-500';
    if (score >= 30) return 'border-orange-500';
    return 'border-red-500';
  };

  // Obtener los últimos 7 días
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const log = dailyLogs?.find(l => l.date === dateString);
      
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: date.getDate(),
        log,
        isToday: i === 0
      });
    }
    
    return days;
  };

  const last7Days = getLast7Days();

  const getMealLabel = (type: MealType) => {
    const labels = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      snack: 'Merienda',
      dinner: 'Cena'
    };
    return labels[type];
  };

  const getMealIcon = (type: MealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🍽️',
      snack: '🍎',
      dinner: '🌙'
    };
    return icons[type];
  };

  const renderMealCard = (type: MealType) => {
    const meal = currentLog[type];
    
    if (!meal) {
      return (
        <button
          onClick={() => onAddMeal(type)}
          className="w-full bg-white border-2 border-dashed border-neutral-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-2 text-neutral-400 group-hover:text-emerald-600 transition-colors">
            <span className="text-xl sm:text-2xl">{getMealIcon(type)}</span>
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Agregar {getMealLabel(type)}</span>
          </div>
        </button>
      );
    }

    return (
      <div
        onClick={() => onViewMealDetail?.(type)}
        className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
      >
        <div className="flex justify-between items-start mb-2.5 sm:mb-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">{getMealIcon(type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-emerald-600 uppercase tracking-wide font-medium">{getMealLabel(type)}</p>
              <h3 className="mt-0.5 sm:mt-1 text-sm sm:text-base font-medium text-neutral-800 group-hover:text-emerald-600 transition-colors truncate">{meal.name}</h3>
              {meal.variant && <p className="text-xs sm:text-sm text-neutral-500 truncate">{meal.variant}</p>}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <p className="text-emerald-600 text-base sm:text-lg font-semibold">{meal.calories}</p>
            </div>
            <p className="text-[10px] sm:text-xs text-neutral-400">kcal</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
          <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
              <Beef className="w-3 h-3 text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-blue-600">{meal.protein}g</p>
            <p className="text-[10px] sm:text-xs text-neutral-400">Prot</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-1.5 sm:p-2">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
              <Wheat className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-amber-600">{meal.carbs}g</p>
            <p className="text-[10px] sm:text-xs text-neutral-400">Carb</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-1.5 sm:p-2">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
              <Droplet className="w-3 h-3 text-orange-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-orange-600">{meal.fat}g</p>
            <p className="text-[10px] sm:text-xs text-neutral-400">Grasa</p>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressBar = (current: number, goal: number, color: string) => {
    const percent = Math.min((current / goal) * 100, 100);
    const isOverGoal = current > goal;
    
    return (
      <div className="relative">
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${isOverGoal ? 'bg-red-500' : `bg-${color}-500`} transition-all duration-500 rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  // Handler para completar onboarding de entrenamiento
  const handleTrainingOnboardingComplete = async (days: number, plan: any[]) => {
    setTrainingDays(days);
    setWeekPlan(plan);
    setTrainingOnboarded(true);
    setShowTrainingOnboarding(false);
    setActiveTab('training');
    
    // Guardar flags en el usuario (sin el plan completo)
    if (onUpdateUser) {
      const updatedUser: User = {
        ...user,
        trainingOnboarded: true,
        trainingDays: days,
        weekPlan: plan // IMPORTANTE: Guardar el plan en el usuario también
      };
      onUpdateUser(updatedUser);
    }
    
    // Guardar el plan en Supabase (fuente de verdad única)
    try {
      await api.saveTrainingPlan(user.email, plan);
      console.log('✅ Training plan saved to Supabase:', { days, plan });
    } catch (error) {
      console.error('❌ Error saving training plan to Supabase:', error);
    }
    
    console.log('✅ Training onboarding completed:', { days, plan });
  };

  // NUEVO: Sincronizar estado de onboarding con el usuario cargado
  useEffect(() => {
    if (user.trainingOnboarded && showTrainingOnboarding) {
      console.log('🔄 Syncing onboarding state: User is already onboarded');
      setShowTrainingOnboarding(false);
      
      // Si el usuario tiene plan cargado, sincronizarlo localmente
      if (user.weekPlan && user.weekPlan.length > 0) {
        setWeekPlan(user.weekPlan);
        setTrainingDays(user.weekPlan.length);
      }
    }
  }, [user.trainingOnboarded, user.weekPlan]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Notification Banner - Macros Updated */}
      {showMacrosUpdated && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in px-4 w-full max-w-md">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm">¡Macros Actualizados!</p>
              <p className="text-[10px] sm:text-xs text-emerald-100 leading-tight">Tus objetivos se han recalculado con tu nuevo peso</p>
            </div>
            <button
              onClick={() => setShowMacrosUpdated(false)}
              className="bg-white/20 hover:bg-white/30 p-1 rounded-lg transition-colors active:scale-95 flex-shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl text-neutral-800 mb-2">Hola, {user.name} 👋</h1>
              <p className="text-neutral-500">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Botones de navegación con Dieta/Entrenamiento integrado */}
          <div className="flex gap-3 justify-between items-center mb-8">
            {/* Segmented Control - Dieta / Entrenamiento */}
            <div className="inline-flex bg-gray-200 rounded-2xl p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('diet')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'diet'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
                Dieta
              </button>
              <button
                onClick={() => {
                  if (!trainingOnboarded) {
                    setShowTrainingOnboarding(true);
                  } else {
                    setActiveTab('training');
                  }
                }}
                className={`relative px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'training'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Dumbbell className="w-5 h-5" />
                Entrenamiento
                {!trainingOnboarded && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    NEW
                  </span>
                )}
              </button>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={onNavigateToSummary}
                className="bg-white border border-neutral-200 p-3 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-neutral-700">Resumen Diario</span>
              </button>
              <button
                onClick={() => setShowProgressHub(true)}
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white p-3 rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Progreso</span>
              </button>
              {user.isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-3 rounded-xl hover:from-purple-700 hover:to-indigo-800 transition-all flex items-center gap-2 shadow-md"
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Admin</span>
                </button>
              )}
              {user.isAdmin && onOpenTechnicalDocs && (
                <button
                  onClick={onOpenTechnicalDocs}
                  className="bg-gradient-to-r from-pink-600 to-rose-700 text-white p-3 rounded-xl hover:from-pink-700 hover:to-rose-800 transition-all flex items-center gap-2 shadow-md"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">Docs</span>
                </button>
              )}
              <button
                onClick={onNavigateToSettings}
                className="bg-white border border-neutral-200 p-3 rounded-xl hover:bg-neutral-100 transition-all flex items-center gap-2"
              >
                <SettingsIcon className="w-5 h-5 text-neutral-600" />
                <span className="text-sm text-neutral-700">Ajustes</span>
              </button>
            </div>
          </div>

          {/* Contenido Condicional */}
          {activeTab === 'training' ? (
            !trainingOnboarded ? (
              <TrainingOnboarding
                onComplete={handleTrainingOnboardingComplete}
              />
            ) : isLoadingTrainingPlan ? (
              // Loading state mientras carga el plan
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mb-4"></div>
                <p className="text-neutral-600 text-lg font-medium">Cargando tu plan de entrenamiento...</p>
                <p className="text-neutral-400 text-sm mt-2">Un momento por favor</p>
              </div>
            ) : weekPlan.length === 0 ? (
              // Estado vacío si no hay plan después de cargar
              <div className="flex flex-col items-center justify-center py-20">
                <Dumbbell className="w-20 h-20 text-neutral-300 mb-4" />
                <p className="text-neutral-600 text-lg font-medium">No se encontró tu plan de entrenamiento</p>
                <button
                  onClick={() => setShowTrainingOnboarding(true)}
                  className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all"
                >
                  Configurar Plan
                </button>
              </div>
            ) : (
              <TrainingDashboardNew
                user={user}
                trainingDays={trainingDays}
                weekPlan={weekPlan}
              />
            )
          ) : (
          <>
          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - User Stats */}
            <div className="col-span-3 space-y-6">
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Perfil</p>
                    <p className="text-lg">{user.sex === 'male' ? '♂️ Hombre' : '♀️ Mujer'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Peso</span>
                    <span>{user.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Altura</span>
                    <span>{user.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Entrenos</span>
                    <span>{user.trainingFrequency} días/sem</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">IMC</span>
                    <span>{calculations.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">% Grasa</span>
                    <span>{calculations.bodyFat}%</span>
                  </div>
                </div>
              </div>

              {/* Progreso y Metabolismo Unificado */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                {/* Título */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-neutral-800 font-medium">{activeTab === 'training' ? 'Tu Semana' : 'Tu Día'}</h3>
                </div>

                {activeTab === 'training' ? (
                  /* Contenido de Entrenamiento - Sin estadísticas duplicadas */
                  <div className="text-center py-8">
                    <p className="text-neutral-500 text-sm">
                      Estadísticas visibles en el header
                    </p>
                  </div>
                ) : (
                  /* Progreso de Comidas - Visual Grande */
                  <>
                  <div className="mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-neutral-100"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - activeMealsLogged / totalActiveMeals)}`}
                          className="transition-all duration-500"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl text-emerald-600 font-bold">{activeMealsLogged}</span>
                        <span className="text-neutral-400 text-sm">/{totalActiveMeals}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Text */}
                  <div className="text-center mb-4">
                    <p className="text-neutral-700 font-medium mb-1">
                      {activeMealsLogged === 0 && '¡Empieza tu día!'}
                      {activeMealsLogged === 1 && '¡Buen comienzo!'}
                      {activeMealsLogged >= 2 && activeMealsLogged < totalActiveMeals && '¡Sigue así!'}
                      {activeMealsLogged === totalActiveMeals && '🎉 ¡Día completo!'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {activeMealsLogged === 0 && 'Registra tu primera comida'}
                      {activeMealsLogged > 0 && activeMealsLogged < totalActiveMeals && `${totalActiveMeals - activeMealsLogged} comida${totalActiveMeals - activeMealsLogged > 1 ? 's' : ''} restante${totalActiveMeals - activeMealsLogged > 1 ? 's' : ''}`}
                      {activeMealsLogged === totalActiveMeals && 'Todas las comidas registradas'}
                    </p>
                  </div>

                  {/* Mini Indicators */}
                  <div className="grid grid-cols-4 gap-2">
                    {activeMealTypes.map((mealType) => {
                      const meal = currentLog[mealType];
                      const icons = {
                        breakfast: '🌅',
                        lunch: '🍽️',
                        snack: '🍎',
                        dinner: '🌙'
                      };
                      const labels = {
                        breakfast: 'Desayuno',
                        lunch: 'Comida',
                        snack: 'Merienda',
                        dinner: 'Cena'
                      };
                      
                      return (
                        <div key={mealType} className={`text-center p-2 rounded-xl transition-all ${
                          meal 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md' 
                            : 'bg-neutral-100 border-2 border-dashed border-neutral-200'
                        }`}>
                          <div className={`text-lg mb-0.5 ${meal ? 'filter brightness-125' : 'opacity-40'}`}>
                            {icons[mealType]}
                          </div>
                          <p className={`text-xs font-medium ${meal ? 'text-white' : 'text-neutral-400'}`}>
                            {labels[mealType].substring(0, 3)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metabolismo Section - Solo en Dieta */}
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-neutral-700 font-medium">Metabolismo</p>
                    </div>
                    <button
                      onClick={() => setShowMetabolismInfo(!showMetabolismInfo)}
                      className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>

                  {/* Modal de Información */}
                  {showMetabolismInfo && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-neutral-700 leading-relaxed">
                      <button
                        onClick={() => setShowMetabolismInfo(false)}
                        className="float-right text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="mb-2"><strong>TMB</strong>: Calorías que tu cuerpo quema en reposo total.</p>
                      <p><strong>TDEE</strong>: Calorías totales que quemas al día incluyendo actividad física.</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* TMB */}
                    <div className="bg-neutral-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="bg-neutral-200 p-1 rounded-lg">
                          <Zap className="w-3 h-3 text-neutral-600" />
                        </div>
                        <p className="text-xs text-neutral-500">TMB</p>
                      </div>
                      <p className="text-xl text-neutral-700 font-bold">{calculations.bmr}</p>
                      <p className="text-xs text-neutral-400">kcal/día</p>
                    </div>

                    {/* TDEE */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="bg-emerald-500 p-1 rounded-lg">
                          <Flame className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-xs text-emerald-700">TDEE</p>
                      </div>
                      <p className="text-xl text-emerald-600 font-bold">{calculations.tdee}</p>
                      <p className="text-xs text-emerald-600">kcal/día</p>
                    </div>
                  </div>

                  {/* Resumen Explicativo */}
                  <div className="pt-4 border-t border-neutral-200 mt-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-emerald-500 text-white rounded-full p-1 mt-0.5 flex-shrink-0">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            {activeMealsLogged === 0 && (
                              <>¡Comienza tu día! Tu objetivo es consumir <strong>{goals.calories} kcal</strong> para {
                                goals.calories < calculations.tdee ? 'perder peso de forma saludable' :
                                goals.calories > calculations.tdee ? 'ganar masa muscular' :
                                'mantener tu peso actual'
                              }.</>
                            )}
                            {activeMealsLogged > 0 && activeMealsLogged < totalActiveMeals && (
                              <>Llevas <strong>{totals.calories} kcal</strong> de {goals.calories}. {
                                caloriesPercent < 50 ? `Te quedan ${goals.calories - totals.calories} kcal para alcanzar tu objetivo.` :
                                caloriesPercent < 90 ? `¡Vas muy bien! Estás al ${Math.round(caloriesPercent)}% de tu meta.` :
                                caloriesPercent < 110 ? `¡Perfecto! Estás justo en tu objetivo.` :
                                `⚠️ Has superado tu objetivo por ${totals.calories - goals.calories} kcal. Controla las próximas comidas.`
                              }</>
                            )}
                            {activeMealsLogged === totalActiveMeals && (
                              <>¡Día completo! Has registrado <strong>{totals.calories} kcal</strong>. {
                                caloriesPercent >= 95 && caloriesPercent <= 105 ? '🎯 ¡Perfecto cumplimiento de macros!' :
                                caloriesPercent < 95 ? `Te faltan ${goals.calories - totals.calories} kcal para completar tu objetivo.` :
                                `⚠️ Has excedido tu objetivo por ${totals.calories - goals.calories} kcal.`
                              }</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>
            </div>

            {/* Center - Macros Overview */}
            <div className="col-span-6 space-y-6">
              {/* Macros Summary */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl text-neutral-800 mb-1">Macros de Hoy</h2>
                    <p className="text-sm text-neutral-500">Macros consumidos hoy</p>
                  </div>
                  <button
                    onClick={onResetDay}
                    className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {/* Calories */}
                  <div className="text-center">
                    <div className="bg-emerald-50 rounded-2xl p-6 mb-3">
                      <Flame className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-3xl text-emerald-600 mb-1">{totals.calories}</p>
                      <p className="text-neutral-400 text-sm">/ {goals.calories}</p>
                    </div>
                    {renderProgressBar(totals.calories, goals.calories, 'emerald')}
                    <p className="text-xs text-neutral-500 mt-2">Calorías</p>
                  </div>

                  {/* Protein */}
                  <div className="text-center">
                    <div className="bg-blue-50 rounded-2xl p-6 mb-3">
                      <Beef className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl text-blue-600 mb-1">{totals.protein}g</p>
                      <p className="text-neutral-400 text-sm">/ {goals.protein}g</p>
                    </div>
                    {renderProgressBar(totals.protein, goals.protein, 'blue')}
                    <p className="text-xs text-neutral-500 mt-2">Proteína</p>
                  </div>

                  {/* Carbs */}
                  <div className="text-center">
                    <div className="bg-amber-50 rounded-2xl p-6 mb-3">
                      <Wheat className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-3xl text-amber-600 mb-1">{totals.carbs}g</p>
                      <p className="text-neutral-400 text-sm">/ {goals.carbs}g</p>
                    </div>
                    {renderProgressBar(totals.carbs, goals.carbs, 'amber')}
                    <p className="text-xs text-neutral-500 mt-2">Carbohidratos</p>
                  </div>

                  {/* Fat */}
                  <div className="text-center">
                    <div className="bg-orange-50 rounded-2xl p-6 mb-3">
                      <Droplet className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-3xl text-orange-600 mb-1">{totals.fat}g</p>
                      <p className="text-neutral-400 text-sm">/ {goals.fat}g</p>
                    </div>
                    {renderProgressBar(totals.fat, goals.fat, 'orange')}
                    <p className="text-xs text-neutral-500 mt-2">Grasas</p>
                  </div>
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-4">
                {activeMealTypes.map(mealType => (
                  <div key={mealType}>
                    {renderMealCard(mealType)}
                  </div>
                ))}

                {/* Widget Unificado: Completa tu día + Comidas Complementarias */}
                <ComplementaryMealsWidget
                  user={user}
                  currentLog={currentLog}
                  totals={calculateTotals()}
                  onOpenRecommendations={() => setShowMacroRecommendations(true)}
                  onRemoveMeal={(index) => onRemoveComplementaryMeal?.(index)}
                />
              </div>

              {/* Mis Platos Button */}
              <button
                onClick={onAddExtraFood}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Coffee className="w-5 h-5" />
                <span className="font-medium">Añadir Alimento Extra</span>
              </button>
              
              {/* Guardar Día Button */}
              <button
                onClick={onSaveDay}
                className={`w-full ${currentLog.isSaved ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg`}
              >
                {currentLog.isSaved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Día Guardado</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span className="font-medium">Guardar Día en Calendario</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Sidebar - Goals & Tips */}
            <div className="col-span-3 space-y-6">
              {/* Weekly Progress Widget - Compact */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Progreso Semanal
                  </h3>
                  <button
                    onClick={() => setShowProgressHub(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    Ver →
                  </button>
                </div>
                
                {/* 7 Days Calendar - Compact */}
                <WeeklyProgressWidget last7Days={last7Days} goals={goals} />
              </div>

              {/* Peso Diario Widget */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-neutral-800">Peso de Hoy</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && weightInput) {
                          const weight = parseFloat(weightInput);
                          if (weight > 0 && weight < 300) {
                            onUpdateWeight(weight, currentLog.date);
                            setShowWeightSaved(true);
                            setTimeout(() => setShowWeightSaved(false), 2000);
                          }
                        }
                      }}
                      placeholder="Ej: 75.5"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-neutral-800"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm">
                      kg
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (weightInput) {
                        const weight = parseFloat(weightInput);
                        if (weight > 0 && weight < 300) {
                          onUpdateWeight(weight, currentLog.date);
                          setShowWeightSaved(true);
                          setTimeout(() => setShowWeightSaved(false), 2000);
                          setShowMacrosUpdated(true);
                          setTimeout(() => setShowMacrosUpdated(false), 5000);
                        }
                      }
                    }}
                    className={`w-full py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      showWeightSaved 
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    }`}
                  >
                    {showWeightSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Guardado</span>
                      </>
                    ) : (
                      <span className="text-sm">Guardar Peso</span>
                    )}
                  </button>
                  {currentLog.weight && (
                    <div className="pt-3 border-t border-neutral-200">
                      <p className="text-xs text-neutral-500 mb-1">Peso registrado hoy:</p>
                      <p className="text-xl text-emerald-600 font-semibold">{currentLog.weight} kg</p>
                    </div>
                  )}
                </div>
              </div>

              {/* NUEVO: Botón de Distribución de Comidas */}
              <button
                onClick={() => setShowMealDistributionModal(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-4 shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Estructurar {totalActiveMeals} Comidas</p>
                    <p className="text-purple-100 text-xs">Personaliza tu distribución diaria</p>
                  </div>
                </div>
                <div className="text-purple-100 group-hover:translate-x-1 transition-transform">→</div>
              </button>

              {/* Invita a Amigos Widget */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5" />
                  <h3 className="font-semibold">¡Comparte tu progreso!</h3>
                </div>
                <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                  💪 Alcanzar tus metas es mejor con amigos. ¡Invita a tu círculo a unirse a Fuelier y motivarse juntos!
                </p>
                <button
                  onClick={() => {
                    // Lógica de compartir (puede ser Web Share API o copiar enlace)
                    if (navigator.share) {
                      navigator.share({
                        title: 'Fuelier - Gestión de Dieta',
                        text: '¡Únete a mí en Fuelier para alcanzar nuestros objetivos nutricionales juntos! 💪🥗',
                        url: window.location.origin
                      }).catch(() => {});
                    } else {
                      // Fallback: copiar al portapapeles
                      navigator.clipboard.writeText(window.location.origin);
                      alert('¡Enlace copiado! Compártelo con tus amigos 🎉');
                    }
                  }}
                  className="w-full bg-white text-emerald-600 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-medium shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invitar Amigos</span>
                </button>
              </div>

              {/* Bug Report Widget */}
              <BugReportWidget onSubmit={onSubmitBugReport} />
            </div>
          </div>
          </>
        )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 pt-safe pt-8 pb-5 rounded-b-3xl shadow-lg">
          <div className="flex justify-between items-start mb-3.5">
            <div className="flex-1 min-w-0 pr-2">
              <h1 className="text-lg sm:text-xl font-bold mb-1 truncate">Hola, {user.name.split(' ')[0]} 👋</h1>
              <p className="text-emerald-100 text-xs leading-tight">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={onNavigateToSummary}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
                aria-label="Resumen"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowProgressHub(true)}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
                aria-label="Progreso"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              {user.isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
                  aria-label="Admin"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onNavigateToSettings}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95"
                aria-label="Ajustes"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats - Solo visible en modo Dieta */}
          {activeTab === 'diet' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-emerald-100 text-xs font-medium mb-1">Comidas</p>
                <p className="text-2xl font-bold leading-none">{activeMealsLogged}<span className="text-lg text-emerald-200">/{totalActiveMeals}</span></p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-emerald-100 text-xs font-medium mb-1">Objetivo</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold leading-none">{goals.calories}</p>
                  <p className="text-xs text-emerald-100">kcal</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats - Solo visible en modo Entrenamiento */}
          {activeTab === 'training' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-emerald-100 text-xs font-medium mb-1">Completados</p>
                <p className="text-2xl font-bold leading-none">0<span className="text-lg text-emerald-200">/{trainingDays}</span></p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-emerald-100 text-xs font-medium mb-1">Racha</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold leading-none">0</p>
                  <p className="text-xs text-emerald-100">semanas</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Segmented Control - Dieta / Entrenamiento (Mobile) */}
        <div className="px-4 pt-4 pb-0 bg-neutral-50">
          <div className="flex bg-gray-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('diet')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'diet'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Dieta
            </button>
            <button
              onClick={() => {
                if (!trainingOnboarded) {
                  setShowTrainingOnboarding(true);
                } else {
                  setActiveTab('training');
                }
              }}
              className={`relative flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'training'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Entrenamiento
              {!trainingOnboarded && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'training' ? (
          !trainingOnboarded ? (
            <TrainingOnboarding
              onComplete={handleTrainingOnboardingComplete}
            />
          ) : isLoadingTrainingPlan ? (
            // Loading state mientras carga el plan
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
              <p className="text-neutral-600 text-base font-medium text-center">Cargando tu plan...</p>
            </div>
          ) : weekPlan.length === 0 ? (
            // Estado vacío si no hay plan después de cargar
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Dumbbell className="w-16 h-16 text-neutral-300 mb-4" />
              <p className="text-neutral-600 text-base font-medium text-center">No se encontró tu plan</p>
              <button
                onClick={() => setShowTrainingOnboarding(true)}
                className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all active:scale-95"
              >
                Configurar Plan
              </button>
            </div>
          ) : (
            <TrainingDashboardNew
              user={user}
              trainingDays={trainingDays}
              weekPlan={weekPlan}
            />
          )
        ) : (
        <div className="px-4 pt-4 pb-4 space-y-4 bg-neutral-50">
          {/* Weekly Progress Widget - Mobile */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-indigo-700 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Progreso Semanal
              </h3>
              <button
                onClick={() => setShowProgressHub(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors active:scale-95"
              >
                Ver más →
              </button>
            </div>
            
            {/* 7 Days Calendar */}
            <WeeklyProgressWidget last7Days={last7Days} goals={goals} />
          </div>

          {/* Macros Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-neutral-800">Macros de Hoy</h2>
              <button
                onClick={onResetDay}
                className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all active:scale-95 font-medium"
              >
                Reiniciar
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Calories */}
              <div className="text-center">
                <div className="bg-emerald-50 rounded-xl p-2 mb-1.5">
                  <Flame className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-emerald-600 leading-tight">{totals.calories}</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">/{goals.calories}</p>
                </div>
                {renderProgressBar(totals.calories, goals.calories, 'emerald')}
                <p className="text-[10px] text-neutral-500 mt-1 font-medium">kcal</p>
              </div>

              {/* Protein */}
              <div className="text-center">
                <div className="bg-blue-50 rounded-xl p-2 mb-1.5">
                  <Beef className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-blue-600 leading-tight">{totals.protein}</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">/{goals.protein}</p>
                </div>
                {renderProgressBar(totals.protein, goals.protein, 'blue')}
                <p className="text-[10px] text-neutral-500 mt-1 font-medium">Prot</p>
              </div>

              {/* Carbs */}
              <div className="text-center">
                <div className="bg-amber-50 rounded-xl p-2 mb-1.5">
                  <Wheat className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-amber-600 leading-tight">{totals.carbs}</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">/{goals.carbs}</p>
                </div>
                {renderProgressBar(totals.carbs, goals.carbs, 'amber')}
                <p className="text-[10px] text-neutral-500 mt-1 font-medium">Carb</p>
              </div>

              {/* Fat */}
              <div className="text-center">
                <div className="bg-orange-50 rounded-xl p-2 mb-1.5">
                  <Droplet className="w-4 h-4 text-orange-600 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-orange-600 leading-tight">{totals.fat}</p>
                  <p className="text-[10px] text-neutral-400 leading-tight">/{goals.fat}</p>
                </div>
                {renderProgressBar(totals.fat, goals.fat, 'orange')}
                <p className="text-[10px] text-neutral-500 mt-1 font-medium">Grasa</p>
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-3">
            {activeMealTypes.map(mealType => (
              <div key={mealType}>
                {renderMealCard(mealType)}
              </div>
            ))}

            {/* Widget Unificado: Completa tu día + Comidas Complementarias */}
            <ComplementaryMealsWidget
              user={user}
              currentLog={currentLog}
              totals={calculateTotals()}
              onOpenRecommendations={() => setShowMacroRecommendations(true)}
              onRemoveMeal={(index) => onRemoveComplementaryMeal?.(index)}
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={onAddExtraFood}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] font-medium text-sm sm:text-base"
          >
            <Coffee className="w-5 h-5" />
            <span>Añadir Alimento Extra</span>
          </button>
          
          {/* Guardar Día Button */}
          <button
            onClick={onSaveDay}
            className={`w-full ${currentLog.isSaved ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white py-3 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] font-medium text-sm sm:text-base`}
          >
            {currentLog.isSaved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Día Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar Día</span>
              </>
            )}
          </button>

          {/* Weight Input Card - Mobile */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h3 className="font-medium text-neutral-800">Peso de Hoy</h3>
            </div>
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && weightInput) {
                      const weight = parseFloat(weightInput);
                      if (weight > 0 && weight < 300) {
                        onUpdateWeight(weight, currentLog.date);
                        setShowWeightSaved(true);
                        setTimeout(() => setShowWeightSaved(false), 2000);
                      }
                    }
                  }}
                  placeholder="Ej: 75.5"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg text-neutral-800"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm">
                  kg
                </span>
              </div>
              <button
                onClick={() => {
                  if (weightInput) {
                    const weight = parseFloat(weightInput);
                    if (weight > 0 && weight < 300) {
                      onUpdateWeight(weight, currentLog.date);
                      setShowWeightSaved(true);
                      setTimeout(() => setShowWeightSaved(false), 2000);
                      setShowMacrosUpdated(true);
                      setTimeout(() => setShowMacrosUpdated(false), 5000);
                    }
                  }
                }}
                className={`w-full py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                  showWeightSaved 
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                }`}
              >
                {showWeightSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Guardado</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Guardar Peso</span>
                  </>
                )}
              </button>
              {currentLog.weight && (
                <div className="pt-2.5 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-0.5">Peso registrado hoy:</p>
                  <p className="text-lg text-emerald-600 font-semibold">{currentLog.weight} kg</p>
                </div>
              )}
            </div>
          </div>

          {/* Meal Distribution Button - Mobile */}
          <button
            onClick={() => setShowMealDistributionModal(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-4 shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-between group active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Estructurar {totalActiveMeals} Comidas</p>
                <p className="text-purple-100 text-xs">Personaliza tu distribución diaria</p>
              </div>
            </div>
            <div className="text-purple-100 group-hover:translate-x-1 transition-transform">→</div>
          </button>

          {/* Share Widget - Mobile */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5" />
              <h3 className="font-semibold">¡Comparte tu progreso!</h3>
            </div>
            <p className="text-emerald-50 text-sm leading-relaxed mb-4">
              💪 Alcanzar tus metas es mejor con amigos. ¡Invita a tu círculo a unirse a Fuelier!
            </p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Fuelier - Gestión de Dieta',
                    text: '¡Únete a mí en Fuelier para alcanzar nuestros objetivos nutricionales juntos! 💪🥗',
                    url: window.location.origin
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('¡Enlace copiado! Compártelo con tus amigos 🎉');
                }
              }}
              className="w-full bg-white text-emerald-600 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-medium shadow-md active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Invitar Amigos</span>
            </button>
          </div>

          {/* Bug Report Widget - Mobile */}
          <BugReportWidget onSubmit={onSubmitBugReport} />
        </div>
        )}
      </div>

      {/* Chatbot - Floating */}
      <Chatbot userName={user.name} />
      
      {/* Macro Completion Recommendations - Manual and Auto-show */}
      <MacroCompletionRecommendations
        user={user}
        currentLog={currentLog}
        onAddMeal={onAddMeal}
        onAddExtraFood={onAddExtraFood}
        onAddExtraFoodDirect={onAddExtraFoodDirect}
        onAddComplementaryMeals={onAddComplementaryMeals}
        onSelectedMealsChange={setSelectedComplementaryMeals}
        isOpen={showMacroRecommendations}
        onClose={() => {
          setShowMacroRecommendations(false);
          // Marcar como mostrado para que no vuelva a aparecer aunque se rechace
          setMacroRecommendationShownToday(true);
        }}
      />

      {/* Meal Distribution Modal */}
      <MealDistributionModal
        isOpen={showMealDistributionModal}
        onClose={() => setShowMealDistributionModal(false)}
        currentDistribution={user.mealDistribution}
        mealsPerDay={user.mealsPerDay || 3}
        totalCalories={user.goals?.calories || 2000}
        onSave={(distribution) => {
          onUpdateMealDistribution?.(distribution);
          setShowMealDistributionModal(false);
        }}
      />

      {/* Weight Tracking Modal */}
      {showWeightTracking && (
        <WeightTracking
          user={user}
          onUpdateWeight={(weight, date) => {
            onUpdateWeight(weight, date);
            setShowWeightTracking(false);
          }}
          onClose={() => setShowWeightTracking(false)}
        />
      )}

      {/* Progress Hub Modal */}
      {showProgressHub && (
        <ProgressHub
          user={user}
          dailyLogs={dailyLogs}
          onUpdateWeight={(weight, date) => {
            onUpdateWeight(weight, date);
          }}
          onClose={() => setShowProgressHub(false)}
          onSelectDate={(date) => {
            // Navegar a ese día específico
            onNavigateToHistory();
            setShowProgressHub(false);
          }}
        />
      )}

      {/* Training Onboarding Modal */}
      {showTrainingOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen">
            <TrainingOnboarding
              onComplete={handleTrainingOnboardingComplete}
            />
            {/* Botón de cerrar overlay */}
            <button
              onClick={() => setShowTrainingOnboarding(false)}
              className="fixed top-6 right-6 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white transition-all"
            >
              <X className="w-6 h-6 text-neutral-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}