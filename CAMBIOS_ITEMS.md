# Cambios en Estructura de Items

## Resumen

Se ha actualizado la estructura de items del pedido para utilizar un sistema modular con 3 módulos independientes que se pueden combinar:

### Módulos Disponibles:

1. **Impresión**
   - Metraje (metros)
   - Costo por metro (Bs)
   - Subtotal = Metraje × Costo

2. **Planchado**
   - Cantidad (unidades)
   - Costo por unidad (Bs)
   - Subtotal = Cantidad × Costo

3. **Insignias Texturizadas**
   - Cantidad (unidades)
   - Costo por unidad (Bs)
   - Subtotal = Cantidad × Costo

**Total del Item** = Suma de los subtotales activos

## Cambios en Base de Datos

### Tabla `order_items` actualizada:

```sql
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
  
  -- Total del item
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Trigger Automático

Se agregó un trigger que calcula automáticamente los subtotales y el total:

```sql
CREATE TRIGGER trigger_calculate_item_totals
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_totals();
```

## Migración de Datos

Si ya tienes datos en la base de datos, ejecuta:

```bash
psql -U postgres -d bpm_system -f database/migration_items.sql
```

O reinicializa la base de datos:

```bash
cd backend
npm run init-db
```

## Cambios en Frontend

### OrderForm.jsx
- Se eliminó el campo "Descripción" del item
- Se agregaron checkboxes para seleccionar módulos activos
- Campos específicos para cada módulo aparecen solo cuando están activos
- Cálculo automático de subtotales en tiempo real

### OrderDetail.jsx
- Vista mejorada con tarjetas por item
- Cada módulo activo se muestra con borde de color distintivo:
  - Impresión: Azul
  - Planchado: Verde
  - Insignias: Púrpura
- Muestra cantidades y cálculos detallados

## Cambios en Backend

### order.controller.js
- Funciones `createOrder` y `updateOrder` actualizadas
- Se guardan todos los campos de los 3 módulos
- Soporte para módulos activos/inactivos

## Características

✅ Flexibilidad total: Puedes usar 1, 2 o 3 módulos por item
✅ Cálculos automáticos de subtotales
✅ Validación: Al menos un módulo debe estar activo
✅ UI intuitiva con checkboxes
✅ Visualización clara de cada módulo en detalles

## Ejemplo de Uso

### Item con 2 módulos:
```
☑ Impresión
  - Metraje: 5.5 metros
  - Costo: Bs. 20.00
  - Subtotal: Bs. 110.00

☑ Planchado
  - Cantidad: 10 unidades
  - Costo: Bs. 5.00
  - Subtotal: Bs. 50.00

☐ Insignias Texturizadas

TOTAL ITEM: Bs. 160.00
```

## Notas Importantes

- Los campos de descripción antiguos ya no se utilizan
- El trigger de BD calcula automáticamente los totales
- Los valores por defecto son 0 para todos los campos
- Se debe seleccionar al menos un módulo para crear un item válido
