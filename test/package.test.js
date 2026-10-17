// Checks the schema and the built bundles (run `npm run build` first; `npm test` does it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import Ajv from 'ajv';

const require = createRequire(import.meta.url);
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const pkg = JSON.parse(read('../package.json'));

test('example data files are valid against the JSON schema', () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(JSON.parse(read('../schema/landscape7.schema.json')));
  for (const file of ['hls-landscape.json', 'health-ecosystem.json']) {
    const ok = validate(JSON.parse(read(`../examples/${file}`)));
    assert.ok(ok, `${file}: ${JSON.stringify(validate.errors, null, 2)}`);
  }
  assert.equal(validate({ nodes: [{ children: [{ children: [{ children: [] }] }] }] }), false, 'layer 4 rejected');
  assert.equal(validate({ nodes: [{ style: { borderStyle: 'wavy' } }] }), false, 'bad enum rejected');
});

test('CJS bundle exports the API with the package version', () => {
  const cjs = require('../dist/landscape7.cjs');
  assert.equal(typeof cjs.render, 'function');
  assert.equal(cjs.version, pkg.version);
  assert.equal(cjs.default.render, cjs.render);
});

test('ESM bundle exports the API', async () => {
  const esm = await import('../dist/landscape7.mjs');
  assert.equal(typeof esm.render, 'function');
  assert.equal(esm.default.version, pkg.version);
});

for (const file of ['landscape7.umd.js', 'landscape7.umd.min.js']) {
  test(`${file} defines window.Landscape7`, () => {
    const ctx = {};
    vm.runInNewContext(read(`../dist/${file}`), ctx);
    assert.equal(typeof ctx.Landscape7.render, 'function');
    assert.equal(ctx.Landscape7.version, pkg.version);
  });
}
