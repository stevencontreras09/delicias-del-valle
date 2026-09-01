-- ==============================================================================
-- PATCH: Optimización de catálogo de recetas - Delicias del Valle
-- Agrega nombre_base + variantes de rendimiento
-- NO borra ni modifica datos existentes (solo agrega columnas, índices y vistas)
-- Seguro para ejecutar en Supabase / PostgreSQL
-- ==============================================================================

-- 1. Agregar columnas nuevas a la tabla recetas
ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS nombre_base VARCHAR(150),
  ADD COLUMN IF NOT EXISTS es_variante_de INT REFERENCES recetas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS orden_variante INT DEFAULT 0;

-- 2. Índice para búsquedas rápidas por nombre_base
CREATE INDEX IF NOT EXISTS idx_recetas_nombre_base ON recetas(nombre_base);

-- 3. Rellenar nombre_base automáticamente a partir del nombre actual
UPDATE recetas SET nombre_base = 'Torta de Vainilla'
WHERE nombre ILIKE '%TORTA DE VAINILLA%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Torta de Chocolate'
WHERE (nombre ILIKE '%TORTA DE CHCATE%' OR nombre ILIKE '%TORTA DE CHOCOLATE%')
  AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Suspiro para Torta'
WHERE nombre ILIKE '%SUSPIRO PARA TORTA%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Brownie'
WHERE nombre ILIKE '%BROWNIE%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Cupcake'
WHERE nombre ILIKE '%CUPCAKE%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Galletas de Mantequilla'
WHERE nombre ILIKE '%GALLETAS DE MANTEQUILLA%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Galletas de Formas'
WHERE nombre ILIKE '%GALLETAS DE FORMAS%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Galletas Lunette'
WHERE nombre ILIKE '%GALLETAS LUNETTE%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Alfajor'
WHERE nombre ILIKE '%ALFAJOR%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Pan de Jamón'
WHERE nombre ILIKE '%PAN DE JAMON%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Cachito'
WHERE nombre ILIKE '%CACHITO%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Quesillo'
WHERE nombre ILIKE '%QUESILLO%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Tres Leches'
WHERE nombre ILIKE '%TRES LECHE%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Suspiritos'
WHERE nombre ILIKE '%SUSPIRITOS%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Marquesa de Limón'
WHERE nombre ILIKE '%MARQUESA%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Deditos de Novia'
WHERE nombre ILIKE '%DEDITOS%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Polvorones'
WHERE nombre ILIKE '%POLVORON%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Besitos de Nuez'
WHERE nombre ILIKE '%BESITOS DE NUEZ%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Taquitos de Hojaldre'
WHERE nombre ILIKE '%TAQUITOS%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Bizcocho'
WHERE nombre ILIKE '%BIZCOCHO%' AND nombre_base IS NULL;

UPDATE recetas SET nombre_base = 'Pasta Seca'
WHERE nombre ILIKE '%PASTA SECA%' AND nombre_base IS NULL;

-- Cualquier receta que no haya coincidido usa su propio nombre como base
UPDATE recetas
SET nombre_base = nombre
WHERE nombre_base IS NULL;

-- 4. Vista: catálogo completo con nombre_base y texto de rendimiento
CREATE OR REPLACE VIEW v_recetas_catalogo AS
SELECT
  r.id,
  r.nombre,
  r.nombre_base,
  r.categoria,
  r.rendimiento_base,
  r.rendimiento_unidad,
  CONCAT(r.rendimiento_base, ' ', COALESCE(r.rendimiento_unidad, '')) AS rendimiento_texto,
  r.materiales_indirectos_pct,
  r.costos_operativos_pct,
  r.reposicion_equipos_pct,
  r.mano_obra_pct,
  r.margen_beneficio_pct,
  r.activa,
  r.es_variante_de,
  r.orden_variante,
  (
    SELECT COUNT(*)
    FROM recetas r2
    WHERE r2.nombre_base = r.nombre_base AND r2.activa = TRUE
  ) AS total_variantes
FROM recetas r
WHERE r.activa = TRUE
ORDER BY r.nombre_base, r.rendimiento_base, r.nombre;

-- 5. Vista: resumen agrupado (1 fila por producto + lista de tamaños)
CREATE OR REPLACE VIEW v_recetas_agrupadas AS
SELECT
  nombre_base,
  categoria,
  COUNT(*) AS cantidad_variantes,
  ARRAY_AGG(
    CONCAT(rendimiento_base, ' ', COALESCE(rendimiento_unidad, ''))
    ORDER BY rendimiento_base
  ) AS rendimientos_disponibles,
  ARRAY_AGG(id ORDER BY rendimiento_base) AS ids_variantes,
  BOOL_AND(activa) AS todas_activas
FROM recetas
WHERE activa = TRUE
GROUP BY nombre_base, categoria
ORDER BY nombre_base;
