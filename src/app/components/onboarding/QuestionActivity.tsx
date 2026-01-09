import { Dumbbell } from 'lucide-react';

interface QuestionActivityProps {
  onSelect: (frequency: number) => void;
}

export default function QuestionActivity({ onSelect }: QuestionActivityProps) {
  const activities = [
    { 
      frequency: 0, 
      label: 'Sedentario', 
      description: 'Poco o ningún ejercicio',
      detail: 'Factor: 1.2',
      emoji: '🛋️'
    },
    { 
      frequency: 1, 
      label: 'Ligero', 
      description: '1-2 entrenamientos/semana',
      detail: 'Factor: 1.375',
      emoji: '🚶'
    },
    { 
      frequency: 3, 
      label: 'Moderado', 
      description: '3-5 entrenamientos/semana',
      detail: 'Factor: 1.55 (El más común)',
      emoji: '🏃'
    },
    { 
      frequency: 6, 
      label: 'Muy activo', 
      description: '6-7 entrenamientos/semana',
      detail: 'Factor: 1.725',
      emoji: '💪'
    },
    { 
      frequency: 8, 
      label: 'Extra activo', 
      description: 'Entrenamiento intenso diario + alta actividad',
      detail: 'Factor: 1.9',
      emoji: '🏋️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-2xl mx-auto w-full">
        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 text-center">Paso 4 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-orange-100 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3 px-4">¿Cuánto entrenas?</h1>
          <p className="text-sm sm:text-base text-neutral-500 px-4">Nivel de actividad física semanal</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5 sm:space-y-3 mb-6">
          {activities.map((activity) => (
            <button
              key={activity.frequency}
              onClick={() => onSelect(activity.frequency)}
              className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl flex-shrink-0">{activity.emoji}</div>
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mb-0.5 sm:mb-1">{activity.label}</h3>
                  <p className="text-xs sm:text-sm text-neutral-500 leading-snug">{activity.description}</p>
                  <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 sm:mt-1">{activity.detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-800 text-center leading-relaxed">
            💡 Tu nivel de actividad multiplica tu gasto calórico diario
          </p>
        </div>
      </div>
    </div>
  );
}