const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter } = require('react-router-dom');
const test = assertions();

// Appearance is an explicit choice, independent of the operating system.
let systemDark = true;
const mediaQueries = new Map();
window.matchMedia = media => {
  if (!mediaQueries.has(media)) {
    const listeners = new Set();
    mediaQueries.set(media, {
      media,
      get matches() { return media === '(prefers-color-scheme: dark)' && systemDark; },
      addListener(listener) { listeners.add(listener); },
      removeListener(listener) { listeners.delete(listener); },
      addEventListener(type, listener) { if (type === 'change') listeners.add(listener); },
      removeEventListener(type, listener) { if (type === 'change') listeners.delete(listener); },
      dispatchEvent(event) { for (const listener of listeners) listener(event); return true; },
    });
  }
  return mediaQueries.get(media);
};
global.matchMedia = window.matchMedia;

const { system, Provider, Navigation } = bundle(`
  export { system } from './src/theme.js';
  export { Provider } from './src/components/ui/provider.jsx';
  export { Navigation } from './src/components/Navigation.jsx';
`);
const tick = () => React.act(async () => {
  await new Promise(resolve => setTimeout(resolve, 35));
});
const themeButton = () => document.querySelector('button[aria-label^="Theme:"]');
const state = () => ({
  label: themeButton()?.getAttribute('aria-label'),
  light: document.documentElement.classList.contains('light'),
  dark: document.documentElement.classList.contains('dark'),
  saved: localStorage.getItem('eindhoven-theme'),
});
const switchTheme = async () => {
  if (!themeButton()) throw new Error('The real Navigation theme control must be available');
  await React.act(async () => themeButton().click());
  await tick();
};
const changeSystem = async dark => {
  await React.act(async () => {
    systemDark = dark;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.dispatchEvent({ matches: query.matches, media: query.media });
  });
  await tick();
};
const palette = selector => {
  const values = system.getTokenCss()['@layer tokens'][selector] ?? {};
  return Object.fromEntries(['bg', 'fg', 'fg-muted', 'border', 'teal-solid', 'teal-fg', 'teal-subtle']
    .map(name => [name, values[`--chakra-colors-${name}`]]));
};
let root;
const mount = async () => {
  root = createRoot(document.getElementById('root'));
  await React.act(async () => root.render(React.createElement(Provider, null,
    React.createElement(MemoryRouter, null,
      React.createElement(Navigation, { canAdd: false, onAdd() {} }),
    ),
  )));
  await tick();
};
const unmount = async () => {
  await React.act(async () => root.unmount());
  root = null;
  await tick();
};
const remount = async () => {
  await unmount();
  await mount();
};

(async () => {
  // Checking actual emitted conditional CSS catches defaultConfig's retained _light values.
  test.equal(palette(':root &, .light &'), {
    bg: '#f4f5f3', fg: '#223a28', 'fg-muted': '#59645b', border: '#8a958c',
    'teal-solid': '#536f08', 'teal-fg': '#32573b', 'teal-subtle': '#f1f4e2',
  }, 'Light conditional CSS uses the requested neutral and green palette, not inherited Chakra defaults');
  test.equal(palette('.dark &, .dark .chakra-theme:not(.light) &'), {
    bg: '#151a16', fg: '#f1f4e2', 'fg-muted': '#b5c0b3', border: '#697765',
    'teal-solid': '#a9c95b', 'teal-fg': '#c0da84', 'teal-subtle': '#303e27',
  }, 'Dark conditional CSS retains the matching dark palette');

  await mount();
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: null },
    'First load defaults to Light even when the OS prefers dark');
  await changeSystem(false);
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: null },
    'The default Light appearance ignores OS changes');
  await switchTheme();
  test.equal(state(), { label: 'Theme: Dark. Switch to Light mode', light: false, dark: true, saved: 'dark' },
    'Choosing Dark applies and persists the dark theme');
  await changeSystem(true);
  await changeSystem(false);
  test.equal(state(), { label: 'Theme: Dark. Switch to Light mode', light: false, dark: true, saved: 'dark' },
    'An explicit Dark choice ignores subsequent OS changes');
  await remount();
  test.equal(state(), { label: 'Theme: Dark. Switch to Light mode', light: false, dark: true, saved: 'dark' },
    'A saved Dark choice survives a fresh mount');
  await switchTheme();
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'The second choice returns directly to Light and persists it');
  await changeSystem(true);
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'An explicit Light choice ignores an OS change to dark');
  await remount();
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'A saved Light choice survives a fresh mount');

  await unmount();
  localStorage.setItem('eindhoven-theme', 'system');
  await mount();
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'A retired appearance preference migrates to Light before mounting');
  test.equal(document.documentElement.className, 'light',
    'A retired appearance preference leaves no unsupported root class');
  await changeSystem(false);
  await changeSystem(true);
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'The migrated preference ignores subsequent OS changes');
  await unmount();
  localStorage.setItem('eindhoven-theme', 'unsupported');
  await mount();
  test.equal(state(), { label: 'Theme: Light. Switch to Dark mode', light: true, dark: false, saved: 'light' },
    'An unsupported saved appearance safely falls back to Light');
  await unmount();
  test.equal(environment.consoleIssues, [], 'Theme transitions produce no React or Router console warnings');
  test.equal(environment.domIssues, [], 'Theme transitions produce no unexpected DOM errors');
  console.log(`PASS appearance: ${test.count} emitted-palette and real theme-control assertions. CSS @layer parsing limitations: ${environment.cssLimitations}.`);
  console.log('Checks emitted CSS and DOM theme transitions; does not claim browser paint or visual-layout verification.');
})().catch(error => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
}).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  environment.close();
});
