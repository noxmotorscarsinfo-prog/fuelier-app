-- =====================================================
-- FIX PERMANENTE: POLÍTICAS RLS PARA BASE_INGREDIENTS
-- =====================================================
-- 
-- PROBLEMA: Recursión infinita en policies con created_by
-- SOLUCIÓN: Ingredientes del sistema NO tienen owner, son públicos
-- 
-- Este script es IDEMPOTENTE - se puede ejecutar múltiples veces
-- =====================================================

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can read base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Users can insert base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Users can update base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Admins can manage base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Anyone can read base ingredients" ON base_ingredients;
DROP POLICY IF EXISTS "Service role can manage base ingredients" ON base_ingredients;

-- 2. Hacer created_by NULLABLE (ingredientes del sistema no tienen owner)
ALTER TABLE base_ingredients 
  ALTER COLUMN created_by DROP NOT NULL;

-- 3. POLÍTICAS CORRECTAS Y SIMPLES:

-- ✅ Todos pueden LEER ingredientes base (son públicos)
CREATE POLICY "Anyone can read base ingredients"
  ON base_ingredients
  FOR SELECT
  USING (true);

-- ✅ Solo SERVICE ROLE puede ESCRIBIR (sincronización automática)
-- El script de sincronización usa SERVICE_ROLE_KEY
CREATE POLICY "Service role can manage base ingredients"
  ON base_ingredients
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE base_ingredients IS 
  'Ingredientes del sistema (60 ingredientes base).
   Fuente de verdad: src/data/ingredientsDatabase.ts
   Sincronización: npm run sync-ingredients
   Políticas: Lectura pública, escritura solo vía SERVICE_ROLE';

COMMENT ON COLUMN base_ingredients.created_by IS 
  'NULL para ingredientes del sistema. Solo tiene valor para ingredientes custom agregados por usuarios específicos.';

-- 5. Limpiar created_by de ingredientes existentes del sistema
UPDATE base_ingredients 
SET created_by = NULL 
WHERE created_by IS NOT NULL;
