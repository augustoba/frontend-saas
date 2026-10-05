import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { OrdenService } from '../../../core/services/orden.service';

@Component({
  selector: 'app-pago-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pago-modal.component.html',
})
export class PagoModalComponent implements OnInit {
  private readonly ordenService = inject(OrdenService);
  protected readonly adminService = inject(AdminService);

  @Input({ required: true }) ordenId!: number;
  @Input({ required: true }) total = 0;
  @Output() pagado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  protected readonly medioPagoId = signal<number | null>(null);
  protected readonly monto = signal(0);
  protected readonly propina = signal(0);
  protected readonly enviando = signal(false);

  ngOnInit(): void {
    this.adminService.cargarMediosPago();
    this.monto.set(this.total);
  }

  confirmar(): void {
    const medioId = this.medioPagoId();
    if (!medioId) return;
    this.enviando.set(true);
    this.ordenService.pagar(this.ordenId, medioId, this.monto(), this.propina()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.pagado.emit();
      },
      error: () => this.enviando.set(false),
    });
  }
}
