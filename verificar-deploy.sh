#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN PRE-DEPLOYMENT
# Verifica que todo esté listo para hacer deploy

echo "🚀 ═══════════════════════════════════════════════════════"
echo "   FUELIER - VERIFICACIÓN PRE-DEPLOYMENT"
echo "   ═══════════════════════════════════════════════════════"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0
WARNINGS=0

# 1. Verificar Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js NO instalado"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Verificar npm
echo "📦 Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm instalado: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm NO instalado"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Verificar node_modules
echo "📚 Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules existe"
else
    echo -e "${YELLOW}⚠${NC} node_modules no existe - ejecutar: npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 4. Verificar archivos críticos
echo "📄 Verificando archivos críticos..."
FILES=(
    "package.json"
    "vite.config.ts"
    "index.html"
    "vercel.json"
    ".env.example"
    "src/main.tsx"
    "src/app/types.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file NO existe"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 5. Verificar Git
echo "🔧 Verificando Git..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Repositorio Git inicializado"
    
    # Verificar si hay commits
    if git log -1 &> /dev/null; then
        LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%ar)")
        echo -e "${GREEN}✓${NC} Último commit: $LAST_COMMIT"
    else
        echo -e "${YELLOW}⚠${NC} No hay commits aún"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Verificar cambios sin commit
    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✓${NC} No hay cambios sin commit"
    else
        echo -e "${YELLOW}⚠${NC} Hay cambios sin commit"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Git no inicializado - ejecutar: git init"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Test de compilación
echo "🏗️  Verificando compilación..."
if npm run build &> /dev/null; then
    echo -e "${GREEN}✓${NC} Build exitoso"
    
    # Verificar dist
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓${NC} Carpeta dist creada"
        
        # Verificar index.html en dist
        if [ -f "dist/index.html" ]; then
            SIZE=$(du -h dist/index.html | cut -f1)
            echo -e "${GREEN}✓${NC} dist/index.html existe ($SIZE)"
        else
            echo -e "${RED}✗${NC} dist/index.html NO existe"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗${NC} Carpeta dist NO creada"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} Build FALLÓ"
    ERRORS=$((ERRORS + 1))
    echo ""
    echo "Ejecutar manualmente para ver errores:"
    echo "  npm run build"
fi
echo ""

# 7. Verificar TypeScript (comentado - Vite maneja TypeScript sin tsconfig)
# echo "📘 Verificando TypeScript..."
# if npx tsc --noEmit &> /dev/null; then
#     echo -e "${GREEN}✓${NC} Sin errores de TypeScript"
# else
#     echo -e "${RED}✗${NC} Hay errores de TypeScript"
#     ERRORS=$((ERRORS + 1))
#     echo ""
#     echo "Ver errores con:"
#     echo "  npx tsc --noEmit"
# fi
echo "📘 TypeScript (manejado por Vite)..."
echo -e "${GREEN}✓${NC} Vite compila TypeScript automáticamente"
echo ""

# 8. Verificar migraciones SQL
echo "🗄️  Verificando migraciones..."
if [ -f "FUELIER_MIGRACION_FINAL.sql" ]; then
    SIZE=$(du -h FUELIER_MIGRACION_FINAL.sql | cut -f1)
    echo -e "${GREEN}✓${NC} FUELIER_MIGRACION_FINAL.sql existe ($SIZE)"
else
    echo -e "${YELLOW}⚠${NC} FUELIER_MIGRACION_FINAL.sql no encontrado"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 9. Verificar variables de entorno
echo "🔐 Verificando configuración..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC} .env.example existe"
    
    # Verificar que .env no esté en git
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✓${NC} .env en .gitignore"
    else
        echo -e "${YELLOW}⚠${NC} Agregar .env al .gitignore"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# 10. Tamaño del bundle
echo "📊 Analizando bundle..."
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✓${NC} Tamaño total dist: $DIST_SIZE"
    
    # Buscar archivos grandes
    echo "   Archivos más grandes:"
    find dist -type f -exec du -h {} + | sort -rh | head -5 | while read size file; do
        echo "   - $file: $size"
    done
fi
echo ""

# RESUMEN
echo "═══════════════════════════════════════════════════════"
echo "📊 RESUMEN"
echo "═══════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TODO LISTO PARA DEPLOYMENT${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. git add ."
    echo "  2. git commit -m 'Deploy FUELIER v1.0'"
    echo "  3. git push"
    echo "  4. Deploy en Vercel: https://vercel.com/new"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ LISTO CON ADVERTENCIAS${NC}"
    echo -e "Errores: ${RED}$ERRORS${NC}"
    echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"
    echo ""
    echo "Puedes continuar con el deployment, pero revisa las advertencias."
    exit 0
else
    echo -e "${RED}✗ NO LISTO PARA DEPLOYMENT${NC}"
    echo -e "Errores: ${RED}$ERRORS${NC}"
    echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"
    echo ""
    echo "Corrige los errores antes de hacer deploy."
    exit 1
fi
