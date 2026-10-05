import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CajaService } from '../../core/services/caja.service';
import { OrdenService } from '../../core/services/orden.service';
import { Arqueo } from '../../core/models/caja.model';

type Tab = 'arqueos' | 'movimientos' | 'cajas';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './caja.component.html',
})
export class CajaComponent implements OnInit {
  protected readonly cajaService = inject(CajaService);
  protected readonly ordenService = inject(OrdenService);
  protected readonly tab = signal<Tab>('arqueos');
  protected readonly mostrarForm = signal(false);

  nombreCaja = '';
  cajaSeleccionada: number | null = null;
  montoApertura: number | null = null;

  ngOnInit(): void {
    this.cajaService.cargarCajas();
    this.cajaService.cargarArqueos();
    this.cajaService.cargarMovimientos();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
  }

  guardarCaja(): void {
    if (!this.nombreCaja.trim()) return;
    this.cajaService.crearCaja(this.nombreCaja).subscribe(() => {
      this.nombreCaja = '';
      this.mostrarForm.set(false);
      this.cajaService.cargarCajas();
    });
  }

  elegirCajaActiva(arqueo: Arqueo): void {
    this.ordenService.elegirCajaActiva(this.ordenService.cajaActivaId() === arqueo.id ? null : arqueo.id);
  }

  abrirArqueo(): void {
    if (!this.cajaSeleccionada || this.montoApertura === null) return;
    this.cajaService.abrirArqueo(this.cajaSeleccionada, this.montoApertura).subscribe(() => {
      this.cajaSeleccionada = null;
      this.montoApertura = null;
      this.mostrarForm.set(false);
      this.cajaService.cargarArqueos();
    });
  }
}
