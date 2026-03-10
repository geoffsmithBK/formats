# Film & Sensor Format Comparison Tool

Interactive single-page web app that visualizes the relative sizes of film and digital sensor formats as overlapping, centered SVG rectangles drawn to true scale.

**[Open `index.html` in any browser](index.html)** — no build step, no server, no dependencies.

## Features

- **True-scale SVG overlay** of cinema, still photography, and large format imaging areas, all centered and drawn to the same scale
- **Lens image circles** toggled independently, rendered as dashed circles with coverage analysis (does the lens cover the format?)
- **Reference image backgrounds** (Unsplash presets) clipped to the active image circle, simulating crop at a virtual 50mm focal length
- **Cross-linked hover highlighting** across controls, SVG diagram, and details table
- **Details table** with dimensions, diagonal, aspect ratio, medium, category, and per-lens coverage indicators
- **Dark mode** (default) with light mode toggle, preference saved to localStorage
- **Fully responsive** — 2-column grid on desktop, single column on mobile

## Formats Included

| Category | Formats |
|---|---|
| 35mm Cine | 3-Perf Super 35, 4-Perf Super 35, 2x Anamorphic, VistaVision |
| 35mm Still | Full Frame 35mm |
| Digital Cine | ARRI Alexa 65, GFX Eterna 55 (Open Gate) |
| 65mm Cine | Todd-AO 65mm |
| IMAX | 15-Perf IMAX |
| Medium Format | 645, 6x6, 6x7, 6x8 |
| Large Format | 4x5, 8x10 Sheet Film |

Image circles range from Super 16 (14.5mm) to Medium Format 6x7 (90mm).

## Tech Stack

Pure vanilla HTML, CSS, and JavaScript. Zero frameworks, zero build tools.

```
index.html          Page skeleton and script/style loading
css/styles.css      All styles, theming via CSS custom properties, responsive layout
js/formats.js       Pure data: FORMAT_DATA, CATEGORY_META, IMAGE_CIRCLE_DATA, IMAGE_CIRCLE_META
js/app.js           All application logic: rendering, state, interaction, DOM generation
```

## Adding Formats

1. Append to `FORMAT_DATA` in `js/formats.js` with: `id`, `name`, `width`, `height`, `diagonal`, `category`, `medium`
2. Add a color/dasharray entry to the matching category in `CATEGORY_META`
3. That's it — controls, SVG, and details table are generated dynamically

## Adding Image Circles

1. Append to `IMAGE_CIRCLE_DATA` in `js/formats.js` with: `id`, `name`, `diameter`, `notes`
2. Add a color entry to `IMAGE_CIRCLE_META` with the same `id`

## Data Sources

Dimensions represent camera aperture / actual image area in millimeters.

- [ARRI Rental](https://www.arrirental.com)
- [Widescreen Museum](https://www.widescreenmuseum.com)
- [Kodak Motion Picture Films](https://www.kodak.com/en/motion/products/camera-films)
- [Design215 Film Format Chart](https://design215.com/toolbox/film_chart.php)

## License

Reference images use the [Unsplash License](https://unsplash.com/license) (free for embedding, hotlinking required).
