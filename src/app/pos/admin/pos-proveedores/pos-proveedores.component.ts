import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { PosService } from '../../pos.service';
import { Proveedor } from '../../pos.models';

/** Proveedores del kiosco (a quién se le compra). */
@Component({
  selector: 'app-pos-proveedores',
  imports: [FormsModule],
  template: `
    <h1 class="font-display font-extrabold text-2xl text-stone-800 mb-5">Proveedores</h1>
    <div class="bg-white rounded-2xl ring-1 ring-black/5 p-4 mb-4 flex flex-wrap gap-2">
      <input type="text" [ngModel]="nombre()" (ngModelChange)="nombre.set($event)" placeholder="Nombre" aria-label="Nombre"
        class="flex-1 min-w-40 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      <input type="tel" [ngModel]="telefono()" (ngModelChange)="telefono.set($event)" placeholder="Teléfono" aria-label="Teléfono"
        class="w-40 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      <input type="text" [ngModel]="nota()" (ngModelChange)="nota.set($event)" placeholder="Nota (qué trae, días de visita…)" aria-label="Nota"
        class="flex-1 min-w-48 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
      <button type="button" (click)="guardar()" [disabled]="!nombre().trim()"
        class="bg-brand-500 hover:bg-brand-600 disabled:bg-stone-300 text-white font-bold px-5 rounded-full text-sm">
        {{ editando() ? 'Guardar' : 'Agregar' }}
      </button>
      @if (editando()) { <button type="button" (click)="limpiar()" class="text-sm font-semibold text-stone-500 px-2">Cancelar</button> }
    </div>
    <div class="bg-white rounded-2xl ring-1 ring-black/5">
      @for (p of proveedores(); track p.id) {
        <div class="flex items-center gap-3 p-4 border-b border-stone-50 last:border-0">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-stone-800">{{ p.nombre }}</p>
            <p class="text-xs text-stone-500">{{ p.telefono ?? '' }}{{ p.telefono && p.nota ? ' · ' : '' }}{{ p.nota ?? '' }}</p>
          </div>
          <button type="button" (click)="editar(p)" class="text-sm font-semibold text-brand-600 hover:underline">Editar</button>
          <button type="button" (click)="borrar(p)" class="text-sm font-semibold text-stone-400 hover:text-red-500">Borrar</button>
        </div>
      } @empty {
        <p class="p-8 text-center text-stone-400 text-sm">Todavía no cargaste proveedores.</p>
      }
    </div>
  `,
})
export class PosProveedoresComponent {
  private readonly pos = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly proveedores = signal<Proveedor[]>([]);
  readonly editando = signal<string | null>(null);
  readonly nombre = signal('');
  readonly telefono = signal('');
  readonly nota = signal('');

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.pos.proveedores().subscribe((p) => this.proveedores.set(p));
  }

  editar(p: Proveedor): void {
    this.editando.set(p.id);
    this.nombre.set(p.nombre);
    this.telefono.set(p.telefono ?? '');
    this.nota.set(p.nota ?? '');
  }

  limpiar(): void {
    this.editando.set(null);
    this.nombre.set('');
    this.telefono.set('');
    this.nota.set('');
  }

  guardar(): void {
    if (!this.nombre().trim()) return;
    this.pos
      .guardarProveedor(this.editando(), {
        nombre: this.nombre().trim(),
        telefono: this.telefono().trim() || null,
        nota: this.nota().trim() || null,
      })
      .subscribe(() => {
        this.toast.success('Proveedor guardado.');
        this.limpiar();
        this.cargar();
      });
  }

  async borrar(p: Proveedor): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Borrar proveedor', message: `¿Borrar "${p.nombre}"?`, confirmLabel: 'Borrar', danger: true });
    if (!ok) return;
    this.pos.borrarProveedor(p.id).subscribe(() => this.cargar());
  }
}
