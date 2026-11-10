import type { EstadoProcesamiento, TipoProcesamiento } from '@app/core/models/procesamiento.models';

export function etiquetaTipoProcesamiento(tipo: TipoProcesamiento): string {
  return tipo === 'validacion' ? 'Validación' : 'Procesamiento';
}

export function etiquetaEstadoProcesamiento(estado: EstadoProcesamiento): string {
  const etiquetas: Record<EstadoProcesamiento, string> = {
    en_curso: 'En curso',
    completado: 'Completado',
    fallido: 'Fallido',
  };
  return etiquetas[estado];
}

/** "1 error" / "2 errores" / "0 errores". */
export function textoConteo(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
