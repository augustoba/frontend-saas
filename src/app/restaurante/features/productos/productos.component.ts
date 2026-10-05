import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { ProductoService } from '../../core/services/producto.service';
import {
  GrupoModificador,
  ListaPrecio,
  ListaPrecioItem,
  Producto,
  ProductoTipo,
  TipoMovimientoStock,
} from '../../core/models/producto.model';

type Tab = 'productos' | 'categorias' | 'modificadores' | 'listas-precio' | 'stock' | 'inventario';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  protected readonly productoService = inject(ProductoService);

  protected readonly tab = signal<Tab>('productos');
  protected readonly mostrarForm = signal(false);

  // --- Productos ---
  protected readonly productoEditando = signal<Producto | null>(null);
  nombre = '';
  codigo = '';
  categoriaId: number | null = null;
  descripcion = '';
  tipo: ProductoTipo = 'VENDIBLE';
  costo: number | null = null;
  precio: number | null = null;
  unidad = '';
  controlaStock = false;
  disponibleOnline = true;
  grupoIdsSeleccionados = new Set<number>();

  // --- Categorías ---
  categoriaNombre = '';
  categoriaOrden = 0;

  // --- Grupos de modificadores ---
  protected readonly grupoEditando = signal<GrupoModificador | null>(null);
  protected readonly grupoExpandido = signal<number | null>(null);
  grupoNombre = '';
  grupoObligatorio = false;
  grupoMultiple = false;
  grupoMin: number | null = null;
  grupoMax: number | null = null;
  modNombre = '';
  modPrecio: number | null = null;

  // --- Listas de precio ---
  protected readonly listaSeleccionada = signal<ListaPrecio | null>(null);
  protected readonly itemsLista = signal<ListaPrecioItem[]>([]);
  listaNombre = '';
  listaDescripcion = '';
  itemProductoId: number | null = null;
  itemPrecio: number | null = null;

  // --- Movimientos de stock ---
  movProductoId: number | null = null;
  movTipo: TipoMovimientoStock = 'INGRESO';
  movCantidad: number | null = null;
  movMotivo = '';

  ngOnInit(): void {
    this.productoService.cargar();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
    this.mostrarForm.set(false);
    this.productoEditando.set(null);
    this.grupoEditando.set(null);
    this.listaSeleccionada.set(null);
    if (tab === 'modificadores') this.productoService.cargarGrupos();
    if (tab === 'listas-precio') this.productoService.cargarListas();
    if (tab === 'stock') this.productoService.cargarMovimientos();
    if (tab === 'inventario') this.productoService.cargarInventario();
  }

  // --- Productos ---
  nuevoProducto(): void {
    this.productoEditando.set(null);
    this.nombre = '';
    this.codigo = '';
    this.categoriaId = null;
    this.descripcion = '';
    this.tipo = 'VENDIBLE';
    this.costo = null;
    this.precio = null;
    this.unidad = '';
    this.controlaStock = false;
    this.disponibleOnline = true;
    this.grupoIdsSeleccionados = new Set();
    this.productoService.cargarGrupos();
    this.mostrarForm.set(true);
  }

  editarProducto(p: Producto): void {
    this.productoEditando.set(p);
    this.nombre = p.nombre;
    this.codigo = p.codigo ?? '';
    this.categoriaId = p.categoriaId;
    this.descripcion = p.descripcion ?? '';
    this.tipo = p.tipo;
    this.costo = p.costo;
    this.precio = p.precio;
    this.unidad = p.unidad ?? '';
    this.controlaStock = p.controlaStock;
    this.disponibleOnline = p.disponibleOnline;
    this.grupoIdsSeleccionados = new Set(p.grupoModificadorIds);
    this.productoService.cargarGrupos();
    this.mostrarForm.set(true);
  }

  toggleGrupoSeleccionado(id: number): void {
    if (this.grupoIdsSeleccionados.has(id)) this.grupoIdsSeleccionados.delete(id);
    else this.grupoIdsSeleccionados.add(id);
  }

  guardarProducto(): void {
    if (!this.nombre.trim() || !this.categoriaId) return;
    const request = {
      categoriaId: this.categoriaId,
      codigo: this.codigo || null,
      nombre: this.nombre,
      descripcion: this.descripcion || null,
      tipo: this.tipo,
      costo: this.costo,
      precio: this.precio,
      unidad: this.unidad || null,
      controlaStock: this.controlaStock,
      disponibleOnline: this.disponibleOnline,
    };
    const editando = this.productoEditando();
    const obs = editando ? this.productoService.actualizar(editando.id, request) : this.productoService.crear(request);
    obs.subscribe((producto) => {
      const grupoIds = Array.from(this.grupoIdsSeleccionados);
      this.productoService.asignarGrupos(producto.id, grupoIds).subscribe(() => {
        this.mostrarForm.set(false);
        this.productoEditando.set(null);
        this.productoService.cargar();
      });
    });
  }

  toggleDisponible(producto: Producto): void {
    this.productoService.cambiarDisponibilidad(producto.id, !producto.disponible).subscribe(() => this.productoService.cargar());
  }

  archivarProducto(producto: Producto): void {
    this.productoService.archivar(producto.id).subscribe(() => this.productoService.cargar());
  }

  // --- Categorías ---
  guardarCategoria(): void {
    if (!this.categoriaNombre.trim()) return;
    this.productoService.crearCategoria(this.categoriaNombre, this.categoriaOrden).subscribe(() => {
      this.categoriaNombre = '';
      this.categoriaOrden = 0;
      this.mostrarForm.set(false);
      this.productoService.cargarCategorias();
    });
  }

  // --- Grupos de modificadores ---
  nuevoGrupo(): void {
    this.grupoEditando.set(null);
    this.grupoNombre = '';
    this.grupoObligatorio = false;
    this.grupoMultiple = false;
    this.grupoMin = null;
    this.grupoMax = null;
    this.mostrarForm.set(true);
  }

  editarGrupo(g: GrupoModificador): void {
    this.grupoEditando.set(g);
    this.grupoNombre = g.nombre;
    this.grupoObligatorio = g.obligatorio;
    this.grupoMultiple = g.multiple;
    this.grupoMin = g.min;
    this.grupoMax = g.max;
    this.mostrarForm.set(true);
  }

  guardarGrupo(): void {
    if (!this.grupoNombre.trim()) return;
    const request = {
      nombre: this.grupoNombre,
      obligatorio: this.grupoObligatorio,
      multiple: this.grupoMultiple,
      min: this.grupoMin,
      max: this.grupoMax,
    };
    const editando = this.grupoEditando();
    const obs = editando ? this.productoService.actualizarGrupo(editando.id, request) : this.productoService.crearGrupo(request);
    obs.subscribe(() => {
      this.mostrarForm.set(false);
      this.grupoEditando.set(null);
      this.productoService.cargarGrupos();
    });
  }

  archivarGrupo(g: GrupoModificador): void {
    this.productoService.archivarGrupo(g.id).subscribe(() => this.productoService.cargarGrupos());
  }

  toggleExpandirGrupo(id: number): void {
    this.grupoExpandido.set(this.grupoExpandido() === id ? null : id);
    this.modNombre = '';
    this.modPrecio = null;
  }

  agregarModificador(grupoId: number): void {
    if (!this.modNombre.trim()) return;
    this.productoService.agregarModificador(grupoId, this.modNombre, this.modPrecio).subscribe(() => {
      this.modNombre = '';
      this.modPrecio = null;
      this.productoService.cargarGrupos();
    });
  }

  eliminarModificador(grupoId: number, id: number): void {
    this.productoService.eliminarModificador(grupoId, id).subscribe(() => this.productoService.cargarGrupos());
  }

  // --- Listas de precio ---
  guardarLista(): void {
    if (!this.listaNombre.trim()) return;
    this.productoService.crearLista(this.listaNombre, this.listaDescripcion || null).subscribe(() => {
      this.listaNombre = '';
      this.listaDescripcion = '';
      this.mostrarForm.set(false);
      this.productoService.cargarListas();
    });
  }

  archivarLista(l: ListaPrecio): void {
    this.productoService.archivarLista(l.id).subscribe(() => this.productoService.cargarListas());
  }

  verItems(lista: ListaPrecio): void {
    this.listaSeleccionada.set(lista);
    this.itemProductoId = null;
    this.itemPrecio = null;
    this.productoService.listarItemsLista(lista.id).subscribe((items) => this.itemsLista.set(items));
  }

  guardarItemLista(): void {
    const lista = this.listaSeleccionada();
    if (!lista || !this.itemProductoId || this.itemPrecio == null) return;
    this.productoService.upsertItemLista(lista.id, this.itemProductoId, this.itemPrecio).subscribe(() => {
      this.itemProductoId = null;
      this.itemPrecio = null;
      this.verItems(lista);
    });
  }

  eliminarItemLista(itemId: number): void {
    const lista = this.listaSeleccionada();
    if (!lista) return;
    this.productoService.eliminarItemLista(lista.id, itemId).subscribe(() => this.verItems(lista));
  }

  // --- Movimientos de stock ---
  registrarMovimiento(): void {
    if (!this.movProductoId || this.movCantidad == null) return;
    this.productoService.registrarMovimiento(this.movProductoId, this.movTipo, this.movCantidad, this.movMotivo || null).subscribe(() => {
      this.movProductoId = null;
      this.movCantidad = null;
      this.movMotivo = '';
      this.productoService.cargarMovimientos();
      this.productoService.cargarInventario();
      this.productoService.cargar();
    });
  }

  productosConControlDeStock(): Producto[] {
    return this.productoService.items().filter((p) => p.controlaStock);
  }
}
