/**
 * Generador de Documentación Técnica del Sistema - VERSIÓN ACTUALIZADA 2026
 * 
 * Este módulo genera un documento HTML completo documentando la arquitectura completa,
 * lógica y funcionamiento del sistema de gestión de dietas y macros adaptativo.
 * El usuario puede imprimirlo como PDF desde el navegador (Ctrl+P → Guardar como PDF)
 */

export function generateSystemDocumentationPDF() {
  console.log('📄 Generando documentación completa...');
  
  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fuelier - Documentación Técnica Completa v2.0</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
        size: A4;
      }
      .page-break {
        page-break-after: always;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    
    .portada {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
    }
    
    .portada h1 {
      font-size: 48px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 20px;
      letter-spacing: 2px;
    }
    
    .portada .subtitle {
      font-size: 20px;
      color: #6b7280;
      font-style: italic;
      margin-bottom: 60px;
    }
    
    .portada .title-section {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 30px;
    }
    
    .portada .metadata {
      font-size: 14px;
      line-height: 2;
      margin-bottom: 40px;
    }
    
    .portada .metadata strong {
      color: #1f2937;
    }
    
    .portada .description {
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
      max-width: 600px;
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
    }
    
    h1 {
      font-size: 28px;
      color: #10b981;
      margin: 40px 0 20px 0;
      font-weight: bold;
      border-bottom: 3px solid #10b981;
      padding-bottom: 10px;
    }
    
    h2 {
      font-size: 22px;
      color: #10b981;
      margin: 30px 0 15px 0;
      font-weight: bold;
    }
    
    h3 {
      font-size: 18px;
      color: #059669;
      margin: 20px 0 10px 0;
      font-weight: bold;
    }
    
    p {
      margin: 10px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin: 8px 0;
    }
    
    .highlight {
      background: #dcfce7;
      padding: 15px;
      border-left: 4px solid #10b981;
      margin: 15px 0;
      font-weight: bold;
    }
    
    .warning {
      background: #fee2e2;
      padding: 15px;
      border-left: 4px solid #dc2626;
      margin: 15px 0;
      font-weight: bold;
    }
    
    .key-point {
      color: #10b981;
      font-weight: bold;
    }
    
    .critical {
      color: #dc2626;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    
    .toc {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .toc ol {
      margin-left: 20px;
    }
    
    .toc li {
      margin: 10px 0;
      font-weight: 500;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    
    .print-button:hover {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0,0,0,0.15);
    }
    
    @media print {
      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

  <!-- PORTADA -->
  <div class="portada page-break">
    <h1>FUELIER</h1>
    <div class="subtitle">Sistema Inteligente de Gestión Nutricional Adaptativo</div>
    <div class="title-section">DOCUMENTACIÓN TÉCNICA COMPLETA</div>
    <div class="metadata">
      <strong>Versión:</strong> 2.0.0 - Sistema Completo<br>
      <strong>Fecha:</strong> ${fechaActual}<br>
      <strong>Estado:</strong> Producción - Todas las funcionalidades implementadas
    </div>
    <div class="description">
      Este documento describe la arquitectura completa, lógica y funcionamiento del sistema de gestión de dietas adaptativo de Fuelier, 
      incluyendo todas las funcionalidades implementadas: escalado inteligente de platos, sistema de ingredientes personalizados, 
      platos globales administrados, distribución personalizada de comidas, sistema adaptativo con análisis metabólico, y backend con Supabase.
    </div>
  </div>

  <!-- ÍNDICE -->
  <div class="page-break">
    <h1>ÍNDICE DE CONTENIDOS</h1>
    <div class="toc">
      <ol>
        <li>Introducción General y Problema Fundamental</li>
        <li>Concepto Central: Recetas Escalables</li>
        <li>Objetivos y Reparto de Macros</li>
        <li>Sistema de Escalado Inteligente (100% en Última Comida)</li>
        <li>Base de Datos de Ingredientes y Platos</li>
        <li>Platos Globales Administrados</li>
        <li>Distribución Personalizada de Comidas</li>
        <li>Sistema Adaptativo y Análisis Metabólico</li>
        <li>Backend con Supabase</li>
        <li>Tracking de Peso y Progreso</li>
        <li>Sistema de Favoritos y Recomendaciones</li>
        <li>Historial Completo de 1 Año</li>
        <li>Panel de Administración</li>
        <li>Arquitectura Frontend-Backend</li>
        <li>Conclusiones y Ventajas Competitivas</li>
      </ol>
    </div>
  </div>

  <!-- SECCIÓN 1 -->
  <div class="page-break">
    <h1>1. INTRODUCCIÓN GENERAL</h1>
    
    <h3>El Problema Fundamental de las Apps de Nutrición</h3>
    <p>
      Las aplicaciones de nutrición tradicionales sufren de un problema estructural crítico: 
      <strong>tratan las comidas como unidades fijas e inmutables</strong>. Este enfoque presenta múltiples limitaciones:
    </p>
    <ul>
      <li>Los usuarios deben consumir exactamente las cantidades predefinidas</li>
      <li>No existe flexibilidad para adaptar las recetas a diferentes objetivos calóricos</li>
      <li>Los menús semanales son rígidos y obligan a seguir un plan cerrado</li>
      <li>Cambiar una comida rompe el balance nutricional del día</li>
      <li>No hay mecanismo para compensar automáticamente excesos o déficits</li>
      <li>Requieren duplicar recetas para diferentes niveles calóricos (combinatoria explosiva)</li>
    </ul>

    <h3>La Solución de Fuelier</h3>
    <p>
      Fuelier resuelve estos problemas mediante <strong>recetas escalables dinámicamente</strong> que se adaptan en tiempo real 
      a los objetivos nutricionales específicos del usuario, garantizando <strong>cierre perfecto al 100% en la última comida del día</strong>.
    </p>

    <div class="highlight">
      <span class="key-point">⭐ INNOVACIÓN CLAVE:</span> El sistema <strong>calcula automáticamente las cantidades exactas</strong> 
      de cada ingrediente para cada usuario, ajustando en tiempo real según el contexto del día.
    </div>
  </div>

  <!-- SECCIÓN 2 -->
  <div class="page-break">
    <h1>2. CONCEPTO CENTRAL: RECETAS ESCALABLES</h1>
    
    <h3>Definición y Funcionamiento</h3>
    <p>Una receta escalable contiene:</p>
    <ol>
      <li>Referencias a ingredientes de la base de datos (ID único, macros por 100g)</li>
      <li>Cantidades base en gramos (ejemplo: 150g pollo, 200g arroz)</li>
      <li>Macronutrientes calculados automáticamente</li>
      <li>Pasos de preparación opcionales</li>
      <li>Tips nutricionales</li>
    </ol>

    <div class="warning">
      <span class="critical">🔑 CRÍTICO:</span> El usuario <strong>NUNCA ve multiplicadores ni porciones</strong>. 
      Solo ve las cantidades exactas en gramos/ml que debe consumir.
    </div>
  </div>

  <!-- SECCIÓN 3 -->
  <div class="page-break">
    <h1>3. CÁLCULO CIENTÍFICO DE OBJETIVOS</h1>
    
    <h3>Proceso en 5 Pasos</h3>
    <ol>
      <li><strong>BMR (Basal Metabolic Rate):</strong> Fórmula Mifflin-St Jeor</li>
      <li><strong>TDEE (Total Daily Energy Expenditure):</strong> BMR × Factor de Actividad</li>
      <li><strong>Ajuste por Objetivo:</strong> Pérdida: -15 a -20%, Ganancia: +10 a +15%</li>
      <li><strong>Distribución de Macros:</strong> Proteína: 2.0-2.2g/kg, Grasa: 25-30%, Carbos: resto</li>
      <li><strong>Validación:</strong> Mínimo 1200 kcal, proteína 1.6g/kg, grasa 20%</li>
    </ol>

    <div class="highlight">
      ✅ Resultado: Objetivos diarios precisos y científicamente validados
    </div>
  </div>

  <!-- SECCIÓN 4 -->
  <div class="page-break">
    <h1>4. SISTEMA DE ESCALADO INTELIGENTE</h1>
    
    <h3>Innovación Principal: Cierre Perfecto al 100%</h3>
    <p>
      El sistema garantiza que <strong>la última comida del día cierre EXACTAMENTE al 100%</strong> de los objetivos diarios. 
      Las comidas anteriores se ajustan al presupuesto configurado, pero la última <strong>compensa cualquier diferencia</strong> 
      para llegar al objetivo exacto.
    </p>

    <h3>Algoritmo de Escalado</h3>
    <ol>
      <li>Calcular macros consumidos (excluyendo comida actual)</li>
      <li>Calcular macros restantes (objetivos - consumidos)</li>
      <li>Determinar si es última comida del día</li>
      <li>Si es última: ajuste perfecto al 100%</li>
      <li>Si NO: multiplicador ponderado (prioridad calorías + proteína)</li>
      <li>Escalar ingredientes proporcionalmente</li>
      <li>Recalcular macros finales</li>
      <li>Mostrar cantidades exactas al usuario</li>
    </ol>
  </div>

  <!-- SECCIÓN 5 -->
  <div class="page-break">
    <h1>5. BASE DE DATOS DE INGREDIENTES</h1>
    
    <h3>Arquitectura de Ingredientes</h3>
    <ul>
      <li>200+ ingredientes base categorizados</li>
      <li>Macros nutricionales precisos por 100g</li>
      <li>Categorías: proteína, carbohidrato, grasa, vegetal, fruta, lácteo, cereal, legumbre</li>
      <li>Ingredientes personalizados por usuarios</li>
      <li>Ingredientes globales por administradores</li>
    </ul>

    <h3>Platos Personalizados</h3>
    <p>
      Los usuarios pueden crear platos ilimitados con búsqueda inteligente de ingredientes, 
      cálculo automático de macros, y sincronización con Supabase.
    </p>
  </div>

  <!-- SECCIONES 6-14 (RESUMEN) -->
  <div class="page-break">
    <h1>6-14. FUNCIONALIDADES ADICIONALES</h1>
    
    <h3>Platos Globales Administrados</h3>
    <p>Sistema centralizado de platos compartidos con migración automática de legacy.</p>

    <h3>Distribución Personalizada</h3>
    <p>Configuración flexible de 2-5 comidas/día con porcentajes personalizados.</p>

    <h3>Sistema Adaptativo</h3>
    <p>Detección de metabolismo adaptado y recomendaciones automáticas.</p>

    <h3>Backend Supabase</h3>
    <p>Arquitectura three-tier con KV Store, auto-save y sincronización.</p>

    <h3>Tracking de Peso</h3>
    <p>Análisis de tendencias, promedios semanales y proyecciones.</p>

    <h3>Favoritos y Recomendaciones</h3>
    <p>Score de compatibilidad 0-100 con ranking inteligente.</p>

    <h3>Historial de 1 Año</h3>
    <p>365 días completos con copiar día y exportación PDF.</p>

    <h3>Panel de Administración</h3>
    <p>Gestión completa de platos, ingredientes y bug reports.</p>

    <h3>Arquitectura Técnica</h3>
    <p>React + TypeScript + Tailwind v4 + Supabase Edge Functions.</p>
  </div>

  <!-- SECCIÓN 15: CONCLUSIONES -->
  <div class="page-break">
    <h1>15. CONCLUSIONES Y VENTAJAS COMPETITIVAS</h1>
    
    <h3>Ventajas Técnicas Únicas</h3>
    <ol>
      <li><strong>Escalado Inteligente 100%:</strong> Cierre exacto garantizado en última comida</li>
      <li><strong>Base de Datos Estructurada:</strong> 200+ ingredientes con precisión nutricional</li>
      <li><strong>Platos Personalizados Ilimitados:</strong> Creación libre sin menú cerrado</li>
      <li><strong>Distribución Personalizable:</strong> Configuración granular de % por comida</li>
      <li><strong>Sistema Adaptativo:</strong> Detección automática de metabolismo adaptado</li>
      <li><strong>Historial 1 Año:</strong> Almacenamiento completo con sincronización cloud</li>
      <li><strong>Arquitectura Serverless:</strong> Escalable sin servidor dedicado</li>
    </ol>

    <h2>RESUMEN EJECUTIVO</h2>
    <div class="highlight">
      <p>
        Fuelier es un sistema de gestión nutricional <strong>técnicamente superior</strong> gracias a su arquitectura de 
        <strong>recetas escalables dinámicamente</strong>, <strong>sistema adaptativo con detección metabólica</strong>, 
        y <strong>precisión del 100% en última comida</strong>.
      </p>
      <p style="margin-top: 15px;">
        La combinación de <strong>base de datos estructurada</strong>, <strong>platos personalizados ilimitados</strong>, 
        <strong>backend serverless</strong>, y <strong>algoritmos de escalado inteligente</strong> resuelve los problemas 
        fundamentales de rigidez de las apps tradicionales.
      </p>
    </div>
  </div>

  <!-- PIE DE PÁGINA -->
  <div class="footer">
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br>
    DOCUMENTO CONFIDENCIAL Y PROPIEDAD DE FUELIER<br>
    Generado el ${fechaActual}<br>
    Versión 2.0 - Sistema Completo en Producción<br>
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  </div>
</body>
</html>
  `;

  // Abrir en nueva ventana
  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(htmlContent);
    ventana.document.close();
    console.log('✅ Documentación generada exitosamente');
    console.log('💡 Usa Ctrl+P (o Cmd+P en Mac) para imprimir o guardar como PDF');
  } else {
    alert('Por favor, permite ventanas emergentes para ver la documentación.');
  }
}
