-- Agregar campo monto_pagado a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(10,2) DEFAULT 0;

-- Crear tabla de pagos parciales
CREATE TABLE IF NOT EXISTS partial_payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_type_id INTEGER NOT NULL REFERENCES payment_types(id),
  bank_id INTEGER REFERENCES banks(id),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago TIMESTAMP DEFAULT NOW(),
  numero_comprobante VARCHAR(100),
  notas TEXT,
  usuario_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_partial_payments_order ON partial_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_fecha ON partial_payments(fecha_pago);

-- Función para actualizar monto pagado y estado del pedido
CREATE OR REPLACE FUNCTION actualizar_monto_pagado()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado NUMERIC;
  v_total_pedido NUMERIC;
BEGIN
  -- Calcular total pagado para este pedido
  SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
  FROM partial_payments
  WHERE order_id = NEW.order_id;
  
  -- Obtener total del pedido
  SELECT total INTO v_total_pedido
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Actualizar monto_pagado en orders
  UPDATE orders
  SET monto_pagado = v_total_pagado
  WHERE id = NEW.order_id;
  
  -- Actualizar payment_status según el monto pagado
  IF v_total_pagado >= v_total_pedido THEN
    -- Pago completado - actualizar payment_type_id al último tipo de pago usado
    UPDATE orders
    SET payment_status = 'pagado',
        payment_type_id = NEW.payment_type_id,
        bank_id = NEW.bank_id
    WHERE id = NEW.order_id;
  ELSIF v_total_pagado > 0 THEN
    -- Pago parcial
    UPDATE orders
    SET payment_status = 'parcial'
    WHERE id = NEW.order_id;
  ELSE
    -- Sin pagos
    UPDATE orders
    SET payment_status = 'pendiente'
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente al insertar un pago
DROP TRIGGER IF EXISTS trg_actualizar_monto_pagado ON partial_payments;
CREATE TRIGGER trg_actualizar_monto_pagado
  AFTER INSERT OR DELETE ON partial_payments
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_monto_pagado();

-- Actualizar monto_pagado para pedidos existentes (inicializar en 0)
UPDATE orders SET monto_pagado = 0 WHERE monto_pagado IS NULL;

-- Comentarios
COMMENT ON TABLE partial_payments IS 'Registro de pagos parciales para pedidos con tipo de pago Pendiente';
COMMENT ON COLUMN orders.monto_pagado IS 'Monto total pagado hasta el momento para pedidos con pagos parciales';
