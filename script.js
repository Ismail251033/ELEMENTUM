/* ═══════════════════════════════════════════════
   ELEMENTUM — script.js
   Grid · Sphere · Helix · Quiz · Detail Panel
═══════════════════════════════════════════════ */

"use strict";

// ──────────────────────────────
// 1. THEME
// ──────────────────────────────
const html     = document.documentElement;
const themeBtn = document.getElementById("themeToggle");

function initTheme() {
  const saved = localStorage.getItem("elementum-theme") || "dark";
  html.setAttribute("data-theme", saved);
  themeBtn.querySelector(".theme-icon").textContent = saved === "dark" ? "☀" : "◑";
}

themeBtn.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("elementum-theme", next);
  themeBtn.querySelector(".theme-icon").textContent = next === "dark" ? "☀" : "◑";
  if (activeSphere) updateSphereColors();
  if (activeHelix)  updateHelixColors();
});

initTheme();


// ──────────────────────────────
// 2. CATEGORY COLORS helper
// ──────────────────────────────
function getCatColor(category) {
  const MAP = {
    "alkali-metal":     "#FF4D6D",
    "alkaline-earth":   "#FF9A3C",
    "transition-metal": "#4DA8FF",
    "post-transition":  "#7ED8C8",
    "metalloid":        "#57C96B",
    "nonmetal":         "#C97EFF",
    "noble-gas":        "#FF7EB6",
    "lanthanide":       "#FFD700",
    "actinide":         "#FFA07A",
  };
  return MAP[category] || "#aaaaaa";
}

function hexToNum(hex) {
  return parseInt(hex.replace("#", ""), 16);
}


// ──────────────────────────────
// 3. PERIODIC TABLE LAYOUT MAP
// ──────────────────────────────
// Each entry: [period, group] — 1-indexed, group 1..18
const LAYOUT = {};

ELEMENTS.forEach(el => {
  if (el.category === "lanthanide" && el.number !== 57 && el.number !== 71) return;
  if (el.category === "actinide"   && el.number !== 89 && el.number !== 103) return;
  if (el.period && el.group) {
    LAYOUT[el.number] = [el.period, el.group];
  }
});

// Place La(57) at 6,3 and Ac(89) at 7,3 as "bridge" cells
LAYOUT[57] = [6, 3];
LAYOUT[71] = [6, 3]; // Won't appear in main grid since 57 takes it
LAYOUT[89] = [7, 3];
LAYOUT[103]= [7, 3];

// Clean proper positions from ELEMENTS
const MAIN_GRID_NUMBERS = new Set();
ELEMENTS.forEach(el => {
  if (el.category !== "lanthanide" && el.category !== "actinide") {
    if (el.period && el.group) MAIN_GRID_NUMBERS.add(el.number);
  }
});
// Bridges
MAIN_GRID_NUMBERS.add(57); MAIN_GRID_NUMBERS.add(89);

const LANTHANIDES = ELEMENTS.filter(e => e.category === "lanthanide" && e.number >= 57 && e.number <= 71);
const ACTINIDES   = ELEMENTS.filter(e => e.category === "actinide"   && e.number >= 89 && e.number <= 103);


// ──────────────────────────────
// 4. BUILD GRID
// ──────────────────────────────
const ptGrid       = document.getElementById("ptGrid");
const lanthanideRow= document.getElementById("lanthanideRow");
const actinideRow  = document.getElementById("actinideRow");

function buildGridView() {
  ptGrid.innerHTML = "";
  const cells = {}; // key = "period-group"

  ELEMENTS.forEach(el => {
    if (!MAIN_GRID_NUMBERS.has(el.number)) return;
    let row = el.period, col = el.group;
    // La bridge
    if (el.number === 57) { row = 6; col = 3; }
    if (el.number === 89) { row = 7; col = 3; }
    cells[`${row}-${col}`] = el;
  });

  for (let r = 1; r <= 7; r++) {
    for (let c = 1; c <= 18; c++) {
      const el = cells[`${r}-${c}`];
      if (el) {
        ptGrid.appendChild(makeCard(el));
      } else {
        const ph = document.createElement("div");
        ph.className = "el-card el-placeholder";
        ptGrid.appendChild(ph);
      }
    }
  }

  // F-block rows
  lanthanideRow.innerHTML = "";
  actinideRow.innerHTML   = "";
  LANTHANIDES.forEach(el => lanthanideRow.appendChild(makeCard(el)));
  ACTINIDES.forEach(el   => actinideRow.appendChild(makeCard(el)));
}

function makeCard(el) {
  const color = getCatColor(el.category);
  const card  = document.createElement("div");
  card.className   = "el-card";
  card.dataset.num = el.number;
  card.style.setProperty("--card-color", color);
  card.innerHTML = `
    <span class="el-number">${el.number}</span>
    <span class="el-symbol">${el.symbol}</span>
    <span class="el-name">${el.name}</span>
  `;
  card.addEventListener("click", () => openPanel(el));
  return card;
}

buildGridView();


// ──────────────────────────────
// 5. SEARCH
// ──────────────────────────────
const searchInput = document.getElementById("searchInput");
const clearBtn    = document.getElementById("clearSearch");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  clearBtn.style.display = q ? "flex" : "none";
  filterCards(q, activeCategory);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.style.display = "none";
  filterCards("", activeCategory);
});

let activeCategory = "all";

function filterCards(q, cat) {
  const allCards = document.querySelectorAll(".el-card:not(.el-placeholder)");
  allCards.forEach(card => {
    const num = parseInt(card.dataset.num);
    const el  = ELEMENTS.find(e => e.number === num);
    if (!el) return;
    const matchQ   = !q || el.name.toLowerCase().includes(q) || el.symbol.toLowerCase().includes(q) || String(el.number).includes(q);
    const matchCat = cat === "all" || el.category === cat;
    card.classList.toggle("dimmed", !(matchQ && matchCat));
  });
}


// ──────────────────────────────
// 6. CATEGORY FILTER
// ──────────────────────────────
document.querySelectorAll(".legend-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".legend-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeCategory = pill.dataset.cat;
    filterCards(searchInput.value.trim().toLowerCase(), activeCategory);
  });
});


// ──────────────────────────────
// 7. VIEW MODE SWITCHER
// ──────────────────────────────
const views    = { grid: "gridView", sphere: "sphereView", helix: "helixView", quiz: "quizView" };
const legendBar= document.getElementById("legendBar");
let currentMode = "grid";
let activeSphere= null;
let activeHelix = null;

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (mode === currentMode) return;
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(views[mode]).classList.add("active");
    legendBar.style.display = (mode === "grid") ? "flex" : "none";
    currentMode = mode;

    if (mode === "sphere" && !activeSphere) { initSphere(); }
    if (mode === "helix"  && !activeHelix)  { initHelix(); }
    if (mode === "quiz")   { initQuiz(); }
  });
});


// ──────────────────────────────
// 8. DETAIL PANEL
// ──────────────────────────────
const detailPanel  = document.getElementById("detailPanel");
const panelInner   = document.getElementById("panelInner");
const panelClose   = document.getElementById("panelClose");
const panelOverlay = document.getElementById("panelOverlay");

function openPanel(el) {
  const color  = getCatColor(el.category);
  const color2 = shiftHue(color, 40);
  const catInfo= CATEGORIES[el.category] || { label: el.category };

  panelInner.innerHTML = `
    <div class="panel-hero" style="--hero-color-a:${color};--hero-color-b:${color2}">
      <div class="panel-hero-number">#${el.number}</div>
      <div class="panel-hero-symbol">${el.symbol}</div>
      <div class="panel-hero-name">${el.name}</div>
      <div class="panel-hero-cat">${catInfo.label}</div>
    </div>
    <div class="panel-body">
      <div class="panel-section">
        <div class="panel-section-title">Core Properties</div>
        <div class="panel-stats">
          <div class="stat-box">
            <div class="stat-label">Atomic Number</div>
            <div class="stat-value highlight">${el.number}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Atomic Mass</div>
            <div class="stat-value">${el.mass} u</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Period</div>
            <div class="stat-value">${el.period}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Group</div>
            <div class="stat-value">${el.group ?? "—"}</div>
          </div>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Physical Properties</div>
        <div class="panel-stats">
          <div class="stat-box">
            <div class="stat-label">Melting Point</div>
            <div class="stat-value">${el.meltingPoint != null ? el.meltingPoint + " °C" : "—"}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Boiling Point</div>
            <div class="stat-value">${el.boilingPoint != null ? el.boilingPoint + " °C" : "—"}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Density</div>
            <div class="stat-value">${el.density != null ? el.density + " g/cm³" : "—"}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Electronegativity</div>
            <div class="stat-value">${el.electronegativity != null ? el.electronegativity : "—"}</div>
          </div>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Discovery</div>
        <div class="panel-stats">
          <div class="stat-box">
            <div class="stat-label">Year</div>
            <div class="stat-value">${el.discovered}</div>
          </div>
          <div class="stat-box" style="grid-column:span 1">
            <div class="stat-label">Discovered By</div>
            <div class="stat-value" style="font-size:12px;font-family:var(--font-display)">${el.discoveredBy}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  detailPanel.classList.add("open");
  panelOverlay.classList.add("active");
}

function closePanel() {
  detailPanel.classList.remove("open");
  panelOverlay.classList.remove("active");
}

panelClose.addEventListener("click", closePanel);
panelOverlay.addEventListener("click", closePanel);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closePanel();
});

function shiftHue(hex, degrees) {
  const r = parseInt(hex.slice(1,3),16)/255,
        g = parseInt(hex.slice(3,5),16)/255,
        b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch (max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      default: h = ((r-g)/d + 4)/6;
    }
  }
  h = (h * 360 + degrees) % 360 / 360;
  function hue2rgb(p, q, t) {
    if (t<0) t+=1; if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  }
  const q2 = l<0.5 ? l*(1+s) : l+s-l*s;
  const p2 = 2*l-q2;
  const nr = Math.round(hue2rgb(p2,q2,h+1/3)*255);
  const ng = Math.round(hue2rgb(p2,q2,h)*255);
  const nb = Math.round(hue2rgb(p2,q2,h-1/3)*255);
  return `#${nr.toString(16).padStart(2,"0")}${ng.toString(16).padStart(2,"0")}${nb.toString(16).padStart(2,"0")}`;
}


// ──────────────────────────────
// 9. THREE.JS SPHERE VIEW
// ──────────────────────────────
let sphereScene, sphereCamera, sphereRenderer, sphereAnimId;
let sphereMeshes = [];
let isDragging = false, prevMouseX = 0, prevMouseY = 0;
let sphereGroup;

function initSphere() {
  const canvas = document.getElementById("sphereCanvas");
  const parent = document.getElementById("sphereView");
  const W = parent.clientWidth, H = parent.clientHeight;

  sphereScene    = new THREE.Scene();
  sphereCamera   = new THREE.PerspectiveCamera(60, W/H, 0.1, 2000);
  sphereCamera.position.z = 340;

  sphereRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  sphereRenderer.setSize(W, H);
  sphereRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  sphereRenderer.setClearColor(0x000000, 0);

  // Ambient + point lights
  sphereScene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const pLight = new THREE.PointLight(0x4DA8FF, 2, 600);
  pLight.position.set(0, 0, 200);
  sphereScene.add(pLight);

  sphereGroup = new THREE.Group();
  sphereScene.add(sphereGroup);

  const N = ELEMENTS.length;
  const R = 200;

  sphereMeshes = [];

  ELEMENTS.forEach((el, i) => {
    // Fibonacci sphere distribution
    const phi   = Math.acos(1 - 2*(i+0.5)/N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = R * Math.sin(phi) * Math.cos(theta);
    const y = R * Math.sin(phi) * Math.sin(theta);
    const z = R * Math.cos(phi);

    const color  = hexToNum(getCatColor(el.category));
    const geo    = new THREE.SphereGeometry(4, 12, 12);
    const mat    = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.4, shininess: 80 });
    const mesh   = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { el, origPos: new THREE.Vector3(x, y, z), origColor: color };
    sphereGroup.add(mesh);
    sphereMeshes.push(mesh);
  });

  // Tooltip
  const tooltip = getTooltip();

  // Raycaster for click / hover
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();
  let hoveredMesh = null;

  canvas.addEventListener("mousemove", e => {
    if (isDragging) {
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      sphereGroup.rotation.y += dx * 0.006;
      sphereGroup.rotation.x += dy * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      tooltip.classList.remove("visible");
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
    raycaster.setFromCamera(mouse, sphereCamera);
    const hits = raycaster.intersectObjects(sphereMeshes);
    if (hits.length) {
      const el = hits[0].object.userData.el;
      tooltip.style.left = (e.clientX + 14) + "px";
      tooltip.style.top  = (e.clientY - 10) + "px";
      tooltip.innerHTML  = `<strong>${el.symbol}</strong> · ${el.name} · #${el.number}`;
      tooltip.classList.add("visible");
      if (hoveredMesh !== hits[0].object) {
        if (hoveredMesh) hoveredMesh.scale.setScalar(1);
        hoveredMesh = hits[0].object;
        hoveredMesh.scale.setScalar(1.8);
      }
    } else {
      tooltip.classList.remove("visible");
      if (hoveredMesh) { hoveredMesh.scale.setScalar(1); hoveredMesh = null; }
    }
  });

  canvas.addEventListener("mousedown", e => {
    isDragging = true; prevMouseX = e.clientX; prevMouseY = e.clientY;
  });
  window.addEventListener("mouseup", () => { isDragging = false; });

  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
    raycaster.setFromCamera(mouse, sphereCamera);
    const hits = raycaster.intersectObjects(sphereMeshes);
    if (hits.length) openPanel(hits[0].object.userData.el);
  });

  // Touch support
  let lastTouchX = 0, lastTouchY = 0;
  canvas.addEventListener("touchstart", e => {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  });
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const dx = e.touches[0].clientX - lastTouchX;
    const dy = e.touches[0].clientY - lastTouchY;
    sphereGroup.rotation.y += dx * 0.006;
    sphereGroup.rotation.x += dy * 0.006;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }, { passive: false });

  window.addEventListener("resize", onSphereResize);

  (function animate() {
    sphereAnimId = requestAnimationFrame(animate);
    if (!isDragging) { sphereGroup.rotation.y += 0.0015; }
    sphereRenderer.render(sphereScene, sphereCamera);
  })();

  activeSphere = true;
}

function onSphereResize() {
  const parent = document.getElementById("sphereView");
  const W = parent.clientWidth, H = parent.clientHeight;
  sphereCamera.aspect = W/H;
  sphereCamera.updateProjectionMatrix();
  sphereRenderer.setSize(W, H);
}

function updateSphereColors() {
  if (!sphereMeshes.length) return;
  sphereMeshes.forEach(mesh => {
    const color = hexToNum(getCatColor(mesh.userData.el.category));
    mesh.material.color.setHex(color);
    mesh.material.emissive.setHex(color);
  });
}


// ──────────────────────────────
// 10. THREE.JS HELIX VIEW
// ──────────────────────────────
let helixScene, helixCamera, helixRenderer, helixAnimId;
let helixMeshes = [];
let helixGroup;
let isDraggingH = false, prevMouseXH = 0;

function initHelix() {
  const canvas = document.getElementById("helixCanvas");
  const parent = document.getElementById("helixView");
  const W = parent.clientWidth, H = parent.clientHeight;

  helixScene    = new THREE.Scene();
  helixCamera   = new THREE.PerspectiveCamera(55, W/H, 0.1, 2000);
  helixCamera.position.z = 420;

  helixRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  helixRenderer.setSize(W, H);
  helixRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  helixRenderer.setClearColor(0x000000, 0);

  helixScene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const pLight = new THREE.PointLight(0xFF7EB6, 2.5, 800);
  pLight.position.set(100, 100, 200);
  helixScene.add(pLight);
  const pLight2 = new THREE.PointLight(0x4DA8FF, 1.5, 600);
  pLight2.position.set(-100, -100, 200);
  helixScene.add(pLight2);

  helixGroup = new THREE.Group();
  helixScene.add(helixGroup);

  const N = ELEMENTS.length;
  helixMeshes = [];

  // Draw helix spine
  const helixPoints = [];

  ELEMENTS.forEach((el, i) => {
    const t     = i / (N - 1);
    const angle = t * Math.PI * 8;   // 4 full turns
    const radius= 120;
    const x     = radius * Math.cos(angle);
    const y     = (t - 0.5) * 500;   // spread vertically
    const z     = radius * Math.sin(angle);

    helixPoints.push(new THREE.Vector3(x, y, z));

    const color = hexToNum(getCatColor(el.category));
    const size  = 4 + (el.number % 5) * 0.4;
    const geo   = new THREE.SphereGeometry(size, 10, 10);
    const mat   = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5, shininess: 120 });
    const mesh  = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { el };
    helixGroup.add(mesh);
    helixMeshes.push(mesh);
  });

  // Spine tube
  const splineCurve = new THREE.CatmullRomCurve3(helixPoints);
  const tubeGeo     = new THREE.TubeGeometry(splineCurve, 500, 1.2, 6, false);
  const tubeMat     = new THREE.MeshPhongMaterial({ color: 0x223355, emissive: 0x112244, transparent: true, opacity: 0.6 });
  helixGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

  const tooltip   = getTooltip();
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();
  let hoveredMesh = null;

  canvas.addEventListener("mousemove", e => {
    if (isDraggingH) {
      const dx = e.clientX - prevMouseXH;
      helixGroup.rotation.y += dx * 0.006;
      prevMouseXH = e.clientX;
      tooltip.classList.remove("visible");
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
    raycaster.setFromCamera(mouse, helixCamera);
    const hits = raycaster.intersectObjects(helixMeshes);
    if (hits.length) {
      const el = hits[0].object.userData.el;
      tooltip.style.left = (e.clientX + 14) + "px";
      tooltip.style.top  = (e.clientY - 10) + "px";
      tooltip.innerHTML  = `<strong>${el.symbol}</strong> · ${el.name} · #${el.number}`;
      tooltip.classList.add("visible");
      if (hoveredMesh !== hits[0].object) {
        if (hoveredMesh) hoveredMesh.scale.setScalar(1);
        hoveredMesh = hits[0].object;
        hoveredMesh.scale.setScalar(2);
      }
    } else {
      tooltip.classList.remove("visible");
      if (hoveredMesh) { hoveredMesh.scale.setScalar(1); hoveredMesh = null; }
    }
  });

  canvas.addEventListener("mousedown", e => { isDraggingH = true; prevMouseXH = e.clientX; });
  window.addEventListener("mouseup", () => { isDraggingH = false; });
  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
    raycaster.setFromCamera(mouse, helixCamera);
    const hits = raycaster.intersectObjects(helixMeshes);
    if (hits.length) openPanel(hits[0].object.userData.el);
  });

  // Mouse wheel zoom
  canvas.addEventListener("wheel", e => {
    helixCamera.position.z = Math.max(150, Math.min(700, helixCamera.position.z + e.deltaY * 0.5));
  }, { passive: true });

  window.addEventListener("resize", onHelixResize);

  (function animate() {
    helixAnimId = requestAnimationFrame(animate);
    if (!isDraggingH) { helixGroup.rotation.y += 0.004; }
    helixRenderer.render(helixScene, helixCamera);
  })();

  activeHelix = true;
}

function onHelixResize() {
  const parent = document.getElementById("helixView");
  const W = parent.clientWidth, H = parent.clientHeight;
  helixCamera.aspect = W/H;
  helixCamera.updateProjectionMatrix();
  helixRenderer.setSize(W, H);
}

function updateHelixColors() {
  if (!helixMeshes.length) return;
  helixMeshes.forEach(mesh => {
    const color = hexToNum(getCatColor(mesh.userData.el.category));
    mesh.material.color.setHex(color);
    mesh.material.emissive.setHex(color);
  });
}

// Shared tooltip element
function getTooltip() {
  let t = document.querySelector(".three-tooltip");
  if (!t) {
    t = document.createElement("div");
    t.className = "three-tooltip";
    document.body.appendChild(t);
  }
  return t;
}

// ──────────────────────────────
// 11. QUIZ
// ──────────────────────────────
let quizScore  = 0;
let quizTotal  = 0;
let quizStreak = 0;
let quizAnswered = false;
let quizQuestionEl  = document.getElementById("quizQuestion");
let quizOptionsEl   = document.getElementById("quizOptions");
let quizFeedbackEl  = document.getElementById("quizFeedback");
let quizNextBtn     = document.getElementById("quizNextBtn");
let scoreDisplay    = document.getElementById("scoreDisplay");
let streakCount     = document.getElementById("streakCount");
let totalCount      = document.getElementById("totalCount");

const QUESTION_TYPES = [
  (el, pool) => ({
    q: `What is the chemical symbol for <strong>${el.name}</strong>?`,
    correct: el.symbol,
    distractors: pool.filter(e => e !== el).map(e => e.symbol),
  }),
  (el, pool) => ({
    q: `Which element has the symbol <strong>${el.symbol}</strong>?`,
    correct: el.name,
    distractors: pool.filter(e => e !== el).map(e => e.name),
  }),
  (el, pool) => ({
    q: `What is the atomic number of <strong>${el.name}</strong>?`,
    correct: String(el.number),
    distractors: pool.filter(e => e !== el).map(e => String(e.number)),
  }),
  (el, pool) => ({
    q: `Which element belongs to the <strong>${CATEGORIES[el.category]?.label || el.category}</strong> family?`,
    correct: el.name,
    distractors: pool.filter(e => e !== el && e.category !== el.category).map(e => e.name),
  }),
  (el, pool) => ({
    q: `Which element has atomic mass <strong>${el.mass}</strong>?`,
    correct: el.name,
    distractors: pool.filter(e => e !== el).map(e => e.name),
  }),
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initQuiz() {
  quizScore = 0; quizTotal = 0; quizStreak = 0;
  updateScoreDisplay();
  nextQuestion();
}

function nextQuestion() {
  quizAnswered = false;
  quizFeedbackEl.textContent = "";
  quizNextBtn.style.display = "none";

  const el   = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
  const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
  const data = type(el, ELEMENTS);

  quizQuestionEl.innerHTML = data.q;

  // Pick 3 random distractors
  const distractors = shuffle(data.distractors).slice(0, 3);
  const options     = shuffle([data.correct, ...distractors]);

  quizOptionsEl.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      if (quizAnswered) return;
      quizAnswered = true;
      quizTotal++;

      if (opt === data.correct) {
        btn.classList.add("correct");
        quizScore++;
        quizStreak++;
        quizFeedbackEl.textContent = quizStreak > 2 ? `🔥 ${quizStreak} in a row! Excellent!` : "✅ Correct!";
      } else {
        btn.classList.add("wrong");
        quizStreak = 0;
        quizFeedbackEl.textContent = `❌ Wrong. The answer was "${data.correct}"`;
        // Highlight correct
        quizOptionsEl.querySelectorAll(".quiz-option").forEach(b => {
          if (b.textContent === data.correct) b.classList.add("correct");
        });
      }

      // Disable all
      quizOptionsEl.querySelectorAll(".quiz-option").forEach(b => b.disabled = true);
      updateScoreDisplay();
      quizNextBtn.style.display = "block";
    });
    quizOptionsEl.appendChild(btn);
  });
}

function updateScoreDisplay() {
  document.querySelector("#scoreDisplay strong").textContent = quizScore;
  streakCount.textContent = quizStreak;
  totalCount.textContent  = quizTotal;
}

quizNextBtn.addEventListener("click", nextQuestion);


// ──────────────────────────────
// 12. RESPONSIVE RESIZE
// ──────────────────────────────
window.addEventListener("resize", () => {
  if (activeSphere) onSphereResize();
  if (activeHelix)  onHelixResize();
});


// ──────────────────────────────
// 13. PAGE LOAD ANIMATION (grid)
// ──────────────────────────────
(function staggerCards() {
  const cards = document.querySelectorAll(".el-card:not(.el-placeholder)");
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "scale(0.6)";
    card.style.transition = `opacity 0.4s ease ${(i*2)}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${(i*2)}ms`;
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.opacity = "";
        card.style.transform = "";
      }, i * 2);
    });
  });
})();