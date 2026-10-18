const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { EventsProvider, useEvents } = bundle("export { EventsProvider } from './src/context/EventsProvider.jsx'; export { useEvents } from './src/context/useEvents.js';");
const test = assertions();
const originalFetch = global.fetch;
const requests = [];
global.fetch = (url, options = {}) => new Promise((resolve, reject) => {
  requests.push({ url: String(url), options, resolve, reject, settled: false });
});
const seed = {
  events: [{ id: 1, title: 'Original event', description: 'A shared evening.', image: 'https://example.com/event.jpg', location: 'Eindhoven', startTime: '2027-04-16T10:00:00.000Z', endTime: '2027-04-16T12:00:00.000Z', categoryIds: [1], createdBy: 1 }],
  categories: [{ id: 1, name: 'Music' }],
  users: [{ id: 1, name: 'Yurii', image: 'https://example.com/host.jpg' }],
};
let context;
function Consumer() {
  context = useEvents();
  return React.createElement('output', null, JSON.stringify({ loading: context.loading, error: context.error, events: context.events }));
}
const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
const pending = method => requests.filter(request => !request.settled && request.options.method === method);
const respond = async (request, data, { status = 200, error } = {}) => {
  test.check(request, 'Expected request');
  request.settled = true;
  await React.act(async () => {
    if (error) request.reject(error);
    else request.resolve({ ok: status >= 200 && status < 300, status, json: async () => data });
  });
  await tick();
};
const load = async (data = seed, selected = pending('GET')) => {
  test.equal(selected.length, 3, 'One parallel request per collection');
  for (const request of selected) await respond(request, data[request.url.split('/').at(-1)]);
};
let root;

(async () => {
  root = createRoot(document.getElementById('root'));
  await React.act(async () => root.render(React.createElement(EventsProvider, null, React.createElement(Consumer))));
  test.equal(context.loading, true, 'Initial loading is observable');
  test.equal(context.events, [], 'Initial events are empty');
  await load();
  test.equal(context.loading, false, 'Loading ends after all collections arrive');
  test.equal(context.error, null);
  test.equal(context.events, seed.events);
  test.equal(context.categories, seed.categories);
  test.equal(context.users, seed.users);

  await React.act(async () => { context.reload(); });
  const staleReads = pending('GET');
  await React.act(async () => { context.reload(); });
  test.check(staleReads.every(request => request.options.signal.aborted), 'Reload cancels the previous batch');
  const latestReads = pending('GET').filter(request => !staleReads.includes(request));
  const newer = { ...seed, events: [{ ...seed.events[0], title: 'Latest event' }] };
  await load(newer, latestReads);
  await load(seed, staleReads);
  test.equal(context.events, newer.events, 'A late older result never overwrites newer data');

  await React.act(async () => { context.reload(); });
  const failedBatch = pending('GET');
  await respond(failedBatch[0], null, { status: 500 });
  await respond(failedBatch[1], seed.categories);
  await respond(failedBatch[2], seed.users);
  test.equal(context.loading, false, 'Load errors end the loading state');
  test.check(context.error.includes('500'), 'Load errors are exposed to the UI');
  await React.act(async () => { context.reload(); });
  test.equal(context.error, null, 'Retry clears the previous error');
  await load();
  test.equal(context.events, seed.events, 'Retry recovers successfully');

  const draft = { ...seed.events[0], id: undefined, title: 'New event' };
  let operation;
  await React.act(async () => { operation = context.createEvent(draft); operation.catch(() => {}); });
  test.equal(context.events, seed.events, 'Create does not insert unsaved data');
  await respond(pending('POST')[0], null, { status: 500 });
  await test.rejects(() => operation, /500/, 'Create rejects on HTTP failure');
  test.equal(context.events, seed.events, 'Failed creation leaves the list unchanged');
  await React.act(async () => { operation = context.createEvent(draft); });
  const created = { ...draft, id: 2 };
  await respond(pending('POST')[0], created, { status: 201 });
  test.equal(await operation, created, 'Create returns the saved server record');
  test.equal(context.events, [...seed.events, created], 'Create inserts one record immediately');

  await React.act(async () => { operation = context.updateEvent('2', { title: 'Renamed' }); operation.catch(() => {}); });
  await respond(pending('PATCH')[0], null, { error: new TypeError('offline') });
  await test.rejects(() => operation, /unavailable/, 'Update rejects on network failure');
  test.equal(context.events.at(-1), created, 'Failed edit preserves the original event');
  await React.act(async () => { operation = context.updateEvent('2', { title: 'Renamed' }); });
  const edited = { ...created, title: 'Renamed' };
  await respond(pending('PATCH')[0], edited);
  test.equal(await operation, edited);
  test.equal(context.events, [...seed.events, edited], 'Update matches IDs across string and number representations');

  await React.act(async () => { context.reload(); });
  const beforeMutation = pending('GET');
  await React.act(async () => { operation = context.updateEvent('2', { title: 'Latest saved title' }); });
  const latestEdit = { ...edited, title: 'Latest saved title' };
  await respond(pending('PATCH')[0], latestEdit);
  await operation;
  await load({ ...seed, events: [...seed.events, created] }, beforeMutation);
  test.equal(context.events.at(-1), latestEdit, 'An older read cannot roll back a successful edit');
  await load({ ...seed, events: [...seed.events, latestEdit] });
  test.equal(context.events.at(-1), latestEdit, 'A fresh read reconciles after the mutation');

  await React.act(async () => { operation = context.deleteEvent('2'); operation.catch(() => {}); });
  test.equal(context.events.length, 2, 'Pending deletion preserves the visible record');
  await respond(pending('DELETE')[0], null, { status: 500 });
  await test.rejects(() => operation, /500/, 'Delete rejects on failure');
  test.equal(context.events.at(-1), latestEdit, 'Failed delete keeps the record');
  await React.act(async () => { operation = context.deleteEvent('2'); });
  await respond(pending('DELETE')[0], undefined, { status: 204 });
  await operation;
  test.equal(context.events, seed.events, 'Confirmed deletion removes only its target');

  await React.act(async () => { context.reload(); });
  const interrupted = pending('GET');
  await React.act(async () => root.unmount());
  root = null;
  test.check(interrupted.every(request => request.options.signal.aborted), 'Unmount aborts active requests');
  test.equal(environment.consoleIssues, [], 'No React warnings in context interactions');
  test.equal(environment.domIssues, [], 'No jsdom runtime errors');
  console.log(`PASS context: ${test.count} assertions, including request races and mutation failures.`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  global.fetch = originalFetch;
  environment.close();
});
