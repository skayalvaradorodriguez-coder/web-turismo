import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('rutas', () => {
  it('la raíz y las direcciones desconocidas llevan al portal público', () => {
    expect(routes.find((r) => r.path === '' && r.redirectTo)?.redirectTo).toBe('portal');
    expect(routes.find((r) => r.path === '**')?.redirectTo).toBe('portal');
  });

  it('el portal no exige sesión', () => {
    const portal = routes.find((r) => r.path === 'portal');
    expect(portal).toBeTruthy();
    expect(portal?.canActivate).toBeUndefined();
  });
});
