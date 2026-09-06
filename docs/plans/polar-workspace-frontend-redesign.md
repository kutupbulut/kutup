# Polar Workspace frontend redesign and responsive web plan

**Status:** implementation and the complete local automated release gate are
green; the final manual visual/interaction review is available on the local
Docker preview

**Written:** 2026-08-20

**Branch:** `feat/polar-workspace-redesign`

**Scope:** authenticated web application shell, authentication and recovery
screens, Drive presentation, Messages presentation, Settings, Admin, focused
editor chrome, light/dark theming, and responsive mobile web behavior

**Out of scope:** backend APIs, cryptographic or wire formats, desktop/native
mobile application readiness, a new dashboard, device transfer, and public
backup export

## Implementation checkpoint — 2026-08-21

Implemented on `feat/polar-workspace-redesign`. The redesign preserves public
backend and cryptographic wire contracts. Real-browser coverage also exposed
three compatibility defects, fixed with regression coverage: same-server
named shares no longer depend on optional federation state; identified local
Chat senders are canonicalized before ratchet selection; and linked-device
outgoing history preserves its authenticated origin device and reduces
independent backup mutation chains deterministically.

- paired light/dark OKLCH semantic tokens, self-hosted typography, explicit
  Light/Dark/System preference handling, and the three-facet Kutup signature;
- one CSS-responsive authenticated shell with Files, Messages, and Account as
  the orientation model, plus Shared with me and Trash nested under Files;
- canonical Files, Messages, Settings, and mobile Account routes inside the
  shared shell without viewport-driven service remounting;
- one authorized Admin destination with a dedicated, non-stacking sidebar;
  Overview, Users, and Settings use data-driven, URL-backed, accessible
  locations at `/admin`, `/admin/users`, and `/admin/settings`;
- a focused, centered authentication-card composition used by Login, Register,
  First Login, Recovery, and Server Select, including a pre-authentication
  three-state theme selector; and
- the core Files presentation: responsive workspace and selection headers,
  folder-scoped search, preserved upload and dialog flows, semantic folder/file
  rows, mobile My files/Shared switching, contextual empty states, upload
  progress, and a responsive details inspector; and
- an initial local MessageScroller compatibility implementation that preserves
  prepended-history position, follows the live edge, and exposes an accessible
  jump action for offscreen arrivals;
- reusable conversation rows, responsive Messages list/thread transitions,
  stable restored-message keys, and late-media scroll correction without
  moving Chat protocol/service ownership;
- grouped Settings, capability-accurate mobile Account pages, responsive public
  sharing, and focused editor chrome with explicit Light/Dark/System choice;
- route-level lazy loading for Files, Messages, Admin, Settings, authentication,
  public shares, mobile account pages, and focused editors; and
- an automated zero-retry Playwright responsive/axe gate plus current frontend
  architecture and contributor documentation.

Current local evidence:

- TypeScript typecheck passes;
- the final production Docker frontend image builds successfully with the
  existing Excalidraw import and large-chunk warnings unchanged; Vite
  transforms 5,106 modules and emits Files (147.54 KiB raw), Messages
  (229.12 KiB), Admin (41.97 KiB), and focused editor
  chrome as route chunks;
- global CSS is 123.03 KiB raw / 22.79 KiB gzip; the Latin WOFF2 subsets used
  by the shell total about 54 KiB (Manrope 24.83 KiB and Source Sans 3
  28.74 KiB), while IBM Plex Mono and non-Latin unicode ranges are selected by
  use and remain below the 250 KiB font budget;
- the complete frontend Vitest run passes: 77 files and 407 tests;
- the root Rust workspace passes, and the standalone Chat core passes all 77
  unit/integration cases including its 256-account/2,560-device MLS scale gate;
- Rust/WASM builds, canonical crypto WASM vectors, and every parser fuzz target
  compile successfully;
- the zero-retry production Playwright matrix passes 57 cases with 3 expected
  optional N-tab skips and no failures, including Files, editors, sharing,
  Admin, Trash, linked-device Chat, responsive layouts, and serious/critical
  axe checks at phone and desktop widths in dark and light themes;
- the separate clean-browser Chat history recovery gate passes both history
  and protected-media scenarios with sanitized artifacts;
- the isolated real Postgres/SeaweedFS backup lifecycle harness passes
  provision, append, base, reconciliation, CAS, download, isolation,
  idempotency, quota/limit, retention, and retry-safe purge checks;
- the isolated two-homeserver federation harness passes its API contract,
  destination-metadata privacy checks, federated Direct and MLS browser flows,
  server restarts, total browser loss, clean-context recovery, and post-restore
  messaging with four Playwright cases and retries disabled;
- additional focused shell, theme, Admin, authentication-layout, Files-header,
  and Files-empty-state tests pass;
- after restoring the dedicated Admin sidebar, its focused real-browser suite
  passes all 5 account lifecycle and settings cases against a fresh isolated
  stack with retries disabled;
- light/dark desktop and phone Login plus blank registration form screenshots
  were reviewed locally; recovery phrases and real account data were excluded;
- documentation links, Compose S3 credential wiring, `git diff --check`,
  locale JSON parsing, and the authored-source `.ts`/`.tsx` policy pass; and
- the rebuilt Docker preview is healthy at `https://localhost:40443/`; and
- GitHub Actions has not been triggered for this branch work.

All automated release gates are complete. Final human visual/interaction
review, including the revised storage meter and dedicated Admin sidebar, can
be completed against the local Docker preview. GitHub Actions has not been
used.

**Primary design references:**

- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar),
  [login blocks](https://ui.shadcn.com/blocks/login), and
  [chat components](https://ui.shadcn.com/docs/changelog/2026-06-chat-components);
- [Proton Drive web interaction model](https://proton.me/support/drive-web-guide)
  and [theme model](https://proton.me/support/dark-mode);
- [Google Drive navigation and file views](https://support.google.com/drive/answer/2424384)
  and [Google Chat landmarks](https://support.google.com/chat/answer/7652236);
- [Slack global and contextual sidebar model](https://slack.com/help/articles/212596808-Adjust-your-sidebar-preferences);
  and
- [Linear hierarchy, density, and theme reset](https://linear.app/changelog/2024-03-20-new-linear-ui).

## Executive outcome

Kutup will become one coherent encrypted workspace rather than a collection of
pages with separate navigation systems. Files and Messages are equal primary
workspaces inside a persistent authenticated shell. Shared and Trash are views
of Files. Account is a global destination on mobile and an account control in
the desktop shell.

The implementation is a presentation and information-architecture rewrite,
not a rewrite of Kutup's storage, collaboration, Chat, media, recovery, or
cryptographic behavior. Existing domain services remain authoritative. UI
components consume those services through stable view-model boundaries, and
the large Drive and Chat pages are decomposed without duplicating business
logic.

The target experience is simple and restrained:

- one persistent orientation model across Drive, Messages, Settings, and
  Admin;
- clear visual hierarchy without stacking every section in a card;
- deliberate light and dark palettes designed together;
- a distinct but quiet polar identity derived from Kutup's three-facet mark;
- first-class keyboard, screen-reader, reduced-motion, zoom, touch, and safe-
  area behavior; and
- responsive layouts for phones, tablets, laptops, and wide desktop windows.

The branch itself is the delivery isolation boundary. No long-lived parallel
"legacy UI" and "new UI" production paths will be maintained. Each milestone
must preserve a usable application and remain independently reviewable and
revertible.

## Product frame

### Subject

Kutup is a private, self-hosted workspace in which files, collaborative
documents, and conversations remain encrypted on infrastructure selected by
the user or organization.

### Audience

- individuals who want a private everyday workspace;
- teams that need familiar file and messaging workflows without giving the
  server plaintext; and
- self-hosters and administrators who expect operational clarity rather than
  consumer-cloud upselling.

### Single interaction goal

A signed-in person can move between protected files and protected
conversations, understand the current location and state, and complete the
next action without leaving Kutup's navigation model.

### Vocabulary

User-facing language is locked as follows:

| Concept | User-facing label | Internal compatibility |
|---|---|---|
| Drive workspace | Files | Existing `/drive` URLs and Drive API names remain |
| Chat workspace | Messages | Existing `/chat` URL and Chat protocol names remain |
| Incoming Drive shares | Shared with me | A Files view, never a primary workspace |
| Deleted Drive items | Trash | A Files view, never a primary workspace |
| Self conversation | Note to self | A Messages conversation |
| Configuration/profile | Account | Desktop account menu may link to `/settings` |

Do not rename cryptographic types, API paths, database concepts, test fixtures,
or protocol documentation merely to match user-facing navigation labels.

## Current-state findings

The existing frontend already has the correct implementation foundation:
React 18, Vite, Tailwind CSS 4, a shadcn configuration, Radix primitives,
Lucide icons, React Hook Form, Zod, TanStack Query, and system-aware theme
initialization. The redesign should extend this foundation instead of replacing
it with another framework.

The principal defects are architectural:

1. `App.tsx` declares authenticated pages individually and has no shared
   authenticated layout route.
2. `Drive.tsx` is approximately 1,500 lines and owns a desktop shell plus a
   separate mobile rendering branch.
3. `Chat.tsx` is approximately 4,200 lines, uses `fixed inset-0`, owns a second
   application shell, and requires a back-to-Files action for orientation.
4. Chat's account, device, backup, storage, QR, group, synchronization, safety,
   disappearing-message, and blocking actions compete in primary headers.
5. `/chat` does not participate in `MobileShell`, so the current mobile bottom
   navigation disappears when Messages opens.
6. Mobile presentation has a parallel custom icon and primitive family, which
   makes desktop and mobile drift likely.
7. Settings uses a standalone centered document with a back link instead of
   inheriting the authenticated shell.
8. Authentication and recovery screens use the same generic centered-card
   composition regardless of viewport or product context.
9. The semantic token names are useful, but the active palette is low in
   hierarchy and includes a second set of mobile-only surface and text tokens.
10. The UI uses the operating-system font stack and therefore has little
    typographic identity.
11. Existing E2E coverage has hundreds of stable Chat test-ID references and
    many role/text selectors in Drive. A visual rewrite that casually changes
    those contracts would make product regressions harder to distinguish from
    selector churn.

### 2026-08-20 implementation baseline

The first local baseline was captured on the development VM in the repository's
Node 22 container, using the installed dependency tree and no GitHub Actions
minutes:

- `tsc` plus the Vite production build passed, transforming 5,099 modules in
  7.00 seconds;
- the initial application JavaScript was 3,488.70 KiB raw / 1,206.77 KiB gzip;
- the global CSS was 95.77 KiB raw / 15.88 KiB gzip;
- the largest editor/runtime chunks were 1,821.04 KiB, 1,459.17 KiB,
  593.66 KiB, 552.51 KiB, and a 1,276.04 KiB KDF worker;
- all 55 Vitest files and all 350 tests passed in 62.33 seconds;
- the build reported an existing ineffective Excalidraw dynamic import and
  existing chunks above 500 KiB; these are baseline findings, not introduced
  by the redesign;
- the source contained 58 `sm:`, 35 `md:`, 8 `lg:`, and 4 `xl:` responsive
  usages, plus extensive arbitrary typography and radius values;
- `Chat.tsx` and its browser specifications exposed 315 `data-testid` or
  `getByTestId` references that form a migration contract; and
- the prior global interface used an operating-system font stack. Assistant
  WOFF2 output came from Excalidraw and was not Kutup's body typeface.

The checked-in Drive and Settings screenshots provide an initial visual
reference. Live light/dark capture for all required auth, Files, Messages,
Admin, and phone states plus interaction timings remains part of the Milestone
0 gate; this record does not claim those remaining measurements are complete.

## Locked design decisions

1. Files and Messages are the only primary authenticated workspaces.
2. Shared with me and Trash belong to Files on every viewport.
3. Mobile primary navigation contains exactly `Files`, `Messages`, and
   `Account`.
4. Desktop Account lives in the app-sidebar footer. Admin is shown only to an
   authorized administrator and remains visually secondary to Files and
   Messages.
5. Kutup does not add a Home/dashboard page in this project. Files remains the
   default post-authentication destination.
6. Existing canonical routes remain valid. The redesign may reorganize route
   nesting, but it must not break `/drive`, `/drive/shared`, `/drive/trash`,
   `/chat`, `/settings`, `/admin`, file deep links, or public-share links.
7. The authenticated shell stays visible for Files, Messages list/detail on
   tablet and desktop, and Settings. Admin uses a dedicated role-gated shell so
   workspace and administration sidebars never stack. Full-screen editors use
   a focused shell with an explicit path back to Files; OnlyOffice and
   canvas/editor workspaces are not squeezed beside the full app sidebar.
8. On phones, the Messages conversation list shows the three-item bottom nav.
   Opening a conversation enters a focused thread view with a back action and
   safe-area composer; the bottom nav may be hidden while the thread is open.
9. All themes use semantic tokens. Components may not introduce ad hoc light-
   only colors or rely on opacity to make inaccessible text.
10. The three-facet Kutup mark is preserved. Its geometry, not a copied vendor
    motif, supplies the design's single signature element.
11. No plaintext asset, recovery phrase, safety number, key, bearer token,
    ciphertext, or stable test identity is added to screenshots, telemetry, or
    failure artifacts.
12. Native iOS and Android applications remain work in progress and are not
    represented as ready. This plan covers responsive mobile web only.

## Design direction: Polar Workspace

### Aesthetic thesis

The interface should feel like a precise polar instrument: cool, legible,
quiet, and trustworthy, with enough density for daily work. It must not look
like a stock shadcn dashboard, a Proton clone, or a black canvas with an acid
accent.

The application spends visual boldness in one place: a restrained Kutup facet
indicator derived from the three-diamond logo. It marks the active primary
workspace and appears as the authentication-side visual. Cards, gradients,
glows, glass effects, and decorative illustrations do not compete with it.

### Self-critique and rejected defaults

- Proton's saturated purple product rail communicates a strong suite identity,
  but using purple would make Kutup derivative. Kutup retains and matures its
  glacier-blue identity.
- A direct copy of shadcn's neutral dashboard blocks would be orderly but
  interchangeable with any SaaS administration product. Kutup borrows
  composition and accessible behavior, not example branding or placeholder
  layouts.
- Warm cream, editorial serif, terracotta, acid-green-on-black, excessive
  gradients, and glassmorphism are rejected because they do not arise from
  Kutup's subject and are overused generated-design defaults.
- A standalone security badge on every surface is rejected. Security status
  is shown only where Kutup has a truthful, actionable state to communicate.
- A global dashboard is rejected until Kutup has a real cross-product activity
  model. Inventing summary cards would add navigation without adding value.

### Reference palette

The implementation uses OKLCH semantic tokens for predictable interpolation
and contrast. These hex values are the design references that the final OKLCH
values must visually and accessibly match:

| Named role | Light reference | Dark reference | Purpose |
|---|---:|---:|---|
| Polar canvas | `#F6F8FA` | `#0C1219` | App background |
| Ice surface | `#FFFFFF` | `#131C25` | Primary working surfaces |
| Raised frost | `#EDF2F6` | `#1A2530` | Hover, selected-neutral, elevated sections |
| Polar ink | `#17212B` | `#ECF2F7` | Primary text and icons |
| Glacier action | `#1F62D3` | `#79A8FF` | Primary actions, focus, active navigation |
| Aurora protected | `#147D68` | `#55C4A7` | Verified success/protected state only |

Muted text, borders, destructive, warning, and chart colors are derived
semantic roles, not additional brand colors. Their final pairs must meet the
same contrast gates. Collaborator presence colors and file-type colors are
controlled exceptions because color differentiates real entities or types.

The reference pairs were converted to production OKLCH tokens and checked
before implementation. Representative WCAG contrast results are:

| Foreground and background | Light | Dark |
|---|---:|---:|
| Primary text on app canvas | 15.30:1 | 16.67:1 |
| Muted text on app canvas | 5.96:1 | 8.13:1 |
| Glacier action on app canvas | 5.61:1 | 7.94:1 |
| Text on glacier action | 5.61:1 | 6.61:1 |
| Aurora status on app canvas | 5.04:1 | 8.82:1 |
| Destructive status on app canvas | 6.51:1 | 8.42:1 |
| Warning status on app canvas | 4.77:1 | 10.12:1 |

The dark primary button uses deep-navy text rather than white because white on
the lighter glacier action color does not meet normal-text contrast.

### Theme model

- Retain `light`, `dark`, and `system` preferences.
- Expose all three choices in Account and a compact pre-authentication theme
  control. A binary toggle may remain as a shortcut but cannot be the only way
  to return to system mode.
- Preserve the inline, pre-paint theme bootstrap to avoid a flash of the wrong
  theme.
- Set `color-scheme` for native controls and scrollbars.
- Map CodeMirror, Excalidraw, media viewers, PDF, and focused editor chrome to
  the resolved theme. OnlyOffice theme behavior remains within its supported
  integration boundary.
- Test every representative page in light and dark; dark mode is not a final
  palette inversion pass.

### Typography

The planned type roles are:

- **Manrope:** brand wordmark, authentication statement, and major page titles;
- **Source Sans 3:** navigation, controls, body text, tables, messages, forms,
  and settings; and
- **IBM Plex Mono:** account addresses, device identifiers, safety numbers,
  storage measurements when tabular alignment matters, and technical metadata.

Before addition, verify the exact font artifacts support Turkish/Latin Extended,
are licensed for redistribution, and have license files recorded in the
repository. Fonts must be self-hosted; the browser must not contact Google
Fonts or another font CDN. Prefer variable WOFF2 subsets and load only weights
used by the type scale.

### Type scale

| Token | Size/line height | Typical use |
|---|---|---|
| `display` | 32/38, 650 | Authentication statement only |
| `title-lg` | 26/32, 650 | Phone Files/Account title |
| `title` | 20/26, 650 | Workspace title |
| `heading` | 16/22, 600 | Section and conversation heading |
| `body` | 14/21, 400 | General interface content |
| `body-sm` | 13/18, 400 or 500 | Secondary rows and metadata |
| `caption` | 11/16, 500 | Time, state, compact labels |
| `technical` | 12/18, 450 mono | IDs, addresses, safety metadata |

Do not use uppercase section labels unless the text is genuinely a compact
category label. Do not use all-caps for ordinary navigation or form labels.

### Shape, elevation, and spacing

- Base spatial unit: 4 px.
- Standard control height: 36 px desktop, minimum 44 px touch target on phone.
- Standard radius: 10 px; major surface radius: 12 px; popover/dialog radius:
  14 px. Pills are reserved for statuses and filters.
- Borders establish most hierarchy. Shadows are limited to popovers, dialogs,
  sheets, and floating controls.
- Desktop content density is compact but not compressed. Page padding scales
  from 16 px phone to 24 px tablet and 28-32 px desktop.
- Settings use section dividers and aligned rows rather than a card per topic.
- Layering uses a documented z-index scale for shell, sticky header, dropdown,
  sheet, dialog, toast, and viewer. Individual components must not invent
  arbitrary `z-[9999]` values.

### Kutup facet signature

Create one reusable, accessible brand component derived from the three logo
diamonds. It may provide:

- the desktop active-workspace marker;
- the selected mobile-tab accent;
- the authentication-side protection illustration; and
- a restrained loading transition at application bootstrap.

It must not imply a cryptographic state unless it is explicitly bound to a
real state. Decorative instances are `aria-hidden`. State-bearing instances
include adjacent text and never rely on color or motion alone.

### Motion

- One coordinated motion language: 160-200 ms opacity/transform transitions
  for sidebar collapse, mobile pane entry, and sheets.
- Do not animate layout height, message-list padding, or properties that fight
  scroll anchoring.
- New messages may use a small opacity/translate entrance only while the
  reader is at the live edge.
- `prefers-reduced-motion: reduce` removes nonessential transitions and smooth
  scrolling without changing state visibility.
- No ambient animation, parallax, looping glow, or decorative particle field.

## Information architecture

### Desktop hierarchy

```text
Kutup
├── Files
│   ├── My files
│   ├── Shared with me
│   └── Trash
├── Messages
└── Account footer
    ├── Settings
    ├── Admin (authorized accounts only)
    ├── Theme
    └── Sign out
```

Files and Messages receive the strongest active treatment. Shared and Trash
are indented or grouped under Files and cannot visually compete at the same
level. The Files group may collapse when the sidebar is in icon mode; its
subviews then remain reachable through the Files workspace header/menu.

### Desktop Files layout

```text
┌──────────────────┬──────────────────────────────────────────────────┐
│ App sidebar      │ Files header: breadcrumb · search · create       │
│                  ├──────────────────────────────────────────────────┤
│ Files            │ Optional view/filter toolbar                     │
│   My files       ├──────────────────────────────────────────────────┤
│   Shared with me │ Folder and file working area                     │
│   Trash          │                                                  │
│ Messages         │                                                  │
│                  │                                  Details panel → │
│ Account          │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘
```

The current folder remains the dominant context. Search stays in the Files
header until Kutup has a truthful global cross-product search. Creation actions
are consolidated into one clear `New` action with Upload as a first-class
option inside the same menu or adjacent only when the layout has room.

### Desktop Messages layout

```text
┌─────────────┬────────────────────┬───────────────────────┬────────────┐
│ App sidebar │ Conversation rail  │ Thread                │ Details    │
│             │ Search             │ Conversation header   │ optional   │
│ Files       │ Requests           ├───────────────────────┤ panel      │
│ Messages    │ Groups             │ Message timeline      │            │
│             │ Direct messages    │                       │ Media      │
│             │ Note to self       ├───────────────────────┤ Security   │
│ Account     │ New message        │ Composer              │ Members    │
└─────────────┴────────────────────┴───────────────────────┴────────────┘
```

The conversation rail is contextual navigation, not another app sidebar. Its
width is bounded and optionally resizable within sensible limits. Requests are
actionable and badged. Groups, restored history groups, Note to self, and
direct messages use one coherent conversation-row model instead of unrelated
bordered sections.

Devices, read receipts, history protection, Chat quota, profile/contact QR,
group membership, safety verification, disappearing-message policy, and block
controls move into appropriately labeled account or conversation details. The
thread header exposes only the conversation identity and the highest-frequency
actions; lower-frequency controls live under Details or an overflow menu.

### Mobile hierarchy

```text
┌─────────────────────────────┐
│ Contextual page header      │
├─────────────────────────────┤
│                             │
│ Active Files/Messages/      │
│ Account content             │
│                             │
├─────────────────────────────┤
│ Files   Messages   Account  │
└─────────────────────────────┘
```

Within Files, `My files` and `Shared with me` use an accessible segmented
control, tabs, or compact view switcher. Trash is a secondary Files action.
Incoming-share counts badge Files and Shared with me rather than creating a
fourth primary tab.

Messages uses two phone states:

1. conversation list with bottom navigation; and
2. focused thread with back navigation, sticky header, safe-area composer, and
   optional bottom-sheet details.

At tablet widths, Messages becomes a two-pane conversation-list/thread layout.
Files may use a compact icon rail plus content rather than switching to the
phone bottom bar.

### Responsive ranges

The exact CSS queries may evolve after measurement, but behavior is targeted
at capabilities rather than device names:

| Range | Target behavior |
|---|---|
| `< 600 px` | Phone, one pane, three-item bottom nav |
| `600-899 px` | Large phone/small tablet, adaptive one or two pane |
| `900-1199 px` | Tablet/compact desktop, icon rail and split views |
| `>= 1200 px` | Expanded or user-collapsed sidebar, optional inspectors |

Do not use JavaScript viewport branching when CSS can express the layout.
Render branching is allowed only where component semantics genuinely differ,
such as a Dialog versus Drawer or a single-pane versus mounted split view.
Use one centralized responsive hook/query source when branching is necessary.

## Component and route architecture

### Ownership boundaries

The target layering is:

```text
routes
  -> workspace/page composition
    -> feature presentation + view models
      -> existing Chat/Drive/API domain services
        -> transport, crypto, persistence, workers
```

Presentation components may format state and emit user intents. They must not
reimplement encryption, queueing, retention, reconciliation, media validation,
or upload/download protocols.

### Proposed shell modules

Add modules equivalent to:

```text
frontend/src/components/shell/
├── AuthenticatedShell.tsx
├── AppSidebar.tsx
├── FilesNavigation.tsx
├── WorkspaceHeader.tsx
├── MobilePrimaryNav.tsx
├── FocusedWorkspaceShell.tsx
├── ResponsiveInspector.tsx
└── ShellErrorBoundary.tsx

frontend/src/components/brand/
└── KutupFacet.tsx

frontend/src/components/theme/
└── ThemeSelector.tsx
```

Names may change during implementation, but responsibilities must remain
separate. Shell modules do not fetch Drive or Chat data except small global
badge/count view models explicitly passed through a provider.

### Route composition

Refactor the protected route tree so authentication and authorization remain
outer gates and the authenticated shell becomes a nested layout with an
`Outlet`:

```text
ProtectedRoute
├── AuthenticatedShell
│   ├── /drive
│   ├── /drive/shared
│   ├── /drive/trash
│   ├── /chat
│   └── /settings
├── AdminRoute -> DedicatedAdminShell -> /admin/:section?
└── /file/:cid/:fid (focused editor chrome)
```

Public share, login, registration, first login, recovery, and server selection
remain outside the authenticated shell. Authentication redirects, Broadcast-
Channel session restoration, Tauri restore routing, and public-link behavior
must remain unchanged.

Route modules should be lazy-loaded at meaningful boundaries so Chat, Admin,
and heavyweight editors are not part of the authentication entry chunk.
Loading boundaries use branded but quiet skeletons and retain the correct page
landmark and background in both themes.

### Files presentation boundary

Retain Drive's existing hooks and mutation flows initially. Extract desktop
and mobile presentation behind shared view models before changing behavior:

- current location and breadcrumb;
- Files view (`my-files`, `shared`, `trash`);
- folder/file rows and selection;
- sorting, search, and display mode;
- upload queue and quota state;
- create/open/rename/share/delete/restore intents; and
- optional details inspector state.

Do not migrate file paths solely for aesthetics. Move a component only when
the new ownership boundary is clearer or the old mobile/desktop duplication is
being removed.

### Messages presentation boundary

Keep `frontend/src/chat/` as the protocol/service/persistence layer. Place new
user-interface composition under a distinct presentation namespace such as:

```text
frontend/src/features/messages/
├── MessagesWorkspace.tsx
├── useMessagesWorkspace.ts
├── ConversationRail.tsx
├── ConversationRow.tsx
├── Thread.tsx
├── ThreadHeader.tsx
├── MessageTimeline.tsx
├── MessageRow.tsx
├── MessageComposer.tsx
├── MessageRequestBanner.tsx
├── ChatAccountDetails.tsx
├── ConversationDetails.tsx
└── GroupDetails.tsx
```

Before extraction, add characterization tests around state transitions that
are currently implicit in `Chat.tsx`. Move code in behavior-preserving slices:

1. pure formatting and row rendering;
2. conversation derivation and selection;
3. composer, reply, edit, reaction, and deletion presentation;
4. device/profile/backup/account settings;
5. group and safety details; and
6. the remaining orchestration hook.

Do not duplicate effects between the legacy page and extracted components.
After each slice, only one owner may create the Chat service, poll/reconcile,
observe visibility, acknowledge receipts, manage media-cache requests, or
flush backup state.

### shadcn adoption policy

Kutup follows the shadcn ownership model: component source is copied into the
repository and becomes Kutup code. Adoption rules are:

1. Do not rerun `shadcn init` or overwrite the existing token system.
2. Prefer the Radix variant to match current dependencies and interaction
   semantics.
3. Add only components used by the active milestone.
4. Inspect every generated diff, dependency, license, default class, and
   accessibility behavior before accepting it.
5. Remove example data, remote images, vendor copy, social-login buttons, and
   placeholder navigation.
6. Wrap or adapt components only when Kutup needs a stable product-level API;
   avoid wrappers that merely rename every prop.
7. Preserve semantic shadcn token names so existing components continue to
   work during migration.
8. Do not copy a complete example block as a page. Use its composition as a
   reference and implement Kutup's information architecture.

Likely primitives include Sidebar, Breadcrumb, Avatar, Field, Textarea,
InputGroup, Command, ToggleGroup, Drawer/Sheet, Resizable, and the new Message,
Bubble, Attachment, Marker, and MessageScroller set. Every addition remains
conditional on an implementation spike and bundle/license review.

### MessageScroller spike

Before replacing the current Chat scroll area, build a test-only spike using
Kutup-shaped messages. It must prove:

- opening at the latest meaningful message without forced scroll jumps;
- prepending restored/older history while preserving the visible row;
- stable message IDs across direct, MLS, incoming, and outgoing histories;
- search-result jump and highlighted-message behavior;
- no forced movement while selecting text, using message actions, opening an
  attachment, or reading older messages;
- a visible and accessible jump-to-latest action for offscreen arrivals;
- compatibility with disappearing-message removal, deletion tombstones,
  image dimension changes, voice waveform loading, and lazy media restore;
- correct focus and announcements without excessive live-region noise;
- acceptable performance with a representative long transcript; and
- React 18, build, license, and dependency compatibility.

If the spike fails, retain the existing scroll container and implement the
required behavior locally. The visual redesign is not contingent on adding a
particular dependency.

**Implementation decision (2026-08-20):** retain a Kutup-owned scroll
container instead of adding a chat UI dependency. The local implementation is
adopted behind stable `direction:id` item keys and has focused coverage for
live-edge opening/following, protected-history prepends, offscreen arrivals,
explicit jump-to-latest, conversation changes, and late media/voice sizing.
Search continues to use the existing stable message DOM IDs. The remaining
long-transcript browser measurement and attachment/viewer interaction checks
stay part of the Milestone 5 gate.

## Page-level requirements

### Login, registration, first login, recovery, and server selection

- Use one centered authentication card on a muted canvas at every viewport.
  Authentication has one job and must not compete with a marketing panel.
- Keep the Kutup mark above the card and global appearance controls reachable
  outside it; do not load stock photography or remote decorative assets.
- Size the card to its task: compact for sign-in/TOTP, wider only for recovery
  phrases and setup steps that genuinely require it.
- Show selected server context when relevant without exposing internal tokens
  or stable account identifiers.
- Provide the light/dark/system control before authentication.
- Preserve password-manager autocomplete, Enter submission, error focus,
  TOTP, mnemonic confirmation, first-login, recovery, and Tauri server-switch
  behavior.
- Recovery phrases remain visually isolated, non-telemetric, and excluded from
  screenshots and automated failure artifacts.
- Use active, consistent copy: `Sign in`, `Create account`, `Continue`,
  `Verify`, `Save recovery phrase`, and `Recover account` must describe the
  resulting action.

### Files

- Files header owns the breadcrumb, contextual search, view controls, and
  creation action.
- `My files` and `Shared with me` switch the same main work surface.
- Folder and file presentations share selection, focus, context-menu, and
  keyboard behavior across list/grid modes.
- Empty states state why the view is empty and provide one relevant next
  action; they do not contain decorative marketing copy.
- Upload progress remains available without permanently occupying the main
  content area.
- Quota is shown in Account and optionally as a quiet sidebar meter. It does
  not resemble an upsell.
- Details uses an optional desktop inspector and a mobile sheet/page.
- Multi-select actions remain discoverable and keyboard reachable.
- Drag/drop overlays remain bounded to the valid target and do not obscure
  dialogs or leak outside the app root.

### Messages

- Conversation rows show identity, latest meaningful preview, time, unread or
  request state, and mute/closed/restored state where applicable.
- Direct, MLS group, restored-history group, Note to self, and request rows use
  a shared structural component with type-specific metadata.
- A `New message` action opens a searchable command/dialog flow. Raw address
  entry remains available for federated contacts.
- Search is scoped and labeled. Conversation search and transcript search are
  not presented as the same operation.
- The thread header prioritizes identity and conversation status. Device,
  backup, storage, QR, group management, and safety controls move to Details or
  account settings.
- Message requests remain visually distinct and cannot accidentally render or
  fetch protected media before acceptance.
- Incoming and outgoing messages remain distinguishable without color alone.
- Consecutive messages may group visually when sender and time context permit;
  grouping must not hide receipt, expiry, edit, deletion, or accessibility
  metadata.
- Attachments use the existing secure cache and viewer state machine. The UI
  continues to distinguish `Download into Kutup`, `Open`, `Save to device`,
  and `Clear local copy`.
- The composer uses a textarea that grows within a bounded height, supports
  Shift+Enter/Enter behavior consistently, and retains attachment, camera,
  voice, reply, edit, disabled, pending, and failure states.
- Composer state survives harmless responsive transitions and is cleared only
  by the same domain events as today.
- Security and backup states use plain-language summaries first, with exact
  technical details available on demand.

### Settings and Account

- Desktop Settings uses the authenticated shell and a compact settings
  subnavigation or anchored section list.
- Mobile Account is the third primary tab and links to focused subpages.
- Account identity, storage, presence color, theme, language, devices,
  notifications, security/TOTP, encryption recovery, about, and authorized
  Admin access have stable locations.
- Theme provides Light, Dark, and System, with the current resolved result
  visible when System is selected.
- Destructive account/device/sign-out operations use explicit confirmation and
  restore focus correctly.
- Settings rows do not present immutable values as editable controls.

### Admin

- Admin remains role-gated and uses one dedicated sidebar instead of stacking
  a local navigation rail beside the authenticated workspace sidebar.
- Overview, Users, and Settings share the standard page header, tabs, table,
  empty state, form, and mobile patterns.
- High-density data remains readable at 200% zoom and offers a non-table phone
  presentation where horizontal tables are unusable.
- Quota, federation, retention, and encryption status colors include labels or
  icons and never rely solely on hue.

### Focused editors and viewers

- File editor routes retain a focused, maximum-area layout.
- The focused header provides filename, save/sync state, presence, version
  history, theme-compatible controls, and an explicit path back to Files.
- OnlyOffice, CodeMirror, Excalidraw, PDF, image, and media integration logic is
  preserved. The redesign changes the containing chrome only after current
  editor tests remain green.
- Full-screen viewers and dialogs restore focus to the originating item.
- Public shares remain visually related to Kutup but do not expose
  authenticated navigation or imply the visitor is signed in.

## Accessibility requirements

WCAG 2.2 AA is the implementation target for the redesigned surfaces.

### Semantics and landmarks

- Exactly one primary `main` landmark per page state.
- App sidebar and mobile bottom navigation use labeled `nav` landmarks.
- Headers, complementary inspectors, forms, search, dialogs, and status areas
  use correct native landmarks and accessible names.
- Conversation lists, message timelines, folder trees/lists, and tables expose
  their real semantics instead of relying on generic clickable `div` elements.
- Heading levels follow the visible information hierarchy.

### Keyboard and focus

- All actions are reachable and operable without a pointer.
- Focus order follows visual order across sidebar, contextual rail, main area,
  and inspector.
- Visible focus meets contrast requirements in both themes.
- Sidebar collapse, route changes, dialogs, drawers, menus, viewers, and
  mobile-pane transitions deliberately place or restore focus.
- Escape closes the topmost dismissible layer and does not discard an unsent
  draft without confirmation.
- Roving focus may be used for conversation lists, menus, and segmented
  controls only where the ARIA pattern supports it.
- Existing keyboard shortcuts remain documented and do not fire while typing
  in an input, textarea, editor, or contenteditable region.

### Visual access

- Normal text contrast is at least 4.5:1; large text and essential UI graphics
  are at least 3:1.
- Focus indicators are at least 2 CSS pixels where required and not clipped.
- Status and selection never rely on color alone.
- Reflow works at 400% zoom for representative routes without two-dimensional
  scrolling, except intrinsically two-dimensional editors such as
  spreadsheets and whiteboards.
- Text remains usable at 200% browser text scaling.
- Phone touch targets are at least 44 by 44 CSS pixels unless an inline target
  has an equivalent enlarged hit area.
- Safe-area insets protect headers, sheets, bottom navigation, and composer.

### Announcements

- Upload, send, backup, download, and save progress are announced at useful
  milestones, not every byte or percentage update.
- New-message announcements do not repeatedly read an entire active transcript.
- Errors identify the failed action and a recovery path.
- Empty states provide a next action.

Automated accessibility checks supplement, but do not replace, keyboard and
screen-reader-oriented manual review.

## Security and privacy constraints

1. The redesign does not modify Chat/Drive cryptographic suites, envelopes,
   KDF labels, backup archives, media descriptors, or server authorization.
2. No external runtime font, image, analytics, icon, or component CDN is
   introduced.
3. Existing Markdown, Mermaid, preview, media, and attachment sanitization
   boundaries remain intact.
4. Moving controls must not cause eager attachment downloads, request
   acceptance, read receipts, mailbox cursor advancement, or backup flushes.
5. Responsive remounts must not create a second Chat coordinator/service,
   duplicate WebSocket, duplicate receipt, repeated upload, or lost draft.
6. Account switches and logout continue to cancel private media work and purge
   account-scoped ciphertext caches as currently specified.
7. Theme, sidebar-width, and display preferences contain no sensitive data and
   may use local storage. Keys, phrases, contacts, message content, filenames,
   and account identifiers do not enter UI-preference storage.
8. Clipboard actions state what is copied and avoid automatic copying of
   sensitive values.
9. Visual-regression fixtures use synthetic local content. Safe-artifact Chat
   runs continue to disable screenshots, video, traces, and raw browser/network
   dumps.
10. Dependencies introduced for UI behavior receive license, provenance,
    maintenance, and vulnerability review before merge.

## Internationalization and content design

- All new user-facing strings enter the existing English and Turkish locale
  files in the same change.
- Do not use concatenated fragments that prevent natural translation.
- Test navigation labels and primary screens in Turkish at phone and compact
  desktop widths.
- Use CSS logical properties or direction-safe primitives where practical so
  a future RTL locale does not require architectural replacement.
- Dates, times, byte sizes, counts, and plurals use existing locale-aware
  formatters or `Intl`; do not add English-only manual formatting.
- Internal names such as MLS, PQXDH, CAS, cursor, and incarnation appear only
  in advanced technical details where they help diagnosis.
- Actions use consistent active language. A button labeled `Save changes`
  produces a `Changes saved` outcome, not `Submitted successfully`.
- Error and empty-state copy is specific, non-apologetic, and actionable.

## Performance budgets

Capture the production build baseline before dependency or font changes. The
redesign must meet these budgets unless a measured exception is documented:

- no more than 75 KiB gzip increase in the initial authenticated shell chunk;
- no more than 250 KiB total WOFF2 font transfer for the initial shell, with
  additional technical font weights lazy-loaded if necessary;
- Chat, Admin, OnlyOffice, Excalidraw, Mermaid, KaTeX, PDF, and viewers remain
  behind route/component lazy boundaries where feasible;
- no layout shift caused by late font loading in shell navigation or forms;
- route navigation and primary controls respond within 100 ms under normal
  local conditions, excluding an explicitly surfaced cryptographic or network
  operation;
- sidebar collapse and mobile transitions sustain smooth rendering on a
  mid-range emulated phone and do not remount domain services;
- a representative 5,000-message transcript remains scrollable and responsive;
  windowing is introduced only if measurement demonstrates it is required and
  it remains compatible with restoration and message jumps; and
- file lists avoid eager preview/media work outside the visible region.

Record build chunk sizes and the test hardware/browser profile in the
implementation completion record. Do not claim performance improvement from
visual inspection alone.

## Test strategy

### Test preservation rule

Behavioral selectors are part of the migration contract. Preserve existing
`data-testid` values used by Chat specs 31-34 and stable accessible names used
by Drive/editor tests unless the underlying user action genuinely changes.
When a selector must change, update the product component and all affected tests
in the same milestone and document why the old contract was misleading.

Do not weaken assertions, add retries, or replace convergence polling with
fixed sleeps to make redesigned UI tests pass.

### Unit and component coverage

Add or extend Vitest/Testing Library coverage for:

- route-to-navigation active-state mapping;
- Files subview hierarchy and badges;
- three-choice theme preference and system changes;
- sidebar expanded, collapsed, persisted, and keyboard states;
- phone, tablet, and desktop render decisions without duplicate service mounts;
- mobile bottom navigation with exactly Files, Messages, Account;
- focus restoration for account menus, dialogs, sheets, and inspectors;
- conversation row variants and unread/request/restored states;
- composer draft, reply, edit, disabled, attachment, voice, and error states;
- message grouping without loss of receipt, expiry, mutation, reaction, or
  accessibility metadata;
- reduced-motion behavior;
- locale expansion and Turkish strings; and
- semantic token/component variants in both themes where behavior changes.

Use fake IndexedDB only in tests that need the real local persistence contract.
Pure presentation tests should consume typed fixtures rather than initialize
Chat crypto or network services.

### Accessibility automation

Introduce a maintained axe integration for representative deterministic pages
after dependency review. Gate serious/critical violations for:

- login;
- populated and empty Files;
- conversation list and active thread;
- Settings/Account;
- Admin overview and users; and
- dialogs, drawers, and mobile navigation.

Maintain explicit manual checklists for keyboard traversal, screen-reader
landmarks, 200% text, 400% zoom/reflow, forced colors, reduced motion, and
touch target behavior. Automated scans do not certify accessibility alone.

### Responsive browser coverage

Add focused Playwright coverage using deterministic synthetic accounts/data:

| Viewport | Theme | Required scenarios |
|---|---|---|
| 390x844 | Light + dark | Auth, Files, Shared, Messages list/thread, Account |
| 430x932 | Light + dark | Safe area, sheets, composer, long labels |
| 768x1024 | Light + dark | Tablet split decisions and orientation changes |
| 1024x768 | Light + dark | Compact rail, Files, Messages two-pane |
| 1440x900 | Light + dark | Expanded desktop, inspector, Settings/Admin |

Test browser resizing within one authenticated session to prove drafts,
selection, uploads, and Chat services survive transitions.

### Visual regression

Create a deterministic screenshot harness distinct from README marketing
screenshots. It must:

- use generic Kutup-owned fixture identities and non-sensitive content;
- disable caret blinking, nondeterministic timestamps, and nonessential motion;
- self-host the exact fonts used in CI;
- capture shell, authentication, Files, Messages, Settings, Admin, dialogs,
  empty states, errors, and representative mobile states;
- store only approved non-sensitive baselines; and
- run in a pinned container/browser environment before pixel comparisons
  become a required gate.

During early milestones, semantic/interaction tests are required and visual
diffs are review artifacts. Make pixel diffs required only after fonts,
rendering environment, and stable baselines are proven deterministic locally.

### Existing regression suites

Run the lowest-cost relevant checks after each milestone, then the complete
local CI-equivalent suite before the branch is proposed for merge. Required
final evidence includes:

- frontend typecheck/build and all Vitest tests;
- documentation link/path checks and `git diff --check`;
- authentication, first-login, Drive, Trash, Settings, Admin, upload/download,
  editor, and public-share E2E scenarios affected by the shell;
- Chat spec 31;
- two-server Chat security spec 32;
- clean-browser recovery spec 33;
- two-server browser-loss recovery spec 34; and
- the new responsive, theme, keyboard, and visual-regression suites.

Use the VM for CI-equivalent reproduction before triggering GitHub Actions, in
accordance with the repository's local-first CI policy. GitHub CI is final
environment confirmation, not the first place a reproducible failure is
discovered. Playwright retains `retries: 0`.

## Implementation milestones

### Milestone 0 — Baseline and design contract

1. Capture current light/dark screenshots for authentication, Files, Chat,
   Settings, Admin, and representative phone layouts.
2. Record production build chunks, CSS size, font behavior, accessibility
   findings, and key interaction timings.
3. Inventory current colors, arbitrary values, z-indexes, breakpoints, custom
   mobile icons, UI primitives, and duplicated desktop/mobile components.
4. Map existing E2E selectors and route expectations, especially Chat specs
   31-34.
5. Validate font licenses, glyph coverage, and subset sizes.
6. Convert the reference palette into measured OKLCH tokens and record contrast
   results.
7. Produce reviewed wireframes for the required phone, tablet, compact desktop,
   and wide desktop states.

**Gate:** the design token sheet, route map, screenshots, contrast table, font
decision, and component inventory are reviewed before production components
change.

### Milestone 1 — Foundations and owned primitives

1. Refactor `index.css` into a documented semantic theme contract while
   preserving shadcn token names during migration.
2. Add self-hosted fonts and license records with flash/layout-shift-safe
   loading.
3. Add the Kutup facet, theme selector, focus styles, elevation, motion, and
   z-index primitives.
4. Add only the shadcn primitives needed for the shell and authentication.
5. Consolidate Lucide icon usage and establish an exception policy for brand,
   file-type, and collaborator-color visuals.
6. Extend theme unit tests for Light, Dark, System, OS changes, cross-tab sync,
   storage failure, and first paint.

**Gate:** existing screens still compile and pass tests using compatibility
tokens; no page is half-migrated; light and dark contrast checks pass.

### Milestone 2 — Authenticated shell and routing

1. Add nested authenticated and focused-editor layout routes.
2. Implement the responsive app sidebar, workspace header, account footer,
   mobile primary nav, and shell error/loading boundaries.
3. Integrate Files, Messages, Settings, and Admin routes without redesigning
   their inner content yet.
4. Nest Shared with me and Trash under Files.
5. Remove the need for a desktop Chat back-to-Files button.
6. Persist only non-sensitive sidebar preference state.
7. Add navigation, deep-link, authorization, keyboard, and responsive tests.

**Gate:** every existing canonical URL works directly and after reload;
authorization is unchanged; shell navigation never duplicates page services.

### Milestone 3 — Authentication and recovery surfaces

1. Implement the focused authentication-card layout and shared theme control.
2. Migrate Login, Register, First Login, Recovery, and Server Select through
   shared authentication primitives.
3. Preserve all credential, TOTP, mnemonic, KDF, Tauri, and redirect behavior.
4. Verify both themes, Turkish strings, password-manager semantics, keyboard
   flow, mobile layout, and safe-artifact behavior.

**Gate:** first-login and ordinary-login E2E flows pass unchanged; recovery
secrets never enter visual artifacts; no remote asset request is introduced.

### Milestone 4 — Files workspace

1. Introduce shared Files view models and a unified responsive presentation.
2. Redesign the header, breadcrumb, search, creation, folder grid, file table,
   empty states, upload progress, selection toolbar, context menus, and details
   inspector.
3. Make My files and Shared with me sibling views inside Files; keep Trash
   secondary.
4. Remove obsolete mobile-only visual duplicates as their replacements land.
5. Preserve create, upload, folder upload, drag/drop, open, preview, download,
   share, public link, rename, delete, restore, quota, and remote-share flows.

**Gate:** Drive, Trash, upload/download, rename, editor-open, public-share, and
README screenshot seeding scenarios pass on the relevant viewports.

### Milestone 5 — Messages decomposition and redesign

1. Add characterization coverage before moving effects or service ownership.
2. Complete the MessageScroller compatibility spike and record the decision.
3. Extract conversation derivation, rows, timeline, bubbles, attachments,
   composer, banners, account details, conversation details, and group details.
4. Implement the app-rail/conversation-rail/thread/optional-details layout.
5. Consolidate low-frequency header controls into Details and account settings.
6. Preserve every Direct, MLS, federation, request, safety, typing, receipt,
   search, reply, edit, reaction, delete, expiry, voice, attachment, media,
   backup, restore, and device behavior.
7. Keep all established Chat test IDs unless an explicitly documented
   accessibility improvement requires a coordinated change.

**Gate:** frontend Chat unit tests plus specs 31-34 pass with zero retries and
safe artifacts where required. Clean-browser restoration imports no partial or
duplicate UI state after component extraction.

### Milestone 6 — Responsive mobile web experiment

1. Replace the binary 767px product fork with the approved phone/tablet/
   compact-desktop behavior.
2. Ship the three-item phone navigation: Files, Messages, Account.
3. Implement Files My/Shared switching and secondary Trash access.
4. Implement Messages list/thread transitions, tablet two-pane mode, safe-area
   composer, mobile details sheets, and orientation changes.
5. Verify that resizing does not duplicate Chat services, clear drafts, reset
   Files location/selection, or interrupt uploads.
6. Remove replaced mobile icon/primitives and stale design-prototype comments.

**Gate:** the responsive matrix passes in light, dark, English, and targeted
Turkish cases with no unintended horizontal overflow or inaccessible targets.

### Milestone 7 — Settings, Admin, and focused chrome

1. Migrate Settings and mobile Account subpages into one coherent information
   architecture.
2. Migrate Admin overview/users/settings to the shared visual system while
   retaining a dedicated role-gated navigation shell, plus common typography,
   tables, rows, forms, filters, and mobile patterns.
3. Update focused editor/viewer chrome without changing editor internals.
4. Align public-share branding and theme behavior without adding authenticated
   navigation.

**Gate:** Settings, TOTP, devices, Admin, editor collaboration/history, media
viewers, and public-share scenarios pass.

### Milestone 8 — Quality hardening

1. Run and fix automated accessibility checks.
2. Complete manual keyboard, landmark, zoom, forced-colors, reduced-motion,
   screen-reader-oriented, touch, and safe-area reviews.
3. Measure and address build, font, route-load, list, and long-thread
   performance against the recorded baseline.
4. Stabilize and approve deterministic visual-regression baselines.
5. Audit raw colors, arbitrary radii, z-indexes, duplicated components,
   inconsistent copy, missing translations, focus traps, and stale comments.
6. Re-run the full local CI-equivalent and E2E suite.

**Gate:** all acceptance criteria below have evidence; no unresolved critical
or high-severity accessibility, security, data-loss, or navigation defect
remains.

### Milestone 9 — Documentation and delivery

1. Update README screenshots only after the final UI and deterministic fixture
   state are approved.
2. Update contributor, architecture, E2E, theme, and frontend component
   documentation.
3. Add a completion record to this plan with implementation commits, measured
   budgets, accessibility evidence, test commands/results, and known deferred
   polish.
4. Rebase or merge current `master` safely, rerun affected local gates, and
   open one reviewable pull request with milestone-oriented commits.
5. Trigger GitHub CI only after local equivalence is green. Do not skip required
   protected-branch checks unless repository policy explicitly permits it and
   the user chooses to do so based on exact environment equivalence.

**Gate:** required PR checks pass without retry masking; the production build
and documentation describe the shipped result.

## Commit and review strategy

Use small semantic commits that leave the branch buildable:

1. design tokens and font assets;
2. shared primitives and theme selector;
3. route shell and navigation;
4. authentication surfaces;
5. Files presentation;
6. Messages characterization/extraction slices;
7. Messages visual composition;
8. responsive phone/tablet behavior;
9. Settings/Admin/editor chrome;
10. accessibility, visual tests, cleanup, and documentation.

Do not combine mechanical file moves with behavioral changes. Do not hide
generated component code and product refactors in one commit. Each Messages
extraction commit states which effect/service owner moved and which tests prove
single ownership.

## Risk register and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Chat service duplicated during responsive remount | Duplicate sends, receipts, sockets, or backup work | Hoist service ownership; render responsive views from one controller; add mount-count and browser tests |
| Chat monolith extraction changes behavior | Security/recovery regression | Characterization tests first; move one ownership boundary per commit; specs 31-34 at milestone gate |
| Drive desktop/mobile consolidation loses edge cases | Broken upload/share/trash workflows | Shared typed view model; preserve existing mutations; targeted E2E per slice |
| New shadcn component conflicts with existing Radix/Tailwind versions | Build or interaction regression | Add individually; prefer Radix variant; inspect diffs and peer dependencies; compatibility spike |
| MessageScroller conflicts with restored history or lazy media | Scroll jumps or missed visibility receipts | Dedicated Kutup-shaped spike; stable IDs; retain existing scroller if any invariant fails |
| Font load increases bundle or causes layout shift | Slower startup and unstable screenshots | Self-host subsets; preload only critical face; size budget; font metrics/fallback tuning |
| Low-contrast dark theme | Accessibility failure | Paired token design, automated contrast tests, manual dark review, no opacity-only text hierarchy |
| Mobile bottom navigation obscures composer/content | Unusable phone flow | Focused thread hides nav; safe-area tests; 390/430 px matrix |
| Route reparenting breaks auth/admin/deep links | Access or navigation failure | Preserve canonical URLs; nested route tests; direct-load/reload cases |
| Visual tests expose sensitive Chat state | Privacy incident | Synthetic fixtures; safe-artifact mode; separate non-sensitive visual suite |
| Large branch becomes difficult to review | Defects and merge conflicts | Milestone commits, buildable gates, periodic master integration, explicit completion record |
| Vendor imitation erodes Kutup identity | Generic or derivative UI | Locked Polar Workspace thesis, glacier palette, Kutup facet signature, design critique at every milestone |

## Rollback and recovery

- The redesign must not require a database migration or server rollout, so a
  frontend rollback remains possible without data conversion.
- Milestone commits stay individually revertible and avoid mixing protocol or
  backend behavior with presentation work.
- Preserve canonical URLs and stored theme preference values so rollback does
  not strand navigation or user settings.
- New non-sensitive layout preferences must have defensive parsing and safe
  defaults when an older frontend encounters them.
- If the MessageScroller integration fails after adoption, the timeline can
  return to the existing scroll implementation without changing message data,
  IDs, persistence, or transport.
- Do not delete legacy presentation components until their replacement passes
  the relevant gate and no route imports them.

## Acceptance criteria

The redesign is complete only when all of the following are true:

### Navigation and architecture

- Files and Messages are the only primary desktop workspaces.
- Mobile primary navigation contains exactly Files, Messages, and Account.
- Shared with me and Trash are Files views on every viewport.
- Desktop Messages no longer requires a back-to-Files control for application
  navigation.
- Settings uses the authenticated shell; Admin uses one dedicated role-gated
  shell; file editors use focused chrome.
- Every existing canonical route, direct deep link, refresh, auth redirect,
  and authorization boundary works.
- Responsive transitions do not duplicate services or lose meaningful UI
  state.

### Visual system

- Every redesigned surface works in Light, Dark, and System preferences.
- The approved semantic palette and type roles are implemented with no runtime
  external font or image dependency.
- The Kutup facet is the only recurring signature motif and is used with
  restraint.
- Cards, shadows, radii, icons, and motion follow the documented system rather
  than page-local invention.
- English and Turkish navigation and representative content fit the required
  responsive widths.

### Functionality

- Existing Files creation, upload, download, preview, sharing, rename, trash,
  restore, quota, editor, and public-share behavior remains intact.
- Existing Direct/MLS messaging, requests, receipts, typing, search, reply,
  edit, reactions, deletion, expiry, safety, groups, media, voice, backup,
  clean-browser recovery, and two-server recovery behavior remains intact.
- Authentication, first login, TOTP, recovery, server selection, cross-tab
  session behavior, logout, and account cache isolation remain intact.
- No UI-only navigation or responsive transition produces a network mutation,
  receipt, cursor advance, media download, or backup operation unless the
  existing product behavior requires it.

### Accessibility and responsive behavior

- Representative redesigned pages have no serious or critical automated axe
  violations.
- Keyboard navigation, focus restoration, landmarks, labels, live regions,
  reduced motion, forced colors, 200% text, and 400% zoom/reflow pass the
  documented manual review.
- Normal text, large text, focus, and essential graphic contrast meet WCAG 2.2
  AA in both themes.
- Phone targets and safe areas meet the documented requirements.
- Required viewport/theme scenarios have automated browser coverage with zero
  retries.

### Performance and delivery

- Initial shell and font transfers remain within budget or have an approved,
  measured exception.
- Heavy routes and editors remain lazy-loaded.
- Representative long Files and Messages views remain responsive.
- Frontend tests, affected full-stack E2E suites, Chat specs 31-34, responsive
  tests, accessibility checks, and visual gates pass locally before GitHub CI.
- README and active documentation match the final UI.
- The completion record identifies exact evidence and does not describe
  unfinished work as shipped.

## Explicit non-goals

- Changing server APIs, database schema, quotas, retention, federation, Chat
  protocol, backup format, media format, or encryption.
- Reintroducing device-to-device history transfer or adding backup export.
- Shipping or claiming readiness for native iOS or Android apps.
- Adding voice/video calling, channels, global activity feeds, favorites,
  global cross-product search, or a dashboard without a separate product plan.
- Copying Proton, Google, Slack, Linear, or shadcn branding or page layouts.
- Replacing OnlyOffice, CodeMirror, Excalidraw, PDF.js, or the existing media
  pipeline.
- Introducing analytics, behavioral tracking, external font delivery, or
  remote decorative assets.
- Treating screenshot similarity or automated axe output alone as proof of
  product quality or accessibility.

## Completion record template

Do not fill this section until the implementation is genuinely complete.

```text
Completed:
Pull request:
Merge commit:

Milestone commits:
- ...

Design evidence:
- approved light/dark screenshots
- contrast results
- responsive matrix

Performance evidence:
- baseline and final build sizes
- font transfer
- route and long-list/thread measurements

Accessibility evidence:
- automated scan results
- manual keyboard/zoom/reduced-motion/forced-colors review

Verification:
- frontend commands and results
- E2E commands and results
- Chat specs 31-34 results
- responsive/visual results

Deferred follow-up:
- only explicitly accepted non-blocking items
```
