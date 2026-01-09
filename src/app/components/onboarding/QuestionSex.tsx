import { User, UserCircle } from 'lucide-react';

interface QuestionSexProps {
  onSelect: (sex: 'male' | 'female') => void;
}

export default function QuestionSex({ onSelect }: QuestionSexProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-2xl mx-auto w-full">
        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 text-center">Paso 1 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3">¿Cuál es tu sexo?</h1>
          <p className="text-sm sm:text-base text-neutral-500 leading-relaxed">
            Esto nos ayuda a calcular tus necesidades calóricas con mayor precisión
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => onSelect('male')}
            className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-blue-100 group-hover:bg-blue-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 group-hover:text-white transition-all" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-0.5 sm:mb-1">Masculino</h3>
                <p className="text-xs sm:text-sm text-neutral-500">Mayor gasto metabólico basal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('female')}
            className="w-full bg-white border-2 border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-pink-100 group-hover:bg-pink-500 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all flex-shrink-0">
                <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-pink-600 group-hover:text-white transition-all" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-0.5 sm:mb-1">Femenino</h3>
                <p className="text-xs sm:text-sm text-neutral-500">Necesidades específicas ajustadas</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}