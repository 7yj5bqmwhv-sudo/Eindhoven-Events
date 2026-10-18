# Interface design

## Purpose

Help someone choose an Eindhoven event quickly, then find its time, venue and official listing. Preserve the assignment's complete create/edit/delete workflow. The main collection shows full descriptions and all required metadata.

## Direction

The interface applies Apple design principles through the existing Chakra UI system: native system typography, clear visual hierarchy, restrained colour, immediate press feedback, and consistent spacing. The reference is the event-photo and detail hierarchy shown in [Apple Invites](https://www.apple.com/newsroom/2025/02/introducing-apple-invites-a-new-app-that-brings-people-together/). The application uses its own branding, composition and real Eindhoven content.

- White panels, soft gray backgrounds and forest-green text in light mode; dark green-gray surfaces and pale text in dark mode.
- The colour direction follows [CatSkills Showcase](https://catskills-showcase.pages.dev/): white `#ffffff`, gray `#8a958c`, olive `#6d910a`, forest `#32573b`/`#223a28`, and pale green `#f1f4e2`/`#eaefd1`, inspected in the reference stylesheet on 18 October 2026. Olive identifies actions and selected categories. Existing `teal` token names remain aliases for the green palette so all components share one consistent accent.
- Small white button labels use a darker olive `#536f08` for contrast: 5.76:1 normally and 4.65:1 with Chakra's 90% hover background over white. Secondary gray text is darkened for readability. Exact reference colours remain in the forest text, pale green surfaces and focus ring.
- The navigation is sticky and translucent. Reduced-transparency and higher-contrast preferences use solid surfaces.
- A real featured event introduces the season. Photo captions identify the source and, where applicable, previous-edition imagery.
- Cards use date tiles, full descriptions, category names and explicit start/end times. Poster detail pages preserve the complete artwork.
- Card media uses a full-width 16:9 frame with an explicitly positioned image, so intrinsic photo dimensions cannot shrink its flex container. Loading placeholders use the same ratio. All card thumbnails fill the frame with cover sizing; posters use contain sizing on their detail pages.
- Both `_light` and `_dark` semantic values are explicit because Chakra merges the custom theme with its defaults. Appearance defaults to Light, with a saved Light/Dark choice independent of operating-system settings.
- Search and category filters sit beside the results they affect. Filters remain accessible checkboxes and combine with name search.
- Navigation wraps on narrow displays; cards use one, two or three columns. Dialogs scroll within the viewport.
- Press feedback is subtle and immediate. Reduced-motion preferences suppress transforms and shorten transitions. No decorative looping animation is used.

## Verification limits

Real React/Chakra component checks cover routing, state, feedback, source links and rendering semantics. Native browser rendering, viewport overflow, contrast over actual blurred surfaces, focus containment and touch interaction still require the manual checks in TESTING.md. No browser pass is claimed from jsdom or a successful build.
