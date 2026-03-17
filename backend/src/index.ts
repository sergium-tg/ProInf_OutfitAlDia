import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();

// Configuración del Driver Adapter para Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware de Autenticación JWT [cite: 39]
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// HU-05: Registro de usuario [cite: 29]
// POST /auth/register [cite: 32]
app.post('/auth/register', async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  // Validación de formato estándar de correo [cite: 34]
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: "Formato de correo inválido" });

  // Validación de seguridad de contraseña (min 8 caracteres, números y letras) [cite: 35]
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) return res.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres, números y letras" });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre_usuario, email, password_hash }
    });
    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (error: any) {
    // Impedir registros con correos ya existentes [cite: 36]
    if (error.code === 'P2002') return res.status(400).json({ error: "El correo ya está registrado" });
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// HU-06: Autenticación [cite: 37]
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.usuario.findUnique({ where: { email } });

  // Mensaje genérico ("Credenciales incorrectas") por seguridad [cite: 43]
  if (!user || !user.activo) return res.status(401).json({ error: "Credenciales incorrectas" });

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return res.status(401).json({ error: "Credenciales incorrectas" });

  // Retornar un token de sesión válido [cite: 42]
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, nombre_usuario: user.nombre_usuario, email: user.email } });
});

// HU-07: Edición de Perfil [cite: 44]
// PATCH /user/profile [cite: 47]
app.patch('/user/profile', authenticateToken, async (req: any, res) => {
  const { nombre_usuario, email } = req.body;
  try {
    const updatedUser = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { nombre_usuario, email }
    });
    res.json({ message: "Perfil actualizado", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// HU-09: Eliminación de cuenta [cite: 53]
app.delete('/user/account', authenticateToken, async (req: any, res) => {
  try {
    // Borrado lógico (estado: inactivo)
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { activo: false }
    });
    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la cuenta" });
  }
});

app.listen(3000, () => console.log('Backend corriendo en el puerto 3000'));
