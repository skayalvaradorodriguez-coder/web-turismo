import { describe, expect, it } from 'vitest';
import {
  etiquetaEstadoProcesamiento,
  etiquetaTipoProcesamiento,
  formatearFechaHora,
  textoConteo,
} from './procesamiento.utils';

describe('procesamiento.utils', () => {
  it('nombra el tipo y el estado de cada ejecución', () => {
    expect(etiquetaTipoProcesamiento('validacion')).toBe('Validación');
    expect(etiquetaTipoProcesamiento('procesamiento')).toBe('Procesamiento');
    expect(etiquetaEstadoProcesamiento('en_curso')).toBe('En curso');
    expect(etiquetaEstadoProcesamiento('completado')).toBe('Completado');
    expect(etiquetaEstadoProcesamiento('fallido')).toBe('Fallido');
  });

  it('textoConteo usa singular solo para 1', () => {
    expect(textoConteo(1, 'error', 'errores')).toBe('1 error');
    expect(textoConteo(0, 'error', 'errores')).toBe('0 errores');
    expect(textoConteo(2, 'error', 'errores')).toBe('2 errores');
  });

  it('formatearFechaHora devuelve vacío si la fecha no es válida', () => {
    expect(formatearFechaHora('no es fecha')).toBe('');
    expect(formatearFechaHora('2026-10-20T10:00:00.000Z')).toContain('2026');
  });
});
