-- Migración para actualizar la estructura de order_items
-- Nuevos campos para los 3 módulos: Impresión, Planchado e Insignias Texturizadas

-- Eliminar la tabla actual y recrearla con la nueva estructura
DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  
  -- Módulo 1: Impresión
  impresion_metraje DECIMAL(10, 2) DEFAULT 0,
  impresion_costo DECIMAL(10, 2) DEFAULT 0,
  impresion_subtotal DECIMAL(10, 2) DEFAULT 0,
  
  -- Módulo 2: Planchado
  planchado_cantidad DECIMAL(10, 2) DEFAULT 0,
  planchado_costo DECIMAL(10, 2) DEFAULT 0,
  planchado_subtotal DECIMAL(10, 2) DEFAULT 0,
  
  -- Módulo 3: Insignias Texturizadas
  insignia_cantidad DECIMAL(10, 2) DEFAULT 0,
  insignia_costo DECIMAL(10, 2) DEFAULT 0,
  insignia_subtotal DECIMAL(10, 2) DEFAULT 0,
  
  -- Total del item (suma de los 3 subtotales)
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para calcular automáticamente los subtotales y el total
CREATE OR REPLACE FUNCTION calculate_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular subtotales
  NEW.impresion_subtotal := NEW.impresion_metraje * NEW.impresion_costo;
  NEW.planchado_subtotal := NEW.planchado_cantidad * NEW.planchado_costo;
  NEW.insignia_subtotal := NEW.insignia_cantidad * NEW.insignia_costo;
  
  -- Calcular total
  NEW.total := NEW.impresion_subtotal + NEW.planchado_subtotal + NEW.insignia_subtotal;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_item_totals
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_totals();
