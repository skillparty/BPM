-- Migración: Sistema de Control de Rollos de Sublimación
-- Fecha: 2025-10-30
-- Descripción: Tabla para gestionar el inventario de rollos (1-16) con capacidad de 105 metros

-- ==================================================
-- TABLA: Rollos
-- ==================================================
CREATE TABLE IF NOT EXISTS rollos (
  numero_rollo INTEGER PRIMARY KEY CHECK (numero_rollo >= 1 AND numero_rollo <= 16),
  metraje_total DECIMAL(10, 2) DEFAULT 105.00 NOT NULL,
  metraje_disponible DECIMAL(10, 2) DEFAULT 105.00 NOT NULL,
  metraje_usado DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  is_active BOOLEAN DEFAULT true,
  fecha_instalacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notas TEXT,
  CONSTRAINT metraje_disponible_valido CHECK (metraje_disponible >= 0),
  CONSTRAINT metraje_usado_valido CHECK (metraje_usado >= 0),
  CONSTRAINT metraje_coherente CHECK (metraje_usado + metraje_disponible <= metraje_total + 0.01)
);

-- ==================================================
-- TABLA: Historial de uso de rollos
-- ==================================================
CREATE TABLE IF NOT EXISTS rollo_historial (
  id SERIAL PRIMARY KEY,
  numero_rollo INTEGER REFERENCES rollos(numero_rollo),
  order_id INTEGER REFERENCES orders(id),
  metraje_usado DECIMAL(10, 2) NOT NULL,
  metraje_antes DECIMAL(10, 2) NOT NULL,
  metraje_despues DECIMAL(10, 2) NOT NULL,
  fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES users(id),
  notas TEXT
);

-- ==================================================
-- Insertar rollos iniciales (1-16) con 105 metros cada uno
-- ==================================================
INSERT INTO rollos (numero_rollo, metraje_total, metraje_disponible, metraje_usado) VALUES
(1, 105.00, 105.00, 0.00),
(2, 105.00, 105.00, 0.00),
(3, 105.00, 105.00, 0.00),
(4, 105.00, 105.00, 0.00),
(5, 105.00, 105.00, 0.00),
(6, 105.00, 105.00, 0.00),
(7, 105.00, 105.00, 0.00),
(8, 105.00, 105.00, 0.00),
(9, 105.00, 105.00, 0.00),
(10, 105.00, 105.00, 0.00),
(11, 105.00, 105.00, 0.00),
(12, 105.00, 105.00, 0.00),
(13, 105.00, 105.00, 0.00),
(14, 105.00, 105.00, 0.00),
(15, 105.00, 105.00, 0.00),
(16, 105.00, 105.00, 0.00)
ON CONFLICT (numero_rollo) DO NOTHING;

-- ==================================================
-- FUNCIÓN: Actualizar timestamp de última actualización
-- ==================================================
CREATE OR REPLACE FUNCTION update_rollo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_actualizacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rollo_timestamp
  BEFORE UPDATE ON rollos
  FOR EACH ROW
  EXECUTE FUNCTION update_rollo_timestamp();

-- ==================================================
-- FUNCIÓN: Descontar metraje de un rollo
-- ==================================================
CREATE OR REPLACE FUNCTION descontar_metraje_rollo(
  p_numero_rollo INTEGER,
  p_metraje DECIMAL(10, 2),
  p_order_id INTEGER,
  p_usuario_id INTEGER,
  p_notas TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  metraje_disponible DECIMAL(10, 2),
  mensaje TEXT
) AS $$
DECLARE
  v_metraje_disponible DECIMAL(10, 2);
  v_metraje_antes DECIMAL(10, 2);
BEGIN
  -- Obtener metraje disponible actual
  SELECT rollos.metraje_disponible INTO v_metraje_antes
  FROM rollos
  WHERE numero_rollo = p_numero_rollo AND is_active = true;

  IF v_metraje_antes IS NULL THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL(10, 2), 'Rollo no encontrado o inactivo';
    RETURN;
  END IF;

  -- Verificar si hay suficiente metraje
  IF v_metraje_antes < p_metraje THEN
    RETURN QUERY SELECT false, v_metraje_antes, 
      'Metraje insuficiente. Disponible: ' || v_metraje_antes::TEXT || 'm, Solicitado: ' || p_metraje::TEXT || 'm';
    RETURN;
  END IF;

  -- Descontar el metraje
  UPDATE rollos
  SET metraje_disponible = metraje_disponible - p_metraje,
      metraje_usado = metraje_usado + p_metraje
  WHERE numero_rollo = p_numero_rollo;

  -- Obtener nuevo metraje disponible
  SELECT rollos.metraje_disponible INTO v_metraje_disponible
  FROM rollos
  WHERE numero_rollo = p_numero_rollo;

  -- Registrar en historial
  INSERT INTO rollo_historial (
    numero_rollo, order_id, metraje_usado, metraje_antes, metraje_despues, usuario_id, notas
  ) VALUES (
    p_numero_rollo, p_order_id, p_metraje, v_metraje_antes, v_metraje_disponible, p_usuario_id, p_notas
  );

  RETURN QUERY SELECT true, v_metraje_disponible, 'Metraje descontado exitosamente';
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- FUNCIÓN: Restablecer un rollo a 105 metros (reemplazo)
-- ==================================================
CREATE OR REPLACE FUNCTION restablecer_rollo(
  p_numero_rollo INTEGER,
  p_usuario_id INTEGER,
  p_notas TEXT DEFAULT 'Rollo reemplazado'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE rollos
  SET metraje_total = 105.00,
      metraje_disponible = 105.00,
      metraje_usado = 0.00,
      fecha_instalacion = CURRENT_TIMESTAMP,
      notas = p_notas
  WHERE numero_rollo = p_numero_rollo;

  -- Registrar en historial
  INSERT INTO rollo_historial (
    numero_rollo, order_id, metraje_usado, metraje_antes, metraje_despues, usuario_id, notas
  ) VALUES (
    p_numero_rollo, NULL, 0, 0, 105.00, p_usuario_id, p_notas
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- ÍNDICES
-- ==================================================
CREATE INDEX idx_rollos_activos ON rollos(numero_rollo) WHERE is_active = true;
CREATE INDEX idx_rollo_historial_rollo ON rollo_historial(numero_rollo);
CREATE INDEX idx_rollo_historial_order ON rollo_historial(order_id);
CREATE INDEX idx_rollo_historial_fecha ON rollo_historial(fecha_uso);

-- ==================================================
-- COMENTARIOS
-- ==================================================
COMMENT ON TABLE rollos IS 'Control de inventario de rollos de sublimación (1-16)';
COMMENT ON COLUMN rollos.metraje_total IS 'Capacidad total del rollo (105 metros)';
COMMENT ON COLUMN rollos.metraje_disponible IS 'Metraje disponible actual del rollo';
COMMENT ON COLUMN rollos.metraje_usado IS 'Metraje usado del rollo';
COMMENT ON TABLE rollo_historial IS 'Historial de uso de rollos por pedido';

SELECT 'Sistema de control de rollos creado exitosamente' as status;
