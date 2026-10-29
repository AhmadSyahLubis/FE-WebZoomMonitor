# Sistem Informasi Pengelolaan Virtual Meeting — Diskominfo Provinsi Sumatera Utara

Design reference: the existing Flutter application at `C:/Project/FE Mobile-ZoomMonitor`. The web application shares its visual identity while using layouts suited to larger screens.

- Primary navy: `#173D72`; dark navy: `#10243F`; accent: `#087EAE`.
- Background and raised surfaces: `#EAF0F7`; text: `#14273E`; secondary text: `#536579`; separators: `#D0DBEA`.
- Status colors follow Flutter: blue for available accounts, muted rose for meetings, ochre for scheduled meetings, and slate for connection errors. Every status has a visible text label.
- Inter is bundled locally, matching Flutter. Numeric summaries use tabular figures where useful. Monospace is reserved for identifiers and keys.
- The official Pemerintah Provinsi Sumatera Utara emblem identifies the web application, following the user's institutional branding request. Full-color PNGs are sourced from the official Diskominfo website and displayed with object-fit: contain at their original 4:5 aspect ratio, without rounded clipping or recoloring. Navigation, status icons, and empty states continue to reuse Flutter's original SVG family.
- Workplace photographs provide context on login and page banners. A navy scrim keeps white text readable. The banner is the focal point; controls and account status take priority below it.
- At the user's request, the web uses soft neumorphism: paired cool shadows raise cards and light controls, while inset shadows identify editable fields and selected navigation. Navy primary actions and explicit borders preserve contrast; shadows never carry status alone. Cards use 20 px corners; inputs and primary controls use 12–14 px corners.
- Desktop uses a light sidebar. Mobile uses five labeled navigation destinations in a floating glass surface, matching Flutter navigation. Main content reserves space below the bar and respects safe-area insets.
- Meeting schedules open on Mendatang. Four columns group the meeting identity, date and duration, account and host, and management controls. Recurring meetings have a text badge. A labeled Detail action leads the actions visually; edit and delete retain their existing confirmation and safety logic. Below 700 px of available panel width, rows become cards, including when a sidebar narrows the content. Filters use one, two, or four columns according to available space.
- Motion is limited to loading feedback and short state transitions. Reduced-motion preferences disable animation.

Design read: corporate meeting-account workspace for company operators, following the existing Flutter application's restrained visual language. ENERGY 1 / RHYTHM 2 / MOTION 1.

The interface consumes the existing API. Preview records used for visual testing are rendered locally from the actual schedule component with a seeded QueryClient, under a network guard. They are not bundled in the application and cannot change Zoom data.

Sidebar and top bar blend into the same #EAF0F7 canvas. Hard separator borders and the active navigation stripe are removed; faint directional shadows distinguish the shell, while inset treatment and navy text identify the current destination.


Institutional wording uses Diskominfo Provinsi Sumatera Utara and rapat instansi instead of the former company workspace labels. The full organization name, Dinas Komunikasi dan Informatika Provinsi Sumatera Utara, appears on login and in copyright on login and every authenticated route. Copyright wraps on narrow screens, and the mobile footer reserves clearance for the bottom navigation. Route URLs, API identifiers, account data, and the blue color tokens are unchanged.

The official transparent Kolaborasi Sumut Berkah PNG accompanies the provincial emblem on login, desktop sidebar, and mobile header. The PNG alpha channel supplies the shape through a CSS mask, rendered navy on light surfaces and white on login. No rectangular backing is used. A single shared component controls image proportions and alternative text. The mobile header uses the space formerly occupied by the duplicate route title; each page retains its main heading. On viewports below 850 px tall, the sidebar's optional note is hidden to reserve space for both logos and navigation. Overflow remains scrollable as a fallback.
