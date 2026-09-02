-- ==============================================================================
-- DELICIAS DEL VALLE — RESOLUCIÓN DE ALERTAS SUPABASE ADVISOR
-- ==============================================================================
-- 1. Aplica security_invoker = true en:
--    - public.v_recetas_catalogo
--    - public.v_recetas_agrupadas
--    - public.usuarios_seguros
-- 2. Asegura permisos y políticas RLS de SELECT en las tablas base correspondientes
--    (recetas, receta_ingredientes, insumos y usuarios) para que los roles
--    'anon' y 'authenticated' puedan consultar las vistas sin bloqueos.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. APLICAR security_invoker = true EN TODAS LAS VISTAS DEL SISTEMA
-- ------------------------------------------------------------------------------
-- Esto resuelve la alerta crítica de Supabase Advisor: 'views_with_security_definer'
-- asegurando que las vistas ejecuten bajo los permisos y RLS del usuario que consulta.

ALTER VIEW public.v_recetas_catalogo SET (security_invoker = true);
ALTER VIEW public.v_recetas_agrupadas SET (security_invoker = true);
ALTER VIEW public.usuarios_seguros SET (security_invoker = true);

-- Otorgar SELECT en las vistas a anon y authenticated
GRANT SELECT ON public.v_recetas_catalogo TO anon, authenticated;
GRANT SELECT ON public.v_recetas_agrupadas TO anon, authenticated;
GRANT SELECT ON public.usuarios_seguros TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. TABLA BASE: usuarios (Consulta segura vía usuarios_seguros)
-- ------------------------------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Conceder SELECT general para que la vista usuarios_seguros funcione con security_invoker
GRANT SELECT ON public.usuarios TO anon, authenticated;

-- Revocar lectura directa de la columna sensible 'password' a anon para máxima seguridad
REVOKE SELECT (password) ON public.usuarios FROM anon;

-- Política RLS para permitir SELECT de usuarios a través de la vista
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
CREATE POLICY "usuarios_select_policy"
    ON public.usuarios
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 3. TABLA BASE: recetas (Base de v_recetas_catalogo y v_recetas_agrupadas)
-- ------------------------------------------------------------------------------
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.recetas TO anon, authenticated;

DROP POLICY IF EXISTS "recetas_select_policy" ON public.recetas;
CREATE POLICY "recetas_select_policy"
    ON public.recetas
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 4. TABLA BASE: receta_ingredientes
-- ------------------------------------------------------------------------------
ALTER TABLE public.receta_ingredientes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.receta_ingredientes TO anon, authenticated;

DROP POLICY IF EXISTS "receta_ingredientes_select_policy" ON public.receta_ingredientes;
CREATE POLICY "receta_ingredientes_select_policy"
    ON public.receta_ingredientes
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 5. TABLA BASE: insumos
-- ------------------------------------------------------------------------------
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.insumos TO anon, authenticated;

DROP POLICY IF EXISTS "insumos_select_policy" ON public.insumos;
CREATE POLICY "insumos_select_policy"
    ON public.insumos
    FOR SELECT
    TO anon, authenticated
    USING (true);

COMMIT;

-- ------------------------------------------------------------------------------
-- VERIFICACIÓN DE ESTADO EN SUPABASE
-- ------------------------------------------------------------------------------
SELECT 
    schemaname, 
    viewname, 
    viewowner 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('v_recetas_catalogo', 'v_recetas_agrupadas', 'usuarios_seguros');
