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
