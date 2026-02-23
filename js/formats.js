/**
 * Format data and category metadata for Film & Sensor Format Comparison Tool.
 * Pure data — no dependencies.
 */

window.FORMAT_DATA = [
  { id: "3perf-s35",      name: "3-Perf Super 35",              width: 24.89,  height: 13.86, diagonal: 28.48, category: "35mm-cine",    medium: "Both" },
  { id: "4perf-s35",      name: "4-Perf Super 35",              width: 24.89,  height: 18.66, diagonal: 31.11, category: "35mm-cine",    medium: "Both" },
  { id: "2x-anamorphic",  name: "2x Anamorphic (de-squeezed)",  width: 41.92,  height: 17.53, diagonal: 45.44, category: "35mm-cine",    medium: "Both" },
  { id: "ff-35mm",        name: "Full Frame 35mm Still",         width: 36.00,  height: 24.00, diagonal: 43.27, category: "35mm-still",   medium: "Both" },
  { id: "vistavision",    name: "VistaVision",                   width: 37.72,  height: 24.92, diagonal: 45.21, category: "35mm-cine",    medium: "Both" },
  { id: "alexa65",        name: "ARRI Alexa 65",                 width: 54.12,  height: 25.58, diagonal: 59.87, category: "digital",      medium: "Digital" },
  { id: "gfx-eterna-og",  name: "GFX Eterna 55 (Open Gate)",    width: 43.60,  height: 32.70, diagonal: 54.50, category: "digital",      medium: "Digital" },
  { id: "todd-ao",        name: "Todd-AO 65mm (neg)",            width: 52.63,  height: 23.01, diagonal: 57.44, category: "65mm-cine",    medium: "Analog" },
  { id: "imax",           name: "15-Perf IMAX",                  width: 70.41,  height: 52.63, diagonal: 87.93, category: "imax",         medium: "Analog" },
  { id: "645",            name: "645 Medium Format",             width: 56.00,  height: 41.50, diagonal: 69.70, category: "medium-format", medium: "Analog" },
  { id: "6x6",            name: "6x6 Medium Format",             width: 56.00,  height: 56.00, diagonal: 79.20, category: "medium-format", medium: "Analog" },
  { id: "6x7",            name: "6x7 Medium Format",             width: 56.00,  height: 70.00, diagonal: 89.65, category: "medium-format", medium: "Analog" },
  { id: "6x8",            name: "6x8 Medium Format",             width: 56.00,  height: 76.00, diagonal: 94.40, category: "medium-format", medium: "Analog" },
  { id: "4x5",            name: "4x5 Sheet Film",                width: 121.00, height: 96.00, diagonal: 154.47, category: "large-format", medium: "Analog" },
  { id: "8x10",           name: "8x10 Sheet Film",               width: 254.00, height: 203.20, diagonal: 325.36, category: "large-format", medium: "Analog" }
];

window.CATEGORY_META = {
  "35mm-cine": {
    label: "35mm Cine",
    order: 1,
    formats: {
      "3perf-s35":     { color: "#E05030", dasharray: "none" },
      "4perf-s35":     { color: "#D4782C", dasharray: "6 3" },
      "2x-anamorphic": { color: "#C89428", dasharray: "10 4" },
      "vistavision":   { color: "#BB5544", dasharray: "4 2 10 2" }
    }
  },
  "35mm-still": {
    label: "35mm Still",
    order: 2,
    formats: {
      "ff-35mm": { color: "#1A9E8F", dasharray: "none" }
    }
  },
  "digital": {
    label: "Digital Cine",
    order: 3,
    formats: {
      "alexa65":        { color: "#2EAAD4", dasharray: "none" },
      "gfx-eterna-og": { color: "#1EC4E8", dasharray: "6 3" }
    }
  },
  "65mm-cine": {
    label: "65mm Cine",
    order: 4,
    formats: {
      "todd-ao": { color: "#8B5EC8", dasharray: "none" }
    }
  },
  "imax": {
    label: "IMAX",
    order: 5,
    formats: {
      "imax": { color: "#3068D0", dasharray: "none" }
    }
  },
  "medium-format": {
    label: "Medium Format Still",
    order: 6,
    formats: {
      "645": { color: "#3AAA55", dasharray: "none" },
      "6x6": { color: "#2E8B57", dasharray: "6 3" },
      "6x7": { color: "#48B880", dasharray: "10 4" },
      "6x8": { color: "#5CAA6E", dasharray: "4 2 10 2" }
    }
  },
  "large-format": {
    label: "Large Format",
    order: 7,
    formats: {
      "4x5":  { color: "#9B7340", dasharray: "none" },
      "8x10": { color: "#7A5C30", dasharray: "8 4" }
    }
  }
};

window.IMAGE_CIRCLE_DATA = [
  { id: "s16",        name: "Super 16",          diameter: 14.54, notes: "16mm cine lenses" },
  { id: "mft",        name: "Micro Four Thirds",  diameter: 21.63, notes: "MFT mount (Panasonic, OM System)" },
  { id: "aps-c-s35",  name: "APS-C / Super 35",   diameter: 28.4,  notes: "Canon EF-S, Fuji X, Sony E (APS-C)" },
  { id: "pv",         name: "Panavision PV",       diameter: 30,    notes: "Panavision Primo, C/D/E/T series" },
  { id: "pl-s35",     name: "PL (Super 35)",       diameter: 33,    notes: "ARRI PL mount, S35 coverage" },
  { id: "ef-rf",      name: "Full Frame 35mm Still", diameter: 43.27, notes: "Canon EF/RF, Nikon Z/F, Sony FE" },
  { id: "arri-lpl",   name: "ARRI LPL",            diameter: 46,    notes: "Large PL mount, Alexa Mini LF / LF" },
  { id: "zeiss-sp",   name: "Zeiss Supreme Prime",  diameter: 46.3,  notes: "Large-format cine primes, PL/LPL mount" },
  { id: "gfx",        name: "Fujifilm G Mount",    diameter: 55,    notes: "GFX medium format system" },
  { id: "alexa65-xpl",name: "ARRI Alexa 65 XPL",   diameter: 60,    notes: "65mm format, Alexa 65 / ALEXA XT Plus" },
  { id: "mf-6x7",     name: "Medium Format 6\u00D77", diameter: 90, notes: "Mamiya RB/RZ67, Pentax 67 lenses" }
];

window.IMAGE_CIRCLE_META = {
  "s16":         { color: "#E08050" },
  "mft":         { color: "#C87838" },
  "aps-c-s35":   { color: "#D06040" },
  "pv":          { color: "#CC6644" },
  "pl-s35":      { color: "#D4782C" },
  "ef-rf":       { color: "#1A9E8F" },
  "arri-lpl":    { color: "#2EAAD4" },
  "zeiss-sp":    { color: "#5599DD" },
  "gfx":         { color: "#3AAA55" },
  "alexa65-xpl": { color: "#4488CC" },
  "mf-6x7":      { color: "#48B880" }
};
