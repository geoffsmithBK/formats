# Film & Sensor Format Comparison Tool

Interactive single-page web app that visualizes the relative sizes of film and digital sensor formats as overlapping, centered SVG rectangles drawn to scale.

## Tech Stack

Pure vanilla HTML + CSS + JavaScript. No framework, no build step, no server required. Open `index.html` directly in a browser.

## File Structure

```
index.html          Page skeleton, script/style loading
css/styles.css      All styles: layout, responsive, controls, tooltip, SVG states
js/formats.js       Pure data: FORMAT_DATA array + CATEGORY_META (colors, dash patterns)
js/app.js           All logic: rendering, state, interaction, DOM generation
```

## Architecture

- `js/formats.js` exposes `window.FORMAT_DATA` and `window.CATEGORY_META` — pure data, zero dependencies
- `js/app.js` is an IIFE implementing a simple imperative Model-View pattern
  - State: `{ selected: {id: true}, highlighted: id|null }`
  - Any state change calls `render()` which fully rebuilds the SVG
  - Formats are normalized to landscape orientation during `mergeFormatMetadata()`
- SVG coordinate system centered at origin (0,0); all rectangles share a common center
- Responsive: CSS Grid 2-column on desktop (>900px), single column on tablet/mobile

## Adding Formats

1. Append to `FORMAT_DATA` in `js/formats.js` with: `id`, `name`, `width`, `height`, `diagonal`, `category`, `medium`
2. Add color/dasharray entry to the appropriate category in `CATEGORY_META`
3. No other changes needed — controls, SVG, and details table are generated dynamically

## Key Conventions

- Dimensions are camera aperture / actual image area in mm
- Width = long edge (landscape orientation), enforced at runtime
- Aspect ratios displayed in decimal notation (e.g. 1.33:1)
- `medium` field: "Analog", "Digital", or "Both"
- Categories: 35mm Cine, 35mm Still, Digital Cine, 65mm Cine, IMAX, Medium Format Still, Large Format
