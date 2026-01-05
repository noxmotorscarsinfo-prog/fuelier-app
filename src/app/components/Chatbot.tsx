import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  userName: string;
}

export default function Chatbot({ userName }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `¡Hola ${userName}! 👋 Soy el asistente de Fuelier. Estoy aquí para ayudarte con cualquier duda sobre la app. ¿En qué puedo ayudarte?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Preguntas sobre macros y calorías
    if (message.includes('macro') || message.includes('proteína') || message.includes('carbohidrato') || message.includes('grasa')) {
      return '📊 **Macros en Fuelier:**\n\nTus macronutrientes (proteínas, carbohidratos y grasas) se calculan automáticamente según tu peso, altura, sexo y frecuencia de entrenamiento.\n\n• **Proteínas**: Esenciales para mantener/ganar músculo\n• **Carbohidratos**: Tu fuente principal de energía\n• **Grasas**: Necesarias para hormonas y salud\n\nPuedes ver tu progreso en el Dashboard central con las barras de colores. ¡Intenta cumplir tus objetivos diarios!';
    }

    if (message.includes('tdee') || message.includes('tmb') || message.includes('metabolismo')) {
      return '⚡ **Metabolismo (TMB y TDEE):**\n\n• **TMB** (Tasa Metabólica Basal): Calorías que quemas en reposo absoluto\n• **TDEE** (Gasto Energético Total Diario): TMB + actividad física\n\nTu TDEE se calcula multiplicando tu TMB por un factor según tus días de entrenamiento semanal. Encuentra esta info en el sidebar izquierdo del Dashboard.';
    }

    if (message.includes('peso') || message.includes('actualizar peso')) {
      return '⚖️ **Actualizar tu peso:**\n\n1. Ve al Dashboard\n2. Busca el widget "Peso de Hoy" en el sidebar derecho\n3. Ingresa tu peso actual\n4. Presiona "Guardar Peso"\n\n✨ **¡Importante!** Cuando actualizas tu peso, tus macros se recalculan automáticamente para optimizar tu dieta.';
    }

    // Preguntas sobre comidas
    if (message.includes('comida') || message.includes('desayuno') || message.includes('cena') || message.includes('merienda') || message.includes('agregar')) {
      return '🍽️ **Agregar Comidas:**\n\n1. En el Dashboard, verás 4 slots: Desayuno, Comida, Merienda y Cena\n2. Haz clic en cualquier slot vacío o en una comida existente para cambiarla\n3. Selecciona tu comida de la lista\n4. El sistema te recomendará la porción óptima según tus macros restantes\n5. ¡Listo! La comida se agregará automáticamente\n\nTambién puedes usar el botón "Añadir Alimento Extra" para agregar snacks adicionales.';
    }

    if (message.includes('recomendación') || message.includes('sugerencia') || message.includes('sugiere')) {
      return '🎯 **Sistema de Recomendación Inteligente:**\n\nCuando seleccionas una comida, Fuelier analiza:\n• Tus macros restantes del día\n• Tus preferencias alimentarias\n• Alergias e intolerancias\n• El tipo de comida (desayuno, comida, etc.)\n\nLuego calcula la porción exacta para que cumplas tus objetivos sin pasarte. ¡Es como tener un nutricionista personal!';
    }

    // Preguntas sobre historial y calendario
    if (message.includes('historial') || message.includes('calendario') || message.includes('días anteriores')) {
      return '📅 **Historial y Calendario:**\n\nAccede desde el Dashboard (botón "Calendario") para ver:\n• Calendario mensual con todos tus días registrados\n• Puntuación de cumplimiento de macros (0-100%)\n• Colores según rendimiento (verde = excelente, rojo = bajo)\n• Opción de copiar comidas de días anteriores\n\nTambién puedes ver el "Progreso Semanal" en el sidebar derecho del Dashboard.';
    }

    if (message.includes('copiar día') || message.includes('repetir día')) {
      return '📋 **Copiar Días Anteriores:**\n\n1. Ve al Historial/Calendario\n2. Selecciona un día que quieras copiar\n3. Presiona "Copiar Día"\n4. Las comidas se copiarán a tu día actual\n\n¡Perfecto para cuando quieres repetir un día que te funcionó bien!';
    }

    // Preguntas sobre dietas guardadas
    if (message.includes('dieta guardada') || message.includes('guardar día') || message.includes('plantilla')) {
      return '💾 **Dietas Guardadas:**\n\n**Guardar un día:**\n1. Completa tu día con las 4 comidas\n2. Presiona "Guardar Día en Calendario"\n3. El día se marca como guardado ✓\n\n**Ver dietas guardadas:**\n• Botón "Dietas Guardadas" en la navegación superior\n• Ahí verás todos tus días guardados\n• Puedes aplicar cualquier dieta guardada a tu día actual\n\n¡Ideal para tener tus días favoritos siempre a mano!';
    }

    // Preguntas sobre objetivos
    if (message.includes('objetivo') || message.includes('perder peso') || message.includes('ganar músculo') || message.includes('mantenimiento')) {
      return '🎯 **Objetivos en Fuelier:**\n\n• **Pérdida de peso**: Déficit calórico (80-90% del TDEE)\n• **Mantenimiento**: Calorías = TDEE\n• **Ganancia muscular**: Superávit calórico (110-115% del TDEE)\n\nTu objetivo actual se configuró en el onboarding inicial. Si quieres cambiarlo, ve a Ajustes > Editar Perfil y recalcula tus macros con un nuevo objetivo.';
    }

    // Preguntas sobre preferencias
    if (message.includes('preferencia') || message.includes('alergia') || message.includes('intolerancia') || message.includes('me gusta') || message.includes('no me gusta')) {
      return '⚙️ **Preferencias Alimentarias:**\n\nPuedes configurar:\n• ✅ Alimentos que te gustan\n• ❌ Alimentos que no te gustan\n• 🚫 Alergias\n• ⚠️ Intolerancias\n\n**Cómo editarlas:**\n1. Ve a Ajustes\n2. Busca "Preferencias Alimentarias"\n3. Agrega o elimina alimentos\n\nEl sistema de recomendación respetará tus preferencias al sugerir comidas.';
    }

    // Preguntas sobre resetear
    if (message.includes('reset') || message.includes('reiniciar') || message.includes('borrar día')) {
      return '🔄 **Reiniciar el Día:**\n\nSi quieres empezar de cero:\n1. En el Dashboard, haz clic en "Reset" (esquina superior del panel de macros)\n2. Se borrarán todas las comidas del día actual\n3. Tus macros volverán a 0\n\n⚠️ **Cuidado:** Esta acción no se puede deshacer. Si habías guardado el día, se perderá el registro.';
    }

    // Preguntas sobre el progreso semanal
    if (message.includes('progreso') || message.includes('semanal') || message.includes('puntuación')) {
      return '📈 **Progreso Semanal:**\n\nVe los últimos 7 días en el widget del sidebar derecho. Cada día muestra:\n• **Número**: Puntuación 0-100% de cumplimiento de macros\n• **Color del círculo**:\n  - 🟢 Verde: 90-100% (Excelente)\n  - 🟡 Amarillo: 70-89% (Bueno)\n  - 🟠 Naranja: 50-69% (Regular)\n  - 🔴 Rojo: < 50% (Mejorable)\n\nMantén una racha verde para resultados óptimos!';
    }

    // Preguntas sobre alimentos extra
    if (message.includes('extra') || message.includes('snack') || message.includes('añadir alimento')) {
      return '🍫 **Alimentos Extra:**\n\nSi necesitas agregar snacks o alimentos fuera de las 4 comidas principales:\n1. Presiona "Añadir Alimento Extra" (botón morado)\n2. Selecciona el alimento\n3. Define la porción\n4. Se sumará a tus macros del día\n\n¡Perfecto para esos antojos controlados o comidas adicionales!';
    }

    // Preguntas sobre comidas personalizadas
    if (message.includes('personalizada') || message.includes('crear comida') || message.includes('mis platos') || message.includes('ingrediente')) {
      return '👨‍🍳 **Comidas Personalizadas:**\n\nCrea tus propias recetas:\n1. Ve a Ajustes > Mis Comidas Personalizadas\n2. Presiona "Crear Nueva Comida"\n3. Agrega ingredientes uno por uno\n4. Define las porciones\n5. ¡Guarda tu receta!\n\nTambién puedes crear ingredientes personalizados si no encuentras algo en la base de datos. Tus comidas aparecerán en la selección de comidas.';
    }

    // Preguntas sobre el resumen diario
    if (message.includes('resumen') || message.includes('estadística') || message.includes('análisis')) {
      return '📊 **Resumen Diario:**\n\nAccede desde el Dashboard (botón "Resumen Diario") para ver:\n• Gráficos de distribución de macros\n• Comparativa con tus objetivos\n• Análisis detallado de cada comida\n• Recomendaciones para mejorar\n• Progreso de calorías por comida\n\n¡Una vista completa de tu día nutricional!';
    }

    // Preguntas sobre entrenamientos
    if (message.includes('entreno') || message.includes('ejercicio') || message.includes('actividad física') || message.includes('gimnasio')) {
      return '💪 **Frecuencia de Entrenamiento:**\n\nTu frecuencia de entrenamiento afecta directamente tu TDEE:\n• 0 días: Sedentario (x1.2)\n• 1-2 días: Ligero (x1.375 - x1.465)\n• 3-4 días: Moderado (x1.55 - x1.6)\n• 5-6 días: Activo (x1.725 - x1.8)\n• 7+ días: Muy activo (x1.9)\n\nPuedes actualizar tu frecuencia en Ajustes para recalcular tus macros.';
    }

    // Preguntas generales sobre la app
    if (message.includes('cómo funciona') || message.includes('como usar') || message.includes('tutorial') || message.includes('guía')) {
      return '📱 **Cómo usar Fuelier:**\n\n**1. Dashboard**: Tu pantalla principal\n- Ve tus macros del día\n- Agrega comidas a Desayuno, Comida, Merienda y Cena\n- Registra tu peso diario\n\n**2. Selección de Comidas**: Elige tus platos\n- El sistema recomienda porciones óptimas\n- Respeta tus preferencias y alergias\n\n**3. Historial**: Revisa tu progreso\n- Calendario mensual con puntuaciones\n- Copia días exitosos\n\n**4. Ajustes**: Personaliza tu experiencia\n- Edita preferencias\n- Crea comidas personalizadas\n- Actualiza tu perfil';
    }

    if (message.includes('gracias') || message.includes('thank')) {
      return '¡De nada! 😊 Estoy aquí para ayudarte en tu viaje nutricional. ¿Algo más en lo que pueda asistirte?';
    }

    if (message.includes('hola') || message.includes('hey') || message.includes('hi')) {
      return `¡Hola de nuevo ${userName}! 👋 ¿En qué puedo ayudarte hoy?`;
    }

    // Respuesta por defecto
    return `Hmm, no estoy seguro de entender tu pregunta. 🤔\n\nPuedo ayudarte con:\n\n• 📊 Macros y calorías\n• 🍽️ Agregar comidas\n• 📅 Historial y calendario\n• 💾 Dietas guardadas\n• 🎯 Objetivos nutricionales\n• ⚙️ Preferencias alimentarias\n• 💪 Entrenamientos y TDEE\n• 👨‍🍳 Comidas personalizadas\n\n¿Sobre qué tema te gustaría saber más?`;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular delay de escritura del bot
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    '¿Cómo agregar comidas?',
    '¿Qué es el TDEE?',
    '¿Cómo actualizar mi peso?',
    '¿Cómo funciona la app?'
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-full shadow-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all z-50 animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-neutral-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Asistente Fuelier</h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Siempre disponible
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'bot' 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                }`}>
                  {message.sender === 'bot' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    message.sender === 'bot'
                      ? 'bg-white border border-neutral-200 text-neutral-800'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && !isTyping && (
            <div className="px-4 py-3 border-t border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(question);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-neutral-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
