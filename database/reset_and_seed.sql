-- Limpiar base de datos y crear datos de prueba con numero unico: 60344144

-- Desactivar triggers temporalmente
ALTER TABLE clients DISABLE TRIGGER ALL;
ALTER TABLE orders DISABLE TRIGGER ALL;

-- Limpiar tablas en orden correcto
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE payments CASCADE;

-- Reactivar triggers
ALTER TABLE clients ENABLE TRIGGER ALL;
ALTER TABLE orders ENABLE TRIGGER ALL;

-- Reiniciar secuencias
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;

-- Crear cliente unico con el numero 60344144
INSERT INTO clients (phone, name, email, tipo_cliente, created_at) 
VALUES ('60344144', 'Cliente Prueba', 'prueba@test.com', 'B2C', NOW());

-- Insertar 15 pedidos con diferentes estados y tipos de trabajo
INSERT INTO orders (client_phone, client_name, work_type_id, status, payment_status, payment_type_id, total, order_date, created_by, qr_code, receipt_number, description) VALUES
('60344144', 'Cliente Prueba', 1, 'activo', 'pendiente', 1, 320.50, NOW() - INTERVAL '5 days', 1, 'ORD001', 'PED001', 'Pedido de prueba 1'),
('60344144', 'Cliente Prueba', 2, 'completado', 'pagado', 2, 450.00, NOW() - INTERVAL '10 days', 1, 'ORD002', 'PED002', 'Pedido de prueba 2'),
('60344144', 'Cliente Prueba', 3, 'activo', 'pendiente', 1, 280.75, NOW() - INTERVAL '2 days', 1, 'ORD003', 'PED003', 'Pedido de prueba 3'),
('60344144', 'Cliente Prueba', 4, 'activo', 'parcial', 3, 520.00, NOW() - INTERVAL '7 days', 1, 'ORD004', 'PED004', 'Pedido de prueba 4'),
('60344144', 'Cliente Prueba', 1, 'completado', 'pagado', 2, 390.25, NOW() - INTERVAL '15 days', 1, 'ORD005', 'PED005', 'Pedido de prueba 5'),
('60344144', 'Cliente Prueba', 2, 'activo', 'pendiente', 1, 610.50, NOW() - INTERVAL '3 days', 1, 'ORD006', 'PED006', 'Pedido de prueba 6'),
('60344144', 'Cliente Prueba', 5, 'activo', 'pendiente', 1, 155.00, NOW() - INTERVAL '1 day', 1, 'ORD007', 'PED007', 'Pedido de prueba 7'),
('60344144', 'Cliente Prueba', 6, 'completado', 'pagado', 2, 725.80, NOW() - INTERVAL '20 days', 1, 'ORD008', 'PED008', 'Pedido de prueba 8'),
('60344144', 'Cliente Prueba', 1, 'activo', 'parcial', 3, 340.00, NOW() - INTERVAL '4 days', 1, 'ORD009', 'PED009', 'Pedido de prueba 9'),
('60344144', 'Cliente Prueba', 3, 'activo', 'pendiente', 1, 480.50, NOW() - INTERVAL '1 day', 1, 'ORD010', 'PED010', 'Pedido de prueba 10'),
('60344144', 'Cliente Prueba', 2, 'completado', 'pagado', 2, 295.75, NOW() - INTERVAL '12 days', 1, 'ORD011', 'PED011', 'Pedido de prueba 11'),
('60344144', 'Cliente Prueba', 4, 'activo', 'pendiente', 1, 580.00, NOW() - INTERVAL '6 days', 1, 'ORD012', 'PED012', 'Pedido de prueba 12'),
('60344144', 'Cliente Prueba', 1, 'activo', 'pendiente', 1, 210.25, NOW(), 1, 'ORD013', 'PED013', 'Pedido de prueba 13'),
('60344144', 'Cliente Prueba', 5, 'completado', 'pagado', 2, 420.50, NOW() - INTERVAL '18 days', 1, 'ORD014', 'PED014', 'Pedido de prueba 14'),
('60344144', 'Cliente Prueba', 2, 'activo', 'parcial', 3, 640.00, NOW() - INTERVAL '8 days', 1, 'ORD015', 'PED015', 'Pedido de prueba 15');

-- Insertar items para cada pedido (2-4 items por pedido)
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total) VALUES
-- Pedido 1
(1, 1, 'Impresion DTF 50x70cm', 2, 80.00, 160.00),
(1, 2, 'Planchado premium', 1, 160.50, 160.50),
-- Pedido 2
(2, 1, 'Sublimacion playera', 3, 150.00, 450.00),
-- Pedido 3
(3, 1, 'Impresion DTF A4', 1, 80.00, 80.00),
(3, 2, 'Material especial', 2, 100.375, 200.75),
-- Pedido 4
(4, 1, 'DTF + Planchado combo', 4, 130.00, 520.00),
-- Pedido 5
(5, 1, 'Impresion DTF mediana', 3, 130.083, 390.25),
-- Pedido 6
(6, 1, 'Sublimacion taza', 2, 200.00, 400.00),
(6, 2, 'Sublimacion gorra', 1, 210.50, 210.50),
-- Pedido 7
(7, 1, 'Planchado estandar', 1, 155.00, 155.00),
-- Pedido 8
(8, 1, 'Lote sublimacion', 5, 145.16, 725.80),
-- Pedido 9
(9, 1, 'Impresion DTF grande', 2, 170.00, 340.00),
-- Pedido 10
(10, 1, 'DTF + Planchado x3', 3, 160.166, 480.50),
-- Pedido 11
(11, 1, 'Sublimacion duo', 2, 147.875, 295.75),
-- Pedido 12
(12, 1, 'Combo DTF premium', 4, 145.00, 580.00),
-- Pedido 13
(13, 1, 'Impresion DTF chica', 1, 210.25, 210.25),
-- Pedido 14
(14, 1, 'Planchado doble', 2, 210.25, 420.50),
-- Pedido 15
(15, 1, 'Sublimacion cuadro', 4, 160.00, 640.00);

-- Actualizar tipo_usuario del cliente basado en actividad
UPDATE clients SET tipo_usuario = 'Activo' WHERE phone = '60344144';

-- Mensaje de confirmacion
SELECT 'Base de datos limpiada y recargada exitosamente' as resultado;
SELECT COUNT(*) as total_clientes FROM clients;
SELECT COUNT(*) as total_pedidos FROM orders;
SELECT COUNT(*) as total_items FROM order_items;
