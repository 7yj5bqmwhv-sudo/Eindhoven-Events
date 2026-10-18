const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter } = require('react-router-dom');
const { EventCard, EventImage, LoadingEvents, Provider } = bundle(`
  export { EventCard } from './src/components/EventCard.jsx';
  export { EventImage } from './src/components/EventImage.jsx';
  export { LoadingEvents } from './src/components/LoadingEvents.jsx';
  export { Provider } from './src/components/ui/provider.jsx';
`);
const seed = require('../data/events.seed.json');
const test = assertions();
const full = value => value === '100%' || value === 'var(--chakra-sizes-full)';
const zero = value => value === '0' || value === '0px';
const widescreen = value => Math.abs(Number(value) - 16 / 9) < 0.0001 || /^16\s*\/\s*9$/.test(value);
const query = selector => document.querySelector(selector);
let root;

(async () => {
  root = createRoot(document.getElementById('root'));
  const render = child => React.act(async () => root.render(React.createElement(Provider, null,
    React.createElement(MemoryRouter, null, child),
  )));
  const cover = seed.events.find(event => event.imageFit === 'cover');
  const contain = seed.events.find(event => event.imageFit === 'contain');
  const card = event => React.createElement(EventCard, { event, categories: seed.categories });
  await render(card(cover));
  let image = query('.event-card img');
  let wrapper = image.parentElement;
  let styles = getComputedStyle(wrapper);
  test.equal([getComputedStyle(query('.event-card')).flexDirection, getComputedStyle(query('.event-card')).alignItems],
    ['column', 'stretch'], 'The card stretches its children instead of inheriting the Link recipe’s centered cross-axis alignment');
  test.check(full(styles.width) && zero(styles.minWidth), 'The image wrapper explicitly occupies the full card width and permits shrinking');
  test.check(styles.position === 'relative' && styles.overflow === 'hidden' && widescreen(styles.aspectRatio),
    'The card reserves a clipped, positioned 16:9 image container');
  const imageStyles = getComputedStyle(image);
  test.check(imageStyles.position === 'absolute' && zero(imageStyles.inset) && imageStyles.display === 'block'
    && full(imageStyles.width) && full(imageStyles.height),
  'Image intrinsic dimensions cannot shrink the card container: the image fills it absolutely');
  test.equal([imageStyles.objectFit, image.getAttribute('alt'), image.getAttribute('loading'), image.getAttribute('fetchpriority')],
    ['cover', cover.imageAlt, 'lazy', 'auto'], 'Photos crop with cover while retaining descriptive alternative text and lazy loading');

  await render(card(contain));
  image = query('.event-card img');
  styles = getComputedStyle(image);
  test.check(styles.objectFit === 'cover'
    && widescreen(getComputedStyle(image.parentElement).aspectRatio),
  'Poster thumbnails fill the complete 16:9 card frame without letterboxing');
  await React.act(async () => image.dispatchEvent(new Event('error')));
  const fallback = query('.event-card [role="img"]');
  test.check(!query('.event-card img') && fallback?.getAttribute('aria-label') === `${contain.title}, image unavailable`,
    'A failed image becomes an accessible fallback instead of leaving a broken image');
  styles = getComputedStyle(fallback);
  test.check(full(styles.width) && zero(styles.minWidth) && widescreen(styles.aspectRatio),
    'The failure fallback preserves the full-width 16:9 card frame');

  const replacement = { ...contain, image: 'https://example.com/replacement.jpg', imageAlt: null, imageFit: 'cover' };
  await render(card(replacement));
  image = query('.event-card img');
  test.check(image?.getAttribute('src') === replacement.image && image.getAttribute('alt') === replacement.title
    && !query('.event-card [role="img"]'),
  'Replacing a failed URL recovers the image and uses the title when custom alternative text is absent');
  test.check(getComputedStyle(image).objectFit === 'cover' && full(getComputedStyle(image.parentElement).width),
    'Recovered photos retain cover fitting and the explicit full-width wrapper');

  await render(React.createElement(EventImage, { src: contain.image, title: 'Priority event', imageFit: 'contain', priority: true, h: '96' }));
  image = query('#root img');
  test.equal([image.getAttribute('loading'), image.getAttribute('fetchpriority'), image.getAttribute('alt'), getComputedStyle(image).objectFit],
    ['eager', 'high', 'Priority event', 'contain'], 'Detail posters remain fully contained with eager loading, high fetch priority and alternative text');

  await render(React.createElement(LoadingEvents));
  const skeletons = [...document.querySelectorAll('[aria-label="Loading events"] [aria-hidden="true"] > .chakra-skeleton')];
  test.equal(skeletons.length, 3, 'Each loading card reserves one leading image skeleton');
  test.check(skeletons.every(node => {
    const style = getComputedStyle(node);
    return full(style.width) && widescreen(style.aspectRatio);
  }), 'Loading image skeletons use the same full-width 16:9 frame as loaded cards');
  await React.act(async () => root.unmount());
  root = null;
  test.equal(environment.consoleIssues, [], 'Image and fallback rendering emits no React warnings or errors');
  test.equal(environment.domIssues, [], 'Image rendering emits no unexpected DOM errors');
  console.log(`PASS images: ${test.count} assertions (rendered CSS contract, image fit, accessibility, failure recovery, and skeleton dimensions; no browser layout measurement)`);
})().catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
}).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  environment.close();
});
