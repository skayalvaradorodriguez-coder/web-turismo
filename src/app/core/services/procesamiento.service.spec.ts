import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { PaginaHallazgos, Procesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from './procesamiento.service';

const procesamiento: Procesamiento = {
  id: 91,
  cargaId: 10,
  archivoId: 55,
  tipo: 'validacion',
  estado: 'completado',
  totalFilas: 2,
  totalErrores: 0,
  totalAlertas: 1,
  mensajeError: null,
  ejecutadoPor: 7,
  iniciadoEn: '2026-10-20T10:00:00.000Z',
  finalizadoEn: '2026-10-20T10:00:01.000Z',
};

describe('ProcesamientoService', () => {
  let servicio: ProcesamientoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ProcesamientoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar devuelve solo la lista de procesamientos', () => {
    const recibidos: Procesamiento[][] = [];
    servicio.listar(10).subscribe((lista) => recibidos.push(lista));

    const req = http.expectOne(`${API_URL}/cargas/10/procesamientos`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, data: { procesamientos: [procesamiento] } });

    expect(recibidos[0]).toEqual([procesamiento]);
  });

  it('hallazgos envia los filtros indicados', () => {
    const recibidos: PaginaHallazgos[] = [];
    servicio.hallazgos(10, 91, { severidad: 'error', regla: 'provincia_distinta', pagina: 2, limite: 25 }).subscribe((p) => recibidos.push(p));

    const req = http.expectOne((r) => r.url === `${API_URL}/cargas/10/procesamientos/91/hallazgos`);
    expect(req.request.params.get('severidad')).toBe('error');
    expect(req.request.params.get('regla')).toBe('provincia_distinta');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('limite')).toBe('25');
    req.flush({ ok: true, data: { hallazgos: [], total: 0, resumen: [], pagina: 2, limite: 25 } });

    expect(recibidos[0]?.pagina).toBe(2);
  });

  it('hallazgos sin filtros no envia parametros', () => {
    servicio.hallazgos(10, 91).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/cargas/10/procesamientos/91/hallazgos`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ ok: true, data: { hallazgos: [], total: 0, resumen: [], pagina: 1, limite: 50 } });
  });
});