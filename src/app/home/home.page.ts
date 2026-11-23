import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ROLES_GESTION } from '@app/core/config/roles';
import type { Carga, EstadoCarga } from '@app/core/models/carga.models';
import type { Fuente } from '@app/core/models/fuente.models';
import { AuthService } from '@app/core/services/auth.service';
import { CargasService } from '@app/core/services/cargas.service';
import { FuentesService } from '@app/core/services/fuentes.service';
import { etiquetaEstadoCarga, formatearPeriodo } from '@app/features/cargas/cargas.utils';
import { mensajeApi } from '@app/shared/utils/api-error';

/** Pasos del recorrido de un dato, en orden. "Rechazada" no es un paso: se cuenta aparte. */
const PASOS: readonly { estado: EstadoCarga; ayuda: string }[] = [
  { estado: 'recibida', ayuda: 'Archivo guardado' },
  { estado: 'validada', ayuda: 'Estructura revisada' },
  { estado: 'procesada', ayuda: 'Datos ordenados' },
  { estado: 'publicada', ayuda: 'Disponible' },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cargasApi = inject(CargasService);
  private readonly fuentesApi = inject(FuentesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuario = this.auth.usuario;
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cargas = signal<Carga[]>([]);
  protected readonly totalCargas = signal(0);
  protected readonly fuentes = signal<Fuente[]>([]);

  protected readonly esGestion = computed(() => ROLES_GESTION.includes(this.usuario()?.rol ?? ''));
  protected readonly fuentesActivas = computed(() => this.fuentes().filter((f) => f.estado === 'activa').length);
  protected readonly recientes = computed(() => this.cargas().slice(0, 5));
  private readonly nombresFuente = computed(() => new Map(this.fuentes().map((f) => [f.id, f.nombre])));

  private contar(estado: EstadoCarga): number {
    return this.cargas().filter((c) => c.estado === estado).length;
  }

  protected readonly pasos = computed(() => {
    const maximo = Math.max(1, ...PASOS.map((p) => this.contar(p.estado)));
    return PASOS.map((p) => {
      const cantidad = this.contar(p.estado);
      return {
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
      },
      error: (e: unknown) => {
        this.error.set(mensajeApi(e, 'No se pudo cargar el resumen. Intenta de nuevo.'));
        this.cargando.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
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
