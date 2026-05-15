import request from 'supertest';
import app, { prisma } from './index';
import { describe, it, expect, afterAll } from '@jest/globals';

describe('Módulo de Autenticación', () => {
  // Generamos un correo único basado en la fecha exacta para no chocar con tus datos
  const uniqueEmail = `test_${Date.now()}@correo.com`;
  const testUser = {
    nombre_usuario: 'TestUser',
    email: uniqueEmail,
    password: 'PasswordFuerte123!'
  };

  // Al terminar, SOLAMENTE borramos el usuario temporal que creó esta prueba
  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: uniqueEmail }
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('debe rechazar registro sin datos requeridos', async () => {
      const res = await request(app).post('/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Todos los campos son obligatorios');
    });

    it('debe rechazar registro con contraseña débil', async () => {
      const res = await request(app).post('/auth/register').send({
        nombre_usuario: 'Test',
        email: `debil_${Date.now()}@correo.com`,
        password: '123'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('La contraseña debe tener al menos 8 caracteres');
    });

    it('debe registrar un usuario correctamente', async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Usuario creado con éxito');
    });

    it('debe rechazar registro si el email ya existe', async () => {
      const res = await request(app).post('/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('El correo electrónico ya está registrado');
    });
  });

  describe('POST /auth/login', () => {
    it('debe rechazar login con credenciales inválidas', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'PasswordIncorrecto1!'
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales inválidas');
    });

    it('debe iniciar sesión correctamente y devolver un token', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });
  });
});