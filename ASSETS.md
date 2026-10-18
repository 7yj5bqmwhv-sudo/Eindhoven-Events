# Image sources and credits

The active collection uses real organiser-published photographs and promotional artwork, plus the Dutch Design Week poster supplied by the project owner. They are bundled locally for reliable loading. Organiser images retain their source URLs; the supplied poster uses its repository image URL, mapped to the bundled copy for reliable local loading. No synthetic event imagery is used. Sources were checked on 18 October 2026.

Credit does not grant an open licence. Image rights remain with the photographer, artist or organiser. The source pages do not establish general redistribution rights unless explicitly stated below. GLOW’s press page expressly requires the named photographer credit, which appears alongside the photograph in the app.

| Event | Local file | Credit | Official image source |
| --- | --- | --- | --- |
| Dutch Design Week: Design meets Industry | `public/images/events/ddw-2026-poster.png` | Dutch Design Week promotional artwork; designer not identified in supplied image | Poster supplied by project owner on 18 October 2026 |
| Overleven In De Jungle | `public/images/events/event-102.png` | Wildebras / Parktheater Eindhoven promotional image; photographer not listed | [Source](https://www.parktheater.nl/programma/overleven-in-de-jungle-j5h2) |
| Alice in Wonderland | `public/images/events/event-103.jpg` | Jan Hoek in collaboration with ITA / De Toneelmakerij & DOX, via Parktheater Eindhoven | [Source](https://www.parktheater.nl/programma/alice-in-wonderland-fphp) |
| K-POP Night: Halloween edition | `public/images/events/event-104.png` | Promotional artwork via Effenaar / K-POP Night | [Source](https://www.effenaar.nl/agenda/k-pop-night-halloween) |
| GLOW Eindhoven: CONNECT | `public/images/events/glow-eindhoven-2026.jpg` | Bart van Overbeeke / GLOW Eindhoven | [Source](https://gloweindhoven.nl/en/press-information-2/) |
| VroegZat | `public/images/events/event-106.png` | Promotional artwork via Effenaar / VroegZat | [Source](https://www.effenaar.nl/agenda/vroegzat-13nov) |
| PIÑA | `public/images/events/event-107.png` | Promotional artwork via Effenaar / PIÑA | [Source](https://www.effenaar.nl/agenda/pina-14nov) |
| Fan van Sinterklaas | `public/images/events/event-108.jpg` | Hippe Gasten / Parktheater Eindhoven promotional image; photographer not listed | [Source](https://www.parktheater.nl/programma/fan-van-sinterklaas-dhqw) |
| Controle | `public/images/events/event-109.jpg` | Neeltje de Vries / 155 & Maas theater en dans, via Parktheater Eindhoven | [Source](https://www.parktheater.nl/programma/controle-54qs) |
| Winter Market Eindhoven | `public/images/events/winter-market-eindhoven-2026.jpg` | Winter Market Eindhoven | [Source](https://wintermarketeindhoven.nl/) |
| Oudejaarsconference 2026: KLEM | `public/images/events/event-111.jpg` | Gerrie Smits / Parktheater Eindhoven promotional image; photographer not listed | [Source](https://www.parktheater.nl/programma/oudejaarsconference-2026-klem-tkrd) |
| Effenaar Oud & Nieuw 2026 | `public/images/events/event-112.jpg` | Promotional artwork via Effenaar | [Source](https://www.effenaar.nl/agenda/effenaar-oud-nieuw-2026) |

## Asset handling

- Images are downloaded as provided. For three Effenaar posters, the observed 720px source-set variants are used instead of multi-megabyte originals. Exact download URLs are retained in `data/event-sources.json`.
- GLOW: The First GLOW by Maincourse, GLOW 2025. Photograph by Bart van Overbeeke. This is clearly labelled as a prior-edition photograph.
- DDW: the supplied poster replaces the Industrial Design HUB graphic. Its original bytes are preserved, and the upload filename and SHA-256 are recorded in `data/event-sources.json`. Card thumbnails fill their frame; detail pages use contain sizing to show the complete poster.
- Existing course image mappings and their local files are retained to support the unchanged reference dataset in `reference/events.original.json`. They are not used by the active real-event collection. Their source is the Winc course media directory, https://wincacademy.github.io/webpages/media/.

User-entered image URLs are left unchanged. When an event’s image is edited, the old image credit and caption are cleared so they cannot be wrongly attached to the replacement.
