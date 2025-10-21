# Sistema de Gestión BPM

Sistema completo para gestión de pedidos, recibos e inventario para empresa de DTF, sublimación, planchado e insignias texturizadas.

## Tecnologías

- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT

## Estructura del Proyecto

```
BPM/
├── backend/          # API REST con Express
├── frontend/         # Aplicación React
└── database/         # Scripts SQL y migraciones
```

## Instalación

### Requisitos previos

- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- npm o yarn

### Configuración de Base de Datos

1. Crear base de datos PostgreSQL:
```bash
psql -U postgres
CREATE DATABASE bpm_system;
```

2. Ejecutar scripts de inicialización:
```bash
psql -U postgres -d bpm_system -f database/init.sql
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run dev
```

El backend correrá en `http://localhost:5099`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend correrá en `http://localhost:5089`

## Usuarios del Sistema

### 1. Super Usuario
- Acceso completo al sistema
- Gestión de usuarios
- Configuración del sistema
- Todos los reportes y estadísticas

### 2. Colaboradores
- Gestión de pedidos y recibos
- Consulta de clientes
- Reportes limitados
- Sin acceso a configuración

## Funcionalidades

- ✅ Gestión de clientes
- ✅ Creación de pedidos/recibos
- ✅ Tipos de trabajo: DTF, Sublimación, Planchado, Insignias
- ✅ Control de pagos (QR, Efectivo, Transferencia)
- ✅ Generación de códigos QR
- ✅ Impresión de recibos en PDF
- ✅ Gestión de bobinas/productos
- ✅ Reportes y estadísticas
- ✅ Dashboard con métricas

## Acceso en Red Local

El sistema está configurado para funcionar en red local. Desde otras computadoras en la misma red, acceder usando la IP del servidor:

```
http://[IP_DEL_SERVIDOR]:5173
```

## Credenciales Iniciales

**Super Usuario:**
- Usuario: `admin`
- Contraseña: `admin123` (cambiar en el primer acceso)

## Soporte

Para consultas o problemas, contactar al equipo de desarrollo.
