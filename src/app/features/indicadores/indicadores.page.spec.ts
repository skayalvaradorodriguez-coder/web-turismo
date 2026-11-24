import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Carga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import type { IndicadoresDeCarga } from '@app/core/models/indicador.models';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { IndicadoresService } from '@app/core/services/indicadores.service';
import { IndicadoresPage } from './indicadores.page';

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
    { id: 'T9', nombre: 'Gasto total reportado promedio', descripcion: 'Promedio', valor: 168.74, unidad: 'USD', registrosUsados: 1927, registrosExcluidos: 0, advertencia: 'Aún no se confirma si es por persona o por grupo.' },
    {
      id: 'T5', nombre: 'Motivo de visita', descripcion: 'Porcentaje', valor: null, unidad: '%', registrosUsados: 1900, registrosExcluidos: 27,
      distribucion: [{ categoria: 'Descanso', n: 1284, porcentaje: 66.6 }, { categoria: 'Familiares', n: 388, porcentaje: 20.1 }],
    },
    { id: 'T10', nombre: 'Satisfacción general promedio', descripcion: 'Promedio', valor: 4.19, unidad: 'de 5', registrosUsados: 1911, registrosExcluidos: 16 },
    { id: 'T11', nombre: 'Satisfacción con la seguridad', descripcion: 'Promedio', valor: 4.2, unidad: 'de 5', registrosUsados: 1900, registrosExcluidos: 27 },
  ],
};

function montar(cargas: Carga[], deCarga: ReturnType<typeof vi.fn>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: CargasService, useValue: { listar: () => of({ cargas, total: cargas.length, pagina: 1, limite: 200 }) } },
      { provide: FuentesService, useValue: { listar: () => of([fuente]) } },
      { provide: IndicadoresService, useValue: { deCarga } },
    ],
  });
  const fixture = TestBed.createComponent(IndicadoresPage);
  fixture.detectChanges();
  return fixture;
}

describe('IndicadoresPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('sin cargas procesadas muestra el estado vacío y no pide indicadores', () => {
    const deCarga = vi.fn();
    const f = montar([carga(1, 'recibida'), carga(2, 'validada')], deCarga);
    expect(f.nativeElement.textContent).toContain('Todavía no hay datos procesados');
    expect(deCarga).not.toHaveBeenCalled();
  });

  it('elige la primera carga procesada y muestra fuente, período, valores y barras', () => {
    const deCarga = vi.fn().mockReturnValue(of(datos));
    const f = montar([carga(1, 'recibida'), carga(2, 'procesada')], deCarga);
    f.detectChanges();
    const texto: string = f.nativeElement.textContent;

    expect(deCarga).toHaveBeenCalledWith(2);
    expect(texto).toContain('Observatorio Turístico UPSE');
    expect(texto).toContain('30 oct 2026 – 4 nov 2026');
    expect(texto).toContain('1 927');
    expect(texto).toContain('168,74');
    expect(texto).toContain('USD');
    expect(texto).toContain('Por confirmar');
    expect(texto).toContain('66,6 %');
    expect(texto).toContain('Calculado con 1 900 registros · 27 sin dato o incoherentes');
    expect(texto).toContain('4,19');
    expect(texto).toContain('Cada promedio usa entre 1 900 y 1 911 registros; el resto no respondió.');
  });

  it('una carga que no está procesada no aparece en el selector', () => {
    const f = montar([carga(1, 'recibida'), carga(2, 'procesada'), carga(3, 'publicada')], vi.fn().mockReturnValue(of(datos)));
    f.detectChanges();
    const opciones = Array.from(f.nativeElement.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).value);
    expect(opciones).toEqual(['2', '3']);
  });

  it('si la API falla muestra el mensaje y no deja datos viejos', () => {
    const error = new HttpErrorResponse({ status: 409, error: { ok: false, code: 'CARGA_SIN_PROCESAR', message: 'La carga todavía no fue procesada' } });
    const f = montar([carga(2, 'procesada')], vi.fn().mockReturnValue(throwError(() => error)));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('La carga todavía no fue procesada');
    expect(f.nativeElement.querySelector('.rejilla')).toBeNull();
  });

  it('una estructura sin indicadores lo dice, sin inventar', () => {
    const f = montar([carga(2, 'procesada')], vi.fn().mockReturnValue(of({ ...datos, indicadores: [] })));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('todavía no tiene indicadores');
  });

  it('al tocar una categoria de la leyenda el centro del anillo muestra sus datos y vuelve a pulsar la suelta', () => {
    const f = montar([carga(2, 'procesada')], vi.fn().mockReturnValue(of(datos)));
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const centro = () => el.querySelector('.anillo__centro')?.textContent ?? '';
    expect(centro()).toContain('66,6');

    const filas = el.querySelectorAll<HTMLButtonElement>('.leyenda__fila');
    filas[1]!.click();
    f.detectChanges();
    expect(centro()).toContain('Familiares');
    expect(centro()).toContain('20,1');
    expect(centro()).toContain('388 registros');
    expect(filas[1]!.getAttribute('aria-pressed')).toBe('true');

    filas[1]!.click();
    f.detectChanges();
    expect(centro()).toContain('Descanso');
  });

  it('pasar el cursor por una categoria la resalta y al salir se quita', () => {
    const f = montar([carga(2, 'procesada')], vi.fn().mockReturnValue(of(datos)));
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const fila = el.querySelectorAll<HTMLButtonElement>('.leyenda__fila')[1]!;
    fila.dispatchEvent(new Event('mouseenter'));
    f.detectChanges();
    expect(fila.classList).toContain('leyenda__fila--activa');
    expect(el.querySelectorAll('.seg--tenue').length).toBe(1);
    fila.dispatchEvent(new Event('mouseleave'));
    f.detectChanges();
    expect(el.querySelectorAll('.seg--tenue').length).toBe(0);
  });

  it('el boton i muestra y oculta la explicacion del indicador', () => {
    const f = montar([carga(2, 'procesada')], vi.fn().mockReturnValue(of(datos)));
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.textContent).not.toContain('Cantidad');
    el.querySelector<HTMLButtonElement>('.cifra .info')!.click();
    f.detectChanges();
    expect(el.textContent).toContain('Cantidad');
    el.querySelector<HTMLButtonElement>('.cifra .info')!.click();
    f.detectChanges();
    expect(el.textContent).not.toContain('Cantidad');
  });
});
