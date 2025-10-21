# Manual de Usuario - Sistema BPM

## Índice

1. [Inicio de Sesión](#inicio-de-sesión)
2. [Dashboard](#dashboard)
3. [Gestión de Pedidos](#gestión-de-pedidos)
4. [Gestión de Clientes](#gestión-de-clientes)
5. [Productos](#productos)
6. [Reportes](#reportes)
7. [Usuarios (Solo Super Admin)](#usuarios)
8. [Configuración](#configuración)

---

## Inicio de Sesión

### Acceso al Sistema

1. Abre tu navegador web
2. Ingresa la dirección:
   - Local: `http://localhost:5173`
   - Red local: `http://[IP_SERVIDOR]:5173`

3. Ingresa tus credenciales:
   - **Usuario**: Tu nombre de usuario
   - **Contraseña**: Tu contraseña

4. Clic en "Iniciar Sesión"

### Credenciales Iniciales

```
Usuario: admin
Contraseña: admin123
```

⚠️ **Cambia tu contraseña** después del primer inicio de sesión.

---

## Dashboard

El Dashboard es la pantalla principal que muestra:

### Estadísticas Generales

- **Ventas Hoy**: Total de ventas del día actual
- **Ventas del Mes**: Total de ventas del mes en curso
- **Ventas del Año**: Total de ventas del año
- **Pagos Pendientes**: Monto y cantidad de pedidos sin pagar

### Últimos Pedidos

Lista de los 10 pedidos más recientes con:
- Nombre del cliente
- Número de recibo
- Total
- Estado de pago

### Ventas por Tipo de Trabajo

Gráfico que muestra la distribución de ventas por:
- DTF
- Sublimación
- Planchado
- Insignias Texturizadas
- Combinaciones

### Acciones Rápidas

Botones de acceso directo a:
- Crear Nuevo Pedido
- Ver Clientes
- Ver Reportes
- Ver Productos

---

## Gestión de Pedidos

### Ver Pedidos

**Ruta**: Menú → Pedidos

Funcionalidades:
- **Buscar**: Por cliente o número de recibo
- **Filtrar** por:
  - Estado: Activo, Completado, Cancelado
  - Pago: Pagado, Parcial, Pendiente

### Crear Nuevo Pedido

1. Clic en **"Nuevo Pedido"**

2. **Información del Cliente**:
   - Nombre del cliente (requerido)
   - Fecha del pedido

3. **Detalles del Trabajo**:
   - Tipo de trabajo (requerido):
     - DTF
     - Sublimación
     - Planchado
     - DTF + Planchado
     - Sublimación + Planchado
     - Insignia Texturizada
     - Insignia T. + Planchado
   - Descripción general

4. **Items del Pedido**:
   - Clic en "Agregar Item" para añadir productos
   - Para cada item:
     - Descripción (requerido)
     - Cantidad
     - Precio unitario
     - Total (se calcula automáticamente)

5. **Información de Pago**:
   - Tipo de pago: QR, Efectivo, Transferencia, Pendiente
   - Banco (si aplica)
   - Estado de pago
   - Notas adicionales

6. Clic en **"Crear Pedido"**

### Ver Detalles del Pedido

1. En la lista de pedidos, clic en el ícono de ojo 👁️
2. Verás:
   - Información completa del pedido
   - Items con cantidades y precios
   - Código QR generado automáticamente
   - Estado actual

### Editar Pedido

1. En los detalles del pedido, clic en **"Editar"**
2. Modifica los campos necesarios
3. Clic en **"Actualizar"**

### Descargar Recibo en PDF

1. Desde la lista: Clic en el ícono de descarga 📥
2. Desde los detalles: Clic en **"Descargar PDF"**

El PDF incluye:
- Información de la empresa
- Datos del cliente
- Items del pedido
- Total
- Código QR

### Cancelar Pedido

1. En los detalles del pedido, clic en **"Cancelar"**
2. Confirmar la acción
3. El pedido cambiará a estado "Cancelado"

---

## Gestión de Clientes

### Ver Clientes

**Ruta**: Menú → Clientes

- Lista de todos los clientes registrados
- Búsqueda por nombre, teléfono o email
- Vista en tarjetas con información clave

### Crear Nuevo Cliente

1. Clic en **"Nuevo Cliente"**
2. Completar el formulario:
   - Nombre (requerido)
   - Teléfono
   - Email
   - Dirección
   - Notas
3. Clic en **"Crear"**

### Editar Cliente

1. En la tarjeta del cliente, clic en el ícono de editar ✏️
2. Modificar los datos
3. Clic en **"Actualizar"**

### Eliminar Cliente

1. En la tarjeta del cliente, clic en el ícono de eliminar 🗑️
2. Confirmar la acción

⚠️ **Nota**: No se pueden eliminar clientes con pedidos asociados.

---

## Productos

### Ver Productos

**Ruta**: Menú → Productos

Lista de productos, bobinas e inventario:
- Nombre del producto
- Categoría
- Stock en metros
- Costo por metro
- Estado (Activo/Inactivo)

### Crear Nuevo Producto

1. Clic en **"Nuevo Producto"**
2. Completar:
   - Nombre (requerido)
   - Descripción
   - Stock en metros
   - Costo por metro
   - Categoría
3. Clic en **"Crear"**

### Editar Producto

1. Clic en el ícono de editar ✏️
2. Modificar los datos
3. Clic en **"Actualizar"**

### Desactivar Producto

1. Clic en el ícono de eliminar 🗑️
2. Confirmar
3. El producto se marca como inactivo

---

## Reportes

### Ver Reportes

**Ruta**: Menú → Reportes

### Filtros de Fecha

- Selecciona rango de fechas (Desde - Hasta)
- Clic en **"Actualizar Reportes"**

### Resumen de Ventas

Muestra:
- Total de ventas en el período
- Cantidad de pedidos

### Ventas por Tipo de Trabajo

Gráfico de barras mostrando:
- Tipo de trabajo
- Total vendido
- Cantidad de pedidos
- Porcentaje respecto al total

### Ventas por Forma de Pago

Distribución de ventas por:
- QR
- Efectivo
- Transferencia
- Pago Pendiente

### Top 10 Clientes

Tabla con:
- Nombre del cliente
- Contacto
- Total de pedidos
- Total gastado
- Fecha del último pedido

### Ventas Mensuales

Tabla del año actual con:
- Mes
- Cantidad de pedidos
- Total de ventas
- Promedio por pedido

---

## Usuarios

**⚠️ Solo disponible para Super Administradores**

**Ruta**: Menú → Usuarios

### Ver Usuarios

Lista de todos los usuarios del sistema con:
- Nombre completo
- Usuario
- Email
- Rol (Super Admin / Colaborador)
- Estado (Activo / Inactivo)

### Crear Nuevo Usuario

1. Clic en **"Nuevo Usuario"**
2. Completar:
   - Usuario (requerido)
   - Nombre completo (requerido)
   - Email (requerido)
   - Contraseña (requerido, mínimo 6 caracteres)
   - Rol:
     - **Super Admin**: Acceso completo
     - **Colaborador**: Sin acceso a usuarios ni configuración avanzada
3. Clic en **"Crear Usuario"**

### Desactivar Usuario

1. Clic en el ícono de eliminar 🗑️
2. Confirmar

⚠️ **Nota**: No puedes desactivar tu propio usuario.

---

## Configuración

**Ruta**: Menú → Usuario → Configuración

### Ver Perfil

Muestra tu información:
- Usuario
- Nombre completo
- Email
- Rol

### Cambiar Contraseña

1. Ir a la sección "Seguridad"
2. Completar:
   - Contraseña actual
   - Nueva contraseña (mínimo 6 caracteres)
   - Confirmar nueva contraseña
3. Clic en **"Cambiar Contraseña"**

---

## Diferencias entre Roles

### Super Administrador

✅ Acceso completo a todas las funcionalidades:
- Crear, editar y eliminar pedidos
- Gestionar clientes
- Gestionar productos
- Ver todos los reportes
- **Crear y gestionar usuarios**
- Configurar el sistema

### Colaborador

✅ Puede:
- Crear y ver pedidos
- Gestionar clientes
- Ver productos
- Ver reportes básicos
- Cambiar su propia contraseña

❌ No puede:
- Crear o gestionar usuarios
- Acceder a configuración avanzada

---

## Consejos y Mejores Prácticas

### Para Pedidos

1. **Verifica los datos** antes de crear un pedido
2. **Usa el código QR** para identificación rápida
3. **Actualiza el estado de pago** cuando recibas pagos
4. **Descarga el PDF** y envíalo al cliente como recibo

### Para Clientes

1. **Completa toda la información** disponible
2. **Mantén actualizado** el teléfono y email
3. **Usa las notas** para recordatorios o preferencias

### Para Productos

1. **Actualiza el stock** regularmente
2. **Usa categorías** para mejor organización
3. **Registra costos** para control financiero

### Respaldos

1. **Descarga reportes** periódicamente
2. **Exporta datos** importantes
3. El administrador debe hacer **backup de la base de datos**

---

## Atajos de Teclado

- `Ctrl + K` o `Cmd + K`: Búsqueda rápida (próximamente)
- `Esc`: Cerrar modales
- `Tab`: Navegar entre campos

---

## Soporte

Si encuentras algún problema o tienes dudas:

1. Verifica que estés usando la **última versión** del sistema
2. **Recarga la página** (F5) para refrescar datos
3. Contacta al administrador del sistema
4. Revisa este manual para instrucciones específicas

---

**¡Gracias por usar el Sistema BPM!** 🎉
