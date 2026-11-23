import { Component } from '@angular/core';

/** Marca de la plataforma: isotipo (ola y sol) y nombre. Hereda el color del texto. */
@Component({
  selector: 'app-marca',
  host: { class: 'marca' },
  template: `
    <svg class="marca__logo" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#e8b009" />
      <path d="M6 25c4-6 8-6 11 0s7 6 11 0 5-3 6-2" fill="none" stroke="#1f3a3a" stroke-width="3" stroke-linecap="round" />
      <circle cx="26" cy="13" r="4" fill="#1f3a3a" />
    </svg>
    <span class="marca__textos">
      <span class="marca__nombre">Pacífico Abierto</span>
      <span class="marca__sub">Datos turísticos · Santa Elena</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .marca__logo {
      flex: none;
    }
    .marca__textos {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .marca__nombre {
      font-family: var(--font-brand);
      font-weight: 700;
      font-size: 18px;
      color: #ffffff;
    }
    .marca__sub {
      font-size: 12px;
      color: #9cc4c0;
    }
  `,
})
export class MarcaComponent {}
