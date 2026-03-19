import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

// Configuración de Prisma con el adaptador de PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_outfit_al_dia_123';

app.use(cors());
app.use(express.json());

// ==========================================
// FUNCIÓN DE VALIDACIÓN DE CONTRASEÑA
// ==========================================
const validarPassword = (password: string) => {
  // 8+ caracteres, minúscula, mayúscula, número y carácter especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
};

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token inválido o ha expirado.' });
    req.user = user;
    next();
  });
};

// ==========================================
// HU-05: Creación de Usuario (Registro)
// ==========================================
app.post('/auth/register', async (req: any, res: any) => {
  const { email, password } = req.body;

  // Validación de seguridad de la contraseña
  if (!validarPassword(password)) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const nombreSugerido = email.split('@')[0];
    
    await prisma.usuario.create({
      data: { 
        nombre_usuario: nombreSugerido, 
        email, 
        password_hash: hashedPassword 
      }
    });
    
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
  }
});

// ==========================================
// HU-06: Inicio de Sesión (Login)
// ==========================================
app.post('/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    
    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      user: { id: usuario.id, nombre_usuario: usuario.nombre_usuario, email: usuario.email } 
    });
  } catch (error) { 
    res.status(500).json({ error: 'Error interno del servidor' }); 
  }
});

// ==========================================
// HU-07: Modificación de Perfil (Actualizar datos o contraseña)
// ==========================================
app.patch('/user/profile', authenticateToken, async (req: any, res: any) => {
  const { nombre_usuario, password } = req.body;
  
  try {
    const data: any = {};
    
    if (nombre_usuario) {
      data.nombre_usuario = nombre_usuario;
    }
    
    if (password) {
      // Aplicar la misma validación estricta al actualizar la contraseña
      if (!validarPassword(password)) {
        return res.status(400).json({ 
          error: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' 
        });
      }
      data.password_hash = await bcrypt.hash(password, 10);
    }

    const actualizado = await prisma.usuario.update({
      where: { id: req.user.id },
      data
    });
    
    res.json({ 
      user: { id: actualizado.id, nombre_usuario: actualizado.nombre_usuario, email: actualizado.email } 
    });
  } catch (error) { 
    res.status(500).json({ error: 'Error al actualizar el perfil' }); 
  }
});

// ==========================================
// HU-08: Cerrar Sesión (Logout)
// ==========================================
// Al utilizar JWT de forma stateless, el logout se maneja en el cliente eliminando el token.
// Se puede proveer este endpoint opcional para confirmación de la solicitud.
app.post('/auth/logout', authenticateToken, (req: any, res: any) => {
  res.json({ message: 'Sesión cerrada correctamente desde el cliente.' });
});

// ==========================================
// HU-09: Borrado de Usuario (Eliminación Física)
// ==========================================
app.delete('/user/account', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.usuario.delete({ 
      where: { id: req.user.id } 
    });
    res.json({ message: 'Cuenta eliminada definitivamente de la base de datos' });
  } catch (error) { 
    res.status(500).json({ error: 'Error al eliminar la cuenta' }); 
  }
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en el puerto ${PORT}`));