# Guía de Instalación - Sistema BPM

Esta guía te ayudará a instalar y configurar el sistema BPM en tu red local.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior): [Descargar Node.js](https://nodejs.org/)
- **PostgreSQL** (v14 o superior): [Descargar PostgreSQL](https://www.postgresql.org/download/)
- **Git** (opcional): Para clonar el repositorio

### Verificar Instalaciones

```bash
node --version
npm --version
psql --version
```

## Paso 1: Configurar PostgreSQL

### 1.1 Crear Base de Datos

Abre la terminal de PostgreSQL (psql) o utiliza pgAdmin:

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE bpm_system;

# Salir
\q
```

### 1.2 Verificar Conexión

```bash
psql -U postgres -d bpm_system -c "SELECT version();"
```

## Paso 2: Configurar Backend

### 2.1 Instalar Dependencias

```bash
cd backend
npm install
```

### 2.2 Configurar Variables de Entorno

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```env
PORT=5099
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bpm_system
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql

JWT_SECRET=cambiar_por_clave_secreta_muy_segura
JWT_EXPIRES_IN=7d

HOST=0.0.0.0

COMPANY_NAME=BPM
COMPANY_ADDRESS=Tu mejor aliado
COMPANY_PHONE=Calle Av. Santa Cruz N°1517, entre Pedro Blanco y Beni
COMPANY_WHATSAPP=Santa cruz - Bolivia
```

### 2.3 Inicializar Base de Datos

Este comando creará todas las tablas y datos iniciales:

```bash
npm run init-db
```

Deberías ver:
```
✅ Tablas creadas exitosamente
✅ Usuario admin actualizado

📋 Credenciales de acceso:
   Usuario: admin
   Contraseña: admin123
```

### 2.4 Iniciar Servidor Backend

```bash
npm run dev
```

El backend estará disponible en: `http://localhost:5099`

## Paso 3: Configurar Frontend

### 3.1 Instalar Dependencias

Abre una nueva terminal:

```bash
cd frontend
npm install
```

### 3.2 Iniciar Servidor Frontend

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5089`

## Paso 4: Acceder al Sistema

### 4.1 Desde la Computadora Local

Abre tu navegador y ve a: `http://localhost:5089`

### 4.2 Desde Otra Computadora en la Red Local

1. **Obtén la IP de tu computadora:**

   **En Windows:**
   ```cmd
   ipconfig
   ```
   Busca "Dirección IPv4" (ejemplo: `192.168.1.100`)

   **En Mac/Linux:**
   ```bash
   ifconfig
   # o
   ip addr show
   ```

2. **Accede desde otra computadora:**
   
   En cualquier navegador de la red local, ve a:
   ```
   http://[IP_DE_TU_COMPUTADORA]:5089
   ```
   
   Ejemplo: `http://192.168.1.100:5089`

### 4.3 Credenciales Iniciales

```
Usuario: admin
Contraseña: admin123
```

**⚠️ IMPORTANTE:** Cambia la contraseña del administrador después del primer inicio de sesión.

## Configuración de Firewall

### Windows

1. Abre "Firewall de Windows Defender"
2. Clic en "Configuración avanzada"
3. Reglas de entrada → Nueva regla
4. Puerto → TCP → Puertos específicos: `5099, 5089`
5. Permitir la conexión
6. Aplicar a todos los perfiles
7. Nombre: "BPM Sistema"

### Mac

```bash
# El sistema debería solicitar permiso automáticamente
# Si no, ejecuta:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Linux (UFW)

```bash
sudo ufw allow 5099/tcp
sudo ufw allow 5089/tcp
sudo ufw reload
```

## Solución de Problemas

### El backend no se conecta a PostgreSQL

1. Verifica que PostgreSQL esté ejecutándose:
   ```bash
   # Windows
   services.msc  # Buscar PostgreSQL
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verifica las credenciales en el archivo `.env`
3. Asegúrate de que el puerto 5432 no esté bloqueado

### No puedo acceder desde otra computadora

1. Verifica que ambas computadoras estén en la misma red
2. Desactiva temporalmente el firewall para probar
3. Usa `ping [IP]` para verificar conectividad
4. Asegúrate de usar `HOST=0.0.0.0` en el `.env` del backend

### Error "Cannot find module"

```bash
# Elimina node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Puerto ya en uso

Si el puerto 5099 o 5089 están ocupados:

1. Cambia el puerto en `.env` (backend) o `vite.config.js` (frontend)
2. O cierra la aplicación que está usando el puerto

## Mantenimiento

### Backup de Base de Datos

```bash
# Crear backup
pg_dump -U postgres bpm_system > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres -d bpm_system < backup_YYYYMMDD.sql
```

### Actualizar el Sistema

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Producción

Para usar en producción:

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Los archivos estarán en frontend/dist
# Configurar con nginx, Apache, o servidor web
```

## Soporte

Para problemas o consultas:
- Revisa los logs del servidor: Los errores aparecen en la terminal
- Verifica la consola del navegador (F12)
- Asegúrate de tener las versiones correctas de Node.js y PostgreSQL

---

**¡Instalación completada!** 🎉

El sistema BPM está listo para usar en tu red local.
