import type { Indicador } from './indicador.models';

/** Una carga publicada, con lo que se puede mostrar al publico de su fuente. */
export interface CargaPublica {
  id: number;
  /** Estructura de los datos (por ejemplo "ots_turista_v1"); null si no se pudo determinar. */
  tipoDatos: string | null;
  fuente: { nombre: string; institucion: string; procedencia: string | null; licenciaUso: string | null };
  periodoDesde: string | null;
  periodoHasta: string | null;
  publicadaEn: string | null;
}

export interface IndicadoresPublicados {
  carga: {
    id: number;
    fuente: { nombre: string; institucion: string };
    periodoDesde: string | null;
    periodoHasta: string | null;
    publicadaEn: string | null;
  };
  estructura: string;
  totalRegistros: number;
  indicadores: Indicador[];
}
