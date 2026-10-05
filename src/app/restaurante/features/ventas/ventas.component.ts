import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';

function hoyIso(): string {
  return new Date().toISOString().substring(0, 10);
}

function haceDiasIso(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().substring(0, 10);
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  protected readonly reporteService = inject(ReporteService);

  desde = haceDiasIso(29);
  hasta = hoyIso();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.reporteService.cargarVentas(this.desde, this.hasta);
    this.reporteService.cargarPropinas(this.desde, this.hasta);
    this.reporteService.cargarProductos(this.desde, this.hasta);
  }
}
