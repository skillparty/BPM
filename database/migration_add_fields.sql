-- Migración para agregar campos order_day y numero_rollo
-- Ejecutar este script si ya tienes datos en la base de datos

-- Agregar columnas nuevas a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_day VARCHAR(20),
ADD COLUMN IF NOT EXISTS numero_rollo INTEGER CHECK (numero_rollo >= 1 AND numero_rollo <= 16);

-- Actualizar order_day para registros existentes (calcular desde order_date)
UPDATE orders 
SET order_day = CASE EXTRACT(DOW FROM order_date)
  WHEN 0 THEN 'Domingo'
  WHEN 1 THEN 'Lunes'
  WHEN 2 THEN 'Martes'
  WHEN 3 THEN 'Miércoles'
  WHEN 4 THEN 'Jueves'
  WHEN 5 THEN 'Viernes'
  WHEN 6 THEN 'Sábado'
END
WHERE order_day IS NULL;

-- Verificar cambios
SELECT id, receipt_number, client_name, order_day, order_date, numero_rollo 
FROM orders 
LIMIT 10;
