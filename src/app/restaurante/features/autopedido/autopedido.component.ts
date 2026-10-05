import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutopedidoService } from '../../core/services/autopedido.service';
import { ProductoAutopedido } from '../../core/models/autopedido.model';

const INTERVALO_POLLING_MS = 5000;

@Component({
  selector: 'app-autopedido',
  standalone: true,
  imports: [],
  templateUrl: './autopedido.component.html',
})
export class AutopedidoComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  protected readonly autopedidoService = inject(AutopedidoService);
  protected readonly mensaje = signal<string | null>(null);

  private token = '';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.autopedidoService.cargar(this.token);
    this.intervalId = setInterval(() => this.autopedidoService.cargar(this.token), INTERVALO_POLLING_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  agregar(producto: ProductoAutopedido): void {
    this.autopedidoService.agregarItem(this.token, producto.id, 1, null).subscribe(() => {
      this.mostrarMensaje(`Agregaste ${producto.nombre}`);
    });
  }

  llamarMozo(): void {
    this.autopedidoService.llamarMozo(this.token).subscribe(() => this.mostrarMensaje('Avisamos al mozo, ya viene.'));
  }

  pedirCuenta(): void {
    this.autopedidoService.pedirCuenta(this.token).subscribe(() => this.mostrarMensaje('Pedimos la cuenta por vos.'));
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), 3000);
  }
}
