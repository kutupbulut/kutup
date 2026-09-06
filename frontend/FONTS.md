# Frontend font assets

Kutup self-hosts its web interface fonts through pinned Fontsource packages.
The browser does not contact Google Fonts, Adobe, IBM, Fontsource, or another
font CDN at runtime.

| UI role | Family | Package | Version | License |
|---|---|---|---:|---|
| Brand and restrained display text | Manrope Variable | `@fontsource-variable/manrope` | 5.3.0 | SIL OFL 1.1 |
| Navigation, controls, body, tables, and messages | Source Sans 3 Variable | `@fontsource-variable/source-sans-3` | 5.3.0 | SIL OFL 1.1 |
| Technical identifiers and aligned measurements | IBM Plex Mono | `@fontsource/ibm-plex-mono` | 5.3.0 | SIL OFL 1.1 |

The complete copyright notices and OFL text ship in each installed package's
`LICENSE` file. The packages are locked in `frontend/pnpm-lock.yaml`, and their
CSS and WOFF2 files are emitted into the production build by Vite.

## Loading policy

- Manrope and Source Sans 3 use their variable weight axes.
- IBM Plex Mono loads only the 400 and 500 weights.
- Fontsource Unicode ranges allow the browser to request only the scripts
  needed for the page.
- Latin and Latin Extended are enabled for English and Turkish, including
  `Çç Ğğ İı Öö Şş Üü`.
- `font-display: swap` keeps content available during first load.
- System fallbacks remain in the font stacks to prevent invisible text.

For an English shell, the Latin WOFF2 files total approximately 68 KiB. A
Turkish shell that also needs Latin Extended remains approximately 186 KiB,
below the redesign's 250 KiB initial font-transfer gate. IBM Plex Mono is
loaded only when technical text is present.

## Upstream provenance

- Manrope: Copyright 2019 The Manrope Project Authors.
- Source Sans 3: Adobe's Source Sans project; distributed under OFL 1.1.
- IBM Plex Mono: Copyright 2017 IBM Corp.; distributed under OFL 1.1.

Do not replace these imports with remote `@import` statements or `<link>` tags.
Dependency updates must preserve Latin Extended coverage, record the new
version here, and remeasure the initial font transfer.
