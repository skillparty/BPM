-- Paso 1: Agregar columna tipo
ALTER TABLE rollos ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'SUBLIM';
UPDATE rollos SET tipo = 'SUBLIM' WHERE tipo IS NULL;
ALTER TABLE rollos ALTER COLUMN tipo SET NOT NULL;

-- Paso 2: Agregar tipo a rollo_historial
ALTER TABLE rollo_historial ADD COLUMN IF NOT EXISTS tipo_rollo VARCHAR(10) DEFAULT 'SUBLIM';
UPDATE rollo_historial SET tipo_rollo = 'SUBLIM' WHERE tipo_rollo IS NULL;
ALTER TABLE rollo_historial ALTER COLUMN tipo_rollo SET NOT NULL;

-- Paso 3: Crear constraint unique en rollos para (numero_rollo, tipo)
ALTER TABLE rollos ADD CONSTRAINT rollos_numero_tipo_unique UNIQUE (numero_rollo, tipo);

-- Paso 4: Agregar constraint de tipo
ALTER TABLE rollos ADD CONSTRAINT rollos_tipo_check CHECK (tipo IN ('DTF', 'SUBLIM'));

-- Paso 5: Insertar 16 rollos para DTF
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
ON CONFLICT (numero_rollo, tipo) DO NOTHING;

-- Paso 6: Actualizar función de descuento
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
