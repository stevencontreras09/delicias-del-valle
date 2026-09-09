-- ==============================================================================
-- SCRIPT: patch_logistica_delivery.sql
-- DESCRIPCIÓN: Zonas de envío, choferes, cálculo de fletes y logística de entrega.
-- ==============================================================================

BEGIN;

-- 1. Tabla de Zonas y Tarifas de Transporte
CREATE TABLE IF NOT EXISTS public.zonas_delivery (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tarifa NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tiempo_estimado_min INT DEFAULT 45,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zonas de referencia iniciales (ajustables desde la app)
INSERT INTO public.zonas_delivery (nombre, tarifa, tiempo_estimado_min) VALUES
('Zona 1 - Local / Cercano (Taller y alrededores)', 150.00, 25),
('Zona 2 - Centro Metropolitano', 250.00, 40),
('Zona 3 - Zona Metropolitana Ampliada', 350.00, 55),
('Zona 4 - Periferia / Envíos Especiales', 500.00, 75)
ON CONFLICT DO NOTHING;

-- 2. Campos de despacho y logística en PEDIDOS
ALTER TABLE IF EXISTS public.pedidos 
    ADD COLUMN IF NOT EXISTS tipo_despacho VARCHAR(30) DEFAULT 'retiro', -- 'retiro' o 'delivery'
    ADD COLUMN IF NOT EXISTS zona_delivery_id BIGINT REFERENCES public.zonas_delivery(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS costo_delivery NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
    ADD COLUMN IF NOT EXISTS punto_referencia TEXT,
    ADD COLUMN IF NOT EXISTS repartidor_nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS repartidor_telefono VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cobro_delivery_al_recibir BOOLEAN DEFAULT FALSE; -- True si el chofer cobra el flete en efectivo

-- 3. Campos en COTIZACIONES para calcular el presupuesto completo
ALTER TABLE IF EXISTS public.cotizaciones 
    ADD COLUMN IF NOT EXISTS tipo_despacho VARCHAR(30) DEFAULT 'retiro',
    ADD COLUMN IF NOT EXISTS zona_delivery_id BIGINT REFERENCES public.zonas_delivery(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS costo_delivery NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
    ADD COLUMN IF NOT EXISTS punto_referencia TEXT,
    ADD COLUMN IF NOT EXISTS repartidor_nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS repartidor_telefono VARCHAR(50);

-- 4. Habilitar rol 'delivery' (Repartidor / Chofer) en tabla de usuarios y funciones RPC
DO $$
BEGIN
    ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
    ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
        CHECK (rol IN ('admin', 'coadmin', 'pastelero', 'cajero', 'operador', 'delivery'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.guardar_usuario_seguro(
  p_id INT,
  p_username TEXT,
  p_password TEXT,
  p_nombre_completo TEXT,
  p_email TEXT,
  p_telefono TEXT,
  p_rol TEXT,
  p_activo BOOLEAN,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hashed_password TEXT;
  v_user_id INT;
  v_existing RECORD;
BEGIN
  IF p_username IS NULL OR TRIM(p_username) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'El nombre de usuario es obligatorio.');
  END IF;

  IF p_rol NOT IN ('admin', 'coadmin', 'pastelero', 'cajero', 'operador', 'delivery') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rol de usuario inválido.');
  END IF;

  SELECT * INTO v_existing FROM public.usuarios WHERE id = p_id;

  IF v_existing.id IS NOT NULL THEN
    IF p_password IS NOT NULL AND TRIM(p_password) != '' THEN
      v_hashed_password := extensions.crypt(TRIM(p_password)::TEXT, extensions.gen_salt('bf', 10));
    ELSE
      v_hashed_password := v_existing.password;
    END IF;

    UPDATE public.usuarios
    SET
      username = TRIM(p_username),
      password = v_hashed_password,
      nombre_completo = TRIM(p_nombre_completo),
      email = TRIM(p_email),
      telefono = TRIM(p_telefono),
      rol = p_rol,
      activo = p_activo,
      avatar_url = p_avatar_url
    WHERE id = p_id;

    v_user_id := p_id;
  ELSE
    IF p_password IS NULL OR TRIM(p_password) = '' THEN
      RETURN jsonb_build_object('success', false, 'message', 'La contraseña es obligatoria para nuevos usuarios.');
    END IF;

    v_hashed_password := extensions.crypt(TRIM(p_password)::TEXT, extensions.gen_salt('bf', 10));

    INSERT INTO public.usuarios (username, password, nombre_completo, email, telefono, rol, activo, avatar_url, created_at)
    VALUES (
      TRIM(p_username),
      v_hashed_password,
      TRIM(p_nombre_completo),
      TRIM(p_email),
      TRIM(p_telefono),
      p_rol,
      p_activo,
      p_avatar_url,
      NOW()
    )
    RETURNING id INTO v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuario guardado exitosamente.',
    'user_id', v_user_id
  );
END;
$$;

-- 5. Seguridad (RLS)
ALTER TABLE public.zonas_delivery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica zonas delivery" ON public.zonas_delivery;
CREATE POLICY "Lectura publica zonas delivery"
    ON public.zonas_delivery FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Gestion zonas delivery admin" ON public.zonas_delivery;
CREATE POLICY "Gestion zonas delivery admin"
    ON public.zonas_delivery FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Habilitar Tiempo Real si existe la publicación en Supabase
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zonas_delivery;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
