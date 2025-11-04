-- Crear datos de prueba: 1 cliente y 20 pedidos

-- Crear cliente unico con el numero 60344144
INSERT INTO clients (phone, name, email, tipo_cliente, empresa, created_at) 
VALUES ('60344144', 'Jose Alejandro Rollano', 'alejandro@bpm.com', 'B2C', 'BPM Printing', NOW());

-- Insertar 20 pedidos con diferentes estados, tipos de trabajo y fechas
INSERT INTO orders (client_phone, client_name, work_type_id, status, payment_status, payment_type_id, total, order_date, created_by, qr_code, receipt_number, description) VALUES
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'pendiente', 1, 450.00, NOW() - INTERVAL '1 day', 1, 'ORD001', 'PED001', 'Impresion DTF para evento corporativo'),
('60344144', 'Jose Alejandro Rollano', 2, 'activo', 'pendiente', 1, 680.50, NOW() - INTERVAL '2 days', 1, 'ORD002', 'PED002', 'Sublimacion de playeras deportivas'),
('60344144', 'Jose Alejandro Rollano', 3, 'completado', 'pagado', 2, 920.75, NOW() - INTERVAL '10 days', 1, 'ORD003', 'PED003', 'DTF + Planchado para tienda'),
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'parcial', 3, 350.00, NOW() - INTERVAL '3 days', 1, 'ORD004', 'PED004', 'Impresion DTF urgente'),
('60344144', 'Jose Alejandro Rollano', 4, 'activo', 'pendiente', 1, 580.25, NOW() - INTERVAL '4 days', 1, 'ORD005', 'PED005', 'Sublimacion + Planchado combo'),
('60344144', 'Jose Alejandro Rollano', 2, 'completado', 'pagado', 2, 1250.00, NOW() - INTERVAL '15 days', 1, 'ORD006', 'PED006', 'Lote sublimacion para escuela'),
('60344144', 'Jose Alejandro Rollano', 5, 'activo', 'pendiente', 1, 180.50, NOW(), 1, 'ORD007', 'PED007', 'Insignias texturizadas'),
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'pendiente', 1, 720.00, NOW() - INTERVAL '5 days', 1, 'ORD008', 'PED008', 'DTF gran formato'),
('60344144', 'Jose Alejandro Rollano', 6, 'completado', 'pagado', 2, 420.75, NOW() - INTERVAL '20 days', 1, 'ORD009', 'PED009', 'Planchado premium'),
('60344144', 'Jose Alejandro Rollano', 2, 'activo', 'parcial', 3, 890.50, NOW() - INTERVAL '6 days', 1, 'ORD010', 'PED010', 'Sublimacion tazas personalizadas'),
('60344144', 'Jose Alejandro Rollano', 3, 'activo', 'pendiente', 1, 650.00, NOW() - INTERVAL '7 days', 1, 'ORD011', 'PED011', 'DTF + Planchado uniformes'),
('60344144', 'Jose Alejandro Rollano', 1, 'completado', 'pagado', 2, 540.25, NOW() - INTERVAL '12 days', 1, 'ORD012', 'PED012', 'Impresion DTF mediana'),
('60344144', 'Jose Alejandro Rollano', 4, 'activo', 'pendiente', 1, 980.00, NOW() - INTERVAL '8 days', 1, 'ORD013', 'PED013', 'Sublimacion + Planchado empresa'),
('60344144', 'Jose Alejandro Rollano', 2, 'activo', 'parcial', 3, 1150.50, NOW() - INTERVAL '9 days', 1, 'ORD014', 'PED014', 'Sublimacion gorras y poleras'),
('60344144', 'Jose Alejandro Rollano', 5, 'completado', 'pagado', 2, 290.00, NOW() - INTERVAL '18 days', 1, 'ORD015', 'PED015', 'Insignias + Planchado'),
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'pendiente', 1, 380.75, NOW() - INTERVAL '2 days', 1, 'ORD016', 'PED016', 'DTF express pequeño'),
('60344144', 'Jose Alejandro Rollano', 3, 'activo', 'pendiente', 1, 1420.00, NOW() - INTERVAL '11 days', 1, 'ORD017', 'PED017', 'DTF + Planchado lote grande'),
('60344144', 'Jose Alejandro Rollano', 2, 'completado', 'pagado', 2, 760.50, NOW() - INTERVAL '25 days', 1, 'ORD018', 'PED018', 'Sublimacion merchandising'),
('60344144', 'Jose Alejandro Rollano', 6, 'activo', 'parcial', 3, 520.25, NOW() - INTERVAL '4 days', 1, 'ORD019', 'PED019', 'Planchado especial'),
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'pendiente', 1, 810.00, NOW() - INTERVAL '1 day', 1, 'ORD020', 'PED020', 'Impresion DTF calidad premium');

-- Insertar items variados para cada pedido
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total) VALUES
-- Pedido 1
(1, 1, 'Impresion DTF 50x70cm', 3, 150.00, 450.00),
-- Pedido 2
(2, 1, 'Sublimacion playera deportiva', 5, 136.10, 680.50),
-- Pedido 3
(3, 1, 'DTF premium', 4, 180.00, 720.00),
(3, 2, 'Planchado industrial', 2, 100.375, 200.75),
-- Pedido 4
(4, 1, 'Impresion DTF urgente', 2, 175.00, 350.00),
-- Pedido 5
(5, 1, 'Sublimacion + Planchado combo', 5, 116.05, 580.25),
-- Pedido 6
(6, 1, 'Sublimacion lote escolar', 10, 125.00, 1250.00),
-- Pedido 7
(7, 1, 'Insignias texturizadas premium', 1, 180.50, 180.50),
-- Pedido 8
(8, 1, 'DTF gran formato especial', 4, 180.00, 720.00),
-- Pedido 9
(9, 1, 'Planchado premium', 3, 140.25, 420.75),
-- Pedido 10
(10, 1, 'Sublimacion taza personalizada', 10, 89.05, 890.50),
-- Pedido 11
(11, 1, 'DTF uniformes', 5, 100.00, 500.00),
(11, 2, 'Planchado uniformes', 3, 50.00, 150.00),
-- Pedido 12
(12, 1, 'Impresion DTF mediana', 3, 180.083, 540.25),
-- Pedido 13
(13, 1, 'Sublimacion empresa', 7, 140.00, 980.00),
-- Pedido 14
(14, 1, 'Gorras sublimadas', 8, 75.00, 600.00),
(14, 2, 'Poleras sublimadas', 5, 110.10, 550.50),
-- Pedido 15
(15, 1, 'Insignias especiales', 2, 145.00, 290.00),
-- Pedido 16
(16, 1, 'DTF express', 2, 190.375, 380.75),
-- Pedido 17
(17, 1, 'DTF lote grande', 10, 120.00, 1200.00),
(17, 2, 'Planchado lote', 11, 20.00, 220.00),
-- Pedido 18
(18, 1, 'Merchandising sublimado', 6, 126.75, 760.50),
-- Pedido 19
(19, 1, 'Planchado especial deluxe', 4, 130.0625, 520.25),
-- Pedido 20
(20, 1, 'DTF calidad premium HD', 5, 162.00, 810.00);

-- Actualizar tipo_usuario del cliente
UPDATE clients SET tipo_usuario = 'Activo' WHERE phone = '60344144';

-- Mensaje de confirmacion
SELECT 'Datos de prueba creados exitosamente' as resultado;
SELECT COUNT(*) as total_clientes FROM clients;
SELECT COUNT(*) as total_pedidos FROM orders;
SELECT COUNT(*) as total_items FROM order_items;
SELECT SUM(total) as total_ventas FROM orders;
