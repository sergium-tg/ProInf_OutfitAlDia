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
      user: { 
        id: usuario.id, 
        nombre_usuario: usuario.nombre_usuario, 
        email: usuario.email,
        dias_no_rep: usuario.dias_no_rep,
        dias_olvido: usuario.dias_olvido
      } 
    });
  } catch (error) { 
    res.status(500).json({ error: 'Error interno del servidor' }); 
  }
});

// ==========================================
// HU-07: Modificación de Perfil 
// ==========================================
app.patch('/user/profile', authenticateToken, async (req: any, res: any) => {
  const { nombre_usuario, password, dias_no_rep, dias_olvido } = req.body;
  
  try {
    const data: any = {};
    
    if (nombre_usuario) data.nombre_usuario = nombre_usuario;
    
    if (password) {
      if (!validarPassword(password)) {
        return res.status(400).json({ 
          error: 'La nueva contraseña no cumple los requisitos.' 
        });
      }
      data.password_hash = await bcrypt.hash(password, 10);
    }

    if (dias_no_rep !== undefined && !isNaN(dias_no_rep)) data.dias_no_rep = Number(dias_no_rep);
    if (dias_olvido !== undefined && !isNaN(dias_olvido)) data.dias_olvido = Number(dias_olvido);

    const actualizado = await prisma.usuario.update({
      where: { id: req.user.id },
      data
    });
    
    res.json({ 
      user: { 
        id: actualizado.id, 
        nombre_usuario: actualizado.nombre_usuario, 
        email: actualizado.email,
        dias_no_rep: actualizado.dias_no_rep,
        dias_olvido: actualizado.dias_olvido
      } 
    });
  } catch (error) { 
    res.status(500).json({ error: 'Error al actualizar el perfil' }); 
  }
});

// ==========================================
// HU-08: Cerrar Sesión (Logout)
// ==========================================
app.post('/auth/logout', authenticateToken, (req: any, res: any) => {
  res.json({ message: 'Sesión cerrada correctamente desde el cliente.' });
});

// ==========================================
// HU-09: Borrado de Usuario 
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
// RUTAS DE PRENDAS
// ==========================================

// Obtener todas las prendas del usuario logueado
app.get('/prendas', authenticateToken, async (req: any, res: any) => {
  try {
    const prendas = await prisma.prendas.findMany({
      where: { usuario_id: req.user.id },
      include: { 
        historial: { 
          orderBy: { fecha_uso: 'desc' }, 
          take: 1 
        } 
      }
    });
    res.json(prendas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el listado de prendas' });
  }
});

// NUEVO: Obtener una prenda específica (Para rellenar el formulario de edición)
app.get('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const prenda = await prisma.prendas.findFirst({
      where: { 
        id: Number(id),
        usuario_id: req.user.id 
      }
    });
    
    if (!prenda) return res.status(404).json({ error: 'Prenda no encontrada' });
    
    res.json(prenda);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los detalles de la prenda' });
  }
});

// Crear una nueva prenda
app.post('/prendas', authenticateToken, async (req: any, res: any) => {
  const { foto_url, categoria, color, estilo, ocasion } = req.body;
  
  try {
    const nuevaPrenda = await prisma.prendas.create({
      data: {
        foto_url,
        categoria,
        color,
        estilo,
        ocasion,
        usuario_id: req.user.id
      }
    });
    res.status(201).json(nuevaPrenda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la prenda en la base de datos' });
  }
});

// Editar una prenda existente
app.put('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { foto_url, categoria, color, estilo, ocasion, conceptual, comprar } = req.body;
  
  try {
    const actualizada = await prisma.prendas.updateMany({
      where: { 
        id: Number(id), 
        usuario_id: req.user.id 
      },
      data: { foto_url, categoria, color, estilo, ocasion, conceptual, comprar }
    });

    if (actualizada.count === 0) {
      return res.status(404).json({ error: 'Prenda no encontrada o no tienes permisos' });
    }
    
    res.json({ message: 'Prenda actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la prenda' });
  }
});

// Eliminar una prenda
app.delete('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const eliminada = await prisma.prendas.deleteMany({
      where: { 
        id: Number(id), 
        usuario_id: req.user.id 
      }
    });

    if (eliminada.count === 0) {
      return res.status(404).json({ error: 'Prenda no encontrada o no tienes permisos' });
    }

    res.json({ message: 'Prenda eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la prenda' });
  }
});

// Registrar Uso Diario
app.post('/prendas/:id/usar', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const nuevoUso = await prisma.historial_prenda.create({
      data: { prenda_id: Number(id) }
    });
    res.status(201).json(nuevoUso);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el uso de la prenda' });
  }
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en el puerto ${PORT}`));