const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter, Routes, Route, Outlet } = require('react-router-dom');
const { EventsPage, EventsContext, Provider } = bundle(`
  export { EventsPage } from './src/pages/EventsPage.jsx';
  export { EventsContext } from './src/context/EventsContext.js';
  export { Provider } from './src/components/ui/provider.jsx';
`);
const test = assertions();
const categories = [
  { id: 1, name: 'Music' }, { id: 2, name: 'Food' },
  { id: 3, name: 'Design' }, { id: 4, name: 'Outdoors' },
];
const listings = [
  ['Jazz in the garden', [1]], ['Shared table', [2]],
  ['Open studio evening', [3]], ['Studio sound session', [1, 3]],
  ['Neighbourhood picnic', [2, 4]], ['Studio supper', [2]],
  ['Park walk', [4]], ['Street photography walk', [3, 4]],
  ['Community choir', [1]], ['Design market', [3]],
  ['Creative cinema night', [3]], ['Studio city walk', [4]],
];
const events = listings.map(([title, categoryIds], index) => ({
  id: index + 1, title, categoryIds, createdBy: 1,
  description: `Join neighbours for ${title.toLowerCase()} in Eindhoven.`,
  image: '/images/community.jpg', location: 'Strijp-S, Eindhoven',
  startTime: '2027-06-12T17:00:00.000Z', endTime: '2027-06-12T20:00:00.000Z',
}));
const samples = [];
let stage = 'initial mount with skeletons';
function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  samples.push({ stage, id, phase, actualDuration, baseDuration, startTime, commitTime });
}
const titles = () => [...document.querySelectorAll('a[aria-label^="View "]')]
  .map(node => node.getAttribute('aria-label').replace(/^View /, ''));
const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 35)); });
const search = async value => {
  const input = document.querySelector('[aria-label="Search events by name"]');
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await tick();
};
const selectCategory = async name => {
  const label = [...document.querySelectorAll('label')].find(node => node.textContent.trim() === name);
  test.check(label, `Category control exists: ${name}`);
  await React.act(async () => label.click());
  await tick();
};
let root;
function render(loading) {
  const value = { events: loading ? [] : events, categories, loading, error: null, reload() {} };
  root.render(React.createElement(Provider, null,
    React.createElement(MemoryRouter, null,
      React.createElement(EventsContext.Provider, { value },
        React.createElement(React.Profiler, { id: 'EventsPage', onRender },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/', element: React.createElement(Outlet, { context: { onAdd() {} } }) },
              React.createElement(Route, { index: true, element: React.createElement(EventsPage) }),
            ),
          ),
        ),
      ),
    ),
  ));
}

(async () => {
  root = createRoot(document.getElementById('root'));
  await React.act(async () => render(true));
  await tick();
  test.check(document.querySelector('[aria-label="Loading events"]'), 'Initial render shows skeletons');
  test.equal(titles(), [], 'Loading does not show event cards');

  stage = 'load 12 events';
  await React.act(async () => render(false));
  await tick();
  test.equal(document.querySelector('[aria-label="Loading events"]'), null, 'Loaded data replaces skeletons');
  test.equal(titles(), events.map(event => event.title), 'All 12 fixture events render');

  stage = 'title search';
  await search('studio');
  test.equal(titles(), ['Open studio evening', 'Studio sound session', 'Studio supper', 'Studio city walk'], 'Title search shows four matches');

  stage = 'first category filter';
  await selectCategory('Music');
  test.equal(titles(), ['Studio sound session'], 'Music filter combines with title search');

  stage = 'multiple category filters';
  await selectCategory('Design');
  test.equal(titles(), ['Open studio evening', 'Studio sound session'], 'Two selected categories match either category within search results');
  test.equal(document.querySelectorAll('input[type="checkbox"]:checked').length, 2, 'Both filters remain selected');

  const stages = ['initial mount with skeletons', 'load 12 events', 'title search', 'first category filter', 'multiple category filters'];
  const measurements = stages.map(name => {
    const commits = samples.filter(sample => sample.stage === name);
    test.check(commits.length > 0, `${name} produces a measured commit`);
    test.check(commits.every(sample => ['actualDuration', 'baseDuration', 'startTime', 'commitTime']
      .every(key => Number.isFinite(sample[key]) && sample[key] >= 0)), `${name} has finite profiler measurements`);
    return { stage: name, commits: commits.length,
      actualDuration: commits.reduce((sum, sample) => sum + sample.actualDuration, 0),
      baseDuration: commits.at(-1).baseDuration };
  });
  test.check(samples.some(sample => sample.phase === 'mount'), 'Profiler captures mounting');
  test.check(samples.some(sample => sample.phase === 'update'), 'Profiler captures updates');
  await React.act(async () => root.unmount());
  root = null;
  await tick();
  test.equal(environment.consoleIssues, [], 'No React or Router console warnings');
  test.equal(environment.domIssues, [], 'No unexpected jsdom errors');
  console.log('React Profiler: development-mode jsdom measurements, excluding browser layout, paint and network time.');
  console.log('Actual time is summed across commits; base time is the last commit estimate. No timing pass/fail threshold.');
  for (const measurement of measurements) {
    console.log(`  ${measurement.stage}: ${measurement.commits} commits; actual ${measurement.actualDuration.toFixed(2)} ms; base ${measurement.baseDuration.toFixed(2)} ms`);
  }
  console.log(`PASS profile: ${test.count} rendering, filtering and profiler assertions. CSS @layer parsing limitations: ${environment.cssLimitations}.`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  environment.close();
});
