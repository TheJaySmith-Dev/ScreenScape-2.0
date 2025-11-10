# IMAX Trailers Collection

This folder hosts the manifest and structure for the IMAX trailers collection.

Contents:

- `manifest.json` — Generated catalog of IMAX-labeled trailers from TMDb (YouTube keys), including metadata (title, release date, runtime) and available videos.
- `videos/` — Placeholder directory for downloadable media files if provided later.
- `metadata/` — Placeholder directory for extended technical specs per title if provided later.
- `checksums/` — Placeholder directory for integrity files (e.g., SHA256) when assets are added.

Generate the manifest:

```
TMDB_API_KEY=your_tmdb_key node scripts/build_imax_manifest.js
```

Notes:

- The manifest relies on publicly available TMDb + YouTube references. It does not include raw media files.
- High-resolution masters, original aspect ratios, and multi-track audio (e.g., 5.1, 7.1, IMAX mixes) require studio/rights-holder sources and are not obtainable via TMDb/YouTube APIs.
- When assets are available, place them under `videos/<Title>/` and add per-title `metadata/<Title>.json`, plus checksums in `checksums/<Title>.sha256`. The manifest can be extended to reference local files.

