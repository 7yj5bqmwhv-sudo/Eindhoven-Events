const { bundle, assertions, setupDOM } = require('./support.cjs');
const environment = setupDOM();
const React = require('react');
const { createRoot } = require('react-dom/client');
const { EventFormDialog, DeleteEventDialog, Provider, ...helpers } = bundle(`
  export { EventFormDialog } from './src/components/EventFormDialog.jsx';
  export { DeleteEventDialog } from './src/components/DeleteEventDialog.jsx';
  export { Provider } from './src/components/ui/provider.jsx';
  export * from './src/utils/eventForm.js';
`);
const test = assertions();
const categories = [{ id: 1, name: 'Music' }, { id: 'design', name: 'Design' }];
const users = [{ id: 5, name: 'Yurii' }, { id: 'host', name: 'Eindhoven collective' }];
const valid = {
  title: '  Summer music  ', description: '  A live performance.  ',
  image: ' https://example.com/music.jpg ', location: '  Eindhoven  ',
  startTime: '2027-06-12T19:00', endTime: '2027-06-12T22:00',
  createdBy: '5', categoryIds: ['1', 'design', '1'],
};
const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 35)); });
const query = selector => document.querySelector(selector);
const button = text => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === text);
const openForm = () => query('[role="dialog"][data-state="open"]');
const openDelete = () => query('[role="alertdialog"][data-state="open"]');
const click = async node => {
  test.check(node, 'Expected control');
  await React.act(async () => node.click());
  await tick();
};
const setField = async (name, value) => {
  const input = query(`[name="${name}"]`);
  test.check(input, `Expected ${name} field`);
  await React.act(async () => {
    const prototype = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype
      : input.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
};
const submit = async () => {
  test.check(query('form'), 'Expected form');
  await React.act(async () => query('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await tick();
};
const submissions = [];
let deletions = 0;
let resolveSave;
let rejectSave;
let resolveDelete;
let rejectDelete;
let root;
let sequence = 0;
function FormHarness({ event }) {
  const [open, setOpen] = React.useState(true);
  return React.createElement(EventFormDialog, { open, onOpenChange: details => setOpen(details.open), event, categories, users,
    onSubmit: payload => { submissions.push(payload); return new Promise((resolve, reject) => { resolveSave = resolve; rejectSave = reject; }); },
  });
}
function DeleteHarness() {
  const [open, setOpen] = React.useState(true);
  return React.createElement(DeleteEventDialog, { open, onOpenChange: details => setOpen(details.open), event: { title: 'Summer music' },
    onConfirm: () => { deletions += 1; return new Promise((resolve, reject) => { resolveDelete = resolve; rejectDelete = reject; }); },
  });
}
const render = async (Component, props = {}) => {
  await React.act(async () => root.render(React.createElement(Provider, null, React.createElement(Component, { ...props, key: ++sequence }))));
  await tick();
};

// Browser decoding/encoding is simulated; the real upload utility and form run unchanged.
const pngSource = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxioAAAAASUVORK5CYII=';
const encodedPhoto = label => 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('mock canvas output: ' + label)]).toString('base64');
const photoA = encodedPhoto('first picture');
const photoB = encodedPhoto('second picture');
const readers = [];
const decodedImages = [];
let canvasOutput = photoA;
const originalReader = Object.getOwnPropertyDescriptor(globalThis, 'FileReader');
const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
const originalContext = window.HTMLCanvasElement.prototype.getContext;
const originalToDataURL = window.HTMLCanvasElement.prototype.toDataURL;
class ControlledReader {
  readAsDataURL(file) { this.file = file; readers.push(this); }
  abort() { this.aborted = true; this.onabort?.(); }
  complete() { this.result = pngSource; this.onload?.(); }
}
class ControlledImage {
  constructor() { decodedImages.push(this); }
  set src(value) { this.source = value; }
  get src() { return this.source; }
  complete() { this.naturalWidth = 1200; this.naturalHeight = 800; this.onload?.(); }
}
Object.defineProperty(globalThis, 'FileReader', { value: ControlledReader, configurable: true });
Object.defineProperty(globalThis, 'Image', { value: ControlledImage, configurable: true });
window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, drawImage() {} });
window.HTMLCanvasElement.prototype.toDataURL = () => canvasOutput;
const selectFile = async (type = 'image/png') => {
  const input = query('input[type="file"]');
  test.check(input, 'Upload mode has a native file control');
  const file = new File([Buffer.from(pngSource.split(',')[1], 'base64')], 'event-picture.png', { type });
  await React.act(async () => {
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await tick();
  return readers.at(-1);
};
const finishFile = async (reader, output = photoA) => {
  await React.act(async () => reader.complete());
  await tick();
  canvasOutput = output;
  await React.act(async () => decodedImages.at(-1).complete());
  await tick();
};
const preview = () => query('img[alt="Selected event picture preview"]');

(async () => {
  test.equal(helpers.validateEventForm(valid, categories, users), {}, 'A complete form validates');
  test.equal(Object.keys(helpers.validateEventForm({}, categories, users)).sort(), ['title', 'description', 'image', 'location', 'startTime', 'endTime', 'createdBy', 'categoryIds'].sort(), 'All eight fields are required');
  for (const field of ['title', 'description', 'location']) {
    test.check(helpers.validateEventForm({ ...valid, [field]: '   ' }, categories, users)[field], `${field} rejects whitespace`);
  }
  for (const image of ['example.com/image.jpg', 'javascript:alert(1)', 'data:image/png;base64,abc', 'file:///photo.jpg']) {
    test.check(helpers.validateEventForm({ ...valid, image }, categories, users).image, 'Unsafe or incomplete image URLs are rejected');
  }
  for (const startTime of ['not-a-date', '2027-02-30T10:00', '2027-15-01T10:00']) {
    test.check(helpers.validateEventForm({ ...valid, startTime }, categories, users).startTime, 'Impossible date is rejected');
  }
  for (const endTime of [valid.startTime, '2027-06-11T22:00']) {
    test.check(helpers.validateEventForm({ ...valid, endTime }, categories, users).endTime, 'End must follow start');
  }
  test.check(helpers.validateEventForm({ ...valid, createdBy: 'unknown' }, categories, users).createdBy, 'Unknown organiser is rejected');
  for (const categoryIds of [[], ['unknown'], ['1', 'unknown']]) {
    test.check(helpers.validateEventForm({ ...valid, categoryIds }, categories, users).categoryIds, 'A valid category selection is required');
  }
  const payload = helpers.buildEventPayload(valid, categories, users);
  test.equal(payload.title, 'Summer music', 'Titles are trimmed');
  test.equal(payload.description, 'A live performance.');
  test.equal(payload.image, 'https://example.com/music.jpg');
  test.equal(payload.location, 'Eindhoven');
  test.equal(payload.createdBy, 5, 'Numeric organiser IDs retain their type');
  test.equal(payload.categoryIds, [1, 'design'], 'Mixed ID types are restored and duplicate categories are removed');
  test.equal(payload.startTime, new Date(valid.startTime).toISOString(), 'Local date is saved as an unambiguous ISO timestamp');
  test.equal(helpers.toLocalInput(payload.startTime), valid.startTime, 'A saved date round-trips in the device timezone');
  test.equal(helpers.toLocalInput('invalid'), '', 'Invalid existing dates do not crash editing');
  test.equal(helpers.createEventDraft({ ...payload, id: 1 }).categoryIds, ['1', 'design'], 'Existing categories initialise correctly');
  test.throws(() => helpers.buildEventPayload({}, categories, users), /highlighted/, 'Invalid forms cannot build a submission');

  root = createRoot(document.getElementById('root'));
  await render(FormHarness);
  test.check(openForm(), 'Creation uses a real Chakra dialog');
  test.equal(query('[name="title"]').value, '', 'New form starts empty');
  const categoryInputs = () => [...document.querySelectorAll('input[name="categoryIds"]')];
  test.check(categoryInputs().every(input => input.required && !input.checkValidity()), 'Empty category group has native required validation');
  await click(query('input[name="categoryIds"][value="1"]'));
  test.check(categoryInputs().every(input => input.checkValidity()), 'One category satisfies the native group requirement');
  await click(query('input[name="categoryIds"][value="1"]'));
  test.check(categoryInputs().every(input => input.required && !input.checkValidity()), 'Removing the last category restores native required validation');
  await submit();
  test.equal(submissions.length, 0, 'Invalid form never invokes save');
  test.equal(query('[name="title"]').getAttribute('aria-invalid'), 'true', 'Required error is associated with its field');
  test.equal(document.activeElement, query('[name="title"]'), 'Validation focuses the first invalid field');
  for (const [name, value] of Object.entries(valid)) {
    if (name !== 'categoryIds') await setField(name, value);
  }
  await click(query('input[name="categoryIds"][value="1"]'));
  await submit();
  test.equal(submissions.length, 1, 'Valid form submits once');
  test.equal(submissions[0], { ...payload, categoryIds: [1] }, 'The form submits the normalised payload');
  test.equal(query('button[type="submit"]').disabled, true, 'Save is disabled while the request is pending');
  test.equal(button('Cancel').disabled, true, 'Pending save cannot be abandoned accidentally');
  await submit();
  test.equal(submissions.length, 1, 'Repeated submit during a request is ignored');
  await React.act(async () => rejectSave(new Error('Temporary save failure')));
  await tick();
  test.check(openForm(), 'Rejected save retains the dialog');
  test.check(query('[role="alert"]').textContent.includes('Temporary save failure'), 'Save error is readable');
  test.equal(query('[name="title"]').value, valid.title, 'Rejected save retains the draft');
  test.equal(query('button[type="submit"]').disabled, false, 'Save is available for retry');
  await submit();
  test.equal(submissions.length, 2, 'Save can be retried');
  await React.act(async () => resolveSave({ ...payload, id: 9 }));
  await tick();
  test.equal(openForm(), null, 'Successful save closes the dialog');

  await render(FormHarness, { event: { ...payload, id: 9 } });
  test.equal(query('[name="title"]').value, payload.title, 'Editing loads the event title');
  test.equal(query('[name="startTime"]').value, valid.startTime, 'Editing uses local date and time');
  test.equal(query('[name="createdBy"]').value, '5');
  test.equal(query('input[value="design"]').checked, true, 'Editing retains selected categories');
  await click(button('Cancel'));
  test.equal(openForm(), null, 'Cancel closes edit');
  test.equal(submissions.length, 2, 'Cancelling edit makes no request');

  await render(FormHarness, { event: { ...payload, image: photoA, id: 10 } });
  test.equal(button('Upload from computer').getAttribute('aria-pressed'), 'true', 'An existing uploaded picture opens upload mode');
  test.equal(query('input[type="file"]').required, false, 'Editing a saved picture does not require selecting it again');
  test.equal(query('input[type="file"]').checkValidity(), true, 'A retained picture satisfies native file validation');
  test.equal(preview().getAttribute('src'), photoA, 'The saved upload has a preview');
  test.equal(query('input[type="url"]'), null, 'An uploaded data URL is never shown in the URL field');
  await submit();
  test.equal(submissions.at(-1).image, photoA, 'Editing without replacement preserves the uploaded picture');
  await React.act(async () => rejectSave(new Error('Upload save failed')));
  await tick();
  test.equal(preview().getAttribute('src'), photoA, 'A rejected save keeps the uploaded picture preview');
  await click(button('Cancel'));

  await render(FormHarness, { event: { ...payload, id: 11 } });
  const draftUrl = 'https://example.com/new-event.jpg';
  await setField('image', draftUrl);
  await click(button('Upload from computer'));
  test.equal(query('input[type="file"]').required, true, 'Empty upload mode requires a file');
  test.equal(query('input[type="file"]').checkValidity(), false, 'Empty upload fails native required validation');
  const beforeUpload = submissions.length;
  await submit();
  test.equal(submissions.length, beforeUpload, 'Empty upload cannot submit an inactive URL draft');
  test.equal(document.activeElement, query('input[type="file"]'), 'Missing upload focuses the file input');
  const uploadReader = await selectFile();
  test.equal(query('button[type="submit"]').disabled, true, 'Picture processing disables save');
  test.check(query('[role="status"]').textContent.includes('Preparing'), 'Picture processing has readable status');
  await submit();
  test.equal(submissions.length, beforeUpload, 'Programmatic submit is guarded during processing');
  await finishFile(uploadReader);
  test.equal(preview().getAttribute('src'), photoA, 'Successful file processing shows the prepared image');
  test.equal(query('button[type="submit"]').disabled, false, 'Save is restored after processing');
  test.equal(query('input[type="file"]').required, false, 'A prepared image makes replacement optional');
  await click(button('Image URL'));
  test.equal(query('input[type="url"]').value, draftUrl, 'Switching back restores the URL draft');
  await click(button('Upload from computer'));
  test.equal(preview().getAttribute('src'), photoA, 'Switching back restores the uploaded draft');
  await selectFile('text/plain');
  test.check(openForm().textContent.includes('Your previous picture has been kept'), 'Failed replacement explains the retained picture');
  test.equal(preview().getAttribute('src'), photoA, 'Failed replacement does not discard the accepted photo');
  const replacement = await selectFile();
  await finishFile(replacement, photoB);
  test.equal(preview().getAttribute('src'), photoB, 'A valid replacement updates the preview');
  test.check(!openForm().textContent.includes('Your previous picture has been kept'), 'Successful replacement clears the previous file error');
  await submit();
  test.equal(submissions.at(-1).image, photoB, 'The active upload, not the inactive URL, is submitted');
  await React.act(async () => rejectSave(new Error('Connection interrupted')));
  await tick();
  test.equal(preview().getAttribute('src'), photoB, 'A newly selected image survives an API failure');
  await submit();
  test.equal(submissions.at(-1).image, photoB, 'Retry includes the same uploaded picture');
  await React.act(async () => resolveSave({ id: 11 }));
  await tick();

  await render(FormHarness, { event: { ...payload, id: 12 } });
  await click(button('Upload from computer'));
  const firstSelection = await selectFile();
  const lateFirstRead = firstSelection.onload;
  const newestSelection = await selectFile();
  test.equal(firstSelection.aborted, true, 'A new file selection aborts the previous read');
  await finishFile(newestSelection, photoB);
  await React.act(async () => { firstSelection.result = pngSource; lateFirstRead(); });
  await tick();
  test.equal(preview().getAttribute('src'), photoB, 'A late first-file completion cannot overwrite the latest picture');
  const switchedSelection = await selectFile();
  const lateSwitchedRead = switchedSelection.onload;
  await click(button('Image URL'));
  test.equal(switchedSelection.aborted, true, 'Switching image source aborts an in-progress file read');
  await React.act(async () => { switchedSelection.result = pngSource; lateSwitchedRead(); });
  await tick();
  test.equal(query('input[type="url"]').value, payload.image, 'A cancelled file completion cannot overwrite the selected URL');
  test.equal(query('button[type="submit"]').disabled, false, 'Switching source releases the processing lock');
  await click(button('Upload from computer'));
  test.equal(preview().getAttribute('src'), photoB, 'Last accepted upload survives a cancelled replacement');
  const cancelledSelection = await selectFile();
  const lateCancelledRead = cancelledSelection.onload;
  const savesBeforeCancel = submissions.length;
  await click(button('Cancel'));
  test.equal(cancelledSelection.aborted, true, 'Closing the dialog aborts picture processing');
  await React.act(async () => { cancelledSelection.result = pngSource; lateCancelledRead(); });
  await tick();
  test.equal(openForm(), null, 'Late file completion cannot reopen the cancelled dialog');
  test.equal(submissions.length, savesBeforeCancel, 'Cancelling picture processing never submits the event');

  await render(DeleteHarness);
  test.check(openDelete(), 'Deletion requires an alert dialog');
  test.check(openDelete().textContent.includes('Summer music'), 'Confirmation identifies the target event');
  await click(button('Keep event'));
  test.equal(deletions, 0, 'Cancelled deletion never invokes the API');
  test.equal(openDelete(), null);
  await render(DeleteHarness);
  await click(button('Delete event'));
  test.equal(deletions, 1, 'Confirmation invokes one deletion');
  test.equal(button('Keep event').disabled, true, 'Pending deletion disables cancellation');
  await React.act(async () => rejectDelete(new Error('Temporary deletion failure')));
  await tick();
  test.check(openDelete(), 'Failed delete keeps confirmation open');
  test.check(query('[role="alert"]').textContent.includes('Temporary deletion failure'));
  await click(button('Delete event'));
  test.equal(deletions, 2, 'Failed delete can be retried');
  await React.act(async () => resolveDelete());
  await tick();
  test.equal(openDelete(), null, 'Successful delete closes confirmation');
  await React.act(async () => root.unmount());
  root = null;
  await tick();
  test.equal(environment.consoleIssues, [], 'No React warnings or errors during form interactions');
  test.equal(environment.domIssues, [], 'No unexpected jsdom errors');
  console.log(`PASS forms: ${test.count} validation and real Chakra component assertions. CSS @layer parsing limitations: ${environment.cssLimitations}.`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }).finally(async () => {
  if (root) await React.act(async () => root.unmount());
  if (originalReader) Object.defineProperty(globalThis, 'FileReader', originalReader); else delete globalThis.FileReader;
  if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage); else delete globalThis.Image;
  window.HTMLCanvasElement.prototype.getContext = originalContext;
  window.HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
  environment.close();
});
