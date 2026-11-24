import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import type { ApiOk } from '@app/core/models/api.models';
import type { CargaPublica, IndicadoresPublicados } from '@app/core/models/publico.models';

/** Parte publica: no necesita sesion y solo entrega cargas publicadas. */
@Injectable({ providedIn: 'root' })
export class PublicoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/publico`;

  cargas(): Observable<CargaPublica[]> {
    return this.http.get<ApiOk<{ cargas: CargaPublica[] }>>(`${this.url}/cargas`).pipe(map((r) => r.data.cargas));
  }

  indicadores(cargaId: number): Observable<IndicadoresPublicados> {
    return this.http
      .get<ApiOk<IndicadoresPublicados>>(`${this.url}/cargas/${cargaId}/indicadores`)
      .pipe(map((r) => r.data));
  }
}
