import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Cliente, ClienteKpis, MovimientoCuentaCorriente, TipoMovimientoCuentaCorriente } from '../models/cliente.model';

interface PageResponse<T> {
  content: T[];
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Cliente[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly kpisSignal = signal<ClienteKpis | null>(null);
  readonly kpis = this.kpisSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<PageResponse<Cliente>>(apiUrl('/v1/clientes')).subscribe({
      next: (data) => {
        this.itemsSignal.set(data.content);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
    this.http.get<ClienteKpis>(apiUrl('/v1/clientes/kpis')).subscribe((data) => this.kpisSignal.set(data));
  }

  crear(request: { nombre: string; email: string | null; telefono: string | null }) {
    return this.http.post<Cliente>(apiUrl('/v1/clientes'), {
      ...request,
      tieneCuentaCorriente: false,
      descuentoPorcentaje: null,
      limiteCredito: null,
    });
  }

  habilitarCuentaCorriente(id: number, habilitada: boolean) {
    return this.http.patch<Cliente>(apiUrl(`/v1/clientes/${id}/cuenta-corriente/habilitar`), { habilitada });
  }

  listarMovimientosCuentaCorriente(id: number) {
    return this.http.get<MovimientoCuentaCorriente[]>(apiUrl(`/v1/clientes/${id}/cuenta-corriente`));
  }

  registrarMovimientoCuentaCorriente(id: number, tipo: TipoMovimientoCuentaCorriente, monto: number, descripcion: string | null) {
    return this.http.post<MovimientoCuentaCorriente>(apiUrl(`/v1/clientes/${id}/cuenta-corriente`), { tipo, monto, descripcion });
  }
}
