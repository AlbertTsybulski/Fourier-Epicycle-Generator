/* ============================================================
   Fourier Epicycle Generator – Core Engine
   ============================================================ */

(() => {
  "use strict";

  // ──────────────────────────── DOM Elements ─────────────────────
  const canvas             = document.getElementById("mainCanvas");
  const ctx                = canvas.getContext("2d");
  const overlay            = document.getElementById("canvasOverlay");
  const container          = document.getElementById("canvasContainer");
  const toastEl            = document.getElementById("toast");

  const pathInput          = document.getElementById("pathInput");
  const loadPathBtn        = document.getElementById("loadPathBtn");
  const loadSvgFileBtn     = document.getElementById("loadSvgFileBtn");
  const svgFileInput       = document.getElementById("svgFileInput");

  const epicycleSlider     = document.getElementById("epicycleCount");
  const epicycleInput      = document.getElementById("epicycleValue");
  const speedSlider        = document.getElementById("speedSlider");
  const speedInput         = document.getElementById("speedValue");
  const sampleSlider       = document.getElementById("sampleSlider");
  const sampleInput        = document.getElementById("sampleValue");
  const trailSlider        = document.getElementById("trailSlider");
  const trailInput         = document.getElementById("trailValue");

  const showCirclesEl      = document.getElementById("showCircles");
  const showRadiiEl        = document.getElementById("showRadii");
  const showTrailEl        = document.getElementById("showTrail");
  const showOriginalEl     = document.getElementById("showOriginal");
  const showFormulaEl      = document.getElementById("showFormula");
  const formulaPanel       = document.getElementById("formulaPanel");
  const formulaOutput      = document.getElementById("formulaOutput");
  const copyFormulaBtn     = document.getElementById("copyFormulaBtn");

  const playPauseBtn       = document.getElementById("playPauseBtn");
  const playIcon           = document.getElementById("playIcon");
  const pauseIcon          = document.getElementById("pauseIcon");
  const restartBtn         = document.getElementById("restartBtn");
  const progressSlider     = document.getElementById("progressSlider");
  const progressFill       = document.getElementById("progressFill");
  const timeDisplay        = document.getElementById("timeDisplay");

  const screenshotBtn      = document.getElementById("screenshotBtn");
  const quickScreenshotBtn = document.getElementById("quickScreenshotBtn");
  const headerScreenshotBtn= document.getElementById("headerScreenshotBtn");
  const downloadImgBtn     = document.getElementById("downloadImageBtn");
  const recordVideoBtn     = document.getElementById("recordVideoBtn");
  const recordingStatus    = document.getElementById("recordingStatus");
  const recordProgress     = document.getElementById("recordProgress");

  const accentPicker       = document.getElementById("accentColorPicker");
  const accentHexInput     = document.getElementById("accentHexInput");
  const accentSwatch       = document.getElementById("accentColorSwatch");
  const paletteBtns        = document.querySelectorAll(".palette-btn");

  // ──────────────────────── State ────────────────────────────────
  let sampledPoints       = [];   // [{x, y}, …]
  let fourierCoeffs       = [];   // [{re, im, freq, amp, phase}, …]
  let trail               = [];   // [{x, y}, …]
  let time                = 0;    // [0, 1]
  let playing             = false;
  let animFrameId         = null;
  let lastFrameTime       = null;

  let numEpicycles        = 1000;
  let speed               = 1.0;
  let numSamples          = 2000;
  let trailPercent        = 100;
  let showCircles         = true;
  let showRadii           = true;
  let showTrail           = true;
  let showOriginal        = false;

  // Transform for centering and scaling on canvas
  let offsetX = 0, offsetY = 0, scale = 1;

  // Recording
  let isRecording         = false;
  let mediaRecorder       = null;
  let recordedChunks      = [];

  // Accent Color State
  let currentAccentHex    = "#818cf8";
  let currentAccentRgb    = { r: 129, g: 140, b: 248 };
  let currentTrailHex     = "#a5b4fc";

  // ──────────────────────── Preset Paths ─────────────────────────
  const PRESETS = {
    heart: "M 150 300 C 150 240 75 180 75 120 C 75 45 150 30 150 105 C 150 30 225 45 225 120 C 225 180 150 240 150 300 Z",
    batman: "M 250 180 L 265 205 L 285 200 C 295 230 310 240 360 220 C 370 265 340 310 300 325 C 280 300 265 315 250 325 C 235 315 220 300 200 325 C 160 310 130 265 140 220 C 190 240 205 230 215 200 L 235 205 Z",
    butterfly: "M 250 250 C 270 200 330 150 360 170 C 380 190 370 250 310 270 C 370 280 390 340 350 370 C 320 390 270 330 250 270 C 230 330 180 390 150 370 C 110 340 130 280 190 270 C 130 250 120 190 140 170 C 170 150 230 200 250 250 Z",
    treble: "M 200 380 C 200 340 160 300 160 250 C 160 200 210 170 210 120 C 210 70 170 50 150 50 C 130 50 100 70 100 110 C 100 150 130 180 160 200 C 190 220 200 250 200 300 C 200 350 180 370 160 370 C 140 370 130 350 140 330 C 150 310 170 310 170 330 C 170 350 150 360 140 350 M 160 200 C 160 200 170 170 170 130 C 170 90 155 70 150 70 C 145 70 130 80 130 110 C 130 140 160 200 160 200 M 200 300 L 200 50",
    star: (() => {
      let d = "";
      for (let i = 0; i < 5; i++) {
        const aOuter = (Math.PI / 2) + (i * 2 * Math.PI / 5);
        const aInner = aOuter + Math.PI / 5;
        const ox = 150 + 140 * Math.cos(-aOuter);
        const oy = 150 + 140 * Math.sin(-aOuter);
        const ix = 150 + 55 * Math.cos(-aInner);
        const iy = 150 + 55 * Math.sin(-aInner);
        d += (i === 0 ? `M ${ox.toFixed(1)} ${oy.toFixed(1)}` : ` L ${ox.toFixed(1)} ${oy.toFixed(1)}`) + ` L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
      }
      return d + " Z";
    })(),
    pi: "M 60 100 L 60 80 L 240 80 L 240 100 M 100 80 L 100 250 C 100 280 80 290 70 280 M 200 80 L 200 250 C 200 280 220 290 230 280",
  };

  // ──────────────────────── Color & Theme Management ────────────
  function hexToRgb(hex) {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map(c => c + c).join("");
    }
    const val = parseInt(clean, 16);
    return {
      r: (val >> 16) & 255,
      g: (val >> 8) & 255,
      b: val & 255,
    };
  }

  function setAccentColor(hex) {
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return;

    if (hex.length === 4) {
      hex = "#" + hex.slice(1).split("").map(c => c + c).join("");
    }
    hex = hex.toLowerCase();

    const rgb = hexToRgb(hex);

    const hoverR = Math.max(0, Math.round(rgb.r * 0.85));
    const hoverG = Math.max(0, Math.round(rgb.g * 0.85));
    const hoverB = Math.max(0, Math.round(rgb.b * 0.85));
    const hoverHex = `#${((1 << 24) + (hoverR << 16) + (hoverG << 8) + hoverB).toString(16).slice(1)}`;

    const trailR = Math.min(255, Math.round(rgb.r * 1.15 + 22));
    const trailG = Math.min(255, Math.round(rgb.g * 1.15 + 22));
    const trailB = Math.min(255, Math.round(rgb.b * 1.15 + 22));
    const trailHex = `#${((1 << 24) + (trailR << 16) + (trailG << 8) + trailB).toString(16).slice(1)}`;

    currentAccentHex = hex;
    currentAccentRgb = rgb;
    currentTrailHex  = trailHex;

    const root = document.documentElement;
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-hover", hoverHex);
    root.style.setProperty("--accent-glow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`);
    root.style.setProperty("--trail", trailHex);
    root.style.setProperty("--border-focus", hex);

    accentPicker.value = hex;
    accentHexInput.value = hex.toUpperCase();
    accentSwatch.style.backgroundColor = hex;

    paletteBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.color.toLowerCase() === hex);
    });

    draw();
  }

  // ──────────────────────── Toast Notification ───────────────────
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 2200);
  }

  // ──────────────────── SVG Parsing & Unified Sampling ───────────
  // Extracts all path d data and basic shapes from SVG markup,
  // combining them into a single path sequence.
  function extractAllPathData(inputString) {
    const trimmed = inputString.trim();
    if (!trimmed.includes("<svg") && !trimmed.includes("<path")) {
      return trimmed;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, "image/svg+xml");

      // Convert basic shapes to path strings
      doc.querySelectorAll("rect").forEach(r => {
        const x = parseFloat(r.getAttribute("x") || "0");
        const y = parseFloat(r.getAttribute("y") || "0");
        const w = parseFloat(r.getAttribute("width") || "0");
        const h = parseFloat(r.getAttribute("height") || "0");
        const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`);
        r.parentNode.replaceChild(p, r);
      });

      doc.querySelectorAll("circle").forEach(c => {
        const cx = parseFloat(c.getAttribute("cx") || "0");
        const cy = parseFloat(c.getAttribute("cy") || "0");
        const r = parseFloat(c.getAttribute("r") || "0");
        const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`);
        c.parentNode.replaceChild(p, c);
      });

      doc.querySelectorAll("ellipse").forEach(e => {
        const cx = parseFloat(e.getAttribute("cx") || "0");
        const cy = parseFloat(e.getAttribute("cy") || "0");
        const rx = parseFloat(e.getAttribute("rx") || "0");
        const ry = parseFloat(e.getAttribute("ry") || "0");
        const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`);
        e.parentNode.replaceChild(p, e);
      });

      doc.querySelectorAll("polygon, polyline").forEach(poly => {
        const pts = (poly.getAttribute("points") || "").trim().split(/[\s,]+/);
        if (pts.length >= 2) {
          let d = `M ${pts[0]} ${pts[1]}`;
          for (let i = 2; i < pts.length; i += 2) {
            if (pts[i] && pts[i+1]) d += ` L ${pts[i]} ${pts[i+1]}`;
          }
          if (poly.tagName.toLowerCase() === "polygon") d += " Z";
          const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
          p.setAttribute("d", d);
          poly.parentNode.replaceChild(p, poly);
        }
      });

      const paths = doc.querySelectorAll("path");
      if (!paths.length) return "";
      return Array.from(paths).map(p => p.getAttribute("d")).filter(Boolean).join(" ");
    } catch {
      return trimmed;
    }
  }

  // Samples along the continuous unified SVG path using native getPointAtLength
  function sampleSvgPath(pathData, N) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", pathData);
    svg.appendChild(p);
    document.body.appendChild(svg);

    const totalLen = p.getTotalLength();
    if (!totalLen || totalLen <= 0) {
      document.body.removeChild(svg);
      throw new Error("SVG path has zero total length.");
    }

    const pts = [];
    for (let i = 0; i < N; i++) {
      const pt = p.getPointAtLength((i / N) * totalLen);
      pts.push({ x: pt.x, y: pt.y });
    }
    document.body.removeChild(svg);
    return pts;
  }

  // ─────────────────── Discrete Fourier Transform ────────────────
  // Computes the clean Discrete Fourier Transform directly on sampled points
  function computeDFT(points, maxHarmonics = 10000) {
    const N = points.length;
    const K = Math.min(N, maxHarmonics);
    const result = [];
    const twoPiOverN = (2 * Math.PI) / N;

    const xs = new Float64Array(N);
    const ys = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      xs[i] = points[i].x;
      ys[i] = points[i].y;
    }

    for (let k = 0; k < K; k++) {
      let re = 0, im = 0;
      const factor = twoPiOverN * k;

      for (let n = 0; n < N; n++) {
        const phi = factor * n;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);
        re += xs[n] * cosP + ys[n] * sinP;
        im += ys[n] * cosP - xs[n] * sinP;
      }

      re /= N;
      im /= N;

      result.push({
        re,
        im,
        freq: k,
        amp: Math.hypot(re, im),
        phase: Math.atan2(im, re),
      });
    }

    // Sort descending by amplitude (largest circles first)
    result.sort((a, b) => b.amp - a.amp);
    return result;
  }

  function formatFormulaNumber(value) {
    const rounded = Math.abs(value) < 0.0000005 ? 0 : value;
    return rounded.toFixed(4).replace(/\.?0+$/, "");
  }

  function formatFormulaTerm(value, unit) {
    const magnitude = formatFormulaNumber(Math.abs(value));
    if (magnitude === "0") return "";
    const coefficient = magnitude === "1" ? "" : `${magnitude}·`;
    return `${coefficient}${unit}`;
  }

  function buildFormula() {
    if (!fourierCoeffs.length) {
      formulaOutput.textContent = "Load a path to generate its formula.";
      copyFormulaBtn.disabled = true;
      return;
    }

    const coefficients = fourierCoeffs.slice(0, Math.min(numEpicycles, fourierCoeffs.length));
    const xTerms = [];
    const yTerms = [];

    coefficients.forEach((coefficient) => {
      const angle = coefficient.freq === 0 ? "" : `2π·${coefficient.freq}t`;
      const cosTerm = formatFormulaTerm(coefficient.re, angle ? `cos(${angle})` : "1");
      const sinTerm = formatFormulaTerm(coefficient.im, angle ? `sin(${angle})` : "0");

      if (cosTerm) xTerms.push({ sign: coefficient.re < 0 ? "-" : "+", term: cosTerm });
      if (sinTerm && coefficient.freq !== 0) {
        xTerms.push({ sign: coefficient.im < 0 ? "+" : "-", term: sinTerm });
      }

      const ySinTerm = formatFormulaTerm(coefficient.re, angle ? `sin(${angle})` : "0");
      const yCosTerm = formatFormulaTerm(coefficient.im, angle ? `cos(${angle})` : "1");
      if (ySinTerm && coefficient.freq !== 0) {
        yTerms.push({ sign: coefficient.re < 0 ? "-" : "+", term: ySinTerm });
      }
      if (yCosTerm) yTerms.push({ sign: coefficient.im < 0 ? "+" : "-", term: yCosTerm });
    });

    const renderTerms = (terms) => {
      if (!terms.length) return "0";
      const first = terms[0];
      return (first.sign === "-" ? "-" : "") + first.term +
        terms.slice(1).map(({ sign, term }) => ` ${sign} ${term}`).join("");
    };

    formulaOutput.textContent = [
      `x(t) = ${renderTerms(xTerms)}`,
      `y(t) = ${renderTerms(yTerms)}`,
      "",
      `0 ≤ t ≤ 1  ·  ${coefficients.length} harmonic${coefficients.length === 1 ? "" : "s"}`
    ].join("\n");
    copyFormulaBtn.disabled = false;
  }

  // ────────────────── Epicycle Evaluation with Circles ───────────
  function evaluateEpicycles(t, nCoeffs) {
    const circles = [];
    let x = 0, y = 0;
    const twoPiT = 2 * Math.PI * t;
    const maxCircles = Math.min(nCoeffs, 1500);

    for (let i = 0; i < maxCircles && i < fourierCoeffs.length; i++) {
      const c = fourierCoeffs[i];
      const prevX = x, prevY = y;
      const angle = c.freq * twoPiT + c.phase;
      x += c.amp * Math.cos(angle);
      y += c.amp * Math.sin(angle);
      circles.push({
        cx: prevX, cy: prevY,
        radius: c.amp,
        ex: x, ey: y,
      });
    }

    // Accumulate remaining tiny high-frequency harmonics onto the tip position
    for (let i = maxCircles; i < nCoeffs && i < fourierCoeffs.length; i++) {
      const c = fourierCoeffs[i];
      const angle = c.freq * twoPiT + c.phase;
      x += c.amp * Math.cos(angle);
      y += c.amp * Math.sin(angle);
    }

    return { circles, tipX: x, tipY: y };
  }

  // ──────────────── Coordinate Transform Helpers ─────────────────
  function computeTransform(points) {
    if (!points || !points.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const padding = 0.16;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    scale = Math.min((cw * (1 - 2 * padding)) / w, (ch * (1 - 2 * padding)) / h);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    offsetX = cw / 2 - cx * scale;
    offsetY = ch / 2 - cy * scale;
  }

  function toScreen(x, y) {
    return { x: x * scale + offsetX, y: y * scale + offsetY };
  }

  // ──────────────────── Resize Canvas ────────────────────────────
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width  = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width  = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sampledPoints.length) {
      computeTransform(sampledPoints);
      draw();
    }
  }
  window.addEventListener("resize", resizeCanvas);

  // ──────────────── Rebuild Trail to a Given Time ────────────────
  function rebuildTrailTo(targetTime) {
    trail = [];
    if (!fourierCoeffs.length || !sampledPoints.length) return;
    const nCoeffs = Math.min(numEpicycles, fourierCoeffs.length);
    const steps = Math.floor(targetTime * sampledPoints.length);
    for (let i = 0; i <= steps; i++) {
      const t = i / sampledPoints.length;
      const { tipX, tipY } = evaluateEpicycles(t, nCoeffs);
      trail.push({ x: tipX, y: tipY });
    }
  }

  // ────────────────── Load & Compute Pipeline ────────────────────
  function loadPath(pathData) {
    const allD = extractAllPathData(pathData);
    if (!allD) {
      alert("No path data found.");
      return;
    }

    try {
      sampledPoints = sampleSvgPath(allD, numSamples);
    } catch (e) {
      alert("Error parsing SVG: " + (e.message || "Invalid path data."));
      return;
    }

    if (!sampledPoints || sampledPoints.length < 4) {
      alert("Path could not be sampled into enough points.");
      return;
    }

    resizeCanvas();
    computeTransform(sampledPoints);

    // Compute Discrete Fourier Transform
    const harmonicsToCompute = Math.max(numSamples, numEpicycles);
    fourierCoeffs = computeDFT(sampledPoints, harmonicsToCompute);
    buildFormula();

    // Enable sliders and inputs
    epicycleSlider.max = 10000;
    epicycleInput.max = 10000;
    if (numEpicycles > 10000) numEpicycles = 10000;
    epicycleSlider.value = numEpicycles;
    epicycleInput.value = numEpicycles;

    time = 0;
    trail = [];
    overlay.classList.add("hidden");
    screenshotBtn.disabled = false;
    quickScreenshotBtn.disabled = false;
    headerScreenshotBtn.disabled = false;
    downloadImgBtn.disabled = false;
    recordVideoBtn.disabled = false;

    restart();
    play();
  }

  function recomputeSampling() {
    const val = pathInput.value.trim();
    if (!val) return;
    const allD = extractAllPathData(val);
    if (!allD) return;
    try {
      sampledPoints = sampleSvgPath(allD, numSamples);
      computeTransform(sampledPoints);
      const harmonicsToCompute = Math.max(numSamples, numEpicycles);
      fourierCoeffs = computeDFT(sampledPoints, harmonicsToCompute);
      buildFormula();
      rebuildTrailTo(time);
      draw();
    } catch (e) {
      console.warn("Recompute sampling failed", e);
    }
  }

  // ──────────────────────── Rendering ────────────────────────────
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);

    if (!fourierCoeffs.length) return;

    const nCoeffs = Math.min(numEpicycles, fourierCoeffs.length);
    const { circles, tipX, tipY } = evaluateEpicycles(time, nCoeffs);
    const tipScreen = toScreen(tipX, tipY);

    // 1. Ghost of Original Path
    if (showOriginal && sampledPoints.length > 1) {
      ctx.beginPath();
      const sp0 = toScreen(sampledPoints[0].x, sampledPoints[0].y);
      ctx.moveTo(sp0.x, sp0.y);
      for (let i = 1; i < sampledPoints.length; i++) {
        const sp = toScreen(sampledPoints[i].x, sampledPoints[i].y);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. Epicycle Circles & Connecting Radii
    const rgb = currentAccentRgb;
    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];
      const r = c.radius * scale;
      if (r < 0.4) continue; // Skip sub-pixel circles

      const center = toScreen(c.cx, c.cy);
      const edge   = toScreen(c.ex, c.ey);

      if (showCircles) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (showRadii) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(edge.x, edge.y);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 3. Drawing Trail
    if (showTrail && trail.length > 1) {
      const maxLen = Math.floor(sampledPoints.length * (trailPercent / 100));
      const startIdx = Math.max(0, trail.length - maxLen);

      ctx.beginPath();
      const t0 = toScreen(trail[startIdx].x, trail[startIdx].y);
      ctx.moveTo(t0.x, t0.y);
      for (let i = startIdx + 1; i < trail.length; i++) {
        const tp = toScreen(trail[i].x, trail[i].y);
        ctx.lineTo(tp.x, tp.y);
      }
      ctx.lineTo(tipScreen.x, tipScreen.y);

      // Glow pass
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Core pass
      ctx.strokeStyle = currentTrailHex;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap  = "round";
      ctx.stroke();
    }

    // 4. Tip Dot with Glow
    ctx.beginPath();
    ctx.arc(tipScreen.x, tipScreen.y, 6.5, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tipScreen.x, tipScreen.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = currentAccentHex;
    ctx.fill();

    // 5. Update UI progress
    const pct = time * 100;
    progressFill.style.width = pct + "%";
    progressSlider.value = Math.round(pct * 10);
    timeDisplay.textContent = pct.toFixed(1) + "%";
  }

  // ──────────────────── Animation Loop ───────────────────────────
  function animationLoop(timestamp) {
    if (!playing) return;

    if (lastFrameTime === null) lastFrameTime = timestamp;
    lastFrameTime = timestamp;

    if (fourierCoeffs.length && sampledPoints.length) {
      const nCoeffs = Math.min(numEpicycles, fourierCoeffs.length);
      // Fixed step increment to guarantee that trail point density is 100% identical at any speed
      const stepUnit = 1 / sampledPoints.length;
      const targetTime = time + (speed * stepUnit);

      while (time < targetTime) {
        time = Math.min(targetTime, time + stepUnit);
        const { tipX, tipY } = evaluateEpicycles(time, nCoeffs);
        trail.push({ x: tipX, y: tipY });
      }

      if (time >= 1) {
        time = 0;
        trail = [];
        if (isRecording) {
          stopRecording();
          return;
        }
      }
    }

    draw();
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function play() {
    if (playing) return;
    playing = true;
    lastFrameTime = null;
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function pause() {
    playing = false;
    lastFrameTime = null;
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    if (animFrameId) cancelAnimationFrame(animFrameId);
  }

  function restart() {
    time = 0;
    trail = [];
    lastFrameTime = null;
    draw();
  }

  // ───────────────────── Screenshot Capture ───────────────────────
  // Takes an instant screenshot of the graph at this exact moment in the animation
  function takeScreenshot() {
    if (!fourierCoeffs.length) return;

    draw();

    const link = document.createElement("a");
    const pct = Math.round(time * 100);
    link.download = `fourier-epicycles-moment-${pct}pct.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    showToast(`Screenshot saved (${pct}%)`);
  }

  // ───────────────────── Full Sketch Image Export ─────────────────
  // Downloads the fully drawn 100% path with all epicycles
  function downloadFullImage() {
    if (!fourierCoeffs.length) return;

    const savedTime = time;
    const savedTrail = [...trail];

    // Generate full trail
    trail = [];
    const nCoeffs = Math.min(numEpicycles, fourierCoeffs.length);
    const totalSteps = sampledPoints.length;
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const { tipX, tipY } = evaluateEpicycles(t, nCoeffs);
      trail.push({ x: tipX, y: tipY });
    }
    time = 1.0;
    draw();

    const link = document.createElement("a");
    link.download = "fourier-epicycles-full-sketch.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    // Restore animation state
    time = savedTime;
    trail = savedTrail;
    draw();

    showToast("Full sketch image saved");
  }

  // ───────────────────── Video Recording ──────────────────────────
  function startRecording() {
    if (isRecording || !fourierCoeffs.length) return;

    const stream = canvas.captureStream(60);
    const options = { mimeType: "video/webm; codecs=vp9", videoBitsPerSecond: 10_000_000 };

    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch {
      try {
        recorder = new MediaRecorder(stream, { mimeType: "video/webm", videoBitsPerSecond: 6_000_000 });
      } catch {
        recorder = new MediaRecorder(stream);
      }
    }

    recordedChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "fourier-epicycles-animation.webm";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      isRecording = false;
      recordingStatus.classList.add("hidden");
      recordVideoBtn.disabled = false;
      recordVideoBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        Record Full Animation (WebM)`;
      showToast("Animation video downloaded");
    };

    mediaRecorder = recorder;
    isRecording = true;
    recordingStatus.classList.remove("hidden");
    recordVideoBtn.disabled = true;

    // Restart cycle from beginning
    time = 0;
    trail = [];
    recorder.start();
    if (!playing) play();
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    pause();
  }

  // ───────────────────── Event Listeners ──────────────────────────

  // Color Theme Pickers
  accentPicker.addEventListener("input", (e) => {
    setAccentColor(e.target.value);
  });

  accentHexInput.addEventListener("change", (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith("#")) val = "#" + val;
    setAccentColor(val);
  });

  paletteBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setAccentColor(btn.dataset.color);
    });
  });

  // Load Path Button
  loadPathBtn.addEventListener("click", () => {
    const val = pathInput.value.trim();
    if (!val) return alert("Please enter an SVG path string or paste SVG markup.");
    loadPath(val);
  });

  // SVG File Upload
  loadSvgFileBtn.addEventListener("click", () => svgFileInput.click());
  svgFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const allD = extractAllPathData(text);
      if (!allD) {
        alert("No path data found in the SVG file.");
        return;
      }
      pathInput.value = allD;
      loadPath(allD);
    };
    reader.readAsText(file);
    svgFileInput.value = "";
  });

  // Preset Buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.preset;
      if (PRESETS[key]) {
        pathInput.value = PRESETS[key];
        loadPath(PRESETS[key]);
      }
    });
  });

  // 1. Epicycles Slider & Manual Input Sync
  epicycleSlider.addEventListener("input", () => {
    numEpicycles = parseInt(epicycleSlider.value, 10);
    epicycleInput.value = numEpicycles;
    rebuildTrailTo(time);
    buildFormula();
    draw();
  });

  epicycleInput.addEventListener("input", () => {
    let val = parseInt(epicycleInput.value, 10);
    if (isNaN(val)) return;
    val = Math.max(1, Math.min(10000, val));
    numEpicycles = val;
    epicycleSlider.value = val;
    rebuildTrailTo(time);
    buildFormula();
    draw();
  });

  epicycleInput.addEventListener("change", () => {
    let val = parseInt(epicycleInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10000) val = 10000;
    numEpicycles = val;
    epicycleInput.value = val;
    epicycleSlider.value = val;
    rebuildTrailTo(time);
    buildFormula();
    draw();
  });

  // 2. Speed Slider & Manual Input Sync
  speedSlider.addEventListener("input", () => {
    speed = parseFloat(speedSlider.value);
    speedInput.value = speed.toFixed(1);
  });

  speedInput.addEventListener("input", () => {
    let val = parseFloat(speedInput.value);
    if (isNaN(val) || val <= 0) return;
    speed = val;
    if (val <= 5) speedSlider.value = val;
  });

  speedInput.addEventListener("change", () => {
    let val = parseFloat(speedInput.value);
    if (isNaN(val) || val <= 0) val = 1.0;
    val = Math.max(0.1, Math.min(20, val));
    speed = val;
    speedInput.value = speed.toFixed(1);
    if (val <= 5) speedSlider.value = val;
  });

  // 3. Sample Detail Slider & Manual Input Sync
  sampleSlider.addEventListener("input", () => {
    numSamples = parseInt(sampleSlider.value, 10);
    sampleInput.value = numSamples;
  });
  sampleSlider.addEventListener("change", () => {
    recomputeSampling();
  });

  sampleInput.addEventListener("input", () => {
    let val = parseInt(sampleInput.value, 10);
    if (isNaN(val)) return;
    val = Math.max(200, Math.min(10000, val));
    numSamples = val;
    sampleSlider.value = val;
  });

  sampleInput.addEventListener("change", () => {
    let val = parseInt(sampleInput.value, 10);
    if (isNaN(val) || val < 200) val = 200;
    if (val > 10000) val = 10000;
    numSamples = val;
    sampleInput.value = val;
    sampleSlider.value = val;
    recomputeSampling();
  });

  // 4. Trail Length Slider & Manual Input Sync
  trailSlider.addEventListener("input", () => {
    trailPercent = parseInt(trailSlider.value, 10);
    trailInput.value = trailPercent;
    draw();
  });

  trailInput.addEventListener("input", () => {
    let val = parseInt(trailInput.value, 10);
    if (isNaN(val)) return;
    val = Math.max(5, Math.min(100, val));
    trailPercent = val;
    trailSlider.value = val;
    draw();
  });

  trailInput.addEventListener("change", () => {
    let val = parseInt(trailInput.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 100) val = 100;
    trailPercent = val;
    trailInput.value = val;
    trailSlider.value = val;
    draw();
  });

  // Layer Toggles
  showCirclesEl.addEventListener("change", () => { showCircles = showCirclesEl.checked; draw(); });
  showRadiiEl.addEventListener("change",   () => { showRadii   = showRadiiEl.checked;   draw(); });
  showTrailEl.addEventListener("change",   () => { showTrail   = showTrailEl.checked;   draw(); });
  showOriginalEl.addEventListener("change", () => { showOriginal = showOriginalEl.checked; draw(); });
  showFormulaEl.addEventListener("change", () => {
    formulaPanel.classList.toggle("hidden", !showFormulaEl.checked);
    if (showFormulaEl.checked) buildFormula();
  });

  copyFormulaBtn.addEventListener("click", async () => {
    if (!formulaOutput.textContent || copyFormulaBtn.disabled) return;
    try {
      await navigator.clipboard.writeText(formulaOutput.textContent);
      showToast("Formula copied to clipboard");
    } catch (error) {
      console.warn("Could not copy formula", error);
      showToast("Copy failed — select the formula manually");
    }
  });

  // Playback Controls
  playPauseBtn.addEventListener("click", () => playing ? pause() : play());
  restartBtn.addEventListener("click", () => { restart(); if (!playing) draw(); });

  // Scrubbing on Timeline
  progressSlider.addEventListener("input", () => {
    time = progressSlider.value / 1000;
    rebuildTrailTo(time);
    draw();
  });

  // Screenshot Actions
  screenshotBtn.addEventListener("click", takeScreenshot);
  quickScreenshotBtn.addEventListener("click", takeScreenshot);
  headerScreenshotBtn.addEventListener("click", takeScreenshot);

  // Download and Record
  downloadImgBtn.addEventListener("click", downloadFullImage);
  recordVideoBtn.addEventListener("click", startRecording);

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") {
      e.preventDefault();
      playing ? pause() : play();
    } else if (e.code === "KeyR") {
      e.preventDefault();
      restart();
      if (!playing) draw();
    } else if (e.code === "KeyS") {
      e.preventDefault();
      takeScreenshot();
    }
  });

  // Recording Progress Updater
  function updateRecordingProgress() {
    if (isRecording) {
      recordProgress.textContent = Math.round(time * 100);
    }
    requestAnimationFrame(updateRecordingProgress);
  }
  updateRecordingProgress();

  // ──────────────────── Initialization ───────────────────────────
  resizeCanvas();
  setAccentColor("#818cf8");

  // Load default preset on startup
  pathInput.value = PRESETS.batman;
  loadPath(PRESETS.batman);

})();
