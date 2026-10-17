// Integration tests: data in, DOM out (through the public API).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Landscape7, { render, version, MAX_DEPTH } from '../src/index.js';
import { createDom } from './helpers/dom.js';

let dom, doc, container, q, qa;
beforeEach(() => ({ dom, doc, container, q, qa } = createDom()));

test('exports', () => {
  assert.equal(typeof render, 'function');
  assert.equal(Landscape7.render, render);
  assert.equal(MAX_DEPTH, 3);
  assert.equal(typeof version, 'string');
});

test('renders nested layers with rows grouped and ordered', () => {
  render(container, {
    nodes: [{
      id: 's', title: 'Section', row: 1,
      children: [{
        id: 'g', title: 'Group', row: 1,
        children: [
          { id: 'b', title: 'B', row: 2 },
          { id: 'a2', title: 'A2', row: 1, col: 2 },
          { id: 'a1', title: 'A1', row: 1, col: 1 }
        ]
      }]
    }]
  });
  assert.equal(q('[data-id="s"]').dataset.layer, '1');
  assert.equal(q('[data-id="g"]').dataset.layer, '2');
  assert.ok(q('[data-id="b"]').classList.contains('lsc-leaf'));
  assert.ok(q('[data-id="g"]').classList.contains('lsc-container'));
  const rows = qa('[data-id="g"] > .lsc-body > .lsc-row');
  assert.deepEqual(rows.map((r) => r.dataset.row), ['1', '2']);
  assert.deepEqual([...rows[0].children].map((c) => c.dataset.id), ['a1', 'a2']);
  assert.ok(doc.getElementById('lsc-base-styles'), 'base CSS injected into the container document');
});

test('style cascade: layer -> presets (left to right) -> node.style -> node.height', () => {
  render(container, {
    layers: { 1: { fontColor: 'rgb(1, 1, 1)', fontSize: 10, borderStyle: 'dashed', borderColor: 'red', height: 30 } },
    styles: { a: { fontSize: 20, background: 'blue' }, b: { fontSize: 30 } },
    nodes: [
      { id: 'n', title: 'N', preset: ['a', 'b'], style: { background: 'green' }, height: 50 },
      { id: 'm', title: 'M', row: 1 }
    ]
  });
  const n = q('[data-id="n"]').style;
  assert.equal(n.color, 'rgb(1, 1, 1)');
  assert.equal(n.fontSize, '30px');
  assert.equal(n.background, 'green');
  assert.equal(n.minHeight, '50px');
  assert.equal(n.borderStyle, 'dashed');
  assert.equal(q('[data-id="m"]').style.minHeight, '30px');
});

test('layers can be given as an array and rowHeights apply per row', () => {
  render(container, {
    layers: [{ rowHeights: { 2: 80 } }],
    nodes: [{ id: 'x', row: 1, title: 'x' }, { id: 'y', row: 2, title: 'y' }]
  });
  assert.equal(q('[data-id="x"]').style.minHeight, '');
  assert.equal(q('[data-id="y"]').style.minHeight, '80px');
});

test('children below layer 3 are ignored with a warning', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  render(container, {
    nodes: [{ title: 'L1', children: [{ title: 'L2', children: [{ id: 'l3', title: 'L3', children: [{ id: 'l4', title: 'L4' }] }] }] }]
  });
  assert.ok(q('[data-id="l3"]').classList.contains('lsc-leaf'));
  assert.equal(q('[data-id="l4"]'), null);
  assert.equal(warn.mock.callCount(), 1);
});

function twoGroups(rowSync) {
  return {
    rowSync,
    nodes: [
      { id: 's1', row: 1, children: [
        { id: 'g1', row: 1, children: [{ id: 'a', row: 1, className: 'h-40' }, { id: 'b', row: 1, className: 'h-40' }] },
        { id: 'g2', row: 1, children: [{ id: 'c', row: 1, className: 'h-90' }] }
      ] },
      { id: 's2', row: 2, children: [{ id: 'g3', row: 1, children: [{ id: 'd', row: 1, className: 'h-20' }] }] }
    ]
  };
}
const h = (id) => q(`[data-id="${id}"]`).style.height;

test('rowSync "section" equalises same layer + row inside a layer-1 node', () => {
  render(container, twoGroups('section'));
  assert.deepEqual([h('a'), h('b'), h('c')], ['90px', '90px', '90px']);
  assert.equal(h('d'), '', 'other section is not affected');
});

test('rowSync "parent" only equalises siblings', () => {
  render(container, twoGroups('parent'));
  assert.deepEqual([h('a'), h('b'), h('c')], ['40px', '40px', '']);
});

test('rowSync "global" equalises across the whole layer', () => {
  render(container, twoGroups('global'));
  assert.deepEqual([h('a'), h('c'), h('d')], ['90px', '90px', '90px']);
});

test('width / grow / spacer flex rules', () => {
  render(container, {
    canvas: { justify: 'start' },
    nodes: [
      { id: 'fixed', row: 1, width: 120 },
      { id: 'pct', row: 1, width: '30%' },
      { id: 'grow', row: 1, grow: 2 },
      { id: 'auto', row: 1 },
      { type: 'spacer', row: 1 }
    ]
  });
  assert.equal(q('[data-id="fixed"]').style.flex, '0 0 120px');
  assert.equal(q('[data-id="pct"]').style.flex, '0 1 30%');
  assert.equal(q('[data-id="grow"]').style.flex, '2 1 auto');
  assert.equal(q('[data-id="auto"]').style.flex, '0 0 auto');
  assert.equal(q('.lsc-spacer').style.flex, '1 1 0px');
});

test('unsafe URLs are blocked; _blank links get rel=noopener', (t) => {
  t.mock.method(console, 'warn', () => {});
  render(container, {
    nodes: [
      { id: 'bad', title: 'x', url: 'javascript:alert(1)' },
      { id: 'good', title: 'y', url: 'https://example.com', target: '_blank' },
      { id: 'rel', title: 'z', url: '/docs' }
    ]
  });
  assert.equal(q('[data-id="bad"]').tagName, 'DIV');
  assert.equal(q('[data-id="good"]').getAttribute('href'), 'https://example.com');
  assert.equal(q('[data-id="good"]').rel, 'noopener noreferrer');
  assert.equal(q('[data-id="rel"]').getAttribute('href'), '/docs');
});

test('text is escaped and supports title/subtitle', () => {
  render(container, {
    nodes: [{ id: 'n', title: '<b>x</b>', subtitle: 'sub' }]
  });
  const el = q('[data-id="n"]');
  assert.equal(el.querySelector('.lsc-title').textContent, '<b>x</b>');
  assert.equal(el.querySelector('b'), null);
  assert.equal(el.querySelector('.lsc-subtitle').textContent, 'sub');
});

test('onNodeClick receives the clicked (deepest) node', () => {
  const clicks = [];
  render(container, { nodes: [{ id: 'p', children: [{ id: 'c', title: 'child' }] }] },
    { onNodeClick: (node) => clicks.push(node.id) });
  q('[data-id="c"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(clicks, ['c']);
});

test('update, getElement, destroy', () => {
  const ls = render(container, { nodes: [{ id: 'one', title: '1' }] });
  assert.ok(ls.getElement('one'));
  ls.update({ nodes: [{ id: 'two', title: '2' }] });
  assert.equal(ls.getElement('one'), null);
  assert.ok(q('[data-id="two"]'));
  ls.destroy();
  assert.equal(container.innerHTML, '');
  assert.doesNotThrow(() => ls.destroy());
  assert.throws(() => ls.update({}), /destroyed/);
});

test('fixed-width canvas scales to fit', () => {
  Object.defineProperty(dom.window.HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 500 });
  const ls = render(container, { canvas: { width: 1000, scaleToFit: true }, nodes: [{ title: 'x', className: 'h-40' }] });
  assert.equal(ls.scale, 0.5);
  assert.equal(q('.lsc-canvas').style.transform, 'scale(0.5)');
});

test('throws on missing container', () => {
  assert.throws(() => render(null, {}), /container not found/);
});

const cls = (id) => q(`[data-id="${id}"]`).classList;
const hvar = (id, name) => q(`[data-id="${id}"]`).style.getPropertyValue('--lsc-h-' + name);

test('hover: by default only leaf nodes get the hover effect', () => {
  render(container, { nodes: [{ id: 'sec', title: 'S', children: [{ id: 'grp', title: 'G', children: [{ id: 'leaf', title: 'L' }] }] }, { id: 'top-leaf', title: 'T', row: 1 }] });
  assert.ok(cls('leaf').contains('lsc-hover'));
  assert.ok(cls('top-leaf').contains('lsc-hover'), 'a layer-1 node without children is a leaf too');
  assert.equal(cls('sec').contains('lsc-hover'), false);
  assert.equal(cls('grp').contains('lsc-hover'), false);
  assert.equal(hvar('leaf', 'filter'), 'brightness(1.12)');
  assert.ok(hvar('leaf', 'shadow'));
});

test('hover: effect properties map to CSS variables and classes', () => {
  render(container, {
    hover: { leaf: { background: 'red', fontColor: 'white', subtitleFontColor: 'pink', borderColor: 'blue',
      brightness: 1, shadow: 'none', scale: 1.05, translateY: -2, cursor: 'zoom-in', transition: 200 } },
    nodes: [{ id: 'n', title: 'x' }]
  });
  assert.equal(hvar('n', 'bg'), 'red');
  assert.equal(hvar('n', 'color'), 'white');
  assert.equal(hvar('n', 'subcolor'), 'pink');
  assert.equal(hvar('n', 'border'), 'blue');
  assert.equal(hvar('n', 'filter'), '', 'brightness 1 = no filter');
  assert.equal(hvar('n', 'shadow'), '', 'shadow none = no shadow');
  assert.equal(hvar('n', 'transform'), 'translateY(-2px) scale(1.05)');
  assert.equal(hvar('n', 'cursor'), 'zoom-in');
  assert.equal(hvar('n', 'dur'), '200ms');
  for (const c of ['lsc-hover', 'lsc-h-bg', 'lsc-h-color', 'lsc-h-subcolor', 'lsc-h-border', 'lsc-h-cursor']) {
    assert.ok(cls('n').contains(c), c);
  }
});

test('hover: levels merge data -> layer -> presets -> node.style, per node kind', () => {
  render(container, {
    hover: { leaf: { background: 'red' } },
    layers: { 1: { hover: { container: { borderColor: 'green' } } }, 2: { hover: { leaf: { fontColor: 'blue' } } } },
    styles: { off: { hover: false }, on: { hover: { container: true } } },
    nodes: [
      { id: 's', title: 'S', children: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B', preset: 'off' },
        { id: 'c', title: 'C', preset: 'off', style: { hover: { leaf: { background: 'gold' } } } },
        { id: 'g', title: 'G', preset: 'on', children: [{ id: 'x', title: 'X', style: { hover: { leaf: { enabled: false } } } }] }
      ] }
    ]
  });
  // layer-1 container enabled by layers[1].hover.container
  assert.equal(hvar('s', 'border'), 'green');
  // layer-2 leaf: data.hover (bg red) + layers[2] (color blue) merged
  assert.equal(hvar('a', 'bg'), 'red');
  assert.equal(hvar('a', 'color'), 'blue');
  // preset disables; a later node.style re-enables with its own effect
  assert.equal(cls('b').contains('lsc-hover'), false);
  assert.ok(cls('c').contains('lsc-hover'));
  assert.equal(hvar('c', 'bg'), 'gold');
  // container enabled via preset `true` gets the default effect
  assert.ok(cls('g').contains('lsc-hover'));
  assert.equal(hvar('g', 'filter'), 'brightness(1.12)');
  // enabled:false inside an object disables
  assert.equal(cls('x').contains('lsc-hover'), false);
});

test('hover: data.hover = false disables everything; spacers never hover', () => {
  render(container, { hover: false, nodes: [{ id: 'n', title: 'x' }, { type: 'spacer' }] });
  assert.equal(cls('n').contains('lsc-hover'), false);
  assert.equal(q('.lsc-spacer').classList.contains('lsc-hover'), false);
});
