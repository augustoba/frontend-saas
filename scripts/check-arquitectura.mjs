// Regla de la reestructuración (ver back/docs/superpowers/specs/
// 2026-10-04-reestructuracion-tres-sistemas-design.md), equivalente al
// ArquitecturaTest del backend:
//   - src/app/{ecommerce,pos,restaurante} no se importan entre sí;
//   - src/app/core y src/app/shared no importan a ningún sistema.
// Corre solo antes de `npm run build` (prebuild) y con `npm run check:arquitectura`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');
const SISTEMAS = ['ecommerce', 'pos', 'restaurante'];
const COMPARTIDOS = ['core', 'shared'];

/** Primera carpeta bajo src/app de un archivo (ej: "ecommerce"), o null. */
function areaDe(file) {
  const rel = relative(APP, file);
  if (rel.startsWith('..')) return null;
  return rel.split(sep)[0];
}

function* archivosTs(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* archivosTs(full);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) yield full;
  }
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g;
const errores = [];

for (const file of archivosTs(APP)) {
  const origen = areaDe(file);
  const esSistema = SISTEMAS.includes(origen);
  if (!esSistema && !COMPARTIDOS.includes(origen)) continue;

  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(IMPORT)) {
    const destino = areaDe(resolve(dirname(file), m[1] ?? m[2]));
    if (!SISTEMAS.includes(destino) || destino === origen) continue;
    const motivo = esSistema
      ? `el sistema "${origen}" no puede importar "${destino}"`
      : `"${origen}" es compartido y no puede importar el sistema "${destino}"`;
    errores.push(`${relative(APP, file)}: ${motivo} (${m[1] ?? m[2]})`);
  }
}

if (errores.length) {
  console.error('✗ Imports que rompen la separación entre sistemas:\n  ' + errores.join('\n  '));
  process.exit(1);
}
console.log('✓ Arquitectura: los sistemas no se importan entre sí y core/shared no conocen a ninguno.');
