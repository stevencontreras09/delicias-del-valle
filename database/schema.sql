-- ==============================================================================
-- DELICIAS DEL VALLE - PASTELERÍA Y PANADERÍA ARTESANAL
-- Esquema de Base de Datos PostgreSQL (Producción)
-- ==============================================================================

-- 1. Tabla de Insumos / Materia Prima
CREATE TABLE IF NOT EXISTS insumos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  unidad_compra VARCHAR(30) NOT NULL,
  precio_compra DECIMAL(10,2) NOT NULL CHECK (precio_compra >= 0),
  presentacion_empaque DECIMAL(10,2) NOT NULL CHECK (presentacion_empaque > 0),
  unidad_base VARCHAR(20) NOT NULL CHECK (unidad_base IN ('g', 'ml', 'ud')),
  factor_conversion DECIMAL(10,4) NOT NULL CHECK (factor_conversion > 0),
  costo_unitario_base DECIMAL(10,4) GENERATED ALWAYS AS (precio_compra / presentacion_empaque) STORED,
  stock_actual DECIMAL(10,2) DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo DECIMAL(10,2) DEFAULT 0 CHECK (stock_minimo >= 0),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_stock ON insumos(stock_actual, stock_minimo);

-- 2. Tabla de Registro de Mermas
CREATE TABLE IF NOT EXISTS mermas (
  id SERIAL PRIMARY KEY,
  insumo_id INT NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
  motivo VARCHAR(30) NOT NULL CHECK (motivo IN ('caducidad', 'quemado', 'derrame', 'error_pesado', 'calidad', 'otro')),
  costo_perdido DECIMAL(10,2) NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Recetas (Escandallo y BOM)
CREATE TABLE IF NOT EXISTS recetas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT,
  rendimiento_base DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (rendimiento_base > 0),
  rendimiento_unidad VARCHAR(30) NOT NULL DEFAULT 'LB',
  tiempo_preparacion_min INT DEFAULT 30,
  tiempo_horneado_min INT DEFAULT 45,
  temperatura_horno_c INT DEFAULT 180,
  -- Porcentajes en cascada configurables
  materiales_indirectos_pct DECIMAL(5,2) DEFAULT 10.00 CHECK (materiales_indirectos_pct >= 0),
  costos_operativos_pct DECIMAL(5,2) DEFAULT 15.00 CHECK (costos_operativos_pct >= 0),
  reposicion_equipos_pct DECIMAL(5,2) DEFAULT 10.00 CHECK (reposicion_equipos_pct >= 0),
  mano_obra_pct DECIMAL(5,2) DEFAULT 30.00 CHECK (mano_obra_pct >= 0),
  margen_beneficio_pct DECIMAL(5,2) DEFAULT 50.00 CHECK (margen_beneficio_pct >= 0 AND margen_beneficio_pct < 100),
  activa BOOLEAN DEFAULT TRUE,
  instrucciones TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recetas_categoria ON recetas(categoria);

-- 4. Tabla de Ingredientes por Receta (Relación Receta-Insumo)
CREATE TABLE IF NOT EXISTS receta_ingredientes (
  id SERIAL PRIMARY KEY,
  receta_id INT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  insumo_id INT NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
  cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('fijo', 'variable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_receta_insumo UNIQUE (receta_id, insumo_id)
);

CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_receta ON receta_ingredientes(receta_id);

-- 5. Tabla de Cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(20) NOT NULL,
  cliente_email VARCHAR(100),
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_evento DATE,
  validez_dias INT DEFAULT 5,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) DEFAULT 0,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'aprobada', 'rechazada', 'convertida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Items de Cotizaciones
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id SERIAL PRIMARY KEY,
  cotizacion_id INT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  receta_id INT REFERENCES recetas(id) ON DELETE SET NULL,
  receta_nombre VARCHAR(150) NOT NULL,
  tamano_porciones VARCHAR(50),
  masa_base VARCHAR(100),
  relleno VARCHAR(100),
  decoracion VARCHAR(100),
  dedicatoria TEXT,
  extras JSONB DEFAULT '[]'::jsonb,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  factor_receta DECIMAL(10,2) DEFAULT 1
);

-- 7. Tabla de Pedidos y Facturación
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cotizacion_id INT REFERENCES cotizaciones(id) ON DELETE SET NULL,
  numero_factura VARCHAR(20) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(20) NOT NULL,
  cliente_email VARCHAR(100),
  fecha_pedido DATE DEFAULT CURRENT_DATE,
  fecha_entrega DATE NOT NULL,
  hora_entrega TIME NOT NULL,
  tipo_entrega VARCHAR(20) NOT NULL CHECK (tipo_entrega IN ('recogida_local', 'domicilio')),
  direccion_entrega TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  anticipo_pagado DECIMAL(10,2) DEFAULT 0 CHECK (anticipo_pagado >= 0),
  saldo_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (total - anticipo_pagado) STORED,
  estado VARCHAR(30) DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado')),
  inventario_descontado BOOLEAN DEFAULT FALSE,
  notas_cocina TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega ON pedidos(fecha_entrega);

-- 8. Items de Pedidos
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  receta_id INT REFERENCES recetas(id) ON DELETE SET NULL,
  receta_nombre VARCHAR(150) NOT NULL,
  tamano_porciones VARCHAR(50),
  masa_base VARCHAR(100),
  relleno VARCHAR(100),
  decoracion VARCHAR(100),
  dedicatoria TEXT,
  extras_texto TEXT,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  factor_receta DECIMAL(10,2) DEFAULT 1
);

-- 9. Tabla de Pagos / Transacciones
CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('transferencia', 'efectivo', 'tarjeta', 'sinpe_zelle')),
  referencia VARCHAR(100),
  tipo_pago VARCHAR(30) NOT NULL CHECK (tipo_pago IN ('anticipo_50', 'saldo_50', 'pago_completo', 'abono'))
);

-- ==============================================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==============================================================================

-- Función para descontar inventario automáticamente cuando un pedido entra en estado 'confirmado'
CREATE OR REPLACE FUNCTION descontar_inventario_pedido()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  ing RECORD;
BEGIN
  -- Si el pedido pasa a confirmado o se crea como confirmado y el inventario no ha sido descontado
  IF (NEW.estado = 'confirmado' OR NEW.estado = 'en_produccion') AND NOT NEW.inventario_descontado THEN
    FOR item IN SELECT * FROM pedido_items WHERE pedido_id = NEW.id LOOP
      IF item.receta_id IS NOT NULL THEN
        FOR ing IN SELECT * FROM receta_ingredientes WHERE receta_id = item.receta_id LOOP
          UPDATE insumos
          SET stock_actual = GREATEST(0, stock_actual - (ing.cantidad * item.factor_receta * item.cantidad)),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ing.insumo_id;
        END LOOP;
      END IF;
    END LOOP;
    NEW.inventario_descontado := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_descontar_inventario
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION descontar_inventario_pedido();
