import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { IndicadoresDeCarga } from '@app/core/models/indicador.models';
import { IndicadoresService } from './indicadores.service';

describe('IndicadoresService', () => {
  let servicio: IndicadoresService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(IndicadoresService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deCarga pide los indicadores de la carga y devuelve los datos', () => {
    const datos: IndicadoresDeCarga = {
      carga: { id: 10, fuente: { id: 3, nombre: 'Observatorio', institucion: 'UPSE' }, periodoDesde: null, periodoHasta: null, estado: 'procesada' },
      estructura: 'ots_turista_v1',
      procesamientoId: 5,
      totalRegistros: 2,
      indicadores: [],
    };
    let recibido: IndicadoresDeCarga | undefined;
    servicio.deCarga(10).subscribe((r) => (recibido = r));

    const peticion = http.expectOne(`${API_URL}/cargas/10/indicadores`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ok: true, data: datos });
    expect(recibido).toEqual(datos);
  });
});
