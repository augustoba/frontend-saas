import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import QRCode from 'qrcode';
import { MenuOnlineService } from '../../core/services/menu-online.service';
import { FormaLogo, MenuLayout, RedSocial, Tipografia } from '../../core/models/menu-online.model';

type Tab = 'configuracion' | 'analiticas' | 'comentarios';

@Component({
  selector: 'app-menu-online',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './menu-online.component.html',
})
export class MenuOnlineComponent implements OnInit {
  protected readonly menuOnlineService = inject(MenuOnlineService);
  protected readonly guardando = signal(false);
  protected readonly guardado = signal(false);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly tab = signal<Tab>('configuracion');

  formaLogo: FormaLogo = 'CIRCULAR';
  layout: MenuLayout = 'CARTA';
  columnasMax = 3;
  tipografia: Tipografia = 'MODERNA';
  encabezadoTexto = '';
  mostrarDescripciones = true;
  mostrarDireccion = true;
  redesSociales: RedSocial[] = [];

  nuevaRedPlataforma = '';
  nuevaRedUrl = '';

  get publicUrl(): string {
    const slug = this.menuOnlineService.config()?.slug ?? '';
    return `${location.origin}/carta/${slug}`;
  }

  ngOnInit(): void {
    this.menuOnlineService.cargar().subscribe((c) => {
      this.formaLogo = c.formaLogo;
      this.layout = c.layout;
      this.columnasMax = c.columnasMax;
      this.tipografia = c.tipografia;
      this.encabezadoTexto = c.encabezadoTexto ?? '';
      this.mostrarDescripciones = c.mostrarDescripciones;
      this.mostrarDireccion = c.mostrarDireccion;
      this.redesSociales = [...c.redesSociales];
      this.generarQr();
    });
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'analiticas') this.menuOnlineService.cargarAnaliticas();
    if (tab === 'comentarios') this.menuOnlineService.cargarComentariosAdmin();
  }

  eliminarComentario(id: number): void {
    this.menuOnlineService.eliminarComentarioAdmin(id).subscribe(() => this.menuOnlineService.cargarComentariosAdmin());
  }

  agregarRedSocial(): void {
    if (!this.nuevaRedPlataforma.trim() || !this.nuevaRedUrl.trim()) return;
    this.redesSociales = [...this.redesSociales, { plataforma: this.nuevaRedPlataforma, url: this.nuevaRedUrl, nombreMostrar: null }];
    this.nuevaRedPlataforma = '';
    this.nuevaRedUrl = '';
  }

  quitarRedSocial(index: number): void {
    this.redesSociales = this.redesSociales.filter((_, i) => i !== index);
  }

  copiarLink(): void {
    navigator.clipboard?.writeText(this.publicUrl);
  }

  descargarQr(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'menu-qr.png';
    a.click();
  }

  private generarQr(): void {
    QRCode.toDataURL(this.publicUrl, { margin: 1, width: 240, color: { dark: '#6d0d33' } })
      .then((url) => this.qrDataUrl.set(url))
      .catch(() => this.qrDataUrl.set(null));
  }

  guardar(): void {
    this.guardando.set(true);
    this.menuOnlineService
      .guardar({
        formaLogo: this.formaLogo,
        layout: this.layout,
        columnasMax: this.columnasMax,
        tipografia: this.tipografia,
        encabezadoTexto: this.encabezadoTexto || null,
        mostrarDescripciones: this.mostrarDescripciones,
        mostrarDireccion: this.mostrarDireccion,
        redesSociales: this.redesSociales,
      })
      .subscribe(() => {
        this.guardando.set(false);
        this.guardado.set(true);
        this.menuOnlineService.cargar();
        setTimeout(() => this.guardado.set(false), 2500);
      });
  }
}
