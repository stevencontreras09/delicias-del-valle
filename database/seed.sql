-- ==============================================================================
-- DELICIAS DEL VALLE - PASTELERÍA Y PANADERÍA ARTESANAL
-- ARCHIVO MAESTRO DE SCHEMA & SEED PARA POSTGRESQL / SUPABASE
-- (Tablas limpias, 0 transacciones ficticias, catálogo maestro de 93 insumos y 53 recetas)
-- ==============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpieza de tablas (opcional para recrear en limpio)
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS pedido_items CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS cotizacion_items CASCADE;
DROP TABLE IF EXISTS cotizaciones CASCADE;
DROP TABLE IF EXISTS receta_ingredientes CASCADE;
DROP TABLE IF EXISTS recetas CASCADE;
DROP TABLE IF EXISTS mermas CASCADE;
DROP TABLE IF EXISTS insumos CASCADE;
DROP TABLE IF EXISTS configuracion_taller CASCADE;

-- ==============================================================================
-- 3. DEFINICIÓN DE TABLAS (DDL)
-- ==============================================================================

-- Tabla: Usuarios y Roles (RBAC)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(40),
  rol VARCHAR(30) NOT NULL DEFAULT 'pastelero' CHECK (rol IN ('admin', 'coadmin', 'pastelero', 'cajero', 'operador')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Insumos (Materia Prima)
CREATE TABLE insumos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  unidad_compra VARCHAR(50) NOT NULL,
  precio_compra DECIMAL(12,2) NOT NULL CHECK (precio_compra >= 0),
  presentacion_empaque DECIMAL(12,2) NOT NULL CHECK (presentacion_empaque > 0),
  unidad_base VARCHAR(10) NOT NULL CHECK (unidad_base IN ('g', 'ml', 'ud')),
  factor_conversion DECIMAL(12,4) NOT NULL CHECK (factor_conversion > 0),
  costo_unitario_base DECIMAL(12,6) NOT NULL DEFAULT 0,
  stock_actual DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Mermas y Desperdicios
CREATE TABLE mermas (
  id SERIAL PRIMARY KEY,
  insumo_id INT NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  insumo_nombre VARCHAR(150) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
  unidad_base VARCHAR(10) NOT NULL,
  motivo VARCHAR(50) NOT NULL,
  costo_perdido DECIMAL(12,2) NOT NULL CHECK (costo_perdido >= 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Recetas Maestras (BOM)
CREATE TABLE recetas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(180) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  descripcion TEXT,
  rendimiento_base DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (rendimiento_base > 0),
  rendimiento_unidad VARCHAR(60) NOT NULL DEFAULT '1 LB',
  tiempo_preparacion_min INT NOT NULL DEFAULT 30,
  tiempo_horneado_min INT NOT NULL DEFAULT 45,
  temperatura_horno_c INT DEFAULT 180,
  materiales_indirectos_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  costos_operativos_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  reposicion_equipos_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  mano_obra_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  margen_beneficio_pct DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  instrucciones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Ingredientes de Recetas (Desglose BOM Fijos y Variables)
CREATE TABLE receta_ingredientes (
  id SERIAL PRIMARY KEY,
  receta_id INT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  insumo_id INT NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(12,2) NOT NULL CHECK (cantidad > 0),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fijo', 'variable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Cotizaciones
CREATE TABLE cotizaciones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(40) NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_evento DATE,
  validez_dias INT NOT NULL DEFAULT 5,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo_envio DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notas TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Items de Cotizaciones
CREATE TABLE cotizacion_items (
  id SERIAL PRIMARY KEY,
  cotizacion_id INT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  receta_id INT REFERENCES recetas(id) ON DELETE SET NULL,
  receta_nombre VARCHAR(180) NOT NULL,
  tamano_porciones VARCHAR(100) NOT NULL,
  masa_base VARCHAR(100) NOT NULL,
  relleno VARCHAR(100) NOT NULL,
  decoracion VARCHAR(150) NOT NULL,
  dedicatoria TEXT,
  extras JSONB DEFAULT '[]'::jsonb,
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  factor_receta DECIMAL(8,3) NOT NULL DEFAULT 1.000
);

-- Tabla: Pedidos y Facturas
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cotizacion_id INT REFERENCES cotizaciones(id) ON DELETE SET NULL,
  numero_factura VARCHAR(30) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(40) NOT NULL,
  fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega DATE NOT NULL,
  hora_entrega TIME NOT NULL DEFAULT '14:00',
  tipo_entrega VARCHAR(30) NOT NULL DEFAULT 'recogida_local',
  direccion_entrega TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo_envio DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  anticipo_pagado DECIMAL(12,2) NOT NULL DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado VARCHAR(40) NOT NULL DEFAULT 'confirmado',
  checklist_completado JSONB DEFAULT '{}'::jsonb,
  inventario_descontado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Items de Pedidos
CREATE TABLE pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  receta_id INT REFERENCES recetas(id) ON DELETE SET NULL,
  receta_nombre VARCHAR(180) NOT NULL,
  tamano_porciones VARCHAR(100) NOT NULL,
  masa_base VARCHAR(100) NOT NULL,
  relleno VARCHAR(100) NOT NULL,
  decoracion VARCHAR(150) NOT NULL,
  dedicatoria TEXT,
  extras_texto TEXT,
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  factor_receta DECIMAL(8,3) NOT NULL DEFAULT 1.000
);

-- Tabla: Pagos de Pedidos (50/50 Anticipo y Saldo)
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  metodo VARCHAR(50) NOT NULL,
  referencia VARCHAR(100),
  tipo_pago VARCHAR(50) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: Configuración General del Taller
CREATE TABLE configuracion_taller (
  id SERIAL PRIMARY KEY,
  nombre_negocio VARCHAR(100) NOT NULL DEFAULT 'Delicias del Valle',
  telefono_whatsapp VARCHAR(30) NOT NULL DEFAULT '+18095550142',
  direccion_taller TEXT NOT NULL DEFAULT 'Av. Winston Churchill #105, Santo Domingo, República Dominicana',
  porcentaje_anticipo_default DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  porcentaje_indirectos_default DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  porcentaje_operativos_default DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  porcentaje_reposicion_default DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  porcentaje_mano_obra_default DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  porcentaje_margen_default DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  moneda_simbolo VARCHAR(10) NOT NULL DEFAULT 'RD$',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. TRIGGERS Y FUNCIONES EN POSTGRESQL
-- ==============================================================================

-- Función para actualizar costo unitario base automáticamente
CREATE OR REPLACE FUNCTION trg_actualizar_costo_unitario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.presentacion_empaque > 0 THEN
    NEW.costo_unitario_base := NEW.precio_compra / NEW.presentacion_empaque;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_insumos_costo ON insumos;
CREATE TRIGGER trigger_insumos_costo
BEFORE INSERT OR UPDATE ON insumos
FOR EACH ROW
EXECUTE FUNCTION trg_actualizar_costo_unitario();

-- Función Trigger para Descontar Inventario Inmediato al Confirmar Pedido
CREATE OR REPLACE FUNCTION trg_descontar_inventario_pedido()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  ing RECORD;
  cant_a_descontar DECIMAL(12,2);
BEGIN
  IF (NEW.estado IN ('confirmado', 'en_produccion', 'listo', 'entregado')) AND (NEW.inventario_descontado = FALSE) THEN
    FOR item IN SELECT * FROM pedido_items WHERE pedido_id = NEW.id LOOP
      IF item.receta_id IS NOT NULL THEN
        FOR ing IN SELECT * FROM receta_ingredientes WHERE receta_id = item.receta_id LOOP
          cant_a_descontar := ing.cantidad * item.factor_receta * item.cantidad;
          UPDATE insumos
          SET stock_actual = GREATEST(0, stock_actual - cant_a_descontar),
              updated_at = NOW()
          WHERE id = ing.insumo_id;
        END LOOP;
      END IF;
    END LOOP;
    NEW.inventario_descontado := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_descontar_inventario ON pedidos;
CREATE TRIGGER trigger_descontar_inventario
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION trg_descontar_inventario_pedido();

-- ==============================================================================
-- 5. POLÍTICAS DE ACCESO SUPABASE (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mermas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_taller ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total usuarios' AND tablename = 'usuarios') THEN
    CREATE POLICY "Acceso total usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total insumos' AND tablename = 'insumos') THEN
    CREATE POLICY "Acceso total insumos" ON insumos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total mermas' AND tablename = 'mermas') THEN
    CREATE POLICY "Acceso total mermas" ON mermas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total recetas' AND tablename = 'recetas') THEN
    CREATE POLICY "Acceso total recetas" ON recetas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total receta_ingredientes' AND tablename = 'receta_ingredientes') THEN
    CREATE POLICY "Acceso total receta_ingredientes" ON receta_ingredientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total cotizaciones' AND tablename = 'cotizaciones') THEN
    CREATE POLICY "Acceso total cotizaciones" ON cotizaciones FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total cotizacion_items' AND tablename = 'cotizacion_items') THEN
    CREATE POLICY "Acceso total cotizacion_items" ON cotizacion_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total pedidos' AND tablename = 'pedidos') THEN
    CREATE POLICY "Acceso total pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total pedido_items' AND tablename = 'pedido_items') THEN
    CREATE POLICY "Acceso total pedido_items" ON pedido_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total pagos' AND tablename = 'pagos') THEN
    CREATE POLICY "Acceso total pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Acceso total configuracion_taller' AND tablename = 'configuracion_taller') THEN
    CREATE POLICY "Acceso total configuracion_taller" ON configuracion_taller FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 6. INSERT DE DATOS INICIALES (SEED MAESTRO - NOMBRES Y CANTIDADES EXACTAS DEL EXCEL)
-- ==============================================================================

-- Usuarios
INSERT INTO usuarios (id, username, password, nombre_completo, email, telefono, rol, activo, created_at, ultimo_acceso) VALUES
(1, 'Steven9909', '@Manzana0104', 'Steven (Administrador Maestro)', 'steven@deliciasdelvalle.com', '+1 (809) 555-0142', 'admin', TRUE, '2026-08-01 08:00:00+00', '2026-08-31 17:00:00+00'),
(2, 'Rmarpa', '010203aaa', 'Rmarpa (Co-Administrador)', 'rmarpa@deliciasdelvalle.com', '+1 (809) 555-0142', 'coadmin', TRUE, '2026-08-10 08:00:00+00', '2026-08-31 18:00:00+00'),
(3, 'Vgarcia', '010203aaa', 'Vgarcia (Co-Administrador)', 'vgarcia@deliciasdelvalle.com', '+1 (809) 555-0103', 'coadmin', TRUE, '2026-09-01 14:00:00+00', '2026-09-01 14:00:00+00')
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, rol = EXCLUDED.rol;

-- Limpiar catálogo para poblar datos exactos del Excel
DELETE FROM receta_ingredientes;
DELETE FROM recetas;
DELETE FROM insumos;

-- A. INSUMOS (exactos del Excel)
INSERT INTO insumos (id, nombre, categoria, unidad_compra, precio_compra, presentacion_empaque, unidad_base, factor_conversion, costo_unitario_base, stock_actual, stock_minimo, activo) VALUES
(1, 'Mantequilla', 'Grasas', 'unidad', 457.42, 490.91, 'g', 1.0, 0.93178, 0, 100, TRUE),
(2, 'Azucar', 'Endulzantes', 'unidad', 324.8, 4410.72, 'g', 1.0, 0.073639, 0, 100, TRUE),
(3, 'Huevos', 'Lácteos y Huevos', 'unidad', 209.61, 30.0, 'ud', 1.0, 6.987, 0, 100, TRUE),
(4, 'Harina', 'Harinas', 'unidad', 174.07, 2267.96, 'g', 1.0, 0.076752, 0, 100, TRUE),
(5, 'Leche', 'Lácteos y Huevos', 'unidad', 350.59, 5529.41, 'ml', 1.0, 0.063405, 0, 100, TRUE),
(6, 'Vainilla', 'Otros', 'unidad', 100.0, 930.06, 'ml', 1.0, 0.10752, 0, 100, TRUE),
(7, 'Polvo de Hornear', 'Otros', 'unidad', 99.0, 80.0, 'g', 1.0, 1.2375, 0, 100, TRUE),
(8, 'Limon o naranja', 'Otros', 'unidad', 46.43, 1.0, 'g', 1.0, 46.43, 0, 100, TRUE),
(9, 'Cacao en polvo amarga', 'Chocolates', 'unidad', 435.0, 297.76, 'g', 1.0, 1.460908, 0, 100, TRUE),
(10, 'Bicarbonato de Sodio', 'Otros', 'unidad', 21.0, 80.0, 'g', 1.0, 0.2625, 0, 100, TRUE),
(11, 'Sal', 'Otros', 'unidad', 43.4, 500.0, 'g', 1.0, 0.0868, 0, 100, TRUE),
(12, 'yogurt', 'Lácteos y Huevos', 'unidad', 139.0, 950.0, 'g', 1.0, 0.146316, 0, 100, TRUE),
(13, 'agua', 'Otros', 'unidad', 92.5, 18920.0, 'ml', 1.0, 0.004889, 0, 100, TRUE),
(14, 'DULCE DE LECHE', 'Lácteos y Huevos', 'unidad', 351.43, 601.71, 'ml', 1.0, 0.584052, 0, 100, TRUE),
(15, 'Velvet Top', 'Otros', 'unidad', 528.57, 997.43, 'g', 1.0, 0.529932, 0, 100, TRUE),
(16, 'MERMELADA DE GUAYABA', 'Otros', 'unidad', 240.0, 997.9, 'g', 1.0, 0.240505, 0, 100, TRUE),
(17, 'MERMELADA DE FRESA', 'Otros', 'unidad', 280.0, 997.9, 'g', 1.0, 0.280589, 0, 100, TRUE),
(18, 'MERMELADA DE PINA', 'Otros', 'unidad', 275.0, 997.9, 'g', 1.0, 0.275579, 0, 100, TRUE),
(19, 'Chocolate', 'Chocolates', 'unidad', 673.33, 500.0, 'g', 1.0, 1.34666, 0, 100, TRUE),
(20, 'Crema de leche', 'Lácteos y Huevos', 'unidad', 379.0, 1000.0, 'ml', 1.0, 0.379, 0, 100, TRUE),
(21, 'Crema Bavarian', 'Lácteos y Huevos', 'unidad', 215.0, 907.18, 'ml', 1.0, 0.236998, 0, 100, TRUE),
(22, 'Crema cacao y chocolate', 'Lácteos y Huevos', 'unidad', 540.0, 1000.0, 'ml', 1.0, 0.54, 0, 100, TRUE),
(23, 'CAJA', 'Empaques', 'unidad', 62.5, 1.0, 'ud', 1.0, 62.5, 0, 100, TRUE),
(24, 'PLATO', 'Empaques', 'unidad', 75.0, 1.0, 'ud', 1.0, 75.0, 0, 100, TRUE),
(25, 'VELVET TOP CHOCOLATE', 'Chocolates', 'unidad', 650.0, 1000.0, 'g', 1.0, 0.65, 0, 100, TRUE),
(26, 'crema de cacao y avellanas', 'Lácteos y Huevos', 'unidad', 540.0, 1000.0, 'ml', 1.0, 0.54, 0, 100, TRUE),
(27, 'crema de cacao y avellanas reen', 'Lácteos y Huevos', 'unidad', 540.0, 1000.0, 'ml', 1.0, 0.54, 0, 100, TRUE),
(28, 'HARINA (2 TAZAS)', 'Harinas', 'unidad', 175.0, 2267.96, 'g', 1.0, 0.077162, 0, 100, TRUE),
(29, 'AZUCAR ( 1 3/4 TAZA)', 'Endulzantes', 'unidad', 335.0, 4500.0, 'g', 1.0, 0.074444, 0, 100, TRUE),
(30, 'VAINILLA (1 CDA.)', 'Otros', 'unidad', 105.0, 946.0, 'ml', 1.0, 0.110994, 0, 100, TRUE),
(31, 'Cacao en polvo', 'Chocolates', 'unidad', 559.95, 453.52, 'g', 1.0, 1.234675, 0, 100, TRUE),
(32, 'Capacillo', 'Empaques', 'unidad', 159.75, 111.25, 'ud', 1.0, 1.435955, 0, 100, TRUE),
(33, 'Capacillo cuadrado', 'Empaques', 'unidad', 18.0, 350.0, 'ud', 1.0, 0.051429, 0, 100, TRUE),
(34, 'Polvo leudante', 'Otros', 'unidad', 99.0, 80.0, 'g', 1.0, 1.2375, 0, 100, TRUE),
(35, 'Pizca de sal fina', 'Otros', 'unidad', 40.67, 500.0, 'g', 1.0, 0.08134, 0, 100, TRUE),
(36, 'Velvet top Vainilla', 'Otros', 'unidad', 520.0, 997.0, 'ml', 1.0, 0.521565, 0, 100, TRUE),
(37, 'envase transparente x 10', 'Empaques', 'unidad', 235.0, 10.0, 'ud', 1.0, 23.5, 0, 100, TRUE),
(38, 'capacillo metalizado', 'Empaques', 'unidad', 210.0, 100.0, 'ud', 1.0, 2.1, 0, 100, TRUE),
(39, 'envase transparente x 6', 'Empaques', 'unidad', 235.0, 10.0, 'ud', 1.0, 23.5, 0, 100, TRUE),
(40, 'RELLENO FRESA', 'Otros', 'unidad', 280.0, 997.9, 'g', 1.0, 0.280589, 0, 100, TRUE),
(41, 'Suspiro', 'Otros', 'unidad', 520.0, 997.0, 'g', 1.0, 0.521565, 0, 100, TRUE),
(42, 'Velve top de Chocolate', 'Chocolates', 'unidad', 650.0, 997.0, 'g', 1.0, 0.651956, 0, 100, TRUE),
(43, 'Cacao', 'Chocolates', 'unidad', 435.0, 453.55, 'g', 1.0, 0.9591, 0, 100, TRUE),
(44, 'Cafe', 'Otros', 'unidad', 25.0, 25.0, 'g', 1.0, 1.0, 0, 100, TRUE),
(45, 'Aceite canola o maiz', 'Otros', 'unidad', 449.0, 1420.0, 'ml', 1.0, 0.316197, 0, 100, TRUE),
(46, 'Velve top de Vainilla', 'Otros', 'unidad', 520.0, 997.0, 'ml', 1.0, 0.521565, 0, 100, TRUE),
(47, 'azucar pulverizada', 'Endulzantes', 'unidad', 165.0, 453.52, 'g', 1.0, 0.363821, 0, 100, TRUE),
(48, 'huevo', 'Lácteos y Huevos', 'unidad', 209.87, 30.0, 'ud', 1.0, 6.995667, 0, 100, TRUE),
(49, 'pizca de sal', 'Otros', 'unidad', 44.0, 500.0, 'g', 1.0, 0.088, 0, 100, TRUE),
(50, 'Harina de Trigo', 'Harinas', 'unidad', 175.0, 2267.96, 'g', 1.0, 0.077162, 0, 100, TRUE),
(51, 'Limon', 'Otros', 'unidad', 20.0, 1.0, 'g', 1.0, 20.0, 0, 100, TRUE),
(52, 'VARIOS', 'Otros', 'unidad', 1.0, 1.0, 'g', 1.0, 1.0, 0, 100, TRUE),
(53, 'ROYAL ICING MIX', 'Otros', 'unidad', 215.0, 400.0, 'g', 1.0, 0.5375, 0, 100, TRUE),
(54, 'FONDANT', 'Otros', 'unidad', 390.0, 454.0, 'g', 1.0, 0.859031, 0, 100, TRUE),
(55, 'IMPRESION', 'Otros', 'unidad', 235.0, 1.0, 'g', 1.0, 235.0, 0, 100, TRUE),
(56, 'CMC', 'Otros', 'unidad', 120.0, 120.0, 'g', 1.0, 1.0, 0, 100, TRUE),
(57, 'Crema cacao', 'Lácteos y Huevos', 'unidad', 190.0, 200.0, 'ml', 1.0, 0.95, 0, 100, TRUE),
(58, 'Chocolate sucedaneo, negro o blanco', 'Chocolates', 'unidad', 270.0, 453.59, 'g', 1.0, 0.595251, 0, 100, TRUE),
(59, 'Mermelada', 'Otros', 'unidad', 149.0, 350.0, 'g', 1.0, 0.425714, 0, 100, TRUE),
(60, 'Mantequilla ( 1 1/2 barra)', 'Grasas', 'unidad', 460.0, 460.0, 'g', 1.0, 1.0, 0, 100, TRUE),
(61, 'Harina (1 taza)', 'Harinas', 'unidad', 175.0, 2267.96, 'g', 1.0, 0.077162, 0, 100, TRUE),
(62, 'Maicena', 'Harinas', 'unidad', 99.0, 425.0, 'g', 1.0, 0.232941, 0, 100, TRUE),
(63, 'Azucar Pulverizada ( 3cdas)', 'Endulzantes', 'unidad', 165.0, 453.52, 'g', 1.0, 0.363821, 0, 100, TRUE),
(64, 'COCO', 'Otros', 'unidad', 175.0, 205.0, 'g', 1.0, 0.853659, 0, 100, TRUE),
(65, 'MERMELADA GUAYABA', 'Otros', 'unidad', 240.0, 997.9, 'g', 1.0, 0.240505, 0, 100, TRUE),
(66, 'HARINA panaderia', 'Harinas', 'unidad', 250.0, 2267.32, 'g', 1.0, 0.110262, 0, 100, TRUE),
(67, 'levadura seca', 'Otros', 'unidad', 220.0, 500.0, 'g', 1.0, 0.44, 0, 100, TRUE),
(68, 'jamon', 'Otros', 'unidad', 305.0, 453.59, 'g', 1.0, 0.672413, 0, 100, TRUE),
(69, 'tocineta', 'Otros', 'unidad', 341.5, 249.84, 'g', 1.0, 1.366875, 0, 100, TRUE),
(70, 'aceituna', 'Otros', 'unidad', 249.0, 1000.0, 'g', 1.0, 0.249, 0, 100, TRUE),
(71, 'pasas', 'Otros', 'unidad', 119.0, 250.0, 'g', 1.0, 0.476, 0, 100, TRUE),
(72, 'Papel celofan', 'Empaques', 'unidad', 20.0, 1.0, 'ud', 1.0, 20.0, 0, 100, TRUE),
(73, 'Sticker', 'Otros', 'unidad', 5.0, 1.0, 'g', 1.0, 5.0, 0, 100, TRUE),
(74, 'Papel de horno', 'Empaques', 'unidad', 188.0, 7475.47, 'ud', 1.0, 0.025149, 0, 100, TRUE),
(75, 'QUESO CREMA', 'Lácteos y Huevos', 'unidad', 149.0, 226.79, 'ml', 1.0, 0.656995, 0, 100, TRUE),
(76, 'MASA DE HOJALDRE', 'Otros', 'unidad', 500.0, 2.0, 'g', 1.0, 250.0, 0, 100, TRUE),
(77, 'Papel encerado', 'Empaques', 'unidad', 249.0, 9966.96, 'ud', 1.0, 0.024983, 0, 100, TRUE),
(78, 'envase', 'Empaques', 'unidad', 96.92, 7.17, 'ud', 1.0, 13.517434, 0, 100, TRUE),
(79, 'Leche Condensada', 'Lácteos y Huevos', 'unidad', 121.86, 403.0, 'ml', 1.0, 0.302382, 0, 100, TRUE),
(80, 'Ron', 'Otros', 'unidad', 595.0, 700.0, 'ml', 1.0, 0.85, 0, 100, TRUE),
(81, 'Azucar (para caramelo)', 'Endulzantes', 'unidad', 320.0, 4500.0, 'g', 1.0, 0.071111, 0, 100, TRUE),
(82, 'Cerezas marrasquinos', 'Otros', 'unidad', 129.0, 20.0, 'ud', 1.0, 6.45, 0, 100, TRUE),
(83, 'Cucharitas', 'Otros', 'unidad', 155.0, 48.0, 'ud', 1.0, 3.229167, 0, 100, TRUE),
(84, 'Envases de Shot cuadrado', 'Empaques', 'unidad', 160.0, 12.0, 'ud', 1.0, 13.333333, 0, 100, TRUE),
(85, 'Envases de aluminios', 'Empaques', 'unidad', 165.0, 10.0, 'ud', 1.0, 16.5, 0, 100, TRUE),
(86, 'Bizcocho', 'Otros', 'unidad', 60.0, 1.0, 'g', 1.0, 60.0, 0, 100, TRUE),
(87, 'Leche Evaporada (lata)', 'Lácteos y Huevos', 'unidad', 67.0, 312.0, 'ml', 1.0, 0.214744, 0, 100, TRUE),
(88, 'Crema de Leche (bravo)', 'Lácteos y Huevos', 'unidad', 64.0, 200.0, 'ml', 1.0, 0.32, 0, 100, TRUE),
(89, 'Topping Crema', 'Lácteos y Huevos', 'unidad', 603.33, 937.0, 'ml', 1.0, 0.643895, 0, 100, TRUE),
(90, 'Vasos Shot (2oz)', 'Otros', 'unidad', 255.0, 50.0, 'g', 1.0, 5.1, 0, 100, TRUE),
(91, 'Crema de Coco', 'Lácteos y Huevos', 'unidad', 179.0, 425.0, 'ml', 1.0, 0.421176, 0, 100, TRUE),
(92, 'Leche de coco', 'Lácteos y Huevos', 'unidad', 144.0, 444.0, 'ml', 1.0, 0.324324, 0, 100, TRUE),
(93, 'Leche evaporada', 'Lácteos y Huevos', 'unidad', 66.0, 297.0, 'ml', 1.0, 0.222222, 0, 100, TRUE),
(94, 'Salchichas', 'Otros', 'unidad', 209.0, 589.0, 'g', 1.0, 0.354839, 0, 100, TRUE),
(95, 'Mayonesa', 'Otros', 'unidad', 149.0, 425.0, 'g', 1.0, 0.350588, 0, 100, TRUE),
(96, 'Ajo', 'Otros', 'unidad', 46.0, 4.0, 'g', 1.0, 11.5, 0, 100, TRUE),
(97, 'Cilantro', 'Otros', 'unidad', 34.0, 1.0, 'g', 1.0, 34.0, 0, 100, TRUE),
(98, 'Empaque', 'Otros', 'unidad', 25.0, 1.0, 'g', 1.0, 25.0, 0, 100, TRUE),
(99, 'Envase de salsa', 'Empaques', 'unidad', 5.0, 1.0, 'ud', 1.0, 5.0, 0, 100, TRUE),
(100, 'Palillos', 'Otros', 'unidad', 20.0, 206.0, 'g', 1.0, 0.097087, 0, 100, TRUE),
(101, 'PASTA DE GUAYABA', 'Otros', 'unidad', 109.0, 396.89, 'g', 1.0, 0.274635, 0, 100, TRUE),
(102, 'Nueces', 'Otros', 'unidad', 900.0, 1130.0, 'g', 1.0, 0.79646, 0, 100, TRUE),
(103, 'CAPACILLOS PEQUENOS', 'Empaques', 'unidad', 105.0, 100.0, 'ud', 1.0, 1.05, 0, 100, TRUE),
(104, 'Miel', 'Endulzantes', 'unidad', 199.0, 453.0, 'g', 1.0, 0.439294, 0, 100, TRUE),
(105, 'Hojaldritoa', 'Otros', 'unidad', 500.0, 2.0, 'g', 1.0, 250.0, 0, 100, TRUE),
(106, 'JAMON DE PAVO', 'Otros', 'unidad', 359.0, 453.52, 'g', 1.0, 0.791586, 0, 100, TRUE);

SELECT setval('insumos_id_seq', 106);

-- B. RECETAS (nombres y rendimientos exactos del Excel, se mantienen duplicados)
INSERT INTO recetas (id, nombre, categoria, descripcion, rendimiento_base, rendimiento_unidad, tiempo_preparacion_min, tiempo_horneado_min, temperatura_horno_c, materiales_indirectos_pct, costos_operativos_pct, reposicion_equipos_pct, mano_obra_pct, margen_beneficio_pct, activa) VALUES
(1, 'TORTA DE VAINILLA', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(2, 'TORTA DE VAINILLA', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(3, 'TORTA DE VAINILLA', 'Tortas', NULL, 0.5, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(4, 'TORTA DE CHCATE', 'Tortas', NULL, 1.0, 'B', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(5, 'TORTA DE CHCATE', 'Tortas', NULL, 0.5, 'b', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(6, 'SUSPIRO PARA TORTA', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(7, 'TORTA DE VAINILLA SENCILLA/SENCILLA/DULCE DE LECHE', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(8, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Guayaba', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(9, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Fresa', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(10, 'TORTA DE VAINILLA SENCILLA/SENCILLA/MERM PINA', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(11, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Ganac Chocolate', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(12, 'TORTA DE VAINILLA SENCILLA - Crema pastelera (Bavarian)', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(13, 'TORTA DE VAINILLA SENCILLA - CREMA CACA Y NUECES', 'Tortas', NULL, 0.5, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(14, 'TORTA DE VAINILLA SENCILLA/SENCILLA/DULCE DE LECHE', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(15, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Guayaba', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(16, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Merm Fresa', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(17, 'TORTA DE VAINILLA SENCILLA/SENCILLA/MERM PINA', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(18, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Ganac Chocolate', 'Tortas', NULL, 8.0, ')', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(19, 'TORTA DE VAINILLA SENCILLA/SENCILLA/Crema pastelera (Bavarian)', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(20, 'TORTA DE CHOCOLATE/CUBIERTA GANACHE/DULCE LECHE', 'Tortas', NULL, 8.0, 'TROZOS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(21, 'TORTA DE CHOCOLATE/CREMA CHOCOLATE/DULCE LECHE', 'Tortas', NULL, 0.5, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(22, 'TORTA DE CHOCOLATE/CREMA CHOCOLATE/NUTELLA', 'Tortas', NULL, 8.0, 'TROZOS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(23, 'TORTA DE CHOCOLATE/GANACHE DE CHOCOLATE /nutella', 'Tortas', NULL, 8.0, 'TROZOS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(24, 'BROWNIE', 'Brownies', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(25, 'BROWNIE CON DULCE DE LECHE', 'Brownies', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(26, 'BROWNIE EN FUNDA EN TROZOS', 'Brownies', NULL, 18.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(27, 'CUPCAKE', 'Cupcakes', NULL, 22.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(28, 'CUPCAKE DECORADOS VELVET TOP', 'Cupcakes', NULL, 22.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(29, 'CUPCAKE DECORADOS DE VAINILLA RELLENOS FRESA/ VELVEL TOP', 'Cupcakes', NULL, 22.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(30, 'CUPCAKE DECORADOS DE VAINILLA RELLENOS DULCE LECHE/ VELVEL TOP', 'Cupcakes', NULL, 22.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(31, 'CUPCAKE DECORADOS DE VAINILLA VELVET TOP DE CHOCOLATE', 'Cupcakes', NULL, 22.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(32, 'CUPCAKE DECORADOS DE chocolate VELVET TOP DE Vainilla', 'Cupcakes', NULL, 12.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(33, 'PASTA SECA', 'Galletas', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(34, 'GALLETAS DE MANTEQUILLA PARA DECORAR Royal Icing', 'Galletas', NULL, 36.0, 'MEDIANAS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(35, 'GALLETAS DE MANTEQUILLA PARA DECORAR Fondant', 'Galletas', NULL, 36.0, 'MEDIANAS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(36, 'GALLETAS DE MANTEQUILLA con nutella y chocolate', 'Galletas', NULL, 30.0, 'MEDIANAS', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(37, 'GALLETAS DE FORMAS DECORADAS', 'Galletas', NULL, 80.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(38, 'GALLETAS LUNETTE VAINILLA', 'Galletas', NULL, 13.0, 'PAR DE 2,5''', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(39, 'GALLETAS LUNETTE CHOCOLATE', 'Galletas', NULL, 13.0, 'PAR DE 2,5''', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(40, 'ALFAJOR CON DULCE DE LECHE', 'Alfajores', NULL, 18.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(41, 'ALFAJOR CON MERMELADA GUAYABA', 'Alfajores', NULL, 18.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(42, 'PAN DE JAMON', 'Panes y Salados', NULL, 2.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(43, 'PAN DE JAMON CON QUESO CREMA', 'Panes y Salados', NULL, 2.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(44, 'PAN DE JAMON DE HOJALDRE', 'Panes y Salados', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(45, 'CACHITO', 'Panes y Salados', NULL, 16.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(46, 'QUESILLO', 'Postres', NULL, 1.0, 'COMPLETO', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(47, 'QUESILLO', 'Postres', NULL, 14.0, 'porciones cortadas', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(48, 'QUESILLO', 'Postres', NULL, 12.0, 'porciones cortadas', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(49, 'BIZCOCHO', 'Tortas', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(50, 'TRES LECHE MEDIANO', 'Tres Leches', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(51, 'TRES LECHE SHOTS', 'Tres Leches', NULL, 12.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(52, 'TRES LECHES DE COCO', 'Tres Leches', NULL, 12.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(53, 'TORTA DE VAINILLA', 'Tortas', NULL, 1.0, 'LB', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(54, 'SUSPIRITOS', 'Galletas', NULL, 24.0, 'MINIMO', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(55, 'Marquesa de limon', 'Postres', NULL, 1.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(56, 'DEDITOS DE NOVIA', 'Galletas', NULL, 42.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(57, 'Polvorones', 'Galletas', NULL, 45.0, '- de 15Grm', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(58, 'Polvorones', 'Galletas', NULL, 65.0, '- de 10Grm', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(59, 'BESITOS DE NUEZ', 'Galletas', NULL, 46.0, '- de 16Grm', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE),
(60, 'TAQUITOS DE HOJALDRE', 'Panes y Salados', NULL, 50.0, 'unidad', 30, 45, 180, 10.00, 15.00, 10.00, 30.00, 50.00, TRUE);

SELECT setval('recetas_id_seq', 60);

-- C. RECETA_INGREDIENTES (cantidades exactas del Excel)
INSERT INTO receta_ingredientes (receta_id, insumo_id, cantidad, tipo) VALUES
(1, 1, 450.0, 'fijo'),
(1, 2, 660.0, 'fijo'),
(1, 3, 8.0, 'fijo'),
(1, 4, 500.0, 'fijo'),
(1, 5, 200.0, 'fijo'),
(1, 6, 40.0, 'fijo'),
(1, 7, 15.0, 'fijo'),
(1, 8, 1.0, 'fijo'),
(2, 1, 450.0, 'fijo'),
(2, 2, 660.0, 'fijo'),
(2, 3, 8.0, 'fijo'),
(2, 4, 500.0, 'fijo'),
(2, 5, 200.0, 'fijo'),
(2, 6, 40.0, 'fijo'),
(2, 7, 15.0, 'fijo'),
(2, 8, 1.0, 'fijo'),
(3, 1, 225.0, 'fijo'),
(3, 2, 440.0, 'fijo'),
(3, 3, 6.0, 'fijo'),
(3, 4, 375.0, 'fijo'),
(3, 5, 150.0, 'fijo'),
(3, 6, 30.0, 'fijo'),
(3, 7, 11.0, 'fijo'),
(3, 8, 1.0, 'fijo'),
(4, 1, 200.0, 'fijo'),
(4, 3, 4.0, 'fijo'),
(4, 4, 350.0, 'fijo'),
(4, 9, 100.0, 'fijo'),
(4, 6, 20.0, 'fijo'),
(4, 10, 10.0, 'fijo'),
(4, 11, 3.0, 'fijo'),
(4, 12, 375.0, 'fijo'),
(5, 1, 100.0, 'fijo'),
(5, 2, 175.0, 'fijo'),
(5, 3, 2.0, 'fijo'),
(5, 4, 175.0, 'fijo'),
(5, 9, 50.0, 'fijo'),
(5, 6, 20.0, 'fijo'),
(5, 10, 5.0, 'fijo'),
(5, 11, 3.0, 'fijo'),
(5, 12, 187.5, 'fijo'),
(6, 3, 8.0, 'fijo'),
(6, 2, 500.0, 'fijo'),
(6, 13, 25.0, 'fijo'),
(6, 6, 480.0, 'fijo'),
(6, 11, 3.0, 'fijo'),
(7, 14, 350.0, 'variable'),
(7, 15, 500.0, 'variable'),
(8, 16, 300.0, 'variable'),
(8, 15, 400.0, 'variable'),
(9, 17, 300.0, 'variable'),
(9, 15, 400.0, 'variable'),
(10, 18, 300.0, 'variable'),
(10, 15, 400.0, 'variable'),
(11, 19, 300.0, 'variable'),
(11, 20, 500.0, 'variable'),
(11, 15, 400.0, 'variable'),
(12, 21, 315.0, 'variable'),
(12, 15, 400.0, 'variable'),
(13, 22, 350.0, 'variable'),
(13, 15, 400.0, 'variable'),
(14, 14, 400.0, 'variable'),
(15, 1, 450.0, 'fijo'),
(15, 2, 660.0, 'fijo'),
(15, 3, 8.0, 'fijo'),
(15, 4, 480.0, 'fijo'),
(15, 5, 192.0, 'fijo'),
(15, 6, 40.0, 'fijo'),
(15, 7, 15.0, 'fijo'),
(15, 8, 1.0, 'fijo'),
(15, 16, 300.0, 'variable'),
(16, 1, 450.0, 'fijo'),
(16, 2, 660.0, 'fijo'),
(16, 3, 8.0, 'fijo'),
(16, 4, 480.0, 'fijo'),
(16, 5, 192.0, 'fijo'),
(16, 6, 40.0, 'fijo'),
(16, 7, 15.0, 'fijo'),
(16, 8, 1.0, 'fijo'),
(16, 17, 300.0, 'variable'),
(17, 1, 450.0, 'fijo'),
(17, 2, 660.0, 'fijo'),
(17, 3, 8.0, 'fijo'),
(17, 4, 480.0, 'fijo'),
(17, 5, 192.0, 'fijo'),
(17, 6, 40.0, 'fijo'),
(17, 7, 15.0, 'fijo'),
(17, 8, 1.0, 'fijo'),
(17, 18, 300.0, 'variable'),
(18, 1, 450.0, 'fijo'),
(18, 2, 660.0, 'fijo'),
(18, 3, 8.0, 'fijo'),
(18, 4, 480.0, 'fijo'),
(18, 5, 192.0, 'fijo'),
(18, 6, 40.0, 'fijo'),
(18, 7, 15.0, 'fijo'),
(18, 8, 1.0, 'fijo'),
(18, 19, 300.0, 'variable'),
(18, 20, 500.0, 'variable'),
(19, 1, 450.0, 'fijo'),
(19, 2, 660.0, 'fijo'),
(19, 3, 8.0, 'fijo'),
(19, 4, 480.0, 'fijo'),
(19, 5, 192.0, 'fijo'),
(19, 6, 40.0, 'fijo'),
(19, 7, 15.0, 'fijo'),
(19, 8, 1.0, 'fijo'),
(19, 19, 300.0, 'variable'),
(19, 20, 500.0, 'variable'),
(20, 14, 350.0, 'variable'),
(20, 19, 350.0, 'variable'),
(20, 20, 600.0, 'variable'),
(20, 23, 1.0, 'variable'),
(20, 24, 1.0, 'variable'),
(21, 14, 400.0, 'variable'),
(21, 25, 400.0, 'variable'),
(21, 23, 1.0, 'variable'),
(21, 24, 1.0, 'variable'),
(22, 26, 400.0, 'variable'),
(22, 25, 400.0, 'variable'),
(22, 23, 1.0, 'variable'),
(22, 24, 1.0, 'variable'),
(23, 27, 400.0, 'variable'),
(23, 19, 350.0, 'variable'),
(23, 20, 600.0, 'variable'),
(23, 24, 1.0, 'variable'),
(23, 23, 1.0, 'variable'),
(24, 28, 300.0, 'fijo'),
(24, 29, 385.0, 'fijo'),
(24, 3, 4.0, 'fijo'),
(24, 1, 200.0, 'fijo'),
(24, 19, 250.0, 'fijo'),
(24, 30, 15.0, 'fijo'),
(24, 11, 3.0, 'fijo'),
(24, 31, 10.0, 'fijo'),
(25, 14, 80.0, 'variable'),
(25, 23, 1.0, 'variable'),
(25, 32, 18.0, 'variable'),
(26, 33, 18.0, 'variable'),
(27, 1, 240.0, 'fijo'),
(27, 2, 240.0, 'fijo'),
(27, 3, 4.0, 'fijo'),
(27, 4, 350.0, 'fijo'),
(27, 34, 5.0, 'fijo'),
(27, 6, 30.0, 'fijo'),
(27, 35, 2.0, 'fijo'),
(27, 8, 1.0, 'fijo'),
(27, 32, 22.0, 'variable'),
(27, 23, 3.0, 'variable'),
(28, 1, 240.0, 'fijo'),
(28, 2, 240.0, 'fijo'),
(28, 3, 4.0, 'fijo'),
(28, 4, 350.0, 'fijo'),
(28, 34, 5.0, 'fijo'),
(28, 6, 30.0, 'fijo'),
(28, 35, 2.0, 'fijo'),
(28, 8, 1.0, 'fijo'),
(28, 32, 1.0, 'variable'),
(28, 36, 250.0, 'variable'),
(28, 37, 4.0, 'variable'),
(29, 1, 240.0, 'fijo'),
(29, 2, 240.0, 'fijo'),
(29, 3, 4.0, 'fijo'),
(29, 4, 350.0, 'fijo'),
(29, 34, 5.0, 'fijo'),
(29, 6, 30.0, 'fijo'),
(29, 35, 2.0, 'fijo'),
(29, 8, 1.0, 'fijo'),
(29, 38, 1.0, 'variable'),
(29, 36, 250.0, 'variable'),
(29, 39, 4.0, 'variable'),
(29, 40, 50.0, 'variable'),
(30, 1, 240.0, 'fijo'),
(30, 2, 240.0, 'fijo'),
(30, 3, 4.0, 'fijo'),
(30, 4, 350.0, 'fijo'),
(30, 34, 5.0, 'fijo'),
(30, 6, 30.0, 'fijo'),
(30, 35, 2.0, 'fijo'),
(30, 8, 1.0, 'fijo'),
(30, 38, 1.0, 'variable'),
(30, 41, 300.0, 'variable'),
(30, 39, 4.0, 'variable'),
(30, 14, 50.0, 'variable'),
(31, 1, 240.0, 'fijo'),
(31, 2, 240.0, 'fijo'),
(31, 3, 4.0, 'fijo'),
(31, 4, 350.0, 'fijo'),
(31, 34, 5.0, 'fijo'),
(31, 6, 30.0, 'fijo'),
(31, 35, 2.0, 'fijo'),
(31, 8, 1.0, 'fijo'),
(31, 32, 1.0, 'variable'),
(31, 42, 300.0, 'variable'),
(31, 39, 2.0, 'variable'),
(32, 2, 220.0, 'fijo'),
(32, 3, 2.0, 'fijo'),
(32, 4, 150.0, 'fijo'),
(32, 34, 10.0, 'fijo'),
(32, 35, 2.0, 'fijo'),
(32, 43, 50.0, 'fijo'),
(32, 44, 25.0, 'fijo'),
(32, 45, 125.0, 'fijo'),
(32, 5, 125.0, 'fijo'),
(32, 32, 1.0, 'variable'),
(32, 46, 300.0, 'variable'),
(32, 39, 2.0, 'variable'),
(33, 1, 250.0, 'fijo'),
(33, 47, 100.0, 'fijo'),
(33, 48, 1.0, 'fijo'),
(33, 49, 2.0, 'fijo'),
(33, 7, 5.0, 'fijo'),
(33, 6, 15.0, 'fijo'),
(33, 50, 300.0, 'fijo'),
(33, 51, 1.0, 'fijo'),
(33, 52, 100.0, 'variable'),
(33, 24, 1.0, 'variable'),
(34, 1, 175.0, 'fijo'),
(34, 47, 225.0, 'fijo'),
(34, 48, 1.0, 'fijo'),
(34, 6, 30.0, 'fijo'),
(34, 51, 1.0, 'fijo'),
(34, 11, 3.0, 'fijo'),
(34, 4, 438.0, 'fijo'),
(34, 53, 250.0, 'variable'),
(35, 1, 175.0, 'fijo'),
(35, 47, 225.0, 'fijo'),
(35, 48, 1.0, 'fijo'),
(35, 6, 30.0, 'fijo'),
(35, 51, 1.0, 'fijo'),
(35, 11, 3.0, 'fijo'),
(35, 4, 438.0, 'fijo'),
(35, 54, 150.0, 'variable'),
(35, 55, 1.0, 'variable'),
(35, 56, 10.0, 'variable'),
(36, 1, 175.0, 'fijo'),
(36, 47, 225.0, 'fijo'),
(36, 48, 1.0, 'fijo'),
(36, 6, 30.0, 'fijo'),
(36, 51, 1.0, 'fijo'),
(36, 11, 3.0, 'fijo'),
(36, 4, 438.0, 'fijo'),
(36, 57, 50.0, 'variable'),
(36, 58, 50.0, 'variable'),
(37, 1, 165.0, 'fijo'),
(37, 2, 120.0, 'fijo'),
(37, 48, 1.0, 'fijo'),
(37, 6, 3.0, 'fijo'),
(37, 4, 262.0, 'fijo'),
(37, 5, 16.0, 'fijo'),
(37, 7, 3.0, 'fijo'),
(38, 1, 150.0, 'fijo'),
(38, 47, 100.0, 'fijo'),
(38, 48, 1.0, 'fijo'),
(38, 6, 15.0, 'fijo'),
(38, 4, 300.0, 'fijo'),
(38, 11, 2.0, 'fijo'),
(38, 59, 30.0, 'variable'),
(38, 47, 50.0, 'variable'),
(39, 1, 150.0, 'fijo'),
(39, 47, 100.0, 'fijo'),
(39, 48, 1.0, 'fijo'),
(39, 6, 15.0, 'fijo'),
(39, 4, 250.0, 'fijo'),
(39, 11, 2.0, 'fijo'),
(39, 43, 30.0, 'fijo'),
(39, 59, 30.0, 'variable'),
(39, 47, 50.0, 'variable'),
(40, 60, 150.0, 'fijo'),
(40, 61, 110.0, 'fijo'),
(40, 62, 100.0, 'fijo'),
(40, 30, 15.0, 'fijo'),
(40, 14, 150.0, 'variable'),
(40, 47, 30.0, 'variable'),
(40, 32, 1.0, 'variable'),
(40, 64, 40.0, 'variable'),
(41, 60, 150.0, 'fijo'),
(41, 61, 110.0, 'fijo'),
(41, 62, 100.0, 'fijo'),
(41, 30, 15.0, 'fijo'),
(41, 65, 250.0, 'variable'),
(41, 47, 30.0, 'variable'),
(41, 32, 1.0, 'variable'),
(42, 66, 500.0, 'fijo'),
(42, 48, 2.0, 'fijo'),
(42, 67, 7.0, 'fijo'),
(42, 5, 260.0, 'fijo'),
(42, 1, 80.0, 'fijo'),
(42, 2, 110.0, 'fijo'),
(42, 11, 5.0, 'fijo'),
(42, 68, 800.0, 'variable'),
(42, 69, 150.0, 'variable'),
(42, 70, 100.0, 'variable'),
(42, 71, 60.0, 'variable'),
(42, 1, 10.0, 'variable'),
(42, 48, 1.0, 'variable'),
(42, 72, 1.0, 'variable'),
(42, 73, 1.0, 'variable'),
(42, 74, 30.0, 'variable'),
(43, 66, 500.0, 'fijo'),
(43, 48, 2.0, 'fijo'),
(43, 67, 7.0, 'fijo'),
(43, 5, 260.0, 'fijo'),
(43, 1, 80.0, 'fijo'),
(43, 2, 110.0, 'fijo'),
(43, 11, 5.0, 'fijo'),
(43, 68, 800.0, 'variable'),
(43, 69, 150.0, 'variable'),
(43, 70, 120.0, 'variable'),
(43, 71, 60.0, 'variable'),
(43, 1, 10.0, 'variable'),
(43, 48, 1.0, 'variable'),
(43, 72, 1.0, 'variable'),
(43, 73, 1.0, 'variable'),
(43, 75, 100.0, 'variable'),
(43, 74, 30.0, 'variable'),
(44, 76, 1.0, 'fijo'),
(44, 68, 400.0, 'variable'),
(44, 69, 80.0, 'variable'),
(44, 70, 60.0, 'variable'),
(44, 71, 40.0, 'variable'),
(44, 48, 1.0, 'variable'),
(44, 72, 1.0, 'variable'),
(44, 73, 1.0, 'variable'),
(44, 74, 30.0, 'variable'),
(45, 66, 630.0, 'fijo'),
(45, 48, 3.0, 'fijo'),
(45, 67, 8.0, 'fijo'),
(45, 5, 245.0, 'fijo'),
(45, 1, 105.0, 'fijo'),
(45, 2, 100.0, 'fijo'),
(45, 11, 7.0, 'fijo'),
(45, 13, 60.0, 'fijo'),
(45, 68, 500.0, 'variable'),
(45, 69, 250.0, 'variable'),
(45, 77, 20.0, 'variable'),
(45, 78, 1.0, 'variable'),
(46, 79, 403.0, 'fijo'),
(46, 3, 6.0, 'fijo'),
(46, 5, 403.0, 'fijo'),
(46, 6, 15.0, 'fijo'),
(46, 80, 5.0, 'fijo'),
(46, 81, 100.0, 'fijo'),
(46, 82, 6.0, 'variable'),
(46, 78, 1.0, 'variable'),
(47, 79, 403.0, 'fijo'),
(47, 3, 6.0, 'fijo'),
(47, 5, 403.0, 'fijo'),
(47, 6, 15.0, 'fijo'),
(47, 80, 5.0, 'fijo'),
(47, 2, 100.0, 'variable'),
(47, 82, 6.0, 'variable'),
(47, 83, 12.0, 'variable'),
(47, 84, 12.0, 'variable'),
(48, 79, 403.0, 'fijo'),
(48, 3, 6.0, 'fijo'),
(48, 5, 403.0, 'fijo'),
(48, 6, 15.0, 'fijo'),
(48, 80, 5.0, 'fijo'),
(48, 2, 100.0, 'variable'),
(48, 85, 12.0, 'variable'),
(49, 3, 5.0, 'fijo'),
(49, 6, 15.0, 'fijo'),
(49, 4, 120.0, 'fijo'),
(49, 64, 30.0, 'fijo'),
(50, 86, 1.0, 'fijo'),
(50, 79, 403.0, 'fijo'),
(50, 87, 312.0, 'fijo'),
(50, 78, 1.0, 'variable'),
(50, 89, 250.0, 'variable'),
(51, 86, 1.0, 'fijo'),
(51, 79, 403.0, 'fijo'),
(51, 87, 312.0, 'fijo'),
(51, 89, 200.0, 'variable'),
(51, 83, 12.0, 'variable'),
(51, 90, 12.0, 'variable'),
(52, 86, 1.0, 'fijo'),
(52, 79, 403.0, 'fijo'),
(52, 91, 425.0, 'fijo'),
(52, 92, 444.0, 'fijo'),
(52, 93, 297.0, 'fijo'),
(52, 89, 150.0, 'variable'),
(52, 78, 12.0, 'variable'),
(53, 94, 453.59, 'fijo'),
(53, 95, 200.0, 'fijo'),
(53, 96, 0.5, 'fijo'),
(53, 11, 3.0, 'fijo'),
(53, 97, 0.25, 'fijo'),
(53, 98, 1.0, 'variable'),
(53, 99, 2.0, 'variable'),
(53, 100, 100.0, 'variable'),
(54, 2, 200.0, 'fijo'),
(54, 3, 4.0, 'fijo'),
(54, 6, 10.0, 'fijo'),
(54, 98, 1.0, 'variable'),
(55, 79, 403.0, 'fijo'),
(55, 82, 6.0, 'variable'),
(55, 78, 1.0, 'variable'),
(56, 1, 100.0, 'fijo'),
(56, 4, 227.0, 'fijo'),
(56, 7, 2.0, 'fijo'),
(56, 11, 1.0, 'fijo'),
(56, 48, 1.0, 'fijo'),
(56, 5, 30.0, 'fijo'),
(56, 101, 145.0, 'fijo'),
(56, 47, 80.0, 'variable'),
(56, 32, 42.0, 'variable'),
(57, 1, 200.0, 'fijo'),
(57, 4, 338.0, 'fijo'),
(57, 47, 75.0, 'fijo'),
(57, 6, 15.0, 'fijo'),
(57, 7, 10.0, 'fijo'),
(57, 102, 80.0, 'fijo'),
(57, 63, 30.0, 'variable'),
(58, 1, 200.0, 'fijo'),
(58, 4, 338.0, 'fijo'),
(58, 47, 75.0, 'fijo'),
(58, 6, 15.0, 'fijo'),
(58, 7, 10.0, 'fijo'),
(58, 102, 80.0, 'fijo'),
(58, 63, 40.0, 'variable'),
(58, 103, 1.0, 'variable'),
(59, 1, 220.0, 'fijo'),
(59, 4, 280.0, 'fijo'),
(59, 47, 90.0, 'fijo'),
(59, 6, 15.0, 'fijo'),
(59, 104, 15.0, 'fijo'),
(59, 102, 120.0, 'fijo'),
(59, 11, 2.0, 'fijo'),
(59, 63, 30.0, 'variable'),
(60, 105, 2.0, 'fijo'),
(60, 106, 300.0, 'variable'),
(60, 78, 1.0, 'variable'),
(60, 74, 1.0, 'variable'),
(60, 48, 1.0, 'variable');

SELECT setval('receta_ingredientes_id_seq', (SELECT COALESCE(MAX(id),1) FROM receta_ingredientes));

-- Configuración del Taller (NO MODIFICADA)
INSERT INTO configuracion_taller (id, nombre_negocio, telefono_whatsapp, direccion_taller, porcentaje_anticipo_default, porcentaje_indirectos_default, porcentaje_operativos_default, porcentaje_reposicion_default, porcentaje_mano_obra_default, porcentaje_margen_default, moneda_simbolo) VALUES
(1, 'Delicias del Valle', '+18095550142', 'Av. Winston Churchill #105, Santo Domingo, República Dominicana', 50.00, 10.00, 15.00, 10.00, 30.00, 50.00, 'RD$')
ON CONFLICT (id) DO NOTHING;

-- 7. REINICIO Y SINCRONIZACIÓN DE SECUENCIAS AUTO-INCREMENTABLES
-- ==============================================================================
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios));
SELECT setval('insumos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM insumos));
SELECT setval('recetas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM recetas));
SELECT setval('receta_ingredientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM receta_ingredientes));
SELECT setval('cotizaciones_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cotizaciones));
SELECT setval('cotizacion_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cotizacion_items));
SELECT setval('pedidos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pedidos));
SELECT setval('pedido_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pedido_items));
SELECT setval('pagos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pagos));
SELECT setval('mermas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM mermas));
SELECT setval('configuracion_taller_id_seq', (SELECT COALESCE(MAX(id), 1) FROM configuracion_taller));

-- ==============================================================================
-- FIN DEL SCRIPT DE SEED - DELICIAS DEL VALLE
-- ==============================================================================
