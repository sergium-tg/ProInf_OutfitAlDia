import request from 'supertest';
import app, { prisma } from './index';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Integración API - Consolidado', () => {
  let token = '';
  let prendaId1 = 0;
  let prendaId2 = 0;
  let outfitId = 0;

  const uniqueEmail = `api_test_${Date.now()}@correo.com`;
  const pass = 'Password123!';

  beforeAll(async () => {
    await request(app).post('/auth/register').send({ nombre_usuario: 'ApiUser', email: uniqueEmail, password: pass });
    const res = await request(app).post('/auth/login').send({ email: uniqueEmail, password: pass });
    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.historial_prenda.deleteMany();
    await prisma.outfit_Prendas.deleteMany();
    await prisma.prendas.deleteMany();
    await prisma.outfit.deleteMany();
    await prisma.usuario.deleteMany({ where: { email: uniqueEmail } });
    await prisma.$disconnect();
  });

  describe('Validaciones y Errores (Branches)', () => {
    it('seguridad y validación perfil', async () => {
      expect((await request(app).get('/prendas')).status).toBe(401);
      expect((await request(app).get('/prendas').set('Authorization', 'Bearer fake')).status).toBe(403);
      expect((await request(app).put('/usuarios/perfil').set('Authorization', `Bearer ${token}`).send({ dias_no_rep: -1 })).status).toBe(400);
      expect((await request(app).put('/usuarios/perfil').set('Authorization', `Bearer ${token}`).send({ dias_olvido: 0 })).status).toBe(400);
      expect((await request(app).put('/usuarios/perfil').set('Authorization', `Bearer ${token}`).send({ password: '123' })).status).toBe(400);
    });

    it('validación prendas', async () => {
      expect((await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ color: 'R', foto_url: 'r.jpg' })).status).toBe(400);
      expect((await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'T', foto_url: 'r.jpg' })).status).toBe(400);
      expect((await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'T', color: 'R' })).status).toBe(400);
      expect((await request(app).get('/prendas/99999').set('Authorization', `Bearer ${token}`)).status).toBe(404);
    });
  });

  describe('Flujo de Éxito (Lines y Funciones)', () => {
    it('ciclo completo prendas', async () => {
      await request(app).put('/usuarios/perfil').set('Authorization', `Bearer ${token}`).send({ nombre_usuario: 'Nuevo', dias_no_rep: 5 });
      
      const p1 = await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'Parte Superior', color: 'Rojo', foto_url: 'r.jpg' });
      prendaId1 = p1.body.prenda.id;

      const p2 = await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'Parte Inferior', color: 'Azul', foto_url: 'a.jpg' });
      prendaId2 = p2.body.prenda.id;

      expect((await request(app).get('/prendas').set('Authorization', `Bearer ${token}`)).status).toBe(200);
      expect((await request(app).get(`/prendas/${prendaId1}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
      expect((await request(app).put(`/prendas/${prendaId1}`).set('Authorization', `Bearer ${token}`).send({ color: 'Verde', foto_url: 'v.jpg', categoria: 'Parte Superior' })).status).toBe(200);
      
      await request(app).post(`/prendas/${prendaId1}/usar`).set('Authorization', `Bearer ${token}`).send({});
      await request(app).delete(`/prendas/${prendaId1}/usar`).set('Authorization', `Bearer ${token}`);
      expect((await request(app).get('/prendas/olvidadas').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    });

    it('validaciones y ciclo completo outfits', async () => {
      const calzado = await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'Calzado', color: 'Negro', foto_url: 'n.jpg' });
      expect((await request(app).post('/outfits').set('Authorization', `Bearer ${token}`).send({ nombre: 'X', prendaIds: [prendaId1, calzado.body.prenda.id] })).status).toBe(400);
      
      const p3 = await request(app).post('/prendas').set('Authorization', `Bearer ${token}`).send({ categoria: 'Parte Superior', color: 'Verde', foto_url: 'v.jpg' });
      expect((await request(app).post('/outfits').set('Authorization', `Bearer ${token}`).send({ nombre: 'Y', prendaIds: [prendaId1, p3.body.prenda.id] })).status).toBe(400);

      const res = await request(app).post('/outfits').set('Authorization', `Bearer ${token}`).send({ nombre: 'Valido', prendaIds: [prendaId1, prendaId2] });
      outfitId = res.body.outfit.id;

      expect((await request(app).post('/outfits').set('Authorization', `Bearer ${token}`).send({ nombre: 'Dup', prendaIds: [prendaId2, prendaId1] })).status).toBe(409);
      expect((await request(app).delete(`/prendas/${prendaId1}`).set('Authorization', `Bearer ${token}`)).status).toBe(400);

      expect((await request(app).get('/outfits').set('Authorization', `Bearer ${token}`)).status).toBe(200);
      expect((await request(app).patch(`/outfits/${outfitId}/favorito`).set('Authorization', `Bearer ${token}`).send({ favorito: true })).status).toBe(200);
      expect((await request(app).delete(`/outfits/${outfitId}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
      expect((await request(app).delete(`/prendas/${prendaId1}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
    });

    it('eliminar cuenta', async () => {
      const mail = `del_${Date.now()}@x.com`;
      await request(app).post('/auth/register').send({ nombre_usuario: 'X', email: mail, password: pass });
      const res = await request(app).post('/auth/login').send({ email: mail, password: pass });
      expect((await request(app).delete('/user/account').set('Authorization', `Bearer ${res.body.token}`)).status).toBe(200);
    });
  });
});