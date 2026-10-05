import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../core/services/reserva.service';
import { MesaService } from '../../core/services/mesa.service';
import { TurnoReserva } from '../../core/models/reserva.model';

function hoyIso(): string {
  return new Date().toISOString().substring(0, 10);
}

type Tab = 'reservas' | 'mapa-calor' | 'turnos';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reservas.component.html',
})
export class ReservasComponent implements OnInit {
  protected readonly reservaService = inject(ReservaService);
  protected readonly mesaService = inject(MesaService);
  protected readonly mostrarForm = signal(false);
  protected readonly tab = signal<Tab>('reservas');

  fecha = hoyIso();

  salonId: number | null = null;
  nombreCliente = '';
  telefonoCliente = '';
  hora = '20:00';
  cantidadPersonas = 2;

  // Turnos
  protected readonly turnoEditando = signal<TurnoReserva | null>(null);
  turnoNombre = '';
  turnoHoraInicio = '12:00';
  turnoHoraFin = '15:00';
  turnoCapacidadMaxima = 40;

  ngOnInit(): void {
    this.mesaService.cargar();
    this.reservaService.cargar(this.fecha);
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
    if (tab === 'mapa-calor') this.reservaService.cargarMapaCalor(this.fecha);
    if (tab === 'turnos') this.reservaService.cargarTurnos();
  }

  cambiarFecha(dias: number): void {
    const d = new Date(this.fecha + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    this.fecha = d.toISOString().substring(0, 10);
    this.reservaService.cargar(this.fecha);
    if (this.tab() === 'mapa-calor') this.reservaService.cargarMapaCalor(this.fecha);
  }

  guardar(): void {
    if (!this.salonId || !this.nombreCliente.trim()) return;
    this.reservaService
      .crear({
        salonId: this.salonId,
        nombreCliente: this.nombreCliente,
        telefonoCliente: this.telefonoCliente || null,
        fecha: this.fecha,
        hora: this.hora || null,
        cantidadPersonas: this.cantidadPersonas,
        notas: null,
      })
      .subscribe(() => {
        this.nombreCliente = '';
        this.telefonoCliente = '';
        this.mostrarForm.set(false);
        this.reservaService.cargar(this.fecha);
      });
  }

  intensidadColor(personas: number): string {
    if (personas <= 0) return 'bg-surface-3';
    if (personas < 10) return 'bg-brand-700';
    if (personas < 20) return 'bg-brand-600';
    return 'bg-brand-500';
  }

  // --- Turnos ---
  nuevoTurno(): void {
    this.turnoEditando.set(null);
    this.turnoNombre = '';
    this.turnoHoraInicio = '12:00';
    this.turnoHoraFin = '15:00';
    this.turnoCapacidadMaxima = 40;
    this.mostrarForm.set(true);
  }

  editarTurno(t: TurnoReserva): void {
    this.turnoEditando.set(t);
    this.turnoNombre = t.nombre;
    this.turnoHoraInicio = t.horaInicio;
    this.turnoHoraFin = t.horaFin;
    this.turnoCapacidadMaxima = t.capacidadMaxima;
    this.mostrarForm.set(true);
  }

  guardarTurno(): void {
    if (!this.turnoNombre.trim()) return;
    const request = {
      nombre: this.turnoNombre,
      horaInicio: this.turnoHoraInicio,
      horaFin: this.turnoHoraFin,
      capacidadMaxima: this.turnoCapacidadMaxima,
    };
    const editando = this.turnoEditando();
    const obs = editando ? this.reservaService.actualizarTurno(editando.id, request) : this.reservaService.crearTurno(request);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.turnoEditando.set(null);
      this.reservaService.cargarTurnos();
    });
  }

  archivarTurno(t: TurnoReserva): void {
    this.reservaService.archivarTurno(t.id).subscribe(() => this.reservaService.cargarTurnos());
  }
}
