const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const test = assertions();
const upload = bundle("export * from './src/utils/imageUpload.js';");
const form = bundle("export * from './src/utils/eventForm.js';");

function imageData(type, bytes = 48) {
  const data = Buffer.alloc(bytes, 0);
  if (type === 'image/jpeg') data.set([0xff, 0xd8, 0xff]);
  else if (type === 'image/png') data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  else if (type === 'image/webp') {
    data.write('RIFF', 0);
    data.writeUInt32LE(bytes - 8, 4);
    data.write('WEBP', 8);
  }
  return `data:${type};base64,${data.toString('base64')}`;
}

// Mock browser decoding and canvas boundaries; validation and compression
// decisions are executed by the application's actual upload helper.
let scenario;
let readers;
let images;
let encodings;
let drawings;
let fills;
function reset(options = {}) {
  scenario = { width: 3200, height: 1600, encodedBytes: [2048], ...options };
  readers = [];
  images = [];
  encodings = [];
  drawings = [];
  fills = [];
}
class MockTarget extends window.EventTarget {
  emit(type) {
    const event = new window.Event(type);
    this.dispatchEvent(event);
    this[`on${type}`]?.(event);
  }
}
class MockFileReader extends MockTarget {
  constructor() { super(); readers.push(this); this.readyState = 0; }
  readAsDataURL(file) {
    this.readyState = 1;
    this.file = file;
    if (scenario.holdRead) return;
    queueMicrotask(() => {
      if (this.aborted) return;
      this.readyState = 2;
      if (scenario.readError) { this.error = new Error('Unreadable file'); this.emit('error'); }
      else { this.result = scenario.source ?? imageData(file.type); this.emit('load'); }
    });
  }
  abort() { this.aborted = true; this.readyState = 2; this.emit('abort'); }
}
class MockImage extends MockTarget {
  constructor() { super(); images.push(this); }
  set src(value) {
    this.source = value;
    if (!value || scenario.holdDecode) return;
    queueMicrotask(() => {
      if (!this.source) return;
      this.naturalWidth = this.width = scenario.width;
      this.naturalHeight = this.height = scenario.height;
      this.emit(scenario.decodeError ? 'error' : 'load');
    });
  }
  get src() { return this.source; }
}
const originalCreateElement = document.createElement.bind(document);
const originalReader = global.FileReader;
const originalImage = global.Image;
global.FileReader = window.FileReader = MockFileReader;
global.Image = window.Image = MockImage;
document.createElement = function createElement(tag, ...args) {
  const element = originalCreateElement(tag, ...args);
  if (String(tag).toLowerCase() === 'canvas') {
    element.getContext = () => scenario.noContext ? null : {
      fillStyle: '',
      fillRect(...values) { fills.push({ color: this.fillStyle, values }); },
      drawImage(...values) { drawings.push({ width: element.width, height: element.height, values }); },
    };
    element.toDataURL = (type, quality) => {
      encodings.push({ type, quality, width: element.width, height: element.height });
      if (scenario.encodeError) throw new Error('Canvas encoding failed');
      const index = Math.min(encodings.length - 1, scenario.encodedBytes.length - 1);
      return scenario.encodedResult ?? imageData(type, scenario.encodedBytes[index]);
    };
  }
  return element;
};
const file = (type = 'image/jpeg', size = 200) => new File([new Uint8Array(size)], 'event-photo', { type });
const isAbort = error => error.name === 'AbortError';

(async () => {
  test.equal(upload.MAX_IMAGE_FILE_BYTES, 10 * 1024 * 1024, 'The original file limit is 10 MiB');
  test.equal(upload.MAX_STORED_IMAGE_BYTES, 600 * 1024, 'The stored image limit is 600 KiB');
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    test.equal(upload.isUploadedImage(imageData(type)), true, `${type} is a supported stored image`);
  }
  for (const value of [undefined, null, '', 12, 'https://example.com/image.jpg',
    'data:image/svg+xml;base64,PHN2Zy8+', 'data:text/html;base64,PHNjcmlwdD4=',
    'data:image/jpeg;base64,', 'data:image/jpeg;base64,!!!!',
    'data:image/jpeg;base64,/9j/A', 'data:image/jpeg;base64,=AAA',
    imageData('image/png').replace('image/png', 'image/jpeg'),
    `${imageData('image/jpeg')}\n`, 'data:image/jpeg;charset=utf-8;base64,/9j/AA==']) {
    test.equal(upload.isUploadedImage(value), false, 'Unsupported, malformed, or disguised data is rejected');
  }
  test.equal(upload.isUploadedImage(imageData('image/jpeg', upload.MAX_STORED_IMAGE_BYTES)), true, 'The decoded byte limit is inclusive');
  test.equal(upload.isUploadedImage(imageData('image/jpeg', upload.MAX_STORED_IMAGE_BYTES + 1)), false, 'The limit applies to decoded image bytes');

  reset();
  for (const candidate of [undefined, file('image/svg+xml'), file('text/plain'), file('image/gif'), file('image/jpeg', 0),
    file('image/jpeg', upload.MAX_IMAGE_FILE_BYTES + 1)]) {
    await test.rejects(() => upload.prepareImageUpload(candidate), Error, 'Invalid selections reject before decoding');
  }
  test.equal(readers.length, 0, 'Rejected selections do not allocate a file reader');

  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    reset();
    const prepared = await upload.prepareImageUpload(file(type));
    test.equal(readers.length, 1, 'Every selected image is read');
    test.equal(images.length, 1, 'Every selected image is decoded');
    test.check(prepared.startsWith('data:image/jpeg;base64,'), 'Every upload is re-encoded to JPEG');
    test.equal(upload.isUploadedImage(prepared), true, 'Prepared output passes stored-image validation');
    test.equal([drawings[0].width, drawings[0].height], [1600, 800], 'Oversized landscapes preserve aspect ratio within 1600 px');
    test.check(fills.some(fill => ['#fff', '#ffffff', 'white'].includes(fill.color.toLowerCase())), 'Transparent input receives a white background');
  }
  reset({ width: 400, height: 800 });
  await upload.prepareImageUpload(file());
  test.equal([drawings[0].width, drawings[0].height], [400, 800], 'Small images are not enlarged');
  reset({ width: 1600, height: 3200 });
  await upload.prepareImageUpload(file());
  test.equal([drawings[0].width, drawings[0].height], [800, 1600], 'Portrait images also fit within 1600 px');

  reset({ encodedBytes: [upload.MAX_STORED_IMAGE_BYTES + 100, 2048] });
  test.equal(upload.isUploadedImage(await upload.prepareImageUpload(file())), true, 'Oversized encoding is reduced to a valid stored image');
  test.check(encodings.length > 1, 'Compression retries when the first output exceeds the limit');
  test.check(encodings[1].quality < encodings[0].quality
    || encodings[1].width < encodings[0].width, 'The retry reduces quality or dimensions');
  reset({ encodedBytes: [upload.MAX_STORED_IMAGE_BYTES + 100] });
  await test.rejects(() => upload.prepareImageUpload(file()), Error, 'An image that cannot fit is rejected');
  test.check(encodings.length < 100, 'Compression failure terminates in a bounded number of attempts');
  test.check(encodings.some(item => item.width < 1600), 'Persistent oversize eventually reduces dimensions');

  for (const options of [{ readError: true }, { decodeError: true }, { noContext: true }, { width: 0 },
    { source: imageData('image/png') }, { source: 'data:image/jpeg;base64,not-valid' },
    { encodedResult: 'data:,' }, { encodeError: true }]) {
    reset(options);
    await test.rejects(() => upload.prepareImageUpload(file()), Error, 'Read, decode, format, or encoding failures are reported');
  }
  reset();
  const stopped = new AbortController();
  stopped.abort();
  await test.rejects(() => upload.prepareImageUpload(file(), { signal: stopped.signal }), isAbort, 'An already cancelled selection rejects');
  test.equal(readers.length, 0, 'Cancelled selections do not read the file');
  reset({ holdRead: true });
  const reading = new AbortController();
  const readOperation = upload.prepareImageUpload(file(), { signal: reading.signal });
  reading.abort();
  await test.rejects(() => readOperation, isAbort, 'Cancelling during reading rejects as an abort');
  test.equal(readers[0].aborted, true, 'Cancelling releases the active file reader');
  reset({ holdDecode: true });
  const decoding = new AbortController();
  const decodeOperation = upload.prepareImageUpload(file(), { signal: decoding.signal });
  await new Promise(resolve => setImmediate(resolve));
  decoding.abort();
  await test.rejects(() => decodeOperation, isAbort, 'Cancelling during image decoding rejects as an abort');
  test.equal(encodings.length, 0, 'A cancelled decode never reaches canvas encoding');

  const categories = [{ id: 1, name: 'Social' }];
  const users = [{ id: 1, name: 'Host' }];
  const values = { title: 'Community walk', description: 'A relaxed walk.', image: imageData('image/jpeg'),
    location: 'Eindhoven', startTime: '2027-08-01T10:00', endTime: '2027-08-01T12:00', createdBy: '1', categoryIds: ['1'] };
  test.equal(form.validateEventForm(values, categories, users), {}, 'A prepared uploaded image is accepted by event validation');
  test.equal(form.buildEventPayload(values, categories, users).image, values.image, 'Event payload keeps the upload data intact');
  test.equal(form.createEventDraft({ ...values, id: 4 }).image, values.image, 'Editing retains an uploaded image');
  test.equal(form.validateEventForm({ ...values, image: 'https://example.com/photo.jpg' }, categories, users), {}, 'Existing URL image input still works');
  test.check(form.validateEventForm({ ...values, image: 'data:image/svg+xml;base64,PHN2Zy8+' }, categories, users).image, 'Active formats cannot bypass form validation');
  test.check(form.validateEventForm({ ...values, image: imageData('image/jpeg', upload.MAX_STORED_IMAGE_BYTES + 1) }, categories, users).image, 'Oversized stored images cannot bypass form validation');
  test.equal(environment.consoleIssues, [], 'Upload checks emit no console warnings');
  test.equal(environment.domIssues, [], 'Upload checks emit no unexpected DOM errors');
  console.log(`PASS uploads: ${test.count} file validation, compression, cancellation, and event-payload assertions. Browser decoding and canvas boundaries are mocked.`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }).finally(() => {
  document.createElement = originalCreateElement;
  global.FileReader = originalReader;
  global.Image = originalImage;
  environment.close();
});
