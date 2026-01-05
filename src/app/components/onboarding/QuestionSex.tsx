import { User, UserCircle } from 'lucide-react';

interface QuestionSexProps {
  onSelect: (sex: 'male' | 'female') => void;
}

export default function QuestionSex({ onSelect }: QuestionSexProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
          </div>
          <p className="text-sm text-neutral-500 text-center">Paso 1 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-12">
          <h1 className="text-3xl text-neutral-800 mb-3">¿Cuál es tu sexo?</h1>
          <p className="text-neutral-500">
            Esto nos ayuda a calcular tus necesidades calóricas con mayor precisión
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={() => onSelect('male')}
            className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 group-hover:bg-blue-500 p-4 rounded-2xl transition-all">
                <User className="w-8 h-8 text-blue-600 group-hover:text-white transition-all" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl text-neutral-800 mb-1">Masculino</h3>
                <p className="text-sm text-neutral-500">Mayor gasto metabólico basal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('female')}
            className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl p-6 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-pink-100 group-hover:bg-pink-500 p-4 rounded-2xl transition-all">
                <UserCircle className="w-8 h-8 text-pink-600 group-hover:text-white transition-all" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl text-neutral-800 mb-1">Femenino</h3>
                <p className="text-sm text-neutral-500">Necesidades específicas ajustadas</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
