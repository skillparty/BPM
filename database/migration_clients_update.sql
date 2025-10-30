-- Migración: Actualización del módulo de Clientes
-- Fecha: 2025-10-30
-- Descripción: Añadir campos empresa, tipo_cliente, razón social, NIT, país, departamento, ciudad, tipo_usuario

-- ==================================================
-- PASO 1: Crear tabla temporal con nueva estructura
-- ==================================================

CREATE TABLE clients_new (
  phone VARCHAR(20) PRIMARY KEY,  -- Teléfono como ID principal (único)
  name VARCHAR(100) NOT NULL,
  empresa VARCHAR(150),
  tipo_cliente VARCHAR(10) CHECK (tipo_cliente IN ('B2B', 'B2C')),
  razon_social TEXT,
  nit VARCHAR(50),
  pais VARCHAR(100),
  departamento VARCHAR(100),
  ciudad VARCHAR(100),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  tipo_usuario VARCHAR(20) DEFAULT 'Prospecto' CHECK (tipo_usuario IN ('Activo', 'Prospecto', 'Inactivo')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- PASO 2: Migrar datos existentes
-- ==================================================

-- Migrar datos de la tabla antigua a la nueva
-- Solo migrar clientes que tengan teléfono (ya que ahora es obligatorio)
INSERT INTO clients_new (
  phone, name, email, address, notes, created_by, created_at, updated_at
)
SELECT 
  phone, 
  name, 
  email, 
  address, 
  notes, 
  created_by, 
  created_at, 
  updated_at
FROM clients
WHERE phone IS NOT NULL AND phone != '';

-- ==================================================
-- PASO 3: Actualizar referencias en la tabla orders
-- ==================================================

-- Primero, añadir columna temporal client_phone a orders
ALTER TABLE orders ADD COLUMN client_phone VARCHAR(20);

-- Actualizar la columna con los teléfonos
UPDATE orders o
SET client_phone = c.phone
FROM clients c
WHERE o.client_id = c.id AND c.phone IS NOT NULL AND c.phone != '';

-- ==================================================
-- PASO 4: Eliminar tabla antigua y renombrar
-- ==================================================

-- Eliminar constraint de foreign key en orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_client_id_fkey;

-- Eliminar columna client_id antigua
ALTER TABLE orders DROP COLUMN client_id;

-- Renombrar client_phone a client_phone
-- Ya está con el nombre correcto

-- Añadir foreign key con el nuevo campo
ALTER TABLE orders 
  ADD CONSTRAINT orders_client_phone_fkey 
  FOREIGN KEY (client_phone) 
  REFERENCES clients_new(phone) 
  ON DELETE SET NULL;

-- Eliminar tabla antigua
DROP TABLE IF EXISTS clients CASCADE;

-- Renombrar tabla nueva
ALTER TABLE clients_new RENAME TO clients;

-- ==================================================
-- PASO 5: Crear índices
-- ==================================================

CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_tipo_cliente ON clients(tipo_cliente);
CREATE INDEX idx_clients_tipo_usuario ON clients(tipo_usuario);
CREATE INDEX idx_clients_empresa ON clients(empresa);
CREATE INDEX idx_orders_client_phone ON orders(client_phone);

-- ==================================================
-- PASO 6: Crear función para calcular tipo_usuario automáticamente
-- ==================================================

CREATE OR REPLACE FUNCTION update_client_tipo_usuario()
RETURNS TRIGGER AS $$
DECLARE
  last_order_date DATE;
  total_orders INTEGER;
BEGIN
  -- Obtener la fecha del último pedido y el total de pedidos
  SELECT MAX(order_date), COUNT(*)
  INTO last_order_date, total_orders
  FROM orders
  WHERE client_phone = NEW.client_phone 
    AND status != 'cancelado';

  -- Determinar el tipo de usuario
  IF total_orders = 0 THEN
    NEW.tipo_usuario := 'Prospecto';
  ELSIF last_order_date IS NULL THEN
    NEW.tipo_usuario := 'Prospecto';
  ELSIF last_order_date < CURRENT_DATE - INTERVAL '2 months' THEN
    NEW.tipo_usuario := 'Inactivo';
  ELSE
    NEW.tipo_usuario := 'Activo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar tipo_usuario al insertar o actualizar cliente
CREATE TRIGGER trigger_update_client_tipo_usuario
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_client_tipo_usuario();

-- ==================================================
-- PASO 7: Crear función para actualizar tipo_usuario cuando cambian orders
-- ==================================================

CREATE OR REPLACE FUNCTION update_client_tipo_on_order_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el tipo_usuario del cliente afectado
  UPDATE clients
  SET updated_at = CURRENT_TIMESTAMP
  WHERE phone = COALESCE(NEW.client_phone, OLD.client_phone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en orders para actualizar cliente cuando se crea, actualiza o elimina un pedido
CREATE TRIGGER trigger_update_client_on_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_client_tipo_on_order_change();

CREATE TRIGGER trigger_update_client_on_order_update
  AFTER UPDATE OF status, order_date ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_client_tipo_on_order_change();

-- ==================================================
-- PASO 8: Trigger para actualizar updated_at
-- ==================================================

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- PASO 9: Actualizar tipo_usuario de todos los clientes existentes
-- ==================================================

-- Forzar actualización de todos los clientes para calcular su tipo_usuario
UPDATE clients SET updated_at = updated_at;

-- ==================================================
-- FINALIZADO
-- ==================================================

COMMENT ON TABLE clients IS 'Clientes de la empresa - ID principal: teléfono';
COMMENT ON COLUMN clients.phone IS 'Teléfono del cliente (ID único y obligatorio)';
COMMENT ON COLUMN clients.tipo_cliente IS 'Tipo de cliente: B2B (empresas) o B2C (consumidor final)';
COMMENT ON COLUMN clients.tipo_usuario IS 'Estado automático: Activo (pedidos recientes), Prospecto (sin pedidos), Inactivo (>2 meses sin pedidos)';
COMMENT ON COLUMN clients.empresa IS 'Nombre de la empresa del cliente';
COMMENT ON COLUMN clients.razon_social IS 'Razón social de la empresa';
COMMENT ON COLUMN clients.nit IS 'Número de Identificación Tributaria';

SELECT 'Migración de clientes completada exitosamente' as status;
