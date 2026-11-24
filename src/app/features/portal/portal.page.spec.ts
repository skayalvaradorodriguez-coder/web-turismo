import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CargaPublica, IndicadoresPublicados } from '@app/core/models/publico.models';
import { AuthService } from '@app/core/services/auth.service';
import { PublicoService } from '@app/core/services/publico.service';
import { PortalPage } from './portal.page';

const publica = (id: number, tipoDatos: string | null = 'ots_turista_v1'): CargaPublica => ({
  id, tipoDatos,
  fuente: { nombre: 'Observatorio Turístico UPSE', institucion: 'UPSE', procedencia: 'Encuestas del Observatorio', licenciaUso: 'Uso académico' },
  periodoDesde: '2026-10-30', periodoHasta: '2026-11-04', publicadaEn: '2026-11-24T14:00:00.000Z',
});

const datos: IndicadoresPublicados = {
  carga: { id: 7, fuente: { nombre: 'Observatorio Turístico UPSE', institucion: 'UPSE' }, periodoDesde: '2026-10-30', periodoHasta: '2026-11-04', publicadaEn: '2026-11-24T14:00:00.000Z' },
  estructura: 'ots_turista_v1',
  totalRegistros: 1927,
  indicadores: [
    { id: 'T1', nombre: 'Encuestas procesadas', descripcion: 'Cantidad', valor: 1927, unidad: 'registros', registrosUsados: 1927, registrosExcluidos: 0 },
    {
      id: 'T5', nombre: 'Motivo de visita', descripcion: 'Porcentaje', valor: null, unidad: '%', registrosUsados: 1900, registrosExcluidos: 27,
      distribucion: [{ categoria: 'Descanso', n: 1284, porcentaje: 66.6 }, { categoria: 'Familiares', n: 388, porcentaje: 20.1 }],
    },
  ],
};

function montar(cargas: () => unknown, indicadores: ReturnType<typeof vi.fn>, sesion = false) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { usuario: () => (sesion ? { rol: 'admin' } : null) } },
      { provide: PublicoService, useValue: { cargas, indicadores } },
    ],
  });
  const f = TestBed.createComponent(PortalPage);
  f.detectChanges();
  f.detectChanges();
  return f;
}

describe('PortalPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('sin datos publicados lo explica y no pide indicadores', () => {
    const indicadores = vi.fn();
    const f = montar(() => of([]), indicadores);
    expect(f.nativeElement.textContent).toContain('Todavía no hay indicadores publicados');
    expect(indicadores).not.toHaveBeenCalled();
  });

  it('muestra los indicadores de la primera carga con su fuente, período y registros', () => {
    const indicadores = vi.fn().mockReturnValue(of(datos));
    const f = montar(() => of([publica(7), publica(8)]), indicadores);
    const texto: string = f.nativeElement.textContent;

    expect(indicadores).toHaveBeenCalledWith(7);
    expect(texto).toContain('Observatorio Turístico UPSE');
    expect(texto).toContain('30 oct 2026 – 4 nov 2026');
    expect(texto).toContain('1 927');
    expect(texto).toContain('Motivo de visita');
    expect(texto).toContain('66,6 %');
  });

  it('lista las fuentes con su procedencia y condición de uso, sin repetirlas', () => {
    const f = montar(() => of([publica(7), publica(8)]), vi.fn().mockReturnValue(of(datos)));
    const fuentes = f.nativeElement.querySelectorAll('.fuente');
    expect(fuentes.length).toBe(1);
    expect(fuentes[0].textContent).toContain('Encuestas del Observatorio');
    expect(fuentes[0].textContent).toContain('Uso académico');
    expect(fuentes[0].textContent).toContain('2'); // dos cargas publicadas de esa fuente
  });

  it('cambiar de datos en las pastillas pide los indicadores de esa carga', () => {
    const indicadores = vi.fn().mockReturnValue(of(datos));
    const f = montar(() => of([publica(7), publica(8, 'ots_hotel_v1')]), indicadores);
    const chips = f.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>;
    expect(chips[1].textContent).toContain('Alojamiento');
    chips[1].click();
    f.detectChanges();
    expect(indicadores).toHaveBeenLastCalledWith(8);
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('un error al cargar la lista se muestra con un mensaje', () => {
    const f = montar(() => throwError(() => new Error('falla')), vi.fn());
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('un error al calcular se muestra y se puede reintentar', () => {
    const indicadores = vi.fn().mockReturnValueOnce(throwError(() => new Error('falla'))).mockReturnValue(of(datos));
    const f = montar(() => of([publica(7)]), indicadores);
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    (f.nativeElement.querySelector('.enlace') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('1 927');
  });

  it('el acceso cambia según haya sesión o no', () => {
    const sin = montar(() => of([]), vi.fn());
    expect(sin.nativeElement.querySelector('.barra__acciones .boton').textContent).toContain('Iniciar sesión');
    TestBed.resetTestingModule();
    const con = montar(() => of([]), vi.fn(), true);
    expect(con.nativeElement.querySelector('.barra__acciones .boton').textContent).toContain('Ir a la plataforma');
  });
});
