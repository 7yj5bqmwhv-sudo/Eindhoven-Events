const assert = require('node:assert/strict');
const path = require('node:path');
const { buildSync } = require('esbuild');

const project = path.resolve(__dirname, '..');

function bundle(contents, apiUrl = '/api') {
  const output = buildSync({
    stdin: { contents, resolveDir: project, loader: 'jsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    packages: 'external', jsx: 'automatic',
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: apiUrl }) },
  });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', output.outputFiles[0].text)(require, loaded, loaded.exports);
  return loaded.exports;
}

function assertions() {
  let count = 0;
  return {
    equal(actual, expected, label) { assert.deepEqual(actual, expected, label); count += 1; },
    check(actual, label) { assert.ok(actual, label); count += 1; },
    throws(operation, expected, label) { assert.throws(operation, expected, label); count += 1; },
    async rejects(operation, expected, label) { await assert.rejects(operation, expected, label); count += 1; },
    get count() { return count; },
  };
}

function setupDOM() {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const domIssues = [];
  const consoleIssues = [];
  let cssLimitations = 0;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => {
    if (error.type === 'css parsing' && error.message === 'Could not parse CSS stylesheet'
      && typeof error.detail === 'string' && error.detail.includes('@layer')) cssLimitations += 1;
    else domIssues.push(error.message);
  });
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'http://localhost/', pretendToBeVisual: true, virtualConsole,
  });
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
    'HTMLSelectElement', 'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent',
    'KeyboardEvent', 'CustomEvent', 'MutationObserver', 'File', 'FileList', 'Blob',
    'AbortController', 'AbortSignal']) {
    Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
  }
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  global.localStorage = dom.window.localStorage;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = media => ({ media, matches: false, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } });
  global.matchMedia = window.matchMedia;
  class ResizeObserverShim { observe() {} unobserve() {} disconnect() {} }
  global.ResizeObserver = window.ResizeObserver = ResizeObserverShim;
  const scrolls = [];
  window.scrollTo = (...args) => scrolls.push(args);
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => consoleIssues.push(args.map(String).join(' '));
  console.warn = (...args) => consoleIssues.push(args.map(String).join(' '));
  return {
    dom, domIssues, consoleIssues, scrolls,
    get cssLimitations() { return cssLimitations; },
    close() {
      console.error = originalError;
      console.warn = originalWarn;
      dom.window.close();
    },
  };
}

module.exports = { bundle, assertions, setupDOM, project };
