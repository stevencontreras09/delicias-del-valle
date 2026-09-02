-- ==============================================================================
-- SCRIPT: patch_operaciones_pro.sql
-- PROYECTO: Delicias del Valle — Sistema Operativo Gastronómico
-- COMPATIBILIDAD: Supabase / PostgreSQL 14+
-- DESCRIPCIÓN: Mini CRM (clientes), conciliación bancaria y reversión de inventario.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABLA: clientes (Mini CRM y Autocompletado)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    alergias_preferencias TEXT,
    fecha_cumpleanos DATE,
    cumpleanos_familiar VARCHAR(100),
    total_pedidos INT DEFAULT 0,
    total_pedidos_historico INT DEFAULT 0,
    ultimo_pedido DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda rápida para el autocompletado en mostrador / cotizador
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes (LOWER(nombre));

-- ------------------------------------------------------------------------------
-- 2. VINCULACIÓN CON PEDIDOS Y COTIZACIONES
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.pedidos 
    ADD COLUMN IF NOT EXISTS cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notas TEXT;

ALTER TABLE IF EXISTS public.cotizaciones 
    ADD COLUMN IF NOT EXISTS cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. CONCILIACIÓN BANCARIA EN TABLA: pagos
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.pagos 
    ADD COLUMN IF NOT EXISTS banco VARCHAR(100),              -- 'Banco Popular', 'Banreservas', 'BHD', 'Efectivo', etc.
    ADD COLUMN IF NOT EXISTS numero_referencia VARCHAR(150),  -- Número de autorización o confirmación de transferencia
    ADD COLUMN IF NOT EXISTS comprobante_url TEXT,            -- URL de la imagen del comprobante en Supabase Storage
    ADD COLUMN IF NOT EXISTS estado_conciliacion VARCHAR(30) DEFAULT 'confirmado'; -- 'pendiente', 'confirmado'

-- ------------------------------------------------------------------------------
-- 4. AJUSTES DE COMPATIBILIDAD DE ESQUEMA (Insumos, Mermas y Pedido Items)
-- ------------------------------------------------------------------------------
-- Soporte para costo_unitario como alias en insumos
ALTER TABLE IF EXISTS public.insumos 
    ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,4);

UPDATE public.insumos 
SET costo_unitario = costo_unitario_base 
WHERE costo_unitario IS NULL;

-- Soporte para factor_multiplicador en pedido_items
ALTER TABLE IF EXISTS public.pedido_items 
    ADD COLUMN IF NOT EXISTS factor_multiplicador DECIMAL(10,2) DEFAULT 1.0;

UPDATE public.pedido_items 
SET factor_multiplicador = COALESCE(factor_receta, 1.0) 
WHERE factor_multiplicador IS NULL;

-- Soporte para observaciones y costo_total en mermas
ALTER TABLE IF EXISTS public.mermas 
    ADD COLUMN IF NOT EXISTS observaciones TEXT,
    ADD COLUMN IF NOT EXISTS costo_total DECIMAL(10,2);

-- Actualizar restricción check de motivo en mermas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'mermas_motivo_check'
    ) THEN
        ALTER TABLE public.mermas DROP CONSTRAINT mermas_motivo_check;
    END IF;
END $$;

ALTER TABLE public.mermas 
    ADD CONSTRAINT mermas_motivo_check 
    CHECK (motivo IN ('caducidad', 'quemado', 'derrame', 'error_pesado', 'calidad', 'cancelacion_cliente', 'Cancelación de Cliente', 'otro'));

-- ------------------------------------------------------------------------------
-- 5. FUNCIÓN PL/pgSQL: Reversión Atómica de Inventario o Traslado a Mermas
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancelar_pedido_con_inventario(
    p_pedido_id BIGINT,
    p_accion TEXT,                  -- 'reintegrar' (regresa al stock) | 'merma' (lo registra como pérdida técnica)
    p_usuario_id BIGINT DEFAULT NULL,
    p_motivo_detalle TEXT DEFAULT 'Cancelación de pedido por cliente'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido RECORD;
    v_item RECORD;
    v_ingrediente RECORD;
    v_cantidad_insumo NUMERIC;
    v_costo_perdida NUMERIC;
    v_insumos_procesados INT := 0;
BEGIN
    -- Validar existencia del pedido
    SELECT * INTO v_pedido FROM public.pedidos WHERE id = p_pedido_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido no encontrado');
    END IF;

    -- Validar que la acción sea válida (acepta 'reintegrar'/'reintegrar_stock' o 'merma'/'declarar_merma')
    IF p_accion NOT IN ('reintegrar', 'merma', 'reintegrar_stock', 'declarar_merma') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Acción no válida. Use "reintegrar" o "merma"');
    END IF;

    IF p_accion = 'reintegrar_stock' THEN p_accion := 'reintegrar'; END IF;
    IF p_accion = 'declarar_merma' THEN p_accion := 'merma'; END IF;

    -- Procesar ingredientes consumidos solo si el pedido tenía inventario descontado o estaba en producción/preparado
    IF v_pedido.inventario_descontado IS TRUE OR LOWER(v_pedido.estado) IN ('en producción', 'en_produccion', 'listo para entrega', 'listo', 'confirmado') THEN
        
        -- Recorrer cada ítem del pedido (soporta factor_multiplicador y factor_receta)
        FOR v_item IN 
            SELECT pi.receta_id, pi.cantidad, 
                   COALESCE(pi.factor_multiplicador, pi.factor_receta, 1.0) AS factor
            FROM public.pedido_items pi
            WHERE pi.pedido_id = p_pedido_id AND pi.receta_id IS NOT NULL
        LOOP
            -- Recorrer la receta estándar (BOM) asociada a ese ítem
            FOR v_ingrediente IN 
                SELECT ri.insumo_id, ri.cantidad, 
                       COALESCE(i.costo_unitario_base, i.costo_unitario, 0) AS costo_unitario, 
                       i.nombre AS nombre_insumo
                FROM public.receta_ingredientes ri
                JOIN public.insumos i ON i.id = ri.insumo_id
                WHERE ri.receta_id = v_item.receta_id
            LOOP
                -- Cantidad total del insumo = cantidad receta * factor de tamaño * unidades pedidas
                v_cantidad_insumo := (v_ingrediente.cantidad * v_item.factor * v_item.cantidad);

                IF p_accion = 'reintegrar' THEN
                    -- Regresar la cantidad al inventario
                    UPDATE public.insumos
                    SET stock_actual = stock_actual + v_cantidad_insumo,
                        updated_at = NOW()
                    WHERE id = v_ingrediente.insumo_id;

                ELSIF p_accion = 'merma' THEN
                    -- Registrar como pérdida en la tabla de mermas
                    v_costo_perdida := v_cantidad_insumo * COALESCE(v_ingrediente.costo_unitario, 0);
                    
                    INSERT INTO public.mermas (
                        insumo_id,
                        cantidad,
                        costo_perdido,
                        costo_total,
                        motivo,
                        fecha,
                        notas,
                        observaciones,
                        created_at
                    ) VALUES (
                        v_ingrediente.insumo_id,
                        v_cantidad_insumo,
                        v_costo_perdida,
                        v_costo_perdida,
                        'Cancelación de Cliente',
                        CURRENT_DATE,
                        FORMAT('Pedido #%s cancelado. Insumo: %s. Detalle: %s', p_pedido_id, v_ingrediente.nombre_insumo, p_motivo_detalle),
                        FORMAT('Pedido #%s cancelado. Insumo: %s. Detalle: %s', p_pedido_id, v_ingrediente.nombre_insumo, p_motivo_detalle),
                        NOW()
                    );
                END IF;

                v_insumos_procesados := v_insumos_procesados + 1;
            END LOOP;
        END LOOP;
    END IF;

    -- Actualizar estado final del pedido (normalizado a minúsculas para compatibilidad con la app)
    UPDATE public.pedidos
    SET estado = 'cancelado',
        inventario_descontado = FALSE,
        notas_cocina = COALESCE(notas_cocina, '') || FORMAT(' | Cancelado el %s. Acción stock: %s.', NOW()::DATE, p_accion),
        notas = COALESCE(notas, '') || FORMAT(' | Cancelado el %s. Acción stock: %s.', NOW()::DATE, p_accion),
        updated_at = NOW()
    WHERE id = p_pedido_id;

    RETURN jsonb_build_object(
        'success', true,
        'pedido_id', p_pedido_id,
        'accion', p_accion,
        'insumos_afectados', v_insumos_procesados,
        'nuevo_estado', 'cancelado'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. SEGURIDAD Y PERMISOS (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política de lectura: accesible para usuarios autenticados y anónimos autorizados
DROP POLICY IF EXISTS "Permitir lectura de clientes" ON public.clientes;
CREATE POLICY "Permitir lectura de clientes"
    ON public.clientes FOR SELECT
    TO anon, authenticated
    USING (true);

-- Política de escritura: inserción y actualización para usuarios del sistema
DROP POLICY IF EXISTS "Permitir inserción y actualización de clientes" ON public.clientes;
CREATE POLICY "Permitir inserción y actualización de clientes"
    ON public.clientes FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Otorgar ejecución de la función de cancelación a la API de Supabase
GRANT EXECUTE ON FUNCTION public.cancelar_pedido_con_inventario(BIGINT, TEXT, BIGINT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 7. CLIENTES INICIALES DE DEMOSTRACIÓN (MINI CRM)
-- ------------------------------------------------------------------------------
INSERT INTO public.clientes (id, nombre, telefono, email, direccion, alergias_preferencias, fecha_cumpleanos, cumpleanos_familiar, total_pedidos, total_pedidos_historico, ultimo_pedido)
VALUES
    (1, 'Ana María Gómez', '809-555-2144', 'ana.gomez@gmail.com', 'Calle Sol Poniente #14, Santo Domingo DN', 'Alérgica a las nueces y al maní. Prefiere masa de vainilla ligera y no muy dulce.', '2026-05-15', '15 de Mayo (Hija Sofía)', 4, 4, '2026-08-20'),
    (2, 'Carlos Rodríguez', '829-555-8932', 'crodriguez@empresa.com.do', 'Av. Winston Churchill, Torre Empresarial Piso 8', 'Sin restricciones. Le fascinan los quesillos tradicionales y el dulce de leche.', '2026-09-28', '28 de Septiembre (Cumpleaños personal)', 3, 3, '2026-08-28'),
    (3, 'Laura Peña', '849-555-4411', 'laura.pena@hotmail.com', 'Residencial Las Praderas Mz 4 Casa 12, Santiago', 'Intolerante a la lactosa. Siempre solicita crema pastelera vegana o merengue italiano.', '2026-12-04', '04 de Diciembre (Madre)', 2, 2, '2026-08-14')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    alergias_preferencias = EXCLUDED.alergias_preferencias,
    fecha_cumpleanos = EXCLUDED.fecha_cumpleanos,
    total_pedidos_historico = EXCLUDED.total_pedidos_historico;

SELECT setval('clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.clientes));

COMMIT;
