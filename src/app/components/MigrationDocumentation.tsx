import React, { useRef } from 'react';
import { Download, FileText, Database, Code, Layout, CheckCircle, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MigrationDocumentation() {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    if (!documentRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Get the document content
      const element = documentRef.current;
      
      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      pdf.save('Fuelier_Migration_Documentation.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-emerald-600 mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Documentación de Migración - Fuelier
            </h1>
            <p className="text-gray-600">Guía completa para migrar de Figma Make a Lovable</p>
          </div>
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div ref={documentRef} className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-12 space-y-12">
        
        {/* 1. RESUMEN DEL PROYECTO */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-emerald-600 pb-3">
            <FileText className="w-7 h-7 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">1. Resumen del Proyecto</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-emerald-900 mb-3">Nombre del Proyecto</h3>
              <p className="text-emerald-800 text-lg font-semibold">Fuelier - Gestión Personal de Dieta y Macros</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Objetivo</h3>
              <p className="text-gray-700 leading-relaxed">
                Sistema adaptativo de gestión nutricional basado en fisiología real que aprende del usuario automáticamente. 
                Observa patrones naturales y se adapta según feedback fisiológico, calculando dietas ideales considerando 
                datos antropométricos completos, factor de actividad detallado, objetivos específicos, reparto científico 
                de macronutrientes, historial metabólico y factores individuales como adherencia y preferencias.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Principales Flujos de Usuario</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">1. Registro y Onboarding</p>
                    <p className="text-gray-600 text-sm">Email/Password → Datos personales → Objetivos → Preferencias alimenticias → Cálculo de macros</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">2. Uso Diario</p>
                    <p className="text-gray-600 text-sm">Dashboard → Selección de comidas (desayuno/almuerzo/snack/cena) → Comidas escalables 100% a macros → Registro de peso</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">3. Gestión Avanzada</p>
                    <p className="text-gray-600 text-sm">Historial completo → Dietas guardadas → Comidas personalizadas → Análisis de progreso → Adaptación automática</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">4. Panel de Administración</p>
                    <p className="text-gray-600 text-sm">Gestión de comidas globales → Ingredientes → Reportes de bugs → Análisis de usuarios</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. ESTRUCTURA DE DATOS */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-blue-600 pb-3">
            <Database className="w-7 h-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">2. Estructura de Datos</h2>
          </div>

          <div className="space-y-6">
            {/* Pantallas y Formularios */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Pantallas del Sistema</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-blue-900">Autenticación</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Login (email/password)</li>
                    <li>• Signup</li>
                    <li>• Admin Login</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-blue-900">Onboarding (9 pasos)</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Sexo</li>
                    <li>• Edad y Fecha de Nacimiento</li>
                    <li>• Peso y Altura</li>
                    <li>• Actividad Física</li>
                    <li>• Objetivos</li>
                    <li>• Número de Comidas</li>
                    <li>• Opciones de Macros</li>
                    <li>• Distribución de Comidas</li>
                    <li>• Preferencias Alimenticias</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-blue-900">App Principal</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Dashboard</li>
                    <li>• Selección de Comidas</li>
                    <li>• Detalles de Comida</li>
                    <li>• Historial</li>
                    <li>• Perfil</li>
                    <li>• Configuración</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-blue-900">Funcionalidades</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Crear Comida Personalizada</li>
                    <li>• Crear Ingrediente</li>
                    <li>• Dietas Guardadas</li>
                    <li>• Reporte de Bugs</li>
                    <li>• Panel Admin</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tablas de Supabase */}
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h3 className="text-lg font-semibold">Tablas en Supabase PostgreSQL</h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Tabla: users */}
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">users</h4>
                  <p className="text-sm text-gray-600 mb-3">Perfiles completos de usuarios</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-700 font-semibold">Campo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Tipo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b"><td className="py-1">id</td><td>UUID</td><td>PK, from Supabase Auth</td></tr>
                        <tr className="border-b"><td className="py-1">email</td><td>TEXT</td><td>UNIQUE, email del usuario</td></tr>
                        <tr className="border-b"><td className="py-1">name</td><td>TEXT</td><td>Nombre completo</td></tr>
                        <tr className="border-b"><td className="py-1">sex</td><td>TEXT</td><td>'male' | 'female'</td></tr>
                        <tr className="border-b"><td className="py-1">age</td><td>INTEGER</td><td>Edad</td></tr>
                        <tr className="border-b"><td className="py-1">weight</td><td>NUMERIC</td><td>Peso (kg)</td></tr>
                        <tr className="border-b"><td className="py-1">height</td><td>NUMERIC</td><td>Altura (cm)</td></tr>
                        <tr className="border-b"><td className="py-1">training_frequency</td><td>INTEGER</td><td>Días de entreno/semana</td></tr>
                        <tr className="border-b"><td className="py-1">goal</td><td>TEXT</td><td>rapid_loss | moderate_loss | maintenance | moderate_gain | rapid_gain</td></tr>
                        <tr className="border-b"><td className="py-1">target_calories</td><td>INTEGER</td><td>Calorías objetivo</td></tr>
                        <tr className="border-b"><td className="py-1">target_protein</td><td>NUMERIC</td><td>Proteína objetivo (g)</td></tr>
                        <tr className="border-b"><td className="py-1">target_carbs</td><td>NUMERIC</td><td>Carbohidratos objetivo (g)</td></tr>
                        <tr className="border-b"><td className="py-1">target_fat</td><td>NUMERIC</td><td>Grasas objetivo (g)</td></tr>
                        <tr className="border-b"><td className="py-1">meal_distribution</td><td>JSONB</td><td>{'{"breakfast":25,"lunch":30,"snack":15,"dinner":30}"}'</td></tr>
                        <tr className="border-b"><td className="py-1">preferences</td><td>JSONB</td><td>Likes, dislikes, allergies, intolerances</td></tr>
                        <tr className="border-b"><td className="py-1">favorite_meal_ids</td><td>TEXT[]</td><td>Array de IDs de comidas favoritas</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla: daily_logs */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">daily_logs</h4>
                  <p className="text-sm text-gray-600 mb-3">Registro diario de comidas y progreso</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-700 font-semibold">Campo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Tipo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b"><td className="py-1">id</td><td>UUID</td><td>PK</td></tr>
                        <tr className="border-b"><td className="py-1">user_id</td><td>UUID</td><td>FK → users.id</td></tr>
                        <tr className="border-b"><td className="py-1">log_date</td><td>DATE</td><td>Fecha del registro</td></tr>
                        <tr className="border-b"><td className="py-1">breakfast</td><td>JSONB</td><td>Objeto Meal completo</td></tr>
                        <tr className="border-b"><td className="py-1">lunch</td><td>JSONB</td><td>Objeto Meal completo</td></tr>
                        <tr className="border-b"><td className="py-1">snack</td><td>JSONB</td><td>Objeto Meal completo</td></tr>
                        <tr className="border-b"><td className="py-1">dinner</td><td>JSONB</td><td>Objeto Meal completo</td></tr>
                        <tr className="border-b"><td className="py-1">weight</td><td>NUMERIC</td><td>Peso del día (opcional)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla: base_meals */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">base_meals</h4>
                  <p className="text-sm text-gray-600 mb-3">Catálogo global de comidas</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-700 font-semibold">Campo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Tipo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b"><td className="py-1">id</td><td>TEXT</td><td>PK, ID único de comida</td></tr>
                        <tr className="border-b"><td className="py-1">name</td><td>TEXT</td><td>Nombre de la comida</td></tr>
                        <tr className="border-b"><td className="py-1">meal_types</td><td>TEXT[]</td><td>Array: breakfast, lunch, snack, dinner</td></tr>
                        <tr className="border-b"><td className="py-1">calories</td><td>NUMERIC</td><td>Calorías por 100g</td></tr>
                        <tr className="border-b"><td className="py-1">protein</td><td>NUMERIC</td><td>Proteína (g/100g)</td></tr>
                        <tr className="border-b"><td className="py-1">carbs</td><td>NUMERIC</td><td>Carbohidratos (g/100g)</td></tr>
                        <tr className="border-b"><td className="py-1">fat</td><td>NUMERIC</td><td>Grasas (g/100g)</td></tr>
                        <tr className="border-b"><td className="py-1">ingredients</td><td>TEXT[]</td><td>Lista de ingredientes</td></tr>
                        <tr className="border-b"><td className="py-1">ingredient_references</td><td>JSONB</td><td>Detalles completos de ingredientes</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla: saved_diets */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">saved_diets</h4>
                  <p className="text-sm text-gray-600 mb-3">Dietas completas guardadas por usuarios</p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-700 font-semibold">Campo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Tipo</th>
                          <th className="text-left py-2 text-gray-700 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b"><td className="py-1">id</td><td>TEXT</td><td>PK</td></tr>
                        <tr className="border-b"><td className="py-1">user_id</td><td>UUID</td><td>FK → users.id</td></tr>
                        <tr className="border-b"><td className="py-1">name</td><td>TEXT</td><td>Nombre de la dieta</td></tr>
                        <tr className="border-b"><td className="py-1">breakfast/lunch/snack/dinner</td><td>JSONB</td><td>Comidas completas</td></tr>
                        <tr className="border-b"><td className="py-1">total_calories/protein/carbs/fat</td><td>NUMERIC</td><td>Totales</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagrama ER Simplificado */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-lg text-white">
              <h3 className="text-xl font-semibold mb-6 text-center">Diagrama ER Simplificado</h3>
              <div className="space-y-4 text-sm font-mono">
                <div className="text-center text-emerald-400">┌─────────────────┐</div>
                <div className="text-center text-emerald-400">│     USERS       │</div>
                <div className="text-center text-emerald-400">└────────┬────────┘</div>
                <div className="text-center text-gray-400">│ 1:N</div>
                <div className="flex justify-around">
                  <div className="text-blue-400">┌──────────────┐<br/>│ DAILY_LOGS   │<br/>└──────────────┘</div>
                  <div className="text-orange-400">┌──────────────┐<br/>│ SAVED_DIETS  │<br/>└──────────────┘</div>
                  <div className="text-purple-400">┌──────────────┐<br/>│ CUSTOM_MEALS │<br/>└──────────────┘</div>
                </div>
                <div className="text-center text-gray-500 mt-6">─────────────────────</div>
                <div className="text-center text-purple-400">┌─────────────────┐</div>
                <div className="text-center text-purple-400">│   BASE_MEALS    │ (Global)</div>
                <div className="text-center text-purple-400">└─────────────────┘</div>
                <div className="text-center text-gray-400 text-xs mt-2">* Referenciada por daily_logs y saved_diets</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. LÓGICA DE LA APP */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-purple-600 pb-3">
            <Code className="w-7 h-7 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">3. Lógica de la Aplicación</h2>
          </div>

          <div className="space-y-6">
            {/* Validaciones */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900 mb-4">Validaciones de Formularios</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-purple-900 mb-2">Onboarding - Datos Personales</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Email: formato válido (regex)</li>
                    <li>• Password: mínimo 6 caracteres</li>
                    <li>• Edad: 16-100 años</li>
                    <li>• Peso: 40-300 kg</li>
                    <li>• Altura: 120-250 cm</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-purple-900 mb-2">Comidas Personalizadas</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Nombre: mínimo 3 caracteres</li>
                    <li>• Al menos 1 ingrediente requerido</li>
                    <li>• Macros: valores numéricos ≥ 0</li>
                    <li>• Tipo de comida: al menos 1 seleccionado</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sistema Adaptativo */}
            <div className="bg-white border-2 border-purple-500 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900 mb-4">🧠 Sistema Adaptativo Inteligente</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-purple-900 mb-2">Escalado Automático de Porciones</p>
                  <p className="bg-purple-50 p-3 rounded-md">
                    <code className="text-xs font-mono">
                      porción = (calorías_objetivo / calorías_base) × 100g<br/>
                      Ejemplo: Si objetivo = 500 kcal y comida base = 250 kcal/100g → porción = 200g
                    </code>
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-purple-900 mb-2">Recomendaciones Inteligentes</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Prioriza comidas con macros cercanos al objetivo del usuario</li>
                    <li>Excluye alimentos en lista de dislikes/intolerancias/alergias</li>
                    <li>Sugiere comidas favoritas del usuario primero</li>
                    <li>Filtra por tipo de comida (desayuno, almuerzo, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acciones de Usuario */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Acciones Principales del Usuario</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-md border-l-4 border-emerald-500">
                  <p className="font-semibold text-gray-900 mb-2">📊 Dashboard</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Ver progreso diario de macros</li>
                    <li>• Acceder a cada tipo de comida</li>
                    <li>• Registrar peso del día</li>
                    <li>• Ver histórico de progreso</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md border-l-4 border-blue-500">
                  <p className="font-semibold text-gray-900 mb-2">🍽️ Selección de Comidas</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Buscar comidas por nombre</li>
                    <li>• Filtrar por tipo de comida</li>
                    <li>• Ver detalles nutricionales</li>
                    <li>• Escalar automáticamente</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md border-l-4 border-purple-500">
                  <p className="font-semibold text-gray-900 mb-2">💾 Guardar Dietas</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Guardar combinación completa del día</li>
                    <li>• Cargar dietas anteriores</li>
                    <li>• Eliminar dietas guardadas</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md border-l-4 border-orange-500">
                  <p className="font-semibold text-gray-900 mb-2">⚙️ Configuración</p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Actualizar datos personales</li>
                    <li>• Modificar objetivos de macros</li>
                    <li>• Cambiar preferencias alimenticias</li>
                    <li>• Cerrar sesión</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. DISEÑO / UI */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-pink-600 pb-3">
            <Layout className="w-7 h-7 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-900">4. Diseño / UI</h2>
          </div>

          <div className="space-y-6">
            {/* Paleta de Colores */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Paleta de Colores Principal</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-full h-20 bg-emerald-600 rounded-lg mb-2 shadow-md"></div>
                  <p className="text-sm font-semibold">Emerald 600</p>
                  <p className="text-xs text-gray-600">#059669</p>
                  <p className="text-xs text-gray-500">Principal</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-emerald-500 rounded-lg mb-2 shadow-md"></div>
                  <p className="text-sm font-semibold">Emerald 500</p>
                  <p className="text-xs text-gray-600">#10b981</p>
                  <p className="text-xs text-gray-500">Hover</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-emerald-50 rounded-lg mb-2 shadow-md border"></div>
                  <p className="text-sm font-semibold">Emerald 50</p>
                  <p className="text-xs text-gray-600">#ecfdf5</p>
                  <p className="text-xs text-gray-500">Fondos</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 shadow-md border"></div>
                  <p className="text-sm font-semibold">Gray 100</p>
                  <p className="text-xs text-gray-600">#f3f4f6</p>
                  <p className="text-xs text-gray-500">Backgrounds</p>
                </div>
              </div>
            </div>

            {/* Tipografía */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tipografía</h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-md">
                  <p className="text-3xl font-bold text-gray-900 mb-2">Headings - Bold</p>
                  <p className="text-xs text-gray-600">font-family: system-ui, -apple-system, sans-serif</p>
                  <p className="text-xs text-gray-600">font-weight: 700</p>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="text-base text-gray-700 mb-2">Body Text - Regular</p>
                  <p className="text-xs text-gray-600">font-weight: 400</p>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Labels - Semibold</p>
                  <p className="text-xs text-gray-600">font-weight: 600</p>
                </div>
              </div>
            </div>

            {/* Componentes Clave */}
            <div className="bg-white border-2 border-pink-500 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-pink-900 mb-4">Componentes Clave por Pantalla</h3>
              <div className="space-y-4 text-sm">
                <div className="border-l-4 border-emerald-500 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Dashboard</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Header con logo y navegación</li>
                    <li>• Cards de progreso de macros con barras de progreso</li>
                    <li>• Grid de tipos de comidas (4 cards)</li>
                    <li>• Botones de acción (Guardar Dieta, Ver Historial)</li>
                    <li>• Footer con navegación inferior</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Selección de Comidas</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Barra de búsqueda con filtros</li>
                    <li>• Lista de comidas con cards (imagen, nombre, macros)</li>
                    <li>• Modal de detalles con ingredientes y porción escalada</li>
                    <li>• Botón "Agregar" destacado en verde</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Onboarding</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Barra de progreso (9 pasos)</li>
                    <li>• Inputs grandes con validación visual</li>
                    <li>• Botones Siguiente/Atrás</li>
                    <li>• Resumen final antes de calcular macros</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Responsividad */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📱 Responsividad</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Mobile First:</strong> Diseño optimizado para dispositivos móviles (320px+)</p>
                <p><strong>Tablet:</strong> Ajustes para pantallas medianas (768px+)</p>
                <p><strong>Desktop:</strong> Layout expandido con max-width de 1200px</p>
                <p className="bg-white p-3 rounded-md mt-3">
                  <code className="text-xs">max-w-md mx-auto</code> en mobile, 
                  <code className="text-xs">max-w-6xl</code> en desktop
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. NOTAS PARA MIGRACIÓN */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-orange-600 pb-3">
            <AlertCircle className="w-7 h-7 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">5. Notas para la Migración</h2>
          </div>

          <div className="space-y-6">
            {/* Orden de Migración */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-orange-900 mb-4">📋 Orden Recomendado de Migración</h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-gray-900">Setup Inicial</p>
                    <p className="text-sm text-gray-600">Configurar Supabase, variables de entorno, autenticación básica</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-gray-900">Crear Tablas</p>
                    <p className="text-sm text-gray-600">Migrar esquema de base de datos (users, daily_logs, base_meals, saved_diets)</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <p className="font-semibold text-gray-900">Autenticación</p>
                    <p className="text-sm text-gray-600">Login, Signup, Admin Login con Supabase Auth</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                  <div>
                    <p className="font-semibold text-gray-900">Onboarding</p>
                    <p className="text-sm text-gray-600">9 pantallas de onboarding con validaciones</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">5</span>
                  <div>
                    <p className="font-semibold text-gray-900">Dashboard Principal</p>
                    <p className="text-sm text-gray-600">Visualización de macros y navegación a comidas</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">6</span>
                  <div>
                    <p className="font-semibold text-gray-900">Sistema de Comidas</p>
                    <p className="text-sm text-gray-600">Selección, detalles, escalado automático, ingredientes</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">7</span>
                  <div>
                    <p className="font-semibold text-gray-900">Funcionalidades Avanzadas</p>
                    <p className="text-sm text-gray-600">Historial, dietas guardadas, comidas personalizadas</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md flex items-start gap-3">
                  <span className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">8</span>
                  <div>
                    <p className="font-semibold text-gray-900">Panel Admin</p>
                    <p className="text-sm text-gray-600">Gestión de comidas globales, ingredientes, bug reports</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consideraciones Críticas */}
            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-red-900 mb-4">⚠️ Consideraciones Críticas</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-red-900 mb-2">🔐 Autenticación</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Implementar RLS (Row Level Security) en todas las tablas</li>
                    <li>• Las políticas deben permitir solo acceso a datos propios del usuario</li>
                    <li>• Admin debe tener permisos especiales (is_admin = true)</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-red-900 mb-2">📊 Datos Iniciales</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Poblar tabla base_meals con catálogo inicial de comidas</li>
                    <li>• Poblar base_ingredients con ingredientes base</li>
                    <li>• Los datos están en /src/app/data/meals.ts e ingredients.ts</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-red-900 mb-2">🔄 Sincronización</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Implementar auto-save cada vez que el usuario registre una comida</li>
                    <li>• Guardar peso del día automáticamente si se ingresa</li>
                    <li>• Manejar conflictos de datos (última escritura gana)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CHECKLIST DE QA */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-4 border-green-600 pb-3">
            <CheckCircle className="w-7 h-7 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">6. Checklist de QA</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 mb-4">✅ Funcionalidades a Verificar</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Registro con email/password funciona</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Login carga datos del usuario correctamente</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Onboarding guarda preferencias en BD</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Dashboard muestra macros correctos</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Seleccionar comida escala porciones bien</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Agregar comida actualiza progreso</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Eliminar comida resta macros</label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Guardar dieta persiste en BD</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Cargar dieta restaura comidas</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Historial muestra registros pasados</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Crear comida personalizada funciona</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Admin puede editar comidas globales</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Preferencias alimenticias filtran comidas</label>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <input type="checkbox" className="mr-2" />
                    <label>Logout limpia sesión correctamente</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Testing Crítico */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-900 mb-4">🧪 Testing Crítico</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-yellow-900 mb-2">Escalado de Macros</p>
                  <p className="text-gray-700">Verificar que las porciones se calculen correctamente según los objetivos del usuario. Comprobar que los macros finales coincidan con el objetivo diario.</p>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-yellow-900 mb-2">Persistencia de Datos</p>
                  <p className="text-gray-700">Cerrar sesión, volver a iniciar, y verificar que TODO persiste (comidas del día, dietas guardadas, preferencias).</p>
                </div>
                <div className="bg-white p-4 rounded-md">
                  <p className="font-semibold text-yellow-900 mb-2">Validaciones de Formularios</p>
                  <p className="text-gray-700">Intentar enviar formularios vacíos, con valores inválidos, y verificar mensajes de error claros.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t-4 border-gray-300">
          <div className="text-center text-gray-600">
            <p className="text-lg font-semibold text-emerald-600 mb-2">Fuelier - Sistema Adaptativo de Nutrición</p>
            <p className="text-sm">Documentación de Migración v1.0</p>
            <p className="text-sm">Generado: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-xs mt-4 text-gray-500">
              Este documento contiene toda la información técnica necesaria para migrar<br/>
              el proyecto desde Figma Make a Lovable sin pérdida de funcionalidad.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
