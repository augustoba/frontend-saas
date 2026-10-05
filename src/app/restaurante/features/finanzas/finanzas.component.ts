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
  selector: 'app-finanzas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './finanzas.component.html',
})
export class FinanzasComponent implements OnInit {
  protected readonly reporteService = inject(ReporteService);

  desde = haceDiasIso(29);
  hasta = hoyIso();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.reporteService.cargarPyL(this.desde, this.hasta);
  }
}
