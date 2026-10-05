import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../core/services/mesa.service';
import { OrdenService } from '../../core/services/orden.service';
import { OrdenPanelComponent } from '../../shared/components/orden-panel/orden-panel.component';
import { Mesa } from '../../core/models/mesa.model';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [FormsModule, OrdenPanelComponent],
  templateUrl: './mesas.component.html',
})
export class MesasComponent implements OnInit {
  protected readonly mesaService = inject(MesaService);
  protected readonly ordenService = inject(OrdenService);
  protected readonly salonActivoId = signal<number | null>(null);
  protected readonly mesaSeleccionadaId = signal<number | null>(null);
  protected readonly comensales = signal(2);

  protected readonly salonActivo = computed(() => {
    const id = this.salonActivoId();
    return this.mesaService.salones().find((s) => s.salon.id === id) ?? this.mesaService.salones()[0] ?? null;
  });

  /** Derivado de salones() en vez de una copia propia — se mantiene al día solo con recargar salones. */
  protected readonly mesaSeleccionada = computed(() => {
    const id = this.mesaSeleccionadaId();
    if (id === null) return null;
    for (const s of this.mesaService.salones()) {
      const mesa = s.mesas.find((m) => m.id === id);
      if (mesa) return mesa;
    }
    return null;
  });

  ngOnInit(): void {
    this.mesaService.cargar();
  }

  elegirSalon(id: number): void {
    this.salonActivoId.set(id);
  }

  esSalonActivo(salonId: number): boolean {
    return this.salonActivo()?.salon.id === salonId;
  }

  colorMesa(estado: Mesa['estado']): string {
    switch (estado) {
      case 'OCUPADA':
        return 'bg-red-500 hover:bg-red-600';
      case 'ESPERANDO_PAGO':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-mint-500 hover:bg-mint-600';
    }
  }

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionadaId.set(mesa.id);
    this.comensales.set(2);
    if (mesa.estado === 'OCUPADA') {
      this.ordenService.cargarPorMesa(mesa.id).subscribe();
    } else {
      this.ordenService.limpiar();
    }
  }

  cerrarPanel(): void {
    this.mesaSeleccionadaId.set(null);
    this.ordenService.limpiar();
    this.mesaService.cargar();
  }

  abrirMesa(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return;
    this.ordenService.abrirMesa(mesa.id, this.comensales()).subscribe(() => this.mesaService.cargar());
  }
}
