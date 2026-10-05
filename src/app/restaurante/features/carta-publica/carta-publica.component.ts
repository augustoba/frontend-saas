import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuOnlineService } from '../../core/services/menu-online.service';
import { CartaPublica, ProductoDetallePublico, ProductoPublico, ZonaEnvioPublica } from '../../core/models/menu-online.model';
import { ItemCarrito, PedidoOnlineService } from '../../core/services/pedido-online.service';
import { OrdenTipo } from '../../core/models/orden.model';

function likesGuardados(slug: string): Set<number> {
  try {
    const raw = localStorage.getItem(`carta_likes_${slug}`);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function guardarLike(slug: string, ids: Set<number>): void {
  try {
    localStorage.setItem(`carta_likes_${slug}`, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico, se pierde entre sesiones.
  }
}

@Component({
  selector: 'app-carta-publica',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './carta-publica.component.html',
})
export class CartaPublicaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly menuOnlineService = inject(MenuOnlineService);
  private readonly pedidoOnlineService = inject(PedidoOnlineService);

  protected readonly carta = signal<CartaPublica | null>(null);
  protected readonly categoriaActiva = signal<number | null>(null);
  protected readonly busqueda = signal('');
  protected readonly noEncontrado = signal(false);

  protected readonly productoAbierto = signal<ProductoDetallePublico | null>(null);
  protected readonly likesDados = signal<Set<number>>(new Set());
  protected readonly comentarioNombre = signal('');
  protected readonly comentarioTexto = signal('');

  protected readonly carrito = signal<ItemCarrito[]>([]);
  protected readonly mostrarCheckout = signal(false);
  protected readonly pedidoConfirmado = signal(false);
  nombreCliente = '';
  telefonoCliente = '';
  direccionEntrega = '';
  tipoPedido: OrdenTipo = 'DELIVERY';
  metodoPago = 'Efectivo';
  zonaEnvioId: number | null = null;

  private slug = '';

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.likesDados.set(likesGuardados(this.slug));
    this.menuOnlineService.cartaPublica(this.slug).subscribe({
      next: (data) => {
        this.carta.set(data);
        this.categoriaActiva.set(data.categorias[0]?.id ?? null);
      },
      error: () => this.noEncontrado.set(true),
    });
  }

  elegirCategoria(id: number): void {
    this.categoriaActiva.set(id);
  }

  productosFiltrados(): { categoriaNombre: string; productos: CartaPublica['categorias'][0]['productos'] }[] {
    const c = this.carta();
    if (!c) return [];
    const q = this.busqueda().toLowerCase().trim();

    const categorias = q
      ? c.categorias
      : c.categorias.filter((cat) => cat.id === this.categoriaActiva());

    return categorias
      .map((cat) => ({
        categoriaNombre: cat.nombre,
        productos: q ? cat.productos.filter((p) => p.nombre.toLowerCase().includes(q)) : cat.productos,
      }))
      .filter((cat) => cat.productos.length > 0);
  }

  linkGoogleReview(): string | null {
    const red = this.carta()?.redesSociales.find((r) => r.plataforma.toLowerCase().includes('google'));
    return red?.url ?? null;
  }

  abrirProducto(p: ProductoPublico): void {
    this.comentarioNombre.set('');
    this.comentarioTexto.set('');
    this.menuOnlineService.detalleProducto(this.slug, p.id).subscribe((detalle) => this.productoAbierto.set(detalle));
  }

  cerrarProducto(): void {
    this.productoAbierto.set(null);
  }

  yaDioLike(productoId: number): boolean {
    return this.likesDados().has(productoId);
  }

  darLike(): void {
    const producto = this.productoAbierto();
    if (!producto || this.yaDioLike(producto.id)) return;
    this.menuOnlineService.darLike(this.slug, producto.id).subscribe(({ likes }) => {
      this.productoAbierto.set({ ...producto, likes });
      const nuevos = new Set(this.likesDados());
      nuevos.add(producto.id);
      this.likesDados.set(nuevos);
      guardarLike(this.slug, nuevos);
    });
  }

  enviarComentario(): void {
    const producto = this.productoAbierto();
    if (!producto || !this.comentarioNombre().trim() || !this.comentarioTexto().trim()) return;
    this.menuOnlineService.comentar(this.slug, producto.id, this.comentarioNombre(), this.comentarioTexto()).subscribe((comentario) => {
      this.productoAbierto.set({ ...producto, comentarios: [comentario, ...producto.comentarios] });
      this.comentarioNombre.set('');
      this.comentarioTexto.set('');
    });
  }

  // --- Carrito / pedido online ---
  agregarAlCarrito(p: ProductoPublico | ProductoDetallePublico): void {
    if (!p.precio) return;
    const actual = this.carrito();
    const existente = actual.find((i) => i.productoId === p.id);
    if (existente) {
      this.carrito.set(actual.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)));
    } else {
      this.carrito.set([...actual, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }]);
    }
  }

  cambiarCantidadCarrito(productoId: number, delta: number): void {
    const nuevo = this.carrito()
      .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
      .filter((i) => i.cantidad > 0);
    this.carrito.set(nuevo);
  }

  totalCarrito(): number {
    return this.carrito().reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  }

  cantidadCarrito(): number {
    return this.carrito().reduce((acc, i) => acc + i.cantidad, 0);
  }

  zonaSeleccionada(): ZonaEnvioPublica | null {
    if (this.tipoPedido !== 'DELIVERY') return null;
    return this.carta()?.zonasEnvio.find((z) => z.id === this.zonaEnvioId) ?? null;
  }

  costoEnvio(): number {
    return this.zonaSeleccionada()?.costo ?? 0;
  }

  totalConEnvio(): number {
    return this.totalCarrito() + this.costoEnvio();
  }

  confirmarPedido(): void {
    if (!this.nombreCliente.trim() || !this.telefonoCliente.trim() || !this.carrito().length) return;
    if (this.tipoPedido === 'DELIVERY' && !this.direccionEntrega.trim()) return;

    this.pedidoOnlineService
      .crear({
        nombreCliente: this.nombreCliente,
        telefonoCliente: this.telefonoCliente,
        direccionEntrega: this.tipoPedido === 'DELIVERY' ? this.direccionEntrega : null,
        tipo: this.tipoPedido,
        metodoPago: this.metodoPago,
        zonaEnvioId: this.tipoPedido === 'DELIVERY' ? this.zonaEnvioId : null,
        items: this.carrito().map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, notas: null })),
      })
      .subscribe(() => {
        this.abrirWhatsapp();
        this.carrito.set([]);
        this.mostrarCheckout.set(false);
        this.pedidoConfirmado.set(true);
        setTimeout(() => this.pedidoConfirmado.set(false), 6000);
      });
  }

  private abrirWhatsapp(): void {
    const telRestaurante = (this.carta()?.telefono ?? '').replace(/\D/g, '');
    if (!telRestaurante) return;

    let mensaje = 'Hola, quiero hacer el siguiente pedido:\n\n';
    for (const item of this.carrito()) {
      mensaje += `👉 ${item.cantidad} x ${item.nombre} | $${item.precio * item.cantidad}\n`;
    }
    const zona = this.zonaSeleccionada();
    if (zona) {
      mensaje += `🚚 Envío (${zona.nombre}): $${zona.costo}\n`;
    }
    mensaje += `\nMétodo de Pago: ${this.metodoPago}\nTotal: $${this.totalConEnvio()}\n\n`;
    if (this.tipoPedido === 'DELIVERY') {
      mensaje += `Entregar en: ${this.direccionEntrega}\n`;
    } else {
      mensaje += 'Retiro en el local\n';
    }
    mensaje += `A nombre de: ${this.nombreCliente}\nTeléfono: ${this.telefonoCliente}`;

    window.open(`https://wa.me/${telRestaurante}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }
}
