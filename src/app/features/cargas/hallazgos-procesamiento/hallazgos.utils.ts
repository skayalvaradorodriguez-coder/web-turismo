import type { Hallazgo, SeveridadHallazgo } from '@app/core/models/procesamiento.models';

export function etiquetaSeveridad(severidad: SeveridadHallazgo): string {
  if (severidad === 'error') return 'Error';
  return severidad === 'cambio' ? 'Cambio' : 'Alerta';
}

/** Nombres en lenguaje sencillo de las reglas de validación conocidas. */
const REGLAS_LEGIBLES: Record<string, string> = {
  estructura_no_reconocida: 'Estructura no reconocida',
  identificador_faltante: 'Falta el identificador',
  identificador_repetido: 'Identificador repetido',
  fila_duplicada: 'Fila duplicada',
  posible_duplicado: 'Posible duplicado',
  clave_natural_repetida: 'Registro repetido',
  columna_vacia: 'Columna vacía',
};

/** "provincia_distinta" -> "provincia distinta". */
export function nombreRegla(regla: string): string {
  return REGLAS_LEGIBLES[regla] ?? regla.replace(/_/g, ' ');
}

/** Donde esta el problema: fila y columna, o el archivo completo si no hay fila. */
export function ubicacionHallazgo(hallazgo: Pick<Hallazgo, 'fila' | 'columna'>): string {
  if (hallazgo.fila === null) return 'Archivo completo';
  return hallazgo.columna ? `Fila ${hallazgo.fila} · ${hallazgo.columna}` : `Fila ${hallazgo.fila}`;
}

/** Una celda vacia tambien es un valor: se muestra como "(vacío)" para que no parezca que falta. */
export function valorVisible(valor: string): string {
  return valor === '' ? '(vacío)' : valor;
}