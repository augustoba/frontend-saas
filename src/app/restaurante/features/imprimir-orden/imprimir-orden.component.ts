import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrdenService } from '../../core/services/orden.service';
import { Orden } from '../../core/models/orden.model';

type TipoImpresion = 'comanda' | 'precuenta';

@Component({
  selector: 'app-imprimir-orden',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './imprimir-orden.component.html',
})
export class ImprimirOrdenComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordenService = inject(OrdenService);

  protected readonly orden = signal<Orden | null>(null);
  protected tipo: TipoImpresion = 'comanda';

  ngOnInit(): void {
    const ordenId = Number(this.route.snapshot.paramMap.get('ordenId'));
    this.tipo = this.route.snapshot.paramMap.get('tipo') === 'precuenta' ? 'precuenta' : 'comanda';

    this.ordenService.cargar(ordenId).subscribe((orden) => {
      this.orden.set(orden);
      setTimeout(() => window.print(), 300);
    });
  }

  esComanda(): boolean {
    return this.tipo === 'comanda';
  }

  identificador(orden: Orden): string {
    if (orden.mesaNombre) return orden.mesaNombre;
    if (orden.tipo === 'DELIVERY') return 'Envío';
    if (orden.tipo === 'LLEVAR') return 'Para llevar';
    return `Mostrador #${orden.id}`;
  }
}
