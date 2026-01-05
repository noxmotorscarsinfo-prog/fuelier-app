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
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
          </div>
          <p className="text-sm text-neutral-500 text-center">Paso 4 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl text-neutral-800 mb-3">¿Cuánto entrenas?</h1>
          <p className="text-neutral-500">Nivel de actividad física semanal</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {activities.map((activity) => (
            <button
              key={activity.frequency}
              onClick={() => onSelect(activity.frequency)}
              className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl p-5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{activity.emoji}</div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg text-neutral-800 mb-1">{activity.label}</h3>
                  <p className="text-sm text-neutral-500">{activity.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">{activity.detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
          <p className="text-sm text-blue-800 text-center">
            💡 Tu nivel de actividad multiplica tu gasto calórico diario
          </p>
        </div>
      </div>
    </div>
  );
}