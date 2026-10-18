# Module 09 requirement map

Checked against the Winc Academy React Events App Project page on 18 October 2026.

| Requirement                                                   | Implementation                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Context and Context.Provider for events and categories        | `src/context/EventsProvider.jsx` and `EventsContext.js`                                                                                          |
| React Router with list, details, and a third page             | `/`, `/event/:eventId`, `/about` in `src/main.jsx`                                                                                               |
| Design system                                                 | Chakra UI v3 with custom semantic theme                                                                                                          |
| All events retrieved from JSON Server                         | `loadEventData` retrieves `/events`, `/categories`, and `/users`                                                                                 |
| List title, description, image, start/end, category names     | `EventCard.jsx` and `display.js`                                                                                                                 |
| Click event to view details                                   | Router links in `EventCard.jsx`                                                                                                                  |
| Header Add Event action opens a form modal                    | `Navigation.jsx`, `Root.jsx`, `EventFormDialog.jsx`                                                                                              |
| Persist new events to backend                                 | POST `/events`                                                                                                                                   |
| Search by event name                                          | `EventsPage.jsx`, case-insensitive title matching                                                                                                |
| Filter by selected categories, combined with search           | Multiple checkbox selections, OR between categories and AND with search                                                                          |
| Detail title, description, image, location, times, categories | `EventPage.jsx`                                                                                                                                  |
| Edit modal and server update                                  | `EventFormDialog.jsx`, PATCH `/events/:id`                                                                                                       |
| Delete confirmation and redirect to list                      | `DeleteEventDialog.jsx`, DELETE `/events/:id`, route navigation                                                                                  |
| Success and failure message for every mutation                | Chakra toasts plus preserved inline form errors                                                                                                  |
| Required fields                                               | Native required on text/date/select controls; category checkboxes are required while the group is empty, with at least one category validated before saving |
| Loading skeleton placeholders                                 | `LoadingEvents.jsx`                                                                                                                              |
| Responsive and accessible                                     | Chakra breakpoints, wrapping navigation, labeled forms, keyboard-capable dialogs, visible focus styles; real-browser verification still required |

The course allows a custom theme and data examples. The project retains the original required schema with 12 researched Eindhoven event listings, plus optional source and image-credit metadata. The original course data is included unchanged for reference. See SOURCES.md for date evidence and ASSETS.md for imagery.

The optional light/dark feature is implemented, including a device mode. Search controls are not a submission form, so they remain optional. Category selection requires one or more choices; requiring every checkbox would incorrectly force every category to be selected.

An event picture is required and can be supplied by URL or from the computer. Only the active source is required. A valid existing uploaded picture satisfies the requirement during editing, so choosing a replacement is optional. Prepared image data is persisted in the same backend `image` field.

## Learning concepts

| Concept | Evidence |
| --- | --- |
| Error boundaries and debugging | `AppErrorBoundary` in `src/main.jsx`; request failure/retry handling and repeatable error-path checks |
| Profiling | `verification/profile.cjs` uses React Profiler on actual event-page interactions; development jsdom measurements, with browser recording still pending |
| Component composition | Shared event cards, image fallbacks, add/edit form, deletion dialog, and loading components |
| Context and state management | `EventsProvider` shares server data and mutation operations |
| Hooks | Custom `useEvents` plus React state/effect/ref/callback hooks and Router hooks |
| API, routing, forms, skeletons, modals | Mapped in the requirements table above |

Separate form and state-management libraries are optional according to the assignment's explicit general instructions. This app uses React Context and controlled forms.
