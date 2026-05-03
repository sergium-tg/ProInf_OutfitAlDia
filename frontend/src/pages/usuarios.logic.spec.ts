import { describe, test, expect } from 'vitest';

const validarActualizacionPerfil = (diasNoRep: number, diasOlvido: number, passwordsMatch: boolean) => {
  if (!passwordsMatch) return false;
  if (diasNoRep < 0) return false;
  if (diasOlvido < 0) return false;
  return true;
};

describe('Validacion de Perfil de Usuario', () => {
  test('Debe rechazar si las contrasenas nuevas no coinciden', () => {
    expect(validarActualizacionPerfil(7, 30, false)).toBe(false);
  });

  test('Debe rechazar si los dias sin repetir son negativos', () => {
    expect(validarActualizacionPerfil(-1, 30, true)).toBe(false);
  });

  test('Debe rechazar si los dias de olvido son negativos', () => {
    expect(validarActualizacionPerfil(7, -5, true)).toBe(false);
  });

  test('Debe aceptar un perfil valido', () => {
    expect(validarActualizacionPerfil(10, 45, true)).toBe(true);
  });
});