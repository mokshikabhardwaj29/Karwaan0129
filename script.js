/* ================================
   KARWAAn
   script.js — v5 (mobile-first, zero CDN deps for interactions)
================================ */
'use strict';

/* ═══════════════════════════════════
   CONFIG
═══════════════════════════════════ */
const FLOWER_COUNT = 15;
const EXPORT_W     = 1080;

const BACKGROUNDS = [
  { id:'cream',    label:'Parchment', color:'#F7F4EF', dark:false },
  { id:'rose',     label:'Blush',     color:'#F5EAEA', dark:false },
  { id:'sage',     label:'Sage',      color:'#E8EFEB', dark:false },
  { id:'lavender', label:'Lavender',  color:'#EDE8F5', dark:false },
  { id:'warm',     label:'Warm',      color:'#F4EDE3', dark:false },
  { id:'pearl',    label:'Pearl',     color:'#FAF2F0', dark:false },
  { id:'midnight', label:'Midnight',  color:'#272330', dark:true  },
  { id:'forest',   label:'Forest',    color:'#2B3A2D', dark:true  },
];

const INSPIRATION = [
  "Write about something quietly blooming in your life.",
  "Describe spring using only three tender lines.",
  "Write a note for someone who makes the world lighter.",
  "Tell a flower what it means to be patient.",
  "Capture the moment before rain in words.",
  "Write a poem that ends where it begins.",
  "What does warmth smell like to you?",
  "Describe silence as if it were a colour.",
  "Write to someone you haven't spoken to in a while.",
  "What would you say if flowers could listen?",
  "Name three things you want to remember about today.",
  "Write about a softness you have been carrying.",
];

/* ═══════════════════════════════════
   STATE
═══════════════════════════════════ */
let state = {
  flowers:    [],
  nextId:     1,
  nextZ:      10,
  selectedId: null,
  bgId:       'cream',
  poem:       '',
  sender:     '',
  fontSize:   20,
  align:      'center',
  inspIdx:    0,
};

const imgCache = {};
let drag = null;

/* ═══════════════════════════════════
   DOM CACHE
═══════════════════════════════════ */
const $ = s => document.querySelector(s);
let el = {};

function cacheEl() {
  el = {
    landing:      $('#landing'),
    editor:       $('#editor'),
    enterBtn:     $('#enter-btn'),
    stage:        $('#canvas-stage'),
    textLayer:    $('#text-layer'),
    tlPoem:       $('#tl-poem'),
    tlSender:     $('#tl-sender'),
    poemInput:    $('#poem-input'),
    senderInput:  $('#sender-input'),
    fontSlider:   $('#font-size'),
    fontVal:      $('#font-size-val'),
    bgOptions:    $('#bg-options'),
    flowerGrid:   $('#flower-grid'),
    tabFlowers:   null,
    tabGreen:     null,
    greenGrid:    null,
    arrangeBtn:   $('#arrange-btn'),
    inspireBtn:   $('#inspire-btn'),
    inspTxt:      $('#inspiration-text'),
    downloadBtn:  $('#download-btn'),
    dlBtnMob:     $('#download-btn-mob'),
    clearBtn:     $('#clear-btn'),
    shareLinkBtn: $('#share-link-btn'),
    shareModal:   $('#share-modal'),
    shareClose:   $('#share-modal-close'),
    shareLinkIn:  $('#share-link-input'),
    copyLinkBtn:  $('#copy-link-btn'),
    dlModal:      $('#dl-modal'),
    dlModalClose: $('#dl-modal-close'),
    toast:        $('#toast'),
    leftPanel:    $('#left-panel'),
    mobilePanBtn: $('#mobile-panel-btn'),
    mobArrangeBtn:$('#mob-arrange-btn'),
    petalCanvas:  $('#petal-canvas'),
    alignBtns:    document.querySelectorAll('.align-btn'),
    panelOverlay: $('#panel-overlay'),
  };
}

/* ═══════════════════════════════════
   IMAGE TO DATA URL  (CORS fix)
═══════════════════════════════════ */
function toDataUrl(src) {
  if (imgCache[src]) return Promise.resolve(imgCache[src]);
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width  = img.naturalWidth  || img.width  || 200;
        cv.height = img.naturalHeight || img.height || 200;
        cv.getContext('2d').drawImage(img, 0, 0);
        const url = cv.toDataURL('image/png');
        imgCache[src] = url;
        resolve(url);
      } catch(e) {
        imgCache[src] = src;
        resolve(src);
      }
    };
    img.onerror = () => { imgCache[src] = src; resolve(src); };
    img.src = src;
  });
}

/* ═══════════════════════════════════
   LANDING ANIMATION
═══════════════════════════════════ */
function initLanding() {
  const wrap      = $('.landing-flowers');
  const titleWrap = $('.hero-title-wrap');

  const positions = [
    {x:4,  y:6,  rot:-28}, {x:83, y:4,  rot:32 },
    {x:1,  y:44, rot:-55}, {x:87, y:42, rot:58 },
    {x:8,  y:82, rot:-14}, {x:79, y:83, rot:22 },
    {x:40, y:1,  rot:5  }, {x:46, y:91, rot:175},
    {x:22, y:18, rot:-42}, {x:64, y:76, rot:48 },
  ];
  const picks = shuffle(range(1, FLOWER_COUNT)).slice(0, 10);

  const imgs = positions.map((p, i) => {
    const img = document.createElement('img');
    img.className = 'landing-flower';
    img.src = `assets/f${picks[i]}.png`;
    img.style.setProperty('--rot', `${p.rot}deg`);
    img.style.setProperty('--tx',  `${p.x < 50 ? -90 : 90}px`);
    img.style.setProperty('--ty',  `${p.y < 50 ? -65 : 65}px`);
    img.style.left  = `${p.x}%`;
    img.style.top   = `${p.y}%`;
    img.style.width = `clamp(70px, ${8 + Math.random()*5}vw, 145px)`;
    img.onerror = () => { img.style.display = 'none'; };
    wrap.appendChild(img);
    return img;
  });

  imgs.forEach((img, i) => setTimeout(() => img.classList.add('bloomed'), 250 + i*120));
  setTimeout(() => {
    titleWrap.classList.add('revealed');
    setTimeout(() => imgs.forEach(img => img.classList.add('parted')), 900);
  }, 1700);
}

/* ═══════════════════════════════════
   FLOATING PETALS
═══════════════════════════════════ */
function initPetals() {
  const cv = el.petalCanvas;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H;
  const petals = [];
  const COLS = ['#EAD7D7','#E6E0F2','#DDE6E1','#F5DDD5','#F0E8E3'];

  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }

  class Petal {
    constructor(init) {
      this.x   = Math.random()*W;
      this.y   = init ? Math.random()*H : -10;
      this.r   = 4 + Math.random()*6;
      this.vx  = (Math.random()-.5)*.7;
      this.vy  = .4 + Math.random()*.6;
      this.rot = Math.random()*Math.PI*2;
      this.vr  = (Math.random()-.5)*.035;
      this.col = COLS[Math.floor(Math.random()*COLS.length)];
      this.a   = .3 + Math.random()*.35;
    }
    tick() {
      this.x += this.vx + Math.sin(Date.now()*.001 + this.y*.01)*.25;
      this.y += this.vy;
      this.rot += this.vr;
      if (this.y > H+20) return new Petal(false);
      return this;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.a;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.col;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r, this.r*.5, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  resize();
  for (let i = 0; i < 30; i++) petals.push(new Petal(true));
  addEventListener('resize', resize);
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < petals.length; i++) {
      petals[i] = petals[i].tick();
      petals[i].draw();
    }
    requestAnimationFrame(loop);
  })();
}

/* ═══════════════════════════════════
   SHOW EDITOR
═══════════════════════════════════ */
function showEditor() {
  el.landing.style.display = 'none';
  el.editor.classList.add('active');
  buildBgOptions();
  buildFlowerGrid('flowers');
  buildFlowerGrid('greenery');
  bindInputs();
  applyBg();
  renderText();
}

/* ═══════════════════════════════════
   BACKGROUND
═══════════════════════════════════ */
function buildBgOptions() {
  el.bgOptions.innerHTML = '';
  BACKGROUNDS.forEach(bg => {
    const sw = document.createElement('div');
    sw.className = 'bg-swatch' + (bg.id === state.bgId ? ' active' : '');
    sw.title     = bg.label;
    sw.style.background = bg.color;
    sw.addEventListener('click', () => {
      state.bgId = bg.id;
      document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      applyBg();
    });
    el.bgOptions.appendChild(sw);
  });
}

function applyBg() {
  const bg = BACKGROUNDS.find(b => b.id === state.bgId) || BACKGROUNDS[0];
  // Use both background and backgroundColor for Android GPU compositing safety
  el.stage.style.background      = bg.color;
  el.stage.style.backgroundColor = bg.color;
  const tc = bg.dark ? '#F7F4EF'               : '#2E2E2E';
  const sc = bg.dark ? 'rgba(247,244,239,0.6)' : 'rgba(46,46,46,0.55)';
  el.tlPoem.style.color   = tc;
  el.tlSender.style.color = sc;
}

/* ═══════════════════════════════════
   FLOWER GRIDS
═══════════════════════════════════ */
function buildFlowerGrid(type) {
  const count  = FLOWER_COUNT;
  const target = el.flowerGrid;

  target.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const src   = `assets/f${i}.png`;
    const thumb = document.createElement('div');
    thumb.className = 'flower-thumb';

    const img = document.createElement('img');
    img.src     = src;
    img.alt     = `flower ${i}`;
    img.loading = 'lazy';
    img.onerror = () => { thumb.style.display = 'none'; };
    img.style.pointerEvents = 'none';

    thumb.appendChild(img);
    thumb.addEventListener('click', () => addFlower(src));
    target.appendChild(thumb);
  }
}

/* ═══════════════════════════════════
   ADD FLOWER
═══════════════════════════════════ */
async function addFlower(src) {
  const dataUrl = await toDataUrl(src);

  const sizePct = 18;
  const xPct    = 50 - sizePct/2 + (Math.random()-.5)*20;
  const yPct    = 50 - sizePct/2 + (Math.random()-.5)*20;

  const f = {
    id:       state.nextId++,
    src,
    dataUrl,
    xPct,
    yPct,
    sizePct,
    rotation: (Math.random()-.5)*30,
    zIndex:   state.nextZ++,
  };

  state.flowers.push(f);
  mountFlowerEl(f);
  selectFlower(f.id);
}

/* ═══════════════════════════════════
   MOUNT / POSITION FLOWER EL
═══════════════════════════════════ */
function mountFlowerEl(f) {
  const div = document.createElement('div');
  div.className  = 'canvas-flower-el';
  div.dataset.id = f.id;
  div.style.touchAction = 'none'; // critical for mobile pointer events

  const img = document.createElement('img');
  img.src = f.dataUrl || f.src;
  img.draggable = false;
  img.style.pointerEvents = 'none'; // div handles all events
  div.appendChild(img);

  // Resize handle (bottom-right)
  const rh = document.createElement('div');
  rh.className = 'resize-handle fh';
  rh.dataset.action = 'resize';
  rh.style.touchAction = 'none';

  // Rotate handle (top-center)
  const th = document.createElement('div');
  th.className = 'rotate-handle fh';
  th.dataset.action = 'rotate';
  th.innerHTML = '↻';
  th.style.touchAction = 'none';

  // Delete button
  const dh = document.createElement('button');
  dh.className = 'delete-btn';
  dh.innerHTML = '×';
  dh.addEventListener('pointerdown', e => {
    e.stopPropagation();
    e.preventDefault();
    deleteFlower(f.id);
  });

  div.appendChild(rh);
  div.appendChild(th);
  div.appendChild(dh);

  el.stage.appendChild(div);
  positionFlowerEl(f);

  // Bind drag/resize/rotate via pointer events
  bindFlowerEvents(div, f);

  div.classList.add('bloom-anim');
  div.addEventListener('animationend', () => div.classList.remove('bloom-anim'), {once: true});
}

function positionFlowerEl(f) {
  const div = getFlowerEl(f.id);
  if (!div) return;
  div.style.left      = `${f.xPct}%`;
  div.style.top       = `${f.yPct}%`;
  div.style.width     = `${f.sizePct}%`;
  div.style.height    = `${f.sizePct}%`;
  div.style.zIndex    = f.zIndex;
  div.style.transform = `rotate(${f.rotation}deg)`;
  div.classList.toggle('selected', state.selectedId === f.id);
}

function getFlowerEl(id) {
  return el.stage.querySelector(`.canvas-flower-el[data-id="${id}"]`);
}

function selectFlower(id) {
  state.selectedId = id;
  el.stage.querySelectorAll('.canvas-flower-el').forEach(d => {
    d.classList.toggle('selected', +d.dataset.id === id);
  });
}

function deleteFlower(id) {
  state.flowers = state.flowers.filter(f => f.id !== id);
  getFlowerEl(id)?.remove();
  if (state.selectedId === id) state.selectedId = null;
}

/* ═══════════════════════════════════
   DRAG / RESIZE / ROTATE
   Pure pointer events — no external
   library needed. Works on Android
   Chrome, iOS Safari, and desktop.
   setPointerCapture ensures moves fire
   even when finger leaves the element.
═══════════════════════════════════ */
function bindFlowerEvents(div, f) {
  div.addEventListener('pointerdown', e => {
    if (e.button && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    selectFlower(f.id);
    f.zIndex = state.nextZ++;
    positionFlowerEl(f);

    const action    = e.target.dataset?.action || 'move';
    const stageRect = el.stage.getBoundingClientRect();
    const cx = stageRect.left + stageRect.width  * (f.xPct/100 + f.sizePct/200);
    const cy = stageRect.top  + stageRect.height * (f.yPct/100 + f.sizePct/200);

    drag = {
      id:       f.id,
      action,
      startX:   e.clientX,
      startY:   e.clientY,
      origXPct: f.xPct,
      origYPct: f.yPct,
      origSize: f.sizePct,
      origRot:  f.rotation,
      centerX:  cx,
      centerY:  cy,
    };

    // Capture so pointermove fires anywhere on screen — key for mobile
    try { div.setPointerCapture(e.pointerId); } catch(_) {}
  });
}

document.addEventListener('pointermove', e => {
  if (!drag) return;
  e.preventDefault();

  const f = state.flowers.find(f => f.id === drag.id);
  if (!f) return;

  const stageRect = el.stage.getBoundingClientRect();
  const sw = stageRect.width;
  const sh = stageRect.height;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;

  if (drag.action === 'move') {
    f.xPct = drag.origXPct + (dx / sw * 100);
    f.yPct = drag.origYPct + (dy / sh * 100);
  } else if (drag.action === 'resize') {
    const delta = (dx + dy) / Math.min(sw, sh) * 100;
    f.sizePct   = Math.max(4, drag.origSize + delta);
  } else if (drag.action === 'rotate') {
    const a0 = Math.atan2(drag.startY - drag.centerY, drag.startX - drag.centerX);
    const a1 = Math.atan2(e.clientY   - drag.centerY, e.clientX  - drag.centerX);
    f.rotation = drag.origRot + (a1 - a0) * (180 / Math.PI);
  }

  positionFlowerEl(f);
}, { passive: false });

document.addEventListener('pointerup',     () => { drag = null; });
document.addEventListener('pointercancel', () => { drag = null; });

/* ═══════════════════════════════════
   TEXT LAYER
═══════════════════════════════════ */
function renderText() {
  el.tlPoem.textContent   = state.poem   || '';
  el.tlSender.textContent = state.sender ? `— ${state.sender}` : '';

  const stageH = el.stage.getBoundingClientRect().height || 600;
  const px     = stageH * (state.fontSize * 0.0012);
  el.tlPoem.style.fontSize   = `${Math.max(8, px)}px`;
  el.tlSender.style.fontSize = `${Math.max(7, px * 0.68)}px`;

  el.textLayer.style.textAlign = state.align;
  el.tlPoem.style.textAlign    = state.align;

  applyBg();
}

/* ═══════════════════════════════════
   MOBILE PANEL HELPERS
═══════════════════════════════════ */
function openMobilePanel() {
  el.leftPanel.classList.add('mobile-open');
  el.panelOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobilePanel() {
  el.leftPanel.classList.remove('mobile-open');
  el.panelOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════
   BIND INPUTS
═══════════════════════════════════ */
function bindInputs() {
  el.poemInput.addEventListener('input', () => { state.poem = el.poemInput.value; renderText(); });
  el.senderInput.addEventListener('input', () => { state.sender = el.senderInput.value; renderText(); });

  function onSliderChange() {
    state.fontSize = +el.fontSlider.value;
    el.fontVal.textContent = el.fontSlider.value + 'px';
    renderText();
  }
  el.fontSlider.addEventListener('input',  onSliderChange);
  el.fontSlider.addEventListener('change', onSliderChange);

  el.alignBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.align = btn.dataset.align;
      el.alignBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderText();
    });
  });

  // Tabs removed — flowers only

  el.arrangeBtn.addEventListener('click', autoArrange);
  el.inspireBtn.addEventListener('click', nextPrompt);
  el.downloadBtn.addEventListener('click', downloadBloom);
  el.dlBtnMob?.addEventListener('click', downloadBloom);
  el.clearBtn?.addEventListener('click', clearAll);
  $('#clear-btn-panel')?.addEventListener('click', clearAll);

  el.shareLinkBtn.addEventListener('click', openShareModal);
  el.shareClose.addEventListener('click', () => el.shareModal.classList.remove('open'));
  el.shareModal.addEventListener('click', e => { if (e.target === el.shareModal) el.shareModal.classList.remove('open'); });
  el.copyLinkBtn.addEventListener('click', copyShareLink);

  el.dlModalClose.addEventListener('click', () => el.dlModal.classList.remove('open'));
  el.dlModal.addEventListener('click', e => { if (e.target === el.dlModal) el.dlModal.classList.remove('open'); });

  el.mobilePanBtn?.addEventListener('click', () => {
    el.leftPanel.classList.contains('mobile-open') ? closeMobilePanel() : openMobilePanel();
  });
  $('#panel-handle')?.addEventListener('click', closeMobilePanel);
  el.panelOverlay?.addEventListener('click', closeMobilePanel);

  el.mobArrangeBtn?.addEventListener('click', () => {
    autoArrange();
    closeMobilePanel();
  });

  el.stage.addEventListener('pointerdown', e => {
    const isStageOrText = [el.stage, el.textLayer, el.tlPoem, el.tlSender].includes(e.target);
    if (isStageOrText) selectFlower(null);
  });

  window.addEventListener('resize', renderText);
}

/* ═══════════════════════════════════
   AUTO ARRANGE
═══════════════════════════════════ */
function autoArrange() {
  if (state.flowers.length === 0) {
    const picks = shuffle(range(1, FLOWER_COUNT)).slice(0, 8);
    // Wait for all addFlower promises then arrange
    Promise.all(picks.map(n => addFlower(`assets/f${n}.png`)))
      .then(() => setTimeout(doArrange, 80));
  } else {
    doArrange();
  }
}

function doArrange() {
  const zones = [
    {x:50, y:12, sx:32, sy:9 },
    {x:50, y:88, sx:32, sy:9 },
    {x:9,  y:50, sx:7,  sy:28},
    {x:91, y:50, sx:7,  sy:28},
    {x:18, y:22, sx:12, sy:12},
    {x:82, y:22, sx:12, sy:12},
    {x:18, y:78, sx:12, sy:12},
    {x:82, y:78, sx:12, sy:12},
    {x:36, y:9,  sx:14, sy:8 },
    {x:64, y:9,  sx:14, sy:8 },
  ];

  state.flowers.forEach((f, i) => {
    const z    = zones[i % zones.length];
    f.sizePct  = 13 + Math.random()*11;
    f.xPct     = z.x + (Math.random()-.5)*z.sx - f.sizePct/2;
    f.yPct     = z.y + (Math.random()-.5)*z.sy - f.sizePct/2;
    f.rotation = (Math.random()-.5)*60;
    f.zIndex   = state.nextZ++;
    positionFlowerEl(f);
  });

  showToast('Bouquet arranged ✦');
}

/* ═══════════════════════════════════
   INSPIRATION
═══════════════════════════════════ */
function nextPrompt() {
  state.inspIdx = (state.inspIdx + 1) % INSPIRATION.length;
  el.inspTxt.style.opacity = '0';
  setTimeout(() => {
    el.inspTxt.textContent   = INSPIRATION[state.inspIdx];
    el.inspTxt.style.opacity = '1';
  }, 280);
}

/* ═══════════════════════════════════
   SHARE LINK
═══════════════════════════════════ */
function openShareModal() {
  const data = {
    p: state.poem,
    s: state.sender,
    b: state.bgId,
    f: state.fontSize,
    a: state.align,
  };
  // Resolve bloom.html relative to the current page's directory
  const base    = location.href.replace(/\/[^/]*$/, '');
  let url = `${base}/bloom.html`;
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    url = `${base}/bloom.html?b=${encoded}`;
  } catch(e) {}

  el.shareLinkIn.value = url;
  el.shareModal.classList.add('open');
  setTimeout(() => { el.shareLinkIn.focus(); el.shareLinkIn.select(); }, 100);
}

function copyShareLink() {
  const text = el.shareLinkIn.value;
  if (!text) return;

  // On Android: use native Web Share API if available (shows share sheet)
  if (navigator.share) {
    navigator.share({
      title: 'KARWAAN — Where Poetry Finds Its Path',
      text:  'I made a bloom for you ✦',
      url:   text,
    }).then(() => showToast('Shared ✦'))
      .catch(() => fallbackCopy(text));
    return;
  }

  fallbackCopy(text);
}

function fallbackCopy(text) {
  // Modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => flashCopied())
      .catch(() => legacyCopy(text));
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch(_) {}
  document.body.removeChild(ta);
  if (ok) { flashCopied(); } else {
    el.shareLinkIn.focus();
    el.shareLinkIn.select();
    showToast('Press Ctrl+C / Cmd+C to copy');
  }
}

function flashCopied() {
  const btn  = el.copyLinkBtn;
  const orig = btn.textContent;
  btn.textContent = '✓ Copied!';
  btn.style.background = '#4a7a5a';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2200);
  showToast('Link copied to clipboard ✦');
}

function checkSharedBloom() {
  const hash = location.hash;
  if (!hash.startsWith('#bloom=')) return;
  try {
    const encoded = hash.slice(7);
    const data    = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (data.p) state.poem     = data.p;
    if (data.s) state.sender   = data.s;
    if (data.b) state.bgId     = data.b;
    if (data.f) state.fontSize = data.f;
    if (data.a) state.align    = data.a;
  } catch(_) {}
}

/* ═══════════════════════════════════
   STORY CANVAS — off-screen 1080x1920
   exact export replica
═══════════════════════════════════ */
function buildStoryCanvas() {
  const scStage  = document.getElementById('storyCanvas-stage');
  const scPoem   = document.getElementById('sc-poem');
  const scSender = document.getElementById('sc-sender');
  if (!scStage || !scPoem || !scSender) return;

  const bg = BACKGROUNDS.find(b => b.id === state.bgId) || BACKGROUNDS[0];
  scStage.style.background = bg.color;

  const stageH      = el.stage.getBoundingClientRect().height || 400;
  const scaleFactor = 1920 / stageH;
  const px          = stageH * (state.fontSize * 0.0012) * scaleFactor;
  const tc = bg.dark ? '#F7F4EF'               : '#2E2E2E';
  const sc = bg.dark ? 'rgba(247,244,239,0.6)' : 'rgba(46,46,46,0.55)';

  scPoem.textContent = state.poem || '';
  scPoem.style.cssText = `
    font-family:'EB Garamond',serif;
    font-size:${Math.max(24, px)}px;
    text-align:${state.align};
    color:${tc};
    white-space:pre-wrap;
    word-break:break-word;
    overflow-wrap:break-word;
    max-width:100%;
    line-height:1.7;
  `;

  scSender.textContent = state.sender ? `— ${state.sender}` : '';
  scSender.style.cssText = `
    font-family:'EB Garamond',serif;
    font-size:${Math.max(18, px * 0.68)}px;
    text-align:${state.align};
    width:100%;
    color:${sc};
    font-style:italic;
    margin-top:2.5rem;
    word-break:break-word;
  `;

  scStage.querySelectorAll('.sc-flower').forEach(n => n.remove());

  state.flowers.forEach(f => {
    const div = document.createElement('div');
    div.className = 'sc-flower';
    div.style.cssText = `
      position:absolute;
      left:${f.xPct * 10.80}px;
      top:${f.yPct * 19.20}px;
      width:${f.sizePct * 10.80}px;
      height:${f.sizePct * 19.20}px;
      transform:rotate(${f.rotation}deg);
      z-index:${f.zIndex};
      pointer-events:none;
    `;
    const img = document.createElement('img');
    img.src = f.dataUrl || f.src;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
    div.appendChild(img);
    scStage.appendChild(div);
  });
}

/* ═══════════════════════════════════
   DOWNLOAD
   Android fix: capture live stage at
   2x scale (not 1080×1920 storyCanvas
   which exhausts mobile memory).
   Use window.open() instead of
   anchor.click() — Android blocks
   programmatic anchor downloads.
═══════════════════════════════════ */
async function downloadBloom() {
  if (typeof html2canvas === 'undefined') {
    showToast('Export library loading, please wait…');
    return;
  }

  selectFlower(null);
  showToast('Creating your bloom…');
  await sleep(120);

  const stageEl  = el.stage;
  const rect     = stageEl.getBoundingClientRect();
  const bgColor  = BACKGROUNDS.find(b => b.id === state.bgId)?.color || '#F7F4EF';

  // Use 2× scale — enough quality, won't crash mobile memory
  const scale = Math.min(2, EXPORT_W / rect.width);

  try {
    const canvas = await html2canvas(stageEl, {
      scale,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: bgColor,
      logging:         false,
      ignoreElements:  node => node.id === 'petal-canvas',
      onclone: (doc) => {
        const s = doc.getElementById('canvas-stage');
        if (s) {
          s.style.background      = bgColor;
          s.style.backgroundColor = bgColor;
        }
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);

    // Try anchor download first (works on desktop + some Android)
    const link = document.createElement('a');
    link.download = 'karwaan-bloom.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // On Android, anchor.click() often does nothing — open in new tab as fallback
    // User can then long-press → Save Image
    setTimeout(() => {
      showToast('✦ Saved! If not, long-press the image to save.');
      setTimeout(() => el.dlModal.classList.add('open'), 600);
    }, 400);

  } catch(err) {
    console.error('Download failed:', err);
    showToast('Could not export — try on desktop Chrome');
  }
}

/* ═══════════════════════════════════
   CLEAR
═══════════════════════════════════ */
function clearAll() {
  state.flowers    = [];
  state.selectedId = null;
  el.stage.querySelectorAll('.canvas-flower-el').forEach(d => d.remove());
}

/* ═══════════════════════════════════
   UTILITIES
═══════════════════════════════════ */
function range(from, to) {
  return Array.from({length: to - from + 1}, (_, i) => from + i);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let toastTimer;
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════
   BOOT
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  cacheEl();

  // Always show landing first, hide editor
  el.landing.style.display = '';
  el.editor.classList.remove('active');
  el.editor.style.display = 'none';

  initPetals();
  initLanding();
  checkSharedBloom();

  el.enterBtn.addEventListener('click', () => {
    el.landing.style.display = 'none';
    el.editor.style.display  = '';
    el.editor.classList.add('active');
    buildBgOptions();
    buildFlowerGrid();
    bindInputs();
    applyBg();
    renderText();

    if (state.poem)   el.poemInput.value   = state.poem;
    if (state.sender) el.senderInput.value = state.sender;
    el.fontSlider.value    = state.fontSize;
    el.fontVal.textContent = state.fontSize + 'px';
    el.alignBtns.forEach(b => b.classList.toggle('active', b.dataset.align === state.align));
    if (location.hash.startsWith('#bloom=')) {
      setTimeout(() => showToast('✦ A bloom was shared with you'), 800);
    }
  });
});
