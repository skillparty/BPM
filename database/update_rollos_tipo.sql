-- Agregar campo tipo a la tabla rollos
ALTER TABLE rollos ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'SUBLIM';

-- Actualizar los rollos existentes como SUBLIM
UPDATE rollos SET tipo = 'SUBLIM';

-- Modificar la primary key para incluir tipo
ALTER TABLE rollos DROP CONSTRAINT IF EXISTS rollos_pkey;
ALTER TABLE rollos ADD PRIMARY KEY (numero_rollo, tipo);

-- Actualizar índice
DROP INDEX IF EXISTS idx_rollos_activos;
CREATE INDEX idx_rollos_activos ON rollos(numero_rollo, tipo) WHERE is_active = true;

-- Actualizar constraint de número de rollo
ALTER TABLE rollos DROP CONSTRAINT IF EXISTS rollos_numero_rollo_check;
ALTER TABLE rollos ADD CONSTRAINT rollos_numero_rollo_check CHECK (numero_rollo >= 1 AND numero_rollo <= 16);

-- Agregar constraint para el tipo
ALTER TABLE rollos ADD CONSTRAINT rollos_tipo_check CHECK (tipo IN ('DTF', 'SUBLIM'));

-- Insertar 16 rollos para DTF
INSERT INTO rollos (numero_rollo, tipo, metraje_total, metraje_disponible, metraje_usado, is_active, notas)
SELECT 
    numero_rollo,
    'DTF' as tipo,
    105.00 as metraje_total,
    105.00 as metraje_disponible,
    0.00 as metraje_usado,
    true as is_active,
    'Rollo DTF inicializado' as notas
FROM generate_series(1, 16) as numero_rollo
ON CONFLICT DO NOTHING;

-- Actualizar tabla rollo_historial para incluir tipo
ALTER TABLE rollo_historial ADD COLUMN IF NOT EXISTS tipo_rollo VARCHAR(10) DEFAULT 'SUBLIM';

-- Actualizar foreign key en rollo_historial
ALTER TABLE rollo_historial DROP CONSTRAINT IF EXISTS rollo_historial_numero_rollo_fkey;
ALTER TABLE rollo_historial ADD CONSTRAINT rollo_historial_numero_rollo_tipo_fkey 
    FOREIGN KEY (numero_rollo, tipo_rollo) REFERENCES rollos(numero_rollo, tipo);

-- Actualizar función de descuento de metraje
DROP FUNCTION IF EXISTS descontar_metraje_rollo(INTEGER, NUMERIC, INTEGER, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION descontar_metraje_rollo(
    p_numero_rollo INTEGER,
    p_tipo_rollo VARCHAR,
    p_metraje NUMERIC,
    p_order_id INTEGER,
    p_usuario_id INTEGER,
    p_notas TEXT
)
RETURNS TABLE(success BOOLEAN, mensaje TEXT, metraje_disponible NUMERIC) AS $$
DECLARE
    v_metraje_actual NUMERIC;
BEGIN
    -- Verificar metraje disponible
    SELECT r.metraje_disponible INTO v_metraje_actual
    FROM rollos r
    WHERE r.numero_rollo = p_numero_rollo 
      AND r.tipo = p_tipo_rollo
      AND r.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Rollo no encontrado o inactivo'::TEXT, 0::NUMERIC;
        RETURN;
    END IF;

    IF v_metraje_actual < p_metraje THEN
        RETURN QUERY SELECT false, 
            format('Metraje insuficiente. Disponible: %s m, Requerido: %s m', 
                   v_metraje_actual, p_metraje)::TEXT,
            v_metraje_actual;
        RETURN;
    END IF;

    -- Descontar metraje
    UPDATE rollos
    SET metraje_disponible = metraje_disponible - p_metraje,
        metraje_usado = metraje_usado + p_metraje,
        ultima_actualizacion = NOW()
    WHERE numero_rollo = p_numero_rollo AND tipo = p_tipo_rollo;

    -- Registrar en historial
    INSERT INTO rollo_historial (numero_rollo, tipo_rollo, metraje_usado, order_id, usuario_id, notas)
    VALUES (p_numero_rollo, p_tipo_rollo, p_metraje, p_order_id, p_usuario_id, 
            COALESCE(p_notas, format('Descuento de %s m', p_metraje)));

    RETURN QUERY SELECT true, 
        format('Metraje descontado exitosamente. Nuevo disponible: %s m', 
               v_metraje_actual - p_metraje)::TEXT,
        (v_metraje_actual - p_metraje)::NUMERIC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION descontar_metraje_rollo IS 'Descuenta metraje de un rollo específico por tipo';
