# Asset provenance

The visual assets are reused from the existing Zoom Monitor Flutter project at `C:/Project/FE Mobile-ZoomMonitor` at the user's request.

- `brand/zoom-monitor.svg`: original `tool/design_assets/zoom_monitor_mark.svg`, copied without changing its geometry.
- `brand/zoom-monitor-favicon.svg`: favicon generated from that original mark with the installed `logo-design` skill's `export_variants.py`.
- `icons/*.svg`: original `tool/design_assets/ui/*.svg`. These share the Flutter application's circular aperture motif. They remain stroke-based SVGs for UI use and render at their native 24 px grid.
- `images/*.webp`: existing Flutter artwork from `assets/images`, converted to WebP for web delivery. Six images total 293,914 bytes, down from 10,347,376 bytes. See the Flutter project's `assets/images/ASSET_SOURCES.md` for the original image generation prompts and provenance.
- `fonts/Inter-Variable.ttf` and `fonts/OFL-Inter.txt`: bundled Flutter font and its license.

The installed `logo-design` skill audited the source logo and navigation symbol at 99/100 each, with an informational note about retaining SVG strokes. No replacement logo was generated. A separately installed skill named `asset generator` or `icon generator` was not found in the available skill folders or plugin search during this session.
