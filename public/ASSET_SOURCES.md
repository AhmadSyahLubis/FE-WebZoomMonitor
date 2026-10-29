# Asset provenance

Navigation symbols, photographs, and the font are reused from the existing Zoom Monitor Flutter project at `C:/Project/FE Mobile-ZoomMonitor` at the user's request.

- `brand/zoom-monitor.svg`: original `tool/design_assets/zoom_monitor_mark.svg`, copied without changing its geometry.
- `brand/zoom-monitor-favicon.svg`: favicon generated from that original mark with the installed `logo-design` skill's `export_variants.py`.
- `icons/*.svg`: original `tool/design_assets/ui/*.svg`. These share the Flutter application's circular aperture motif. They remain stroke-based SVGs for UI use and render at their native 24 px grid.
- `images/*.webp`: existing Flutter artwork from `assets/images`, converted to WebP for web delivery. Six images total 293,914 bytes, down from 10,347,376 bytes. See the Flutter project's `assets/images/ASSET_SOURCES.md` for the original image generation prompts and provenance.
- `fonts/Inter-Variable.ttf` and `fonts/OFL-Inter.txt`: bundled Flutter font and its license.

The installed `logo-design` skill audited the source logo and navigation symbol at 99/100 each, with an informational note about retaining SVG strokes. No replacement logo was generated. A separately installed skill named `asset generator` or `icon generator` was not found in the available skill folders or plugin search during this session.

## Pemerintah Provinsi Sumatera Utara identity

At the user's request, the active web identity uses the official provincial emblem. Original colors, transparency, and the 4:5 aspect ratio are preserved. The existing navy/cyan interface palette remains unchanged.

- `brand/sumatera-utara.png`: https://diskominfo.sumutprov.go.id/img/provsu.png — 300 × 375 RGBA PNG; used for login, desktop navigation, and mobile header.
- `brand/sumatera-utara-icon.png`: https://diskominfo.sumutprov.go.id/img/provsu-small.png — 32 × 40 RGBA PNG; the favicon used by the official Diskominfo website, reused as the browser icon.
- Source website: https://diskominfo.sumutprov.go.id/ . Both files were downloaded on 29 October 2026 without visual alterations. The earlier Monitor monogram assets remain historical source assets and are no longer referenced by the active interface.
- Copyright shown in the application: Dinas Komunikasi dan Informatika Provinsi Sumatera Utara, with the current year.

## Kolaborasi Sumut Berkah logo

- `brand/kolaborasi-sumut-berkah.png`: https://disdik.sumutprov.go.id/web/img/kolaborasi-sumut-berkah.png — original 496 × 108 RGBA PNG, downloaded on 29 October 2026 from the official Dinas Pendidikan Provinsi Sumatera Utara site (https://disdik.sumutprov.go.id/site/).
- The source PNG has genuine alpha transparency (RGBA, alpha range 0–255). It is used as a CSS alpha mask: navy on light surfaces and white on the login photograph, without a rectangular backing. The PNG file and its shape are unchanged; rendering color is supplied by CSS. It accompanies the provincial emblem on login, the desktop sidebar, and the mobile header. The province's favicon remains the provincial emblem for small-size readability.
