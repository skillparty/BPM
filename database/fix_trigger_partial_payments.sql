-- Corregir función para manejar tanto INSERT como DELETE
CREATE OR REPLACE FUNCTION actualizar_monto_pagado()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado NUMERIC;
  v_total_pedido NUMERIC;
  v_order_id INTEGER;
  v_last_payment_type INTEGER;
  v_last_bank INTEGER;
BEGIN
  -- Determinar el order_id según el tipo de operación
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Calcular total pagado para este pedido
  SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
  FROM partial_payments
  WHERE order_id = v_order_id;
  
  -- Obtener total del pedido
  SELECT total INTO v_total_pedido
  FROM orders
  WHERE id = v_order_id;
  
  -- Actualizar monto_pagado en orders
  UPDATE orders
  SET monto_pagado = v_total_pagado
  WHERE id = v_order_id;
  
  -- Actualizar payment_status según el monto pagado
  IF v_total_pagado >= v_total_pedido THEN
    -- Pago completado - obtener el tipo de pago y banco del último pago
    SELECT payment_type_id, bank_id INTO v_last_payment_type, v_last_bank
    FROM partial_payments
    WHERE order_id = v_order_id
    ORDER BY fecha_pago DESC
    LIMIT 1;
    
    UPDATE orders
    SET payment_status = 'pagado',
        payment_type_id = COALESCE(v_last_payment_type, payment_type_id),
        bank_id = v_last_bank
    WHERE id = v_order_id;
  ELSIF v_total_pagado > 0 THEN
    -- Pago parcial
    UPDATE orders
    SET payment_status = 'parcial'
    WHERE id = v_order_id;
  ELSE
    -- Sin pagos - volver a pendiente
    UPDATE orders
    SET payment_status = 'pendiente'
    WHERE id = v_order_id;
  END IF;
  
  -- Retornar el registro apropiado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger para manejar INSERT y DELETE
DROP TRIGGER IF EXISTS trg_actualizar_monto_pagado ON partial_payments;
CREATE TRIGGER trg_actualizar_monto_pagado
  AFTER INSERT OR DELETE ON partial_payments
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_monto_pagado();
