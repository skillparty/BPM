-- Crear 10 clientes ejemplo con 20 pedidos distribuidos del 1 al 4 de noviembre 2025

-- Insertar 10 clientes
INSERT INTO clients (phone, name, email, tipo_cliente, empresa, created_at) VALUES
('60344144', 'Jose Alejandro Rollano', 'alejandro@bpm.com', 'B2C', 'BPM Printing', NOW()),
('71234567', 'Maria Teresa Lopez', 'maria.lopez@email.com', 'B2C', NULL, NOW()),
('72345678', 'Carlos Ramirez Paz', 'carlos.ramirez@empresa.com', 'B2B', 'Textiles SA', NOW()),
('73456789', 'Ana Patricia Flores', 'ana.flores@email.com', 'B2C', NULL, NOW()),
('74567890', 'Roberto Gutierrez', 'roberto.g@comercial.com', 'B2B', 'Comercial Gutierrez', NOW()),
('75678901', 'Sofia Mendoza Cruz', 'sofia.mendoza@email.com', 'B2C', NULL, NOW()),
('76789012', 'Luis Alberto Vargas', 'luis.vargas@deportes.com', 'B2B', 'Deportes Unidos', NOW()),
('77890123', 'Patricia Sanchez', 'patricia.s@email.com', 'B2C', NULL, NOW()),
('78901234', 'Diego Fernando Rojas', 'diego.rojas@gym.com', 'B2B', 'Gym Evolution', NOW()),
('79012345', 'Carmen Lucia Morales', 'carmen.morales@email.com', 'B2C', NULL, NOW());

-- Insertar 20 pedidos distribuidos entre el 1 y 4 de noviembre 2025
-- 2 pedidos por cliente
INSERT INTO orders (client_phone, client_name, work_type_id, status, payment_status, payment_type_id, total, order_date, created_by, qr_code, receipt_number, description) VALUES
-- Cliente 1: Jose Alejandro Rollano (60344144)
('60344144', 'Jose Alejandro Rollano', 1, 'activo', 'pendiente', 1, 450.00, '2025-11-01', 1, 'QR001', '2511010001', 'Impresion DTF para evento'),
('60344144', 'Jose Alejandro Rollano', 2, 'completado', 'pagado', 2, 680.50, '2025-11-03', 1, 'QR002', '2511030001', 'Sublimacion playeras'),

-- Cliente 2: Maria Teresa Lopez (71234567)
('71234567', 'Maria Teresa Lopez', 3, 'activo', 'parcial', 3, 820.00, '2025-11-01', 1, 'QR003', '2511010002', 'DTF + Planchado combo'),
('71234567', 'Maria Teresa Lopez', 1, 'completado', 'pagado', 2, 390.75, '2025-11-04', 1, 'QR004', '2511040001', 'Impresion DTF mediana'),

-- Cliente 3: Carlos Ramirez Paz (72345678)
('72345678', 'Carlos Ramirez Paz', 4, 'activo', 'pendiente', 1, 1250.00, '2025-11-02', 1, 'QR005', '2511020001', 'Sublimacion + Planchado empresa'),
('72345678', 'Carlos Ramirez Paz', 2, 'activo', 'pendiente', 1, 580.50, '2025-11-03', 1, 'QR006', '2511030002', 'Sublimacion lote mediano'),

-- Cliente 4: Ana Patricia Flores (73456789)
('73456789', 'Ana Patricia Flores', 1, 'completado', 'pagado', 2, 420.00, '2025-11-01', 1, 'QR007', '2511010003', 'DTF chico'),
('73456789', 'Ana Patricia Flores', 5, 'activo', 'pendiente', 1, 180.50, '2025-11-04', 1, 'QR008', '2511040002', 'Insignias texturizadas'),

-- Cliente 5: Roberto Gutierrez (74567890)
('74567890', 'Roberto Gutierrez', 2, 'activo', 'parcial', 3, 920.00, '2025-11-02', 1, 'QR009', '2511020002', 'Sublimacion uniformes'),
('74567890', 'Roberto Gutierrez', 3, 'completado', 'pagado', 2, 1150.75, '2025-11-03', 1, 'QR010', '2511030003', 'DTF + Planchado grande'),

-- Cliente 6: Sofia Mendoza Cruz (75678901)
('75678901', 'Sofia Mendoza Cruz', 1, 'activo', 'pendiente', 1, 340.00, '2025-11-01', 1, 'QR011', '2511010004', 'DTF express'),
('75678901', 'Sofia Mendoza Cruz', 6, 'activo', 'pendiente', 1, 280.50, '2025-11-04', 1, 'QR012', '2511040003', 'Planchado premium'),

-- Cliente 7: Luis Alberto Vargas (76789012)
('76789012', 'Luis Alberto Vargas', 2, 'completado', 'pagado', 2, 890.00, '2025-11-02', 1, 'QR013', '2511020003', 'Sublimacion deportiva'),
('76789012', 'Luis Alberto Vargas', 4, 'activo', 'parcial', 3, 760.50, '2025-11-03', 1, 'QR014', '2511030004', 'Sublimacion + Planchado'),

-- Cliente 8: Patricia Sanchez (77890123)
('77890123', 'Patricia Sanchez', 1, 'activo', 'pendiente', 1, 520.00, '2025-11-01', 1, 'QR015', '2511010005', 'Impresion DTF grande'),
('77890123', 'Patricia Sanchez', 3, 'completado', 'pagado', 2, 650.75, '2025-11-04', 1, 'QR016', '2511040004', 'DTF + Planchado estandar'),

-- Cliente 9: Diego Fernando Rojas (78901234)
('78901234', 'Diego Fernando Rojas', 2, 'activo', 'pendiente', 1, 1420.00, '2025-11-02', 1, 'QR017', '2511020004', 'Sublimacion lote gym'),
('78901234', 'Diego Fernando Rojas', 5, 'activo', 'parcial', 3, 290.50, '2025-11-03', 1, 'QR018', '2511030005', 'Insignias + Planchado'),

-- Cliente 10: Carmen Lucia Morales (79012345)
('79012345', 'Carmen Lucia Morales', 1, 'completado', 'pagado', 2, 480.00, '2025-11-01', 1, 'QR019', '2511010006', 'DTF personalizado'),
('79012345', 'Carmen Lucia Morales', 6, 'activo', 'pendiente', 1, 380.50, '2025-11-04', 1, 'QR020', '2511040005', 'Planchado especial');

-- Insertar items para cada pedido (1-2 items por pedido)
INSERT INTO order_items (order_id, item_number, description, quantity, unit_price, total) VALUES
-- Pedido 1
(1, 1, 'Impresion DTF 50x70cm', 3, 150.00, 450.00),
-- Pedido 2
(2, 1, 'Sublimacion playera deportiva', 5, 136.10, 680.50),
-- Pedido 3
(3, 1, 'DTF premium', 4, 180.00, 720.00),
(3, 2, 'Planchado industrial', 1, 100.00, 100.00),
-- Pedido 4
(4, 1, 'Impresion DTF mediana', 3, 130.25, 390.75),
-- Pedido 5
(5, 1, 'Sublimacion + Planchado lote', 10, 125.00, 1250.00),
-- Pedido 6
(6, 1, 'Sublimacion estandar', 5, 116.10, 580.50),
-- Pedido 7
(7, 1, 'DTF chico', 2, 210.00, 420.00),
-- Pedido 8
(8, 1, 'Insignias texturizadas', 1, 180.50, 180.50),
-- Pedido 9
(9, 1, 'Sublimacion uniformes', 8, 115.00, 920.00),
-- Pedido 10
(10, 1, 'DTF grande', 6, 180.00, 1080.00),
(10, 2, 'Planchado especial', 2, 35.375, 70.75),
-- Pedido 11
(11, 1, 'DTF express urgente', 2, 170.00, 340.00),
-- Pedido 12
(12, 1, 'Planchado premium deluxe', 2, 140.25, 280.50),
-- Pedido 13
(13, 1, 'Sublimacion deportiva', 7, 127.14, 890.00),
-- Pedido 14
(14, 1, 'Sublimacion + Planchado gym', 6, 126.75, 760.50),
-- Pedido 15
(15, 1, 'Impresion DTF gran formato', 4, 130.00, 520.00),
-- Pedido 16
(16, 1, 'DTF + Planchado combo', 5, 130.15, 650.75),
-- Pedido 17
(17, 1, 'Sublimacion lote gimnasio', 12, 118.33, 1420.00),
-- Pedido 18
(18, 1, 'Insignias texturizadas + Planchado', 2, 145.25, 290.50),
-- Pedido 19
(19, 1, 'DTF personalizado', 3, 160.00, 480.00),
-- Pedido 20
(20, 1, 'Planchado especial premium', 3, 126.83, 380.50);

-- Actualizar tipo_usuario de los clientes
UPDATE clients SET tipo_usuario = 'Activo' WHERE phone IN ('60344144', '71234567', '72345678', '73456789', '74567890', '75678901', '76789012', '77890123', '78901234', '79012345');

-- Mensaje de confirmacion
SELECT 'Datos creados exitosamente - Noviembre 2025' as resultado;
SELECT COUNT(*) as total_clientes FROM clients;
SELECT COUNT(*) as total_pedidos FROM orders;
SELECT COUNT(*) as total_items FROM order_items;
SELECT MIN(order_date) as fecha_minima, MAX(order_date) as fecha_maxima FROM orders;
SELECT SUM(total) as total_ventas FROM orders;
