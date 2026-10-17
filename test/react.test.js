// React binding: <Landscape7> drives the vanilla renderer through mount, update and unmount.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

// React DOM reads window/document globals, so install one jsdom page before loading it.
const { dom, doc } = createDom();
Object.assign(globalThis, { window: dom.window, document: doc, IS_REACT_ACT_ENVIRONMENT: true });
const { createElement: h, createRef, act, StrictMode } = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { Landscape7 } = await import('../src/react.js');

const DATA = { nodes: [{ id: 's', title: 'Section', children: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] }] };

let container, root;
const q = (sel) => container.querySelector(sel);
const mount = (props) => act(() => root.render(h(Landscape7, props)));

beforeEach(() => {
  container = doc.createElement('div');
  doc.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('renders the data into its div and exposes the instance through the ref', () => {
  const ref = createRef();
  mount({ data: DATA, ref, className: 'map', style: { maxWidth: 800 } });
  const div = container.firstElementChild;
  assert.equal(div.className, 'map');
  assert.equal(div.style.maxWidth, '800px');
  assert.ok(div.querySelector('.lsc-viewport'));
  assert.equal(ref.current.container, div);
  assert.equal(ref.current.getElement('a'), q('[data-id="a"]'));
});

test('new data updates the same instance; re-rendering with the same data does nothing', () => {
  const ref = createRef();
  mount({ data: DATA, ref });
  const inst = ref.current;
  let updates = 0;
  const orig = inst.update.bind(inst);
  inst.update = (d) => (updates++, orig(d));

  mount({ data: DATA, ref, className: 'x' });
  assert.equal(updates, 0);

  mount({ data: { nodes: [{ id: 'z', title: 'Z' }] }, ref, className: 'x' });
  assert.equal(updates, 1);
  assert.equal(ref.current, inst);
  assert.ok(q('[data-id="z"]'));
  assert.equal(q('[data-id="a"]'), null);
});

test('onNodeClick: latest callback is used; adding or removing it toggles clickability', () => {
  const calls = [];
  mount({ data: DATA });
  assert.equal(q('[data-id="a"]').classList.contains('lsc-clickable'), false);

  mount({ data: DATA, onNodeClick: (node) => calls.push(`first:${node.id}`) });
  const a = q('[data-id="a"]');
  assert.ok(a.classList.contains('lsc-clickable'));
  a.click();

  mount({ data: DATA, onNodeClick: (node, event, el) => calls.push(`second:${node.id}:${el === a}`) });
  q('[data-id="a"]').click();
  assert.deepEqual(calls, ['first:a', 'second:a:true'], 'callback swap keeps the same DOM');

  mount({ data: DATA });
  assert.equal(q('[data-id="a"]').classList.contains('lsc-clickable'), false);
});

test('unmount destroys the instance and clears the ref', () => {
  const ref = createRef();
  mount({ data: DATA, ref });
  const inst = ref.current;
  act(() => root.render(null));
  assert.equal(ref.current, null);
  assert.throws(() => inst.update(DATA), /destroyed/);
  assert.equal(container.innerHTML, '');
});

test('children are ignored and server rendering emits an empty div', () => {
  mount({ data: DATA, children: h('span', { className: 'stray' }) });
  assert.equal(q('.stray'), null);
  assert.equal(renderToString(h(Landscape7, { data: DATA, id: 'map' })), '<div id="map"></div>');
});

test('StrictMode double-mount leaves one live instance', () => {
  const ref = createRef();
  act(() => root.render(h(StrictMode, null, h(Landscape7, { data: DATA, ref }))));
  assert.equal(container.querySelectorAll('.lsc-viewport').length, 1);
  assert.equal(ref.current.getElement('b'), q('[data-id="b"]'));
  ref.current.relayout();
});
