import { Component, computed, input, signal } from '@angular/core';
import type { Indicador } from '@app/core/models/indicador.models';
import { centroAnillo, formatearNumero, prepararBarras, segmentosAnillo } from '@app/features/indicadores/indicadores.utils';

/**
 * Anillo con leyenda para un indicador que es un reparto por categorias.
 * Pasar el cursor (o enfocar) muestra la categoria; hacer clic la deja fija hasta otro clic.
 */
@Component({
  selector: 'app-anillo',
  templateUrl: 'anillo.component.html',
  styleUrls: ['anillo.component.scss'],
})
export class AnilloComponent {
  readonly indicador = input.required<Indicador>();
  /** Maximo de categorias que se dibujan; el resto se junta en "Otras categorias". */
  readonly maximo = input(6);

  private readonly vista = signal<number | null>(null);
  private readonly fija = signal<number | null>(null);

  protected readonly barras = computed(() => prepararBarras(this.indicador().distribucion ?? [], this.maximo()));
  protected readonly segmentos = computed(() => segmentosAnillo(this.barras()));
  protected readonly activa = computed(() => this.vista() ?? this.fija());
  protected readonly centro = computed(() => centroAnillo(this.indicador(), this.barras(), this.activa()));

  protected ver(n: number | null): void {
    this.vista.set(n);
  }

  protected fijar(n: number): void {
    this.fija.update((f) => (f === n ? null : n));
  }

  protected esFija(n: number): boolean {
    return this.fija() === n;
  }

  protected numero(n: number): string {
    return formatearNumero(n);
  }
}
