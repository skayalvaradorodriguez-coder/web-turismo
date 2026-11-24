import { Component, computed, input, signal } from '@angular/core';
import type { Indicador } from '@app/core/models/indicador.models';
import { formatearNumero, textoRegistros, textoRegistrosGrupo, tipoDe, valorGrande } from '@app/features/indicadores/indicadores.utils';
import { AnilloComponent } from '../anillo/anillo.component';

/**
 * Dibuja una lista de indicadores ya calculados: cifras arriba, repartos con anillo al centro y
 * calificaciones de 1 a 5 al final. Lo usan la pantalla interna de Indicadores y el portal publico.
 */
@Component({
  selector: 'app-indicadores-vista',
  imports: [AnilloComponent],
  templateUrl: 'indicadores-vista.component.html',
  styleUrls: ['indicadores-vista.component.scss'],
})
export class IndicadoresVistaComponent {
  readonly indicadores = input.required<readonly Indicador[]>();

  protected readonly cifras = computed(() => this.indicadores().filter((i) => tipoDe(i) === 'cifra'));
  protected readonly repartos = computed(() => this.indicadores().filter((i) => tipoDe(i) === 'distribucion'));
  protected readonly calificaciones = computed(() => this.indicadores().filter((i) => tipoDe(i) === 'calificacion'));

  /** Indicadores cuya descripcion esta desplegada ("i"). */
  private readonly infoAbierta = signal<ReadonlySet<string>>(new Set());

  protected hayInfo(id: string): boolean {
    return this.infoAbierta().has(id);
  }

  protected alternarInfo(id: string): void {
    this.infoAbierta.update((abiertos) => {
      const nuevo = new Set(abiertos);
      if (!nuevo.delete(id)) nuevo.add(id);
      return nuevo;
    });
  }

  protected grande(i: Indicador) {
    return valorGrande(i.valor, i.unidad);
  }

  /** Ancho de la barra de una calificacion de 1 a 5. */
  protected ancho(i: Indicador): number {
    return i.valor === null ? 0 : Math.round((i.valor / 5) * 100);
  }

  protected registros(i: Indicador): string {
    return textoRegistros(i.registrosUsados, i.registrosExcluidos);
  }

  protected registrosGrupo(lista: readonly Indicador[]): string {
    return textoRegistrosGrupo(lista.map((i) => i.registrosUsados));
  }

  protected numero(n: number): string {
    return formatearNumero(n);
  }
}
