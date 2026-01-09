-- =====================================================
-- DROP KV STORE TABLE (OBSOLETE)
-- =====================================================
-- Este script elimina la tabla kv_store_b0e879f0 que ya no se usa.
-- La app ahora usa tablas Postgres estructuradas en su lugar.
-- =====================================================

-- Eliminar la tabla KV store antigua (si existe)
DROP TABLE IF EXISTS kv_store_b0e879f0 CASCADE;

-- Verificar que se eliminó correctamente
-- Ejecuta esta query después para confirmar:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'kv_store_b0e879f0';
-- Debe retornar 0 filas

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ La tabla kv_store_b0e879f0 ha sido eliminada
-- ✅ Todos los datos ahora están en las 10 tablas estructuradas
-- ✅ La app funciona 100% con Postgres cloud
-- =====================================================
