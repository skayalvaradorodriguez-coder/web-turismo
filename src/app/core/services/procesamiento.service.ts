import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type {
  FiltroHallazgos,
  PaginaHallazgos,
  Procesamiento,
  ResultadoEjecucion,
  TipoProcesamiento,
} from '@app/core/models/procesamiento.models';

@Injectable({ providedIn: 'root' })
export class ProcesamientoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/cargas`;

  /** Historial de ejecuciones de la carga. */
  listar(cargaId: number): Observable<Procesamiento[]> {
    return this.http
      .get<ApiOk<{ procesamientos: Procesamiento[] }>>(`${this.url}/${cargaId}/procesamientos`)
      .pipe(map((respuesta) => respuesta.data.procesamientos));
  }

  /** Valida o procesa un archivo de la carga. La API guarda el resultado y avanza el estado de la carga. */
  ejecutar(cargaId: number, tipo: TipoProcesamiento, archivoId: number): Observable<ResultadoEjecucion> {
    return this.http
      .post<ApiOk<ResultadoEjecucion>>(`${this.url}/${cargaId}/procesamientos`, { tipo, archivoId })
      .pipe(map((respuesta) => respuesta.data));
  }

  hallazgos(cargaId: number, procesamientoId: number, filtro: FiltroHallazgos = {}): Observable<PaginaHallazgos> {
    let params = new HttpParams();
    if (filtro.severidad !== undefined) params = params.set('severidad', filtro.severidad);
    if (filtro.regla !== undefined) params = params.set('regla', filtro.regla);
    if (filtro.pagina !== undefined) params = params.set('pagina', filtro.pagina);
    if (filtro.limite !== undefined) params = params.set('limite', filtro.limite);

    return this.http
      .get<ApiOk<PaginaHallazgos>>(`${this.url}/${cargaId}/procesamientos/${procesamientoId}/hallazgos`, { params })
      .pipe(map((respuesta) => respuesta.data));
  }
}