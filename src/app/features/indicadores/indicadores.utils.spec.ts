import { describe, expect, it } from 'vitest';
import { formatearNumero, formatearValor, prepararBarras, textoRegistros } from './indicadores.utils';

describe('formatearNumero y formatearValor', () => {
  it('usa coma decimal y separa los miles', () => {
    expect(formatearNumero(4.19)).toBe('4,19');
    expect(formatearNumero(1927)).toBe('1 927');
    expect(formatearNumero(6576)).toBe('6 576');
  });

  it('agrega la unidad segun el caso', () => {
    expect(formatearValor(168.74, 'USD')).toBe('USD 168,74');
    expect(formatearValor(31.7, '%')).toBe('31,7 %');
    expect(formatearValor(4.19, 'de 5')).toBe('4,19 de 5');
    expect(formatearValor(1927, 'registros')).toBe('1 927 registros');
  });
});

describe('prepararBarras', () => {
  const item = (categoria: string, n: number, porcentaje: number) => ({ categoria, n, porcentaje });

  it('la categoria mayor ocupa todo el ancho y las demas son proporcionales', () => {
    const barras = prepararBarras([item('A', 50, 50), item('B', 25, 25)]);
    expect(barras.map((b) => b.ancho)).toEqual([100, 50]);
  });

  it('con muchas categorias junta el resto y conserva el total', () => {
    const items = [item('A', 40, 40), item('B', 20, 20), item('C', 15, 15), item('D', 10, 10), item('E', 8, 8), item('F', 4, 4), item('G', 3, 3)];
    const barras = prepararBarras(items, 5);
    expect(barras).toHaveLength(5);
    expect(barras[4]).toMatchObject({ categoria: 'Otras categorías (3)', n: 15, porcentaje: 15 });
    expect(barras.reduce((s, b) => s + b.n, 0)).toBe(100);
  });

  it('una lista vacia no falla', () => {
    expect(prepararBarras([])).toEqual([]);
  });
});

describe('textoRegistros', () => {
  it('menciona los excluidos solo si los hay', () => {
    expect(textoRegistros(1927, 0)).toBe('Calculado con 1 927 registros');
    expect(textoRegistros(1914, 13)).toBe('Calculado con 1 914 registros · 13 sin dato o incoherentes');
  });
});
