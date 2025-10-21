import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Inicializando base de datos...');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../../..', 'database', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL
    await client.query(sql);

    console.log('✅ Tablas creadas exitosamente');

    // Crear usuario admin con contraseña hasheada correctamente
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      UPDATE users 
      SET password = $1 
      WHERE username = 'admin'
    `, [hashedPassword]);

    console.log('✅ Usuario admin actualizado');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('\n🎉 Base de datos inicializada correctamente\n');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log('Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default initDatabase;
