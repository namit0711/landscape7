// Base stylesheet, injected once per document. Per-node values are set inline;
// hover rules read the --lsc-h-* variables written by hover.js.

const STYLE_ID = 'lsc-base-styles';

const CSS = [
  // structure
  '.lsc-viewport{position:relative;overflow:hidden;width:100%}',
  '.lsc-canvas{box-sizing:border-box;transform-origin:0 0;display:flex;flex-direction:column}',
  '.lsc-canvas *,.lsc-canvas *::before,.lsc-canvas *::after{box-sizing:border-box}',
  '.lsc-row{display:flex;align-items:stretch;min-width:0}',
  '.lsc-body{display:flex;flex-direction:column;min-width:0}',
  '.lsc-node{position:relative;display:flex;flex-direction:column;min-width:0;text-decoration:none}',
  '.lsc-spacer{flex:0 0 auto}',
  // text
  '.lsc-leaf .lsc-text{width:100%;white-space:pre-line;overflow-wrap:break-word}',
  '.lsc-header{white-space:pre-line}',
  '.lsc-title,.lsc-subtitle{display:block}',
  '.lsc-inline .lsc-title,.lsc-inline .lsc-subtitle{display:inline-block;vertical-align:baseline}',
  '.lsc-inline .lsc-title{margin-right:.5em}',
  '.lsc-clickable{cursor:pointer}',
  // hover
  '.lsc-hover{transition-property:background-color,color,border-color,box-shadow,transform,filter;' +
    'transition-duration:var(--lsc-h-dur,120ms);transition-timing-function:ease-out}',
  '.lsc-hover:hover{z-index:1;filter:var(--lsc-h-filter,none);box-shadow:var(--lsc-h-shadow,none);transform:var(--lsc-h-transform,none)}',
  '.lsc-h-bg:hover{background:var(--lsc-h-bg)!important}',
  '.lsc-h-color:hover,.lsc-h-color:hover>.lsc-text .lsc-title,.lsc-h-color:hover>.lsc-header .lsc-title{color:var(--lsc-h-color)!important}',
  '.lsc-h-border:hover{border-color:var(--lsc-h-border)!important}',
  '.lsc-h-subcolor:hover>.lsc-text .lsc-subtitle,.lsc-h-subcolor:hover>.lsc-header .lsc-subtitle{color:var(--lsc-h-subcolor)!important}',
  '.lsc-h-cursor:hover{cursor:var(--lsc-h-cursor)}'
].join('\n');

/** Add the base stylesheet to `doc` unless it is already there. */
export function injectBaseCss(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const tag = doc.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(tag);
}
