import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import type { Procesamiento } from '@app/core/models/procesamiento.models';
import { ProcesamientoService } from '@app/core/services/procesamiento.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { mensajeApi } from '@app/shared/utils/api-error';
import { HallazgosProcesamientoComponent } from '../hallazgos-procesamiento/hallazgos-procesamiento.component';
import {
  etiquetaEstadoProcesamiento,
  etiquetaTipoProcesamiento,
  formatearFechaHora,
  textoConteo,
} from './procesamiento.utils';

/** Historial de validaciones y procesamientos de una carga, con acceso a sus hallazgos. Solo lectura. */
@Component({
  selector: 'app-procesamiento-carga',
  imports: [IconComponent, HallazgosProcesamientoComponent],
  templateUrl: './procesamiento-carga.component.html',
  styleUrl: './procesamiento-carga.component.scss',
})
export class ProcesamientoCargaComponent implements OnInit {
  private readonly api = inject(ProcesamientoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargaId = input.required<number>();

  protected readonly procesamientos = signal<Procesamiento[]>([]);
  protected readonly cargandoLista = signal(false);
  protected readonly errorLista = signal<string | null>(null);
  /** Id de la ejecucion cuyos hallazgos estan a la vista. */
  protected readonly abierto = signal<number | null>(null);

  protected readonly historial = computed(() => [...this.procesamientos()].sort((a, b) => b.id - a.id));

  protected readonly etiquetaTipo = etiquetaTipoProcesamiento;
  protected readonly etiquetaEstado = etiquetaEstadoProcesamiento;
  protected readonly fechaHora = formatearFechaHora;
  protected readonly conteo = textoConteo;

  ngOnInit(): void {
    this.cargarHistorial();
  }

  protected alternarHallazgos(procesamiento: Procesamiento): void {
    this.abierto.set(this.abierto() === procesamiento.id ? null : procesamiento.id);
  }

  protected tieneHallazgos(procesamiento: Procesamiento): boolean {
    return procesamiento.totalErrores + procesamiento.totalAlertas > 0;
  }

  private cargarHistorial(): void {
    this.cargandoLista.set(true);
    this.errorLista.set(null);
    this.api
      .listar(this.cargaId())
      .pipe(
        finalize(() => this.cargandoLista.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => this.procesamientos.set(lista),
        error: (e: unknown) => this.errorLista.set(mensajeApi(e, 'No se pudo cargar el historial.')),
      });
  }
}
