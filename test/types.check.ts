// Compile-only check of the published type declarations (`npm run typecheck`).
import Landscape7, { render, type LandscapeData, type LandscapeInstance } from 'landscape7';
import data from '../examples/hls-landscape.json' with { type: 'json' };

const typed: LandscapeData = data as LandscapeData;

const config: LandscapeData = {
  canvas: { width: 1200, scaleToFit: true },
  rowSync: 'section',
  layers: { 1: { borderStyle: 'solid', verticalAlign: 'top' }, '3': { height: 44 } },
  styles: { blue: { background: '#0b4ea2', fontColor: '#fff' } },
  nodes: [{ title: 'A', row: 1, preset: ['blue'], children: [{ title: 'B', grow: 1 }, { type: 'spacer', width: 20 }] }]
};

const el = document.createElement('div');
const ls: LandscapeInstance = render(el, config, {
  onNodeClick: (node, event, element) => console.log(node.title, event.clientX, element.tagName)
});
ls.update(typed).relayout();
Landscape7.render('#map', typed).destroy();

// @ts-expect-error invalid border style
const bad: LandscapeData = { layers: { 1: { borderStyle: 'wavy' } } };
void bad;

const hover: LandscapeData = {
  hover: { leaf: { background: '#eef', scale: 1.02 }, container: true },
  layers: { 2: { hover: { container: { borderColor: 'red', shadow: 'none' } } } },
  nodes: [{ title: 'x', style: { hover: false } }]
};
void hover;
// @ts-expect-error unknown hover kind
const badHover: LandscapeData = { hover: { section: true } };
void badHover;
