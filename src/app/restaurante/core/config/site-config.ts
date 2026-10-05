/**
 * URLs de la API del restaurante dentro del SaaS. Las pantallas portadas siguen
 * llamando con sus rutas originales (`/v1/...`); acá se traducen a las del
 * backend del SaaS: `/api/restaurante/**` y lo público (carta, autopedido,
 * alta de pedido online) a `/api/public/restaurante/**`.
 */
export function apiUrl(path: string): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (/^\/v1\/(carta\/|pedido\/)/.test(p) || p === '/v1/pedidos-online') {
    p = p.replace(/^\/v1\//, '/public/restaurante/');
  } else {
    p = p.replace(/^\/v1\//, '/restaurante/');
  }
  return `/api${p}`;
}
