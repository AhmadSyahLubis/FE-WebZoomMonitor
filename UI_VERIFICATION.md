# UI verification

Date: 19 October 2026. Reference: existing Zoom Monitor Flutter application.

## Live QA on the authorized Ahmad account

Date/time: 19 October 2026, approximately 21:37–21:44 WIB. The user explicitly designated Ahmad as the only account for live testing. All mutations targeted newly created `QA-CODEX-AHMAD-*` meetings. No existing business meeting, Zoom account credential, account configuration, or other account's meeting was modified.

- PASS: identified the Ahmad account in the dashboard, verified its Basic plan, and applied the Ahmad schedule filter. The initial upcoming schedule was empty.
- PASS: submitting a blank booking topic displayed `Topik meeting wajib diisi` without creating a meeting.
- PASS: created single meeting `76651761423` for 20 October, 09:15 WIB, with conflict override left off. Updated only this test meeting's topic and duration from 15 to 20 minutes. The schedule retained the correct 09:15 WIB start and showed 09:35 WIB end.
- FOUND AND FIXED: initial daily recurring test `73590872655`, requested for 21–22 October at 10:30 WIB, produced six occurrences through 26 October. The recurrence cutoff contained fractional seconds. The formatter now sends UTC timestamps at second precision. Zoom's [official developer response](https://devforum.zoom.us/t/updatemeeting-api-end-date-time-format-with-milliseconds/22274) confirms the expected `YYYY-MM-DDTHH:MM:SSZ` format; the [recurrence reference](https://godevelopers.zoom.us/docs/api/references/recurrence-object-definitions/) uses that same format.
- PASS: after the formatter fix, daily test `79644848935` produced exactly two separate rows: 21 and 22 October, 10:30–10:45 WIB. No later occurrence was present.
- PASS: deleting only the first occurrence of the corrected test removed the 21 October row and retained the 22 October row. The occurrence option was selected by default and named the specific date.
- PASS: explicitly selecting whole-series deletion removed the remaining test series. The dialog named Ahmad and the QA topic and warned that every occurrence in that series would be removed.
- PASS: deleted the single test meeting and the earlier diagnostic series as well. Cleared the search text while keeping Ahmad selected and verified the complete upcoming schedule returned to zero.
- PASS: ten offline regression tests, lint, and production build after the fractional-second fix. The regression assertion now requires second-precision UTC output.

Evidence screenshots saved locally: `C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/ahmad-recurring-fixed.png` and `C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/ahmad-clean-after-qa.png`.

Recurring edits remain deliberately disabled. Cloud-recording playback/download, user logout, and ending an active Zoom call were not exercised during this live run. The following sections describe earlier offline and redesign checks, not additional live-account actions.

## Current safety follow-up

This follow-up uses source inspection and offline regression tests only, following the user's restriction on business accounts. No browser interactions, live booking, meeting edits, meeting deletion, or meeting ending were performed. The browser results below are historical redesign checks, not a new live verification of these fixes.

- PASS: `npm test` runs ten offline regression tests. The runner blocks outbound `fetch`, HTTP, and HTTPS requests.
- PASS: `npm run build` and `npm run lint` complete without errors or lint warnings.
- PASS: occurrence deletion includes `delete_option: occurrence` and the selected occurrence ID. Whole-series deletion requires an explicit scope choice in the dialog. Missing scope or occurrence identity is rejected.
- PASS: single-meeting edit payloads use `YYYY-MM-DD HH:mm` in WIB. Invalid topic, duration, or timestamp cannot produce an update payload.
- GUARDED: editing recurring meetings is disabled in the UI and rejected by the payload builder. The existing backend cannot safely preserve recurrence or target one occurrence during an edit. Full recurring edit support remains deferred.
- PASS: default booking dates follow Jakarta midnight, including year rollover. The recurring cutoff covers the entire final WIB day.
- PASS: schedule row identity includes account and occurrence; recording identity distinguishes UUID, account, and session start time.
- PASS: query data is cleared at logout and login. Regression tests verify that a previous profile and late query result cannot repopulate the new session's cache.
- PASS: booking schema rejects empty and whitespace-only topics; the booking input now receives the field error and its accessibility attributes.
- SOURCE REVIEW PASS: schedule and recording queries use submitted filters. Editing draft fields no longer changes the active query key; Apply/Search submits the filter, and Reset clears both draft and applied values.

Live contract verification is pending the dedicated test account offered by the user. Existing business accounts are excluded from that test scope. No backend files were changed.

## Validation scope

- Production compilation: `npm run build`.
- Static analysis: `npm run lint`, with no warnings or errors.
- Browser: headless Microsoft Edge with isolated API fixtures. No production records were created, edited, booked, deleted, or ended.
- Routes: dashboard, accounts, booking search, schedules, recordings, and profile at 320, 390, 768, 1024, and 1440 CSS pixels. Login checked at desktop and mobile sizes.
- Runtime checks: no uncaught browser errors; no broken images; no document-level horizontal overflow.
- Contrast: computed foreground/background checks on visible text at desktop and mobile sizes. Banner and login photograph text are separately protected by navy scrims.
- Interaction checks: empty login validation, password visibility, login, refresh, account details and Escape dismissal, account create validation and submission, credential visibility, account edit/delete/connection check, availability search, recurring booking fields and booking success, schedule tabs/details/edit/end confirmation, recording expansion/share, and logout. Mutation checks use fixtures.
- Loading, empty, and failed-request views checked on the five data routes. Modal scrolling, keyboard focus containment, and Escape dismissal checked on mobile.
- The original Flutter logo and copied web master have identical SHA-256 hashes: `C8AB19CE4C6D2E64E230968D83EC79934B36F891487D87A5CB837E3C7A552D74`.

Live authentication, Zoom API connectivity, playback, downloads, and production writes require the configured backend and a real signed-in account. Fixture verification establishes UI behavior, not service availability.

## Antislop delivery gate

### Hard gate

- R-02 PASS: no em dashes in displayed application copy or the HTML title.
- R-03 PASS: six workspace routes checked at five widths; zero document overflow. Tables reflow into labeled mobile rows.
- R-17 PASS: summaries derive from API account records; no promotional statistics added.
- R-18 PASS: no testimonials or generated people added.
- R-23 PASS: user requested the same Flutter logo and style; existing logo, symbols, scenes, and photographs reused. Sources recorded in `public/ASSET_SOURCES.md`.
- R-24 PASS: all navigation destinations exist in the router.
- R-25 PASS: automated visible-text contrast checks returned no failures; navy scrims isolate photograph text. Inputs and selects use the darker Flutter secondary-text color for their boundaries.
- R-26 PASS: controls have navigation, form, state, clipboard, API, or explicit external-link handlers. Core flows checked in the isolated browser.
- R-27 PASS: five data-route loading, empty, and failed-request views checked. Login exposes validation and request errors.
- R-28 PASS: no FAQ exists.
- R-32 PASS: labeled navigation, associated form labels, password toggle names, visible focus treatment, skip link, and keyboard-accessible detail buttons. Radix dialogs retain focus containment and Escape dismissal.
- R-33 PASS: application changes were written directly to source; asset conversion only optimized existing photographs.
- R-34 PASS: only the light theme from Flutter is provided; no theme toggle exists.
- R-35 PASS: production build, static checks, route checks, screenshots, and interaction checks completed.
- R-36 PASS: removed unsupported security copy and fabricated profile fallbacks. No new compliance or performance claims appear in the product.
- R-37 PASS: explicit Flutter design reference and ENERGY 1 / RHYTHM 2 / MOTION 1 recorded in `DESIGN.md`.
- R-38 PASS: production content comes from API records; screenshots use isolated test fixtures. No sample records are bundled into the app.

### Purpose gate

- R-01 PASS: gradients are restricted to photograph scrims, protecting text contrast.
- R-04 PASS: primary symbols reuse the Flutter aperture family; utility symbols retain specific meanings such as edit, delete, refresh, and password visibility.
- R-06 PASS: bundled Inter matches Flutter. Monospace is restricted to keys and identifiers.
- R-07 PASS: no background grids or dot patterns.
- R-08 PASS: chevrons indicate navigation to account details; no decorative arrows on primary buttons.
- R-09 PASS: badges convey actual account/meeting states; no promotional badges.
- R-10 PASS: glass treatment is restricted to mobile navigation and the dialog backdrop.
- R-12 PASS: cards use borders; stronger shadows indicate modal elevation.
- R-13 PASS: no glow effects.
- R-14 PASS: repeated account cards compare the same fields; the summary strip and page banner have distinct hierarchy.
- R-19 PASS: movement is limited to short interaction feedback and loading. Reduced-motion preferences disable animation and transitions.
- R-22 PASS: original Flutter empty-state scenes reference accounts, calendars, search, and recordings.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 declared before implementation and recorded in `DESIGN.md`.
- Dial consistency PASS: restrained palette, varied banner/summary/data composition, limited motion.
- Focal point PASS: contextual workplace banner leads each operational page; login emphasizes the sign-in form.
- Whitespace PASS: navigation, page banner, summary, and account data have distinct spacing.
- Accent PASS: cyan-blue indicates availability and supports the primary navy actions; other colors only encode status.
- Identity PASS: shared Monitor monogram, aperture symbols, Inter typography, and workplace imagery connect web and Flutter.
- Design read PASS: corporate meeting-account workspace matching Flutter, recorded before implementation.

### Craft and consistency

- C-1 PASS: palette, typography, corners, imagery, navigation, and motion have written reasons in `DESIGN.md`.
- C-2 PASS: core interactions checked with fixtures; external-service limits stated above.
- C-3 PASS: pages serve existing account, booking, schedule, recording, and profile tasks.
- C-4 PASS: responsive layouts, data states, keyboard dialogs, focus styling, and reduced-motion behavior implemented and inspected.
- C-5 PASS: no invented customers, statistics, organization details, or testimonials.
- R-05 PASS: operational layout follows content: banner, summary strip, accounts, filters, tables, and recording files.
- R-11 PASS: card, control, avatar, and navigation corner radii differ by function.
- R-15 PASS: actions name tasks such as searching accounts, adding accounts, booking, and refreshing status.
- R-16 PASS: no AI marketing badges or buzzwords added.
- R-20 PASS: the shared Flutter mark, symbol family, colors, photos, and typography identify Zoom Monitor.
- R-21 PASS: light theme follows the existing Flutter reference.
- R-29 PASS: navy/slate neutrals and one cyan accent; rose/ochre reserved for status.
- R-30 PASS: the existing product's Flutter application supplies the reference.
- R-31 PASS: major visual decisions have explicit one-line reasons in `DESIGN.md`.

## Neumorphism and schedule redesign — 19 October 2026

This section supersedes the earlier visual treatment where it differs. User direction: redesign the Mendatang table, apply neumorphism across the web, and preserve the original blue identity. ENERGY 1 / RHYTHM 2 / MOTION 1 remain unchanged.

- Four semantic columns group meeting identity, WIB schedule/duration, account/host, and actions. Mendatang is the initial tab. Long titles wrap without truncation. Types 3 and 8 share the Berulang label.
- At 700 px of available result-panel width, rows become labeled cards. This accommodates a sidebar on medium screens as well as phones. The table caption and column scopes remain present; the browser accessibility tree still exposes the table and rows.
- Raised cards and inset fields/navigation implement the requested neumorphism. Primary actions retain navy fills; field borders remain explicit. Logo geometry and blue palette are preserved. Shared cards, inputs, buttons, dialogs, dashboard summary, login shell, and navigation receive the treatment.
- Text contrast against #EAF0F7: main text 13.17:1, secondary text 5.22:1, destructive text 5.36:1. White on navy is 10.79:1. Field boundary #71859E is 3.30:1 against the field background. Disabled controls are exempt. Focus and reduced-motion rules remain active.
- Actual SchedulesPage rendered into an isolated local preview using a seeded QueryClient and the offline network guard. Three synthetic records cover one-time, recurring, and long-title rows. Desktop 1280 px and phone 390 px were visually inspected through browser screenshots. Preview code is ignored under node_modules/.cache and is absent from the production bundle. Static preview does not validate interaction handlers.
- The running authenticated dashboard and schedules page were inspected read-only for integration. No booking, editing, deleting, ending, or account changes were performed. Existing mutation handlers and confirmation dialogs are retained.
- All 10 offline tests passed; lint passed; production build passed. The regression suite covers recurring-edit protection, explicit deletion scope, WIB dates, validation, and session cache isolation.
- Screenshots: C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/neumorphism-desktop.png and neumorphism-mobile.png. These show synthetic preview records.

Delivery gate: hierarchy, reusable components, mobile reflow, explicit labels, reduced motion, empty/loading/error branches, original brand assets, and production build checked. Broader historical gates above were not rerun in full for this visual change; no new claims about live Zoom mutation or playback testing are made.

Follow-up refinement: sidebar and top bar now use the exact page background, with no hard separating borders. Low-opacity directional shadows provide a soft edge. The selected navigation item uses an inset surface and navy text without a contrasting vertical stripe. The running schedules page was inspected and saved as C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/soft-sidebar-topbar.png. Detail appears first in both visual order and keyboard order.

## Cache and background-refresh optimization — 19 October 2026

Investigation found dashboard polling at 30 seconds, schedule polling at 60 seconds, global freshness of only 10 seconds, and focus-triggered refetching. No interval called document reload. The only explicit hard navigation was login after refresh-token failure; the existing reactive route guard can perform that transition without reloading the document.

Changes: per-resource freshness (accounts/profile/specs 5 minutes, recordings 2 minutes, schedules 60 seconds, dashboard/status 30 seconds), inactive memory-cache lifetime 15 minutes, focus refetch disabled except availability, and explicit hidden-tab polling suspension. Existing cached rows remain visible during refetch and after a refetch error. Dashboard automatic polling no longer shows the manual refresh spinner. An inline schedule status reserves vertical space and does not replace the result list. Dashboard cached-data errors also use the existing text area instead of inserting a full alert above cards. Account clock updates align with minute boundaries instead of running every second.

Polling endpoints and recordings accept AbortSignal. Successful meeting actions invalidate availability, dashboard, and schedule caches. Repeating the same availability search now explicitly rechecks the backend. Availability has zero freshness to avoid treating cached slots as current. Existing login/logout cache clearing remains intact. No cache persistence or service worker was introduced.

Offline regression coverage checks fresh-cache reuse, concurrent-request deduplication, invalidation, retained rows during background fetching and failure, unchanged-data reference sharing, query policies, cancellation on leaving an observed view, and expired refresh without requiring window.location. Real Zoom accounts and meetings were not mutated during this work. Browser inspection uses the existing schedules page; the automated regression suite prohibits network requests.

Reference: https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching and https://tanstack.com/query/latest/docs/framework/react/guides/caching .

Validation result: all 16 offline regression tests passed; production build and lint passed. Vite test servers disable WebSocket listeners so parallel tests do not compete with the running development server. Remaining boundary: first visits or newly submitted filters without cached data still show initial loading; only background refresh preserves an already loaded result set.

## Booking search automatic requests corrected — 19 October 2026

Supersedes the availability focus exception above. Evidence: SearchBookingPage mounted an enabled availability query immediately, and the availability query defaults explicitly allowed focus refetch with zero freshness. That combination produced unsolicited requests when opening the page or returning to the tab. It was data refetching, not interval-driven document reload.

Availability observers are now disabled by default. Form submission explicitly fetches the submitted query key; every manual search is fresh, including identical parameters. Mount, focus, reconnect, invalidation, polling, and automatic retry cannot initiate availability requests. Retry and successful booking retain their explicit result-refresh behavior. The initial page shows instructions instead of implying a completed empty search. Room actions are disabled while a search is pending or has failed, preventing use of old cached availability during a new check. The API receives AbortSignal for canceled searches.

A new offline regression verifies zero requests on mount/focus/reconnect/invalidation and two fresh requests for two explicit searches. All 17 tests passed; build and lint passed. The running booking page was inspected read-only and shows the initial manual-search state. No real booking or meeting/account change was performed.

## Institutional branding — 29 October 2026

User direction: use the official Pemerintah Provinsi Sumatera Utara emblem, adapt labels to Diskominfo Provinsi Sumatera Utara, retain the existing blue interface, and assign visible copyright to Dinas Komunikasi dan Informatika Provinsi Sumatera Utara.

- Official full-size and favicon PNGs downloaded from the Diskominfo website, with source URLs recorded in public/ASSET_SOURCES.md. Original full colors, transparency, and proportions are preserved; CSS uses object-fit: contain without cropping or rounded clipping.
- Login, sidebar, mobile header, document title, favicon, banner eyebrow, page descriptions, navigation, and relevant form labels reflect the institution. Company-specific language was removed from the active interface. API identifiers, routes, account data, and blue color tokens were preserved.
- A shared copyright component displays the full requested organization name on login and every authenticated route. The year is evaluated in Asia/Jakarta. Mobile footers reserve room above the navigation bar.
- The running login page was inspected at desktop and 390 px mobile widths. An isolated SSR preview of the actual AppLayout and SchedulesPage, using synthetic query data and the offline network guard, verified the sidebar logo and copyright above mobile navigation. No real account or meeting was changed; no sign-in was performed.
- All 17 offline tests passed. Production build and lint passed without warnings. No new behavior tests were added for copy and asset placement.
- Evidence: C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/diskominfo-login-desktop.png, diskominfo-login-mobile.png, diskominfo-shell-desktop.png, and diskominfo-copyright-mobile.png.

Earlier visual gates that refer to the original Monitor monogram are superseded by this user-requested institutional identity. Existing photographs, navigation symbols, typography, neumorphism, and color palette remain in use.

## Application name — 29 October 2026

At the user's request, the application name is now Sistem Informasi Pengelolaan Virtual Meeting, written in full without an acronym. Login heading/footer, shared page-banner label, browser title, documentation headings, and package metadata use the new name. No active interface reference to Zoom Monitor remains. Existing repository URLs and historical asset provenance retain their original names. The provincial emblem, institutional copyright, palette, API behavior, and routes are unchanged. Production build and lint passed; the running login page confirms the full name in the heading, footer, and browser title.

Copy preference: user prefers established English product terms. Login description now reads "Monitoring akun Zoom, booking jadwal meeting, dan pengelolaan rekaman meeting Diskominfo Provinsi Sumatera Utara." Feature labels use Monitoring and Booking; booking navigation, page headings, and relevant actions follow the same terms. Browser preview verified; build and lint passed. No behavior changes.

## Kolaborasi Sumut Berkah companion mark — 29 October 2026

At the user's request, the official white Kolaborasi Sumut Berkah PNG from https://disdik.sumutprov.go.id/web/img/kolaborasi-sumut-berkah.png accompanies the provincial emblem in login, desktop sidebar, and mobile header. Asset provenance is recorded in public/ASSET_SOURCES.md. The source image is unchanged; CSS preserves its aspect ratio, with existing navy backing for contrast. The provincial emblem remains the favicon.

Running login was visually inspected on desktop and at 390 px. An isolated SSR preview of the actual application layout verified the desktop pair and mobile header at 320 px with synthetic data and the offline network guard. Mobile route title is omitted from the compact header because the page retains its own heading. The sidebar's optional note is hidden on short viewports to reserve navigation space. Build and lint passed. No account data, API behavior, or meeting was changed.

Screenshots: C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/kolaborasi-login-desktop.png, kolaborasi-login-mobile.png, and kolaborasi-mobile-header.png.

## Transparent companion logo — 29 October 2026

The supplied official PNG was confirmed RGBA with an alpha range of 0–255; the visible blue rectangle came from CSS, not the source image. Following the user's transparency request, the rectangle, padding, rounded corners, and login border were removed. The original PNG alpha channel now supplies a CSS mask, rendered navy on light sidebar/header surfaces and white on login. The component retains its accessible image name and source proportions. This is a CSS color treatment of the existing official PNG, not a newly sourced dark PNG variant or altered raster file.

Login and the actual application layout rendered with isolated synthetic data were visually checked. Evidence: C:/Users/AHMAD SYAH/.codex/tmp/zoom-monitor-preview/kolaborasi-transparent-login.png and kolaborasi-transparent-sidebar.png. Build and lint passed; no real accounts or meetings were changed.
