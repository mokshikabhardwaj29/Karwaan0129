/* ================================
   KARWAAN: The Flower Shop
   script.js — v5.1 (Complete & Clean)
   Features: Pointer Events, CORS-safe Export, Mobile-first
================================ */
'use strict';

/* ═══════════════════════════════════
   CONFIG
═══════════════════════════════════ */
const FLOWER_COUNT = 15;

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
   IMAGE TO DATA URL (CORS fix)
═══════════════════════════════════ */
function toDataUrl(src) {
  if (imgCache[src]) return Promise.resolve(imgCache[src]);
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width  = img.naturalWidth  || 200;
        cv.height = img.naturalHeight || 200;
        cv.getContext('2d').drawImage(img, 0, 0);
        const url = cv.toDataURL('image/png');
        imgCache[src] = url;
        resolve(url);
      } catch(e) {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/* ═══════════════════════════════════
   FLOATING PETALS & LANDING
═══════════════════════════════════ */
function initPetals() {
  const cv = el.petalCanvas;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H;
  const petals = [];
  const COLS = ['#EAD7D7','#E6E0F2','#DDE6E1','#F5DDD5','#F0E8E3'];

  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize();

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
      return (this.y > H+20) ? new Petal(false) : this;
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

  for (let i = 0; i < 30; i++) petals.push(new Petal(true));
  window.addEventListener('resize', resize);
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach((p, i) => { petals[i] = p.tick(); p.draw(); });
    requestAnimationFrame(loop);
  })();
}

function initLanding() {
  const wrap = $('.landing-flowers');
  const titleWrap = $('.hero-title-wrap');
  const positions = [
    {x:4, y:6, rot:-28}, {x:83, y:4, rot:32},
    {x:1, y:44, rot:-55}, {x:87, y:42, rot:58},
    {x:8, y:82, rot:-14}, {x:79, y:83, rot:22},
    {x:40, y:1, rot:5},   {x:46, y:91, rot:175},
  ];
  const picks = shuffle(range(1, FLOWER_COUNT)).slice(0, positions.length);

  positions.forEach((p, i) => {
    const img = document.createElement('img');
    img.className = 'landing-flower';
    img.src = `assets/f${picks[i]}.png`;
    img.style.cssText = `left:${p.x}%; top:${p.y}%; --rot:${p.rot}deg; width:clamp(70px, 10vw, 145px);`;
    wrap.appendChild(img);
    setTimeout(() => img.classList.add('bloomed'), 250 + i*120);
  });

  setTimeout(() => {
    titleWrap.classList.add('revealed');
    setTimeout(() => document.querySelectorAll('.landing-flower').forEach(img => img.classList.add('parted')), 900);
  }, 1700);
}

/* ═══════════════════════════════════
   EDITOR CORE
═══════════════════════════════════ */
function buildBgOptions() {
  el.bgOptions.innerHTML = '';
  BACKGROUNDS.forEach(bg => {
    const sw = document.createElement('div');
    sw.className = `bg-swatch ${bg.id === state.bgId ? 'active' : ''}`;
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
  el.stage.style.backgroundColor = bg.color;
  const tc = bg.dark ? '#F7F4EF' : '#2E2E2E';
  el.tlPoem.style.color = tc;
  el.tlSender.style.color = bg.dark ? 'rgba(247,244,239,0.6)' : 'rgba(46,46,46,0.55)';
}

function buildFlowerGrid() {
  el.flowerGrid.innerHTML = '';
  for (let i = 1; i <= FLOWER_COUNT; i++) {
    const src = `assets/f${i}.png`;
    const thumb = document.createElement('div');
    thumb.className = 'flower-thumb';
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    thumb.appendChild(img);
    thumb.addEventListener('click', () => addFlower(src));
    el.flowerGrid.appendChild(thumb);
  }
}

async function addFlower(src) {
  const dataUrl = await toDataUrl(src);
  const sizePct = 18;
  const f = {
    id: state.nextId++,
    src,
    dataUrl,
    xPct: 40 + (Math.random()*10),
    yPct: 40 + (Math.random()*10),
    sizePct,
    rotation: (Math.random()-.5)*30,
    zIndex: state.nextZ++,
  };
  state.flowers.push(f);
  mountFlowerEl(f);
  selectFlower(f.id);
}

function mountFlowerEl(f) {
  const div = document.createElement('div');
  div.className = 'canvas-flower-el';
  div.dataset.id = f.id;
  div.style.touchAction = 'none';

  div.innerHTML = `
    <img src="${f.dataUrl || f.src}" draggable="false" style="pointer-events:none; width:100%; height:100%;">
    <div class="resize-handle fh" data-action="resize"></div>
    <div class="rotate-handle fh" data-action="rotate">↻</div>
    <button class="delete-btn">×</button>
  `;

  div.querySelector('.delete-btn').addEventListener('pointerdown', e => {
    e.stopPropagation();
    deleteFlower(f.id);
  });

  el.stage.appendChild(div);
  positionFlowerEl(f);
  bindFlowerEvents(div, f);
  div.classList.add('bloom-anim');
}

function positionFlowerEl(f) {
  const div = el.stage.querySelector(`.canvas-flower-el[data-id="${f.id}"]`);
  if (!div) return;
  div.style.cssText = `
    left:${f.xPct}%; top:${f.yPct}%; width:${f.sizePct}%; height:${f.sizePct}%;
    z-index:${f.zIndex}; transform:rotate(${f.rotation}deg); touch-action:none; position:absolute;
  `;
  div.classList.toggle('selected', state.selectedId === f.id);
}

/* ═══════════════════════════════════
   INTERACTIONS
═══════════════════════════════════ */
function bindFlowerEvents(div, f) {
  div.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectFlower(f.id);
    f.zIndex = state.nextZ++;
    positionFlowerEl(f);

    const action = e.target.dataset?.action || 'move';
    const rect = el.stage.getBoundingClientRect();
    
    drag = {
      id: f.id, action, startX: e.clientX, startY: e.clientY,
      origXPct: f.xPct, origYPct: f.yPct, origSize: f.sizePct, origRot: f.rotation,
      centerX: rect.left + rect.width * (f.xPct/100 + f.sizePct/200),
      centerY: rect.top + rect.height * (f.yPct/100 + f.sizePct/200)
    };
    div.setPointerCapture(e.pointerId);
  });
}

document.addEventListener('pointermove', e => {
  if (!drag) return;
  const f = state.flowers.find(f => f.id === drag.id);
  const rect = el.stage.getBoundingClientRect();
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;

  if (drag.action === 'move') {
    f.xPct = drag.origXPct + (dx / rect.width * 100);
    f.yPct = drag.origYPct + (dy / rect.height * 100);
  } else if (drag.action === 'resize') {
    f.sizePct = Math.max(5, drag.origSize + (dx / rect.width * 100));
  } else if (drag.action === 'rotate') {
    const a0 = Math.atan2(drag.startY - drag.centerY, drag.startX - drag.centerX);
    const a1 = Math.atan2(e.clientY - drag.centerY, e.clientX - drag.centerX);
    f.rotation = drag.origRot + (a1 - a0) * (180 / Math.PI);
  }
  positionFlowerEl(f);
});

document.addEventListener('pointerup', () => drag = null);

function selectFlower(id) {
  state.selectedId = id;
  el.stage.querySelectorAll('.canvas-flower-el').forEach(d => d.classList.toggle('selected', +d.dataset.id === id));
}

function deleteFlower(id) {
  state.flowers = state.flowers.filter(f => f.id !== id);
  el.stage.querySelector(`.canvas-flower-el[data-id="${id}"]`)?.remove();
}

/* ═══════════════════════════════════
   EXPORT & UTILS
═══════════════════════════════════ */
async function downloadBloom() {
  if (typeof html2canvas === 'undefined') return showToast('Loading library...');
  selectFlower(null);
  showToast('Creating your bloom... ✦');
  
  await sleep(300);
  try {
    const canvas = await html2canvas(el.stage, { scale: 2, useCORS: true, backgroundColor: null });
    const link = document.createElement('a');
    link.download = `Karwaan-Bloom-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Saved to gallery ✦');
  } catch(e) { showToast('Export failed'); }
}

function autoArrange() {
  const zones = [{x:10,y:10},{x:80,y:10},{x:10,y:80},{x:80,y:80},{x:45,y:5},{x:45,y:85}];
  if (state.flowers.length === 0) {
    Promise.all(shuffle(range(1, 15)).slice(0, 6).map(n => addFlower(`assets/f${n}.png`))).then(doLayout);
  } else doLayout();

  function doLayout() {
    state.flowers.forEach((f, i) => {
      const z = zones[i % zones.length];
      f.xPct = z.x + (Math.random()*5);
      f.yPct = z.y + (Math.random()*5);
      positionFlowerEl(f);
    });
    showToast('Bouquet arranged ✦');
  }
}

function renderText() {
  el.tlPoem.textContent = state.poem;
  el.tlSender.textContent = state.sender ? `— ${state.sender}` : '';
  const h = el.stage.offsetHeight;
  el.tlPoem.style.fontSize = `${h * (state.fontSize * 0.0012)}px`;
  el.textLayer.style.textAlign = state.align;
}

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  setTimeout(() => el.toast.classList.remove('show'), 2500);
}

const range = (f, t) => Array.from({length: t-f+1}, (_, i) => f+i);
const shuffle = a => [...a].sort(() => Math.random() - 0.5);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ═══════════════════════════════════
   BOOT
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  cacheEl();
  initPetals();
  initLanding();

  el.enterBtn.addEventListener('click', () => {
    el.landing.style.display = 'none';
    el.editor.style.display = 'flex';
    el.editor.classList.add('active');
    buildBgOptions();
    buildFlowerGrid();
    applyBg();
  });

  el.poemInput.addEventListener('input', e => { state.poem = e.target.value; renderText(); });
  el.senderInput.addEventListener('input', e => { state.sender = e.target.value; renderText(); });
  el.fontSlider.addEventListener('input', e => { state.fontSize = e.target.value; el.fontVal.textContent = e.target.value+'px'; renderText(); });
  el.downloadBtn.addEventListener('click', downloadBloom);
  el.arrangeBtn.addEventListener('click', autoArrange);
  el.inspireBtn.addEventListener('click', () => {
    state.inspIdx = (state.inspIdx + 1) % INSPIRATION.length;
    el.inspTxt.textContent = INSPIRATION[state.inspIdx];
  });
  
  el.alignBtns.forEach(btn => btn.addEventListener('click', () => {
    state.align = btn.dataset.align;
    el.alignBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderText();
  }));
});
