import { useState, useMemo } from 'react';
import { User } from '../types';
import { ArrowRight, ArrowLeft, Target, User as UserIcon, Activity, TrendingUp, Zap, Scale, Ruler, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import { generateMacroOptions, macroOptionToGoals, MacroOption } from '../utils/macroOptions';
import MacroOptionsSelector from './MacroOptionsSelector';

interface OnboardingProps {
  onComplete: (userData: Partial<User>) => void;
}

type Step = 'welcome' | 'basic' | 'body' | 'activity' | 'goals' | 'history' | 'complete';

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [userData, setUserData] = useState<Partial<User>>({
    sex: 'male',
    age: 25,
    weight: 70,
    height: 170,
    goal: 'maintenance',
    trainingFrequency: 3,
    trainingIntensity: 'moderate',
    trainingType: 'mixed',
    lifestyleActivity: 'moderately_active',
    occupation: 'desk_job',
    mealsPerDay: 4,
    preferences: {
      likes: [],
      dislikes: [],
      intolerances: [],
      allergies: []
    }
  });

  const updateUserData = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const steps: Step[] = ['welcome', 'basic', 'body', 'activity', 'goals', 'history', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'basic', 'body', 'activity', 'goals', 'history', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = () => {
    onComplete(userData);
  };

  // Progress bar
  const getProgress = () => {
    const steps: Step[] = ['welcome', 'basic', 'body', 'activity', 'goals', 'history', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  // Macro options
  const macroOptions = useMemo(() => generateMacroOptions(userData), [userData]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
          {/* Welcome Screen */}
          {currentStep === 'welcome' && (
            <div className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-neutral-800 mb-4">
                Bienvenido a <span className="text-emerald-600">Fuelier</span>
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Tu dietista personal basado en ciencia real. Vamos a crear un plan nutricional perfecto para ti.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <Target className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-800">Científico</p>
                  <p className="text-xs text-neutral-600">Cálculos fisiológicos precisos</p>
                </div>
                <div className="bg-teal-50 rounded-2xl p-4">
                  <TrendingUp className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-800">Adaptativo</p>
                  <p className="text-xs text-neutral-600">Se ajusta a tu progreso</p>
                </div>
                <div className="bg-cyan-50 rounded-2xl p-4">
                  <Zap className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-800">Personalizado</p>
                  <p className="text-xs text-neutral-600">100% a tu medida</p>
                </div>
              </div>
              <button
                onClick={nextStep}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 mx-auto"
              >
                Empezar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 p-3 rounded-2xl">
                  <UserIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Información Básica</h2>
                  <p className="text-sm text-neutral-600">Cuéntanos sobre ti</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="onboarding-name" className="block text-sm font-semibold text-neutral-700 mb-2">
                    ¿Cómo te llamas?
                  </label>
                  <input
                    id="onboarding-name"
                    type="text"
                    value={userData.name || ''}
                    onChange={(e) => updateUserData('name', e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Sexo biológico
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateUserData('sex', 'male')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.sex === 'male'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      Hombre
                    </button>
                    <button
                      onClick={() => updateUserData('sex', 'female')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.sex === 'female'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      Mujer
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="onboarding-age" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Edad
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="onboarding-age"
                      type="range"
                      min="15"
                      max="80"
                      value={userData.age || 25}
                      onChange={(e) => updateUserData('age', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-emerald-100 px-4 py-2 rounded-xl font-semibold text-emerald-700 min-w-[80px] text-center">
                      {userData.age} años
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  disabled={!userData.name}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Body Measurements */}
          {currentStep === 'body' && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-teal-100 p-3 rounded-2xl">
                  <Scale className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Medidas Corporales</h2>
                  <p className="text-sm text-neutral-600">Datos antropométricos actuales</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Weight */}
                <div>
                  <label htmlFor="onboarding-weight" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Peso actual (kg)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="onboarding-weight"
                      type="range"
                      min="40"
                      max="150"
                      step="0.5"
                      value={userData.weight || 70}
                      onChange={(e) => updateUserData('weight', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-teal-100 px-4 py-2 rounded-xl font-semibold text-teal-700 min-w-[80px] text-center">
                      {userData.weight} kg
                    </div>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label htmlFor="onboarding-height" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Altura (cm)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="onboarding-height"
                      type="range"
                      min="140"
                      max="220"
                      value={userData.height || 170}
                      onChange={(e) => updateUserData('height', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-teal-100 px-4 py-2 rounded-xl font-semibold text-teal-700 min-w-[80px] text-center">
                      {userData.height} cm
                    </div>
                  </div>
                </div>

                {/* Body Fat (optional) */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <label htmlFor="onboarding-body-fat" className="text-sm font-semibold text-amber-800">
                        % de Grasa Corporal (Opcional)
                      </label>
                      <p className="text-xs text-amber-700">
                        Mejora la precisión de los cálculos. Si no lo sabes, déjalo vacío.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      id="onboarding-body-fat"
                      type="range"
                      min="5"
                      max="50"
                      step="0.5"
                      value={userData.bodyFatPercentage || 20}
                      onChange={(e) => updateUserData('bodyFatPercentage', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-amber-100 px-4 py-2 rounded-xl font-semibold text-amber-700 min-w-[80px] text-center">
                      {userData.bodyFatPercentage || 20}%
                    </div>
                  </div>
                  <button
                    onClick={() => updateUserData('bodyFatPercentage', undefined)}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-2 underline"
                  >
                    No lo sé, omitir
                  </button>
                </div>

                {/* BMI Display */}
                {userData.weight && userData.height && (
                  <div className="bg-neutral-50 rounded-2xl p-4">
                    <p className="text-xs text-neutral-600 mb-1">Tu IMC (Índice de Masa Corporal)</p>
                    <p className="text-2xl font-bold text-neutral-800">
                      {((userData.weight / Math.pow(userData.height / 100, 2)) || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {(() => {
                        const bmi = userData.weight / Math.pow(userData.height / 100, 2);
                        if (bmi < 18.5) return 'Bajo peso';
                        if (bmi < 25) return 'Peso normal';
                        if (bmi < 30) return 'Sobrepeso';
                        return 'Obesidad';
                      })()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {currentStep === 'activity' && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-cyan-100 p-3 rounded-2xl">
                  <Activity className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Nivel de Actividad</h2>
                  <p className="text-sm text-neutral-600">Entrenamiento y estilo de vida</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Training Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    ¿Cuántos días a la semana entrenas?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(days => (
                      <button
                        key={days}
                        onClick={() => updateUserData('trainingFrequency', days)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          userData.trainingFrequency === days
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training Type */}
                {(userData.trainingFrequency || 0) > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Tipo de entrenamiento
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'strength', label: 'Fuerza/Pesas' },
                          { value: 'cardio', label: 'Cardio' },
                          { value: 'mixed', label: 'Mixto' },
                          { value: 'hiit', label: 'HIIT' },
                          { value: 'crossfit', label: 'CrossFit' }
                        ].map(type => (
                          <button
                            key={type.value}
                            onClick={() => updateUserData('trainingType', type.value)}
                            className={`p-3 rounded-xl border-2 transition-all text-sm ${
                              userData.trainingType === type.value
                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Intensidad del entrenamiento
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Ligero' },
                          { value: 'moderate', label: 'Moderado' },
                          { value: 'intense', label: 'Intenso' }
                        ].map(intensity => (
                          <button
                            key={intensity.value}
                            onClick={() => updateUserData('trainingIntensity', intensity.value)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              userData.trainingIntensity === intensity.value
                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            {intensity.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Lifestyle Activity */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    Actividad diaria (trabajo/día a día)
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'sedentary', label: 'Sedentario', desc: 'Trabajo de oficina, poco movimiento' },
                      { value: 'lightly_active', label: 'Ligeramente activo', desc: 'Caminas ocasionalmente' },
                      { value: 'moderately_active', label: 'Moderadamente activo', desc: 'Trabajo de pie o caminando' },
                      { value: 'very_active', label: 'Muy activo', desc: 'Trabajo físico' },
                      { value: 'extremely_active', label: 'Extremadamente activo', desc: 'Atleta o trabajo muy físico' }
                    ].map(activity => (
                      <button
                        key={activity.value}
                        onClick={() => updateUserData('lifestyleActivity', activity.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          userData.lifestyleActivity === activity.value
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <p className={`font-semibold ${
                          userData.lifestyleActivity === activity.value ? 'text-cyan-700' : 'text-neutral-800'
                        }`}>
                          {activity.label}
                        </p>
                        <p className="text-xs text-neutral-600">{activity.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {currentStep === 'goals' && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-3 rounded-2xl">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Tu Objetivo</h2>
                  <p className="text-sm text-neutral-600">¿Qué quieres conseguir?</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Goal Selection */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    Objetivo principal
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'rapid_loss', label: 'Pérdida Rápida', desc: '-0.75kg a -1kg/semana', icon: '🔥' },
                      { value: 'moderate_loss', label: 'Pérdida Moderada', desc: '-0.5kg a -0.75kg/semana', icon: '📉' },
                      { value: 'maintenance', label: 'Mantenimiento', desc: 'Mantener peso actual', icon: '⚖️' },
                      { value: 'moderate_gain', label: 'Ganancia Moderada', desc: '+0.25kg a +0.5kg/semana', icon: '📈' },
                      { value: 'rapid_gain', label: 'Ganancia Rápida', desc: '+0.5kg a +0.75kg/semana', icon: '💪' }
                    ].map(goal => (
                      <button
                        key={goal.value}
                        onClick={() => updateUserData('goal', goal.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          userData.goal === goal.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.icon}</span>
                          <div className="flex-1">
                            <p className={`font-semibold ${
                              userData.goal === goal.value ? 'text-purple-700' : 'text-neutral-800'
                            }`}>
                              {goal.label}
                            </p>
                            <p className="text-xs text-neutral-600">{goal.desc}</p>
                          </div>
                          {userData.goal === goal.value && (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meals per day */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    ¿Cuántas comidas al día prefieres?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map(meals => (
                      <button
                        key={meals}
                        onClick={() => updateUserData('mealsPerDay', meals)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          userData.mealsPerDay === meals
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {meals}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Macro Options */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    ¿Cómo te gustaría distribuir tus macros?
                  </label>
                  <MacroOptionsSelector
                    options={macroOptions}
                    selectedOption={userData.macroOption}
                    onSelect={(option) => updateUserData('macroOption', option)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: History (Optional) */}
          {currentStep === 'history' && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Historial (Opcional)</h2>
                  <p className="text-sm text-neutral-600">Ayuda a personalizar tu plan</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">
                    ¿Por qué preguntamos esto?
                  </p>
                  <p className="text-xs text-blue-700">
                    Las dietas muy restrictivas pueden adaptar tu metabolismo. Saber tu historial nos ayuda a crear un plan más efectivo y sostenible.
                  </p>
                </div>

                {/* Previous restrictive diet */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    ¿Has hecho dietas muy restrictivas antes? (&lt;1200 kcal/día)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateUserData('previousDietHistory', { 
                        ...(userData.previousDietHistory || {}),
                        hadRestrictiveDiet: false 
                      })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.previousDietHistory?.hadRestrictiveDiet === false
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => updateUserData('previousDietHistory', { 
                        ...(userData.previousDietHistory || {}),
                        hadRestrictiveDiet: true 
                      })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.previousDietHistory?.hadRestrictiveDiet === true
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      Sí
                    </button>
                  </div>
                </div>

                {/* Weight regained */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    ¿Has recuperado peso después de una dieta?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateUserData('previousDietHistory', { 
                        ...(userData.previousDietHistory || {}),
                        weightRegained: false 
                      })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.previousDietHistory?.weightRegained === false
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => updateUserData('previousDietHistory', { 
                        ...(userData.previousDietHistory || {}),
                        weightRegained: true 
                      })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        userData.previousDietHistory?.weightRegained === true
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      Sí
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
                >
                  Finalizar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && (
            <div className="p-8 md:p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-neutral-800 mb-4">
                ¡Todo listo, {userData.name}!
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Estamos calculando tu plan nutricional perfecto basado en tus datos.
              </p>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8">
                <p className="text-sm font-semibold text-neutral-800 mb-4">
                  Tu perfil:
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-xs text-neutral-600">Sexo</p>
                    <p className="font-semibold text-neutral-800">{userData.sex === 'male' ? 'Hombre' : 'Mujer'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Edad</p>
                    <p className="font-semibold text-neutral-800">{userData.age} años</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Peso</p>
                    <p className="font-semibold text-neutral-800">{userData.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Altura</p>
                    <p className="font-semibold text-neutral-800">{userData.height} cm</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Entrenamientos</p>
                    <p className="font-semibold text-neutral-800">{userData.trainingFrequency}x/semana</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Objetivo</p>
                    <p className="font-semibold text-neutral-800">
                      {userData.goal === 'rapid_loss' && 'Pérdida Rápida'}
                      {userData.goal === 'moderate_loss' && 'Pérdida Moderada'}
                      {userData.goal === 'maintenance' && 'Mantenimiento'}
                      {userData.goal === 'moderate_gain' && 'Ganancia Moderada'}
                      {userData.goal === 'rapid_gain' && 'Ganancia Rápida'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleComplete}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                ¡Empezar mi viaje!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}