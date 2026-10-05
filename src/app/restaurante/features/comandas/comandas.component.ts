import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ComandaService } from '../../core/services/comanda.service';
import { Orden } from '../../core/models/orden.model';

const INTERVALO_POLLING_MS = 5000;
const MINUTOS_DEMORA = 15;

type Tab = 'preparacion' | 'finalizadas';
type Urgencia = 'sin-tomar' | 'tomado' | 'demorada';

@Component({
  selector: 'app-comandas',
  standalone: true,
  imports: [],
  templateUrl: './comandas.component.html',
})
export class ComandasComponent implements OnInit, OnDestroy {
  protected readonly comandaService = inject(ComandaService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly tab = signal<Tab>('preparacion');

  ngOnInit(): void {
    this.comandaService.cargar();
    this.intervalId = setInterval(() => this.comandaService.cargar(), INTERVALO_POLLING_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  enPreparacion(): Orden[] {
    return this.comandaService.comandas().filter((o) => o.estadoPreparacion === 'SIN_TOMAR' || o.estadoPreparacion === 'TOMADO');
  }

  finalizadas(): Orden[] {
    return this.comandaService.comandas().filter((o) => o.estadoPreparacion === 'LISTO');
  }

  urgencia(o: Orden): Urgencia {
    if (o.estadoPreparacion === 'SIN_TOMAR') return 'sin-tomar';
    if (o.fechaTomado) {
      const minutos = (Date.now() - new Date(o.fechaTomado).getTime()) / 60000;
      if (minutos >= MINUTOS_DEMORA) return 'demorada';
    }
    return 'tomado';
  }

  origen(o: Orden): string {
    if (o.nombreClienteOnline) return o.tipo === 'DELIVERY' ? `🛵 ${o.nombreClienteOnline}` : `🛍 ${o.nombreClienteOnline}`;
    if (o.mesaNombre) return `🍽 ${o.mesaNombre}`;
    return '🧾 Mostrador';
  }

  avisarA(o: Orden): string {
    if (o.nombreClienteOnline) return o.tipo === 'DELIVERY' ? 'Repartidor' : 'Mostrador';
    return o.usuarioNombre;
  }

  tomar(o: Orden): void {
    this.comandaService.tomar(o.id).subscribe(() => this.comandaService.cargar());
  }

  finalizar(o: Orden): void {
    this.comandaService.finalizar(o.id).subscribe(() => this.comandaService.cargar());
  }

  entregar(o: Orden): void {
    this.comandaService.entregar(o.id).subscribe(() => this.comandaService.cargar());
  }
}
