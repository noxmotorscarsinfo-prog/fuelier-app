import { useState } from 'react';
import { ArrowLeft, Download, FileText, Database, Code, Layout, CheckSquare, GitBranch, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { User } from '../types';
import jsPDF from 'jspdf';

interface TechnicalDocumentationProps {
  onBack: () => void;
  user: User;
}

export default function TechnicalDocumentation({ onBack, user }: TechnicalDocumentationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['resumen']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = 280;
    const margin = 20;

    // Helper para añadir nueva página si es necesario
    const checkNewPage = () => {
      if (yPos > pageHeight) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Portada
    doc.setFontSize(24);
    doc.text('FUELIER', 105, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Documentación Técnica para Migración', 105, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.text('De Figma Make a Lovable', 105, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 105, yPos, { align: 'center' });
    
    doc.addPage();
    yPos = 20;

    // 1. RESUMEN DEL PROYECTO
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN DEL PROYECTO', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const projectInfo = [
      '• Nombre: Fuelier - App de Gestión Personal de Dieta y Macros',
      '• Objetivo: Sistema adaptativo basado en fisiología real que aprende del usuario',
      '  automáticamente, observando patrones naturales y adaptándose según feedback',
      '  fisiológico real.',
      '',
      'Principales Flujos de Usuario:',
      '1. Registro y Onboarding completo con datos antropométricos',
      '2. Configuración de objetivos y preferencias alimenticias',
      '3. Selección de comidas diarias adaptadas a macros objetivo',
      '4. Registro de peso y tracking de progreso',
      '5. Guardado de dietas favoritas',
      '6. Historial completo de hasta 1 año',
      '7. Panel de administración para gestionar base de datos global'
    ];

    projectInfo.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    yPos += 5;
    checkNewPage();

    // 2. ESTRUCTURA DE DATOS
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('2. ESTRUCTURA DE DATOS', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(14);
    doc.text('2.1 Tablas de Supabase', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const tables = [
      {
        name: 'users',
        desc: 'Perfil completo del usuario',
        fields: [
          'id (UUID) - FK de Supabase Auth',
          'email (TEXT UNIQUE)',
          'name, sex, age, birthdate',
          'weight, height, body_fat_percentage, lean_body_mass',
          'training_frequency, training_intensity, training_type',
          'lifestyle_activity, occupation, daily_steps',
          'goal (TEXT) - rapid_loss, moderate_loss, maintenance, etc.',
          'meals_per_day (INT)',
          'target_calories, target_protein, target_carbs, target_fat',
          'selected_macro_option (TEXT)',
          'meal_distribution (JSONB)',
          'previous_diet_history (JSONB)',
          'metabolic_adaptation (JSONB)',
          'preferences (JSONB) - likes, dislikes, allergies, intolerances',
          'accepted_meal_ids, rejected_meal_ids, favorite_meal_ids (ARRAY)',
          'favorite_ingredient_ids (ARRAY)',
          'is_admin (BOOLEAN)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      },
      {
        name: 'daily_logs',
        desc: 'Registro diario de comidas y peso',
        fields: [
          'id (UUID)',
          'user_id (UUID) - FK a users.id',
          'log_date (DATE)',
          'breakfast, lunch, snack, dinner (JSONB)',
          'extra_foods, complementary_meals (JSONB)',
          'weight (DECIMAL)',
          'is_saved (BOOLEAN)',
          'notes (TEXT)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      },
      {
        name: 'saved_diets',
        desc: 'Dietas guardadas por el usuario',
        fields: [
          'id (TEXT)',
          'user_id (UUID) - FK a users.id',
          'name, description (TEXT)',
          'breakfast, lunch, snack, dinner (JSONB)',
          'total_calories, total_protein, total_carbs, total_fat (DECIMAL)',
          'tags (TEXT[])',
          'is_favorite (BOOLEAN)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      },
      {
        name: 'base_meals',
        desc: 'Base de datos global de comidas',
        fields: [
          'id (TEXT)',
          'name (TEXT)',
          'meal_types (TEXT[]) - breakfast, lunch, snack, dinner',
          'variant (TEXT)',
          'calories, protein, carbs, fat (DECIMAL)',
          'base_quantity (DECIMAL)',
          'ingredients (TEXT[])',
          'ingredient_references (JSONB)',
          'preparation_steps (TEXT[])',
          'tips (TEXT[])',
          'created_by (UUID) - FK a users.id (nullable)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      },
      {
        name: 'base_ingredients',
        desc: 'Base de datos global de ingredientes',
        fields: [
          'id (TEXT)',
          'name (TEXT)',
          'calories, protein, carbs, fat (DECIMAL)',
          'category (TEXT)',
          'created_by (UUID) - FK a users.id (nullable)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      },
      {
        name: 'bug_reports',
        desc: 'Sistema de reporte de bugs',
        fields: [
          'id (TEXT)',
          'user_id (UUID) - FK a users.id',
          'user_email, user_name (TEXT)',
          'title, description (TEXT)',
          'category (TEXT) - bug, feature, improvement, other',
          'priority (TEXT) - low, medium, high',
          'status (TEXT) - pending, in-progress, resolved, closed',
          'admin_notes (TEXT)',
          'resolved_at (TIMESTAMP)',
          'created_at, updated_at (TIMESTAMP)'
        ]
      }
    ];

    tables.forEach((table, idx) => {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.text(`${table.name}`, margin, yPos);
      yPos += lineHeight;
      doc.setFont('helvetica', 'italic');
      doc.text(table.desc, margin + 5, yPos);
      yPos += lineHeight;
      doc.setFont('helvetica', 'normal');
      
      table.fields.forEach(field => {
        checkNewPage();
        const lines = doc.splitTextToSize(`  - ${field}`, 170);
        lines.forEach((line: string) => {
          doc.text(line, margin + 5, yPos);
          yPos += lineHeight - 1;
        });
      });
      yPos += 3;
    });

    // 3. DIAGRAMA DE RELACIONES
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DIAGRAMA DE RELACIONES (ER)', margin, yPos);
    yPos += lineHeight + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const relations = [
      'Relaciones principales:',
      '',
      'users (1) ←→ (N) daily_logs',
      '  Un usuario puede tener múltiples registros diarios',
      '',
      'users (1) ←→ (N) saved_diets',
      '  Un usuario puede guardar múltiples dietas',
      '',
      'users (1) ←→ (N) bug_reports',
      '  Un usuario puede reportar múltiples bugs',
      '',
      'base_meals (N) ←→ (N) base_ingredients',
      '  Relación muchos a muchos a través de ingredient_references (JSONB)',
      '',
      'users (1) ←→ (N) base_meals [opcional]',
      '  Comidas creadas por usuarios admin',
      '',
      'users (1) ←→ (N) base_ingredients [opcional]',
      '  Ingredientes creados por usuarios admin',
      '',
      'Índices críticos:',
      '  - users.email (UNIQUE)',
      '  - daily_logs.user_id + log_date (UNIQUE)',
      '  - saved_diets.user_id',
      '  - base_meals.meal_types (GIN index para arrays)',
      '  - bug_reports.status + created_at'
    ];

    relations.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 4. LÓGICA DE LA APP
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('4. LOGICA DE LA APP', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(14);
    doc.text('4.1 Algoritmo de Cálculo de Macros', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const macrosLogic = [
      '1. TMB (Tasa Metabólica Basal) - Mifflin-St Jeor:',
      '   Hombre: 10 × peso + 6.25 × altura - 5 × edad + 5',
      '   Mujer: 10 × peso + 6.25 × altura - 5 × edad - 161',
      '',
      '2. TDEE (Gasto Energético Total Diario):',
      '   TDEE = TMB × Factor de Actividad',
      '   Factores:',
      '   - Sedentario (0 días): 1.2',
      '   - Ligero (1-2 días): 1.375',
      '   - Moderado (3-5 días): 1.55',
      '   - Activo (6-7 días): 1.725',
      '   - Muy activo (atleta): 1.9',
      '',
      '3. Ajuste por objetivo:',
      '   - Pérdida rápida: TDEE - 750 kcal',
      '   - Pérdida moderada: TDEE - 500 kcal',
      '   - Mantenimiento: TDEE',
      '   - Ganancia moderada: TDEE + 300 kcal',
      '   - Ganancia rápida: TDEE + 500 kcal',
      '',
      '4. Distribución de macronutrientes (3 opciones):',
      '   Balanceada: 30% P / 40% C / 30% G',
      '   Alta Proteína: 40% P / 35% C / 25% G',
      '   Baja Carbohidratos: 35% P / 25% C / 40% G'
    ];

    macrosLogic.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    yPos += 5;
    checkNewPage();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4.2 Sistema de Escalado de Comidas', margin, yPos);
    yPos += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const scalingLogic = [
      'Todas las comidas son 100% escalables a nivel de macros:',
      '',
      '1. Factor de escalado = Macros objetivo / Macros base',
      '   Se calcula factor independiente para proteína, carbos y grasa',
      '',
      '2. Ajuste proporcional de ingredientes:',
      '   Cada ingrediente se multiplica por el factor de escalado',
      '',
      '3. Validaciones:',
      '   - Factor mínimo: 0.5 (50% de la receta original)',
      '   - Factor máximo: 2.0 (200% de la receta original)',
      '   - Redondeo a 5g para mejor UX',
      '',
      '4. Comidas complementarias:',
      '   Si el escalado no alcanza 100% de macros objetivo,',
      '   se sugieren alimentos complementarios automáticamente'
    ];

    scalingLogic.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 5. VALIDACIONES Y TRIGGERS
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('5. VALIDACIONES Y LOGICA CONDICIONAL', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const validations = [
      'Validaciones de Onboarding:',
      '  - Email válido y único',
      '  - Edad: 15-100 años',
      '  - Peso: 30-300 kg',
      '  - Altura: 100-250 cm',
      '  - % Grasa corporal: 3-60% (opcional)',
      '',
      'Validaciones de Comidas:',
      '  - Nombre único por tipo de comida',
      '  - Al menos 1 ingrediente',
      '  - Macros coherentes (suma = calorías aproximadas)',
      '  - Ingredientes con cantidades > 0g',
      '',
      'Validaciones de Ingredientes:',
      '  - Nombre único',
      '  - Macros ≥ 0',
      '  - Calorías coherentes: 4×P + 4×C + 9×G ≈ kcal ±10%',
      '',
      'Lógica Condicional:',
      '  - Si usuario no completa onboarding → Redirigir a onboarding',
      '  - Si log ya existe para fecha → Sobrescribir con confirmación',
      '  - Si comida favorita → Priorizar en recomendaciones',
      '  - Si comida rechazada → No mostrar en selección',
      '  - Si es admin → Mostrar panel de administración',
      '',
      'Triggers Automáticos:',
      '  - Auto-save de logs cada 30 segundos',
      '  - Auto-cálculo de macros totales al cambiar comidas',
      '  - Auto-generación de ID único para nuevas entidades',
      '  - Auto-actualización de updated_at en cada cambio'
    ];

    validations.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 6. DISEÑO Y UI
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('6. DISEÑO Y UI', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const designInfo = [
      'Sistema de Colores:',
      '  - Principal: Verde esmeralda (#10b981, #059669, #047857)',
      '  - Secundario: Púrpura (#8b5cf6, #7c3aed, #6d28d9)',
      '  - Fondo: Gradientes suaves verde-amarillo',
      '  - Texto: Gris oscuro (#1f2937) sobre claro, blanco sobre oscuro',
      '',
      'Tipografía:',
      '  - Fuente principal: System UI / Sans-serif',
      '  - Tamaños: 10px-24px',
      '  - Peso: 400 (normal), 600 (semibold), 700 (bold)',
      '',
      'Componentes Clave:',
      '  - Cards con sombras suaves y bordes redondeados (rounded-2xl)',
      '  - Botones con estados hover/active y animaciones scale',
      '  - Modals con backdrop blur',
      '  - Tabs con indicador visual',
      '  - Progress bars animados',
      '  - Iconos de Lucide React',
      '',
      'Pantallas Principales:',
      '  1. Login/Signup - Diseño minimalista centrado',
      '  2. Onboarding - Wizard multi-paso (8 pasos)',
      '  3. Dashboard - Resumen diario con tarjetas de macros',
      '  4. Selección de Comidas - Grid responsive con filtros',
      '  5. Detalle de Comida - Vista expandida con ingredientes',
      '  6. Historial - Calendario con logs diarios',
      '  7. Perfil - Edición de datos y preferencias',
      '  8. Admin Panel - Gestión de comidas e ingredientes',
      '',
      'Responsividad:',
      '  - Mobile first (320px+)',
      '  - Tablet (768px+)',
      '  - Desktop (1024px+)',
      '  - Navegación adaptativa (tabs bottom en mobile, sidebar en desktop)'
    ];

    designInfo.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 7. ARQUITECTURA BACKEND
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('7. ARQUITECTURA BACKEND', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const backendInfo = [
      'Stack Tecnológico:',
      '  - Supabase (PostgreSQL + Auth + Edge Functions)',
      '  - Hono (Web Framework para Edge Functions)',
      '  - Row Level Security (RLS) habilitado',
      '',
      'Endpoints Principales:',
      '',
      'Authentication:',
      '  POST /auth/signup - Crear cuenta',
      '  POST /auth/signin - Iniciar sesión',
      '  GET /auth/session - Validar sesión',
      '  POST /auth/signout - Cerrar sesión',
      '',
      'User Management:',
      '  GET /user/:email - Obtener perfil',
      '  POST /user - Guardar/actualizar perfil',
      '',
      'Daily Logs:',
      '  GET /daily-logs/:email - Obtener todos los logs',
      '  POST /daily-logs - Guardar logs',
      '',
      'Saved Diets:',
      '  GET /saved-diets/:email - Obtener dietas guardadas',
      '  POST /saved-diets - Guardar dietas',
      '',
      'Global Data (Admin):',
      '  GET /global-meals - Obtener comidas globales',
      '  POST /global-meals - Actualizar comidas',
      '  GET /global-ingredients - Obtener ingredientes',
      '  POST /global-ingredients - Actualizar ingredientes',
      '',
      'Bug Reports:',
      '  GET /bug-reports - Obtener reportes',
      '  POST /bug-reports - Crear reporte',
      '',
      'Seguridad:',
      '  - Bearer token en header Authorization',
      '  - RLS policies: usuarios solo acceden a sus datos',
      '  - Service role key solo en backend',
      '  - Validación de email único en signup',
      '  - Hash de contraseñas por Supabase Auth',
      '',
      'Optimizaciones:',
      '  - Índices en campos de búsqueda frecuente',
      '  - JSONB para datos semi-estructurados',
      '  - Arrays para relaciones simples',
      '  - Triggers para auto-actualización de timestamps'
    ];

    backendInfo.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 8. ORDEN DE MIGRACIÓN
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('8. ORDEN RECOMENDADO DE MIGRACION', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const migrationOrder = [
      'Fase 1: Infraestructura (Día 1-2)',
      '  1. Crear proyecto en Lovable',
      '  2. Configurar Supabase (proyecto + credenciales)',
      '  3. Crear tablas con RLS policies',
      '  4. Configurar Edge Functions (Hono server)',
      '  5. Implementar endpoints de autenticación',
      '',
      'Fase 2: Sistema de Usuarios (Día 2-3)',
      '  6. Migrar pantallas de Login/Signup',
      '  7. Implementar Onboarding completo',
      '  8. Conectar endpoints GET/POST /user',
      '  9. Probar flujo completo de registro',
      '',
      'Fase 3: Base de Datos Global (Día 3-4)',
      '  10. Migrar base de comidas (base_meals)',
      '  11. Migrar base de ingredientes (base_ingredients)',
      '  12. Implementar endpoints de admin',
      '  13. Crear panel de administración',
      '  14. Importar datos iniciales (CSV)',
      '',
      'Fase 4: Funcionalidad Core (Día 4-6)',
      '  15. Implementar Dashboard',
      '  16. Migrar selección de comidas',
      '  17. Implementar sistema de escalado',
      '  18. Conectar daily_logs (GET/POST)',
      '  19. Probar auto-save',
      '',
      'Fase 5: Features Avanzados (Día 6-7)',
      '  20. Implementar dietas guardadas',
      '  21. Sistema de favoritos',
      '  22. Historial y calendario',
      '  23. Gráficas de progreso',
      '',
      'Fase 6: QA y Optimización (Día 7-8)',
      '  24. Testing exhaustivo de flujos',
      '  25. Optimización de rendimiento',
      '  26. Revisión de seguridad RLS',
      '  27. Testing en móvil',
      '',
      'Fase 7: Extras (Día 8-9)',
      '  28. Sistema de reportes de bugs',
      '  29. Exportación de datos',
      '  30. Documentación de usuario',
      '',
      'CRÍTICO: No continuar con siguiente fase sin completar pruebas'
    ];

    migrationOrder.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 9. CHECKLIST DE QA
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('9. CHECKLIST DE QA', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const qaChecklist = [
      '□ Autenticación',
      '  □ Registro con email duplicado falla correctamente',
      '  □ Login con credenciales incorrectas falla',
      '  □ Sesión persiste al recargar',
      '  □ Logout cierra sesión correctamente',
      '',
      '□ Onboarding',
      '  □ Validaciones de campos funcionan',
      '  □ Cálculo de macros es correcto',
      '  □ Datos se guardan en users table',
      '  □ Usuario puede editar perfil después',
      '',
      '□ Selección de Comidas',
      '  □ Filtros por tipo de comida funcionan',
      '  □ Búsqueda es precisa',
      '  □ Escalado de comidas es correcto',
      '  □ Macros totales se actualizan',
      '  □ Comidas complementarias se sugieren',
      '',
      '□ Persistencia de Datos',
      '  □ Daily logs se guardan correctamente',
      '  □ Logs persisten al recargar app',
      '  □ Logs se pueden editar',
      '  □ Historial muestra datos correctos',
      '',
      '□ Dietas Guardadas',
      '  □ Dieta se guarda con nombre único',
      '  □ Dieta se puede cargar',
      '  □ Dieta se puede eliminar',
      '  □ Dietas persisten entre sesiones',
      '',
      '□ Admin Panel',
      '  □ Solo usuarios admin pueden acceder',
      '  □ Comidas se pueden crear/editar/eliminar',
      '  □ Ingredientes se pueden crear/editar/eliminar',
      '  □ Cambios se reflejan en base de datos',
      '  □ Import CSV funciona correctamente',
      '',
      '□ Responsividad',
      '  □ Funciona en móvil (320px+)',
      '  □ Funciona en tablet (768px+)',
      '  □ Funciona en desktop (1024px+)',
      '  □ Touch events funcionan',
      '',
      '□ Seguridad',
      '  □ RLS policies bloquean acceso no autorizado',
      '  □ Usuarios solo ven sus propios datos',
      '  □ Service role key no expuesta en frontend',
      '  □ Tokens se renuevan correctamente',
      '',
      '□ Performance',
      '  □ Tiempo de carga < 3 segundos',
      '  □ Búsquedas son rápidas',
      '  □ Auto-save no bloquea UI',
      '  □ Sin memory leaks',
      '',
      '□ Edge Cases',
      '  □ Usuario sin comidas en historial',
      '  □ Comida sin ingredientes (no debería existir)',
      '  □ Macros objetivo = 0',
      '  □ Navegación con datos incompletos'
    ];

    qaChecklist.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // 10. DEPENDENCIAS Y CONSIDERACIONES
    doc.addPage();
    yPos = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('10. DEPENDENCIAS Y CONSIDERACIONES', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const dependencies = [
      'Librerías Requeridas:',
      '  - React 18.3.1',
      '  - @supabase/supabase-js ^2.89.0',
      '  - Hono (en Edge Functions)',
      '  - Lucide React (iconos)',
      '  - Tailwind CSS 4.x',
      '  - date-fns (manejo de fechas)',
      '  - jsPDF (exportación PDF)',
      '  - xlsx (importación CSV/Excel)',
      '',
      'Configuración de Supabase:',
      '  1. Crear proyecto en supabase.com',
      '  2. Copiar URL y anon key',
      '  3. Habilitar Email Auth',
      '  4. Configurar RLS en todas las tablas',
      '  5. Crear índices recomendados',
      '  6. Subir Edge Functions',
      '',
      'Variables de Entorno:',
      '  SUPABASE_URL=https://[project-id].supabase.co',
      '  SUPABASE_ANON_KEY=[anon-key]',
      '  SUPABASE_SERVICE_ROLE_KEY=[service-key] (solo backend)',
      '',
      'Consideraciones Críticas:',
      '  - NO exponer service role key en frontend',
      '  - Habilitar RLS antes de lanzar a producción',
      '  - Hacer backup de base de datos regularmente',
      '  - Monitorear uso de storage y funciones',
      '  - Implementar rate limiting en endpoints críticos',
      '  - Validar datos tanto en frontend como backend',
      '',
      'Testing:',
      '  - Usar datos de prueba durante desarrollo',
      '  - Probar en diferentes navegadores',
      '  - Probar con diferentes tamaños de pantalla',
      '  - Simular latencia de red',
      '  - Probar con datos extremos (muy alto/bajo)',
      '',
      'Deployment:',
      '  - Lovable maneja deployment automático',
      '  - Edge Functions se despliegan desde Supabase CLI',
      '  - Configurar dominios personalizados si necesario',
      '  - Habilitar HTTPS (automático en Lovable)',
      '',
      'Monitoreo Post-Migración:',
      '  - Verificar logs de Supabase Dashboard',
      '  - Monitorear errores en consola del navegador',
      '  - Revisar tiempos de respuesta de API',
      '  - Recolectar feedback de usuarios beta',
      '',
      'Migración de Datos Existentes:',
      '  - Si hay usuarios en Figma Make, exportar datos',
      '  - Transformar formato camelCase a snake_case',
      '  - Importar a Supabase vía CSV o script',
      '  - Validar integridad de datos migrados',
      '  - Notificar a usuarios sobre la migración'
    ];

    dependencies.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // Pie de página
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINAL', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summary = [
      'Este documento contiene toda la información técnica necesaria para migrar',
      'Fuelier de Figma Make a Lovable con Supabase como backend.',
      '',
      'Puntos clave:',
      '  ✓ 6 tablas principales en PostgreSQL',
      '  ✓ Sistema de autenticación completo con Supabase Auth',
      '  ✓ RLS policies para seguridad',
      '  ✓ Algoritmo de cálculo de macros implementado',
      '  ✓ Sistema de escalado 100% funcional',
      '  ✓ Panel de administración completo',
      '  ✓ Historial de 1 año sin límites',
      '',
      'Tiempo estimado de migración: 8-9 días',
      '',
      'Contacto para soporte técnico:',
      '  - Revisar documentación de Supabase: supabase.com/docs',
      '  - Revisar documentación de Lovable: lovable.dev/docs',
      '  - Consultar código fuente en Figma Make',
      '',
      'Fecha de generación: ' + new Date().toLocaleDateString('es-ES'),
      '',
      '¡Éxito con la migración!',
      '',
      '---',
      'Generado automáticamente por Fuelier Admin Panel'
    ];

    summary.forEach(line => {
      checkNewPage();
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // Guardar PDF
    doc.save('Fuelier_Documentacion_Tecnica_Migracion.pdf');
  };

  const sections = [
    {
      id: 'resumen',
      title: '1. Resumen del Proyecto',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold text-emerald-900 mb-2">Fuelier - App de Gestión Personal de Dieta y Macros</h3>
            <p className="text-sm text-emerald-800">
              Sistema adaptativo basado en fisiología real que aprende del usuario automáticamente, 
              observando patrones naturales y adaptándose según feedback fisiológico real.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Principales Flujos de Usuario:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Registro y Onboarding completo con datos antropométricos</li>
              <li>Configuración de objetivos y preferencias alimenticias</li>
              <li>Selección de comidas diarias adaptadas a macros objetivo</li>
              <li>Registro de peso y tracking de progreso</li>
              <li>Guardado de dietas favoritas</li>
              <li>Historial completo de hasta 1 año</li>
              <li>Panel de administración para gestionar base de datos global</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'estructura',
      title: '2. Estructura de Datos',
      icon: Database,
      content: (
        <div className="space-y-4">
          <h4 className="font-semibold">Tablas de Supabase:</h4>
          
          {[
            {
              name: 'users',
              desc: 'Perfil completo del usuario',
              fields: ['id (UUID)', 'email', 'name, sex, age', 'weight, height, body_fat_percentage', 'training_frequency, lifestyle_activity', 'goal, meals_per_day', 'target_calories, target_protein, target_carbs, target_fat', 'preferences (JSONB)', 'favorite_meal_ids (ARRAY)']
            },
            {
              name: 'daily_logs',
              desc: 'Registro diario de comidas',
              fields: ['id (UUID)', 'user_id (FK)', 'log_date', 'breakfast, lunch, snack, dinner (JSONB)', 'weight', 'notes']
            },
            {
              name: 'saved_diets',
              desc: 'Dietas guardadas',
              fields: ['id', 'user_id (FK)', 'name, description', 'breakfast, lunch, snack, dinner (JSONB)', 'total_calories, total_protein, total_carbs, total_fat']
            },
            {
              name: 'base_meals',
              desc: 'Base de datos global de comidas',
              fields: ['id', 'name', 'meal_types (ARRAY)', 'calories, protein, carbs, fat', 'ingredients (ARRAY)', 'ingredient_references (JSONB)']
            },
            {
              name: 'base_ingredients',
              desc: 'Base de datos global de ingredientes',
              fields: ['id', 'name', 'calories, protein, carbs, fat', 'category']
            },
            {
              name: 'bug_reports',
              desc: 'Sistema de reportes',
              fields: ['id', 'user_id (FK)', 'title, description', 'category, priority, status']
            }
          ].map(table => (
            <div key={table.name} className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-semibold text-purple-600">{table.name}</h5>
              <p className="text-xs text-gray-600 mb-2">{table.desc}</p>
              <ul className="text-xs space-y-0.5">
                {table.fields.map((field, idx) => (
                  <li key={idx} className="text-gray-700">• {field}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'logica',
      title: '3. Lógica de la App',
      icon: Code,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Algoritmo de Cálculo de Macros:</h4>
            <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-2">
              <p><strong>1. TMB (Mifflin-St Jeor):</strong></p>
              <p className="text-xs ml-4">Hombre: 10×peso + 6.25×altura - 5×edad + 5</p>
              <p className="text-xs ml-4">Mujer: 10×peso + 6.25×altura - 5×edad - 161</p>
              
              <p><strong>2. TDEE:</strong> TMB × Factor de Actividad</p>
              
              <p><strong>3. Ajuste por objetivo:</strong></p>
              <p className="text-xs ml-4">Pérdida rápida: TDEE - 750 kcal</p>
              <p className="text-xs ml-4">Mantenimiento: TDEE</p>
              <p className="text-xs ml-4">Ganancia rápida: TDEE + 500 kcal</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Sistema de Escalado de Comidas:</h4>
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <p>✅ Todas las comidas son 100% escalables a nivel de macros</p>
              <p className="text-xs mt-2">Factor de escalado = Macros objetivo / Macros base</p>
              <p className="text-xs">Rango permitido: 50% - 200%</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Validaciones Principales:</h4>
            <ul className="text-sm space-y-1">
              <li>• Edad: 15-100 años</li>
              <li>• Peso: 30-300 kg</li>
              <li>• Altura: 100-250 cm</li>
              <li>• Email único en registro</li>
              <li>• Al menos 1 ingrediente por comida</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'diseno',
      title: '4. Diseño / UI',
      icon: Layout,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Sistema de Colores:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500 text-white p-2 rounded text-xs">Principal: Esmeralda</div>
              <div className="bg-purple-500 text-white p-2 rounded text-xs">Secundario: Púrpura</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Pantallas Principales:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Login/Signup - Diseño centrado</li>
              <li>Onboarding - Wizard de 8 pasos</li>
              <li>Dashboard - Resumen diario con macros</li>
              <li>Selección de Comidas - Grid con filtros</li>
              <li>Historial - Calendario de logs</li>
              <li>Perfil - Edición de datos</li>
              <li>Admin Panel - Gestión global</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Componentes Clave:</h4>
            <ul className="text-sm space-y-1">
              <li>• Cards con sombras suaves (rounded-2xl)</li>
              <li>• Botones con animaciones scale</li>
              <li>• Modals con backdrop blur</li>
              <li>• Tabs con indicador visual</li>
              <li>• Progress bars animados</li>
              <li>• Iconos de Lucide React</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Responsividad:</h4>
            <p className="text-sm">Mobile first (320px+) → Tablet (768px+) → Desktop (1024px+)</p>
          </div>
        </div>
      )
    },
    {
      id: 'migracion',
      title: '5. Orden de Migración',
      icon: GitBranch,
      content: (
        <div className="space-y-3">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <p className="text-sm font-semibold text-yellow-800">⚠️ Tiempo estimado: 8-9 días</p>
          </div>

          {[
            { fase: 'Fase 1: Infraestructura (Día 1-2)', items: ['Crear proyecto en Lovable', 'Configurar Supabase', 'Crear tablas con RLS', 'Edge Functions (Hono)'] },
            { fase: 'Fase 2: Usuarios (Día 2-3)', items: ['Login/Signup', 'Onboarding', 'Endpoints /user'] },
            { fase: 'Fase 3: Base Global (Día 3-4)', items: ['Migrar comidas', 'Migrar ingredientes', 'Admin Panel'] },
            { fase: 'Fase 4: Core (Día 4-6)', items: ['Dashboard', 'Selección de comidas', 'Sistema de escalado', 'Daily logs'] },
            { fase: 'Fase 5: Avanzado (Día 6-7)', items: ['Dietas guardadas', 'Favoritos', 'Historial', 'Gráficas'] },
            { fase: 'Fase 6: QA (Día 7-8)', items: ['Testing exhaustivo', 'Optimización', 'Seguridad RLS'] }
          ].map((fase, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-semibold text-purple-600 mb-1">{fase.fase}</h5>
              <ul className="text-xs space-y-0.5">
                {fase.items.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'qa',
      title: '6. Checklist de QA',
      icon: CheckSquare,
      content: (
        <div className="space-y-3">
          {[
            { category: 'Autenticación', items: ['Email duplicado falla', 'Login incorrecto falla', 'Sesión persiste', 'Logout funciona'] },
            { category: 'Onboarding', items: ['Validaciones funcionan', 'Cálculo de macros correcto', 'Datos se guardan', 'Puede editar después'] },
            { category: 'Selección de Comidas', items: ['Filtros funcionan', 'Búsqueda precisa', 'Escalado correcto', 'Macros se actualizan'] },
            { category: 'Persistencia', items: ['Logs se guardan', 'Persisten al recargar', 'Se pueden editar', 'Historial correcto'] },
            { category: 'Admin Panel', items: ['Solo admin accede', 'CRUD de comidas', 'CRUD de ingredientes', 'Import CSV funciona'] },
            { category: 'Seguridad', items: ['RLS bloquea acceso', 'Usuarios ven solo sus datos', 'Service key no expuesta'] },
            { category: 'Responsividad', items: ['Móvil (320px+)', 'Tablet (768px+)', 'Desktop (1024px+)'] }
          ].map((cat, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-semibold text-emerald-600 mb-1">{cat.category}</h5>
              <ul className="text-xs space-y-0.5">
                {cat.items.map((item, i) => (
                  <li key={i}>□ {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'dependencias',
      title: '7. Dependencias y Consideraciones',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Librerías Requeridas:</h4>
            <ul className="text-xs space-y-1">
              <li>• React 18.3.1</li>
              <li>• @supabase/supabase-js ^2.89.0</li>
              <li>• Hono (Edge Functions)</li>
              <li>• Lucide React (iconos)</li>
              <li>• Tailwind CSS 4.x</li>
              <li>• date-fns, jsPDF, xlsx</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Variables de Entorno:</h4>
            <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono">
              <p>SUPABASE_URL=https://[project].supabase.co</p>
              <p>SUPABASE_ANON_KEY=[key]</p>
              <p>SUPABASE_SERVICE_ROLE_KEY=[key]</p>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-3">
            <h4 className="font-semibold text-red-800 mb-1">⚠️ CRÍTICO:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• NO exponer service role key en frontend</li>
              <li>• Habilitar RLS antes de producción</li>
              <li>• Validar datos en frontend Y backend</li>
              <li>• Hacer backups regularmente</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all active:scale-95"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Documentación Técnica</h1>
              <p className="text-purple-100 text-sm">Guía completa de migración a Lovable</p>
            </div>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all active:scale-95 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          {sections.map(section => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="flex-1 text-left font-semibold text-gray-900">{section.title}</h3>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white text-center">
          <p className="font-semibold mb-2">📄 Documento completo generado automáticamente</p>
          <p className="text-sm text-emerald-100">
            Haz clic en "Descargar PDF" para obtener la versión completa con todos los detalles técnicos
          </p>
        </div>
      </div>
    </div>
  );
}
