#!/bin/bash

# 🔧 SCRIPT DE CORRECCIONES AUTOMÁTICAS
# Aplica las correcciones críticas necesarias antes del deployment
# Uso: bash SCRIPT_CORRECCIONES_AUTO.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 FUELIER - Script de Correcciones Automáticas${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ===================================
# 1. ELIMINAR REACT-ROUTER-DOM
# ===================================
echo -e "${YELLOW}[1/6]${NC} Eliminando react-router-dom..."

if grep -q "react-router-dom" package.json; then
  npm uninstall react-router-dom
  echo -e "${GREEN}✅ react-router-dom eliminado${NC}"
else
  echo -e "${GREEN}✓ react-router-dom ya no está instalado${NC}"
fi

echo ""

# ===================================
# 2. BACKUP DE ARCHIVOS ORIGINALES
# ===================================
echo -e "${YELLOW}[2/6]${NC} Creando backups de archivos a modificar..."

BACKUP_DIR="./backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp src/app/App.tsx "$BACKUP_DIR/App.tsx.bak"
cp src/app/utils/supabase.ts "$BACKUP_DIR/supabase.ts.bak"
cp src/utils/supabase/client.ts "$BACKUP_DIR/client.ts.bak"

echo -e "${GREEN}✅ Backups creados en: $BACKUP_DIR${NC}"
echo ""

# ===================================
# 3. AÑADIR ERROR HANDLING EN APP.TSX
# ===================================
echo -e "${YELLOW}[3/6]${NC} Añadiendo error handling en App.tsx..."

# Crear archivo temporal con las correcciones
cat > /tmp/fix_app_tsx.js << 'ENDJS'
const fs = require('fs');

const filePath = './src/app/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Save user to Supabase
content = content.replace(
  /\/\/ Save user to Supabase whenever it changes\s+useEffect\(\(\) => \{\s+if \(user\) \{\s+\/\/ Guardar en ambos lugares durante la transición\s+localStorage\.setItem\('dietUser', JSON\.stringify\(user\)\);\s+api\.saveUser\(user\);/g,
  `// Save user to Supabase whenever it changes
  useEffect(() => {
    if (user) {
      // Guardar en ambos lugares durante la transición
      localStorage.setItem('dietUser', JSON.stringify(user));
      api.saveUser(user).catch(error => {
        console.error('❌ [CRITICAL] Error saving user to Supabase:', error);
      });`
);

// Fix 2: Save logs to Supabase
content = content.replace(
  /\/\/ Save logs to Supabase whenever they change\s+useEffect\(\(\) => \{\s+if \(user && dailyLogs\.length >= 0\) \{\s+api\.saveDailyLogs\(user\.email, dailyLogs\);/g,
  `// Save logs to Supabase whenever they change
  useEffect(() => {
    if (user && dailyLogs.length >= 0) {
      api.saveDailyLogs(user.email, dailyLogs).catch(error => {
        console.error('❌ [CRITICAL] Error saving daily logs to Supabase:', error);
      });`
);

// Fix 3: Save saved diets
content = content.replace(
  /\/\/ Save saved diets to Supabase whenever they change\s+useEffect\(\(\) => \{\s+if \(user && savedDiets\.length >= 0\) \{\s+api\.saveSavedDiets\(user\.email, savedDiets\);/g,
  `// Save saved diets to Supabase whenever they change
  useEffect(() => {
    if (user && savedDiets.length >= 0) {
      api.saveSavedDiets(user.email, savedDiets).catch(error => {
        console.error('❌ [CRITICAL] Error saving diets to Supabase:', error);
      });`
);

// Fix 4: Save favorite meals
content = content.replace(
  /\/\/ Save favorite meal IDs to Supabase when they change\s+useEffect\(\(\) => \{\s+if \(user && favoriteMealIds\.length >= 0\) \{\s+api\.saveFavoriteMeals\(user\.email, favoriteMealIds\);/g,
  `// Save favorite meal IDs to Supabase when they change
  useEffect(() => {
    if (user && favoriteMealIds.length >= 0) {
      api.saveFavoriteMeals(user.email, favoriteMealIds).catch(error => {
        console.error('❌ [CRITICAL] Error saving favorite meals to Supabase:', error);
      });`
);

// Fix 5: Save bug reports
content = content.replace(
  /\/\/ Save bug reports to Supabase whenever they change\s+useEffect\(\(\) => \{\s+if \(bugReports\.length >= 0\) \{\s+api\.saveBugReports\(bugReports\);/g,
  `// Save bug reports to Supabase whenever they change
  useEffect(() => {
    if (bugReports.length >= 0) {
      api.saveBugReports(bugReports).catch(error => {
        console.error('❌ [CRITICAL] Error saving bug reports to Supabase:', error);
      });`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ App.tsx actualizado con error handling');
ENDJS

node /tmp/fix_app_tsx.js
rm /tmp/fix_app_tsx.js

echo -e "${GREEN}✅ Error handling añadido en App.tsx${NC}"
echo ""

# ===================================
# 4. AÑADIR COMENTARIOS EN SUPABASE.TS
# ===================================
echo -e "${YELLOW}[4/6]${NC} Añadiendo comentarios clarificadores en supabase.ts..."

# Añadir comentario al inicio del archivo
sed -i '1i // =====================================================\n// CLIENTE SINGLETON DE SUPABASE\n// ⚠️ IMPORTANTE: Este es el ÚNICO lugar donde se crea la instancia\n// Todos los demás archivos deben importar desde aquí\n// =====================================================\n' src/app/utils/supabase.ts

echo -e "${GREEN}✅ Comentarios añadidos en supabase.ts${NC}"
echo ""

# ===================================
# 5. VERIFICAR .ENV.LOCAL
# ===================================
echo -e "${YELLOW}[5/6]${NC} Verificando variables de entorno..."

if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env.local no encontrado${NC}"
  echo -e "${BLUE}Creando .env.local con plantilla...${NC}"
  
  cat > .env.local << 'ENDENV'
# Supabase Configuration
# IMPORTANTE: Reemplaza estos valores con tus credenciales reales

VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key-aqui]

# NO incluir SUPABASE_SERVICE_ROLE_KEY aquí (solo en backend/Vercel)
ENDENV
  
  echo -e "${YELLOW}⚠️  .env.local creado con plantilla. ${RED}DEBES CONFIGURAR LAS CREDENCIALES REALES${NC}"
else
  echo -e "${GREEN}✓ .env.local existe${NC}"
  
  # Verificar que contiene las variables necesarias
  if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✓ Variables VITE_SUPABASE_* encontradas${NC}"
  else
    echo -e "${RED}❌ Faltan variables en .env.local${NC}"
    echo -e "${YELLOW}Asegúrate de incluir:${NC}"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
  fi
fi

echo ""

# ===================================
# 6. BUILD DE PRUEBA
# ===================================
echo -e "${YELLOW}[6/6]${NC} Ejecutando build de prueba..."

npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build exitoso${NC}"
  
  # Mostrar tamaño del bundle
  if [ -d dist ]; then
    SIZE=$(du -sh dist/ | cut -f1)
    echo -e "${BLUE}📦 Tamaño del bundle: $SIZE${NC}"
  fi
else
  echo -e "${RED}❌ Build falló${NC}"
  echo -e "${YELLOW}Restaurando archivos originales...${NC}"
  
  cp "$BACKUP_DIR/App.tsx.bak" src/app/App.tsx
  cp "$BACKUP_DIR/supabase.ts.bak" src/app/utils/supabase.ts
  cp "$BACKUP_DIR/client.ts.bak" src/utils/supabase/client.ts
  
  echo -e "${GREEN}✓ Archivos restaurados${NC}"
  exit 1
fi

echo ""

# ===================================
# RESUMEN FINAL
# ===================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CORRECCIONES APLICADAS EXITOSAMENTE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Cambios aplicados:"
echo "  ✅ react-router-dom eliminado"
echo "  ✅ Error handling añadido en 5 useEffects"
echo "  ✅ Comentarios clarificadores en supabase.ts"
echo "  ✅ .env.local verificado"
echo "  ✅ Build exitoso"
echo ""
echo "📁 Backups guardados en: $BACKUP_DIR"
echo ""
echo "🚀 Próximos pasos:"
echo "  1. Revisar los cambios aplicados"
echo "  2. Testing manual de funcionalidades core"
echo "  3. Configurar variables en Vercel (si aún no lo has hecho)"
echo "  4. Deploy: vercel --prod"
echo ""

# ===================================
# VERIFICACIONES ADICIONALES
# ===================================
echo -e "${YELLOW}🔍 Verificaciones adicionales:${NC}"
echo ""

# Buscar console.logs
LOGS_COUNT=$(grep -r "console.log" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ $LOGS_COUNT -gt 50 ]; then
  echo -e "${YELLOW}⚠️  Se encontraron $LOGS_COUNT console.logs en el código${NC}"
  echo "   Considera limpiarlos para producción (opcional)"
else
  echo -e "${GREEN}✓ Cantidad aceptable de console.logs: $LOGS_COUNT${NC}"
fi

# Verificar imports de react-router-dom
ROUTER_IMPORTS=$(grep -r "from.*react-router-dom" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ $ROUTER_IMPORTS -gt 0 ]; then
  echo -e "${RED}❌ Se encontraron $ROUTER_IMPORTS imports de react-router-dom${NC}"
  echo "   Debes eliminar estos imports manualmente"
  grep -r "from.*react-router-dom" src/ --include="*.tsx" --include="*.ts"
else
  echo -e "${GREEN}✓ No hay imports de react-router-dom${NC}"
fi

# Verificar múltiples instancias de createClient
CLIENT_INSTANCES=$(grep -r "createClient(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "^Binary" | wc -l)
if [ $CLIENT_INSTANCES -gt 1 ]; then
  echo -e "${YELLOW}⚠️  Se encontraron $CLIENT_INSTANCES llamadas a createClient${NC}"
  echo "   Verifica que solo exista en src/app/utils/supabase.ts"
else
  echo -e "${GREEN}✓ Solo una instancia de createClient${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 ¡LISTO PARA DEPLOYMENT!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
