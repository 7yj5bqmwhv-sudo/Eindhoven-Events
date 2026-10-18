# Eindhoven Together

An event management app for the Winc Academy React Advanced project. Discover real Eindhoven events, search by name, combine category filters, and manage your copy of the event details.

The starting collection contains 12 official event listings researched on 18 October 2026, covering the rest of October through 31 December, including the ongoing Dutch Design Week. New Year’s Eve continues into 1 January. Every listing links to its official source. This is a curated snapshot, not a live calendar or booking service; check the organiser for current details. See `SOURCES.md` and `ASSETS.md` for research and image credits.

## Run the project

Use Node.js 22.12 or newer (Node 22 LTS is recommended).

Download this repository with **Code → Download ZIP**, or clone it:

```bash
git clone https://github.com/7yj5bqmwhv-sudo/Eindhoven-Events.git
cd Eindhoven-Events
```

```bash
npm ci
```

Start the JSON Server backend in one terminal:

```bash
npm run api
```

Then, from the same project folder in a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173. Keep both terminals running. Vite sends `/api` requests to JSON Server at http://127.0.0.1:3000. The backend saves changes directly in `events.json`, so events survive a page refresh and a server restart.

For a production build served locally:

```bash
npm run build
npm run preview
```

Keep `npm run api` running while using the preview. Hosting the built frontend by itself is not enough for saving events; a reachable backend is also required. `.env.example` documents the optional `VITE_API_URL` setting.

## What you can do

- Browse every event, including its description, photo, category names, and start/end times.
- Search event names without worrying about capitalisation or surrounding spaces.
- Select multiple categories. An event matches any selected category, and the name search still applies.
- Open a detail page or the About page with React Router.
- Create and edit events in a modal. All event fields are required; choose at least one category.
- Add a picture using an image URL or **Upload from computer**. JPG, PNG and WebP files up to 10 MB are accepted; a preview appears before saving. Existing uploaded pictures can be kept when editing.
- Delete an event after an explicit confirmation.
- See loading skeletons, clear empty states, request errors, and success/failure notifications.
- Choose Light or Dark appearance. Light is the default; your choice is saved.

Dates are entered and displayed in the device's local time zone and sent to the API as ISO timestamps. The end must be later than the start. Submitted text is trimmed. A failed save keeps the dialog and draft open; the displayed event changes only after the server confirms the request.

Uploaded pictures are resized to at most 1600 pixels on the longest edge and compressed to at most 600 KiB. They are saved as JPEG data URLs in the existing `image` field in `events.json`, so they remain after refreshing or restarting the backend. Transparent backgrounds become white. Choosing a file prepares it locally; it is only sent to the backend when the event is saved. Image preparation blocks saving until it finishes, and cancelling or changing picture source discards unfinished work.

## Project structure

| File or folder                         | Responsibility                                                         |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `src/main.jsx`                         | Providers, error boundary, and three application routes                |
| `src/context/`                         | Shared events, categories, users, loading, errors, and CRUD operations |
| `src/api/events.js`                    | GET, POST, PATCH, and DELETE requests and response checks              |
| `src/pages/`                           | Event list, event details, About, and missing-page screen              |
| `src/components/EventFormDialog.jsx`   | Shared add/edit form and validation feedback                           |
| `src/components/DeleteEventDialog.jsx` | Explicit deletion confirmation                                         |
| `src/utils/eventForm.js`               | Draft values, validation, and API payload conversion                   |
| `src/utils/imageUpload.js`             | File checks, image preparation and saved-picture validation            |
| `src/utils/display.js`                 | Date formatting, category names, and combined filtering                |
| `src/theme.js`                         | Chakra theme and light/dark tokens                                     |
| `events.json`                          | Working JSON Server database                                           |
| `data/events.seed.json`                | Starting copy of the researched event collection                            |
| `reference/events.original.json`       | Original course dataset for comparison                                 |
| `verification/`                        | Repeatable component and API checks                                    |

`EventsProvider` uses `Context.Provider` to share the data. Mutations update Context only after a successful response. Reads use cancellation and a revision counter to prevent an old request from replacing newer data.

The code accepts numeric or string IDs. If an imported event refers to a missing organiser, the page displays a community organiser fallback. If a photo cannot load, a readable fallback replaces it.

## Check the project

```bash
npm run lint
npm test
npm run test:api
npm run test:profile
npm run build
```

The API tests use a temporary database and port, leaving `events.json` unchanged. See `TESTING.md` for the results and remaining real-browser checks. See `REQUIREMENTS.md` for the assignment mapping, `DESIGN.md` for interface decisions, and `ASSETS.md` for image sources.

## Debugging and profiling

`AppErrorBoundary` displays a recovery screen if a child component throws during rendering. API failures are handled separately with retry controls and mutation error notifications.

`npm run test:profile` wraps the real events page in React's `Profiler` and reports render durations while loading 12 events, searching, and selecting multiple categories. It also verifies the visible results after each action. These development-mode jsdom measurements exclude browser layout, paint, and network time, so they are evidence of React render profiling, not a browser performance benchmark.

For a browser recording, run the app and JSON Server, open React DevTools' Profiler, start recording, search and change the category filters, then stop. Inspect the commit chart and component render durations. Record the browser, viewport, actions, and observed slow components before deciding whether an optimisation is needed. This browser recording is still pending.

To restore the researched event collection, stop JSON Server, back up your current `events.json`, and replace it with a copy of `data/events.seed.json`.
