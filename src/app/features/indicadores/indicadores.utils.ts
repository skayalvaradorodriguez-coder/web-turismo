import type { Indicador, ItemDistribucion } from '@app/core/models/indicador.models';

/** 1927 -> "1 927"; 4.19 -> "4,19". Se arma a mano para que no cambie segun el idioma del navegador. */
export function formatearNumero(valor: number): string {
  const [entera = '', decimales] = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, useGrouping: false })
    .format(valor)
    .split('.');
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimales ? `${conMiles},${decimales}` : conMiles;
}

/** Valor con su unidad: "USD 168,74", "4,19 de 5", "1 927 registros". */
export function formatearValor(valor: number, unidad: string): string {
  const numero = formatearNumero(valor);
  if (unidad === 'USD') return `USD ${numero}`;
  if (unidad === '%') return `${numero} %`;
  return `${numero} ${unidad}`;
}

export interface BarraDistribucion extends ItemDistribucion {
  /** Ancho de la barra (0 a 100) relativo a la categoria mas grande. */
  ancho: number;
}

/**
 * Deja las categorias mas grandes y junta el resto en "Otras categorias", para que la lista se pueda leer.
 * La suma de n y de porcentajes se conserva.
 */
export function prepararBarras(items: readonly ItemDistribucion[], maximo = 6): BarraDistribucion[] {
  let lista = [...items];
  if (lista.length > maximo) {
    const resto = lista.slice(maximo - 1);
    const n = resto.reduce((suma, i) => suma + i.n, 0);
    const porcentaje = Math.round(resto.reduce((suma, i) => suma + i.porcentaje, 0) * 10) / 10;
    lista = [...lista.slice(0, maximo - 1), { categoria: `Otras categorías (${resto.length})`, n, porcentaje }];
  }
  const mayor = Math.max(1, ...lista.map((i) => i.porcentaje));
  return lista.map((i) => ({ ...i, ancho: i.porcentaje === 0 ? 0 : Math.max(2, Math.round((i.porcentaje / mayor) * 100)) }));
}

/** Texto de cuantos registros entraron al calculo. */
export function textoRegistros(usados: number, excluidos: number): string {
  const base = `Calculado con ${formatearNumero(usados)} registros`;
  if (excluidos === 0) return base;
  return `${base} · ${formatearNumero(excluidos)} sin dato o incoherentes`;
}

/** Como se dibuja cada indicador: una cifra, una calificacion de 1 a 5 o un reparto por categorias. */
export type TipoIndicador = 'cifra' | 'calificacion' | 'distribucion';

export function tipoDe(i: Indicador): TipoIndicador {
  if (i.distribucion?.length) return 'distribucion';
  if (i.valor !== null && i.unidad === 'de 5') return 'calificacion';
  return 'cifra';
}

export interface ValorGrande {
  prefijo: string;
  numero: string;
  sufijo: string;
  /** Aclaracion corta bajo la cifra, por ejemplo "residentes en Ecuador". */
  aclaracion: string;
}

/** Parte un valor para mostrarlo grande: "USD" 168,74 / 31,7 "%" / 1 927 "registros". */
export function valorGrande(valor: number | null, unidad: string): ValorGrande {
  if (valor === null) return { prefijo: '', numero: '—', sufijo: '', aclaracion: '' };
  const numero = formatearNumero(valor);
  if (unidad === 'USD') return { prefijo: 'USD', numero, sufijo: '', aclaracion: '' };
  if (unidad.startsWith('%')) return { prefijo: '', numero, sufijo: '%', aclaracion: unidad.slice(1).trim() };
  if (unidad === 'de 5') return { prefijo: '', numero, sufijo: '/ 5', aclaracion: '' };
  return { prefijo: '', numero, sufijo: unidad, aclaracion: '' };
}

/**
 * Gradiente cónico del anillo: cada categoria con su variable de color (--d1, --d2...).
 * Los porcentajes vienen redondeados, asi que el último tramo se estira hasta 100 %.
 */
export function gradienteAnillo(barras: readonly { porcentaje: number }[]): string {
  if (barras.length === 0) return 'none';
  let acumulado = 0;
  const tramos = barras.map((b, i) => {
    const desde = acumulado;
    acumulado = Math.round((acumulado + b.porcentaje) * 100) / 100;
    const hasta = i === barras.length - 1 ? 100 : Math.min(100, acumulado);
    return `var(--d${i + 1}) ${desde}% ${hasta}%`;
  });
  return `conic-gradient(${tramos.join(', ')})`;
}

/** Pie de un grupo de promedios que no usan los mismos registros: dice el rango en vez de inventar un solo numero. */
export function textoRegistrosGrupo(usados: readonly number[]): string {
  if (usados.length === 0) return '';
  const menor = Math.min(...usados);
  const mayor = Math.max(...usados);
  if (menor === mayor) return `Calculado con ${formatearNumero(menor)} registros`;
  return `Cada promedio usa entre ${formatearNumero(menor)} y ${formatearNumero(mayor)} registros; el resto no respondió.`;
}
