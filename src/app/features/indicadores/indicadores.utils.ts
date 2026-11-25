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
export type TipoIndicador = 'cifra' | 'calificacion' | 'distribucion' | 'multiple';

export function tipoDe(i: Indicador): TipoIndicador {
  if (i.distribucion?.length) return i.respuestaMultiple ? 'multiple' : 'distribucion';
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

export interface SegmentoAnillo {
  /** Largo del arco sobre una circunferencia de 100 (ya con un pequeño hueco entre categorias). */
  largo: number;
  /** Desplazamiento para que el primer arco empiece arriba y siga en sentido horario. */
  desfase: number;
}

/**
 * Arcos del anillo (circunferencia de 100). Se normaliza para que sumen 100 aunque los porcentajes
 * vengan redondeados, y se deja un hueco entre categorias cuando hay mas de una.
 */
export function segmentosAnillo(barras: readonly { porcentaje: number }[]): SegmentoAnillo[] {
  const total = barras.reduce((suma, b) => suma + b.porcentaje, 0);
  if (total <= 0) return [];
  const hueco = barras.length > 1 ? 0.6 : 0;
  let inicio = 0;
  return barras.map((b) => {
    const parte = (b.porcentaje / total) * 100;
    const segmento = { largo: Math.max(0, Math.round((parte - hueco) * 100) / 100), desfase: Math.round((25 - inicio) * 100) / 100 };
    inicio += parte;
    return segmento;
  });
}

export interface CentroAnillo {
  numero: string;
  sufijo: string;
  texto: string;
  detalle: string;
}

/** Que se escribe en el centro del anillo: la categoria elegida o, si no hay, el resumen del indicador. */
export function centroAnillo(i: Indicador, barras: readonly ItemDistribucion[], elegida: number | null): CentroAnillo {
  const e = elegida === null ? undefined : barras[elegida];
  if (e) return { numero: formatearNumero(e.porcentaje), sufijo: '%', texto: e.categoria, detalle: `${formatearNumero(e.n)} registros` };
  const g = valorGrande(i.valor, i.unidad);
  if (i.valor !== null) return { numero: g.numero, sufijo: g.sufijo === '%' ? '%' : '', texto: g.aclaracion || (g.sufijo === '%' ? '' : g.sufijo), detalle: '' };
  const mayor = barras[0];
  return mayor ? { numero: formatearNumero(mayor.porcentaje), sufijo: '%', texto: mayor.categoria, detalle: '' } : { numero: '', sufijo: '', texto: '', detalle: '' };
}

/** Pie de un grupo de promedios que no usan los mismos registros: dice el rango en vez de inventar un solo numero. */
export function textoRegistrosGrupo(usados: readonly number[]): string {
  if (usados.length === 0) return '';
  const menor = Math.min(...usados);
  const mayor = Math.max(...usados);
  if (menor === mayor) return `Calculado con ${formatearNumero(menor)} registros`;
  return `Cada promedio usa entre ${formatearNumero(menor)} y ${formatearNumero(mayor)} registros; el resto no respondió.`;
}

const TITULO_POR_ESTRUCTURA: Record<string, string> = {
  ots_turista_v1: 'Perfil de los turistas',
  ots_hotel_v1: 'Alojamiento',
  kobo_carnaval_v1: 'Encuesta a visitantes',
};

/** Nombre corto del tipo de datos de una carga, a partir de su estructura. */
export function tituloDeEstructura(estructura: string | null | undefined): string {
  return TITULO_POR_ESTRUCTURA[estructura ?? ''] ?? 'Indicadores';
}
