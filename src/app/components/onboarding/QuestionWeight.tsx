import { useState } from 'react';
import { Scale, ChevronRight } from 'lucide-react';

interface QuestionWeightProps {
  onNext: (weight: number) => void;
}

export default function QuestionWeight({ onNext }: QuestionWeightProps) {
  const [weight, setWeight] = useState(70);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-neutral-200 rounded-full"></div>
          </div>
          <p className="text-sm text-neutral-500 text-center">Paso 2 de 4</p>
        </div>

        {/* Question */}
        <div className="text-center mb-12">
          <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl text-neutral-800 mb-3">¿Cuál es tu peso?</h1>
          <p className="text-neutral-500">Tu peso actual en kilogramos</p>
        </div>

        {/* Weight Input */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-neutral-200 mb-6">
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-2">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min="30"
                  max="300"
                  className="text-6xl text-center w-32 bg-transparent border-none focus:outline-none text-emerald-600"
                />
                <span className="text-3xl text-neutral-400">kg</span>
              </div>
            </div>

            <input
              type="range"
              min="30"
              max="150"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-sm text-neutral-400 mt-2">
              <span>30 kg</span>
              <span>150 kg</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-800 text-center">
              💡 El peso es fundamental para calcular tus necesidades de proteína
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={() => onNext(weight)}
          disabled={weight < 30 || weight > 300}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continuar</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
