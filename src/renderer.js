// Instance lifecycle: mount, re-render, re-measure on resize / font load, destroy.
import { injectBaseCss } from './css.js';
import { TreeBuilder } from './builder.js';
import { syncRowHeights, scaleFor } from './layout.js';
import { isNum } from './utils.js';

function resolveContainer(container) {
  if (typeof container === 'string') {
    if (typeof document === 'undefined') {
      throw new Error('Landscape7: a selector needs a browser document; pass an element instead');
    }
    container = document.querySelector(container);
  }
  if (!container || !container.ownerDocument) throw new Error('Landscape7: container not found');
  return container;
}

export class Renderer {
  constructor(container, data, options = {}) {
    this.container = resolveContainer(container);
    this.doc = this.container.ownerDocument;
    this.win = this.doc.defaultView;
    this.options = options;
    this.scale = 1;
    this._items = [];
    this._byId = {};
    this._raf = 0;
    this._destroyed = false;
    this._onResize = this._onResize.bind(this);

    injectBaseCss(this.doc);
    this.update(data);
    this._observe();
  }

  /** Re-render with new data. */
  update(data) {
    if (this._destroyed) throw new Error('Landscape7: instance has been destroyed');
    this.data = data || {};
    const { canvas, items, byId } = new TreeBuilder(this.doc, this.data, this.options).build();

    const viewport = this.doc.createElement('div');
    viewport.className = 'lsc-viewport';
    viewport.appendChild(canvas);
    this.container.replaceChildren(viewport);

    Object.assign(this, { viewport, canvas, _items: items, _byId: byId });
    return this.relayout();
  }

  /** Recalculate synchronised row heights and the fit-to-width scale. */
  relayout() {
    if (this._destroyed) return this;
    syncRowHeights(this._items, this.data.rowSync);
    this._rescale();
    return this;
  }

  getElement(id) {
    return this._byId[id] || null;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this._ro) this._ro.disconnect();
    else if (this.win) this.win.removeEventListener('resize', this._onResize);
    if (this._raf) this.win.cancelAnimationFrame(this._raf);
    this.container.replaceChildren();
    this._items = [];
    this._byId = {};
  }

  // ------------------------------------------------------------- internals

  _observe() {
    const { win, doc } = this;
    if (win && win.ResizeObserver) {
      this._ro = new win.ResizeObserver(this._onResize);
      this._ro.observe(this.container);
    } else if (win) {
      win.addEventListener('resize', this._onResize);
    }
    // Web fonts change text metrics; re-measure once they are ready.
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => this.relayout());
  }

  _rescale() {
    const canvasCfg = this.data.canvas || {};
    const scale = scaleFor(canvasCfg, this.viewport.clientWidth);
    const fixedWidth = isNum(canvasCfg.width);
    this.scale = scale;
    this.canvas.style.transform = scale === 1 ? '' : `scale(${scale})`;
    // A CSS transform doesn't change layout size, so size the viewport to the scaled canvas.
    this.viewport.style.height = scale === 1 ? '' : `${Math.ceil(this.canvas.offsetHeight * scale)}px`;
    this.viewport.style.overflowX = scale === 1 && fixedWidth ? 'auto' : 'hidden';
  }

  _onResize() {
    if (this._destroyed || !this.win) return;
    if (this._raf) this.win.cancelAnimationFrame(this._raf);
    this._raf = this.win.requestAnimationFrame(() => {
      this._raf = 0;
      // A fixed-width canvas keeps its layout; only the scale changes.
      if (isNum((this.data.canvas || {}).width)) this._rescale();
      else this.relayout();
    });
  }
}
