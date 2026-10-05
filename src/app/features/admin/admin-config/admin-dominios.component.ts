import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Dominio, DominioService, DominiosInfo } from '../../../core/services/dominio.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Dominios de la tienda: el subdominio gratis de la plataforma y los dominios
 * propios que paga el cliente. Un dominio propio se carga (PENDIENTE), el
 * cliente apunta su DNS al servidor y se verifica (ACTIVO); el principal es el
 * que se usa en los links de los mails y en la vuelta de Mercado Pago.
 */
@Component({
  selector: 'app-admin-dominios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './admin-dominios.component.html',
})
export class AdminDominiosComponent {
  private readonly service = inject(DominioService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly info = signal<DominiosInfo | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly nuevoHost = signal('');
  /** Id del dominio con una acción en curso (para deshabilitar sus botones). */
  readonly ocupado = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.service.listar().subscribe({
      next: (info) => {
        this.info.set(info);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los dominios.');
      },
    });
  }

  agregar(): void {
    const host = this.nuevoHost().trim();
    if (!host || this.ocupado()) return;
    this.error.set(null);
    this.ocupado.set('nuevo');
    this.service.agregar(host).subscribe({
      next: () => {
        this.nuevoHost.set('');
        this.ocupado.set(null);
        this.toast.success('Dominio cargado. Ahora apuntá su DNS y verificalo.');
        this.cargar();
      },
      error: (err) => this.fallo(err, 'No se pudo cargar el dominio.'),
    });
  }

  verificar(d: Dominio): void {
    this.accion(d, this.service.verificar(d.id), 'Dominio activo: ya responde con tu tienda.');
  }

  marcarPrincipal(d: Dominio): void {
    this.accion(d, this.service.marcarPrincipal(d.id), `${d.host} quedó como principal.`);
  }

  async eliminar(d: Dominio): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Quitar dominio',
      message: `¿Quitar ${d.host}? La tienda deja de responder en esa dirección.`,
      confirmLabel: 'Quitar',
      danger: true,
    });
    if (ok) this.accion(d, this.service.eliminar(d.id), 'Dominio quitado.');
  }

  private accion(d: Dominio, obs: import('rxjs').Observable<unknown>, okMsg: string): void {
    if (this.ocupado()) return;
    this.error.set(null);
    this.ocupado.set(d.id);
    obs.subscribe({
      next: () => {
        this.ocupado.set(null);
        this.toast.success(okMsg);
        this.cargar();
      },
      error: (err) => this.fallo(err, 'No se pudo completar la acción.'),
    });
  }

  private fallo(err: unknown, porDefecto: string): void {
    this.ocupado.set(null);
    const msg = err instanceof HttpErrorResponse ? err.error?.message : null;
    this.error.set(msg || porDefecto);
  }
}
