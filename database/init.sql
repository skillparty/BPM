-- Script de inicialización de base de datos BPM
-- PostgreSQL 14+

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS work_types CASCADE;
DROP TABLE IF EXISTS payment_types CASCADE;
DROP TABLE IF EXISTS banks CASCADE;

-- Crear extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: Usuarios
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'colaborador')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Clientes
-- ============================================
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Tipos de trabajo
-- ============================================
CREATE TABLE work_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- TABLA: Tipos de pago
-- ============================================
CREATE TABLE payment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL
);

-- ============================================
-- TABLA: Bancos
-- ============================================
CREATE TABLE banks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL
);

-- ============================================
-- TABLA: Productos/Bobinas
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stock_meters DECIMAL(10, 2) DEFAULT 0,
  cost_per_meter DECIMAL(10, 2),
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Pedidos/Recibos
-- ============================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  client_name VARCHAR(100) NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_type_id INTEGER REFERENCES work_types(id),
  description TEXT,
  
  -- Totales
  subtotal DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  
  -- Pago
  payment_type_id INTEGER REFERENCES payment_types(id),
  bank_id INTEGER REFERENCES banks(id),
  payment_status VARCHAR(20) DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'parcial', 'pagado')),
  
  -- Control
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'cancelado', 'completado')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- QR y datos adicionales
  qr_code TEXT,
  notes TEXT
);

-- ============================================
-- TABLA: Items de pedido
-- ============================================
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

-- ============================================
-- TABLA: Pagos
-- ============================================
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type_id INTEGER REFERENCES payment_types(id),
  bank_id INTEGER REFERENCES banks(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_receipt ON orders(receipt_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_clients_name ON clients(name);

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Usuario admin por defecto (password: admin123)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@bpm.com', '$2a$10$8YPXnQXHZKQXZQZQXHZKQO9.9YPXnQXHZKQXZQZQXHZKQO9.9YPXNQ', 'Administrador', 'super_admin');

-- Tipos de trabajo
INSERT INTO work_types (code, name, description) VALUES
('1', 'DTF', 'Transferencia DTF'),
('2', 'SUBLIM', 'Sublimación'),
('3', 'PLANCH', 'Planchado'),
('4', 'DTF+PL', 'DTF + Planchado'),
('5', 'SUB+PL', 'Sublimación + Planchado'),
('6', 'INSIG-T', 'Insignia Texturizada'),
('7', 'INS+PL', 'Insignia T. + Planchado');

-- Tipos de pago
INSERT INTO payment_types (name, code) VALUES
('QR', 'QR'),
('Efectivo', 'EFECTIVO'),
('Transferencia', 'TRANSFER'),
('Pago Pendiente', 'PENDIENTE');

-- Bancos
INSERT INTO banks (name, code) VALUES
('VISA 011', 'VISA-011'),
('YAPE', 'YAPE'),
('BMSC', 'BMSC'),
('BCP 95', 'BCP-95'),
('N/A', 'NA');

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de resumen de pedidos
CREATE OR REPLACE VIEW view_orders_summary AS
SELECT 
  o.id,
  o.receipt_number,
  o.order_date,
  o.client_name,
  wt.name as work_type,
  o.total,
  pt.name as payment_type,
  o.payment_status,
  o.status,
  u.full_name as created_by_name
FROM orders o
LEFT JOIN work_types wt ON o.work_type_id = wt.id
LEFT JOIN payment_types pt ON o.payment_type_id = pt.id
LEFT JOIN users u ON o.created_by = u.id;

-- Vista de totales mensuales
CREATE OR REPLACE VIEW view_monthly_totals AS
SELECT 
  DATE_TRUNC('month', order_date) as month,
  COUNT(*) as total_orders,
  SUM(total) as total_amount,
  AVG(total) as average_order
FROM orders
WHERE status != 'cancelado'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;

-- ============================================
-- TRIGGERS: Cálculo automático de items
-- ============================================

-- Trigger para calcular automáticamente los subtotales y el total de cada item
CREATE OR REPLACE FUNCTION calculate_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular subtotales
  NEW.impresion_subtotal := COALESCE(NEW.impresion_metraje, 0) * COALESCE(NEW.impresion_costo, 0);
  NEW.planchado_subtotal := COALESCE(NEW.planchado_cantidad, 0) * COALESCE(NEW.planchado_costo, 0);
  NEW.insignia_subtotal := COALESCE(NEW.insignia_cantidad, 0) * COALESCE(NEW.insignia_costo, 0);
  
  -- Calcular total del item
  NEW.total := NEW.impresion_subtotal + NEW.planchado_subtotal + NEW.insignia_subtotal;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_item_totals
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_totals();

COMMENT ON TABLE users IS 'Usuarios del sistema (super_admin y colaboradores)';
COMMENT ON TABLE clients IS 'Clientes de la empresa';
COMMENT ON TABLE orders IS 'Pedidos y recibos generados';
COMMENT ON TABLE order_items IS 'Items/productos de cada pedido';
COMMENT ON TABLE payments IS 'Pagos realizados para los pedidos';
COMMENT ON TABLE work_types IS 'Tipos de trabajo disponibles';
COMMENT ON TABLE payment_types IS 'Formas de pago';
COMMENT ON TABLE banks IS 'Bancos disponibles';
COMMENT ON TABLE products IS 'Productos, bobinas e inventario';

-- Finalizado
SELECT 'Base de datos BPM inicializada correctamente' as status;
