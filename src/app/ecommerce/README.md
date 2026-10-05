# ecommerce/

Tienda online + venta en el local. `admin/` (panel) y `tienda/` (sitio público:
catálogo con los 35 diseños, carrito, checkout). Puede usar `core/` y `shared/`,
nunca `pos/` ni `restaurante/` (lo verifica `scripts/check-arquitectura.mjs`).
Hoy el código del ecommerce todavía vive en `features/`; se mueve acá en la Etapa 2.
