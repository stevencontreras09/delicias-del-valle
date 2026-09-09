-- ==============================================================================
-- SCRIPT: actualizar_rol_delivery_supabase.sql
-- DESCRIPCIÓN: Habilita el rol 'delivery' (Repartidor / Chofer) en Supabase
-- INSTRUCCIONES: Copia y ejecuta este script en el SQL Editor de tu consola Supabase.
-- ==============================================================================

BEGIN;

-- 1. Actualizar la restricción CHECK de la tabla usuarios para permitir 'delivery'
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol IN ('admin', 'coadmin', 'pastelero', 'cajero', 'operador', 'delivery'));

-- 2. Actualizar la función segura guardar_usuario_seguro
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

-- 3. Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.guardar_usuario_seguro(INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;

COMMIT;
