// Fresh jsdom page per test. jsdom has no layout engine, so offsetHeight is faked:
// explicit style.height wins, then an "h-<px>" class (natural height), then min-height.
import { JSDOM } from 'jsdom';

export function createDom() {
  const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', { pretendToBeVisual: true });
  const doc = dom.window.document;
  const container = doc.getElementById('root');
  Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() {
      const natural = /\bh-(\d+)\b/.exec(this.className);
      return parseFloat(this.style.height) || (natural ? +natural[1] : parseFloat(this.style.minHeight) || 0);
    }
  });
  return {
    dom,
    doc,
    container,
    q: (sel) => container.querySelector(sel),
    qa: (sel) => [...container.querySelectorAll(sel)]
  };
}
