const fs = require('node:fs');
const path = require('node:path');
const { bundle, assertions, setupDOM, project } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const {
  createEventDraft, validateEventForm, imageLocalMap, safeExternalUrl,
  EventSource, EventImageCredit, EventPage, EventsContext, Provider,
} = bundle(`
  export { createEventDraft, validateEventForm } from './src/utils/eventForm.js';
  export { imageLocalMap } from './src/utils/imageAssets.js';
  export { safeExternalUrl } from './src/utils/externalLinks.js';
  export { EventSource, EventImageCredit } from './src/components/EventSource.jsx';
  export { EventPage } from './src/pages/EventPage.jsx';
  export { EventsContext } from './src/context/EventsContext.js';
  export { Provider } from './src/components/ui/provider.jsx';
`);
const seed = JSON.parse(fs.readFileSync(path.join(project, 'data/events.seed.json'), 'utf8'));
const database = JSON.parse(fs.readFileSync(path.join(project, 'events.json'), 'utf8'));
const sources = JSON.parse(fs.readFileSync(path.join(project, 'data/event-sources.json'), 'utf8'));
const test = assertions();
const officialHosts = new Set([
  'ddw.nl', 'www.parktheater.nl', 'www.effenaar.nl', 'gloweindhoven.nl',
  'wintermarketeindhoven.nl',
]);
const windowStart = Date.parse('2026-10-18T00:00:00+02:00');
const windowEnd = Date.parse('2027-01-01T00:00:00+01:00');
const localParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const localTimestamp = value => {
  const parts = Object.fromEntries(localParts.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
};
const officialLink = value => Boolean(safeExternalUrl(value) && officialHosts.has(new URL(value).hostname));
let root;

(async () => {
  test.equal(database, seed, 'The initial JSON Server database matches the documented reset seed');
  test.equal(sources.window, { from: '2026-10-18', through: '2026-12-31' }, 'Research covers the requested remaining 2026 period');
  test.equal(sources.timeZone, 'Europe/Amsterdam', 'Source schedule metadata names the Eindhoven time zone');
  test.equal(sources.checkedAt, '2026-10-18', 'The research snapshot records its verification date');
  test.equal(seed.events.length, 12, 'The researched selection contains twelve events');
  for (const collection of ['events', 'categories', 'users']) {
    test.equal(new Set(seed[collection].map(record => String(record.id))).size, seed[collection].length, `${collection} have unique IDs`);
  }
  test.equal(sources.assets.map(asset => String(asset.eventId)).sort(), seed.events.map(event => String(event.id)).sort(),
    'Each seeded event has exactly one image provenance entry');
  const starts = seed.events.map(event => Date.parse(event.startTime));
  test.equal(starts, [...starts].sort((a, b) => a - b), 'The curated events are ordered by start date');

  for (const event of seed.events) {
    const label = event.title;
    const asset = sources.assets.find(item => String(item.eventId) === String(event.id));
    test.equal(validateEventForm(createEventDraft(event), seed.categories, seed.users), {}, `${label}: all required fields and relationships pass the real form validator`);
    test.equal(new Set(event.categoryIds.map(String)).size, event.categoryIds.length, `${label}: categories are not duplicated`);
    test.check(Date.parse(event.endTime) > Date.parse(event.startTime), `${label}: the end follows the start`);
    test.check(Date.parse(event.startTime) < windowEnd && Date.parse(event.endTime) >= windowStart,
      `${label}: overlaps 18 October through 31 December, including ongoing and overnight events`);
    for (const key of ['startTime', 'endTime']) {
      test.check(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+0[12]:00$/.test(event[key]), `${label}: ${key} has an explicit CET/CEST offset`);
      test.equal(localTimestamp(event[key]), event[key].slice(0, 19), `${label}: ${key} offset matches Amsterdam daylight saving rules`);
    }
    test.check(officialLink(event.sourceUrl), `${label}: the event links to its official organiser`);
    test.check(asset.sourceType === 'user-provided'
      ? event.imageSourceUrl === null && typeof asset.uploadedFileName === 'string' && asset.uploadedFileName.trim()
      : officialLink(event.imageSourceUrl), `${label}: the image has an official source or an explicitly recorded owner upload`);
    test.equal(event.sourceCheckedAt, sources.checkedAt, `${label}: research date agrees with the manifest`);
    test.check(event.sourceName.trim() && event.imageAlt.trim() && event.imageCredit.trim() && event.imageCaption.trim(),
      `${label}: source name, meaningful alternative text, credit and caption are present`);
    test.check(['contain', 'cover'].includes(event.imageFit), `${label}: the chosen image treatment is supported`);
    test.equal(asset.title, event.title, `${label}: source manifest identifies the same event`);
    test.equal(asset.url, event.image, `${label}: manifest preserves the original image URL`);
    test.equal(asset.sourceUrl, event.imageSourceUrl, `${label}: credit and manifest point to the same source`);
    test.equal(asset.credit, event.imageCredit, `${label}: attribution matches the provenance record`);
    test.equal(asset.caption, event.imageCaption, `${label}: the displayed caption matches the provenance record`);
    test.check(asset.rightsNote.trim() && asset.timeEvidence.trim(), `${label}: provenance records image rights context and schedule evidence`);
    test.check(asset.extraSourceUrl === null || officialLink(asset.extraSourceUrl), `${label}: extra timing evidence links only to an official organiser`);
    test.equal(imageLocalMap[event.image], asset.localPath, `${label}: the original image URL maps to its bundled file`);
    test.check(/^\/images\/events\/[^/]+\.(?:jpg|jpeg|png)$/i.test(asset.localPath), `${label}: asset path stays inside the event image directory`);
    const image = fs.readFileSync(path.join(project, 'public', asset.localPath));
    const jpeg = image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    const png = image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    test.check(image.length > 512 && (jpeg || png), `${label}: the bundled asset is a readable image, not an HTML error response`);
  }
  for (const user of seed.users) {
    test.check(Boolean(imageLocalMap[user.image]) && fs.existsSync(path.join(project, 'public', imageLocalMap[user.image])),
      `${user.name}: organiser imagery is available locally`);
  }

  for (const unsafe of ['javascript:alert(1)', 'data:text/html,<h1>bad</h1>', '//example.com', '/relative',
    'https://name:secret@example.com/', 'not a URL', null, {}]) {
    test.equal(safeExternalUrl(unsafe), undefined, 'Untrusted or non-web source URLs are rejected');
  }
  test.equal(safeExternalUrl('https://www.effenaar.nl/agenda/test'), 'https://www.effenaar.nl/agenda/test', 'A valid official HTTPS link is retained');

  const glow = seed.events.find(event => event.featured);
  test.check(glow && glow.imageCaption.includes('2025'), 'The featured previous-edition photo is explicitly dated');
  root = createRoot(document.getElementById('root'));
  const render = async child => {
    await React.act(async () => root.render(React.createElement(Provider, null, child)));
  };
  const edits = [];
  function DetailHarness({ initialEvent }) {
    const [events, setEvents] = React.useState([initialEvent]);
    const context = {
      ...seed, events, loading: false, error: null, reload() {}, deleteEvent() {},
      async updateEvent(id, changes) {
        const saved = { ...events.find(event => event.id === id), ...changes };
        edits.push({ id, changes });
        setEvents(current => current.map(event => event.id === id ? saved : event));
        return saved;
      },
    };
    return React.createElement(EventsContext.Provider, { value: context },
      React.createElement(MemoryRouter, { initialEntries: [`/event/${initialEvent.id}`] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/event/:eventId', element: React.createElement(EventPage) }),
        ),
      ),
    );
  }
  await render(React.createElement(DetailHarness, { key: 'original', initialEvent: glow }));
  const content = document.getElementById('root');
  test.equal(content.querySelector('h1')?.textContent, glow.title, 'A real seeded event renders through its detail route and Context');
  test.equal(content.querySelector(`img[alt="${glow.imageAlt}"]`)?.getAttribute('src'), imageLocalMap[glow.image],
    'The detail view uses the locally bundled real photograph with descriptive alternative text');
  const official = [...content.querySelectorAll('a')].find(link => link.textContent.includes('View official event'));
  test.equal(official?.getAttribute('href'), glow.sourceUrl, 'The event page exposes the official event link');
  test.equal(official?.getAttribute('target'), '_blank', 'Official listing opens separately from the app');
  test.check(official?.rel.includes('noopener') && official.rel.includes('noreferrer'), 'External listing uses protective link relations');
  test.check(content.textContent.includes(glow.imageCaption), 'The previous-edition caption and photographer credit are visible');
  test.check(content.textContent.includes(glow.scheduleNote), 'Multi-day opening hours are visible alongside the overall date range');
  test.check(content.textContent.includes(glow.admissionNote), 'Admission information appears on the detail view');
  test.check(content.textContent.includes(glow.sourceName) && content.textContent.includes('Researched'), 'Source identity and verification date are shown');
  const credit = [...content.querySelectorAll('a')].find(link => link.textContent === 'Image source');
  test.equal(credit?.getAttribute('href'), glow.imageSourceUrl, 'The visible photograph credit links to its official provenance');

  const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 35)); });
  const edit = async fields => {
    const before = edits.length;
    const editButton = [...content.querySelectorAll('button')].find(button => button.textContent.trim() === 'Edit event');
    await React.act(async () => editButton.click());
    await tick();
    for (const [name, value] of Object.entries(fields)) {
      const input = document.querySelector(`form [name="${name}"]`);
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    await React.act(async () => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await tick();
    test.equal(edits.length, before + 1, 'Submitting the real edit modal calls the shared update operation exactly once');
    test.equal(document.querySelector('[role="dialog"][data-state="open"]'), null, 'A successful metadata edit closes its modal');
    test.equal(edits.at(-1).id, glow.id, 'Metadata changes apply to the selected event');
    return edits.at(-1).changes;
  };
  const imageMetadata = ['imageAlt', 'imageFit', 'imageCredit', 'imageSourceUrl', 'imageCaption'];
  const scheduleMetadata = ['scheduleNote', 'admissionNote'];
  const fieldsFrom = (record, names) => Object.fromEntries(names.map(name => [name, record[name]]));
  const missingFields = names => Object.fromEntries(names.map(name => [name, undefined]));
  const nullFields = names => Object.fromEntries(names.map(name => [name, null]));

  const titleOnly = await edit({ title: `${glow.title} (my plan)` });
  test.check(titleOnly.startTime !== glow.startTime && titleOnly.endTime !== glow.endTime,
    'The form serializes offset timestamps into a different ISO representation');
  test.equal([Date.parse(titleOnly.startTime), Date.parse(titleOnly.endTime)], [Date.parse(glow.startTime), Date.parse(glow.endTime)],
    'A title-only edit preserves the actual start and end instants');
  test.equal(fieldsFrom(titleOnly, scheduleMetadata), missingFields(scheduleMetadata),
    'Equal instants with different timestamp representations do not clear researched schedule or admission notes');
  test.equal(fieldsFrom(titleOnly, imageMetadata), missingFields(imageMetadata), 'An unchanged image URL retains its researched image metadata');
  test.check(content.textContent.includes(glow.scheduleNote) && content.textContent.includes(glow.admissionNote),
    'The unchanged schedule and admission notes remain visible after saving');
  test.check(content.textContent.includes(glow.imageCaption), 'The image caption remains visible after a title-only edit');

  await render(React.createElement(DetailHarness, { key: 'image-change', initialEvent: glow }));
  const replacementImage = 'https://example.com/my-event-photo.jpg';
  const imageOnly = await edit({ image: replacementImage });
  test.equal(fieldsFrom(imageOnly, imageMetadata), nullFields(imageMetadata), 'Changing the image explicitly clears all five attributes belonging to the old image');
  test.equal(fieldsFrom(imageOnly, scheduleMetadata), missingFields(scheduleMetadata), 'An image-only edit preserves the unchanged schedule notes');
  test.equal(content.querySelector('img')?.getAttribute('src'), replacementImage, 'The replacement image is rendered after saving');
  test.equal(content.querySelector('img')?.getAttribute('alt'), glow.title, 'Replacement image alternative text falls back to the event title');
  test.check(!content.textContent.includes(glow.imageCaption) && ![...content.querySelectorAll('a')].some(link => link.textContent === 'Image source'),
    'The replacement image does not inherit the old photographer caption or source link');
  test.check(content.textContent.includes(glow.scheduleNote) && content.textContent.includes(glow.admissionNote),
    'An image-only edit leaves schedule and admission information visible');

  for (const boundary of ['startTime', 'endTime']) {
    await render(React.createElement(DetailHarness, { key: `${boundary}-change`, initialEvent: glow }));
    const movedInstant = new Date(Date.parse(glow[boundary]) + 60 * 60 * 1000).toISOString();
    const localValue = createEventDraft({ ...glow, [boundary]: movedInstant })[boundary];
    const timingOnly = await edit({ [boundary]: localValue });
    test.equal(Date.parse(timingOnly[boundary]), Date.parse(movedInstant), `${boundary}: the edited instant is saved`);
    test.equal(fieldsFrom(timingOnly, scheduleMetadata), nullFields(scheduleMetadata),
      `${boundary}: changing either actual time clears stale researched schedule and admission notes`);
    test.equal(fieldsFrom(timingOnly, imageMetadata), missingFields(imageMetadata), `${boundary}: a time edit retains unchanged image attribution`);
    test.check(!content.textContent.includes(glow.scheduleNote) && !content.textContent.includes(glow.admissionNote),
      `${boundary}: stale schedule and admission text disappears from the saved detail page`);
    test.check(content.textContent.includes(glow.imageCaption), `${boundary}: the existing photograph caption stays visible`);
  }

  await render(React.createElement(React.Fragment, null,
    React.createElement(EventSource, { event: { sourceUrl: 'javascript:alert(1)', sourceName: 'Untrusted source' } }),
    React.createElement(EventImageCredit, { event: { imageCredit: 'Example credit', imageCaption: 'Example caption', imageSourceUrl: 'data:text/html,bad' } }),
  ));
  test.equal(content.querySelectorAll('a').length, 0, 'Malicious event and image source URLs never render as clickable links');
  test.check(!content.textContent.includes('Untrusted source'), 'An invalid event source does not render an official-source panel');
  test.check(content.textContent.includes('Example caption'), 'An invalid image URL does not erase its plain-text attribution');
  await render(React.createElement(React.Fragment, null,
    React.createElement(EventSource, { event: {} }), React.createElement(EventImageCredit, { event: {} }),
  ));
  test.equal(content.querySelectorAll('a,h2,p').length, 0, 'New user-created events without provenance do not display invented source claims');
  await React.act(async () => root.unmount());
  root = null;
  test.equal(environment.consoleIssues, [], 'Content and source components emit no React warnings or errors');
  test.equal(environment.domIssues, [], 'Content rendering has no unexpected DOM errors');
  console.log(`PASS content: ${test.count} assertions (source records, date window, Amsterdam offsets, local images, rendered provenance, and edit metadata)`);
})().catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
}).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  environment.close();
});
