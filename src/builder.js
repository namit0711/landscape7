// Turns landscape data into DOM. Knows nothing about lifecycle, resizing or measuring.
import { MAX_DEPTH, CANVAS_DEFAULTS } from './defaults.js';
import { StyleResolver } from './style.js';
import { resolveHover, applyHover } from './hover.js';
import { JUSTIFY, V_ALIGN, groupRows, flexOf, spacerFlexOf } from './layout.js';
import { assignDefined, isNum, numOr, px, rowOf, safeUrl, warn } from './utils.js';

/**
 * Builds one render of `data`. Result:
 *   canvas - root element (not yet attached)
 *   items  - one entry per rendered node, used for row-height sync
 *   byId   - node id -> element
 */
export class TreeBuilder {
  constructor(doc, data, options = {}) {
    this.doc = doc;
    this.data = data;
    this.onNodeClick = options.onNodeClick;
    this.styles = new StyleResolver(data);
    this.items = [];
    this.byId = {};
    this.uid = 0;
  }

  build() {
    const cfg = assignDefined({}, CANVAS_DEFAULTS, this.data.canvas);
    const gap = numOr(cfg.gap, CANVAS_DEFAULTS.gap);
    const canvas = this._el('div', 'lsc-canvas');
    Object.assign(canvas.style, {
      width: cfg.width ? px(cfg.width) : '100%',
      padding: px(cfg.padding),
      background: cfg.background,
      fontFamily: cfg.fontFamily,
      rowGap: px(numOr(cfg.rowGap, gap))
    });

    const root = { path: 'root', section: null, layer: 0 };
    this._appendRows(canvas, this.data.nodes || [], root, {
      justify: cfg.justify,
      columnGap: numOr(cfg.columnGap, gap),
      wrap: !!cfg.wrap
    });
    return { canvas, items: this.items, byId: this.byId };
  }

  // ------------------------------------------------------------- rows

  /** ctx: { path, section, layer } of the parent. opts: row layout settings of the parent. */
  _appendRows(parentEl, nodes, ctx, opts) {
    for (const { row, nodes: rowNodes } of groupRows(nodes)) {
      const justify = (opts.rowJustify && opts.rowJustify[row]) || opts.justify;
      const rowEl = this._el('div', 'lsc-row');
      rowEl.setAttribute('data-row', row);
      Object.assign(rowEl.style, {
        justifyContent: JUSTIFY[justify] || 'flex-start',
        columnGap: px(opts.columnGap),
        rowGap: px(opts.rowGap !== undefined ? opts.rowGap : opts.columnGap)
      });
      if (opts.wrap) rowEl.style.flexWrap = 'wrap';
      for (const node of rowNodes) rowEl.appendChild(this._buildNode(node, ctx, justify));
      parentEl.appendChild(rowEl);
    }
  }

  // ------------------------------------------------------------- nodes

  _buildNode(node, ctx, parentJustify) {
    if (node.type === 'spacer') return this._buildSpacer(node);

    const layer = ctx.layer + 1;
    const id = node.id || `lsc-${++this.uid}`;
    const style = this.styles.resolve(node, layer);
    const children = this._childrenOf(node, layer, id);
    const isContainer = children.length > 0;
    const href = this._hrefOf(node);

    const el = this._el(href ? 'a' : 'div', [
      'lsc-node',
      `lsc-layer-${layer}`,
      isContainer ? 'lsc-container' : 'lsc-leaf',
      style.textFlow === 'inline' && 'lsc-inline',
      (href || this.onNodeClick) && 'lsc-clickable',
      node.className
    ]);
    el.setAttribute('data-id', id);
    el.setAttribute('data-layer', layer);
    el.setAttribute('data-row', rowOf(node));
    if (href) this._applyLink(el, href, node.target);
    if (node.tooltip) el.title = node.tooltip;

    applyBoxStyle(el, style);
    el.style.flex = flexOf(node, parentJustify);
    applyHover(el, resolveHover(style.hover, isContainer ? 'container' : 'leaf'));

    if (isContainer) {
      this._fillContainer(el, node, style, children, { ...ctx, layer, id });
    } else {
      el.style.justifyContent = V_ALIGN[style.verticalAlign] || 'center';
      const text = this._buildText(node, style, 'lsc-text');
      if (text) el.appendChild(text);
    }

    if (this.onNodeClick) {
      el.addEventListener('click', (event) => {
        event.stopPropagation(); // report only the innermost node
        this.onNodeClick(node, event, el);
      });
    }

    this.items.push({
      el,
      layer,
      row: rowOf(node),
      node,
      parentKey: ctx.path,
      sectionKey: layer === 1 ? 'root' : ctx.section,
      sync: style.rowSync
    });
    this.byId[id] = el;
    return el;
  }

  /** Container = header (title/subtitle) + body (rows of children); title above or below. */
  _fillContainer(el, node, style, children, { path, section, layer, id }) {
    const gap = numOr(style.rowGap, style.gap);
    const body = this._el('div', 'lsc-body');
    body.style.rowGap = px(gap);
    this._appendRows(body, children, {
      path: `${path}/${id}`,
      section: layer === 1 ? id : section,
      layer
    }, {
      justify: style.justify,
      rowJustify: style.rowJustify,
      wrap: style.wrap,
      columnGap: numOr(style.columnGap, style.gap),
      rowGap: gap
    });

    el.style.justifyContent = 'flex-start';
    const header = this._buildText(node, style, 'lsc-header');
    if (!header) {
      el.appendChild(body);
    } else if (style.verticalAlign === 'bottom') {
      header.style.marginTop = px(style.headerGap);
      el.append(body, header);
    } else {
      header.style.marginBottom = px(style.headerGap);
      el.append(header, body);
    }
  }

  _buildSpacer(node) {
    const el = this._el('div', 'lsc-spacer');
    el.style.flex = spacerFlexOf(node);
    return el;
  }

  _buildText(node, style, className) {
    if (!node.title && !node.subtitle) return null;
    const wrap = this._el('div', className);
    wrap.style.textAlign = style.textAlign;

    if (node.title) {
      const title = this._el('span', 'lsc-title', node.title);
      if (style.titleMinWidth && style.textFlow === 'inline') title.style.minWidth = px(style.titleMinWidth);
      wrap.appendChild(title);
    }
    if (node.subtitle) {
      const subtitle = this._el('span', 'lsc-subtitle', node.subtitle);
      const ss = subtitle.style;
      if (style.subtitleFontSize) ss.fontSize = px(style.subtitleFontSize);
      if (style.subtitleFontColor) ss.color = style.subtitleFontColor;
      if (style.subtitleFontWeight) ss.fontWeight = style.subtitleFontWeight;
      if (style.subtitleFontStyle) ss.fontStyle = style.subtitleFontStyle;
      wrap.appendChild(subtitle);
    }
    return wrap;
  }

  // ------------------------------------------------------------- helpers

  _childrenOf(node, layer, id) {
    const children = node.children || [];
    if (children.length && layer >= MAX_DEPTH) {
      warn(`node "${node.title || id}" is at layer ${layer}; children beyond ${MAX_DEPTH} layers are ignored.`);
      return [];
    }
    return children;
  }

  _hrefOf(node) {
    if (!node.url) return null;
    const href = safeUrl(node.url);
    if (!href) warn(`blocked unsafe url "${node.url}"`);
    return href;
  }

  _applyLink(el, href, target) {
    el.href = href;
    if (!target) return;
    el.target = target;
    if (target === '_blank') el.rel = 'noopener noreferrer';
  }

  /** Create an element; `classes` may be a string or an array with falsy entries. */
  _el(tag, classes, text) {
    const el = this.doc.createElement(tag);
    el.className = [].concat(classes).filter(Boolean).join(' ');
    if (text !== undefined) el.textContent = text;
    return el;
  }
}

/** Inline box + font styles shared by containers and leaves. */
function applyBoxStyle(el, s) {
  const st = el.style;
  st.border = s.borderStyle === 'none' ? 'none' : `${px(s.borderWidth)} ${s.borderStyle} ${s.borderColor}`;
  st.borderRadius = px(s.borderRadius);
  st.background = s.background;
  st.color = s.fontColor;
  st.fontSize = px(s.fontSize);
  st.fontWeight = s.fontWeight;
  st.fontStyle = s.fontStyle;
  st.lineHeight = s.lineHeight;
  if (s.fontFamily) st.fontFamily = s.fontFamily;
  st.padding = px(s.padding);
  st.textAlign = s.textAlign;
  if (isNum(s.height)) st.minHeight = `${s.height}px`;
}
