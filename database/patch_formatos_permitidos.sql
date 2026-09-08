-- ==============================================================================
-- DELICIAS DEL VALLE: PARCHE DE BASE DE DATOS - FORMATOS DE PRESENTACIÓN
-- ==============================================================================
-- Permite configurar por receta cuáles divisiones de presentación están
-- habilitadas (libra, porcion y/o mini).

ALTER TABLE recetas 
ADD COLUMN IF NOT EXISTS formatos_permitidos TEXT[] DEFAULT ARRAY['libra', 'porcion', 'mini'];

COMMENT ON COLUMN recetas.formatos_permitidos IS 'Formatos de presentación habilitados para la receta: libra, porcion, mini';

-- Asegurar que las recetas existentes tengan los 3 formatos por defecto
UPDATE recetas 
SET formatos_permitidos = ARRAY['libra', 'porcion', 'mini']
WHERE formatos_permitidos IS NULL OR cardinality(formatos_permitidos) = 0;
