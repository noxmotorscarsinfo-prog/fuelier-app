import { useState } from 'react';
import { Ruler, ChevronRight } from 'lucide-react';

interface QuestionHeightProps {
  onNext: (height: number) => void;
}

export default function QuestionHeight({ onNext }: QuestionHeightProps) {
  const [height, setHeight] = useState(170);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-2xl mx-auto w-full">
        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 text-center">Paso 3 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="bg-blue-100 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Ruler className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3 px-4">¿Cuál es tu altura?</h1>
          <p className="text-sm sm:text-base text-neutral-500 px-4">Tu altura en centímetros</p>
        </div>

        {/* Height Input */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-neutral-200 mb-4 sm:mb-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-baseline justify-center gap-2">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="100"
                  max="250"
                  className="text-5xl sm:text-6xl text-center w-28 sm:w-32 bg-transparent border-none focus:outline-none text-blue-600 font-bold"
                />
                <span className="text-2xl sm:text-3xl text-neutral-400">cm</span>
              </div>
            </div>

            <input
              type="range"
              min="140"
              max="220"
              step="1"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs sm:text-sm text-neutral-400 mt-2">
              <span>140 cm</span>
              <span>220 cm</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-800 text-center leading-relaxed">
              💡 Junto con tu peso, determinamos tu metabolismo basal
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => onNext(height)}
          disabled={height < 100 || height > 250}
          className="w-full bg-emerald-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg"
        >
          <span>Continuar</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}