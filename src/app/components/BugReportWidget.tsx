import { useState } from 'react';
import { Bug, Send, X, AlertCircle } from 'lucide-react';
import { BugReport } from '../types';

interface BugReportWidgetProps {
  onSubmit: (report: Omit<BugReport, 'id' | 'userId' | 'userEmail' | 'userName' | 'createdAt' | 'status'>) => void;
}

export default function BugReportWidget({ onSubmit }: BugReportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'improvement' | 'other'>('bug');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      alert('Por favor completa el título y la descripción');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('bug');
    setPriority('medium');
    setIsOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <Send className="w-5 h-5" />
          <span>¡Reporte enviado! Gracias por tu feedback 🙏</span>
        </div>
      )}

      {/* Widget Button */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Bug className="w-5 h-5" />
          <h3 className="font-semibold">¿Encontraste un problema?</h3>
        </div>
        <p className="text-orange-50 text-sm leading-relaxed mb-4">
          🐛 Ayúdanos a mejorar Fuelier reportando bugs, sugiriendo mejoras o compartiendo tus ideas.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-white text-orange-600 py-3 rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium shadow-md"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Reportar Problema</span>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-6 rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bug className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Reportar Problema o Sugerencia</h2>
                    <p className="text-orange-100 text-sm">Tu feedback nos ayuda a mejorar</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 font-medium">Tipo de Reporte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCategory('bug')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      category === 'bug'
                        ? 'border-red-500 bg-red-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-neutral-800">Bug / Error</span>
                    </div>
                    <p className="text-xs text-neutral-500">Algo no funciona correctamente</p>
                  </button>

                  <button
                    onClick={() => setCategory('feature')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      category === 'feature'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-neutral-800">Nueva Funcionalidad</span>
                    </div>
                    <p className="text-xs text-neutral-500">Sugiere una nueva función</p>
                  </button>

                  <button
                    onClick={() => setCategory('improvement')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      category === 'improvement'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-neutral-800">Mejora</span>
                    </div>
                    <p className="text-xs text-neutral-500">Optimiza algo existente</p>
                  </button>

                  <button
                    onClick={() => setCategory('other')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      category === 'other'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-neutral-800">Otro</span>
                    </div>
                    <p className="text-xs text-neutral-500">Cualquier otro feedback</p>
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 font-medium">Prioridad</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPriority('low')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      priority === 'low'
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-800">Baja</p>
                    <p className="text-xs text-neutral-500">No urgente</p>
                  </button>

                  <button
                    onClick={() => setPriority('medium')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-800">Media</p>
                    <p className="text-xs text-neutral-500">Importante</p>
                  </button>

                  <button
                    onClick={() => setPriority('high')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-800">Alta</p>
                    <p className="text-xs text-neutral-500">Crítico</p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 font-medium">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Error al guardar comida personalizada"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-neutral-400 mt-1">{title.length}/100 caracteres</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-neutral-700 mb-2 font-medium">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el problema con el mayor detalle posible. Incluye pasos para reproducirlo si es un bug."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-neutral-400 mt-1">{description.length}/500 caracteres</p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Tu reporte será revisado</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      El equipo de Fuelier revisará tu reporte y trabajará en resolverlo lo antes posible. 
                      Agradecemos tu colaboración para hacer de Fuelier una mejor app 🙏
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-neutral-100 text-neutral-700 py-3 rounded-xl hover:bg-neutral-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
