import { useState, useEffect, useMemo } from 'react';
import { User, Meal, MealType, DailyLog, SavedDiet, BugReport, MacroGoals, MealDistribution } from './types';
import LoginAuth from './components/LoginAuth';
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
import TechnicalDocumentation from './components/TechnicalDocumentation';
import DayCompletedModal from './components/DayCompletedModal';
import AdaptiveNotification from './components/AdaptiveNotification';
import { PrivacyPolicy, TermsOfService } from './components/legal';
import { analyzeProgress, applyAutomaticAdjustment, detectMetabolicAdaptation, generateWeeklyProgress } from './utils/adaptiveSystem';
import { calculateMacrosFromUser, calculateBMR, calculateTDEE, calculateMacros } from './utils/macroCalculations';
import { calculateIntelligentTarget } from './utils/automaticTargetCalculator';
import { scaleToExactTarget } from './utils/intelligentMealScaling';
import { Ingredient } from '../data/ingredientTypes';
import * as api from './utils/api';
import logger from './utils/logger';

type Screen = 
  | 'login'
  | 'admin-login'
  | 'privacy-policy'
  | 'terms-of-service'
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
  | 'admin'
  | 'technical-docs';

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
  const [customMealsRefreshTrigger, setCustomMealsRefreshTrigger] = useState(0); // NUEVO: Para refrescar custom meals
  
  // NUEVO: Estados para notificaciones adaptativas
  const [showAdaptiveNotification, setShowAdaptiveNotification] = useState(false);
  const [adaptiveNotificationData, setAdaptiveNotificationData] = useState<{
    type: 'adjustment' | 'metabolic_adaptation' | 'on_track';
    title: string;
    message: string;
    newGoals?: MacroGoals;
    warnings?: string[];
  } | null>(null);

  // Estados para ingredientes (100% cloud)
  const [globalIngredients, setGlobalIngredients] = useState<Ingredient[]>([]);
  const [customIngredients, setCustomIngredients] = useState<Ingredient[]>([]);

  // Combinar ingredientes globales + personalizados
  const allIngredients = useMemo(() => {
    return [...globalIngredients, ...customIngredients];
  }, [globalIngredients, customIngredients]);

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

  // Load user from Supabase ONLY (no localStorage)
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
    
    const recoverSession = async () => {
      try {
        console.log('🔄 [App] Checking for existing session...');
        
        // ✅ Inicializar sistema de autenticación con renovación automática
        await api.initializeAuth();
        console.log('🔄 [App] Auth system initialized');
        
        // Verificar si el usuario quiere recordar sesión
        const rememberSession = localStorage.getItem('fuelier_remember_session');
        console.log(`🔄 [App] Remember session preference: ${rememberSession}`);
        
        if (rememberSession !== 'true') {
          console.log('🔄 [App] User does not want to remember session');
          setIsLoading(false);
          return;
        }
        
        // Intentar recuperar sesión de Supabase
        const { supabase } = await import('../utils/supabaseClient');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('🔄 [App] Error getting session:', error.message);
          setIsLoading(false);
          return;
        }
        
        if (!session?.user) {
          console.log('🔄 [App] No active session found');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ [App] Session recovered for:', session.user.email);
        
        // Establecer token en api.ts para que las peticiones funcionen
        if (session.access_token) {
          api.setAuthToken(session.access_token);
          console.log('✅ [App] Access token set in API client');
        }
        
        // Cargar datos del usuario desde base de datos
        const userData = await api.getUser(session.user.email!);
        
        if (userData) {
          console.log('✅ [App] User data loaded from database');
          setUser(userData);
          setCurrentScreen('dashboard');
        } else {
          console.log('⚠️ [App] User authenticated but no profile found - starting onboarding');
          setTempData({ 
            email: session.user.email!, 
            name: session.user.user_metadata?.name || 'Usuario' 
          });
          setCurrentScreen('onboarding-sex');
        }
        
      } catch (error) {
        console.error('❌ [App] Error recovering session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    recoverSession();
  }, []);

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      console.log('📥 Loading user data from Supabase...');
      
      // Load daily logs from Supabase ONLY
      const logs = await api.getDailyLogs(user.email);
      setDailyLogs(logs);
      console.log(`✅ Loaded ${logs.length} daily logs from Supabase`);
      
      // Load saved diets from Supabase ONLY
      const diets = await api.getSavedDiets(user.email);
      setSavedDiets(diets);
      console.log(`✅ Loaded ${diets.length} saved diets from Supabase`);
      
      // Load favorite meals from Supabase ONLY
      const favorites = await api.getFavoriteMeals(user.email);
      setFavoriteMealIds(favorites);
      console.log(`✅ Loaded ${favorites.length} favorite meals from Supabase`);
      
      // Load bug reports (only for admins)
      if (user.isAdmin) {
        const reports = await api.getBugReports();
        setBugReports(reports);
        console.log(`✅ Loaded ${reports.length} bug reports from Supabase`);
      }
      
      // NUEVO: Load training plan from Supabase
      try {
        const trainingPlan = await api.getTrainingPlan(user.email);
        if (trainingPlan && Array.isArray(trainingPlan) && trainingPlan.length > 0) {
          // VALIDAR estructura del plan antes de usarlo
          const isValidPlan = trainingPlan.every((day: any) => {
            return (
              day &&
              typeof day === 'object' &&
              typeof day.dayName === 'string' &&
              Array.isArray(day.exercises) &&
              day.exercises.every((ex: any) => 
                ex &&
                typeof ex === 'object' &&
                typeof ex.id === 'string' &&
                typeof ex.name === 'string' &&
                typeof ex.sets === 'number' &&
                typeof ex.reps === 'string' &&
                typeof ex.restTime === 'number'
              )
            );
          });
          
          if (isValidPlan) {
            console.log(`✅ Loaded training plan with ${trainingPlan.length} days from Supabase`);
            // Actualizar el objeto user con los datos del plan SOLO SI NO LOS TIENE YA
            setUser(prevUser => {
              if (!prevUser) return prevUser;
              // Evitar loop: solo actualizar si el weekPlan cambió realmente
              const currentPlan = JSON.stringify(prevUser.weekPlan || []);
              const newPlan = JSON.stringify(trainingPlan);
              if (currentPlan === newPlan) {
                console.log('ℹ️ Training plan already up to date, skipping update');
                return prevUser;
              }
              return {
                ...prevUser,
                trainingOnboarded: true,
                trainingDays: trainingPlan.length,
                weekPlan: trainingPlan // ✅ Guardar el plan en el usuario
              };
            });
          } else {
            console.error('⚠️ Training plan has invalid structure, ignoring');
          }
        } else {
          console.log('ℹ️ No training plan found in Supabase');
        }
      } catch (error) {
        console.error('Error loading training plan:', error);
      }
    };
    
    loadUserData();
    
    // Cargar ingredientes globales y personalizados
    const loadIngredients = async () => {
      if (!user?.email) return;
      
      try {
        const [baseIngredients, userIngredients] = await Promise.all([
          api.getGlobalIngredients(),
          api.getCustomIngredients(user.email)
        ]);
        setGlobalIngredients(baseIngredients);
        setCustomIngredients(userIngredients);
        logger.log(`✅ Ingredientes cargados: ${baseIngredients.length} globales, ${userIngredients.length} personalizados`);
      } catch (error) {
        logger.error('Error loading ingredients:', error);
      }
    };
    
    loadIngredients();
  }, [user]);

  // Save user to Supabase ONLY whenever it changes
  useEffect(() => {
    if (user) {
      console.log(`📝 [Effect] User state changed, saving to Supabase: ${user.email}`);
      api.saveUser(user)
        .then(() => console.log(`✅ [Effect] User saved successfully to Supabase: ${user.email}`))
        .catch(error => {
          console.error('❌ [CRITICAL] Error saving user to Supabase:', error);
        });
    }
  }, [user]);

  // Save logs to Supabase ONLY whenever they change
  useEffect(() => {
    if (user && dailyLogs.length >= 0) {
      console.log(`📝 [Effect] Daily logs changed, saving ${dailyLogs.length} logs for: ${user.email}`);
      api.saveDailyLogs(user.email, dailyLogs)
        .then(() => console.log(`✅ [Effect] Daily logs saved successfully: ${dailyLogs.length} logs`))
        .catch(error => {
          console.error('❌ [CRITICAL] Error saving daily logs to Supabase:', error);
        });
    }
  }, [dailyLogs, user]);

  // Save saved diets to Supabase whenever they change
  useEffect(() => {
    if (user && savedDiets.length >= 0) {
      console.log(`📝 [Effect] Saved diets changed, saving ${savedDiets.length} diets for: ${user.email}`);
      api.saveSavedDiets(user.email, savedDiets)
        .then(() => console.log(`✅ [Effect] Saved diets saved successfully: ${savedDiets.length} diets`))
        .catch(error => {
          console.error('❌ [CRITICAL] Error saving diets to Supabase:', error);
        });
    }
  }, [savedDiets, user]);

  // Save favorite meal IDs to Supabase when they change
  useEffect(() => {
    if (user && favoriteMealIds.length >= 0) {
      console.log(`📝 [Effect] Favorite meals changed, saving ${favoriteMealIds.length} favorites for: ${user.email}`);
      api.saveFavoriteMeals(user.email, favoriteMealIds)
        .then(() => console.log(`✅ [Effect] Favorite meals saved successfully: ${favoriteMealIds.length} favorites`))
        .catch(error => {
          console.error('❌ [CRITICAL] Error saving favorite meals to Supabase:', error);
        });
    }
  }, [favoriteMealIds, user]);

  // Save bug reports to Supabase whenever they change
  useEffect(() => {
    if (bugReports.length > 0) { // Solo guardar si hay bug reports
      api.saveBugReports(bugReports).catch(error => {
        console.error('❌ [CRITICAL] Error saving bug reports to Supabase:', error);
        console.error('❌ [CRITICAL] Bug reports data:', JSON.stringify(bugReports, null, 2));
      });
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
          
          // 8. Guardar usuario actualizado (se guarda automáticamente en Supabase por el efecto)
          setUser(updatedUser);
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
    if (sourceLog && user) {
      // IMPORTANTE: Reescalar las comidas a los macros ACTUALES del usuario
      // porque los macros pueden haber cambiado desde que se guardó este día
      
      const scaleMealIfExists = (meal: Meal | null, mealType: MealType): Meal | null => {
        if (!meal) return null;
        
        // Calcular target para este tipo de comida con los macros ACTUALES
        const currentLogData = getCurrentLog();
        const intelligentTarget = calculateIntelligentTarget(
          user,
          currentLogData,
          mealType
        );
        
        // Escalar la comida al target actual
        const scaledMeal = scaleToExactTarget(
          meal,
          intelligentTarget,
          intelligentTarget.isLastMeal,
          allIngredients
        );
        
        return scaledMeal;
      };
      
      // Copiar el día con las comidas reescaladas
      setDailyLogs(prev => {
        const filtered = prev.filter(log => log.date !== currentDate);
        const copiedLog: DailyLog = {
          ...sourceLog,
          date: currentDate,
          isSaved: false, // El día copiado NO está guardado automáticamente
          weight: undefined, // No copiar el peso
          // Reescalar cada comida a los macros actuales
          breakfast: scaleMealIfExists(sourceLog.breakfast, 'breakfast'),
          lunch: scaleMealIfExists(sourceLog.lunch, 'lunch'),
          snack: scaleMealIfExists(sourceLog.snack, 'snack'),
          dinner: scaleMealIfExists(sourceLog.dinner, 'dinner'),
          // Copiar extra foods y complementary meals sin reescalar
          extraFoods: sourceLog.extraFoods || [],
          complementaryMeals: sourceLog.complementaryMeals || []
        };
        return [...filtered, copiedLog];
      });
    }
  };

  const handleLogin = async (email: string, password: string, name: string) => {
    console.log(`[handleLogin] ===== INICIANDO LOGIN =====`);
    console.log(`[handleLogin] Email: ${email}`);
    
    try {
      // Intentar hacer login con Supabase Auth
      const result = await api.signin(email, password);
      
      if (!result.success) {
        console.error(`[handleLogin] ❌ Login falló:`, result.error);
        console.error(`[handleLogin] Error code:`, result.code);
        
        // Mensaje específico según el código de error
        const errorCode = (result as any).code;
        
        if (errorCode === 'user_not_found') {
          alert(
            `❌ CUENTA NO ENCONTRADA\n\n` +
            `El email "${email}" no existe en el sistema.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔧 SOLUCIÓN:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `1️⃣ Haz clic en "Crear cuenta"\n` +
            `2️⃣ Usa una contraseña de mínimo 6 caracteres\n` +
            `3️⃣ Completa el proceso de onboarding\n\n` +
            `💡 Asegúrate de escribir el email correctamente`
          );
        } else if (errorCode === 'wrong_password') {
          alert(
            `❌ CONTRASEÑA INCORRECTA\n\n` +
            `La contraseña que ingresaste es incorrecta.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔧 SOLUCIÓN:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `1️⃣ Verifica que estés usando la contraseña correcta\n` +
            `2️⃣ La contraseña debe tener mínimo 6 caracteres\n` +
            `3️⃣ Verifica que no tengas Bloq Mayús activado\n\n` +
            `⚠️ Si olvidaste tu contraseña:\n` +
            `Por ahora, debes crear una cuenta nueva con un email diferente.`
          );
        } else {
          // Error genérico o desconocido
          const errorMsg = result.error || 'Error al iniciar sesión';
          alert(
            `❌ ERROR AL INICIAR SESIÓN\n\n` +
            `${errorMsg}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔧 SOLUCIÓN:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `1️⃣ Verifica que el email sea correcto\n` +
            `2️⃣ Verifica que la contraseña sea correcta\n` +
            `3️⃣ Si no tienes cuenta, haz clic en "Crear cuenta"\n\n` +
            `💡 Si el problema persiste, intenta con otro email`
          );
        }
        return;
      }
      
      console.log(`[handleLogin] ✅ Auth exitosa, token guardado`);
      
      // Cargar datos del usuario desde la base de datos
      console.log(`[handleLogin] 🔄 Cargando perfil desde base de datos...`);
      const userData = await api.getUser(email);
      
      console.log(`[handleLogin] 🔍 Resultado de getUser:`, userData ? '✅ ENCONTRADO' : '❌ NULL');
      
      if (userData) {
        console.log(`[handleLogin] ✅ Perfil encontrado en base de datos`);
        console.log(`[handleLogin] 📊 Datos del usuario:`, {
          email: userData.email,
          name: userData.name,
          hasGoals: !!userData.goals,
          goalCalories: userData.goals?.calories
        });
        setUser(userData);
        
        setCurrentScreen('dashboard');
      } else {
        console.log(`[handleLogin] ⚠️ Perfil NO encontrado en base de datos`);
        console.log(`[handleLogin] ℹ️ Esto significa que el usuario se autenticó pero no completó el onboarding`);
        
        // Mostrar mensaje al usuario
        alert('👋 Bienvenido de nuevo!\n\n' +
              'Necesitas completar tu perfil para continuar.\n\n' +
              'Te guiaremos por el proceso de configuración (solo toma 2 minutos).');
        
        // Usuario autenticado pero sin perfil completo - iniciar onboarding
        setTempData({ email, name });
        setCurrentScreen('onboarding-sex');
      }
    } catch (error: any) {
      console.error('[handleLogin] ❌ Error inesperado durante login:', error);
      
      alert(`❌ Error al iniciar sesión: ${error.message || 'Error desconocido'}`);
    }
    
    console.log(`[handleLogin] ===== FIN LOGIN =====`);
  };

  const handleAdminLogin = async (email: string, password: string) => {
    // Credenciales hardcodeadas
    const ADMIN_EMAIL = 'admin@fuelier.com';
    const ADMIN_PASSWORD = 'Fuelier2025!';
    
    // Verificar credenciales
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return; // La validación ya se hace en AdminLogin, esto es doble check
    }
    
    try {
      // Intentar cargar usuario existente
      console.log('[handleAdminLogin] Checking if admin user exists...');
      const userData = await api.getUser(email);
      
      if (userData) {
        console.log('[handleAdminLogin] Admin user exists, loading...');
        const userWithAdmin = {
          ...userData,
          isAdmin: true
        };
        setUser(userWithAdmin);
        setCurrentScreen('admin');
        return;
      }
    } catch (error) {
      console.log('[handleAdminLogin] Admin user does not exist yet, will create...');
    }
    
    // Si llegamos aquí, el usuario no existe, crearlo
    try {
      console.log('[handleAdminLogin] Creating admin user profile...');
      
      // Crear perfil de usuario admin
      const adminUser: User = {
        email: ADMIN_EMAIL,
        name: 'Administrador',
        sex: 'male',
        age: 30,
        birthdate: '1995-01-01',
        weight: 75,
        height: 175,
        goal: 'maintenance',
        trainingFrequency: 3,
        trainingIntensity: 'moderate',
        trainingType: 'strength',
        lifestyleActivity: 'moderately_active',
        mealsPerDay: 4,
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65
        },
        mealDistribution: {
          breakfast: 25,
          lunch: 30,
          snack: 15,
          dinner: 30
        },
        preferences: {
          likes: [],
          dislikes: [],
          intolerances: [],
          allergies: [],
          portionPreferences: {}
        },
        acceptedMealIds: [],
        rejectedMealIds: [],
        favoriteMealIds: [],
        favoriteIngredientIds: [],
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      
      // Guardar perfil en Supabase (esto también creará el usuario en Auth si no existe)
      await api.saveUser(adminUser);
      console.log('[handleAdminLogin] Admin profile created and saved successfully');
      
      setUser(adminUser);
      setCurrentScreen('admin');
    } catch (error) {
      console.error('[handleAdminLogin] Error creating admin profile:', error);
      alert('❌ Error al crear perfil de administrador. Por favor, verifica los logs.');
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    console.log(`[handleSignup] Attempting signup for: ${email}`);
    
    try {
      // Crear usuario en Supabase Auth
      const result = await api.signup(email, password, name);
      
      if (!result.success) {
        // Manejar error de email duplicado
        if (result.code === 'email_exists') {
          alert('❌ Este correo ya está registrado.\n\n✅ Por favor inicia sesión en lugar de crear una cuenta nueva.');
          return;
        }
        
        // Manejar error de contraseña débil
        if (result.code === 'weak_password') {
          alert('❌ La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        
        // Error genérico
        alert(`❌ Error al crear cuenta: ${result.error || 'Error desconocido'}`);
        return;
      }
      
      console.log(`[handleSignup] Signup successful, starting onboarding`);
      
      // El backend ya retorna access_token directamente
      if (!result.access_token) {
        console.error('[handleSignup] ❌ No access_token received from backend');
        alert('❌ Error al crear cuenta. Por favor, inicia sesión manualmente.');
        setCurrentScreen('login');
        return;
      }
      
      // El token ya se guardó en api.signup, solo iniciar onboarding
      console.log(`[handleSignup] ✅ Auth token set, starting onboarding`);
      
      // Guardar credenciales temporalmente (INCLUYENDO EL ID del usuario de Supabase Auth)
      const userId = result.user?.id;
      console.log(`[handleSignup] 👤 User ID from signup: ${userId}`);
      setTempData({ email, name, id: userId });
      setCurrentScreen('onboarding-sex');
    } catch (error: any) {
      console.error('[handleSignup] Error during signup:', error);
      alert(`❌ Error al crear cuenta: ${error.message || 'Error desconocido'}`);
    }
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

  const handlePreferencesComplete = async (preferences: {
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
        id: (tempData as any).id, // CRÍTICO: ID del usuario de Supabase Auth
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
      
      // CRÍTICO: Guardar usuario PRIMERO antes de establecer el estado
      // Esto asegura que el perfil exista en la base de datos antes de que
      // otros efectos intenten guardar daily-logs, saved-diets, etc.
      try {
        console.log('💾 Saving user profile to database before setting state...');
        console.log('💾 Auth token status:', api.getAuthToken() ? '✅ Token present' : '❌ No token');
        
        await api.saveUser(newUser);
        console.log('✅ User profile saved successfully to database');
        
        // Solo después de guardar exitosamente, establecer el estado
        setUser(newUser);
        setTempData(null);
        setCurrentScreen('dashboard');
      } catch (error: any) {
        console.error('❌ Error saving user profile:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Auth token:', api.getAuthToken() ? 'Present' : 'Missing');
        
        alert(
          `❌ ERROR AL GUARDAR PERFIL\n\n` +
          `${error.message || 'Error desconocido'}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔧 POSIBLES CAUSAS:\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `1️⃣ Sesión expirada (cierra y abre la app)\n` +
          `2️⃣ Problema de conexión (verifica tu internet)\n` +
          `3️⃣ Backend no desplegado (verifica Supabase)\n\n` +
          `💡 Intenta cerrar la app y volver a iniciar sesión`
        );
      }
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
  };

  // NUEVA FUNCIÓN: Actualizar preferencias alimenticias
  const handleUpdatePreferences = (preferences: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }) => {
    setUser(prev => {
      if (!prev) return prev; // ✅ Proteger contra null
      return {
        ...prev,
        preferences
      };
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = async () => {
    // Limpiar sesión en Supabase y localStorage
    try {
      await api.signout();
      console.log('[handleLogout] ✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('[handleLogout] Error al cerrar sesión:', error);
    }
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

  // Show legal pages
  if (currentScreen === 'privacy-policy') {
    return <PrivacyPolicy onBack={() => setCurrentScreen('login')} />;
  }

  if (currentScreen === 'terms-of-service') {
    return <TermsOfService onBack={() => setCurrentScreen('login')} />;
  }

  // Show login if no user
  if (!user || currentScreen === 'login') {
    return <LoginAuth 
      onLoginSuccess={handleLogin}
      onSignupSuccess={handleSignup}
      onAdminAccess={() => {
        console.log('🔐 onAdminAccess called!');
        console.log('Current screen before:', currentScreen);
        setCurrentScreen('admin-login');
        console.log('Setting screen to: admin-login');
      }}
      onShowPrivacy={() => setCurrentScreen('privacy-policy')}
      onShowTerms={() => setCurrentScreen('terms-of-service')}
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
            onOpenTechnicalDocs={user.isAdmin ? () => setCurrentScreen('technical-docs') : undefined}
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
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              // El efecto se encargará de guardar en Supabase automáticamente
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
            refreshTrigger={customMealsRefreshTrigger}
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
            userEmail={user.email}
            onBack={handleBack}
            onCreate={() => {
              setSelectedMealType(null); // Limpiar tipo de comida para creación genérica
              setCurrentScreen('create-meal');
            }}
          />
        )}
        {currentScreen === 'create-meal' && user && (
          <CreateMeal
            mealType={selectedMealType || undefined}
            userEmail={user.email}
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
                    intelligentTarget.isLastMeal,
                    allIngredients
                  );
                  
                  console.log('📏 Plato escalado:', scaledMeal);
                  
                  // 3. Actualizar el día con el plato escalado
                  updateMealForToday(selectedMealType, scaledMeal);
                } else {
                  console.log('ℹ️ No hay selectedMealType o user, solo guardando plato');
                }
                
                // ✅ NUEVO: Incrementar trigger para refrescar custom meals en UI
                setCustomMealsRefreshTrigger(prev => prev + 1);
                
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
        {currentScreen === 'technical-docs' && user.isAdmin && (
          <TechnicalDocumentation
            user={user}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </div>

      {showExtraFood && (
        <ExtraFood
          user={user!}
          currentLog={getCurrentLog()}
          onClose={() => setShowExtraFood(false)}
          onAdd={(food) => {
            const currentLogData = getCurrentLog();
            const updatedLog: DailyLog = {
              ...currentLogData,
              extraFoods: [...(currentLogData.extraFoods || []), food]
            };
            const filteredLogs = dailyLogs.filter(log => log.date !== updatedLog.date);
            setDailyLogs([...filteredLogs, updatedLog]);
            setShowExtraFood(false);
          }}
        />
      )}

      {showSavedDiets && (
        <SavedDiets
          savedDiets={savedDiets}
          onClose={() => setShowSavedDiets(false)}
          onApplyDiet={(diet) => {
            if (!user) return;
            
            // IMPORTANTE: Reescalar las comidas de la dieta guardada a los macros ACTUALES del usuario
            const scaleMealIfExists = (meal: Meal | null, mealType: MealType): Meal | null => {
              if (!meal) return null;
              
              // Calcular target para este tipo de comida con los macros ACTUALES
              const currentLogData = getCurrentLog();
              const intelligentTarget = calculateIntelligentTarget(
                user,
                currentLogData,
                mealType
              );
              
              // Escalar la comida al target actual
              const scaledMeal = scaleToExactTarget(
                meal,
                intelligentTarget,
                intelligentTarget.isLastMeal,
                allIngredients
              );
              
              return scaledMeal;
            };
            
            const currentLogData = getCurrentLog();
            const updatedLog: DailyLog = {
              ...currentLogData,
              // Reescalar cada comida a los macros actuales del usuario
              breakfast: scaleMealIfExists(diet.breakfast, 'breakfast'),
              lunch: scaleMealIfExists(diet.lunch, 'lunch'),
              snack: scaleMealIfExists(diet.snack, 'snack'),
              dinner: scaleMealIfExists(diet.dinner, 'dinner')
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