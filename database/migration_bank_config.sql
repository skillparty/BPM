-- Tabla de configuración bancaria para QR de pagos
CREATE TABLE IF NOT EXISTS bank_config (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  account_holder VARCHAR(200) NOT NULL,
  ci_nit VARCHAR(20) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'ahorro',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración de BNB
INSERT INTO bank_config (
  bank_name,
  account_holder,
  ci_nit,
  account_number,
  account_type,
  is_active
) VALUES (
  'BNB',
  'Jose Alejandro Rollano Revollo',
  '9352533',
  '4074006253664577',
  'ahorro',
  true
);

-- Comentario
COMMENT ON TABLE bank_config IS 'Configuración de cuentas bancarias para generación de QR de pagos';
