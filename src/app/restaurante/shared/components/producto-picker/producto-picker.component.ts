import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-producto-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './producto-picker.component.html',
})
export class ProductoPickerComponent implements OnInit {
  protected readonly productoService = inject(ProductoService);
  @Output() elegido = new EventEmitter<Producto>();
  @Output() cerrado = new EventEmitter<void>();

  protected readonly busqueda = signal('');
  protected readonly categoriaActiva = signal<number | null>(null);

  protected readonly productosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const catId = this.categoriaActiva();
    return this.productoService.items().filter((p) => {
      if (!p.disponible || !p.activo) return false;
      if (q) return p.nombre.toLowerCase().includes(q);
      return catId === null || p.categoriaId === catId;
    });
  });

  ngOnInit(): void {
    this.productoService.cargar();
  }

  elegirCategoria(id: number | null): void {
    this.categoriaActiva.set(id);
  }

  elegir(p: Producto): void {
    this.elegido.emit(p);
  }
}
