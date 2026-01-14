-- Tabla para metadata del sistema
-- Usado para tracking de versiones, hashes, etc.

CREATE TABLE IF NOT EXISTS system_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar hash inicial (se actualizará con script de sync)
INSERT INTO system_metadata (key, value) 
VALUES ('ingredients_hash', 'initial')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE system_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: cualquiera puede leer
CREATE POLICY "Public can read system_metadata"
  ON system_metadata
  FOR SELECT
  USING (true);

-- Policy: solo service role puede escribir
CREATE POLICY "Service role can write system_metadata"
  ON system_metadata
  FOR ALL
  USING (auth.role() = 'service_role');
