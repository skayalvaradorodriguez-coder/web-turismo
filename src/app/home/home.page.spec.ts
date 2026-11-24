import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Carga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import type { IndicadoresDeCarga } from '@app/core/models/indicador.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { IndicadoresService } from '@app/core/services/indicadores.service';
import { HomePage } from './home.page';

const carga = (id: number, estado: Carga['estado']): Carga => ({
  id, fuenteId: 1, estructuraId: null, descripcion: null, periodoDesde: '2026-10-30', periodoHasta: '2026-11-04',
  nivelIngreso: 2, estado, motivoRechazo: null, cargadoPor: 1, publicadaPor: null, publicadaEn: null,
  creadaEn: '2026-11-05T10:00:00.000Z', actualizadaEn: '2026-11-05T10:00:00.000Z',
});

const fuente = { id: 1, nombre: 'Observatorio Turístico UPSE', estado: 'activa' } as Fuente;

const datos: IndicadoresDeCarga = {
  carga: { id: 2, fuente: { id: 1, nombre: 'Observatorio Turístico UPSE', institucion: 'UPSE' }, periodoDesde: '2026-10-30', periodoHasta: '2026-11-04', estado: 'procesada' },
  estructura: 'ots_turista_v1',
  procesamientoId: 9,
  totalRegistros: 1927,
  indicadores: [
    { id: 'T1', nombre: 'Encuestas procesadas', descripcion: 'Cantidad', valor: 1927, unidad: 'registros', registrosUsados: 1927, registrosExcluidos: 0 },
    { id: 'T10', nombre: 'Satisfacción general promedio', descripcion: 'Promedio', valor: 4.19, unidad: 'de 5', registrosUsados: 1911, registrosExcluidos: 16 },
    {
      id: 'T5', nombre: 'Motivo de visita', descripcion: 'Porcentaje', valor: null, unidad: '%', registrosUsados: 1900, registrosExcluidos: 27,
      distribucion: [{ categoria: 'Descanso', n: 1284, porcentaje: 66.6 }, { categoria: 'Familiares', n: 388, porcentaje: 20.1 }],
    },
  ],
};
const sinIndicadores: IndicadoresDeCarga = { ...datos, indicadores: [] };

function montar(cargas: Carga[], deCarga: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { usuario: () => ({ nombres: 'Skay', rol: 'super_admin' }) } },
      { provide: CargasService, useValue: { listar: () => of({ cargas, total: cargas.length, pagina: 1, limite: 200 }) } },
      { provide: FuentesService, useValue: { listar: () => of([fuente]) } },
      { provide: IndicadoresService, useValue: { deCarga } },
    ],
  });
  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  fixture.detectChanges();
  return fixture;
}

describe('HomePage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('muestra los indicadores de la primera carga procesada', () => {
    const deCarga = vi.fn().mockReturnValue(of(datos));
    const f = montar([carga(1, 'recibida'), carga(2, 'procesada')], deCarga);
    const texto: string = f.nativeElement.textContent;
    expect(deCarga).toHaveBeenCalledWith(2);
    expect(texto).toContain('Panorama de indicadores');
    expect(texto).toContain('1 927');
    expect(texto).toContain('4,19');
    expect(texto).toContain('Motivo de visita');
    expect(texto).toContain('66,6 %');
  });

  it('si la primera carga no tiene indicadores prueba con la siguiente', () => {
    const deCarga = vi.fn().mockImplementation((id: number) => of(id === 3 ? sinIndicadores : datos));
    const f = montar([carga(3, 'procesada'), carga(2, 'procesada')], deCarga);
    expect(deCarga).toHaveBeenCalledTimes(2);
    expect(f.nativeElement.textContent).toContain('1 927');
  });

  it('sin cargas procesadas explica que aún no hay indicadores y no los pide', () => {
    const deCarga = vi.fn();
    const f = montar([carga(1, 'recibida')], deCarga);
    expect(f.nativeElement.textContent).toContain('Todavía no hay datos procesados');
    expect(deCarga).not.toHaveBeenCalled();
  });

  it('un error al calcular se muestra y se puede reintentar', () => {
    const deCarga = vi.fn().mockReturnValueOnce(throwError(() => new Error('falla'))).mockReturnValue(of(datos));
    const f = montar([carga(2, 'procesada')], deCarga);
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    (f.nativeElement.querySelector('.enlace') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('1 927');
  });

  it('cambiar de carga en las pastillas pide sus indicadores', () => {
    const deCarga = vi.fn().mockReturnValue(of(datos));
    const f = montar([carga(5, 'procesada'), carga(2, 'publicada')], deCarga);
    const chips = f.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>;
    expect(chips.length).toBe(2);
    chips[1].click();
    f.detectChanges();
    expect(deCarga).toHaveBeenLastCalledWith(2);
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('tocar un paso del recorrido filtra las cargas recientes y otro toque lo quita', () => {
    const f = montar([carga(1, 'recibida'), carga(2, 'procesada'), carga(3, 'procesada')], vi.fn().mockReturnValue(of(datos)));
    const filas = () => f.nativeElement.querySelectorAll('tbody tr').length;
    expect(filas()).toBe(3);
    const pasos = f.nativeElement.querySelectorAll('.paso') as NodeListOf<HTMLButtonElement>;
    pasos[2].click(); // Procesada
    f.detectChanges();
    expect(filas()).toBe(2);
    expect(pasos[2].getAttribute('aria-pressed')).toBe('true');
    pasos[2].click();
    f.detectChanges();
    expect(filas()).toBe(3);
  });
});
