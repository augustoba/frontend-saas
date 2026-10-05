import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrdenService } from '../../core/services/orden.service';
import { OrdenPanelComponent } from '../../shared/components/orden-panel/orden-panel.component';
import { OrdenResumen } from '../../core/models/orden.model';

@Component({
  selector: 'app-mostrador',
  standalone: true,
  imports: [FormsModule, OrdenPanelComponent],
  templateUrl: './mostrador.component.html',
})
export class MostradorComponent implements OnInit {
  protected readonly ordenService = inject(OrdenService);
  protected readonly abiertas = signal<OrdenResumen[]>([]);

  ngOnInit(): void {
    this.cargarAbiertas();
  }

  private cargarAbiertas(): void {
    this.ordenService.listarMostradorAbiertas().subscribe((data) => {
      this.abiertas.set(data);
      if (data.length && !this.ordenService.ordenActual()) {
        this.ordenService.cargar(data[0].id).subscribe();
      }
    });
  }

  nuevoPedido(): void {
    this.ordenService.abrirMostrador().subscribe(() => this.cargarAbiertas());
  }

  elegirOrden(id: number): void {
    this.ordenService.cargar(id).subscribe();
  }

  onCerrada(): void {
    this.ordenService.limpiar();
    this.cargarAbiertas();
  }
}
