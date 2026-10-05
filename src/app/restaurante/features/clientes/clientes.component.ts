import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente, MovimientoCuentaCorriente, TipoMovimientoCuentaCorriente } from '../../core/models/cliente.model';

type Tab = 'clientes' | 'cuentas-corrientes';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  protected readonly clienteService = inject(ClienteService);
  protected readonly mostrarForm = signal(false);
  protected readonly tab = signal<Tab>('clientes');

  nombre = '';
  email = '';
  telefono = '';

  protected readonly clienteSeleccionadoId = signal<number | null>(null);
  protected readonly clienteSeleccionado = computed(
    () => this.clienteService.items().find((c) => c.id === this.clienteSeleccionadoId()) ?? null,
  );
  protected readonly movimientos = signal<MovimientoCuentaCorriente[]>([]);
  movTipo: TipoMovimientoCuentaCorriente = 'CARGO';
  movMonto: number | null = null;
  movDescripcion = '';

  ngOnInit(): void {
    this.clienteService.cargar();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
    this.clienteSeleccionadoId.set(null);
  }

  guardar(): void {
    if (!this.nombre.trim()) return;
    this.clienteService.crear({ nombre: this.nombre, email: this.email || null, telefono: this.telefono || null }).subscribe(() => {
      this.nombre = '';
      this.email = '';
      this.telefono = '';
      this.mostrarForm.set(false);
      this.clienteService.cargar();
    });
  }

  clientesConCuentaCorriente(): Cliente[] {
    return this.clienteService.items().filter((c) => c.tieneCuentaCorriente);
  }

  clientesSinCuentaCorriente(): Cliente[] {
    return this.clienteService.items().filter((c) => !c.tieneCuentaCorriente);
  }

  habilitarCuentaCorriente(cliente: Cliente): void {
    this.clienteService.habilitarCuentaCorriente(cliente.id, true).subscribe(() => this.clienteService.cargar());
  }

  deshabilitarCuentaCorriente(cliente: Cliente): void {
    this.clienteService.habilitarCuentaCorriente(cliente.id, false).subscribe(() => {
      if (this.clienteSeleccionadoId() === cliente.id) this.clienteSeleccionadoId.set(null);
      this.clienteService.cargar();
    });
  }

  verMovimientos(cliente: Cliente): void {
    this.clienteSeleccionadoId.set(cliente.id);
    this.movMonto = null;
    this.movDescripcion = '';
    this.clienteService.listarMovimientosCuentaCorriente(cliente.id).subscribe((data) => this.movimientos.set(data));
  }

  registrarMovimiento(): void {
    const clienteId = this.clienteSeleccionadoId();
    if (!clienteId || this.movMonto == null || this.movMonto <= 0) return;
    this.clienteService.registrarMovimientoCuentaCorriente(clienteId, this.movTipo, this.movMonto, this.movDescripcion || null).subscribe(() => {
      this.movMonto = null;
      this.movDescripcion = '';
      this.clienteService.cargar();
      this.clienteService.listarMovimientosCuentaCorriente(clienteId).subscribe((data) => this.movimientos.set(data));
    });
  }
}
