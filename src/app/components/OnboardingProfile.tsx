import { useState } from 'react';
import { User, Scale, Ruler, Dumbbell, ChevronRight } from 'lucide-react';

interface OnboardingProfileProps {
  userName: string;
  onComplete: (weight: number, height: number, trainingFrequency: number) => void;
}

export default function OnboardingProfile({ userName, onComplete }: OnboardingProfileProps) {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [trainingFrequency, setTrainingFrequency] = useState(3);
  const [error, setError] = useState('');

  const handleContinue = () => {
    setError('');

    if (weight < 30 || weight > 300) {
      setError('Por favor, introduce un peso válido (30-300 kg)');
      return;
    }

    if (height < 100 || height > 250) {
      setError('Por favor, introduce una altura válida (100-250 cm)');
      return;
    }

    onComplete(weight, height, trainingFrequency);
  };

  const getTrainingLabel = (frequency: number) => {
    if (frequency === 0) return 'Sedentario';
    if (frequency === 1) return 'Muy ligera';
    if (frequency === 2) return 'Ligera';
    if (frequency >= 3 && frequency <= 4) return 'Moderada';
    if (frequency >= 5 && frequency <= 6) return 'Intensa';
    return 'Muy intensa';
  };

  const getActivityDescription = (frequency: number) => {
    if (frequency === 0) return 'Sin actividad física';
    if (frequency === 1) return '1 día por semana';
    if (frequency === 2) return '2 días por semana';
    if (frequency >= 3 && frequency <= 4) return `${frequency} días por semana`;
    if (frequency >= 5 && frequency <= 6) return `${frequency} días por semana`;
    return 'Entrenamiento diario';
  };

  const calculateBMI = () => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-emerald-600' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-amber-600' };
    return { label: 'Obesidad', color: 'text-red-600' };
  };

  const bmi = parseFloat(calculateBMI());
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-2xl mb-2">¡Hola, {userName}! 👋</h1>
        <p className="text-emerald-100">Cuéntanos un poco sobre ti</p>
      </div>

      <div className="px-6 py-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            Esta información nos ayudará a calcular tus necesidades calóricas y de macronutrientes de forma personalizada.
          </p>
        </div>

        {/* Weight Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Scale className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3>Peso</h3>
              <p className="text-sm text-neutral-500">Tu peso actual en kilogramos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              min="30"
              max="300"
              className="flex-1 text-center text-3xl py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="text-2xl text-neutral-500">kg</span>
          </div>

          <input
            type="range"
            min="30"
            max="150"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>30 kg</span>
            <span>150 kg</span>
          </div>
        </div>

        {/* Height Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3>Altura</h3>
              <p className="text-sm text-neutral-500">Tu altura en centímetros</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="100"
              max="250"
              className="flex-1 text-center text-3xl py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-2xl text-neutral-500">cm</span>
          </div>

          <input
            type="range"
            min="140"
            max="220"
            step="1"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>140 cm</span>
            <span>220 cm</span>
          </div>
        </div>

        {/* BMI Display */}
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-5 mb-6 border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Índice de Masa Corporal (IMC)</p>
              <p className="text-3xl text-neutral-800">{bmi}</p>
            </div>
            <div className="text-right">
              <span className={`text-lg ${bmiCategory.color}`}>{bmiCategory.label}</span>
            </div>
          </div>
        </div>

        {/* Training Frequency */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-xl">
              <Dumbbell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3>Actividad Física</h3>
              <p className="text-sm text-neutral-500">¿Cuántos días entrenas a la semana?</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-5xl text-emerald-600">{trainingFrequency}</span>
              <span className="text-xl text-neutral-500">días/semana</span>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{getTrainingLabel(trainingFrequency)}</p>
            <p className="text-xs text-neutral-400">{getActivityDescription(trainingFrequency)}</p>
          </div>

          <input
            type="range"
            min="0"
            max="7"
            step="1"
            value={trainingFrequency}
            onChange={(e) => setTrainingFrequency(Number(e.target.value))}
            className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-2">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>
        </div>

        {/* Activity Level Guide */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h4 className="text-sm mb-3 text-neutral-700">Guía de actividad física:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">0-1 días:</span>
              <span className="text-neutral-500">Sedentario / Muy ligera</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">2-3 días:</span>
              <span className="text-neutral-500">Ligera / Moderada</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">4-5 días:</span>
              <span className="text-neutral-500">Moderada / Intensa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">6-7 días:</span>
              <span className="text-neutral-500">Muy intensa</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <span>Continuar a Objetivos</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
