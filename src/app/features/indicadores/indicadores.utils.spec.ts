import { describe, expect, it } from 'vitest';
import type { Indicador } from '@app/core/models/indicador.models';
import { formatearNumero, formatearValor, gradienteAnillo, prepararBarras, textoRegistros, textoRegistrosGrupo, tipoDe, valorGrande } from './indicadores.utils';

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

const indicador = (c: Partial<Indicador>): Indicador => ({ id: 'X', nombre: 'x', descripcion: 'x', valor: 1, unidad: 'registros', registrosUsados: 1, registrosExcluidos: 0, ...c });

describe('tipoDe', () => {
  it('distingue cifra, calificacion y distribucion', () => {
    expect(tipoDe(indicador({}))).toBe('cifra');
    expect(tipoDe(indicador({ valor: 4.2, unidad: 'de 5' }))).toBe('calificacion');
    expect(tipoDe(indicador({ valor: null, unidad: '%', distribucion: [{ categoria: 'A', n: 1, porcentaje: 100 }] }))).toBe('distribucion');
  });

  it('un indicador con cifra y reparto se dibuja como reparto', () => {
    expect(tipoDe(indicador({ valor: 91.3, unidad: '% residentes en Ecuador', distribucion: [{ categoria: 'Ecuador', n: 9, porcentaje: 91.3 }] }))).toBe('distribucion');
  });

  it('una calificacion sin dato se muestra como cifra vacia, no como barra', () => {
    expect(tipoDe(indicador({ valor: null, unidad: 'de 5' }))).toBe('cifra');
  });
});

describe('valorGrande', () => {
  it('separa prefijo, numero, sufijo y aclaracion', () => {
    expect(valorGrande(168.74, 'USD')).toEqual({ prefijo: 'USD', numero: '168,74', sufijo: '', aclaracion: '' });
    expect(valorGrande(31.7, '%')).toEqual({ prefijo: '', numero: '31,7', sufijo: '%', aclaracion: '' });
    expect(valorGrande(91.3, '% residentes en Ecuador')).toEqual({ prefijo: '', numero: '91,3', sufijo: '%', aclaracion: 'residentes en Ecuador' });
    expect(valorGrande(4.19, 'de 5').sufijo).toBe('/ 5');
    expect(valorGrande(1927, 'registros')).toEqual({ prefijo: '', numero: '1 927', sufijo: 'registros', aclaracion: '' });
  });

  it('sin valor muestra una raya', () => {
    expect(valorGrande(null, 'USD').numero).toBe('—');
  });
});

describe('gradienteAnillo', () => {
  it('arma los tramos acumulados y cierra en 100 %', () => {
    expect(gradienteAnillo([{ porcentaje: 49 }, { porcentaje: 46.1 }, { porcentaje: 4.8 }])).toBe(
      'conic-gradient(var(--d1) 0% 49%, var(--d2) 49% 95.1%, var(--d3) 95.1% 100%)',
    );
  });

  it('sin categorias no pinta nada', () => {
    expect(gradienteAnillo([])).toBe('none');
  });
});

describe('textoRegistrosGrupo', () => {
  it('con el mismo numero de registros lo dice una vez', () => {
    expect(textoRegistrosGrupo([1911, 1911])).toBe('Calculado con 1 911 registros');
  });

  it('con numeros distintos da el rango', () => {
    expect(textoRegistrosGrupo([1911, 1900, 1911])).toBe('Cada promedio usa entre 1 900 y 1 911 registros; el resto no respondió.');
  });

  it('sin indicadores no escribe nada', () => {
    expect(textoRegistrosGrupo([])).toBe('');
  });
});
