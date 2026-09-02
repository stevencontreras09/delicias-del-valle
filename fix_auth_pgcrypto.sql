-- ==============================================================================
-- DELICIAS DEL VALLE — REPARACIÓN DE AUTENTICACIÓN (PGCRYPTO & SEARCH_PATH)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase para solucionar el error:
-- "function crypt(text, character varying) does not exist"
-- ==============================================================================

BEGIN;

-- 1. Habilitar extensiones en el esquema extensions (estándar de Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. Asegurar que las contraseñas en la tabla usuarios sean de tipo TEXT
ALTER TABLE IF EXISTS public.usuarios 
  ALTER COLUMN password TYPE TEXT;

-- 3. Actualizar función autenticar_usuario con search_path = public, extensions y casteo explícito ::text
CREATE OR REPLACE FUNCTION public.autenticar_usuario(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user RECORD;
  v_valid BOOLEAN := FALSE;
  v_pass_text TEXT;
BEGIN
  IF p_username IS NULL OR TRIM(p_username) = '' OR p_password IS NULL OR TRIM(p_password) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Por favor ingresa usuario y contraseña.');
  END IF;

  SELECT * INTO v_user
  FROM public.usuarios
  WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Credenciales incorrectas o usuario no registrado.');
  END IF;

  IF NOT v_user.activo THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta cuenta está inactiva. Contacta al Administrador.');
  END IF;

  v_pass_text := v_user.password::TEXT;

  -- Verificación criptográfica con crypt() de extensions
  IF v_pass_text LIKE '$2%' THEN
    -- Validación estándar bcrypt con casteo explícito ::text
    v_valid := (v_pass_text = extensions.crypt(p_password::TEXT, v_pass_text));
  ELSE
    -- Migración en caliente de texto plano a bcrypt
    IF v_pass_text = p_password THEN
      v_valid := TRUE;
      UPDATE public.usuarios
      SET password = extensions.crypt(p_password::TEXT, extensions.gen_salt('bf', 10))
      WHERE id = v_user.id;
    END IF;
  END IF;

  IF NOT v_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Credenciales incorrectas o usuario no registrado.');
  END IF;

  UPDATE public.usuarios
  SET ultimo_acceso = NOW()
  WHERE id = v_user.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Autenticación exitosa.',
    'user', jsonb_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'nombre_completo', v_user.nombre_completo,
      'email', COALESCE(v_user.email, ''),
      'telefono', COALESCE(v_user.telefono, ''),
      'rol', v_user.rol,
      'activo', v_user.activo,
      'avatar_url', v_user.avatar_url,
      'ultimo_acceso', NOW(),
      'created_at', v_user.created_at
    )
  );
END;
$$;

-- 4. Actualizar guardar_usuario_seguro
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

  IF p_rol NOT IN ('admin', 'coadmin', 'pastelero', 'cajero', 'operador') THEN
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
      RETURN jsonb_build_object('success', false, 'message', 'Se requiere una contraseña para registrar un nuevo usuario.');
    END IF;

    v_hashed_password := extensions.crypt(TRIM(p_password)::TEXT, extensions.gen_salt('bf', 10));

    INSERT INTO public.usuarios (username, password, nombre_completo, email, telefono, rol, activo, avatar_url, created_at)
    VALUES (TRIM(p_username), v_hashed_password, TRIM(p_nombre_completo), TRIM(p_email), TRIM(p_telefono), p_rol, p_activo, p_avatar_url, NOW())
    RETURNING id INTO v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuario guardado de forma segura.',
    'user', (SELECT row_to_json(u) FROM public.usuarios_seguros u WHERE u.id = v_user_id)
  );
END;
$$;

-- 5. Actualizar cambiar_password_usuario
CREATE OR REPLACE FUNCTION public.cambiar_password_usuario(
  p_id INT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_new_password IS NULL OR LENGTH(TRIM(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'La contraseña debe contener al menos 6 caracteres.');
  END IF;

  UPDATE public.usuarios
  SET password = extensions.crypt(TRIM(p_new_password)::TEXT, extensions.gen_salt('bf', 10))
  WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado en la base de datos.');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Contraseña actualizada con hash bcrypt exitosamente.');
END;
$$;

-- 6. Garantizar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.autenticar_usuario(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_usuario_seguro(INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cambiar_password_usuario(INT, TEXT) TO anon, authenticated;

COMMIT;
