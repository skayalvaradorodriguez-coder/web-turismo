import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Procesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { ProcesamientoCargaComponent } from './procesamiento-carga.component';

const ejecucion = (cambios: Partial<Procesamiento> = {}): Procesamiento => ({
  id: 1, cargaId: 10, archivoId: 55, tipo: 'validacion', estado: 'completado', totalFilas: 2, totalErrores: 0,
  totalAlertas: 1, mensajeError: null, ejecutadoPor: 7, iniciadoEn: '2026-10-20T10:00:00.000Z',
  finalizadoEn: '2026-10-20T10:00:01.000Z', ...cambios,
});

describe('ProcesamientoCargaComponent', () => {
  const api = { listar: vi.fn(), hallazgos: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    api.listar.mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesamientoService, useValue: api }] });
  });

  function crear() {
    const fixture = TestBed.createComponent(ProcesamientoCargaComponent);
    fixture.componentRef.setInput('cargaId', 10);
    fixture.detectChanges();
    return fixture;
  }

  const botones = (f: ComponentFixture<unknown>): HTMLButtonElement[] =>
    Array.from((f.nativeElement as HTMLElement).querySelectorAll('button'));
  const textos = (f: ComponentFixture<unknown>): string[] => botones(f).map((b) => b.textContent?.trim() ?? '');
  const boton = (f: ComponentFixture<unknown>, texto: string) => botones(f).find((b) => b.textContent?.trim() === texto);
  const contenido = (f: ComponentFixture<unknown>): string => (f.nativeElement as HTMLElement).textContent ?? '';

  it('consulta el historial de la carga al abrirse', () => {
    crear();
    expect(api.listar).toHaveBeenCalledWith(10);
  });

  it('sin ejecuciones, lo dice y no muestra botones', () => {
    const f = crear();

    expect(contenido(f)).toContain('todavía no se ha validado ni procesado');
    expect(textos(f)).toEqual([]);
  });

  it('muestra cada ejecución con su resultado, con la más reciente primero', () => {
    api.listar.mockReturnValue(of([ejecucion({ id: 1 }), ejecucion({ id: 2, tipo: 'procesamiento' })]));
    const f = crear();
    const tipos = Array.from((f.nativeElement as HTMLElement).querySelectorAll('.ejecucion__cabecera strong')).map((e) => e.textContent?.trim());

    expect(tipos).toEqual(['Procesamiento', 'Validación']);
    expect(contenido(f)).toContain('2 filas');
  });

  it('si el historial no se puede cargar, muestra el mensaje de la API', () => {
    const error = new HttpErrorResponse({ status: 500, error: { ok: false, code: 'ERROR_INTERNO', message: 'Error interno del servidor' } });
    api.listar.mockReturnValue(throwError(() => error));

    expect(contenido(crear())).toContain('Error interno del servidor');
  });

  it('ver hallazgos abre el detalle de esa ejecución y volver a pulsar lo oculta', () => {
    api.listar.mockReturnValue(of([ejecucion({ id: 5, totalErrores: 1 })]));
    api.hallazgos.mockReturnValue(of({ hallazgos: [], total: 0, resumen: [], pagina: 1, limite: 25 }));
    const f = crear();
    const abierto = () => (f.nativeElement as HTMLElement).querySelector('app-hallazgos-procesamiento');

    boton(f, 'Ver hallazgos')?.click();
    f.detectChanges();
    expect(api.hallazgos).toHaveBeenCalledWith(10, 5, expect.objectContaining({ pagina: 1 }));
    expect(abierto()).not.toBeNull();

    boton(f, 'Ocultar hallazgos')?.click();
    f.detectChanges();
    expect(abierto()).toBeNull();
  });

  it('una ejecución sin errores ni alertas no ofrece hallazgos', () => {
    api.listar.mockReturnValue(of([ejecucion({ totalAlertas: 0 })]));

    expect(textos(crear())).toEqual([]);
  });
});
