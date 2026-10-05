import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from './settings.service';
import { apiUrl } from '../config/site-config';

export interface ImagenSubida {
  /** URL pública de la imagen. Es lo que se guarda en la base. */
  secureUrl: string;
}

export interface ImagenSubidaOptions {
  /** Carpeta relativa a la tienda (ej: `productos`); el backend le antepone el slug. */
  folder?: string;
  /** Nombre del archivo sin extensión (ej: `remera-bebe-1`). */
  publicId?: string;
  /** Sólo superadmin: subir a otra tienda (el logo de una tienda que se está creando). */
  slugTienda?: string;
}

/** Instrucciones de subida que arma el backend según el proveedor de la tienda (ver `ProveedorImagenes`). */
interface TicketSubida {
  proveedor: string;
  metodo: 'POST_FORM' | 'PUT';
  url: string;
  campos: Record<string, string>;
  campoArchivo: string | null;
  campoUrlFinal: string | null;
  urlFinal: string | null;
}

/**
 * Sube imágenes al proveedor de la tienda (hoy Cloudinary; mañana R2) directo
 * desde el navegador: primero pide al backend un ticket (`/api/core/imagenes/subidas`)
 * y después sube como ese ticket indique. Ninguna pantalla sabe qué proveedor es.
 */
@Injectable({ providedIn: 'root' })
export class ImagenService {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);

  /** true si la tienda tiene la subida de imágenes configurada. */
  get configured(): boolean {
    return this.settingsService.cloudinaryConfigured();
  }

  /** `file` puede ser un File del `<input>` o un data URI (ej: el de `resizeImageFile`). */
  async upload(file: File | string, options: ImagenSubidaOptions = {}): Promise<ImagenSubida> {
    let ticket: TicketSubida;
    try {
      ticket = await firstValueFrom(
        this.http.post<TicketSubida>(apiUrl('/core/imagenes/subidas'), {
          carpeta: options.folder ?? null,
          nombre: options.publicId ?? null,
          slugTienda: options.slugTienda ?? null,
        })
      );
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      throw new Error(msg ?? 'No se pudo preparar la subida de la imagen.');
    }

    const blob = typeof file === 'string' ? await (await fetch(file)).blob() : file;
    let res: Response;
    try {
      if (ticket.metodo === 'PUT') {
        res = await fetch(ticket.url, { method: 'PUT', body: blob });
      } else {
        const form = new FormData();
        for (const [k, v] of Object.entries(ticket.campos)) form.append(k, v);
        form.append(ticket.campoArchivo ?? 'file', blob);
        res = await fetch(ticket.url, { method: 'POST', body: form });
      }
    } catch {
      throw new Error('No se pudo conectar con el servicio de imágenes. Revisá la conexión.');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message ?? `El servicio de imágenes respondió ${res.status}.`);
    }
    if (ticket.urlFinal) return { secureUrl: ticket.urlFinal };
    const data = await res.json();
    return { secureUrl: data[ticket.campoUrlFinal ?? 'secure_url'] as string };
  }
}
