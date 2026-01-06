import { useState, useEffect } from 'react';
import { User, Meal, MealType, DailyLog, SavedDiet, BugReport, MacroGoals, MealDistribution } from './types';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import MealSelection from './components/MealSelection';
import MealDetail from './components/MealDetail';
import DailySummary from './components/DailySummary';
import ExtraFood from './components/ExtraFood';
import CalendarView from './components/CalendarView';
import QuestionSex from './components/onboarding/QuestionSex';
import QuestionAge from './components/onboarding/QuestionAge';
import QuestionWeight from './components/onboarding/QuestionWeight';
import QuestionHeight from './components/onboarding/QuestionHeight';
import QuestionActivity from './components/onboarding/QuestionActivity';
import GoalsSummary from './components/onboarding/GoalsSummary';
import QuestionDistribution from './components/onboarding/QuestionDistribution';
import FoodPreferences from './components/onboarding/FoodPreferences';
import Settings from './components/Settings';
import MyCustomMeals from './components/MyCustomMeals';
import CreateMeal from './components/CreateMeal';
import CreateIngredient from './components/CreateIngredient';
import EditCustomMeal from './components/EditCustomMeal';
import SavedDiets from './components/SavedDiets';
import AdminPanel from './components/AdminPanel';
import DayCompletedModal from './components/DayCompletedModal';
import AdaptiveNotification from './components/AdaptiveNotification';
import { analyzeProgress, applyAutomaticAdjustment, detectMetabolicAdaptation, generateWeeklyProgress } from './utils/adaptiveSystem';
import { calculateMacrosFromUser, calculateBMR, calculateTDEE, calculateMacros } from './utils/macroCalculations';
import { calculateIntelligentTarget } from './utils/automaticTargetCalculator';
import { scaleToExactTarget } from './utils/intelligentMealScaling';
import * as api from './utils/api';
import logger from './utils/logger';

type Screen = 
  | 'login'
  | 'admin-login'
  | 'onboarding-sex'
  | 'onboarding-age'
  | 'onboarding-weight'
  | 'onboarding-height'
  | 'onboarding-activity'
  | 'onboarding-goals'
  | 'onboarding-distribution'
  | 'onboarding-preferences'
  | 'dashboard' 
  | 'selection' 
  | 'detail' 
  | 'summary' 
  | 'settings'
  | 'custom-meals'
  | 'create-meal'
  | 'create-ingredient'
  | 'edit-custom-meal'
  | 'admin';

interface TempOnboardingData {
  email: string;
  name: string;
  sex?: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  trainingFrequency?: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [tempData, setTempData] = useState<TempOnboardingData | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtraFood, setShowExtraFood] = useState(false);
  const [savedDiets, setSavedDiets] = useState<SavedDiet[]>([]);
  const [showSavedDiets, setShowSavedDiets] = useState(false);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [favoriteMealIds, setFavoriteMealIds] = useState<string[]>([]); // IDs de comidas favoritas del usuario
  const [showDayCompletedModal, setShowDayCompletedModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [macroRecommendationShownToday, setMacroRecommendationShownToday] = useState(false); // NUEVO: Controla si ya se mostró el modal de recomendaciones hoy
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null); // NUEVO: Para recordar de dónde venimos
  
  // NUEVO: Estados para notificaciones adaptativas
  const [showAdaptiveNotification, setShowAdaptiveNotification] = useState(false);
  const [adaptiveNotificationData, setAdaptiveNotificationData] = useState<{
    type: 'adjustment' | 'metabolic_adaptation' | 'on_track';
    title: string;
    message: string;
    newGoals?: MacroGoals;
    warnings?: string[];
  } | null>(null);

  // NUEVO: Detectar ruta de admin al montar
  useEffect(() => {
    const currentPath = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    logger.debug('Current path:', currentPath);
    logger.debug('Hash:', hash);
    logger.debug('Search params:', searchParams.toString());
    logger.debug('Full URL:', window.location.href);
    
    // ACCESO ADMIN CON: adminfueliercardano
    // Formas de acceder:
    // 1. Hash: #adminfueliercardano
    // 2. Query param: ?adminfueliercardano=true
    // 3. Ruta: /adminfueliercardano
    
    const isAdminRoute = 
      currentPath === '/adminfueliercardano' || 
      currentPath.includes('/adminfueliercardano') ||
      hash === '#adminfueliercardano' || 
      hash === '#/adminfueliercardano' ||
      searchParams.get('adminfueliercardano') === 'true' ||
      searchParams.has('adminfueliercardano');
    
    if (isAdminRoute) {
      logger.log('🔐 Admin route detected, showing admin login');
      setCurrentScreen('admin-login');
      setIsLoading(false);
    }
  }, []);

  // Scroll to top when screen changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);

  // Load user from Supabase (with localStorage as fallback for migration)
  useEffect(() => {
    const isAdminRoute = window.location.pathname === '/adminfueliercardano' || 
                        window.location.pathname.includes('/adminfueliercardano') ||
                        window.location.hash === '#adminfueliercardano' ||
                        window.location.hash === '#/adminfueliercardano';
    
    // Si estamos en la ruta de admin, no cargar usuario automáticamente
    if (isAdminRoute) {
      setIsLoading(false);
      return;
    }
    
    // Intentar cargar desde localStorage primero (para migración)
    const savedUser = localStorage.getItem('dietUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Migrate old users without sex (male por defecto)
        if (!parsedUser.sex) {
          parsedUser.sex = 'male';
        }
        // Migrate old users without age (usar valor por defecto de 30 años)
        if (!parsedUser.age) {
          parsedUser.age = 30;
        }
        // Migrate old users without goal (mantener peso por defecto)
        if (!parsedUser.goal) {
          parsedUser.goal = 'maintenance';
        }
        // MIGRACIÓN: Convertir goals antiguos de 3 opciones a 5 opciones
        if (parsedUser.goal === 'lose_weight') {
          parsedUser.goal = 'moderate_loss';
        } else if (parsedUser.goal === 'maintain') {
          parsedUser.goal = 'maintenance';
        } else if (parsedUser.goal === 'gain_muscle') {
          parsedUser.goal = 'moderate_gain';
        }
        // Migrate old users without mealsPerDay (3 comidas por defecto)
        if (!parsedUser.mealsPerDay) {
          parsedUser.mealsPerDay = 3;
        }
        // MIGRACIÓN CRÍTICA: Recalcular goals si no existen o están mal
        if (!parsedUser.goals || !parsedUser.goals.calories || isNaN(parsedUser.goals.calories)) {
          parsedUser.goals = calculateMacrosFromUser({
            sex: parsedUser.sex,
            weight: parsedUser.weight,
            height: parsedUser.height,
            age: parsedUser.age,
            goal: parsedUser.goal,
            trainingFrequency: parsedUser.trainingFrequency
          });
        }
        
        setUser(parsedUser);
        setCurrentScreen('dashboard');
        
        // Guardar en Supabase (migración automática)
        api.saveUser(parsedUser).then(() => {
          console.log('✅ User migrated to Supabase');
        });
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      console.log('📥 Loading user data from Supabase...');
      
      // Load daily logs
      const logs = await api.getDailyLogs(user.email);
      if (logs.length > 0) {
        setDailyLogs(logs);
        console.log(`✅ Loaded ${logs.length} daily logs from Supabase`);
      } else {
        // Intentar migrar desde localStorage
        const savedLogs = localStorage.getItem('dietLogs');
        if (savedLogs) {
          try {
            const parsed = JSON.parse(savedLogs);
            setDailyLogs(parsed);
            // Guardar en Supabase (migración)
            await api.saveDailyLogs(user.email, parsed);
            console.log(`✅ Migrated ${parsed.length} daily logs to Supabase`);
          } catch (error) {
            console.error('Error migrating logs:', error);
          }
        }
      }
      
      // Load saved diets
      const diets = await api.getSavedDiets(user.email);
      if (diets.length > 0) {
        setSavedDiets(diets);
        console.log(`✅ Loaded ${diets.length} saved diets from Supabase`);
      } else {
        // Intentar migrar desde localStorage
        const savedDiets = localStorage.getItem('savedDiets');
        if (savedDiets) {
          try {
            const parsed = JSON.parse(savedDiets);
            setSavedDiets(parsed);
            // Guardar en Supabase (migración)
            await api.saveSavedDiets(user.email, parsed);
            console.log(`✅ Migrated ${parsed.length} saved diets to Supabase`);
          } catch (error) {
            console.error('Error migrating diets:', error);
          }
        }
      }
      
      // Load favorite meals
      const favorites = await api.getFavoriteMeals(user.email);
      if (favorites.length > 0) {
        setFavoriteMealIds(favorites);
        console.log(`✅ Loaded ${favorites.length} favorite meals from Supabase`);
      } else {
        // Intentar migrar desde localStorage
        const savedFavorites = localStorage.getItem(`favoriteMeals_${user.email}`);
        if (savedFavorites) {
          try {
            const parsed = JSON.parse(savedFavorites);
            setFavoriteMealIds(parsed);
            // Guardar en Supabase (migración)
            await api.saveFavoriteMeals(user.email, parsed);
            console.log(`✅ Migrated ${parsed.length} favorite meals to Supabase`);
          } catch (error) {
            console.error('Error migrating favorites:', error);
          }
        }
      }
      
      // Load bug reports (only for admins)
      if (user.isAdmin) {
        const reports = await api.getBugReports();
        if (reports.length > 0) {
          setBugReports(reports);
          console.log(`✅ Loaded ${reports.length} bug reports from Supabase`);
        } else {
          // Intentar migrar desde localStorage
          const savedReports = localStorage.getItem('bugReports');
          if (savedReports) {
            try {
              const parsed = JSON.parse(savedReports);
              setBugReports(parsed);
              // Guardar en Supabase (migración)
              await api.saveBugReports(parsed);
              console.log(`✅ Migrated ${parsed.length} bug reports to Supabase`);
            } catch (error) {
              console.error('Error migrating bug reports:', error);
            }
          }
        }
      }
    };
    
    loadUserData();
  }, [user]);

  // Save user to Supabase whenever it changes
  useEffect(() => {
    if (user) {
      // Guardar en ambos lugares durante la transición
      localStorage.setItem('dietUser', JSON.stringify(user));
      api.saveUser(user);
    }
  }, [user]);

  // Save logs to Supabase whenever they change
  useEffect(() => {
    if (user && dailyLogs.length >= 0) {
      api.saveDailyLogs(user.email, dailyLogs);
    }
  }, [dailyLogs, user]);

  // Save saved diets to Supabase whenever they change
  useEffect(() => {
    if (user && savedDiets.length >= 0) {
      api.saveSavedDiets(user.email, savedDiets);
    }
  }, [savedDiets, user]);

  // Save favorite meal IDs to Supabase when they change
  useEffect(() => {
    if (user && favoriteMealIds.length >= 0) {
      api.saveFavoriteMeals(user.email, favoriteMealIds);
    }
  }, [favoriteMealIds, user]);

  // Save bug reports to Supabase whenever they change
  useEffect(() => {
    if (bugReports.length >= 0) {
      api.saveBugReports(bugReports);
    }
  }, [bugReports]);

  // Auto-save logic: save day automatically at 23:59 in user's timezone
  useEffect(() => {
    if (!user || !user.settings?.autoSaveDays) return;

    const timezone = user.settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const checkAndAutoSave = () => {
      const now = new Date();
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const hours = localTime.getHours();
      const minutes = localTime.getMinutes();
      
      // Check if it's 23:59 in user's timezone
      if (hours === 23 && minutes === 59) {
        const todayDate = new Date(now.toLocaleDateString('en-US', { timeZone: timezone })).toISOString().split('T')[0];
        const currentLog = dailyLogs.find(log => log.date === todayDate);
        
        // Only save if there's data and it's not already saved
        if (currentLog && !currentLog.isSaved) {
          const hasData = currentLog.breakfast || currentLog.lunch || currentLog.snack || currentLog.dinner;
          
          if (hasData) {
            // Auto-save the day
            setDailyLogs(prev => {
              const filtered = prev.filter(log => log.date !== todayDate);
              const updated: DailyLog = {
                ...currentLog,
                isSaved: true
              };
              return [...filtered, updated];
            });
            
            console.log(`[Auto-Save] Day ${todayDate} saved automatically at 23:59 ${timezone}`);
          }
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkAndAutoSave, 60000);
    
    // Check immediately on mount
    checkAndAutoSave();

    return () => clearInterval(interval);
  }, [user, dailyLogs]);

  // NUEVO: Sistema de análisis y ajuste automático semanal
  useEffect(() => {
    if (!user) return;

    const timezone = user.settings?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const checkWeeklyAnalysis = () => {
      const now = new Date();
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const dayOfWeek = localTime.getDay();
      const hours = localTime.getHours();
      const minutes = localTime.getMinutes();
      
      // Ejecutar análisis cada domingo a las 23:59
      if (dayOfWeek === 0 && hours === 23 && minutes === 59) {
        console.log('🤖 [Sistema Adaptativo] Iniciando análisis semanal...');
        
        // 1. Obtener logs de los últimos 7 días
        const today = new Date().toISOString().split('T')[0];
        const last7DaysLogs = dailyLogs.filter(log => {
          const logDate = new Date(log.date);
          const diffDays = Math.floor((new Date(today).getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });
        
        // 2. Generar registro semanal
        const weeklyRecord = generateWeeklyProgress(user, last7DaysLogs);
        
        if (weeklyRecord) {
          console.log('📊 [Sistema Adaptativo] Registro semanal generado:', weeklyRecord);
          
          // 3. Actualizar usuario con nuevo registro semanal
          const updatedUser: User = {
            ...user,
            weeklyProgress: [...(user.weeklyProgress || []), weeklyRecord]
          };
          
          // 4. Analizar si necesita ajuste
          const analysis = analyzeProgress(updatedUser);
          console.log('🔍 [Sistema Adaptativo] Análisis:', analysis);
          
          // 5. Detectar metabolismo adaptado
          const metabolicStatus = detectMetabolicAdaptation(updatedUser);
          console.log('⚠️ [Sistema Adaptativo] Estado metabólico:', metabolicStatus);
          
          // 6. Aplicar ajuste si es necesario
          if (analysis.needsAdjustment) {
            const newGoals = applyAutomaticAdjustment(updatedUser, analysis);
            updatedUser.goals = newGoals;
            
            console.log('✨ [Sistema Adaptativo] Nuevos macros aplicados:', newGoals);
            console.log(`📢 [Sistema Adaptativo] Razón: ${analysis.reason}`);
            
            // Notificar al usuario con modal elegante
            setAdaptiveNotificationData({
              type: 'adjustment',
              title: '🎯 Ajuste Automático Aplicado',
              message: analysis.reason,
              newGoals,
              warnings: analysis.warnings.length > 0 ? analysis.warnings : undefined
            });
            setShowAdaptiveNotification(true);
          }
          
          // 7. Notificar sobre metabolismo adaptado si aplica
          if (metabolicStatus.isAdapted) {
            console.log('⚠️ [Sistema Adaptativo] Metabolismo adaptado detectado!');
            updatedUser.metabolicAdaptation = {
              isAdapted: true,
              adaptationLevel: metabolicStatus.level,
              recommendedPhase: metabolicStatus.recommendedAction.includes('REVERSE') ? 'reverse_diet' : metabolicStatus.recommendedAction.includes('Break') ? 'maintenance' : user.goal.includes('loss') ? 'cut' : 'bulk'
            };
            
            // Notificar con modal elegante
            setAdaptiveNotificationData({
              type: 'metabolic_adaptation',
              title: '⚠️ Metabolismo Adaptado Detectado',
              message: metabolicStatus.recommendedAction,
              warnings: [`Nivel de adaptación: ${metabolicStatus.level.toUpperCase()}`, 'Consulta la sección de Progreso para más detalles']
            });
            setShowAdaptiveNotification(true);
          }
          
          // 8. Si no necesita ajuste y va bien, mostrar confirmación positiva
          if (!analysis.needsAdjustment && !metabolicStatus.isAdapted) {
            setAdaptiveNotificationData({
              type: 'on_track',
              title: '✅ ¡Vas Según el Plan!',
              message: analysis.reason,
              warnings: ['Sigue así, tus resultados son consistentes con tu objetivo']
            });
            setShowAdaptiveNotification(true);
          }
          
          // 8. Guardar usuario actualizado
          setUser(updatedUser);
          localStorage.setItem('dietUser', JSON.stringify(updatedUser));
        } else {
          console.log('ℹ️ [Sistema Adaptativo] No hay suficientes datos para análisis (mínimo 5 días)');
        }
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkWeeklyAnalysis, 60000);
    
    // Verificar inmediatamente al montar
    checkWeeklyAnalysis();

    return () => clearInterval(interval);
  }, [user, dailyLogs]);

  const getCurrentLog = () => {
    return dailyLogs.find(log => log.date === currentDate) || {
      date: currentDate,
      breakfast: null,
      lunch: null,
      snack: null,
      dinner: null
    };
  };

  const updateMealForToday = (type: MealType, meal: Meal | null) => {
    setDailyLogs(prev => {
      const filtered = prev.filter(log => log.date !== currentDate);
      const current = getCurrentLog();
      const updated = {
        ...current,
        date: currentDate,
        [type]: meal
      };
      return [...filtered, updated];
    });
  };

  const resetDay = () => {
    setDailyLogs(prev => prev.filter(log => log.date !== currentDate));
  };

  const copyDay = (sourceDate: string) => {
    const sourceLog = dailyLogs.find(log => log.date === sourceDate);
    if (sourceLog) {
      setDailyLogs(prev => {
        const filtered = prev.filter(log => log.date !== currentDate);
        return [...filtered, { ...sourceLog, date: currentDate }];
      });
    }
  };

  const handleLogin = (email: string, name: string) => {
    const savedUser = localStorage.getItem('dietUser');
    if (savedUser) {
      const existingUser = JSON.parse(savedUser);
      if (existingUser.email === email) {
        // Activar admin automáticamente para ciertos emails
        const adminEmails = ['admin@fuelier.com', 'test@test.com', 'admin@admin.com'];
        const isAdmin = adminEmails.includes(email.toLowerCase());
        
        // Actualizar usuario con isAdmin
        const updatedUser = {
          ...existingUser,
          isAdmin: isAdmin || existingUser.isAdmin || false
        };
        
        // Guardar usuario actualizado
        if (updatedUser.isAdmin !== existingUser.isAdmin) {
          localStorage.setItem('dietUser', JSON.stringify(updatedUser));
        }
        
        setUser(updatedUser);
        setCurrentScreen('dashboard');
      } else {
        alert('Usuario no encontrado. Por favor, regístrate.');
      }
    } else {
      alert('Usuario no encontrado. Por favor, regístrate.');
    }
  };

  const handleAdminLogin = (email: string, password: string) => {
    // Credenciales hardcodeadas
    const ADMIN_EMAIL = 'admin@fuelier.com';
    const ADMIN_PASSWORD = 'Fuelier2025!';
    
    // Verificar credenciales
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return; // La validación ya se hace en AdminLogin, esto es doble check
    }
    
    // Verificar si ya existe un usuario admin en localStorage
    const savedUser = localStorage.getItem('dietUser');
    if (savedUser) {
      const existingUser = JSON.parse(savedUser);
      if (existingUser.email === ADMIN_EMAIL) {
        // Ya existe, hacer login
        const updatedUser = {
          ...existingUser,
          isAdmin: true
        };
        setUser(updatedUser);
        localStorage.setItem('dietUser', JSON.stringify(updatedUser));
        setCurrentScreen('admin');
        return;
      }
    }
    
    // No existe usuario admin, crear uno nuevo con datos dummy para acceder al panel
    const adminUser: User = {
      email: ADMIN_EMAIL,
      name: 'Administrador',
      sex: 'male',
      age: 30,
      weight: 75,
      height: 175,
      goal: 'maintenance',
      trainingFrequency: 3,
      mealsPerDay: 3,
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65
      },
      preferences: {
        likes: [],
        dislikes: [],
        intolerances: [],
        allergies: []
      },
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    setUser(adminUser);
    localStorage.setItem('dietUser', JSON.stringify(adminUser));
    setCurrentScreen('admin');
  };

  const handleSignup = (email: string, name: string) => {
    setTempData({ email, name });
    setCurrentScreen('onboarding-sex');
  };

  const handleSexSelect = (sex: 'male' | 'female') => {
    setTempData(prev => ({ ...prev!, sex }));
    setCurrentScreen('onboarding-age');
  };

  const handleAgeNext = (age: number, birthdate: string) => {
    setTempData(prev => ({ ...prev!, age, birthdate }));
    setCurrentScreen('onboarding-weight');
  };

  const handleWeightNext = (weight: number) => {
    setTempData(prev => ({ ...prev!, weight }));
    setCurrentScreen('onboarding-height');
  };

  const handleHeightNext = (height: number) => {
    setTempData(prev => ({ ...prev!, height }));
    setCurrentScreen('onboarding-activity');
  };

  const handleActivitySelect = (trainingFrequency: number) => {
    setTempData(prev => ({ ...prev!, trainingFrequency }));
    console.log('🏃 handleActivitySelect called');
    console.log('trainingFrequency:', trainingFrequency);
    console.log('tempData before:', tempData);
    console.log('tempData after:', { ...tempData, trainingFrequency });
    console.log('Setting currentScreen to: onboarding-goals');
    setCurrentScreen('onboarding-goals');
  };

  const handleGoalsComplete = (goals: MacroGoals, mealsPerDay: number, goalType: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain') => {
    if (tempData?.sex && tempData?.age && tempData?.weight && tempData?.height && tempData?.trainingFrequency !== undefined) {
      // Save goals, mealsPerDay AND goalType temporarily and go to distribution
      setTempData(prev => ({ ...prev!, goals, mealsPerDay, goal: goalType } as any));
      setCurrentScreen('onboarding-distribution');
    }
  };

  const handleDistributionComplete = (distribution: MealDistribution) => {
    // Save distribution and go to preferences
    setTempData(prev => ({ ...prev!, mealDistribution: distribution } as any));
    setCurrentScreen('onboarding-preferences');
  };

  const handlePreferencesComplete = (preferences: {
    likes: string[];
    dislikes: string[];
    intolerances: string[];
    allergies: string[];
  }) => {
    if (tempData?.sex && tempData?.age && tempData?.weight && tempData?.height && tempData?.trainingFrequency !== undefined) {
      const goals = (tempData as any).goals as MacroGoals;
      const mealsPerDay = (tempData as any).mealsPerDay as number || 3; // Default 3 si no existe
      const goal = (tempData as any).goal as ('rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain') || 'maintenance'; // Get saved goal
      const birthdate = (tempData as any).birthdate as string | undefined; // Obtener fecha de nacimiento
      const mealDistribution = (tempData as any).mealDistribution as MealDistribution | undefined; // Distribución de comidas
      
      console.log('🔍 DEBUG handlePreferencesComplete:');
      console.log('tempData:', tempData);
      console.log('goals from tempData:', goals);
      console.log('mealsPerDay:', mealsPerDay);
      console.log('goal:', goal);
      
      // Verificar si el email es de un admin
      const adminEmails = ['admin@fuelier.com', 'test@test.com', 'admin@admin.com'];
      const isAdmin = adminEmails.includes(tempData.email.toLowerCase());
      
      const newUser: User = {
        email: tempData.email,
        name: tempData.name,
        sex: tempData.sex,
        age: tempData.age || 30, // Default age
        birthdate, // NUEVO: Guardar fecha de nacimiento
        weight: tempData.weight,
        height: tempData.height,
        goal, // Use the goal selected by the user ✅
        trainingFrequency: tempData.trainingFrequency,
        mealsPerDay,
        goals,
        mealDistribution, // NUEVO: Guardar distribución de comidas
        preferences,
        isAdmin, // NUEVO: Activar admin si el email está en la lista
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ newUser created:', newUser);
      console.log('✅ newUser.goals:', newUser.goals);
      
      setUser(newUser);
      setTempData(null);
      setCurrentScreen('dashboard');
    }
  };

  const handleUpdateGoals = (goals: MacroGoals) => {
    if (user) {
      const updatedUser = { ...user, goals };
      setUser(updatedUser);
    }
  };

  const handleUpdateProfile = (weight: number, height: number, trainingFrequency: number, settings?: { autoSaveDays?: boolean; timezone?: string }, age?: number, goal?: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain', mealsPerDay?: number, goals?: MacroGoals) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      weight,
      height,
      trainingFrequency,
      age: age !== undefined ? age : user.age,
      goal: goal || user.goal,
      mealsPerDay: mealsPerDay !== undefined ? mealsPerDay : user.mealsPerDay,
      goals: goals || user.goals,
      settings: {
        ...user.settings,
        ...settings
      }
    };
    
    setUser(updatedUser);
    localStorage.setItem('dietUser', JSON.stringify(updatedUser));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUpdateMealDistribution = (distribution: MealDistribution) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      mealDistribution: distribution
    };
    
    setUser(updatedUser);
    localStorage.setItem('dietUser', JSON.stringify(updatedUser));
  };

  // NUEVA FUNCIÓN: Actualizar preferencias alimenticias
  const handleUpdatePreferences = (preferences: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }) => {
    setUser(prev => ({
      ...prev,
      preferences
    }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('dietUser');
    setUser(null);
    setCurrentScreen('login');
  };

  const handleAddMeal = (type: MealType) => {
    setSelectedMealType(type);
    setCurrentScreen('selection');
  };

  // NUEVA FUNCIÓN: Ver detalle de comida existente (para editar o eliminar)
  const handleViewMealDetail = (type: MealType) => {
    const meal = getCurrentLog()[type];
    if (meal) {
      setSelectedMeal(meal);
      setSelectedMealType(type);
      setCurrentScreen('detail');
    }
  };

  // NUEVA FUNCIÓN: Eliminar comida
  const handleDeleteMeal = (type: MealType) => {
    updateMealForToday(type, null);
    setCurrentScreen('dashboard');
    setSelectedMeal(null);
    setSelectedMealType(null);
  };

  // NUEVA FUNCIÓN: Editar comida (volver a selección)
  const handleEditMeal = (type: MealType) => {
    setSelectedMealType(type);
    setSelectedMeal(null);
    setCurrentScreen('selection');
  };

  const handleSelectMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setCurrentScreen('detail');
  };

  const handleConfirmMeal = (meal: Meal) => {
    if (selectedMealType) {
      updateMealForToday(selectedMealType, meal);
      
      // NUEVO: Si es la cena y no se ha mostrado el modal hoy, verificar si falta 10% o más de algún macro
      if (selectedMealType === 'dinner' && !macroRecommendationShownToday && user) {
        // Calcular macros con la cena incluida
        const currentLog = getCurrentLog();
        const updatedLog = { ...currentLog, dinner: meal };
        
        const consumed = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
        
        // Sumar todas las comidas del día incluyendo la cena recién agregada
        (['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).forEach(type => {
          const mealData = type === 'dinner' ? meal : currentLog[type];
          if (mealData) {
            consumed.calories += mealData.calories || 0;
            consumed.protein += mealData.protein || 0;
            consumed.carbs += mealData.carbs || 0;
            consumed.fat += mealData.fat || 0;
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
        
        // Calcular porcentajes de lo que falta
        const caloriesRemaining = user.goals.calories - consumed.calories;
        const proteinRemaining = user.goals.protein - consumed.protein;
        const carbsRemaining = user.goals.carbs - consumed.carbs;
        const fatRemaining = user.goals.fat - consumed.fat;
        
        const caloriesRemainingPercent = (caloriesRemaining / user.goals.calories) * 100;
        const proteinRemainingPercent = (proteinRemaining / user.goals.protein) * 100;
        const carbsRemainingPercent = (carbsRemaining / user.goals.carbs) * 100;
        const fatRemainingPercent = (fatRemaining / user.goals.fat) * 100;
        
        // Si falta 10% o más de ALGÚN macro específico, mostrar el modal
        const shouldShowModal = 
          proteinRemainingPercent >= 10 ||
          carbsRemainingPercent >= 10 ||
          fatRemainingPercent >= 10;
        
        if (shouldShowModal) {
          // Marcar que ya se mostró el modal hoy
          setMacroRecommendationShownToday(true);
          // Nota: No podemos abrir el modal desde aqu directamente porque Dashboard controla el estado
          // En su lugar, podríamos pasar un callback, pero por ahora el usuario puede abrirlo manualmente
        }
      }
      
      setCurrentScreen('dashboard');
      setSelectedMeal(null);
      setSelectedMealType(null);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'detail') {
      setCurrentScreen('selection');
      setSelectedMeal(null);
    } else if (currentScreen === 'selection') {
      setCurrentScreen('dashboard');
      setSelectedMealType(null);
    } else if (currentScreen === 'create-meal') {
      if (selectedMealType) {
        // Si estamos creando un plato desde la selección de comida, volver a la selección
        setCurrentScreen('selection');
      } else {
        // Si NO hay selectedMealType, significa que venimos de 'custom-meals'
        setCurrentScreen('custom-meals');
      }
    } else if (currentScreen === 'custom-meals') {
      setCurrentScreen('settings');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const saveCurrentDay = () => {
    const currentLog = getCurrentLog();
    
    // Si ya está guardado, solo desguardarlo (toggle)
    if (currentLog.isSaved) {
      const updated: DailyLog = {
        ...currentLog,
        isSaved: false
      };
      
      setDailyLogs(prev => {
        const filtered = prev.filter(log => log.date !== currentDate);
        return [...filtered, updated];
      });
      return;
    }
    
    // Si no está guardado, guardarlo, mostrar modal y REINICIAR el día actual
    const updated: DailyLog = {
      ...currentLog,
      isSaved: true
    };
    
    setDailyLogs(prev => {
      const filtered = prev.filter(log => log.date !== currentDate);
      return [...filtered, updated];
    });
    
    // Mostrar modal de celebración
    setShowDayCompletedModal(true);
    
    // Reiniciar el día actual después de un breve delay para que se vea el guardado
    setTimeout(() => {
      // Crear un nuevo log vacío para el día actual
      const todayDate = new Date().toISOString().split('T')[0];
      setCurrentDate(todayDate);
      // El día actual quedará vacío automáticamente porque no hay log para esa fecha
    }, 500);
  };

  const handleUpdateWeight = (weight: number, date: string) => {
    if (!user) return;
    
    // 1. Actualizar el peso en el log de la fecha específica
    const logForDate = dailyLogs.find(log => log.date === date) || {
      date,
      breakfast: null,
      lunch: null,
      snack: null,
      dinner: null
    };
    
    const updated: DailyLog = {
      ...logForDate,
      weight
    };
    
    setDailyLogs(prev => {
      const filtered = prev.filter(log => log.date !== date);
      return [...filtered, updated];
    });

    // 2. Actualizar el peso del usuario y recalcular macros
    const updatedUser: User = {
      ...user,
      weight
    };

    // 3. Recalcular TMB, TDEE y macros con el nuevo peso
    const bmr = calculateBMR(user.sex, weight, user.height);
    const tdee = calculateTDEE(bmr, user.trainingFrequency);
    
    // Detectar el tipo de objetivo actual basándose en las calorías del usuario
    // Esto es importante para mantener el mismo déficit/superávit porcentual
    let currentGoalType: 'aggressive-cut' | 'moderate-cut' | 'mild-cut' | 'maintenance' | 'mild-bulk' | 'moderate-bulk' = 'maintenance';
    
    const currentDeficitPercent = ((tdee - user.goals.calories) / tdee) * 100;
    
    if (currentDeficitPercent >= 18) {
      currentGoalType = 'aggressive-cut';
    } else if (currentDeficitPercent >= 13) {
      currentGoalType = 'moderate-cut';
    } else if (currentDeficitPercent >= 5) {
      currentGoalType = 'mild-cut';
    } else if (currentDeficitPercent <= -13) {
      currentGoalType = 'moderate-bulk';
    } else if (currentDeficitPercent <= -5) {
      currentGoalType = 'mild-bulk';
    } else {
      currentGoalType = 'maintenance';
    }
    
    // Calcular las calorías objetivo según el tipo de objetivo detectado
    const multipliers = {
      'aggressive-cut': 0.80,
      'moderate-cut': 0.85,
      'mild-cut': 0.90,
      'maintenance': 1.0,
      'mild-bulk': 1.10,
      'moderate-bulk': 1.15
    };
    
    const targetCalories = Math.round(tdee * multipliers[currentGoalType]);
    
    // Calcular macros optimizados con el nuevo peso
    const newMacros = calculateMacros(targetCalories, weight, user.sex, currentGoalType);
    
    // 4. Actualizar el usuario con el nuevo peso y macros
    updatedUser.goals = newMacros;
    
    setUser(updatedUser);
    
    // 5. Guardar en localStorage
    localStorage.setItem('dietUser', JSON.stringify(updatedUser));
  };

  const handleToggleFavorite = (mealId: string) => {
    setFavoriteMealIds(prev => {
      if (prev.includes(mealId)) {
        // Remove from favorites
        return prev.filter(id => id !== mealId);
      } else {
        // Add to favorites
        return [...prev, mealId];
      }
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Onboarding screens
  if (currentScreen === 'onboarding-sex' && tempData) {
    return <QuestionSex onSelect={handleSexSelect} />;
  }

  if (currentScreen === 'onboarding-age' && tempData) {
    return <QuestionAge onNext={handleAgeNext} />;
  }

  if (currentScreen === 'onboarding-weight' && tempData) {
    return <QuestionWeight onNext={handleWeightNext} />;
  }

  if (currentScreen === 'onboarding-height' && tempData) {
    return <QuestionHeight onNext={handleHeightNext} />;
  }

  if (currentScreen === 'onboarding-activity' && tempData) {
    return <QuestionActivity onSelect={handleActivitySelect} />;
  }

  if (currentScreen === 'onboarding-goals' && tempData?.sex && tempData?.age && tempData?.weight && tempData?.height && tempData?.trainingFrequency !== undefined) {
    return (
      <GoalsSummary
        sex={tempData.sex}
        age={tempData.age}
        weight={tempData.weight}
        height={tempData.height}
        trainingFrequency={tempData.trainingFrequency}
        onComplete={handleGoalsComplete}
      />
    );
  }

  if (currentScreen === 'onboarding-distribution' && tempData) {
    return <QuestionDistribution onComplete={handleDistributionComplete} />;
  }

  if (currentScreen === 'onboarding-preferences' && tempData) {
    return <FoodPreferences onComplete={handlePreferencesComplete} />;
  }

  // IMPORTANTE: Verificar admin-login PRIMERO, antes de verificar si hay usuario
  if (currentScreen === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Show login if no user
  if (!user || currentScreen === 'login') {
    return <Login 
      onLogin={handleLogin} 
      onSignup={handleSignup} 
      onAdminAccess={() => {
        console.log('🔐 onAdminAccess called!');
        console.log('Current screen before:', currentScreen);
        setCurrentScreen('admin-login');
        console.log('Setting screen to: admin-login');
      }} 
    />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white min-h-screen">
        {currentScreen === 'dashboard' && (
          <Dashboard
            user={user}
            currentLog={getCurrentLog()}
            dailyLogs={dailyLogs}
            onAddMeal={handleAddMeal}
            onViewMealDetail={handleViewMealDetail}
            onNavigateToSummary={() => setCurrentScreen('summary')}
            onNavigateToHistory={() => setCurrentScreen('history')}
            onNavigateToSettings={() => setCurrentScreen('settings')}
            onAddExtraFood={() => setShowExtraFood(true)}
            onResetDay={resetDay}
            onSaveDay={saveCurrentDay}
            onUpdateWeight={handleUpdateWeight}
            onUpdateMealDistribution={handleUpdateMealDistribution}
            onOpenSavedDiets={() => setShowSavedDiets(true)}
            onOpenAdmin={user.isAdmin ? () => setCurrentScreen('admin') : undefined}
            onSubmitBugReport={(report) => {
              const newReport: BugReport = {
                id: Date.now().toString(),
                userId: user.email,
                userEmail: user.email,
                userName: user.name,
                ...report,
                status: 'pending',
                createdAt: new Date().toISOString()
              };
              setBugReports(prev => [...prev, newReport]);
            }}
            onAddExtraFoodDirect={(food) => {
              const currentLogData = getCurrentLog();
              const updatedLog: DailyLog = {
                ...currentLogData,
                extraFoods: [...(currentLogData.extraFoods || []), food]
              };
              const filteredLogs = dailyLogs.filter(log => log.date !== updatedLog.date);
              setDailyLogs([...filteredLogs, updatedLog]);
            }}
            onNavigateToCreateMeal={() => setCurrentScreen('create-meal')}
            onAddComplementaryMeals={(meals) => {
              const currentLogData = getCurrentLog();
              const updatedLog: DailyLog = {
                ...currentLogData,
                complementaryMeals: meals
              };
              const filteredLogs = dailyLogs.filter(log => log.date !== currentDate);
              setDailyLogs([...filteredLogs, updatedLog]);
            }}
            onRemoveComplementaryMeal={(index) => {
              const currentLogData = getCurrentLog();
              const updatedMeals = [...(currentLogData.complementaryMeals || [])];
              updatedMeals.splice(index, 1);
              const updatedLog: DailyLog = {
                ...currentLogData,
                complementaryMeals: updatedMeals
              };
              const filteredLogs = dailyLogs.filter(log => log.date !== currentDate);
              setDailyLogs([...filteredLogs, updatedLog]);
            }}
          />
        )}
        {currentScreen === 'selection' && selectedMealType && (
          <MealSelection
            user={user}
            currentLog={getCurrentLog()}
            mealType={selectedMealType}
            onSelectMeal={handleSelectMeal}
            onBack={handleBack}
            currentMeal={getCurrentLog()[selectedMealType]}
            favoriteMealIds={favoriteMealIds}
            onToggleFavorite={handleToggleFavorite}
            onNavigateToCreateMeal={() => setCurrentScreen('create-meal')}
          />
        )}
        {currentScreen === 'detail' && selectedMeal && selectedMealType && (
          <MealDetail
            meal={selectedMeal}
            onConfirm={handleConfirmMeal}
            onBack={() => {
              if (getCurrentLog()[selectedMealType] && JSON.stringify(getCurrentLog()[selectedMealType]) === JSON.stringify(selectedMeal)) {
                setCurrentScreen('dashboard');
              } else {
                handleBack();
              }
            }}
            onSelectVariation={handleSelectMeal}
            user={user!}
            currentLog={getCurrentLog()}
            mealType={selectedMealType}
            onEdit={() => handleEditMeal(selectedMealType)}
            onDelete={() => handleDeleteMeal(selectedMealType)}
            isFromDashboard={getCurrentLog()[selectedMealType] !== null && JSON.stringify(getCurrentLog()[selectedMealType]) === JSON.stringify(selectedMeal)}
          />
        )}
        {currentScreen === 'summary' && (
          <DailySummary
            currentLog={getCurrentLog()}
            goals={user.goals}
            onBack={handleBack}
          />
        )}
        {currentScreen === 'history' && (
          <CalendarView
            dailyLogs={dailyLogs}
            onBack={handleBack}
            onCopyDay={copyDay}
            user={user}
          />
        )}
        {currentScreen === 'settings' && (
          <Settings
            user={user}
            onBack={handleBack}
            onUpdateGoals={handleUpdateGoals}
            onUpdateProfile={handleUpdateProfile}
            onUpdatePreferences={handleUpdatePreferences}
            onNavigateToCustomMeals={() => setCurrentScreen('custom-meals')}
            onLogout={handleLogout}
          />
        )}
        {currentScreen === 'custom-meals' && (
          <MyCustomMeals
            user={user}
            onBack={handleBack}
            onCreate={() => {
              setSelectedMealType(null); // Limpiar tipo de comida para creación genérica
              setCurrentScreen('create-meal');
            }}
          />
        )}
        {currentScreen === 'create-meal' && (
          <CreateMeal
            mealType={selectedMealType || undefined}
            onBack={handleBack}
            onSave={(createdMeal: Meal) => {
              try {
                console.log('🎯 Plato creado:', createdMeal);
                
                // Si hay selectedMealType, escalar y actualizar la comida de hoy
                if (selectedMealType && user) {
                  console.log('✅ Escalando plato para', selectedMealType);
                  
                  // 1. Calcular el target inteligente para este tipo de comida
                  const currentLogData = getCurrentLog();
                  const intelligentTarget = calculateIntelligentTarget(
                    user,
                    currentLogData,
                    selectedMealType
                  );
                  
                  console.log('🎯 Target calculado:', intelligentTarget);
                  
                  // 2. Escalar el plato al target exacto
                  const scaledMeal = scaleToExactTarget(
                    createdMeal,
                    intelligentTarget,
                    intelligentTarget.isLastMeal
                  );
                  
                  console.log('📏 Plato escalado:', scaledMeal);
                  
                  // 3. Actualizar el día con el plato escalado
                  updateMealForToday(selectedMealType, scaledMeal);
                } else {
                  console.log('ℹ️ No hay selectedMealType o user, solo guardando plato');
                }
                
                // Limpiar estados y volver al dashboard
                setSelectedMeal(null);
                setSelectedMealType(null);
                setCurrentScreen('dashboard');
              } catch (error) {
                console.error('❌ Error en callback onSave:', error);
                alert('Hubo un error al procesar el plato. Revisa la consola para más detalles.');
                setCurrentScreen('dashboard');
              }
            }}
          />
        )}
        {currentScreen === 'create-ingredient' && user && (
          <CreateIngredient
            userId={user.email}
            onBack={() => setCurrentScreen('settings')}
            onCreated={() => setCurrentScreen('settings')}
          />
        )}
        {currentScreen === 'edit-custom-meal' && (
          <EditCustomMeal
            user={user}
            onBack={handleBack}
          />
        )}
        {currentScreen === 'admin' && user.isAdmin && (
          <AdminPanel
            user={user}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </div>

      {showExtraFood && (
        <ExtraFood
          currentLog={getCurrentLog()}
          onClose={() => setShowExtraFood(false)}
          onSave={(food) => {
            const currentLogData = getCurrentLog();
            const updatedLog: DailyLog = {
              ...currentLogData,
              extraFoods: [...(currentLogData.extraFoods || []), food]
            };
            const filteredLogs = dailyLogs.filter(log => log.date !== updatedLog.date);
            setDailyLogs([...filteredLogs, updatedLog]);
            setShowExtraFood(false);
          }}
          onDelete={(index) => {
            const currentLogData = getCurrentLog();
            const updatedExtras = [...(currentLogData.extraFoods || [])];
            updatedExtras.splice(index, 1);
            const updatedLog: DailyLog = {
              ...currentLogData,
              extraFoods: updatedExtras
            };
            const filteredLogs = dailyLogs.filter(log => log.date !== currentDate);
            setDailyLogs([...filteredLogs, updatedLog]);
          }}
        />
      )}

      {showSavedDiets && (
        <SavedDiets
          savedDiets={savedDiets}
          onClose={() => setShowSavedDiets(false)}
          onApplyDiet={(diet) => {
            const currentLogData = getCurrentLog();
            const updatedLog: DailyLog = {
              ...currentLogData,
              breakfast: diet.breakfast || currentLogData.breakfast,
              lunch: diet.lunch || currentLogData.lunch,
              snack: diet.snack || currentLogData.snack,
              dinner: diet.dinner || currentLogData.dinner
            };
            const filteredLogs = dailyLogs.filter(log => log.date !== currentDate);
            setDailyLogs([...filteredLogs, updatedLog]);
            setShowSavedDiets(false);
          }}
          onDeleteDiet={(dietId) => {
            setSavedDiets(prev => prev.filter(diet => diet.id !== dietId));
          }}
        />
      )}

      {showDayCompletedModal && (
        <DayCompletedModal onClose={() => setShowDayCompletedModal(false)} />
      )}

      {showAdaptiveNotification && adaptiveNotificationData && (
        <AdaptiveNotification
          type={adaptiveNotificationData.type}
          title={adaptiveNotificationData.title}
          message={adaptiveNotificationData.message}
          newGoals={adaptiveNotificationData.newGoals}
          warnings={adaptiveNotificationData.warnings}
          onClose={() => {
            setShowAdaptiveNotification(false);
            setAdaptiveNotificationData(null);
          }}
        />
      )}
    </div>
  );
}