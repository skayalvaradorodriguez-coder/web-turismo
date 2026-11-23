import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { API_URL } from '@app/core/config/api.config';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { FuentesListaPage } from './fuentes-lista.page';

const fuente = (id: number, nombre: string, estado: 'activa' | 'inactiva'): Fuente =>
  ({
    id, codigo: `fuente_${id}`, nombre, institucion: 'Institución', descripcion: null, tipoFuente: null,
    mecanismoAcceso: null, frecuenciaActualizacion: null, procedencia: null, licenciaUso: null,
    responsable: null, estado, creadoPor: 1, creadaEn: '', actualizadaEn: '',
  }) as Fuente;

function preparar(rol: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { usuario: () => ({ rol }) } },
    ],
  });
  const fixture: ComponentFixture<FuentesListaPage> = TestBed.createComponent(FuentesListaPage);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const tarjetas = () => (fixture.nativeElement as HTMLElement).querySelectorAll('.fuente').length;
  return { fixture, http, texto, tarjetas };
}

describe('FuentesListaPage', () => {
  it('muestra "Cargando" mientras espera la API', () => {
    const { http, texto } = preparar('admin');
    expect(texto()).toContain('Cargando fuentes');
    http.expectOne(`${API_URL}/fuentes`);
  });

  it('muestra una tarjeta por fuente', () => {
    const { fixture, http, texto, tarjetas } = preparar('admin');
    http.expectOne(`${API_URL}/fuentes`).flush({
      ok: true,
      data: { fuentes: [fuente(1, 'Encuesta', 'activa'), fuente(2, 'Playas', 'inactiva')] },
    });
    fixture.detectChanges();
    // por defecto solo se ven las activas; con "Todas" aparecen también las eliminadas
    expect(tarjetas()).toBe(1);
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Todas')?.click();
    fixture.detectChanges();

    expect(tarjetas()).toBe(2);
    expect(texto()).toContain('Encuesta');
    expect(texto()).toContain('Eliminada');
  });

  it('sin fuentes muestra el estado vacio', () => {
    const { fixture, http, texto, tarjetas } = preparar('admin');
    http.expectOne(`${API_URL}/fuentes`).flush({ ok: true, data: { fuentes: [] } });
    fixture.detectChanges();

    expect(tarjetas()).toBe(0);
    expect(texto()).toContain('Aún no hay fuentes registradas');
  });

  it('si la API falla muestra el mensaje de la API y permite reintentar', () => {
    const { fixture, http, texto } = preparar('admin');
    http.expectOne(`${API_URL}/fuentes`).flush(
      { ok: false, code: 'PERMISO_INSUFICIENTE', message: 'No tienes permiso para esta acción' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(texto()).toContain('No tienes permiso para esta acción');
    expect(texto()).toContain('Reintentar');
  });

  it('gestion ve "Nueva fuente" y "Editar"', () => {
    const { fixture, http, texto } = preparar('admin');
    http.expectOne(`${API_URL}/fuentes`).flush({ ok: true, data: { fuentes: [fuente(1, 'Encuesta', 'activa')] } });
    fixture.detectChanges();

    expect(texto()).toContain('Nueva fuente');
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label^="Editar"]')).not.toBeNull();
  });

  it('el investigador solo consulta: no ve "Nueva fuente" ni "Editar"', () => {
    const { fixture, http, texto } = preparar('investigador');
    http.expectOne(`${API_URL}/fuentes`).flush({ ok: true, data: { fuentes: [fuente(1, 'Encuesta', 'activa')] } });
    fixture.detectChanges();

    expect(texto()).not.toContain('Nueva fuente');
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label^="Editar"]')).toBeNull();
  });
});