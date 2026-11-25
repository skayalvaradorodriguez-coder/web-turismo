import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ROLES_GESTION } from '@app/core/config/roles';
import type { Carga, EstadoCarga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { IndicadoresService } from '@app/core/services/indicadores.service';
import type { Indicador, IndicadoresDeCarga } from '@app/core/models/indicador.models';
import { AnilloComponent } from '@app/shared/components/anillo/anillo.component';
import { formatearNumero, valorGrande } from '@app/features/indicadores/indicadores.utils';
import { etiquetaEstadoCarga, formatearPeriodo } from '@app/features/cargas/cargas.utils';
import { mensajeApi } from '@app/shared/utils/api-error';

/** Pasos del recorrido de un dato, en orden. "Rechazada" no es un paso: se cuenta aparte. */
const PASOS: readonly { estado: EstadoCarga; ayuda: string }[] = [
  { estado: 'recibida', ayuda: 'Archivo guardado' },
  { estado: 'validada', ayuda: 'Estructura revisada' },
  { estado: 'procesada', ayuda: 'Datos ordenados' },
  { estado: 'publicada', ayuda: 'Disponible' },
];

/** Indicadores que se destacan en el inicio, en este orden (los que existan en la carga elegida). */
const DESTACADOS = ['T1', 'T4', 'T10', 'T12', 'H1', 'H2', 'H3', 'C1', 'C34', 'C36', 'C31', 'S1', 'S37', 'S34'];
/** Reparto que se dibuja como anillo en el inicio. */
const REPARTOS_PREFERIDOS = ['T5', 'T6', 'T2', 'C8', 'C10', 'C2', 'S8', 'S10', 'S2'];
const MAX_CARGAS_PANORAMA = 4;

@Component({
  selector: 'app-home',
  imports: [RouterLink, AnilloComponent],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cargasApi = inject(CargasService);
  private readonly fuentesApi = inject(FuentesService);
  private readonly indicadoresApi = inject(IndicadoresService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuario = this.auth.usuario;
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cargas = signal<Carga[]>([]);
  protected readonly totalCargas = signal(0);
  protected readonly fuentes = signal<Fuente[]>([]);

  protected readonly esGestion = computed(() => ROLES_GESTION.includes(this.usuario()?.rol ?? ''));
  protected readonly fuentesActivas = computed(() => this.fuentes().filter((f) => f.estado === 'activa').length);
  /** Estado elegido en el recorrido para filtrar las cargas recientes (null = todas). */
  protected readonly filtro = signal<EstadoCarga | null>(null);
  protected readonly recientes = computed(() => {
    const f = this.filtro();
    return this.cargas().filter((c) => f === null || c.estado === f).slice(0, 5);
  });

  // ---------- Panorama de indicadores ----------
  protected readonly panoramaCargas = computed(() =>
    this.cargas().filter((c) => c.estado === 'procesada' || c.estado === 'publicada').slice(0, MAX_CARGAS_PANORAMA),
  );
  protected readonly panoramaId = signal<number | null>(null);
  protected readonly panoramaCargando = signal(false);
  protected readonly panoramaError = signal<string | null>(null);
  protected readonly panorama = signal<IndicadoresDeCarga | null>(null);

  protected readonly destacados = computed<Indicador[]>(() => {
    const lista = this.panorama()?.indicadores ?? [];
    return DESTACADOS.map((id) => lista.find((i) => i.id === id)).filter((i): i is Indicador => !!i && i.valor !== null).slice(0, 4);
  });
  protected readonly repartoPrincipal = computed<Indicador | null>(() => {
    const lista = this.panorama()?.indicadores ?? [];
    for (const id of REPARTOS_PREFERIDOS) {
      const i = lista.find((x) => x.id === id && x.distribucion?.length && !x.respuestaMultiple);
      if (i) return i;
    }
    return lista.find((x) => x.distribucion?.length && !x.respuestaMultiple) ?? null;
  });
  private readonly nombresFuente = computed(() => new Map(this.fuentes().map((f) => [f.id, f.nombre])));

  private contar(estado: EstadoCarga): number {
    return this.cargas().filter((c) => c.estado === estado).length;
  }

  protected readonly pasos = computed(() => {
    const maximo = Math.max(1, ...PASOS.map((p) => this.contar(p.estado)));
    return PASOS.map((p) => {
      const cantidad = this.contar(p.estado);
      return {
        estado: p.estado,
        etiqueta: etiquetaEstadoCarga(p.estado),
        ayuda: p.ayuda,
        cantidad,
        ancho: cantidad === 0 ? 0 : Math.max(8, Math.round((cantidad / maximo) * 100)),
      };
    });
  });

  protected readonly porRevisar = computed(() => this.contar('recibida') + this.contar('validada'));
  protected readonly rechazadas = computed(() => this.contar('rechazada'));

  ngOnInit(): void {
    const suscripcion = forkJoin({
      fuentes: this.fuentesApi.listar(),
      cargas: this.cargasApi.listar({ limite: 200 }),
    }).subscribe({
      next: ({ fuentes, cargas }) => {
        this.fuentes.set(fuentes);
        this.cargas.set(cargas.cargas);
        this.totalCargas.set(cargas.total);
        this.cargando.set(false);
        this.cargarPanorama(0);
      },
      error: (e: unknown) => {
        this.error.set(mensajeApi(e, 'No se pudo cargar el resumen. Intenta de nuevo.'));
        this.cargando.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  /**
   * Pide los indicadores de la carga que esta en la posicion indicada. Si esa carga no tiene
   * indicadores definidos (otro tipo de datos), prueba con la siguiente.
   */
  private cargarPanorama(posicion: number, elegida?: number): void {
    const lista = this.panoramaCargas();
    const carga = elegida === undefined ? lista[posicion] : lista.find((c) => c.id === elegida);
    if (!carga) return;
    this.panoramaId.set(carga.id);
    this.panoramaCargando.set(true);
    this.panoramaError.set(null);
    this.panorama.set(null);
    const suscripcion = this.indicadoresApi.deCarga(carga.id).subscribe({
      next: (datos) => {
        if (this.panoramaId() !== carga.id) return;
        if (datos.indicadores.length === 0 && elegida === undefined && posicion + 1 < lista.length) {
          this.cargarPanorama(posicion + 1);
          return;
        }
        this.panorama.set(datos);
        this.panoramaCargando.set(false);
      },
      error: (e: unknown) => {
        if (this.panoramaId() !== carga.id) return;
        this.panoramaError.set(mensajeApi(e, 'No se pudieron calcular los indicadores. Intenta de nuevo.'));
        this.panoramaCargando.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  protected elegirPanorama(id: number): void {
    if (id !== this.panoramaId()) this.cargarPanorama(0, id);
  }

  protected reintentarPanorama(): void {
    const id = this.panoramaId();
    if (id !== null) this.cargarPanorama(0, id);
  }

  protected alternarFiltro(estado: EstadoCarga): void {
    this.filtro.update((f) => (f === estado ? null : estado));
  }

  protected grande(i: Indicador) {
    return valorGrande(i.valor, i.unidad);
  }

  protected numero(n: number): string {
    return formatearNumero(n);
  }

  protected etiquetaChip(carga: Carga): string {
    // La descripcion distingue cargas de una misma fuente y periodo (por ejemplo turistas y hoteles)
    const nombre = carga.descripcion?.trim() || this.nombreFuente(carga);
    return `${nombre} · ${this.periodo(carga)}`;
  }

  protected nombreFuente(carga: Carga): string {
    return this.nombresFuente().get(carga.fuenteId) ?? `Fuente #${carga.fuenteId}`;
  }

  protected etiqueta(estado: EstadoCarga): string {
    return etiquetaEstadoCarga(estado);
  }

  protected periodo(carga: Carga): string {
    return formatearPeriodo(carga.periodoDesde, carga.periodoHasta);
  }
}
