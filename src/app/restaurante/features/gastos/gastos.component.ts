import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../../core/services/gasto.service';
import { Gasto } from '../../core/models/gasto.model';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gastos.component.html',
})
export class GastosComponent implements OnInit {
  protected readonly gastoService = inject(GastoService);
  protected readonly mostrarForm = signal(false);

  categoriaGastoId: number | null = null;
  fecha = new Date().toISOString().substring(0, 10);
  monto: number | null = null;
  descripcion = '';

  ngOnInit(): void {
    this.gastoService.cargar();
  }

  guardar(): void {
    if (!this.categoriaGastoId || !this.monto) return;
    this.gastoService
      .crear({
        proveedorId: null,
        categoriaGastoId: this.categoriaGastoId,
        fecha: this.fecha,
        fechaVencimiento: null,
        monto: this.monto,
        descripcion: this.descripcion || null,
      })
      .subscribe(() => {
        this.monto = null;
        this.descripcion = '';
        this.mostrarForm.set(false);
        this.gastoService.cargar();
      });
  }

  marcarPagado(gasto: Gasto): void {
    this.gastoService.marcarPagado(gasto.id).subscribe(() => this.gastoService.cargar());
  }
}
