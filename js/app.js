/**
 * Film & Sensor Format Comparison Tool — Application Logic
 * Depends on: window.FORMAT_DATA, window.CATEGORY_META (from formats.js)
 */

(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  // ===== Merged data: format objects enriched with color/dasharray =====
  var formats = [];
  var formatById = {};

  // ===== State =====
  var state = {
    selected: {},   // id -> true
    highlighted: null // id or null
  };

  // ===== DOM refs =====
  var svgEl, emptyStateEl, controlsListEl, detailsSection, detailsBody, tooltipEl;

  // ===== Init =====
  function init() {
    svgEl = document.getElementById("format-svg");
    emptyStateEl = document.getElementById("empty-state");
    controlsListEl = document.getElementById("controls-list");
    detailsSection = document.getElementById("details-section");
    detailsBody = document.getElementById("details-body");
    tooltipEl = document.getElementById("tooltip");

    mergeFormatMetadata();
    buildControls();
    wireGlobalButtons();

    // Start with a useful default: select a few representative formats
    var defaults = ["ff-35mm", "4perf-s35", "gfx-eterna-og", "imax", "6x7"];
    for (var i = 0; i < defaults.length; i++) {
      if (formatById[defaults[i]]) state.selected[defaults[i]] = true;
    }
    updateControlCheckboxes();
    render();
  }

  // ===== Merge format data with category meta =====
  function mergeFormatMetadata() {
    var data = window.FORMAT_DATA;
    var meta = window.CATEGORY_META;

    for (var i = 0; i < data.length; i++) {
      var f = {};
      for (var k in data[i]) f[k] = data[i][k];

      // Normalize to landscape: long edge is always width
      if (f.height > f.width) {
        var tmp = f.width;
        f.width = f.height;
        f.height = tmp;
      }

      var catMeta = meta[f.category];
      if (catMeta && catMeta.formats[f.id]) {
        f.color = catMeta.formats[f.id].color;
        f.dasharray = catMeta.formats[f.id].dasharray;
        f.categoryLabel = catMeta.label;
        f.categoryOrder = catMeta.order;
      } else {
        f.color = "#999";
        f.dasharray = "none";
        f.categoryLabel = f.category;
        f.categoryOrder = 99;
      }

      formats.push(f);
      formatById[f.id] = f;
    }
  }

  // ===== Build Controls =====
  function buildControls() {
    // Group formats by category, sorted by category order
    var catMap = {};
    var catOrder = [];

    for (var i = 0; i < formats.length; i++) {
      var f = formats[i];
      if (!catMap[f.category]) {
        catMap[f.category] = [];
        catOrder.push({ key: f.category, order: f.categoryOrder, label: f.categoryLabel });
      }
      catMap[f.category].push(f);
    }
    catOrder.sort(function (a, b) { return a.order - b.order; });

    controlsListEl.innerHTML = "";

    for (var c = 0; c < catOrder.length; c++) {
      var cat = catOrder[c];
      var group = document.createElement("div");
      group.className = "category-group";

      // Category header checkbox
      var header = document.createElement("div");
      header.className = "category-header";
      var catCb = document.createElement("input");
      catCb.type = "checkbox";
      catCb.id = "cat-" + cat.key;
      catCb.setAttribute("data-category", cat.key);
      var catLabel = document.createElement("span");
      catLabel.className = "category-label";
      catLabel.textContent = cat.label;
      header.appendChild(catCb);
      header.appendChild(catLabel);
      header.addEventListener("click", (function (catKey, cb) {
        return function (e) {
          if (e.target === cb) return; // let native checkbox handle itself
          cb.checked = !cb.checked;
          cb.indeterminate = false;
          selectCategory(catKey, cb.checked);
        };
      })(cat.key, catCb));
      catCb.addEventListener("change", (function (catKey) {
        return function (e) {
          selectCategory(catKey, e.target.checked);
        };
      })(cat.key));
      group.appendChild(header);

      // Format rows
      var catFormats = catMap[cat.key];
      for (var j = 0; j < catFormats.length; j++) {
        var fmt = catFormats[j];
        var row = document.createElement("div");
        row.className = "format-row";
        row.setAttribute("data-format-id", fmt.id);

        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "cb-" + fmt.id;
        cb.setAttribute("data-format-id", fmt.id);

        var swatch = document.createElement("span");
        swatch.className = "format-swatch";
        swatch.style.backgroundColor = fmt.color;

        var lbl = document.createElement("label");
        lbl.htmlFor = "cb-" + fmt.id;
        lbl.textContent = fmt.name;

        var dims = document.createElement("span");
        dims.className = "format-dims";
        dims.textContent = fmt.width + "\u00D7" + fmt.height;

        row.appendChild(cb);
        row.appendChild(swatch);
        row.appendChild(lbl);
        row.appendChild(dims);

        // Checkbox change
        cb.addEventListener("change", (function (id) {
          return function (e) {
            toggleFormat(id, e.target.checked);
          };
        })(fmt.id));

        // Hover cross-linking
        row.addEventListener("mouseenter", (function (id) {
          return function () { onFormatHover(id); };
        })(fmt.id));
        row.addEventListener("mouseleave", function () { onFormatUnhover(); });

        group.appendChild(row);
      }

      controlsListEl.appendChild(group);
    }
  }

  // ===== Global Buttons =====
  function wireGlobalButtons() {
    document.getElementById("btn-select-all").addEventListener("click", selectAll);
    document.getElementById("btn-deselect-all").addEventListener("click", deselectAll);
  }

  // ===== State Mutations =====
  function toggleFormat(id, checked) {
    if (checked) {
      state.selected[id] = true;
    } else {
      delete state.selected[id];
    }
    updateControlCheckboxes();
    render();
  }

  function selectAll() {
    for (var i = 0; i < formats.length; i++) {
      state.selected[formats[i].id] = true;
    }
    updateControlCheckboxes();
    render();
  }

  function deselectAll() {
    state.selected = {};
    updateControlCheckboxes();
    render();
  }

  function selectCategory(catKey, checked) {
    for (var i = 0; i < formats.length; i++) {
      if (formats[i].category === catKey) {
        if (checked) {
          state.selected[formats[i].id] = true;
        } else {
          delete state.selected[formats[i].id];
        }
      }
    }
    updateControlCheckboxes();
    render();
  }

  // ===== Update control checkboxes to match state =====
  function updateControlCheckboxes() {
    // Individual checkboxes
    var cbs = controlsListEl.querySelectorAll('input[data-format-id]');
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = !!state.selected[cbs[i].getAttribute("data-format-id")];
    }

    // Category checkboxes (checked / indeterminate)
    var catCbs = controlsListEl.querySelectorAll('input[data-category]');
    for (var i = 0; i < catCbs.length; i++) {
      var catKey = catCbs[i].getAttribute("data-category");
      var total = 0, checked = 0;
      for (var j = 0; j < formats.length; j++) {
        if (formats[j].category === catKey) {
          total++;
          if (state.selected[formats[j].id]) checked++;
        }
      }
      catCbs[i].checked = checked === total && total > 0;
      catCbs[i].indeterminate = checked > 0 && checked < total;
    }
  }

  // ===== Render =====
  function render() {
    renderSVG();
    renderDetails();
  }

  // ===== SVG Rendering =====
  function renderSVG() {
    // Collect selected formats, sorted largest area first
    var selected = [];
    for (var i = 0; i < formats.length; i++) {
      if (state.selected[formats[i].id]) {
        selected.push(formats[i]);
      }
    }

    // Empty state
    if (selected.length === 0) {
      svgEl.innerHTML = "";
      emptyStateEl.classList.remove("hidden");
      return;
    }
    emptyStateEl.classList.add("hidden");

    selected.sort(function (a, b) {
      return (b.width * b.height) - (a.width * a.height);
    });

    // Compute viewBox
    var maxW = 0, maxH = 0;
    for (var i = 0; i < selected.length; i++) {
      if (selected[i].width > maxW) maxW = selected[i].width;
      if (selected[i].height > maxH) maxH = selected[i].height;
    }
    var pad = Math.max(maxW, maxH) * 0.18;
    var vbW = maxW + pad * 2;
    var vbH = maxH + pad * 2;
    svgEl.setAttribute("viewBox",
      (-vbW / 2) + " " + (-vbH / 2) + " " + vbW + " " + vbH);

    // Stroke width proportional to view size
    var strokeW = Math.max(maxW, maxH) * 0.003;
    var highlightStrokeW = strokeW * 2.5;
    var fontSize = Math.max(maxW, maxH) * 0.022;
    var smallFontSize = fontSize * 0.75;

    // Build SVG content
    var frag = document.createDocumentFragment();

    // Crosshair
    var chLen = Math.max(maxW, maxH) * 0.015;
    var chStroke = strokeW * 0.5;
    var lineH = createSVGElement("line", {
      x1: -chLen, y1: 0, x2: chLen, y2: 0,
      stroke: "#bbb", "stroke-width": chStroke
    });
    var lineV = createSVGElement("line", {
      x1: 0, y1: -chLen, x2: 0, y2: chLen,
      stroke: "#bbb", "stroke-width": chStroke
    });
    frag.appendChild(lineH);
    frag.appendChild(lineV);

    // Format rectangles (largest first = back)
    for (var i = 0; i < selected.length; i++) {
      var f = selected[i];
      var g = createFormatGroup(f, i, selected.length, strokeW, highlightStrokeW, fontSize, smallFontSize, maxH);
      frag.appendChild(g);
    }

    svgEl.innerHTML = "";
    svgEl.appendChild(frag);
  }

  function createFormatGroup(f, index, total, strokeW, highlightStrokeW, fontSize, smallFontSize, maxH) {
    var g = createSVGElement("g", {
      "class": "format-group",
      "data-format-id": f.id
    });

    var isHighlighted = state.highlighted === f.id;
    var hasSomeHighlight = state.highlighted !== null;
    if (hasSomeHighlight && !isHighlighted) {
      g.setAttribute("class", "format-group dimmed");
    } else if (isHighlighted) {
      g.setAttribute("class", "format-group highlighted");
    }

    var sw = isHighlighted ? highlightStrokeW : strokeW;

    var rect = createSVGElement("rect", {
      x: -f.width / 2,
      y: -f.height / 2,
      width: f.width,
      height: f.height,
      fill: "none",
      stroke: f.color,
      "stroke-width": sw,
      "stroke-dasharray": f.dasharray === "none" ? "" : f.dasharray
    });
    g.appendChild(rect);

    // Label — stagger vertically by index near top-right corner
    var labelX = f.width / 2 + strokeW * 2;
    // Stagger labels from top of the rect downward
    var labelYBase = -f.height / 2;
    var labelYOffset = fontSize * 1.4 * index;
    var labelY = labelYBase + fontSize + labelYOffset;

    // Clamp label within viewBox roughly
    if (labelY > f.height / 2) {
      labelY = -f.height / 2 + fontSize;
    }

    var text = createSVGElement("text", {
      x: labelX,
      y: labelY,
      fill: f.color,
      "font-size": fontSize,
      "font-family": "-apple-system, BlinkMacSystemFont, sans-serif",
      "font-weight": isHighlighted ? "700" : "500",
      "dominant-baseline": "auto"
    });
    text.textContent = f.name;
    g.appendChild(text);

    // Dimension sub-label
    var dimText = createSVGElement("text", {
      x: labelX,
      y: labelY + smallFontSize * 1.3,
      fill: f.color,
      "font-size": smallFontSize,
      "font-family": "-apple-system, BlinkMacSystemFont, sans-serif",
      "font-weight": "400",
      opacity: 0.7,
      "dominant-baseline": "auto"
    });
    dimText.textContent = f.width + " \u00D7 " + f.height + " mm";
    g.appendChild(dimText);

    // Interaction handlers
    g.addEventListener("mouseenter", function (e) {
      onFormatHover(f.id);
      showTooltip(f, e);
    });
    g.addEventListener("mousemove", function (e) {
      moveTooltip(e);
    });
    g.addEventListener("mouseleave", function () {
      onFormatUnhover();
      hideTooltip();
    });
    g.addEventListener("click", function () {
      // Toggle selection
      if (state.selected[f.id]) {
        delete state.selected[f.id];
      } else {
        state.selected[f.id] = true;
      }
      updateControlCheckboxes();
      render();
    });

    return g;
  }

  // ===== Details Table =====
  function renderDetails() {
    var selected = [];
    for (var i = 0; i < formats.length; i++) {
      if (state.selected[formats[i].id]) {
        selected.push(formats[i]);
      }
    }

    if (selected.length === 0) {
      detailsSection.classList.add("hidden");
      return;
    }
    detailsSection.classList.remove("hidden");

    // Sort by diagonal descending
    selected.sort(function (a, b) { return b.diagonal - a.diagonal; });

    detailsBody.innerHTML = "";
    for (var i = 0; i < selected.length; i++) {
      var f = selected[i];
      var tr = document.createElement("tr");
      tr.setAttribute("data-format-id", f.id);

      var isHighlighted = state.highlighted === f.id;
      var hasSomeHighlight = state.highlighted !== null;
      if (hasSomeHighlight && !isHighlighted) {
        tr.className = "dimmed";
      } else if (isHighlighted) {
        tr.className = "highlighted";
      }

      // Name cell with swatch
      var tdName = document.createElement("td");
      var sw = document.createElement("span");
      sw.className = "detail-swatch";
      sw.style.backgroundColor = f.color;
      tdName.appendChild(sw);
      tdName.appendChild(document.createTextNode(f.name));
      tr.appendChild(tdName);

      tr.appendChild(makeCell(f.width.toFixed(2)));
      tr.appendChild(makeCell(f.height.toFixed(2)));
      tr.appendChild(makeCell(f.diagonal.toFixed(2)));
      tr.appendChild(makeCell(computeAspectRatio(f.width, f.height)));
      tr.appendChild(makeCell(f.medium || "—"));
      tr.appendChild(makeCell(f.categoryLabel));

      // Hover cross-linking
      tr.addEventListener("mouseenter", (function (id) {
        return function () { onFormatHover(id); };
      })(f.id));
      tr.addEventListener("mouseleave", function () { onFormatUnhover(); });

      detailsBody.appendChild(tr);
    }
  }

  function makeCell(text) {
    var td = document.createElement("td");
    td.textContent = text;
    return td;
  }

  function computeAspectRatio(w, h) {
    return (w / h).toFixed(2) + ":1";
  }

  // ===== Tooltip =====
  function showTooltip(f, e) {
    var ar = computeAspectRatio(f.width, f.height);
    tooltipEl.innerHTML =
      '<div class="tt-name">' + escapeHTML(f.name) + '</div>' +
      '<div class="tt-row">Width: ' + f.width + ' mm</div>' +
      '<div class="tt-row">Height: ' + f.height + ' mm</div>' +
      '<div class="tt-row">Diagonal: ' + f.diagonal + ' mm</div>' +
      '<div class="tt-row">Aspect: ' + ar + '</div>' +
      '<div class="tt-row">Category: ' + escapeHTML(f.categoryLabel) + '</div>';
    tooltipEl.classList.add("visible");
    moveTooltip(e);
  }

  function moveTooltip(e) {
    var x = e.clientX + 14;
    var y = e.clientY + 14;
    // Keep tooltip on screen
    var rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) {
      x = e.clientX - rect.width - 10;
    }
    if (y + rect.height > window.innerHeight - 8) {
      y = e.clientY - rect.height - 10;
    }
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top = y + "px";
  }

  function hideTooltip() {
    tooltipEl.classList.remove("visible");
  }

  // ===== Hover Cross-linking =====
  function onFormatHover(id) {
    state.highlighted = id;
    applyHighlightState();
  }

  function onFormatUnhover() {
    state.highlighted = null;
    applyHighlightState();
  }

  function applyHighlightState() {
    var id = state.highlighted;

    // Controls rows
    var rows = controlsListEl.querySelectorAll(".format-row");
    for (var i = 0; i < rows.length; i++) {
      var rowId = rows[i].getAttribute("data-format-id");
      rows[i].classList.remove("highlighted", "dimmed");
      if (id !== null) {
        rows[i].classList.add(rowId === id ? "highlighted" : "dimmed");
      }
    }

    // SVG groups
    var groups = svgEl.querySelectorAll(".format-group");
    for (var i = 0; i < groups.length; i++) {
      var gId = groups[i].getAttribute("data-format-id");
      groups[i].classList.remove("highlighted", "dimmed");
      if (id !== null) {
        groups[i].classList.add(gId === id ? "highlighted" : "dimmed");
      }
    }

    // Boost stroke width on highlighted SVG rect
    for (var i = 0; i < groups.length; i++) {
      var gId = groups[i].getAttribute("data-format-id");
      var r = groups[i].querySelector("rect");
      if (r) {
        var f = formatById[gId];
        if (f) {
          var maxDim = 10; // recalc rough max
          var sel = getSelectedFormats();
          for (var j = 0; j < sel.length; j++) {
            if (sel[j].width > maxDim) maxDim = sel[j].width;
            if (sel[j].height > maxDim) maxDim = sel[j].height;
          }
          var baseStroke = maxDim * 0.003;
          r.setAttribute("stroke-width", gId === id ? baseStroke * 2.5 : baseStroke);
        }
      }
      // Bold label text on highlight
      var texts = groups[i].querySelectorAll("text");
      if (texts.length > 0) {
        texts[0].setAttribute("font-weight", groups[i].getAttribute("data-format-id") === id ? "700" : "500");
      }
    }

    // Details table rows
    var trs = detailsBody.querySelectorAll("tr");
    for (var i = 0; i < trs.length; i++) {
      var trId = trs[i].getAttribute("data-format-id");
      trs[i].classList.remove("highlighted", "dimmed");
      if (id !== null) {
        trs[i].classList.add(trId === id ? "highlighted" : "dimmed");
      }
    }
  }

  function getSelectedFormats() {
    var result = [];
    for (var i = 0; i < formats.length; i++) {
      if (state.selected[formats[i].id]) result.push(formats[i]);
    }
    return result;
  }

  // ===== SVG Helpers =====
  function createSVGElement(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    return el;
  }

  // ===== Utility =====
  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Boot =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
