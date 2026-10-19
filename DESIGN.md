# Zoom Monitor web

Design reference: the existing Flutter application at `C:/Project/FE Mobile-ZoomMonitor`. The web application shares its visual identity while using layouts suited to larger screens.

- Primary navy: `#173D72`; dark navy: `#10243F`; accent: `#087EAE`.
- Background: `#F2F5F9`; cards: white; text: `#14273E`; secondary text: `#536579`; separators: `#D8E2EB`.
- Status colors follow Flutter: blue for available accounts, muted rose for meetings, ochre for scheduled meetings, and slate for connection errors. Every status has a visible text label.
- Inter is bundled locally, matching Flutter. Numeric summaries use tabular figures where useful. Monospace is reserved for identifiers and keys.
- The existing Monitor monogram and circular aperture detail identify both applications. The original logo geometry is preserved. Navigation, status icons, and empty states reuse Flutter's original SVG family.
- Workplace photographs provide context on login and page banners. A navy scrim keeps white text readable. The banner is the focal point; controls and account status take priority below it.
- Cards use 20 px corners; inputs and primary controls use 12–14 px corners. Borders group operational data without making every surface float.
- Desktop uses a light sidebar. Mobile uses five labeled navigation destinations in a floating glass surface, matching Flutter navigation. Main content reserves space below the bar and respects safe-area insets.
- Tables become labeled account and meeting rows on mobile. Filters use one, two, or four columns according to available space.
- Motion is limited to loading feedback and short state transitions. Reduced-motion preferences disable animation.

Design read: corporate meeting-account workspace for company operators, following the existing Flutter application's restrained visual language. ENERGY 1 / RHYTHM 2 / MOTION 1.

The interface consumes the existing API. Preview records used for visual testing are isolated browser fixtures and are not bundled in the application.
