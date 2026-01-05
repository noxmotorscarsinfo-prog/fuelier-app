import { useState } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

interface QuestionAgeProps {
  onNext: (age: number, birthdate: string) => void;
}

export default function QuestionAge({ onNext }: QuestionAgeProps) {
  const [birthdate, setBirthdate] = useState<string>('');

  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (date: string): number => {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = birthdate ? calculateAge(birthdate) : 0;
  const isValidAge = age >= 13 && age <= 100;

  const handleSubmit = () => {
    if (isValidAge) {
      onNext(age, birthdate);
    }
  };

  // Calcular fecha máxima (13 años atrás) y mínima (100 años atrás)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-lg mb-4">
            <span className="text-4xl">⛽</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Fuelier
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 bg-emerald-500 h-1.5 rounded-full"></div>
            <div className="flex-1 bg-emerald-500 h-1.5 rounded-full"></div>
            <div className="flex-1 bg-neutral-200 h-1.5 rounded-full"></div>
            <div className="flex-1 bg-neutral-200 h-1.5 rounded-full"></div>
            <div className="flex-1 bg-neutral-200 h-1.5 rounded-full"></div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl">
              <Calendar className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">
            ¿Cuál es tu fecha de nacimiento?
          </h2>
          <p className="text-center text-neutral-600 mb-8">
            La edad es importante para calcular tu metabolismo basal
          </p>

          {/* Date Input */}
          <div className="mb-6">
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full px-4 py-4 text-lg text-center rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
            />
          </div>

          {/* Age Display */}
          {birthdate && (
            <div className="mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
                <p className="text-sm text-neutral-600 mb-2">Tu edad</p>
                <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {age}
                </div>
                <div className="text-sm text-neutral-500 mt-1">años</div>
                
                {!isValidAge && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      {age < 13 ? '⚠️ Debes tener al menos 13 años' : '⚠️ Edad no válida'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 ¿Por qué lo necesitamos?</span>
              <br />
              La edad es un factor clave en la fórmula de Mifflin-St Jeor para calcular tu metabolismo basal (TMB) y tus necesidades calóricas diarias.
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValidAge}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold">Continuar</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-neutral-500 text-sm mt-6">
          Paso 2 de 6 • Tu información está segura
        </p>
      </div>
    </div>
  );
}