-- ==============================================================================
-- DELICIAS DEL VALLE - HABILITAR SUPABASE REALTIME (POSTGRESQL REPLICATION)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase (Dashboard -> SQL Editor)
-- para permitir que PostgreSQL emita eventos de cambio a nivel de tabla (CDC/WAL)
-- además del canal WebSocket Broadcast en vivo.

-- 1. Habilitar la publicación supabase_realtime para las tablas operativas
DO $$
BEGIN
  -- insumos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'insumos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE insumos;
  END IF;

  -- mermas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mermas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mermas;
  END IF;

  -- recetas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'recetas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE recetas;
  END IF;

  -- receta_ingredientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'receta_ingredientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE receta_ingredientes;
  END IF;

  -- cotizaciones
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cotizaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cotizaciones;
  END IF;

  -- cotizacion_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cotizacion_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cotizacion_items;
  END IF;

  -- pedidos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
  END IF;

  -- pedido_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pedido_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pedido_items;
  END IF;

  -- pagos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pagos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
  END IF;

  -- clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'clientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
  END IF;

  -- usuarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'usuarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;
  END IF;
END $$;

-- 2. Asegurar réplica completa de identidad
ALTER TABLE insumos REPLICA IDENTITY FULL;
ALTER TABLE recetas REPLICA IDENTITY FULL;
ALTER TABLE receta_ingredientes REPLICA IDENTITY FULL;
ALTER TABLE cotizaciones REPLICA IDENTITY FULL;
ALTER TABLE cotizacion_items REPLICA IDENTITY FULL;
ALTER TABLE pedidos REPLICA IDENTITY FULL;
ALTER TABLE pedido_items REPLICA IDENTITY FULL;
ALTER TABLE pagos REPLICA IDENTITY FULL;
ALTER TABLE clientes REPLICA IDENTITY FULL;
ALTER TABLE mermas REPLICA IDENTITY FULL;
ALTER TABLE usuarios REPLICA IDENTITY FULL;
