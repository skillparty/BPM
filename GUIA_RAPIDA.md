# Guía Rápida de Inicio - Sistema BPM

## 🚀 Inicio Rápido (5 minutos)

### 1. Instalar PostgreSQL
- Descarga e instala PostgreSQL desde: https://www.postgresql.org/download/
- Recuerda la contraseña que configures para el usuario `postgres`

### 2. Crear Base de Datos
```bash
# Abre psql o pgAdmin y ejecuta:
CREATE DATABASE bpm_system;
```

### 3. Configurar Backend
```bash
# Navega a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env copiando el ejemplo
cp .env.example .env

# Edita .env y coloca tu contraseña de PostgreSQL
# DB_PASSWORD=tu_contraseña_aqui

# Inicializar base de datos
npm run init-db

# Iniciar servidor
npm run dev
```

✅ Backend corriendo en: http://localhost:5099

### 4. Configurar Frontend
```bash
# Abre otra terminal y navega a frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

✅ Frontend corriendo en: http://localhost:5173

### 5. Acceder al Sistema
- Abre tu navegador en: http://localhost:5173
- Usuario: `admin`
- Contraseña: `admin123`

---

## 📱 Acceso desde Red Local

### Obtener IP de tu computadora:

**Windows:**
```cmd
ipconfig
```
Busca "IPv4 Address" (ej: 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig | grep inet
```

### Acceder desde otra PC:
Abre el navegador en: `http://TU_IP:5173`

Ejemplo: `http://192.168.1.100:5173`

---

## 🔧 Comandos Útiles

### Backend
```bash
# Desarrollo
npm run dev

# Producción
npm start

# Reinicializar BD
npm run init-db
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

---

## 📋 Estructura de Carpetas

```
BPM/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── config/      # Configuración de BD
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── routes/      # Endpoints API
│   │   ├── middleware/  # Autenticación
│   │   └── server.js    # Servidor principal
│   └── package.json
│
├── frontend/            # App React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── context/     # Estado global
│   │   └── services/    # Llamadas API
│   └── package.json
│
├── database/
│   └── init.sql        # Script de inicialización
│
└── README.md
```

---

## 🛠️ Solución Rápida de Problemas

### Error: "Cannot connect to database"
```bash
# Verifica que PostgreSQL esté corriendo
# Windows: services.msc → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Verifica credenciales en backend/.env
```

### Error: "Port already in use"
```bash
# Cambia el puerto en:
# Backend: backend/.env → PORT=5100
# Frontend: frontend/vite.config.js → port: 5174
```

### Error: "Module not found"
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### No puedo acceder desde otra PC
```bash
# 1. Verifica firewall
# 2. Asegúrate que backend/.env tenga: HOST=0.0.0.0
# 3. Ambas PCs deben estar en la misma red
```

---

## 📊 Funcionalidades Principales

✅ **Gestión de Pedidos/Recibos**
- Crear, editar, ver pedidos
- Generar PDF con código QR
- Control de pagos

✅ **Gestión de Clientes**
- CRUD completo
- Historial de pedidos

✅ **Productos e Inventario**
- Control de stock
- Costos por producto

✅ **Reportes**
- Dashboard con métricas
- Ventas por período
- Top clientes
- Reportes por tipo de trabajo

✅ **Usuarios**
- Super Admin y Colaboradores
- Autenticación JWT
- Control de permisos

---

## 📞 Contacto y Soporte

Para más información consulta:
- `INSTALACION.md` - Guía completa de instalación
- `MANUAL_USUARIO.md` - Manual detallado de uso
- `README.md` - Información general del proyecto

---

**¡Sistema listo para usar!** 🎉
