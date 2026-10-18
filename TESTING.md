# Verification report

Date: 18 October 2026.

The automated checks run against the project's own installed dependencies. API integration tests use a disposable JSON Server and a temporary database; they do not alter the supplied demonstration events.

## Verified

867 assertions passed: 65 Context checks, 140 form checks, 139 page/interaction checks, 358 source/content/edit-metadata checks, 16 appearance checks, 15 image checks, 76 upload checks, 34 API checks, and 24 profiling checks.

- `npm ci`: dependency lock installs successfully.
- `npm run lint`: no source errors or warnings.
- `npm test`: Context, real React/Chakra components, routing, forms, and user flows pass in jsdom.
- `npm run test:api`: real JSON Server CRUD and disk persistence pass.
- `npm run test:profile`: React Profiler records the actual events page during mounting, loading 12 events, searching, and combining category filters. Visible outcomes and profiling data pass 24 checks. Timings are development-mode jsdom render measurements, not browser layout/paint/network measurements or a performance guarantee.
- `npm run build`: production build completes without chunk-size warnings.
- Independent source review found no blocking mismatch with the captured assignment rubric.
- Bundled JPEG and PNG files decode successfully; local image paths and seed relationships are checked.
- All 12 researched events have valid source links, image credits, published start/end times, Amsterdam timezone offsets, and dates overlapping the requested window. Seed and working database match.
- Rendered detail pages expose safe official source links, real image captions, schedule notes and age guidance. Editing dates clears stale schedule/admission notes; replacing an image clears its old attribution. Unchanged instants retain metadata even when the form normalises the timestamp representation.

The tests cover loading, failed reads, retry, stale responses, cancelled requests, numeric/string IDs, title-only search, multiple categories combined with search, empty states, event details, navigation, required fields, date ordering, URL validation, failed saves with preserved drafts, duplicate-submit guards, and confirmed/cancelled/failed deletion. Mutation feedback is checked through the actual notification components. No React or Router warnings were reported by these test runs.

The environment prints an npm configuration warning about its own `http-proxy` setting. This is not a browser warning or a setting included in the project.

The requirement recheck added native category-group validation and verified that selecting one category satisfies it, while removing the last selection restores it. An inverted-condition mutation made the focused regression test fail, as expected, and the correct condition was restored. A failed-create integration case also checks the real toast, retained draft, unchanged route/list, and retry.

The separate private online preview also passed lint, its production build, and 87 storage-adapter assertions. Those checks cover browser-local create/edit/delete persistence, uploaded-picture persistence and replacement, storage-quota feedback, resetting the 12-event collection, failure feedback, preserving earlier preview data under its previous storage key, and replacing the old seeded DDW image without losing edits, custom images or deletions. The preview is for trying the interface; the downloadable school project uses the tested JSON Server backend.

The computer-picture option has focused checks for required selection, previews, URL/upload draft switching, retaining an existing picture during editing, failed replacement and save recovery, duplicate submission, cancellation and stale selections. Utility checks exercise file type/signature/size validation, proportional resizing, JPEG compression, errors and cancellation. FileReader, image decoding and canvas encoding are mocked in these component/utility checks; actual browser rendering and decoding remain pending. The real JSON Server accepted and persisted a decodable near-limit JPEG data URL exceeding 800 KiB, then retained its replacement after a fresh GET. The database fixture is temporary.

The later white/gray/green palette update was checked numerically for contrast and rechecked with the existing component suite, lint and production builds. Primary white button labels measure 5.76:1 normally and 4.65:1 on the hover blend over white. These calculations do not replace visual checks of the final rendered interface.

A screenshot then exposed inherited Chakra light-mode values overriding the custom base tokens. The focused appearance regression failed against the original emitted light CSS; explicit `_light` values fix it. The focused checks cover emitted palettes, the Light/Dark toggle, saved preferences after remounting, migration of older preferences to Light, and independence from simulated operating-system appearance changes. The image regression checks full-width 16:9 card frames, positioned images, cover/contain treatments, loading placeholders, and broken/replaced-image recovery. All component groups passed after these fixes. These are CSS/DOM checks; the reported Safari/Chrome difference still needs a real-browser visual confirmation.

## Still requires a real browser

The supported browser preview was unavailable in the build environment. jsdom does not verify CSS rendering, image rendering, viewport overflow, or actual keyboard focus traps. These checks are therefore **pending**, not passed:

1. Run the app and backend using the README instructions.
2. Inspect the list, details, About page, and both dialogs at 320, 375, 768, 1024, and 1440px widths. Check for horizontal scrolling and clipped date inputs.
3. Use Tab, Shift+Tab, Enter, Space, and Escape. Confirm visible focus, dialog focus containment, and focus returning to the initiating button after closing.
4. Test Light and Dark modes visually, including labels, errors, toasts, and persistence after a refresh. Confirm operating-system appearance changes do not override the selected mode.
5. Inspect the browser console and network panel during a complete create/edit/delete cycle and a page refresh. Confirm no runtime warnings or failed local assets.
6. Stop the backend while editing. Confirm the save fails visibly and preserves the draft. Restart the backend and retry.
7. Open a detail URL directly, refresh it, and try browser Back and Forward. Confirm that event data persists and search state is retained when returning from a card.
8. Record the same search/filter interactions in React DevTools' Profiler. The automated profiling run does not replace this real-browser recording.
9. In Chrome and Safari, add a JPG, transparent PNG and WebP from the computer; inspect the preview, save, refresh, edit without replacing it, then replace it. Check portrait orientation, narrow-screen file controls, and an oversized/invalid file. Confirm cancelled selections do not alter the saved event.

A passing build or component suite does not establish that these visual checks passed. The project has not been submitted to the school.
