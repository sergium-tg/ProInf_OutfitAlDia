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

// --- MIDDLEWARES Y UTILIDADES ---

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

// Función auxiliar de validación (Lógica de Negocio centralizada)
const validarFortalezaPassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// ==========================================
// MÓDULO DE USUARIOS Y AUTENTICACIÓN
// ==========================================

// 1. Registro de Usuario
app.post('/auth/register', async (req: any, res: any) => {
  const { nombre_usuario, email, password } = req.body;

  try {
    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios', color: 'warning' });
    }

    // Regla de Negocio: Fortaleza de contraseña
    if (!validarFortalezaPassword(password)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
        color: 'danger' 
      });
    }

    // Verificar si el email ya existe
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado', color: 'warning' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.usuario.create({
      data: { nombre_usuario, email, password_hash }
    });

    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

// 2. Login
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
  } catch (error) { 
    res.status(500).json({ error: 'Error interno del servidor' }); 
  }
});

// 3. Actualización de Perfil/Preferencias
app.put('/usuarios/perfil', authenticateToken, async (req: any, res: any) => {
  const { nombre_usuario, password, dias_no_rep, dias_olvido } = req.body;
  const usuarioId = req.user.id;

  try {
    const data: any = {};

    // Nombre de Usuario
    if (nombre_usuario) {
      data.nombre_usuario = nombre_usuario;
    }

    // Lógica para Cambiar Contraseña (Negocio)
    if (password && password.trim() !== "") {
      if (!validarFortalezaPassword(password)) {
        return res.status(400).json({ 
          error: 'La nueva contraseña no cumple los requisitos de seguridad.', 
          color: 'danger' 
        });
      }
      data.password_hash = await bcrypt.hash(password, 10);
    }

    // Preferencias
    if (dias_no_rep !== undefined) {
      if (dias_no_rep < 0 || dias_no_rep > 365) return res.status(400).json({ error: 'Días de no repetición inválidos.', color: 'warning' });
      data.dias_no_rep = Number(dias_no_rep);
    }
    
    if (dias_olvido !== undefined) {
      if (dias_olvido < 1) return res.status(400).json({ error: 'Los días de olvido deben ser al menos 1.', color: 'warning' });
      data.dias_olvido = Number(dias_olvido);
    }

    // Actualizar en la base de datos
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: data
    });

    const { password_hash, ...userPublic } = usuarioActualizado;
    res.json({ message: 'Perfil actualizado con éxito', user: userPublic });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al actualizar el perfil' });
  }
});

// 4. Logout
app.post('/auth/logout', authenticateToken, (req: any, res: any) => {
  res.json({ message: 'Sesión cerrada correctamente.' });
});

// 5. Eliminar Cuenta
app.delete('/user/account', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.usuario.delete({ where: { id: req.user.id } });
    res.json({ message: 'Cuenta eliminada definitivamente' });
  } catch (error) { 
    res.status(500).json({ error: 'Error al eliminar la cuenta' }); 
  }
});

// ==========================================
// MÓDULO DE PRENDAS
// ==========================================

app.get('/prendas', authenticateToken, async (req: any, res: any) => {
  const { categoria, color } = req.query;
  const usuarioId = req.user.id;

  try {
    const filtros: any = { usuario_id: usuarioId }; 

    if (categoria) filtros.categoria = String(categoria);
    if (color) filtros.color = { contains: String(color), mode: 'insensitive' };

    const prendas = await prisma.prendas.findMany({
      where: filtros,
      include: { 
        historial: { orderBy: { fecha_uso: 'desc' }, take: 1 } 
      }
    });
    res.json(prendas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las prendas' });
  }
});

app.get('/prendas/olvidadas', authenticateToken, async (req: any, res: any) => {
  try {
    const usuarioId = req.user.id;
    
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    const diasOlvido = usuario?.dias_olvido ?? 30;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasOlvido);

    const prendasOlvidadas = await prisma.prendas.findMany({
      where: {
        usuario_id: usuarioId,
        OR: [
          { historial: { none: {} } }, 
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
  const { categoria, color, estilo, ocasion, conceptual, comprar, foto_url } = req.body;
  const usuario_id = req.user.id;

  try {
    if (!categoria || categoria.trim() === '') {
      return res.status(400).json({ error: 'La categoría es obligatoria', color: 'warning' });
    }
    if (!color || color.trim() === '') {
      return res.status(400).json({ error: 'El color es obligatorio', color: 'warning' });
    }
    if (!foto_url || foto_url.trim() === '') {
      return res.status(400).json({ error: 'La foto de la prenda es obligatoria', color: 'danger' });
    }

    const nuevaPrenda = await prisma.prendas.create({
      data: {
        categoria,
        color,
        foto_url,
        estilo: estilo || null,
        ocasion: ocasion || null,
        conceptual: conceptual || false,
        comprar: comprar || false,
        usuario_id
      }
    });

    res.status(201).json({ message: 'Prenda guardada correctamente', prenda: nuevaPrenda });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al guardar la prenda' });
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

// Eliminar Prenda (Integridad Referencial - HU-12)
app.delete('/prendas/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const prendaId = Number(req.params.id);
    const userId = Number(req.user.id);

    const vinculada = await prisma.outfit_Prendas.findFirst({
      where: { prendaId: prendaId }
    });

    if (vinculada) {
      return res.status(400).json({ 
        error: 'La prenda no se puede eliminar porque forma parte de un outfit guardado. Desvincúlala primero.' 
      });
    }

    await prisma.prendas.delete({
      where: { id: prendaId, usuario_id: userId }
    });

    res.json({ message: 'Prenda eliminada correctamente.' });
  } catch (e) {
    res.status(500).json({ error: 'Error interno al intentar eliminar la prenda.' });
  }
});

// Registrar Uso
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

// ==========================================
// MÓDULO DE OUTFITS
// ==========================================

// HU-16: Crear Outfit (Lógica Completa)
app.post('/outfits', authenticateToken, async (req: any, res: any) => {
  const { nombre, prendaIds } = req.body;
  const usuarioId = req.user.id;

  try {
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'Asigna un nombre a tu outfit' });
    }

    if (!prendaIds || prendaIds.length < 2) {
      return res.status(400).json({ error: 'Selecciona al menos 2 prendas para tu outfit' });
    }

    const prendasSeleccionadas = await prisma.prendas.findMany({
      where: { id: { in: prendaIds } }
    });

    if (prendasSeleccionadas.length !== prendaIds.length) {
      return res.status(400).json({ error: 'Algunas prendas seleccionadas no son válidas.' });
    }

    const categorias = prendasSeleccionadas.map((p: any) => p.categoria);

    if (categorias.includes('Calzado')) {
      return res.status(400).json({ error: 'Por el momento armar este outfit no es posible', color: 'danger' });
    }

    const duplicados = categorias.filter((item, index) => categorias.indexOf(item) !== index);
    if (duplicados.length > 0) {
      return res.status(400).json({ error: `No puedes repetir categorías: ${duplicados[0]}`, color: 'warning' });
    }

    const combinacionActual = [...prendaIds].sort().join(',');

    const outfitsUsuario = await prisma.outfit.findMany({
      where: { usuarioId },
      include: { prendas: true }
    });

    const existeDuplicado = outfitsUsuario.some((outfit: any) => {
      const combinacionGuardada = outfit.prendas.map((op: any) => op.prendaId).sort().join(',');
      return combinacionActual === combinacionGuardada;
    });

    if (existeDuplicado) {
      return res.status(409).json({ 
        error: 'Ya tienes un outfit guardado con esta misma combinación exacta de ropa.',
        color: 'danger'
      });
    }

    const nuevoOutfit = await prisma.outfit.create({
      data: {
        nombre,
        usuarioId,
        prendas: {
          create: prendaIds.map((id: number) => ({
            prenda: { connect: { id } }
          }))
        }
      }
    });

    res.status(201).json({ message: 'Outfit guardado con éxito', outfit: nuevoOutfit });

  } catch (error) {
    console.error("Error al crear outfit:", error);
    res.status(500).json({ error: 'Error interno al guardar el outfit.' });
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
      orderBy: { nombre: 'asc' }
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
    await prisma.outfit.delete({
      where: { id: Number(req.params.id), usuarioId: req.user.id }
    });
    res.json({ message: 'Outfit eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el outfit.' });
  }
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en el puerto ${PORT}`));