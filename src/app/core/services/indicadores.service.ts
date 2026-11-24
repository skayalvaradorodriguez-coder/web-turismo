import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type { IndicadoresDeCarga } from '@app/core/models/indicador.models';

@Injectable({ providedIn: 'root' })
export class IndicadoresService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/cargas`;

  /** Indicadores calculados con los registros procesados de la carga (la API responde 409 si aun no se procesa). */
  deCarga(cargaId: number): Observable<IndicadoresDeCarga> {
    return this.http
      .get<ApiOk<IndicadoresDeCarga>>(`${this.url}/${cargaId}/indicadores`)
      .pipe(map((respuesta) => respuesta.data));
  }
}
