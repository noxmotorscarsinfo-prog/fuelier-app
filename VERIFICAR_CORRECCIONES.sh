#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN POST-CORRECCIONES
# Verifica que todas las correcciones críticas se aplicaron correctamente

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Verificación de Correcciones Aplicadas${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Contador de verificaciones
PASSED=0
FAILED=0

# ===================================
# 1. VERIFICAR REACT-ROUTER-DOM
# ===================================
echo -e "${YELLOW}[1/5]${NC} Verificando eliminación de react-router-dom..."

if grep -q "react-router-dom" package.json; then
  echo -e "${RED}❌ FALLO: react-router-dom todavía en package.json${NC}"
  FAILED=$((FAILED + 1))
else
  echo -e "${GREEN}✅ CORRECTO: react-router-dom eliminado${NC}"
  PASSED=$((PASSED + 1))
fi

# Verificar imports en código
ROUTER_IMPORTS=$(grep -r "from.*react-router-dom" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ $ROUTER_IMPORTS -gt 0 ]; then
  echo -e "${RED}⚠️  ADVERTENCIA: Encontrados $ROUTER_IMPORTS imports de react-router-dom en código${NC}"
  echo -e "${YELLOW}   Ejecuta: grep -r 'react-router-dom' src/${NC}"
else
  echo -e "${GREEN}✓ No hay imports de react-router-dom en código${NC}"
fi

echo ""

# ===================================
# 2. VERIFICAR ERROR HANDLING
# ===================================
echo -e "${YELLOW}[2/5]${NC} Verificando error handling en App.tsx..."

ERROR_HANDLES=$(grep -c "\.catch(error =>" src/app/App.tsx 2>/dev/null)
if [ $ERROR_HANDLES -ge 5 ]; then
  echo -e "${GREEN}✅ CORRECTO: Encontrados $ERROR_HANDLES .catch() en App.tsx${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FALLO: Solo $ERROR_HANDLES .catch() encontrados (se esperan al menos 5)${NC}"
  FAILED=$((FAILED + 1))
fi

# Verificar mensajes de error específicos
CRITICAL_LOGS=$(grep -c "\[CRITICAL\]" src/app/App.tsx 2>/dev/null)
if [ $CRITICAL_LOGS -ge 5 ]; then
  echo -e "${GREEN}✓ Logs [CRITICAL] implementados correctamente${NC}"
else
  echo -e "${YELLOW}⚠️  Solo $CRITICAL_LOGS logs [CRITICAL] encontrados${NC}"
fi

echo ""

# ===================================
# 3. VERIFICAR COMENTARIOS SUPABASE
# ===================================
echo -e "${YELLOW}[3/5]${NC} Verificando documentación de Supabase singleton..."

if grep -q "CLIENTE SINGLETON" src/app/utils/supabase.ts; then
  echo -e "${GREEN}✅ CORRECTO: Comentarios singleton en supabase.ts${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FALLO: Faltan comentarios singleton en supabase.ts${NC}"
  FAILED=$((FAILED + 1))
fi

if grep -q "RE-EXPORTACIÓN" src/utils/supabase/client.ts; then
  echo -e "${GREEN}✓ Comentarios en client.ts presentes${NC}"
else
  echo -e "${YELLOW}⚠️  Faltan comentarios en client.ts${NC}"
fi

# Verificar solo una instancia de createClient
CLIENT_INSTANCES=$(grep -r "createClient(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "^Binary" | wc -l)
if [ $CLIENT_INSTANCES -eq 1 ]; then
  echo -e "${GREEN}✓ Solo una instancia de createClient (correcto)${NC}"
else
  echo -e "${YELLOW}⚠️  Se encontraron $CLIENT_INSTANCES instancias de createClient${NC}"
  echo -e "${YELLOW}   Verifica que solo esté en src/app/utils/supabase.ts${NC}"
fi

echo ""

# ===================================
# 4. VERIFICAR .ENV.LOCAL
# ===================================
echo -e "${YELLOW}[4/5]${NC} Verificando variables de entorno..."

if [ -f .env.local ]; then
  echo -e "${GREEN}✅ CORRECTO: .env.local existe${NC}"
  PASSED=$((PASSED + 1))
  
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    echo -e "${GREEN}✓ Plantilla de VITE_SUPABASE_URL encontrada${NC}"
  fi
  
  if grep -q "NOTAS IMPORTANTES" .env.local; then
    echo -e "${GREEN}✓ Documentación en .env.local presente${NC}"
  fi
else
  echo -e "${RED}❌ FALLO: .env.local no encontrado${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""

# ===================================
# 5. BUILD LOCAL
# ===================================
echo -e "${YELLOW}[5/5]${NC} Ejecutando build de prueba..."

if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ CORRECTO: Build exitoso${NC}"
  PASSED=$((PASSED + 1))
  
  # Verificar tamaño del bundle
  if [ -d dist ]; then
    SIZE=$(du -sh dist/ | cut -f1)
    echo -e "${GREEN}✓ Bundle size: $SIZE${NC}"
    
    # Verificar que es menor a 3MB
    SIZE_BYTES=$(du -s dist/ | cut -f1)
    if [ $SIZE_BYTES -lt 3072000 ]; then
      echo -e "${GREEN}✓ Bundle size dentro del objetivo (< 3MB)${NC}"
    else
      echo -e "${YELLOW}⚠️  Bundle size mayor a 3MB${NC}"
    fi
  fi
else
  echo -e "${RED}❌ FALLO: Build falló${NC}"
  echo -e "${YELLOW}   Ejecuta 'npm run build' manualmente para ver errores${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""

# ===================================
# RESUMEN
# ===================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Resumen de Verificación${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ Verificaciones pasadas: $PASSED/5${NC}"
echo -e "  ${RED}❌ Verificaciones falladas: $FAILED/5${NC}"
echo ""

# Resultado final
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🎉 ¡TODAS LAS VERIFICACIONES PASARON!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${GREEN}✅ La app está lista para deployment${NC}"
  echo ""
  echo -e "${BLUE}Próximos pasos:${NC}"
  echo "  1. Testing manual de funcionalidades core"
  echo "  2. Configurar variables en Vercel (si no están)"
  echo "  3. Deploy: vercel --prod"
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠️  ALGUNAS VERIFICACIONES FALLARON${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Por favor, revisa los errores arriba y corrige antes de deployar${NC}"
  echo ""
  exit 1
fi
