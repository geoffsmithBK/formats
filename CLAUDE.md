# Film & Sensor Format Comparison Tool

Interactive single-page web app that visualizes the relative sizes of film and digital sensor formats as overlapping, centered SVG rectangles drawn to scale. Includes toggleable lens image circle overlays with coverage analysis and optional reference image backgrounds.

## Tech Stack

Pure vanilla HTML + CSS + JavaScript. No framework, no build step, no server required. Open `index.html` directly in a browser.

## File Structure

```
index.html          Page skeleton, script/style loading
css/styles.css      All styles: layout, responsive, controls, tooltip, SVG states
js/formats.js       Pure data: FORMAT_DATA, CATEGORY_META, IMAGE_CIRCLE_DATA, IMAGE_CIRCLE_META
js/app.js           All logic: rendering, state, interaction, DOM generation
```

## Architecture

- `js/formats.js` exposes `window.FORMAT_DATA`, `window.CATEGORY_META`, `window.IMAGE_CIRCLE_DATA`, and `window.IMAGE_CIRCLE_META` — pure data, zero dependencies
- `js/app.js` is an IIFE implementing a simple imperative Model-View pattern
  - State: `{ selected, highlighted, circles, highlightedCircle, refImage, refOpacity }`
  - Any state change calls `render()` which fully rebuilds the SVG
  - Formats are normalized to landscape orientation during `mergeFormatMetadata()`
  - Image circles are enriched with color during `mergeCircleData()`
  - `REFERENCE_IMAGES` constant in app.js maps preset keys to Unsplash CDN URLs (UI config, not format data)
- SVG coordinate system centered at origin (0,0); all rectangles and circles share a common center
- SVG layer order (back to front): crosshair, reference image (with optional circular clip), image circles (largest first), format rectangles (largest first)
- Details table sorted by diagonal ascending (smallest format first)
- Responsive: CSS Grid 2-column on desktop (>900px), single column on tablet/mobile

## Adding Formats

1. Append to `FORMAT_DATA` in `js/formats.js` with: `id`, `name`, `width`, `height`, `diagonal`, `category`, `medium`
2. Add color/dasharray entry to the appropriate category in `CATEGORY_META`
3. No other changes needed — controls, SVG, and details table are generated dynamically

## Adding Image Circles

1. Append to `IMAGE_CIRCLE_DATA` in `js/formats.js` with: `id`, `name`, `diameter`, `notes`
2. Add color entry to `IMAGE_CIRCLE_META` with matching `id` key
3. No other changes needed — circle controls, SVG circles, tooltips, and coverage column are generated dynamically

## Key Conventions

- Dimensions are camera aperture / actual image area in mm
- Width = long edge (landscape orientation), enforced at runtime
- Aspect ratios displayed in decimal notation (e.g. 1.33:1)
- `medium` field: "Analog", "Digital", or "Both"
- Categories: 35mm Cine, 35mm Still, Digital Cine, 65mm Cine, IMAX, Medium Format Still, Large Format
- Image circles rendered as dashed SVG circles with subtle tinted fill, italic centered labels
- Coverage check: `format.diagonal <= circle.diameter` means the lens covers the format
- Reference image: optional background photo clipped to largest active image circle (or format bounding box if no circles active); presets use Unsplash CDN (Unsplash license, not CC0 — free for embedding, hotlinking required)
- Reference image framed as "virtual 50mm focal length" crop simulation
- Opacity slider uses direct DOM mutation (not full re-render) for smooth dragging
- Custom image upload via FileReader is implemented but the UI option is commented out for now

## Feature Roadmap

- Re-enable custom image upload option
- More reference image presets (crowd scene, etc.)
- Crop factor / focal length equivalence calculator
- FOV angle visualization for a given focal length
- Area comparison (bar chart or multiplier readout)
- More digital cine formats (RED Monstro, Sony Venice 2, ARRI Alexa 35, BMD URSA Cine)
- Shareable state via URL hash
- Dark mode
