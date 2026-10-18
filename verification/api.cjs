const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jsonServer = require('json-server');
const { bundle, assertions, project } = require('./support.cjs');

const test = assertions();
const source = path.join(project, 'events.json');
const original = fs.readFileSync(source, 'utf8');
const seed = JSON.parse(original);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'eindhoven-events-test-'));
const database = path.join(temporary, 'events.json');
fs.writeFileSync(database, original);
const server = jsonServer.create();
server.use(jsonServer.defaults({ logger: false }));
server.use(jsonServer.bodyParser);
server.use(jsonServer.router(database));
let listener;
const originalFetch = global.fetch;

function largeJpegDataUrl(targetBytes) {
  // Insert legal JPEG comment segments into a real project photograph. This
  // exercises near-limit request bodies while keeping a decodable fixture.
  const photograph = fs.readFileSync(path.join(project, 'public/images/community.jpg'));
  const segments = [photograph.subarray(0, 2)];
  let remaining = targetBytes - photograph.length;
  if (remaining < 4) throw new Error('The JPEG fixture is larger than the test target.');
  while (remaining > 0) {
    let size = Math.min(65537, remaining);
    if (remaining > size && remaining - size < 4) size -= 4 - (remaining - size);
    const segment = Buffer.alloc(size);
    segment.set([0xff, 0xfe]);
    segment.writeUInt16BE(size - 2, 2);
    segments.push(segment);
    remaining -= size;
  }
  segments.push(photograph.subarray(2));
  return `data:image/jpeg;base64,${Buffer.concat(segments).toString('base64')}`;
}

(async () => {
  listener = await new Promise(resolve => {
    const instance = server.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const url = `http://127.0.0.1:${listener.address().port}`;
  const api = bundle("export * from './src/api/events.js';", url);
  const initial = await api.loadEventData();
  test.equal(initial, seed, 'The app API loads all three supplied collections');
  const draft = {
    title: 'Verification workshop', description: 'Temporary event for persistence checks.',
    image: 'https://example.com/workshop.jpg', location: 'Test studio, Eindhoven',
    startTime: '2027-04-16T10:00:00.000Z', endTime: '2027-04-16T12:00:00.000Z',
    createdBy: seed.users[0].id, categoryIds: [seed.categories[0].id],
  };
  const saved = await api.createEventRecord(draft);
  test.check(saved.id !== undefined, 'POST returns a stable server-generated ID');
  test.equal({ ...saved, id: undefined }, { ...draft, id: undefined }, 'POST persists every supplied field');
  let disk = JSON.parse(fs.readFileSync(database, 'utf8'));
  test.equal(disk.events.at(-1), saved, 'POST persists on disk');
  test.equal((await api.loadEventData()).events.at(-1), saved, 'A fresh request reads the saved event');
  const edited = await api.updateEventRecord(saved.id, { title: 'Updated workshop', categoryIds: seed.categories.slice(0, 2).map(category => category.id) });
  test.equal(edited.title, 'Updated workshop', 'PATCH updates the title');
  test.equal(edited.description, draft.description, 'PATCH preserves untouched fields');
  test.equal(edited.categoryIds, seed.categories.slice(0, 2).map(category => category.id), 'PATCH saves multiple categories');
  disk = JSON.parse(fs.readFileSync(database, 'utf8'));
  test.equal(disk.events.at(-1), edited, 'PATCH persists on disk');
  await api.deleteEventRecord(saved.id);
  test.equal((await api.loadEventData()).events, seed.events, 'DELETE removes the event from the next read');
  test.equal(JSON.parse(fs.readFileSync(database, 'utf8')), seed, 'DELETE leaves original records intact');
  await test.rejects(() => api.updateEventRecord('missing-event', { title: 'Missing' }), /could not be found/, 'PATCH 404 is explained');
  await test.rejects(() => api.deleteEventRecord('missing-event'), /could not be found/, 'DELETE 404 is explained');

  const { isUploadedImage, MAX_STORED_IMAGE_BYTES } = bundle("export * from './src/utils/imageUpload.js';");
  const uploadedImage = largeJpegDataUrl(MAX_STORED_IMAGE_BYTES - 3);
  test.equal(isUploadedImage(uploadedImage), true, 'The near-limit JPEG fixture passes stored-image validation');
  test.check(Buffer.byteLength(uploadedImage) > 800 * 1024, 'The upload exercises an encoded body larger than 800 KiB');
  const uploadedEvent = await api.createEventRecord({ ...draft, image: uploadedImage });
  test.equal(uploadedEvent.image, uploadedImage, 'POST returns the complete near-limit uploaded image');
  test.equal(JSON.parse(fs.readFileSync(database, 'utf8')).events.at(-1).image, uploadedImage, 'Uploaded images persist to the JSON database');
  test.equal((await api.loadEventData()).events.at(-1).image, uploadedImage, 'A fresh GET restores the uploaded image');
  const replacementImage = largeJpegDataUrl(MAX_STORED_IMAGE_BYTES - 1024);
  const replaced = await api.updateEventRecord(uploadedEvent.id, { image: replacementImage, title: 'Workshop with a new photograph' });
  test.equal(replaced.image, replacementImage, 'PATCH replaces the uploaded image completely');
  test.equal(replaced.description, draft.description, 'Replacing an upload preserves unrelated event fields');
  test.equal(JSON.parse(fs.readFileSync(database, 'utf8')).events.at(-1).image, replacementImage, 'The replacement image persists on disk');
  test.equal((await api.loadEventData()).events.at(-1).image, replacementImage, 'A reload keeps the replacement uploaded image');
  await api.deleteEventRecord(uploadedEvent.id);
  test.equal(JSON.parse(fs.readFileSync(database, 'utf8')), seed, 'Removing the upload test event restores the original records');

  const fake = bundle("export * from './src/api/events.js';");
  global.fetch = async () => { throw new TypeError('Network failure'); };
  await test.rejects(() => fake.loadEventData(), /service is unavailable/, 'Network errors receive readable feedback');
  const abort = new Error('Aborted');
  abort.name = 'AbortError';
  global.fetch = async () => { throw abort; };
  await test.rejects(() => fake.loadEventData(), error => error === abort, 'Cancellation remains distinguishable from failure');
  global.fetch = async () => ({ ok: false, status: 503 });
  await test.rejects(() => fake.createEventRecord(draft), /503/, 'Server failures reject saves');
  global.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Invalid JSON'); } });
  await test.rejects(() => fake.loadEventData(), /unreadable response/, 'Invalid JSON is handled');
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) });
  await test.rejects(() => fake.loadEventData(), /invalid events/, 'A malformed collection cannot enter state');
  global.fetch = async () => ({ ok: true, status: 201, json: async () => draft });
  await test.rejects(() => fake.createEventRecord(draft), /did not confirm/, 'A save without an ID cannot enter state');
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ...draft, id: 'wrong-event' }) });
  await test.rejects(() => fake.updateEventRecord('expected-event', draft), /did not confirm/, 'A response for the wrong event cannot overwrite state');
  global.fetch = async () => ({ ok: true, status: 201, json: async () => ({ id: 5, title: 'Incomplete' }) });
  await test.rejects(() => fake.createEventRecord(draft), /did not confirm/, 'Incomplete saved records are rejected');
  global.fetch = async (requestUrl, options) => {
    test.equal(requestUrl, '/api/events/id%2Fwith%20space', 'Path IDs are encoded');
    test.equal(options.method, 'DELETE');
    return { ok: true, status: 204, json: async () => { throw new Error('Should not parse a deletion body'); } };
  };
  await fake.deleteEventRecord('id/with space');
  test.equal(fs.readFileSync(source, 'utf8'), original, 'All checks preserve the project seed');
  console.log(`PASS API: ${test.count} assertions against a disposable JSON Server plus error cases.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  global.fetch = originalFetch;
  if (listener) await new Promise(resolve => listener.close(resolve));
  fs.rmSync(temporary, { recursive: true, force: true });
});
