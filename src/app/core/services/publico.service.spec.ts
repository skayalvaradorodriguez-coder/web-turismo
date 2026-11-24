import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import { PublicoService } from './publico.service';

describe('PublicoService', () => {
  it('pide la lista y los indicadores a la parte pública de la API', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const servicio = TestBed.inject(PublicoService);
    const http = TestBed.inject(HttpTestingController);

    let lista: unknown;
    servicio.cargas().subscribe((c) => (lista = c));
    const a = http.expectOne(`${API_URL}/publico/cargas`);
    expect(a.request.method).toBe('GET');
    a.flush({ ok: true, data: { cargas: [{ id: 7 }] } });
    expect(lista).toEqual([{ id: 7 }]);

    let datos: unknown;
    servicio.indicadores(7).subscribe((d) => (datos = d));
    http.expectOne(`${API_URL}/publico/cargas/7/indicadores`).flush({ ok: true, data: { totalRegistros: 3, indicadores: [] } });
    expect(datos).toEqual({ totalRegistros: 3, indicadores: [] });
    http.verify();
  });
});
