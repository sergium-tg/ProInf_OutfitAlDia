import { describe, test, expect } from 'vitest';

const validarOutfit = (categorias: string[]) => {
  if (categorias.includes('Calzado')) return false;
  const camisas = categorias.filter(c => c === 'Camisa').length;
  const sacos = categorias.filter(c => c === 'Saco').length;
  const pantalones = categorias.filter(c => c === 'Pantalon' || c === 'Pantalón').length;
  if (camisas > 1 || sacos > 1 || pantalones > 1) return false;
  return true;
};

const detectarDuplicado = (nuevoOutfitIds: number[], outfitsGuardados: { prendas: { prenda: { id: number } }[] }[]) => {
  const combinacionActual = [...nuevoOutfitIds].sort().join(',');
  return outfitsGuardados.some(outfit => {
    const combinacionGuardada = outfit.prendas.map(op => op.prenda.id).sort().join(',');
    return combinacionActual === combinacionGuardada;
  });
};

describe('Validacion de Reglas de Negocio - Outfits', () => {
  test('Debe rechazar un outfit que contenga Calzado', () => {
    expect(validarOutfit(['Camisa', 'Pantalon', 'Calzado'])).toBe(false);
  });

  test('Debe aceptar un outfit valido de Camisa y Pantalon', () => {
    expect(validarOutfit(['Camisa', 'Pantalon'])).toBe(true);
  });

  test('Debe rechazar si hay mas de una Camisa', () => {
    expect(validarOutfit(['Camisa', 'Camisa', 'Pantalon'])).toBe(false);
  });

  test('Debe detectar un outfit duplicado exactamente igual', () => {
    const guardados = [{ prendas: [{ prenda: { id: 1 } }, { prenda: { id: 2 } }] }];
    expect(detectarDuplicado([2, 1], guardados)).toBe(true);
  });

  test('Debe permitir guardar si la combinacion es nueva', () => {
    const guardados = [{ prendas: [{ prenda: { id: 1 } }, { prenda: { id: 2 } }] }];
    expect(detectarDuplicado([1, 3], guardados)).toBe(false);
  });
});