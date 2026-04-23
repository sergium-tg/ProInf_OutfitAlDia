import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_outfit_al_dia_123';

app.use(cors());
app.use(express.json());

const validarPassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
};

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

// --- AUTENTICACIÓN Y PERFIL ---
app.post('/auth/register', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!validarPassword(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const nombreSugerido = email.split('@')[0];
    await prisma.usuario.create({
      data: { nombre_usuario: nombreSugerido, email, password_hash: hashedPassword }
    });
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
  }
});

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
      user: { id: usuario.id, nombre_usuario: usuario.nombre_usuario, email: usuario.email, dias_no_rep: usuario.dias_no_rep, dias_olvido: usuario.dias_olvido } 
    });
  } catch (error) { res.status(500).json({ error: 'Error interno del servidor' }); }
});

app.patch('/user/profile', authenticateToken, async (req: any, res: any) => {
  const { nombre_usuario, password, dias_no_rep, dias_olvido } = req.body;
  try {
    const data: any = {};
    if (nombre_usuario) data.nombre_usuario = nombre_usuario;
    if (password) {
      if (!validarPassword(password)) return res.status(400).json({ error: 'La nueva contraseña no cumple los requisitos.' });
      data.password_hash = await bcrypt.hash(password, 10);
    }
    if (dias_no_rep !== undefined && !isNaN(dias_no_rep)) data.dias_no_rep = Number(dias_no_rep);
    if (dias_olvido !== undefined && !isNaN(dias_olvido)) data.dias_olvido = Number(dias_olvido);

    const actualizado = await prisma.usuario.update({ where: { id: req.user.id }, data });
    res.json({ user: { id: actualizado.id, nombre_usuario: actualizado.nombre_usuario, email: actualizado.email, dias_no_rep: actualizado.dias_no_rep, dias_olvido: actualizado.dias_olvido } });
  } catch (error) { res.status(500).json({ error: 'Error al actualizar el perfil' }); }
});

app.post('/auth/logout', authenticateToken, (req: any, res: any) => {
  res.json({ message: 'Sesión cerrada correctamente.' });
});

app.delete('/user/account', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.usuario.delete({ where: { id: req.user.id } });
    res.json({ message: 'Cuenta eliminada definitivamente' });
  } catch (error) { res.status(500).json({ error: 'Error al eliminar la cuenta' }); }
});

// --- PRENDAS ---
app.get('/prendas', authenticateToken, async (req: any, res: any) => {
  try {
    const { categoria, color } = req.query;
    const filtros: any = { usuario_id: req.user.id };
    
    if (categoria) filtros.categoria = String(categoria);
    if (color) filtros.color = { contains: String(color), mode: 'insensitive' }; 

    const prendas = await prisma.prendas.findMany({
      where: filtros,
      include: { historial: { orderBy: { fecha_uso: 'desc' }, take: 1 } }
    });
    res.json(prendas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las prendas' });
  }
});

// LÓGICA CORREGIDA: Prendas Olvidadas
app.get('/prendas/olvidadas', authenticateToken, async (req: any, res: any) => {
  try {
    const usuarioId = req.user.id;
    
    // 1. Siempre se consulta el perfil para ver el valor exacto de dias_olvido en ESTE preciso momento.
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    const diasOlvido = usuario?.dias_olvido ?? 30; // 30 por defecto si no hay dato

    // 2. Se calcula la fecha límite restando los días exactos a la fecha y hora actual.
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasOlvido);

    const prendasOlvidadas = await prisma.prendas.findMany({
      where: {
        usuario_id: usuarioId,
        OR: [
          // CASO A: La prenda no tiene NINGÚN registro en el historial. 
          // (Aplica para prendas creadas hoy que no le diste a "Sí, usar")
          { historial: { none: {} } }, 
          
          // CASO B: La prenda SÍ tiene historial, pero TODOS sus usos ocurrieron ANTES de la fecha límite.
          { historial: { every: { fecha_uso: { lt: fechaLimite } } } } 
        ]
      },
      include: { historial: { orderBy: { fecha_uso: 'desc' }, take: 1 } }
    });

    res.json(prendasOlvidadas);
  } catch (error) {
    console.error("Error en endpoint de prendas olvidadas:", error);
    res.status(500).json({ error: 'Error al buscar prendas olvidadas.' });
  }
});

app.get('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const prenda = await prisma.prendas.findFirst({
      where: { id: Number(id), usuario_id: req.user.id }
    });
    if (!prenda) return res.status(404).json({ error: 'Prenda no encontrada' });
    res.json(prenda);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la prenda' });
  }
});

app.post('/prendas', authenticateToken, async (req: any, res: any) => {
  const { foto_url, categoria, color, estilo, ocasion, conceptual, comprar } = req.body;
  try {
    const nuevaPrenda = await prisma.prendas.create({
      data: { foto_url, categoria, color, estilo, ocasion, conceptual, comprar, usuario_id: req.user.id }
    });
    res.status(201).json(nuevaPrenda);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la prenda' });
  }
});

app.put('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { foto_url, categoria, color, estilo, ocasion, conceptual, comprar } = req.body;
  try {
    const actualizada = await prisma.prendas.updateMany({
      where: { id: Number(id), usuario_id: req.user.id },
      data: { foto_url, categoria, color, estilo, ocasion, conceptual, comprar }
    });
    if (actualizada.count === 0) return res.status(404).json({ error: 'Prenda no encontrada' });
    res.json({ message: 'Prenda actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la prenda' });
  }
});

app.delete('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const eliminada = await prisma.prendas.deleteMany({
      where: { id: Number(id), usuario_id: req.user.id }
    });
    if (eliminada.count === 0) return res.status(404).json({ error: 'Prenda no encontrada' });
    res.json({ message: 'Prenda eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la prenda' });
  }
});

app.post('/prendas/:id/usar', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { confirmar } = req.body; 
  
  try {
    const prendaId = Number(id);
    const usuarioId = req.user.id;

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    const diasNoRep = usuario?.dias_no_rep || 3;

    const ultimoUso = await prisma.historial_prenda.findFirst({
      where: { prenda_id: prendaId },
      orderBy: { fecha_uso: 'desc' }
    });

    if (ultimoUso && !confirmar) {
      const hoy = new Date();
      const diasDiferencia = (hoy.getTime() - ultimoUso.fecha_uso.getTime()) / (1000 * 3600 * 24);

      if (diasDiferencia < diasNoRep) {
        return res.status(409).json({ 
          alerta: true, 
          mensaje: `Usaste esta prenda hace solo ${Math.floor(diasDiferencia)} días. ¿Deseas usarla de todos modos?` 
        });
      }
    }

    const nuevoUso = await prisma.historial_prenda.create({ data: { prenda_id: prendaId } });
    res.status(201).json(nuevoUso);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el uso' });
  }
});

app.delete('/prendas/:id/usar', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const prendaId = Number(id);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const usoDeHoy = await prisma.historial_prenda.findFirst({
      where: { prenda_id: prendaId, fecha_uso: { gte: hoy } },
      orderBy: { fecha_uso: 'desc' }
    });

    if (!usoDeHoy) return res.status(404).json({ error: "No hay registro de uso hoy." });

    await prisma.historial_prenda.delete({ where: { id: usoDeHoy.id } });
    res.json({ message: "Marca de uso eliminada." });
  } catch (error) {
    res.status(500).json({ error: 'Error al desmarcar el uso.' });
  }
});

// HU-16: Crear Outfit
app.post('/outfits', authenticateToken, async (req: any, res: any) => {
  const { nombre, prendaIds } = req.body;
  if (!nombre || !prendaIds || prendaIds.length < 2) {
    return res.status(400).json({ error: 'Se requieren mínimo 2 prendas y un nombre.' });
  }

  try {
    const nuevoOutfit = await prisma.outfit.create({
      data: {
        nombre,
        usuarioId: req.user.id,
        prendas: {
          create: prendaIds.map((id: number) => ({
            prenda: { connect: { id } }
          }))
        }
      }
    });
    res.status(201).json(nuevoOutfit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar el outfit.' });
  }
});

// HU-18: Consultar Outfits
app.get('/outfits', authenticateToken, async (req: any, res: any) => {
  try {
    const outfits = await prisma.outfit.findMany({
      where: { usuarioId: req.user.id },
      include: {
        prendas: { include: { prenda: true } }
      },
      orderBy: { nombre: 'asc' } // Cumple criterio de orden alfabético
    });
    res.json(outfits);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar outfits.' });
  }
});

// HU-17: Guardar como Favorito
app.patch('/outfits/:id/favorito', authenticateToken, async (req: any, res: any) => {
  try {
    const { favorito } = req.body;
    await prisma.outfit.update({
      where: { id: Number(req.params.id), usuarioId: req.user.id },
      data: { favorito }
    });
    res.json({ message: 'Estado de favorito actualizado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el outfit.' });
  }
});

// Eliminar Outfit
app.delete('/outfits/:id', authenticateToken, async (req: any, res: any) => {
  try {
    // Gracias al onDelete: Cascade del schema, esto borra el outfit y sus relaciones automáticamente
    await prisma.outfit.delete({
      where: { id: Number(req.params.id), usuarioId: req.user.id }
    });
    res.json({ message: 'Outfit eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el outfit.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en el puerto ${PORT}`));