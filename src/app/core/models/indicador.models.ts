export interface ItemDistribucion {
  categoria: string;
  n: number;
  /** Porcentaje sobre los registros usados, con 1 decimal. */
  porcentaje: number;
}

/** Un indicador ya calculado por la API con los registros procesados de una carga. */
export interface Indicador {
  id: string;
  nombre: string;
  descripcion: string;
  /** null cuando el indicador solo es una distribucion, o cuando no hay datos suficientes. */
  valor: number | null;
  unidad: string;
  distribucion?: ItemDistribucion[];
  registrosUsados: number;
  /** Registros sin dato o con dato incoherente: no entran al calculo. */
  registrosExcluidos: number;
  /** Aclaracion cuando el significado del dato aun no esta confirmado con la fuente. */
  advertencia?: string;
}

export interface IndicadoresDeCarga {
  carga: {
    id: number;
    fuente: { id: number; nombre: string; institucion: string };
    periodoDesde: string | null;
    periodoHasta: string | null;
    estado: string;
  };
  estructura: string;
  procesamientoId: number;
  totalRegistros: number;
  indicadores: Indicador[];
}
