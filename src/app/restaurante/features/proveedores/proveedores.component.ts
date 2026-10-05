import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../core/models/proveedor.model';
import { Gasto } from '../../core/models/gasto.model';

type Tab = 'proveedores' | 'gastos-sin-asignar';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './proveedores.component.html',
})
export class ProveedoresComponent implements OnInit {
  protected readonly proveedorService = inject(ProveedorService);
  protected readonly mostrarForm = signal(false);
  protected readonly tab = signal<Tab>('proveedores');

  nombre = '';
  telefono = '';
  email = '';

  proveedorSeleccionadoPorGasto = new Map<number, number | null>();

  ngOnInit(): void {
    this.proveedorService.cargar();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
    if (tab === 'gastos-sin-asignar') this.proveedorService.cargarGastosSinAsignar();
  }

  guardar(): void {
    if (!this.nombre.trim()) return;
    this.proveedorService.crear({ nombre: this.nombre, telefono: this.telefono || null, email: this.email || null }).subscribe(() => {
      this.nombre = '';
      this.telefono = '';
      this.email = '';
      this.mostrarForm.set(false);
      this.proveedorService.cargar();
    });
  }

  eliminar(proveedor: Proveedor): void {
    this.proveedorService.eliminar(proveedor.id).subscribe(() => this.proveedorService.cargar());
  }

  asignarProveedor(gasto: Gasto): void {
    const proveedorId = this.proveedorSeleccionadoPorGasto.get(gasto.id);
    if (!proveedorId) return;
    this.proveedorService.asignarProveedor(gasto.id, proveedorId).subscribe(() => this.proveedorService.cargarGastosSinAsignar());
  }
}
