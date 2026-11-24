import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CargaPublica, IndicadoresPublicados } from '@app/core/models/publico.models';
import { AuthService } from '@app/core/services/auth.service';
import { PublicoService } from '@app/core/services/publico.service';
import { formatearFecha, formatearPeriodo } from '@app/features/cargas/cargas.utils';
import { formatearNumero, tituloDeEstructura } from '@app/features/indicadores/indicadores.utils';
import { IndicadoresVistaComponent } from '@app/shared/components/indicadores-vista/indicadores-vista.component';
import { MarcaComponent } from '@app/shared/components/marca/marca.component';
import { ThemeToggleComponent } from '@app/shared/components/theme-toggle/theme-toggle.component';
import { mensajeApi } from '@app/shared/utils/api-error';

/** Una fuente que aparece en las cargas publicadas (sin repetir). */
interface FuentePublica {
  nombre: string;
  institucion: string;
  procedencia: string | null;
  licenciaUso: string | null;
  cargas: number;
}

/** Portal publico: indicadores de las cargas publicadas, con su fuente y periodo. No pide sesion. */
@Component({
  selector: 'app-portal',
  imports: [RouterLink, IndicadoresVistaComponent, MarcaComponent, ThemeToggleComponent],
  templateUrl: 'portal.page.html',
  styleUrls: ['portal.page.scss'],
})
export class PortalPage implements OnInit {
  private readonly api = inject(PublicoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  protected readonly conSesion = computed(() => this.auth.usuario() !== null);

  protected readonly cargandoLista = signal(true);
  protected readonly errorLista = signal<string | null>(null);
  protected readonly cargas = signal<CargaPublica[]>([]);
  protected readonly seleccionada = signal<number | null>(null);

  protected readonly cargandoDatos = signal(false);
  protected readonly errorDatos = signal<string | null>(null);
  protected readonly datos = signal<IndicadoresPublicados | null>(null);

  protected readonly titulo = computed(() => tituloDeEstructura(this.datos()?.estructura));
  protected readonly periodo = computed(() => {
    const c = this.datos()?.carga;
    return c ? formatearPeriodo(c.periodoDesde, c.periodoHasta) : '';
  });
  protected readonly fuentes = computed<FuentePublica[]>(() => {
    const porNombre = new Map<string, FuentePublica>();
    for (const c of this.cargas()) {
      const clave = `${c.fuente.institucion}|${c.fuente.nombre}`;
      const actual = porNombre.get(clave);
      if (actual) actual.cargas += 1;
      else porNombre.set(clave, { ...c.fuente, cargas: 1 });
    }
    return [...porNombre.values()];
  });

  ngOnInit(): void {
    const suscripcion = this.api.cargas().subscribe({
      next: (lista) => {
        this.cargas.set(lista);
        this.cargandoLista.set(false);
        const primera = lista[0];
        if (primera) this.elegir(primera.id);
      },
      error: (e: unknown) => {
        this.errorLista.set(mensajeApi(e, 'No se pudo cargar la información. Intenta de nuevo.'));
        this.cargandoLista.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  protected elegir(id: number): void {
    if (id === this.seleccionada() && this.datos()) return;
    this.seleccionada.set(id);
    this.cargandoDatos.set(true);
    this.errorDatos.set(null);
    this.datos.set(null);
    const suscripcion = this.api.indicadores(id).subscribe({
      next: (datos) => {
        // Si la persona eligio otra carga mientras tanto, esta respuesta ya no importa
        if (this.seleccionada() !== id) return;
        this.datos.set(datos);
        this.cargandoDatos.set(false);
      },
      error: (e: unknown) => {
        if (this.seleccionada() !== id) return;
        this.errorDatos.set(mensajeApi(e, 'No se pudieron mostrar los indicadores. Intenta de nuevo.'));
        this.cargandoDatos.set(false);
      },
    });
    this.destroyRef.onDestroy(() => suscripcion.unsubscribe());
  }

  protected reintentar(): void {
    const id = this.seleccionada();
    if (id === null) return;
    this.seleccionada.set(null);
    this.elegir(id);
  }

  protected etiqueta(c: CargaPublica): string {
    return `${tituloDeEstructura(c.tipoDatos)} · ${formatearPeriodo(c.periodoDesde, c.periodoHasta)}`;
  }

  protected numero(n: number): string {
    return formatearNumero(n);
  }

  /** La API entrega la fecha de publicacion en ISO (UTC): se muestra el dia en la zona horaria de quien mira. */
  protected fecha(iso: string): string {
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return '';
    const dos = (n: number) => String(n).padStart(2, '0');
    return formatearFecha(`${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`);
  }
}
