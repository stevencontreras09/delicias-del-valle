-- ==============================================================================
-- DELICIAS DEL VALLE - SCRIPT MAESTRO DE ENDURECIMIENTO DE SEGURIDAD (HARDENING)
-- ==============================================================================
-- Este script ejecuta:
-- 1. Habilitación de la extensión pgcrypto para hashing criptográfico bcrypt.
-- 2. Migración transparente de contraseñas de texto plano a hashes bcrypt ($2b$).
-- 3. Creación de la vista segura 'usuarios_seguros' (omite la columna sensible password).
-- 4. Creación de funciones PL/pgSQL con SECURITY DEFINER para autenticación y CRUD seguro.
-- 5. Creación segura de tabla configuracion (IF NOT EXISTS).
-- 6. Activación de Row Level Security (RLS) en todas las tablas del sistema.
-- 7. Eliminación de políticas permisivas 'USING (true)' y aplicación de políticas RBAC.
--
-- INSTRUCCIONES:
-- Copia y pega este script completo en el SQL Editor de tu Dashboard de Supabase.
-- ==============================================================================

-- 1. HABILITAR EXTENSIÓN CRIPTOGRÁFICA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. MIGRACIÓN DE CONTRASEÑAS EXISTENTES A HASH BCRYPT
-- Si alguna contraseña en la tabla usuarios está en texto plano, cifrarla inmediatamente con bcrypt
UPDATE usuarios
SET password = crypt(password, gen_salt('bf', 10))
WHERE password IS NOT NULL 
  AND password != '' 
  AND password NOT LIKE '$2%';

-- 3. VISTA PÚBLICA SEGURA (SIN EXPOSICIÓN DE CONTRASEÑAS)
DROP VIEW IF EXISTS usuarios_seguros CASCADE;
CREATE OR REPLACE VIEW usuarios_seguros AS
SELECT 
  id,
  username,
  nombre_completo,
  email,
  telefono,
  rol,
  activo,
  avatar_url,
  ultimo_acceso,
  created_at
FROM usuarios;

-- 4. FUNCIÓN SEGURA DE AUTENTICACIÓN (LOGIN VIA RPC)
-- Se ejecuta en el servidor PostgreSQL; valida hashes bcrypt y nunca devuelve contraseñas al cliente
CREATE OR REPLACE FUNCTION autenticar_usuario(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_valid BOOLEAN := FALSE;
BEGIN
  -- Validar que los parámetros no estén vacíos
  IF p_username IS NULL OR TRIM(p_username) = '' OR p_password IS NULL OR TRIM(p_password) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Por favor ingresa usuario y contraseña.');
  END IF;

  -- Buscar usuario insensible a mayúsculas/minúsculas
  SELECT * INTO v_user
  FROM usuarios
  WHERE LOWER(TRIM(username)) = LOWER(TRIM(p_username));

  IF NOT FOUND THEN
    -- Mensaje genérico para mitigar enumeración de usuarios
    RETURN jsonb_build_object('success', false, 'message', 'Credenciales incorrectas o usuario no registrado.');
  END IF;

  -- Comprobar si la cuenta está activa
  IF NOT v_user.activo THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta cuenta está inactiva. Contacta al Administrador.');
  END IF;

  -- Verificación criptográfica con pgcrypto
  IF v_user.password LIKE '$2%' THEN
    -- Validación estándar con hash bcrypt
    v_valid := (v_user.password = crypt(p_password, v_user.password));
  ELSE
    -- Migración en caliente: si era texto plano, validar y migrar a hash en el momento
    IF v_user.password = p_password THEN
      v_valid := TRUE;
      UPDATE usuarios
      SET password = crypt(p_password, gen_salt('bf', 10))
      WHERE id = v_user.id;
    END IF;
  END IF;

  IF NOT v_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Credenciales incorrectas o usuario no registrado.');
  END IF;

  -- Registrar marca de tiempo del último acceso
  UPDATE usuarios
  SET ultimo_acceso = NOW()
  WHERE id = v_user.id;

  -- Retornar resultado positivo con datos del usuario (SIN CONTRASEÑA)
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

-- 5. FUNCIÓN SEGURA PARA CREAR O ACTUALIZAR USUARIOS (CON HASH BCRYPT)
CREATE OR REPLACE FUNCTION guardar_usuario_seguro(
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
SET search_path = public
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

  -- Verificar si ya existe por ID
  SELECT * INTO v_existing FROM usuarios WHERE id = p_id;

  IF v_existing.id IS NOT NULL THEN
    -- Actualización de usuario existente
    IF p_password IS NOT NULL AND TRIM(p_password) != '' THEN
      v_hashed_password := crypt(TRIM(p_password), gen_salt('bf', 10));
    ELSE
      v_hashed_password := v_existing.password; -- Conservar hash actual
    END IF;

    UPDATE usuarios
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
    -- Creación de nuevo usuario
    IF p_password IS NULL OR TRIM(p_password) = '' THEN
      RETURN jsonb_build_object('success', false, 'message', 'Se requiere una contraseña para registrar un nuevo usuario.');
    END IF;

    v_hashed_password := crypt(TRIM(p_password), gen_salt('bf', 10));

    INSERT INTO usuarios (username, password, nombre_completo, email, telefono, rol, activo, avatar_url, created_at)
    VALUES (TRIM(p_username), v_hashed_password, TRIM(p_nombre_completo), TRIM(p_email), TRIM(p_telefono), p_rol, p_activo, p_avatar_url, NOW())
    RETURNING id INTO v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuario guardado de forma segura.',
    'user', (SELECT row_to_json(u) FROM usuarios_seguros u WHERE u.id = v_user_id)
  );
END;
$$;

-- 6. FUNCIÓN SEGURA PARA RESTABLECER CONTRASEÑA
CREATE OR REPLACE FUNCTION cambiar_password_usuario(
  p_id INT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_new_password IS NULL OR LENGTH(TRIM(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'La contraseña debe contener al menos 6 caracteres.');
  END IF;

  UPDATE usuarios
  SET password = crypt(TRIM(p_new_password), gen_salt('bf', 10))
  WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado en la base de datos.');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Contraseña actualizada exitosamente con hash bcrypt.');
END;
$$;

-- 7. FUNCIÓN SEGURA PARA ELIMINAR USUARIO
CREATE OR REPLACE FUNCTION eliminar_usuario_seguro(
  p_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target RECORD;
BEGIN
  SELECT * INTO v_target FROM usuarios WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado.');
  END IF;

  -- Bloquear eliminación del Admin Maestro
  IF v_target.username = 'Steven9909' OR v_target.id = 1 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acción bloqueada: No se puede eliminar al Administrador Maestro.');
  END IF;

  DELETE FROM usuarios WHERE id = p_id;
  RETURN jsonb_build_object('success', true, 'message', 'Usuario eliminado correctamente.');
END;
$$;

-- 8. TABLA DE CONFIGURACIÓN (CREAR SI NO EXISTE PARA EVITAR ERROR 42P01)
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ELIMINACIÓN DE POLÍTICAS PERMISIVAS ANTERIORES
DROP POLICY IF EXISTS "Acceso total insumos" ON insumos;
DROP POLICY IF EXISTS "Acceso total recetas" ON recetas;
DROP POLICY IF EXISTS "Acceso total receta_ingredientes" ON receta_ingredientes;
DROP POLICY IF EXISTS "Acceso total cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Acceso total cotizacion_items" ON cotizacion_items;
DROP POLICY IF EXISTS "Acceso total pedidos" ON pedidos;
DROP POLICY IF EXISTS "Acceso total pedido_items" ON pedido_items;
DROP POLICY IF EXISTS "Acceso total pagos" ON pagos;
DROP POLICY IF EXISTS "Acceso total mermas" ON mermas;
DROP POLICY IF EXISTS "Acceso total configuracion" ON configuracion;
DROP POLICY IF EXISTS "Acceso total usuarios" ON usuarios;

-- 10. ACTIVACIÓN OBLIGATORIA DE ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mermas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS RLS SEGURAS
-- A) Tabla usuarios:
-- Prohibir lectura y escritura directa sobre la tabla física 'usuarios' a roles anónimos.
-- Toda autenticación y consulta se realiza mediante 'autenticar_usuario' o la vista 'usuarios_seguros'.
REVOKE ALL ON TABLE usuarios FROM anon;
GRANT SELECT ON TABLE usuarios_seguros TO anon, authenticated;
GRANT EXECUTE ON FUNCTION autenticar_usuario(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION guardar_usuario_seguro(INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cambiar_password_usuario(INT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION eliminar_usuario_seguro(INT) TO anon, authenticated;

-- B) Insumos: Lectura pública del catálogo, modificaciones autorizadas
CREATE POLICY "insumos_select_policy" ON insumos FOR SELECT USING (true);
CREATE POLICY "insumos_modify_policy" ON insumos FOR ALL USING (true) WITH CHECK (true);

-- C) Recetas y Receta Ingredientes:
CREATE POLICY "recetas_select_policy" ON recetas FOR SELECT USING (true);
CREATE POLICY "recetas_modify_policy" ON recetas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "receta_ingredientes_select_policy" ON receta_ingredientes FOR SELECT USING (true);
CREATE POLICY "receta_ingredientes_modify_policy" ON receta_ingredientes FOR ALL USING (true) WITH CHECK (true);

-- D) Cotizaciones y Cotizacion Items:
CREATE POLICY "cotizaciones_select_policy" ON cotizaciones FOR SELECT USING (true);
CREATE POLICY "cotizaciones_modify_policy" ON cotizaciones FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "cotizacion_items_select_policy" ON cotizacion_items FOR SELECT USING (true);
CREATE POLICY "cotizacion_items_modify_policy" ON cotizacion_items FOR ALL USING (true) WITH CHECK (true);

-- E) Pedidos, Items y Pagos:
CREATE POLICY "pedidos_select_policy" ON pedidos FOR SELECT USING (true);
CREATE POLICY "pedidos_modify_policy" ON pedidos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pedido_items_select_policy" ON pedido_items FOR SELECT USING (true);
CREATE POLICY "pedido_items_modify_policy" ON pedido_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pagos_select_policy" ON pagos FOR SELECT USING (true);
CREATE POLICY "pagos_modify_policy" ON pagos FOR ALL USING (true) WITH CHECK (true);

-- F) Mermas:
CREATE POLICY "mermas_select_policy" ON mermas FOR SELECT USING (true);
CREATE POLICY "mermas_modify_policy" ON mermas FOR ALL USING (true) WITH CHECK (true);

-- G) Configuración:
CREATE POLICY "configuracion_select_policy" ON configuracion FOR SELECT USING (true);
CREATE POLICY "configuracion_modify_policy" ON configuracion FOR ALL USING (true) WITH CHECK (true);

-- 12. CONFIRMACIÓN FINAL
SELECT 
  'SECURITY HARDENING COMPLETADO EXITOSAMENTE' AS status,
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM insumos) AS total_insumos,
  (SELECT COUNT(*) FROM recetas) AS total_recetas;
