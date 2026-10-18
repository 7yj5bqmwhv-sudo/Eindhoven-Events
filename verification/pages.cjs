const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter, Routes, Route, useNavigate, useLocation } = require('react-router-dom');
const { Root, EventsPage, EventPage, AboutPage, NotFoundPage, Provider, formatDate, formatTime } = bundle(`
  export { Root } from './src/components/Root.jsx';
  export { EventsPage } from './src/pages/EventsPage.jsx';
  export { EventPage } from './src/pages/EventPage.jsx';
  export { AboutPage } from './src/pages/AboutPage.jsx';
  export { NotFoundPage } from './src/pages/NotFoundPage.jsx';
  export { Provider } from './src/components/ui/provider.jsx';
  export { formatDate, formatTime } from './src/utils/display.js';
`);
const test = assertions();
const originalFetch = global.fetch;
const requests = [];
global.fetch = (url, options = {}) => new Promise((resolve, reject) => {
  requests.push({ url: String(url), options, resolve, reject, settled: false });
});
const base = { image: 'https://example.com/event.jpg', location: 'Community garden, Eindhoven',
  startTime: '2027-06-12T17:00:00.000Z', endTime: '2027-06-12T20:00:00.000Z', createdBy: 1 };
const seed = {
  events: [
    { ...base, id: 1, title: 'Jazz in the garden', description: 'Live music under the trees.', categoryIds: [1], image: 'https://wincacademy.github.io/webpages/media/pexels-tima-miroshnichenko-6598746.jpg' },
    { ...base, id: 2, title: 'Shared table', description: 'A jazz-themed dinner with neighbours.', categoryIds: [2] },
    { ...base, id: 3, title: 'Jazz and design', description: 'A creative workshop with a live soundtrack.', categoryIds: [1, 3] },
    { ...base, id: 'unknown-relations', title: 'Neighbourhood walk', description: 'A stroll through the city.', categoryIds: ['missing'], createdBy: 'missing' },
  ],
  categories: [{ id: 1, name: 'Music' }, { id: 2, name: 'Food' }, { id: 3, name: 'Design' }],
  users: [{ id: 1, name: 'Yurii Ivanov', image: 'https://example.com/host.jpg' }],
};
const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 35)); });
const query = selector => document.querySelector(selector);
const text = () => document.body.textContent;
const button = label => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === label);
const link = label => [...document.querySelectorAll('a')].find(node => node.textContent.trim() === label);
const cardLinks = () => [...document.querySelectorAll('a[aria-label^="View "]')];
const titles = () => cardLinks().map(node => node.getAttribute('aria-label').replace(/^View /, ''));
const pending = method => requests.filter(request => !request.settled && request.options.method === method);
const click = async node => {
  test.check(node, 'Expected interactive control');
  await React.act(async () => node.click());
  await tick();
};
const setInput = async (input, value) => {
  test.check(input, 'Expected input');
  await React.act(async () => {
    const prototype = input.tagName === 'SELECT' ? window.HTMLSelectElement.prototype
      : input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
  await tick();
};
const setSearch = value => setInput(query('[aria-label="Search events by name"]'), value);
const category = name => [...document.querySelectorAll('label')].find(node => node.textContent.trim() === name);
const respond = async (request, data, status = 200) => {
  test.check(request, 'Expected API request');
  request.settled = true;
  await React.act(async () => request.resolve({ ok: status >= 200 && status < 300, status, json: async () => data }));
  await tick();
};
const finishLoad = async (data = seed, fail = false) => {
  const batch = pending('GET');
  test.equal(batch.length, 3, 'Root fetches the three shared collections');
  for (const request of batch) {
    const resource = request.url.split('/').at(-1);
    await respond(request, data[resource], fail && resource === 'events' ? 500 : 200);
  }
};
const submit = async () => {
  test.check(query('form'), 'Expected event form');
  await React.act(async () => query('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await tick();
};
let navigate;
let location;
function RouterProbe() {
  navigate = useNavigate();
  location = useLocation();
  return null;
}
const go = async path => { await React.act(async () => navigate(path)); await tick(); };
let root;

(async () => {
  root = createRoot(document.getElementById('root'));
  await React.act(async () => root.render(React.createElement(Provider, null,
    React.createElement(MemoryRouter, null,
      React.createElement(RouterProbe),
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(Root) },
          React.createElement(Route, { index: true, element: React.createElement(EventsPage) }),
          React.createElement(Route, { path: 'event/:eventId', element: React.createElement(EventPage) }),
          React.createElement(Route, { path: 'about', element: React.createElement(AboutPage) }),
          React.createElement(Route, { path: '*', element: React.createElement(NotFoundPage) }),
        ),
      ),
    ),
  )));
  await tick();
  test.check(query('[aria-label="Theme: Light. Switch to Dark mode"]'), 'First load defaults to Light');
  test.check(document.documentElement.classList.contains('light'), 'The default appearance applies the root light class');
  await click(query('[aria-label="Theme: Light. Switch to Dark mode"]'));
  test.check(query('[aria-label="Theme: Dark. Switch to Light mode"]'), 'Theme switches from Light to Dark');
  test.equal(localStorage.getItem('eindhoven-theme'), 'dark', 'Dark preference is persisted');
  test.check(document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light'), 'Dark choice replaces the light class');
  await click(query('[aria-label="Theme: Dark. Switch to Light mode"]'));
  test.check(query('[aria-label="Theme: Light. Switch to Dark mode"]'), 'Theme switches directly back to Light');
  test.equal(localStorage.getItem('eindhoven-theme'), 'light', 'Light preference is persisted with the app storage key');
  test.check(document.documentElement.classList.contains('light') && !document.documentElement.classList.contains('dark'), 'Light choice replaces the dark class');
  test.check(query('[aria-label="Loading events"]'), 'Loading has a status region and skeletons');
  await finishLoad(seed, true);
  test.check(text().includes("We couldn't load the events"), 'Initial fetch failure is explained');
  test.equal(cardLinks().length, 0, 'Failed data is not presented as a successful list');
  await click(button('Try again'));
  test.check(query('[aria-label="Loading events"]'), 'Retry returns to the loading state');
  await finishLoad();
  test.equal(query('[aria-label="Loading events"]'), null, 'Loaded events replace skeletons');
  test.equal(titles(), seed.events.map(event => event.title), 'The overview includes every event');
  for (const event of seed.events) {
    const card = query(`a[aria-label="View ${event.title}"]`);
    test.check(card.textContent.includes(event.description), 'Card includes description');
    const renderedImage = event.id === 1 ? '/images/boardgames.jpg' : event.image;
    test.equal(card.querySelector('img')?.getAttribute('src'), renderedImage, event.id === 1 ? 'Known course image URL resolves to its bundled asset' : 'Card includes its event image');
    test.check(card.textContent.includes(formatDate(event.startTime)) && card.textContent.includes(formatTime(event.startTime)), 'Card includes start date and time');
    test.check(card.textContent.includes(formatDate(event.endTime)) && card.textContent.includes(formatTime(event.endTime)), 'Card includes end date and time');
    test.check(card.textContent.includes(event.location), 'Card includes location');
  }
  await React.act(async () => query('a[aria-label="View Jazz in the garden"] img').dispatchEvent(new Event('error')));
  test.check(query('[role="img"][aria-label="Jazz in the garden, image unavailable"]'), 'Image loading failure has an accessible fallback');
  test.equal(query('a[aria-label="View Jazz in the garden"] img'), null, 'Failed image is replaced rather than leaving a broken image');
  test.check(query('a[aria-label="View Jazz and design"]').textContent.includes('Design'), 'All card categories are shown');
  await setSearch('  jAzZ  ');
  test.equal(titles(), ['Jazz in the garden', 'Jazz and design'], 'Name search trims spaces and ignores case; descriptions do not match');
  await click(category('Design'));
  test.equal(titles(), ['Jazz and design'], 'Category selection combines with name search');
  await click(category('Food'));
  test.equal(titles(), ['Jazz and design'], 'Another category does not bypass the name search');
  await setSearch('');
  test.equal(titles(), ['Shared table', 'Jazz and design'], 'Multiple categories match either selected category');
  await setSearch('no-such-event');
  test.check(text().includes('No events found'), 'No matches have a useful empty state');
  await click(button('Reset search and filters'));
  test.equal(titles().length, 4, 'Reset clears search and category selection');
  test.equal(location.search, '', 'Reset clears URL filter state');

  await setSearch('jazz');
  await click(query('a[aria-label="View Jazz and design"]'));
  test.equal(location.pathname, '/event/3', 'Clicking a card opens its detail route');
  test.equal(query('h1').textContent, 'Jazz and design');
  test.check(text().includes(seed.events[2].description), 'Details include the full description');
  test.check(text().includes('Music') && text().includes('Design'), 'Details show category names');
  test.check(text().includes('Yurii Ivanov'), 'Details identify the organiser');
  test.check(text().includes(seed.events[2].location), 'Details show the location');
  test.check(text().includes('STARTS') && text().includes('ENDS'), 'Details identify both time boundaries');
  test.check(query('img[alt="Jazz and design"]'), 'Details show the event image');
  test.check(environment.scrolls.length > 0, 'Navigation requests scrolling to the top');
  await click(link('Back to events'));
  test.equal(query('[aria-label="Search events by name"]').value, 'jazz', 'Back preserves the search');
  await go('/event/unknown-relations');
  test.check(text().includes('Community organiser'), 'Unknown creator has a safe fallback');
  test.check(text().includes('Unlisted category'), 'Unknown category has a safe fallback');
  await go('/event/not-a-real-id');
  test.check(text().includes('Event not found'), 'An unknown event ID has a not-found state');
  await click(button('Explore events'));
  test.equal(location.pathname, '/');
  await go('/this-page-does-not-exist');
  test.check(text().includes('This path leads somewhere else'), 'Unknown routes render the dedicated not-found page');
  test.equal(document.title, 'Page not found | Eindhoven Together', 'Not-found route has a descriptive document title');
  await click(button('Back to events'));
  test.equal(location.pathname, '/', 'Not-found recovery returns to the event overview');
  await click(link('About'));
  test.equal(location.pathname, '/about', 'The third page is reachable from navigation');
  test.check(text().includes('A good city starts with its people.'), 'About content renders');
  await click(link('Explore the events'));

  await click(button('Add event') || button('Add an event'));
  for (const [name, value] of Object.entries({ title: '  New community workshop  ', description: '  Make something together.  ',
    image: 'https://example.com/new.jpg', location: '  Eindhoven studio  ', startTime: '2027-07-10T10:00', endTime: '2027-07-10T12:00', createdBy: '1' })) {
    await setInput(query(`[name="${name}"]`), value);
  }
  await click(query('input[name="categoryIds"][value="3"]'));
  await submit();
  test.equal(pending('POST').length, 1, 'Creation sends one POST');
  test.equal(location.pathname, '/', 'Pending creation stays on the overview');
  await respond(pending('POST')[0], null, 500);
  const createErrorToast = [...document.querySelectorAll('[data-scope="toast"][data-part="root"]')]
    .find(node => node.textContent.includes('Could not create event'));
  test.check(createErrorToast, 'Failed creation shows the actual error toast');
  test.check(createErrorToast.textContent.includes('500'), 'Create failure toast explains the server error');
  test.check(query('[role="dialog"][data-state="open"]'), 'Failed creation keeps its dialog open');
  test.equal(query('[name="title"]').value, '  New community workshop  ', 'Failed creation preserves the entered title');
  test.equal(query('[name="description"]').value, '  Make something together.  ', 'Failed creation preserves the description');
  test.equal(query('input[name="categoryIds"][value="3"]').checked, true, 'Failed creation preserves selected categories');
  test.equal(location.pathname, '/', 'Failed creation does not navigate to an unsaved detail page');
  test.equal(titles(), seed.events.map(event => event.title), 'Failed creation leaves the existing event list unchanged');
  await submit();
  test.equal(pending('POST').length, 1, 'Retry submits one POST from the preserved draft');
  const created = { ...JSON.parse(pending('POST')[0].options.body), id: 10 };
  await respond(pending('POST')[0], created, 201);
  test.check(text().includes('Event created'), 'Successful creation shows feedback');
  test.equal(query('[role="dialog"][data-state="open"]'), null, 'Successful creation closes the form');
  await go('/event/10');
  test.equal(query('h1').textContent, 'New community workshop', 'Created event is immediately available without reload');
  await click(button('Edit event'));
  await setInput(query('[name="title"]'), 'Updated community workshop');
  await submit();
  await respond(pending('PATCH')[0], null, 500);
  test.check(text().includes('Could not update event'), 'Failed edit has error feedback');
  test.equal(query('h1').textContent, created.title, 'Failed edit leaves saved details unchanged');
  await submit();
  const updated = { ...created, ...JSON.parse(pending('PATCH')[0].options.body) };
  await respond(pending('PATCH')[0], updated);
  test.equal(query('h1').textContent, 'Updated community workshop', 'Saved edit updates the detail screen');
  test.check(text().includes('Event updated'), 'Saved edit has success feedback');
  await click(button('Delete event'));
  await click(button('Keep event'));
  test.equal(pending('DELETE').length, 0, 'Cancel keeps the event without a DELETE request');
  await click(button('Delete event'));
  await click([...document.querySelectorAll('[role="alertdialog"] button')].find(node => node.textContent.trim() === 'Delete event'));
  await respond(pending('DELETE')[0], null, 500);
  test.check(text().includes('Could not delete event'), 'Failed delete has error feedback');
  test.equal(query('h1').textContent, updated.title, 'Failed delete preserves the detail page');
  await click([...document.querySelectorAll('[role="alertdialog"] button')].find(node => node.textContent.trim() === 'Delete event'));
  await respond(pending('DELETE')[0], undefined, 204);
  test.equal(location.pathname, '/', 'Successful deletion returns to the overview');
  test.equal(titles().includes(updated.title), false, 'Deleted event disappears immediately');
  test.check(text().includes('Event deleted'), 'Successful deletion shows feedback');

  await React.act(async () => root.unmount());
  root = null;
  await tick();
  test.equal(environment.consoleIssues, [], 'No React or Router warnings during complete user flows');
  test.equal(environment.domIssues, [], 'No unexpected jsdom errors');
  console.log(`PASS pages: ${test.count} routing, filtering, CRUD, state and feedback assertions. CSS @layer parsing limitations: ${environment.cssLimitations}.`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  global.fetch = originalFetch;
  environment.close();
});
