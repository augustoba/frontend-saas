import { computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/site-config';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface PagedRaw<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Contenedor genérico para un listado paginado del backend (`PageResponse<T>`),
 * con estado de carga/error y de "guardando". Cada service compone uno y
 * expone `items` / `status` / `saving` / `reload`, sin repetir la lógica.
 */
export class CollectionStore<T> {
  private readonly itemsSignal = signal<T[]>([]);
  private readonly statusSignal = signal<LoadStatus>('idle');
  private readonly savingSignal = signal(false);
  private readonly pageSignal = signal(0);
  private readonly totalPagesSignal = signal(1);
  private readonly totalElementsSignal = signal(0);

  readonly items = this.itemsSignal.asReadonly();
  readonly status = this.statusSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly loading = computed(() => this.statusSignal() === 'loading');
  readonly errored = computed(() => this.statusSignal() === 'error');
  readonly ready = computed(() => this.statusSignal() === 'loaded');

  readonly page = this.pageSignal.asReadonly();
  readonly totalPages = this.totalPagesSignal.asReadonly();
  readonly totalElements = this.totalElementsSignal.asReadonly();

  private queryParams: Record<string, string | number> = {};

  constructor(
    private readonly http: HttpClient,
    private readonly path: string,
    private readonly pageSize = 20
  ) {}

  ensureLoaded(): void {
    if (this.statusSignal() === 'idle' || this.statusSignal() === 'error') {
      this.loadPage(this.pageSignal());
    }
  }

  loadPage(n: number): void {
    const target = Math.max(0, n);
    this.pageSignal.set(target);
    this.statusSignal.set('loading');
    this.http
      .get<PagedRaw<T>>(apiUrl(this.path), { params: { page: target, size: this.pageSize, ...this.queryParams } })
      .subscribe({
        next: (raw) => {
          this.itemsSignal.set(raw.content ?? []);
          this.totalPagesSignal.set(raw.totalPages ?? 1);
          this.totalElementsSignal.set(raw.totalElements ?? 0);
          this.pageSignal.set(raw.page ?? target);
          this.statusSignal.set('loaded');
        },
        error: () => this.statusSignal.set('error'),
      });
  }

  reload = (): void => this.loadPage(this.pageSignal());

  setQuery(params: Record<string, string | number | null | undefined>): void {
    this.queryParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== '') this.queryParams[k] = v;
    }
    this.loadPage(0);
  }

  mutate(obs: Observable<unknown>, onSuccess?: () => void): void {
    this.savingSignal.set(true);
    obs.subscribe({
      next: () => {
        this.savingSignal.set(false);
        this.reload();
        onSuccess?.();
      },
      error: () => this.savingSignal.set(false),
    });
  }
}
