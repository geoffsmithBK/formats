/**
 * Film & Sensor Format Comparison Tool — Application Logic
 * Depends on: window.FORMAT_DATA, window.CATEGORY_META,
 *             window.IMAGE_CIRCLE_DATA, window.IMAGE_CIRCLE_META (from formats.js)
 */

(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  // ===== Reference image presets =====
  var REFERENCE_IMAGES = {
    cityscape: {
      label: "Cityscape",
      url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=4000&auto=format"
    },
    crowd: {
      label: "Crowd",
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=4000&auto=format"
    },
    portrait: {
      label: "Portrait",
      url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=4000&auto=format"
    }
  };

  // ===== Merged data: format objects enriched with color/dasharray =====
  var formats = [];
  var formatById = {};

  // ===== Merged data: image circles enriched with color =====
  var imageCircles = [];
  var circleById = {};

  // ===== State =====
  var state = {
    selected: {},           // format id -> true
    highlighted: null,      // format id or null
    circles: {},            // circle id -> true
    highlightedCircle: null,// circle id or null
    refImage: null,         // null | "cityscape" | "crowd" | "portrait" | { custom: dataUrl }
    refOpacity: 0.4         // 0.0 - 1.0
  };

  // ===== DOM refs =====
  var svgEl, emptyStateEl, controlsListEl, circlesListEl, detailsSection, detailsBody, detailsHead, tooltipEl;
  var refImageSelectEl, refImageFileEl, refOpacityRow, refOpacitySliderEl, refOpacityValueEl;

  // ===== Init =====
  function init() {
    svgEl = document.getElementById("format-svg");
    emptyStateEl = document.getElementById("empty-state");
    controlsListEl = document.getElementById("controls-list");
    circlesListEl = document.getElementById("circles-list");
    detailsSection = document.getElementById("details-section");
    detailsBody = document.getElementById("details-body");
    detailsHead = document.querySelector("#details-table thead tr");
    tooltipEl = document.getElementById("tooltip");
    refImageSelectEl = document.getElementById("ref-image-select");
    refImageFileEl = document.getElementById("ref-image-file");
    refOpacityRow = document.getElementById("ref-opacity-row");
    refOpacitySliderEl = document.getElementById("ref-opacity-slider");
    refOpacityValueEl = document.getElementById("ref-opacity-value");

    mergeFormatMetadata();
    mergeCircleData();
    buildControls();
    buildCircleControls();
    wireGlobalButtons();
    wireRefImageControls();

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

  // ===== Merge image circle data with meta =====
  function mergeCircleData() {
    var data = window.IMAGE_CIRCLE_DATA;
    var meta = window.IMAGE_CIRCLE_META;

    for (var i = 0; i < data.length; i++) {
      var c = {};
      for (var k in data[i]) c[k] = data[i][k];

      if (meta[c.id]) {
        c.color = meta[c.id].color;
      } else {
        c.color = "#999";
      }

      imageCircles.push(c);
      circleById[c.id] = c;
    }
  }

  // ===== Build Format Controls =====
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

  // ===== Build Circle Controls =====
  function buildCircleControls() {
    circlesListEl.innerHTML = "";

    for (var i = 0; i < imageCircles.length; i++) {
      var c = imageCircles[i];
      var row = document.createElement("div");
      row.className = "circle-row";
      row.setAttribute("data-circle-id", c.id);

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "cb-circle-" + c.id;
      cb.setAttribute("data-circle-id", c.id);

      var swatch = document.createElement("span");
      swatch.className = "circle-swatch";
      swatch.style.borderColor = c.color;

      var lbl = document.createElement("label");
      lbl.htmlFor = "cb-circle-" + c.id;
      lbl.textContent = c.name;

      var diam = document.createElement("span");
      diam.className = "circle-diameter";
      diam.textContent = "\u2300" + c.diameter + "mm";

      row.appendChild(cb);
      row.appendChild(swatch);
      row.appendChild(lbl);
      row.appendChild(diam);

      // Checkbox change
      cb.addEventListener("change", (function (id) {
        return function (e) {
          toggleCircle(id, e.target.checked);
        };
      })(c.id));

      // Hover cross-linking
      row.addEventListener("mouseenter", (function (id) {
        return function () { onCircleHover(id); };
      })(c.id));
      row.addEventListener("mouseleave", function () { onCircleUnhover(); });

      circlesListEl.appendChild(row);
    }
  }

  // ===== Global Buttons =====
  function wireGlobalButtons() {
    document.getElementById("btn-select-all").addEventListener("click", selectAll);
    document.getElementById("btn-deselect-all").addEventListener("click", deselectAll);
    document.getElementById("btn-circles-all").addEventListener("click", selectAllCircles);
    document.getElementById("btn-circles-none").addEventListener("click", deselectAllCircles);
  }

  // ===== Reference Image Controls =====
  function wireRefImageControls() {
    refImageSelectEl.addEventListener("change", function () {
      var val = refImageSelectEl.value;
      if (val === "") {
        state.refImage = null;
        refImageFileEl.value = "";
      } else if (val === "__custom") {
        refImageFileEl.click();
        return;
      } else {
        state.refImage = val;
        refImageFileEl.value = "";
      }
      updateRefImageUI();
      render();
    });

    refImageFileEl.addEventListener("change", function () {
      var file = refImageFileEl.files[0];
      if (!file) {
        syncRefImageDropdown();
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        state.refImage = { custom: e.target.result };
        updateRefImageUI();
        render();
      };
      reader.readAsDataURL(file);
    });

    refOpacitySliderEl.addEventListener("input", function () {
      state.refOpacity = parseInt(refOpacitySliderEl.value, 10) / 100;
      refOpacityValueEl.textContent = refOpacitySliderEl.value + "%";
      var img = svgEl.querySelector(".ref-image");
      if (img) {
        img.setAttribute("opacity", state.refOpacity);
      }
    });
  }

  function syncRefImageDropdown() {
    if (state.refImage === null) {
      refImageSelectEl.value = "";
    } else if (typeof state.refImage === "string") {
      refImageSelectEl.value = state.refImage;
    } else {
      refImageSelectEl.value = "__custom";
    }
  }

  function updateRefImageUI() {
    syncRefImageDropdown();
    refOpacityRow.style.display = state.refImage ? "flex" : "none";
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

  function toggleCircle(id, checked) {
    if (checked) {
      state.circles[id] = true;
    } else {
      delete state.circles[id];
    }
    updateCircleCheckboxes();
    render();
  }

  function selectAllCircles() {
    for (var i = 0; i < imageCircles.length; i++) {
      state.circles[imageCircles[i].id] = true;
    }
    updateCircleCheckboxes();
    render();
  }

  function deselectAllCircles() {
    state.circles = {};
    updateCircleCheckboxes();
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

  function updateCircleCheckboxes() {
    var cbs = circlesListEl.querySelectorAll('input[data-circle-id]');
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = !!state.circles[cbs[i].getAttribute("data-circle-id")];
    }
  }

  // ===== Active circles helper =====
  function getActiveCircles() {
    var result = [];
    for (var i = 0; i < imageCircles.length; i++) {
      if (state.circles[imageCircles[i].id]) result.push(imageCircles[i]);
    }
    return result;
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

    var activeCircles = getActiveCircles();

    // Empty state
    if (selected.length === 0 && activeCircles.length === 0) {
      svgEl.innerHTML = "";
      emptyStateEl.classList.remove("hidden");
      return;
    }
    emptyStateEl.classList.add("hidden");

    selected.sort(function (a, b) {
      return (b.width * b.height) - (a.width * a.height);
    });

    // Sort circles largest first
    activeCircles.sort(function (a, b) { return b.diameter - a.diameter; });

    // Compute viewBox — include both formats and circles
    var maxW = 0, maxH = 0;
    for (var i = 0; i < selected.length; i++) {
      if (selected[i].width > maxW) maxW = selected[i].width;
      if (selected[i].height > maxH) maxH = selected[i].height;
    }
    for (var i = 0; i < activeCircles.length; i++) {
      if (activeCircles[i].diameter > maxW) maxW = activeCircles[i].diameter;
      if (activeCircles[i].diameter > maxH) maxH = activeCircles[i].diameter;
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

    // Reference image (between crosshair and circles)
    if (state.refImage !== null) {
      var imgUrl;
      if (typeof state.refImage === "string") {
        imgUrl = REFERENCE_IMAGES[state.refImage] ? REFERENCE_IMAGES[state.refImage].url : null;
      } else if (state.refImage && state.refImage.custom) {
        imgUrl = state.refImage.custom;
      }

      if (imgUrl) {
        var imgW, imgH, clipCircleR;

        if (activeCircles.length > 0) {
          var largestCircle = activeCircles[0]; // already sorted largest-first
          clipCircleR = largestCircle.diameter / 2;
          imgW = largestCircle.diameter;
          imgH = largestCircle.diameter;
        } else {
          imgW = maxW;
          imgH = maxH;
        }

        if (clipCircleR) {
          var defs = createSVGElement("defs", {});
          var clipPath = createSVGElement("clipPath", { id: "ref-image-clip" });
          var clipCircle = createSVGElement("circle", {
            cx: 0, cy: 0, r: clipCircleR
          });
          clipPath.appendChild(clipCircle);
          defs.appendChild(clipPath);
          frag.appendChild(defs);
        }

        var imgAttrs = {
          "class": "ref-image",
          x: -imgW / 2,
          y: -imgH / 2,
          width: imgW,
          height: imgH,
          href: imgUrl,
          preserveAspectRatio: "xMidYMid slice",
          opacity: state.refOpacity
        };

        if (clipCircleR) {
          imgAttrs["clip-path"] = "url(#ref-image-clip)";
        }

        var imgEl = createSVGElement("image", imgAttrs);
        frag.appendChild(imgEl);
      }
    }

    // Image circles (largest first = back, behind format rects)
    for (var i = 0; i < activeCircles.length; i++) {
      var c = activeCircles[i];
      var cg = createCircleGroup(c, i, activeCircles.length, strokeW, highlightStrokeW, fontSize, smallFontSize);
      frag.appendChild(cg);
    }

    // Format rectangles (largest first = back)
    for (var i = 0; i < selected.length; i++) {
      var f = selected[i];
      var g = createFormatGroup(f, i, selected.length, strokeW, highlightStrokeW, fontSize, smallFontSize, maxH);
      frag.appendChild(g);
    }

    svgEl.innerHTML = "";
    svgEl.appendChild(frag);
  }

  function createCircleGroup(c, index, total, strokeW, highlightStrokeW, fontSize, smallFontSize) {
    var anyHighlight = state.highlighted !== null || state.highlightedCircle !== null;
    var isHighlighted = state.highlightedCircle === c.id;

    var cls = "circle-group";
    if (anyHighlight && !isHighlighted) {
      cls += " dimmed";
    } else if (isHighlighted) {
      cls += " highlighted";
    }

    var g = createSVGElement("g", {
      "class": cls,
      "data-circle-id": c.id
    });

    var sw = isHighlighted ? highlightStrokeW : strokeW * 0.8;
    var r = c.diameter / 2;

    var circle = createSVGElement("circle", {
      cx: 0,
      cy: 0,
      r: r,
      fill: c.color,
      "fill-opacity": isHighlighted ? 0.08 : 0.04,
      stroke: c.color,
      "stroke-width": sw,
      "stroke-dasharray": "4 3",
      "stroke-opacity": isHighlighted ? 1 : 0.6
    });
    g.appendChild(circle);

    // Label centered above circle
    var labelY = -r - fontSize * 0.4;
    var text = createSVGElement("text", {
      x: 0,
      y: labelY,
      fill: c.color,
      "font-size": smallFontSize,
      "font-family": "-apple-system, BlinkMacSystemFont, sans-serif",
      "font-weight": "400",
      "font-style": "italic",
      "text-anchor": "middle",
      "dominant-baseline": "auto",
      opacity: isHighlighted ? 1 : 0.7
    });
    text.textContent = c.name + " \u2300" + c.diameter + "mm";
    g.appendChild(text);

    // Interaction handlers
    g.addEventListener("mouseenter", function (e) {
      onCircleHover(c.id);
      showCircleTooltip(c, e);
    });
    g.addEventListener("mousemove", function (e) {
      moveTooltip(e);
    });
    g.addEventListener("mouseleave", function () {
      onCircleUnhover();
      hideTooltip();
    });
    g.addEventListener("click", function () {
      if (state.circles[c.id]) {
        delete state.circles[c.id];
      } else {
        state.circles[c.id] = true;
      }
      updateCircleCheckboxes();
      render();
    });

    return g;
  }

  function createFormatGroup(f, index, total, strokeW, highlightStrokeW, fontSize, smallFontSize, maxH) {
    var anyHighlight = state.highlighted !== null || state.highlightedCircle !== null;
    var isHighlighted = state.highlighted === f.id;

    var cls = "format-group";
    if (anyHighlight && !isHighlighted) {
      cls += " dimmed";
    } else if (isHighlighted) {
      cls += " highlighted";
    }

    var g = createSVGElement("g", {
      "class": cls,
      "data-format-id": f.id
    });

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

    var activeCircles = getActiveCircles();
    activeCircles.sort(function (a, b) { return a.diameter - b.diameter; });

    // Rebuild header to include/exclude coverage column
    rebuildDetailsHeader(activeCircles);

    var anyHighlight = state.highlighted !== null || state.highlightedCircle !== null;

    detailsBody.innerHTML = "";
    for (var i = 0; i < selected.length; i++) {
      var f = selected[i];
      var tr = document.createElement("tr");
      tr.setAttribute("data-format-id", f.id);

      var isHighlighted = state.highlighted === f.id;
      if (anyHighlight && !isHighlighted) {
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
      tr.appendChild(makeCell(f.medium || "\u2014"));
      tr.appendChild(makeCell(f.categoryLabel));

      // Coverage column (only when circles are active)
      if (activeCircles.length > 0) {
        var tdCov = document.createElement("td");
        tdCov.className = "coverage-cell";
        for (var j = 0; j < activeCircles.length; j++) {
          var c = activeCircles[j];
          var covered = f.diagonal <= c.diameter;
          var span = document.createElement("span");
          span.className = covered ? "coverage-ok" : "coverage-no";
          span.title = c.name + " (\u2300" + c.diameter + "mm)";
          span.textContent = covered ? "\u2713" : "\u2717";
          tdCov.appendChild(span);
        }
        tr.appendChild(tdCov);
      }

      // Hover cross-linking
      tr.addEventListener("mouseenter", (function (id) {
        return function () { onFormatHover(id); };
      })(f.id));
      tr.addEventListener("mouseleave", function () { onFormatUnhover(); });

      detailsBody.appendChild(tr);
    }
  }

  function rebuildDetailsHeader(activeCircles) {
    // Remove existing coverage th if present
    var existingCov = detailsHead.querySelector(".coverage-th");
    if (existingCov) detailsHead.removeChild(existingCov);

    if (activeCircles.length > 0) {
      var th = document.createElement("th");
      th.className = "coverage-th";
      th.textContent = "Lens Coverage";
      detailsHead.appendChild(th);
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

  function showCircleTooltip(c, e) {
    var html =
      '<div class="tt-name">' + escapeHTML(c.name) + '</div>' +
      '<div class="tt-row">Diameter: ' + c.diameter + ' mm</div>';
    if (c.notes) {
      html += '<div class="tt-row">' + escapeHTML(c.notes) + '</div>';
    }

    // Coverage analysis for selected formats
    var selectedFormats = getSelectedFormats();
    if (selectedFormats.length > 0) {
      html += '<div class="tt-coverage-header">Coverage:</div>';
      for (var i = 0; i < selectedFormats.length; i++) {
        var f = selectedFormats[i];
        var covered = f.diagonal <= c.diameter;
        var cls = covered ? "tt-coverage-ok" : "tt-coverage-no";
        var icon = covered ? "\u2713" : "\u2717";
        html += '<div class="tt-row ' + cls + '">' + icon + ' ' + escapeHTML(f.name) +
          ' (\u2300' + f.diagonal.toFixed(1) + 'mm)</div>';
      }
    }

    tooltipEl.innerHTML = html;
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
    state.highlightedCircle = null;
    applyHighlightState();
  }

  function onFormatUnhover() {
    state.highlighted = null;
    applyHighlightState();
  }

  function onCircleHover(id) {
    state.highlightedCircle = id;
    state.highlighted = null;
    applyHighlightState();
  }

  function onCircleUnhover() {
    state.highlightedCircle = null;
    applyHighlightState();
  }

  function applyHighlightState() {
    var formatId = state.highlighted;
    var circleId = state.highlightedCircle;
    var anyHighlight = formatId !== null || circleId !== null;

    // Format control rows
    var rows = controlsListEl.querySelectorAll(".format-row");
    for (var i = 0; i < rows.length; i++) {
      var rowId = rows[i].getAttribute("data-format-id");
      rows[i].classList.remove("highlighted", "dimmed");
      if (anyHighlight) {
        rows[i].classList.add(rowId === formatId ? "highlighted" : "dimmed");
      }
    }

    // Circle control rows
    var circleRows = circlesListEl.querySelectorAll(".circle-row");
    for (var i = 0; i < circleRows.length; i++) {
      var rowCid = circleRows[i].getAttribute("data-circle-id");
      circleRows[i].classList.remove("highlighted", "dimmed");
      if (anyHighlight) {
        circleRows[i].classList.add(rowCid === circleId ? "highlighted" : "dimmed");
      }
    }

    // SVG format groups
    var groups = svgEl.querySelectorAll(".format-group");
    for (var i = 0; i < groups.length; i++) {
      var gId = groups[i].getAttribute("data-format-id");
      groups[i].classList.remove("highlighted", "dimmed");
      if (anyHighlight) {
        groups[i].classList.add(gId === formatId ? "highlighted" : "dimmed");
      }
    }

    // SVG circle groups
    var cGroups = svgEl.querySelectorAll(".circle-group");
    for (var i = 0; i < cGroups.length; i++) {
      var cgId = cGroups[i].getAttribute("data-circle-id");
      cGroups[i].classList.remove("highlighted", "dimmed");
      if (anyHighlight) {
        cGroups[i].classList.add(cgId === circleId ? "highlighted" : "dimmed");
      }
    }

    // Boost stroke width on highlighted SVG rect
    var maxDim = 10;
    var sel = getSelectedFormats();
    var activeC = getActiveCircles();
    for (var j = 0; j < sel.length; j++) {
      if (sel[j].width > maxDim) maxDim = sel[j].width;
      if (sel[j].height > maxDim) maxDim = sel[j].height;
    }
    for (var j = 0; j < activeC.length; j++) {
      if (activeC[j].diameter > maxDim) maxDim = activeC[j].diameter;
    }
    var baseStroke = maxDim * 0.003;

    for (var i = 0; i < groups.length; i++) {
      var gId = groups[i].getAttribute("data-format-id");
      var r = groups[i].querySelector("rect");
      if (r) {
        r.setAttribute("stroke-width", gId === formatId ? baseStroke * 2.5 : baseStroke);
      }
      // Bold label text on highlight
      var texts = groups[i].querySelectorAll("text");
      if (texts.length > 0) {
        texts[0].setAttribute("font-weight", gId === formatId ? "700" : "500");
      }
    }

    // Boost stroke on highlighted circle
    for (var i = 0; i < cGroups.length; i++) {
      var cgId = cGroups[i].getAttribute("data-circle-id");
      var circ = cGroups[i].querySelector("circle");
      if (circ) {
        var isHL = cgId === circleId;
        circ.setAttribute("stroke-width", isHL ? baseStroke * 2.5 : baseStroke * 0.8);
        circ.setAttribute("stroke-opacity", isHL ? 1 : 0.6);
        circ.setAttribute("fill-opacity", isHL ? 0.08 : 0.04);
      }
      var cTexts = cGroups[i].querySelectorAll("text");
      if (cTexts.length > 0) {
        cTexts[0].setAttribute("opacity", cgId === circleId ? 1 : 0.7);
      }
    }

    // Details table rows
    var trs = detailsBody.querySelectorAll("tr");
    for (var i = 0; i < trs.length; i++) {
      var trId = trs[i].getAttribute("data-format-id");
      trs[i].classList.remove("highlighted", "dimmed");
      if (anyHighlight) {
        trs[i].classList.add(trId === formatId ? "highlighted" : "dimmed");
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
