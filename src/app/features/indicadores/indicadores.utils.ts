import type { ItemDistribucion } from '@app/core/models/indicador.models';

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
