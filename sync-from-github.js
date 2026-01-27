/**
 * Script de sincronización completa desde GitHub
 * Descarga todos los archivos críticos desde el commit más reciente
 */

const REPO = 'noxmotorscarsinfo-prog/fuelier-app';
const COMMIT = '21aee42332e269a75b8fdfe9feb282f2a2e6d248';
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${COMMIT}`;

// Archivos críticos a sincronizar
const FILES_TO_SYNC = [
  'supabase/functions/make-server-b0e879f0/index.ts',
  'src/app/utils/api.ts',
  'src/app/App.tsx',
  'src/app/components/TrainingDashboardNew.tsx',
  'src/app/components/Dashboard.tsx',
];

async function downloadFile(filePath) {
  console.log(`📥 Descargando: ${filePath}`);
  const url = `${BASE_URL}/${filePath}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    console.log(`✅ Descargado: ${filePath} (${content.length} caracteres)`);
    return { path: filePath, content, success: true };
  } catch (error) {
    console.error(`❌ Error descargando ${filePath}:`, error.message);
    return { path: filePath, content: null, success: false, error: error.message };
  }
}

async function syncAll() {
  console.log('🚀 Iniciando sincronización completa desde GitHub...\n');
  console.log(`📦 Repositorio: ${REPO}`);
  console.log(`🔖 Commit: ${COMMIT}\n`);
  
  const results = [];
  
  for (const file of FILES_TO_SYNC) {
    const result = await downloadFile(file);
    results.push(result);
    console.log(''); // Línea en blanco entre archivos
  }
  
  // Resumen
  console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log(`❌ Fallidos: ${failed.length}`);
    failed.forEach(f => console.log(`   - ${f.path}: ${f.error}`));
  }
  
  // Guardar resultados para procesamiento posterior
  return results;
}

// Ejecutar
syncAll().then(results => {
  console.log('\n✨ Sincronización completada');
  console.log('Los archivos están listos para ser actualizados en Figma Make');
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
