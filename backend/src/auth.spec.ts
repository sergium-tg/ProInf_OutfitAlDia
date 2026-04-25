import { describe, test, expect } from '@jest/globals';

const validarPassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
};

describe('Validación de Seguridad de Contraseñas', () => {
  test('Debe aceptar una contraseña válida', () => {
    expect(validarPassword('Outfit@2026')).toBe(true);
  });

  test('Debe rechazar si no tiene mayúsculas', () => {
    expect(validarPassword('outfit@2026')).toBe(false);
  });

  test('Debe rechazar si no tiene caracteres especiales', () => {
    expect(validarPassword('Outfit2026')).toBe(false);
  });

  test('Debe rechazar si tiene menos de 8 caracteres', () => {
    expect(validarPassword('Out@26')).toBe(false);
  });

  test('Debe rechazar si no tiene números', () => {
    expect(validarPassword('Outfit@Dia')).toBe(false);
  });
});