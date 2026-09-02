-- ==============================================================================
-- DELICIAS DEL VALLE — CORRECCIÓN DE POLÍTICAS RLS EN COTIZACIONES
-- ==============================================================================
-- Este script corrige las políticas de Row Level Security (RLS) en Supabase
-- y asegura que la columna 'cliente_email' exista sin provocar errores de alteración.
-- ==============================================================================

BEGIN;

-- 1. AGREGAR COLUMNAS FALTANTES SI NO EXISTEN (EVITA ERROR 42703)
ALTER TABLE IF EXISTS public.cotizaciones 
    ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS fecha_evento DATE,
    ADD COLUMN IF NOT EXISTS cliente_id BIGINT;

-- 2. FLEXIBILIZAR RESTRICCIONES NOT NULL EN ITEMS PARA PRODUCTOS SIN MASA/RELLENO
ALTER TABLE IF EXISTS public.cotizacion_items 
    ALTER COLUMN tamano_porciones DROP NOT NULL,
    ALTER COLUMN masa_base DROP NOT NULL,
    ALTER COLUMN relleno DROP NOT NULL,
    ALTER COLUMN decoracion DROP NOT NULL,
    ALTER COLUMN dedicatoria DROP NOT NULL;

-- 3. ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR CUALQUIER POLÍTICA RESTRICTIVA ANTERIOR
DROP POLICY IF EXISTS "cotizaciones_select_policy" ON public.cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_modify_policy" ON public.cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_policy_all" ON public.cotizaciones;
DROP POLICY IF EXISTS "cotizaciones_allow_all" ON public.cotizaciones;
DROP POLICY IF EXISTS "Acceso total cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Permitir lectura de cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Permitir insercion de cotizaciones" ON public.cotizaciones;

DROP POLICY IF EXISTS "cotizacion_items_select_policy" ON public.cotizacion_items;
DROP POLICY IF EXISTS "cotizacion_items_modify_policy" ON public.cotizacion_items;
DROP POLICY IF EXISTS "cotizacion_items_policy_all" ON public.cotizacion_items;
DROP POLICY IF EXISTS "cotizacion_items_allow_all" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Acceso total cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Permitir lectura de cotizacion_items" ON public.cotizacion_items;
DROP POLICY IF EXISTS "Permitir insercion de cotizacion_items" ON public.cotizacion_items;

-- 5. CREAR POLÍTICAS PERMISIVAS TOTALES (SELECT, INSERT, UPDATE, DELETE) PARA anon Y authenticated
CREATE POLICY "cotizaciones_allow_all"
    ON public.cotizaciones
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "cotizacion_items_allow_all"
    ON public.cotizacion_items
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. ASIGNAR PRIVILEGIOS COMPLETOS A LOS ROLES DE LA API
GRANT ALL ON TABLE public.cotizaciones TO anon, authenticated;
GRANT ALL ON TABLE public.cotizacion_items TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMIT;
