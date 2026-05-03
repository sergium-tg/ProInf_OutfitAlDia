import { describe, test, expect } from 'vitest';

const validarPrenda = (prenda: { categoria: string; color: string; foto_url?: string }, isEditing: boolean) => {
  if (!prenda.categoria || prenda.categoria.trim() === '') return false;
  if (!prenda.color || prenda.color.trim() === '') return false;
  if (!isEditing && (!prenda.foto_url || prenda.foto_url.trim() === '')) return false;
  return true;
};

const esPrendaOlvidada = (fechaUltimoUso: Date, diasOlvido: number) => {
  const hoy = new Date();
  const diferenciaTiempo = Math.abs(hoy.getTime() - fechaUltimoUso.getTime());
  const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  return diferenciaDias > diasOlvido;
};

describe('Validacion de Gestion de Prendas', () => {
  test('Debe rechazar una prenda sin categoria', () => {
    expect(validarPrenda({ categoria: '', color: 'Rojo', foto_url: 'url' }, false)).toBe(false);
  });

  test('Debe rechazar una prenda sin color', () => {
    expect(validarPrenda({ categoria: 'Camisa', color: '', foto_url: 'url' }, false)).toBe(false);
  });

  test('Debe rechazar prenda nueva sin foto', () => {
    expect(validarPrenda({ categoria: 'Camisa', color: 'Rojo', foto_url: '' }, false)).toBe(false);
  });

  test('Debe aceptar prenda valida completa', () => {
    expect(validarPrenda({ categoria: 'Saco', color: 'Negro', foto_url: 'http://img.com' }, false)).toBe(true);
  });

  test('Debe identificar correctamente una prenda olvidada segun los dias del usuario', () => {
    const fechaAntigua = new Date();
    fechaAntigua.setDate(fechaAntigua.getDate() - 35);
    expect(esPrendaOlvidada(fechaAntigua, 30)).toBe(true);
  });

  test('No debe identificar como olvidada una prenda usada recientemente', () => {
    const fechaReciente = new Date();
    fechaReciente.setDate(fechaReciente.getDate() - 5);
    expect(esPrendaOlvidada(fechaReciente, 30)).toBe(false);
  });
});