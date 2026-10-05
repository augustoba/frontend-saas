import { RouterLink } from '@angular/router';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectorService } from '../../core/services/sector.service';
import { AdminService } from '../../core/services/admin.service';
import { Sector, SectorTipo } from '../../core/models/sector.model';
import { Colaborador, ImportarResultado, Preferencias, Rol } from '../../core/models/admin.model';

type Tab =
  | 'sectores'
  | 'medios-pago'
  | 'turnos'
  | 'zonas-envio'
  | 'clasificacion-gastos'
  | 'roles'
  | 'colaboradores'
  | 'preferencias'
  | 'importar';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  protected readonly sectorService = inject(SectorService);
  protected readonly adminService = inject(AdminService);

  protected readonly tab = signal<Tab>('sectores');
  protected readonly mostrarForm = signal(false);

  // Sectores
  sectorNombre = '';
  sectorTipo: SectorTipo = 'NINGUNA';
  sectorIp = '';

  // Medios de pago
  medioNombre = '';
  medioEsEfectivo = false;
  medioEsCtaCte = false;

  // Turnos
  turnoNombre = '';
  turnoInicio = '09:00';
  turnoFin = '17:00';

  // Zonas de envío
  zonaNombre = '';
  zonaCosto = 0;

  // Clasificación de gastos
  clasificacionNombre = '';

  // Roles
  protected readonly rolEditando = signal<Rol | null>(null);
  rolNombre = '';
  rolPermisos = new Set<string>();

  // Colaboradores
  colabNombre = '';
  colabApellido = '';
  colabEmail = '';
  colabPassword = '';
  colabRolId: number | null = null;

  // Importar
  protected readonly resultadoImportacion = signal<ImportarResultado | null>(null);
  protected readonly importando = signal(false);

  ngOnInit(): void {
    this.sectorService.cargar();
    this.adminService.cargarMediosPago();
    this.adminService.cargarTurnos();
    this.adminService.cargarZonasEnvio();
    this.adminService.cargarClasificaciones();
    this.adminService.cargarPreferencias();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
    this.rolEditando.set(null);
  }

  archivarSector(sector: Sector): void {
    this.sectorService.archivar(sector.id).subscribe(() => this.sectorService.cargar());
  }

  guardarSector(): void {
    if (!this.sectorNombre.trim()) return;
    this.sectorService
      .crear({ sucursalId: 1, nombre: this.sectorNombre, tipo: this.sectorTipo, impresoraIp: this.sectorIp || null, kdsActivo: false })
      .subscribe(() => {
        this.sectorNombre = '';
        this.sectorTipo = 'NINGUNA';
        this.sectorIp = '';
        this.mostrarForm.set(false);
        this.sectorService.cargar();
      });
  }

  guardarMedioPago(): void {
    if (!this.medioNombre.trim()) return;
    this.adminService
      .crearMedioPago({ nombre: this.medioNombre, esEfectivo: this.medioEsEfectivo, esCuentaCorriente: this.medioEsCtaCte, requiereReferencia: false })
      .subscribe(() => {
        this.medioNombre = '';
        this.medioEsEfectivo = false;
        this.medioEsCtaCte = false;
        this.mostrarForm.set(false);
        this.adminService.cargarMediosPago();
      });
  }

  guardarTurno(): void {
    if (!this.turnoNombre.trim()) return;
    this.adminService
      .crearTurno({ nombre: this.turnoNombre, horaInicio: this.turnoInicio, horaFin: this.turnoFin })
      .subscribe(() => {
        this.turnoNombre = '';
        this.mostrarForm.set(false);
        this.adminService.cargarTurnos();
      });
  }

  guardarZonaEnvio(): void {
    if (!this.zonaNombre.trim()) return;
    this.adminService.crearZonaEnvio({ nombre: this.zonaNombre, costo: this.zonaCosto }).subscribe(() => {
      this.zonaNombre = '';
      this.zonaCosto = 0;
      this.mostrarForm.set(false);
      this.adminService.cargarZonasEnvio();
    });
  }

  archivarZonaEnvio(zona: { id: number }): void {
    this.adminService.archivarZonaEnvio(zona.id).subscribe(() => this.adminService.cargarZonasEnvio());
  }

  guardarClasificacion(): void {
    if (!this.clasificacionNombre.trim()) return;
    this.adminService.crearClasificacion(this.clasificacionNombre).subscribe(() => {
      this.clasificacionNombre = '';
      this.mostrarForm.set(false);
      this.adminService.cargarClasificaciones();
    });
  }

  // --- Roles ---
  nuevoRol(): void {
    this.rolEditando.set(null);
    this.rolNombre = '';
    this.rolPermisos = new Set();
    this.mostrarForm.set(true);
  }

  editarRol(rol: Rol): void {
    this.rolEditando.set(rol);
    this.rolNombre = rol.nombre;
    this.rolPermisos = new Set(rol.permisos);
    this.mostrarForm.set(true);
  }

  togglePermiso(codigo: string): void {
    if (this.rolPermisos.has(codigo)) this.rolPermisos.delete(codigo);
    else this.rolPermisos.add(codigo);
  }

  guardarRol(): void {
    if (!this.rolNombre.trim()) return;
    const permisos = Array.from(this.rolPermisos);
    const editando = this.rolEditando();
    const obs = editando
      ? this.adminService.actualizarRol(editando.id, this.rolNombre, permisos)
      : this.adminService.crearRol(this.rolNombre, permisos);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.rolEditando.set(null);
      this.adminService.cargarRoles();
    });
  }

  archivarRol(rol: Rol): void {
    this.adminService.archivarRol(rol.id).subscribe(() => this.adminService.cargarRoles());
  }

  // --- Colaboradores ---
  guardarColaborador(): void {
    if (!this.colabNombre.trim() || !this.colabEmail.trim() || !this.colabRolId) return;
    this.adminService
      .crearColaborador({
        nombre: this.colabNombre,
        apellido: this.colabApellido || null,
        email: this.colabEmail,
        password: this.colabPassword || null,
        rolId: this.colabRolId,
      })
      .subscribe(() => {
        this.colabNombre = '';
        this.colabApellido = '';
        this.colabEmail = '';
        this.colabPassword = '';
        this.colabRolId = null;
        this.mostrarForm.set(false);
        this.adminService.cargarColaboradores();
      });
  }

  archivarColaborador(c: Colaborador): void {
    this.adminService.archivarColaborador(c.id).subscribe(() => this.adminService.cargarColaboradores());
  }

  // --- Preferencias ---
  guardarPreferencias(campo: keyof Preferencias, valor: boolean): void {
    const actuales = this.adminService.preferencias();
    if (!actuales) return;
    this.adminService.guardarPreferencias({ ...actuales, [campo]: valor }).subscribe();
  }

  // --- Importar ---
  onArchivoElegido(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.importando.set(true);
    this.adminService.importarProductos(archivo).subscribe({
      next: (resultado) => {
        this.resultadoImportacion.set(resultado);
        this.importando.set(false);
      },
      error: () => this.importando.set(false),
    });
    input.value = '';
  }
}
