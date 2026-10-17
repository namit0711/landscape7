// Builds dist/ (ESM, CJS, browser IIFE + minified) and the CJS type declarations.
import { build } from 'esbuild';
import { readFile, writeFile, rm, mkdir, copyFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const common = {
  entryPoints: ['src/index.js'],
  bundle: true,
  target: 'es2020',
  legalComments: 'inline',
  define: { __VERSION__: JSON.stringify(pkg.version) },
  logLevel: 'warning'
};

await rm('dist', { recursive: true, force: true });
await mkdir('dist');

const outputs = [
  { format: 'esm', outfile: 'dist/landscape7.mjs' },
  { format: 'cjs', outfile: 'dist/landscape7.cjs' },
  // <script> build: exposes window.Landscape7 = { render, version, MAX_DEPTH, defaults }
  { format: 'iife', outfile: 'dist/landscape7.umd.js', globalName: 'Landscape7', footer: { js: 'Landscape7=Landscape7.default;' } },
  { format: 'iife', outfile: 'dist/landscape7.umd.min.js', globalName: 'Landscape7', footer: { js: 'Landscape7=Landscape7.default;' }, minify: true, sourcemap: true }
];

for (const o of outputs) {
  await build({ ...common, ...o });
  const code = await readFile(o.outfile, 'utf8');
  await writeFile(o.outfile, code.replaceAll('__VERSION__', pkg.version));
}

// Same declarations for require() consumers (TypeScript resolves .d.cts for .cjs).
await copyFile('types/index.d.ts', 'types/index.d.cts');
console.log(`built ${pkg.name}@${pkg.version}: ${outputs.map((o) => o.outfile).join(', ')}`);
