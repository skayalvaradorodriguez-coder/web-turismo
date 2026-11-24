import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { Carga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import type { IndicadoresDeCarga } from '@app/core/models/indicador.models';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { IndicadoresService } from '@app/core/services/indicadores.service';
import { formatearFecha, formatearPeriodo } from '@app/features/cargas/cargas.utils';
import { mensajeApi } from '@app/shared/utils/api-error';
import { IndicadoresVistaComponent } from '@app/shared/components/indicadores-vista/indicadores-vista.component';
import { formatearNumero, tituloDeEstructura } from './indicadores.utils';

@Component({
  selector: 'app-indicadores',
  imports: [RouterLink, IndicadoresVistaComponent],
  templateUrl: 'indicadores.page.html',
  styleUrls: ['indicadores.page.scss'],
})
export class IndicadoresPage implements OnInit {
  private readonly cargasApi = inject(CargasService);
  private readonly fuentesApi = inject(FuentesService);
  private readonly indicadoresApi = inject(IndicadoresService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargandoLista = signal(true);
  protected readonly errorLista = signal<string | null>(null);
  protected readonly cargas = signal<Carga[]>([]);
  protected readonly fuentes = signal<Fuente[]>([]);
  protected readonly seleccionada = signal<number | null>(null);

  protected readonly cargandoDatos = signal(false);
  protected readonly errorDatos = signal<string | null>(null);
  protected readonly datos = signal<IndicadoresDeCarga | null>(null);

  private readonly nombresFuente = computed(() => new Map(this.fuentes().map((f) => [f.id, f.nombre])));

  /** Solo las cargas que ya pasaron por el procesamiento tienen indicadores. */
  protected readonly disponibles = computed(() => this.cargas().filter((c) => c.estado === 'procesada' || c.estado === 'publicada'));
  protected readonly titulo = computed(() => tituloDeEstructura(this.datos()?.estructura));

  protected readonly periodo = computed(() => {
    const c = this.datos()?.carga;
    return c ? formatearPeriodo(c.periodoDesde, c.periodoHasta) : '';
  });

  ngOnInit(): void {
    const pedida = Number(this.ruta.snapshot.queryParamMap.get('carga'));
    const suscripcion = forkJoin({ fuentes: this.fuentesApi.listar(), cargas: this.cargasApi.listar({ limite: 200 }) }).subscribe({
      next: ({ fuentes, cargas }) => {
        this.fuentes.set(fuentes);
        this.cargas.set(cargas.cargas);
        this.cargandoLista.set(false);
        const lista = this.disponibles();
        const inicial = lista.find((c) => c.id === pedida) ?? lista[0];
        if (inicial) this.elegir(inicial.id);
      },
      error: (e: unknown) => {
        this.errorLista.set(mensajeApi(e, 'No se pudo cargar la lista de cargas. Intenta de nuevo.'));
        this.cargandoLista.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  protected alCambiar(evento: Event): void {
    const id = Number((evento.target as HTMLSelectElement).value);
    if (id) this.elegir(id);
  }

  protected elegir(id: number): void {
    this.seleccionada.set(id);
    this.cargandoDatos.set(true);
    this.errorDatos.set(null);
    this.datos.set(null);
    const suscripcion = this.indicadoresApi.deCarga(id).subscribe({
      next: (datos) => {
        // Si la persona eligio otra carga mientras tanto, esta respuesta ya no importa
        if (this.seleccionada() !== id) return;
        this.datos.set(datos);
        this.cargandoDatos.set(false);
      },
      error: (e: unknown) => {
        if (this.seleccionada() !== id) return;
        this.errorDatos.set(mensajeApi(e, 'No se pudieron calcular los indicadores. Intenta de nuevo.'));
        this.cargandoDatos.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  protected etiquetaCarga(carga: Carga): string {
    const fuente = this.nombresFuente().get(carga.fuenteId) ?? `Fuente #${carga.fuenteId}`;
    return `#${carga.id} · ${fuente} · ${formatearPeriodo(carga.periodoDesde, carga.periodoHasta)}`;
  }

  protected numero(n: number): string {
    return formatearNumero(n);
  }

  protected fecha(f: string): string {
    return formatearFecha(f);
  }
}
