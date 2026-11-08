/* Felipe Furlan · landing page
   Vanilla JS + GSAP/ScrollTrigger + Lenis + three.js (todos via CDN, sem build). */

// Endereço do mundo 3D (versão com carrinho). Enquanto não estiver no ar, fica null
// e o botão "Ver em 3D" mostra um aviso em vez de navegar.
const WORLD_URL = null;
// Endereço do site do DCE, para o card da vitrine. null = rola até o contato.
const DCE_URL = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const desktop = () => matchMedia('(min-width: 901px)').matches;

gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: 0 });
  else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : $(target)?.scrollIntoView({ behavior: 'smooth' }));
};
$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();
  closeMenu();
  scrollTo(href === '#top' ? 0 : href);
}));

/* ---------- Toast ---------- */
const toastEl = $('[data-toast]');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
}

/* ---------- Loader ---------- */
function runLoader() {
  const loader = $('.loader');
  const word = $('[data-loader-word]');
  const count = $('[data-loader-count]');
  if (reduce) { loader.remove(); document.body.classList.remove('is-loading'); return Promise.resolve(); }
  const words = ['Olá', 'Hello', 'Hola', 'Ciao', 'Bonjour', 'Olá'];
  let i = 0;
  const iv = setInterval(() => { i = Math.min(i + 1, words.length - 1); word.textContent = words[i]; }, 210);
  const c = { v: 0 };
  return new Promise((res) => {
    gsap.to(c, {
      v: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: () => (count.textContent = Math.round(c.v)),
      onComplete: () => {
        clearInterval(iv);
        gsap.to(loader, {
          yPercent: -100, duration: 0.9, ease: 'power4.inOut',
          onComplete: () => { loader.remove(); document.body.classList.remove('is-loading'); },
        });
        setTimeout(res, 350);
      },
    });
  });
}

/* ---------- Cursor ---------- */
if (finePointer && !reduce) {
  const cur = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor__label');
  cur.classList.add('is-hidden'); dot.classList.add('is-hidden');
  window.addEventListener('mousemove', () => { cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); }, { once: true });
  const cx = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  window.addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener('mouseleave', () => { cur.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
  document.addEventListener('mouseenter', () => { cur.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); });
  document.addEventListener('mouseover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button');
    cur.classList.toggle('is-label', !!lab);
    cur.classList.toggle('is-hover', !lab && !!hov);
    if (lab) label.textContent = lab.dataset.cursor;
  });
} else {
  $('.cursor')?.remove(); $('.cursor-dot')?.remove();
}

/* ---------- Botões magnéticos ---------- */
if (finePointer && !reduce) {
  $$('.magnetic').forEach((el) => {
    const inner = $('.magnetic__inner', el) || el;
    const k = parseFloat(el.dataset.strength || 0.35);
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * k, y: my * k, duration: 0.6, ease: 'power3.out' });
      gsap.to(inner, { x: mx * k * 0.45, y: my * k * 0.45, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to([el, inner], { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

/* ---------- Menu flutuante ---------- */
const fab = $('.fab');
function closeMenu() { document.body.classList.remove('menu-open'); fab.setAttribute('aria-expanded', 'false'); }
$$('[data-menu-toggle]').forEach((b) => b.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  fab.setAttribute('aria-expanded', String(open));
}));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeLightbox(); } });
ScrollTrigger.create({
  trigger: '.hero', start: 'bottom 85%',
  onEnter: () => gsap.to(fab, { scale: 1, duration: 0.5, ease: 'back.out(2)' }),
  onLeaveBack: () => { closeMenu(); gsap.to(fab, { scale: 0, duration: 0.35, ease: 'power3.in' }); },
});

/* ---------- Portal para o mundo 3D ---------- */
$$('[data-world]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  if (!WORLD_URL) { toast('O mundo 3D está sendo construído. Em breve!'); return; }
  gsap.to('.curtain', { yPercent: 0, duration: 0.8, ease: 'power4.inOut', onComplete: () => (location.href = WORLD_URL) });
}));
// voltar pelo histórico: tira a cortina
gsap.set('.curtain', { yPercent: 100 });
window.addEventListener('pageshow', () => gsap.set('.curtain', { yPercent: 100 }));

/* ---------- Hero: cards inclinados ---------- */
const cards = $$('[data-cards] .card');
function layoutCards() {
  const n = cards.length;
  const spread = Math.min(window.innerWidth * 0.15, 230);
  cards.forEach((c, i) => {
    const o = i - (n - 1) / 2;
    c.dataset.x = o * spread;
    c.dataset.r = o * 6;
    c.dataset.y = Math.abs(o) * 22;
    gsap.set(c, { xPercent: -50, yPercent: -50, x: +c.dataset.x, y: +c.dataset.y, rotation: +c.dataset.r, rotationY: o * -8, zIndex: 10 - Math.round(Math.abs(o)) });
  });
}
layoutCards();
window.addEventListener('resize', layoutCards);
if (finePointer && !reduce) {
  const hero = $('.hero');
  hero.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    cards.forEach((c, i) => {
      const depth = 1 + (i % 3) * 0.4;
      gsap.to(c, { x: +c.dataset.x + nx * 40 * depth, y: +c.dataset.y + ny * 26 * depth, rotationX: -ny * 14, duration: 1, ease: 'power3.out' });
    });
  });
  cards.forEach((c) => {
    c.addEventListener('mouseenter', () => gsap.to(c, { scale: 1.08, rotation: 0, zIndex: 20, duration: 0.6, ease: 'power3.out' }));
    c.addEventListener('mouseleave', () => gsap.to(c, { scale: 1, rotation: +c.dataset.r, zIndex: 10, duration: 0.8, ease: 'power3.out' }));
  });
}

/* ---------- Marquee do nome ---------- */
const track = $('[data-marquee]');
let mx = 0, dir = -1, boost = 0;
gsap.ticker.add(() => {
  if (reduce) return;
  mx += (0.04 + boost) * dir;
  boost *= 0.92;
  if (mx <= -50) mx += 50;
  if (mx > 0) mx -= 50;
  gsap.set(track, { xPercent: mx });
});
ScrollTrigger.create({
  onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(self.getVelocity()) / 4000, 0.6); },
});

/* ---------- Animação de entrada ---------- */
function intro() {
  if (reduce) return;
  const tl = gsap.timeline();
  tl.from('.marquee__item', { yPercent: 110, duration: 1.2, ease: 'power4.out' })
    .from(cards, { y: '+=' + window.innerHeight * 0.6, rotation: 0, opacity: 0, duration: 1.4, stagger: 0.07, ease: 'power4.out' }, 0.1)
    .from('[data-reveal]', { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 0.4)
    .from('.nav > *', { y: -20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.5);
}
// cards se abrem ao rolar para fora do hero
if (!reduce) {
  gsap.to('[data-cards]', { yPercent: -18, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- Statement: palavras acendem com o scroll ---------- */
const st = $('[data-words]');
st.innerHTML = st.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
if (!reduce) {
  gsap.to($$('.w', st), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true } });
}

/* ---------- Vitrine de projetos (estilo Robin Noguier) ---------- */
(function showcase() {
  const items = $$('.show__item');
  const panels = $$('.panel');
  const n = items.length;
  const dotsNav = $('[data-show-dots]');
  const thumbs = $('.show__thumbs');
  const counter = $('[data-show-count]');
  $('[data-show-total]').textContent = String(n).padStart(2, '0');
  if (DCE_URL) { const a = $('[data-dce-link]'); a.href = DCE_URL; a.target = '_blank'; a.rel = 'noreferrer'; a.removeAttribute('data-scroll'); }

  // letras do título separadas para a animação
  items.forEach((it) => {
    const h = $('.show__title', it);
    h.setAttribute('aria-label', h.textContent);
    h.innerHTML = h.textContent.split(' ').map((w) => `<span class="wd" aria-hidden="true">${[...w].map((ch) => `<span class="ch">${ch}</span>`).join('')}</span>`).join(' ');
  });

  // miniaturas e versão mobile reaproveitam a arte dos painéis
  panels.forEach((p, i) => {
    const t = document.createElement('div');
    t.className = 'show__thumb';
    t.style.setProperty('--c', getComputedStyle(items[i]).getPropertyValue('--c'));
    t.appendChild($('.art', p).cloneNode(true));
    thumbs.appendChild(t);
    const m = document.createElement('div');
    m.className = 'show__mobile-art';
    m.appendChild($('.art', p).cloneNode(true));
    items[i].prepend(m);
    const d = document.createElement('button');
    d.setAttribute('aria-label', items[i].querySelector('.show__title').getAttribute('aria-label'));
    dotsNav.appendChild(d);
  });
  const dots = $$('button', dotsNav);
  const thumbEls = $$('.show__thumb', thumbs);

  let active = -1;
  function setActive(i, animate = true) {
    if (i === active) return;
    const prev = active;
    active = i;
    counter.textContent = String(i + 1).padStart(2, '0');
    [items, panels, dots, thumbEls].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-active', k === i)));
    if (!animate || reduce) return;
    const down = i > prev;
    const it = items[i];
    gsap.fromTo($$('.ch', it), { yPercent: down ? 100 : -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: 'power4.out' });
    gsap.fromTo([$('p', it), $('.show__link', it)], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.12, stagger: 0.06, ease: 'power3.out' });
  }
  setActive(0, false);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const stack = $('[data-show-stack]');
    const step = () => panels[0].offsetHeight * 1.12;
    const place = () => panels.forEach((p, i) => gsap.set(p, { y: i * step() }));
    place();
    window.addEventListener('resize', place);
    const trig = ScrollTrigger.create({
      trigger: '[data-show]', start: 'top top', end: () => '+=' + window.innerHeight * 0.9 * (n - 1),
      pin: true, scrub: true, invalidateOnRefresh: true,
      snap: reduce ? false : { snapTo: 1 / (n - 1), inertia: false, duration: { min: 0.25, max: 0.7 }, ease: 'power2.inOut', delay: 0.1 },
      onUpdate: (self) => {
        const f = self.progress * (n - 1);
        gsap.set(stack, { y: -f * step() });
        setActive(Math.round(f));
      },
    });
    dots.forEach((d, i) => d.addEventListener('click', () => scrollTo(trig.start + (trig.end - trig.start) * (i / (n - 1)))));
    return () => { window.removeEventListener('resize', place); gsap.set(panels, { clearProps: 'all' }); gsap.set(stack, { clearProps: 'all' }); };
  });
})();

/* ---------- Carreira: rolagem horizontal ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 901px)', () => {
  const trackEl = $('[data-career-track]');
  const dist = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
  const tween = gsap.to(trackEl, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '[data-career]', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  gsap.to('[data-career-bar]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-career]', start: 'top top', end: () => '+=' + dist(), scrub: true } });
  return () => tween.kill();
});

/* ---------- Revelações genéricas ---------- */
if (!reduce) {
  $$('.head h2, .about h2, .contact h2').forEach((h) => {
    gsap.from(h, { yPercent: 60, opacity: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.mile').forEach((m, i) => gsap.from(m, { y: 40, opacity: 0, duration: 0.9, delay: (i % 4) * 0.05, ease: 'power3.out', scrollTrigger: { trigger: m, start: 'top 95%' } }));
  gsap.to('[data-parallax]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.chip', { y: 16, opacity: 0, duration: 0.6, stagger: 0.025, ease: 'power3.out', scrollTrigger: { trigger: '.skills', start: 'top 85%' } });
  gsap.from('.contact .round-btn', { scale: 0, rotation: -40, duration: 1.2, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: '.contact__line', start: 'top 90%' } });
}

/* ---------- Contadores do triatlo ---------- */
$$('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
  const fmt = (v) => v.toFixed(dec).replace('.', ',');
  if (reduce) { el.textContent = fmt(end); return; }
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) }),
  });
});

/* ---------- Galeria: arrastar com inércia ---------- */
(function gallery() {
  const strip = $('[data-gallery]');
  const shots = $$('.shot', strip);
  let x = 0, target = 0, down = false, startX = 0, startT = 0, moved = 0, vel = 0, lastX = 0;
  const min = () => -(strip.scrollWidth - window.innerWidth);
  const clamp = (v) => Math.max(min(), Math.min(0, v));
  strip.addEventListener('pointerdown', (e) => { down = true; moved = 0; startX = lastX = e.clientX; startT = target; strip.classList.add('is-dragging'); });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const d = e.clientX - startX; moved = Math.max(moved, Math.abs(d));
    vel = e.clientX - lastX; lastX = e.clientX;
    target = clamp(startT + d * 1.4);
  });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; strip.classList.remove('is-dragging'); target = clamp(target + vel * 14); });
  // rolar a página também move a faixa um pouco
  ScrollTrigger.create({ trigger: '.gallery', start: 'top bottom', end: 'bottom top', onUpdate: (s) => { if (!down) target = clamp(target - s.getVelocity() / 140); } });
  gsap.ticker.add(() => {
    const prev = x;
    x += (target - x) * 0.09;
    const skew = Math.max(-8, Math.min(8, (x - prev) * 0.25));
    gsap.set(shots, { x, skewX: reduce ? 0 : skew });
  });
  window.addEventListener('resize', () => (target = clamp(target)));

  shots.forEach((s) => s.addEventListener('click', (e) => {
    if (moved > 8) { e.preventDefault(); return; }
    openLightbox($('img', s).src, $('b', s).textContent + ' · ' + $('.shot__cap span', s).textContent, s.dataset.desc);
  }));
})();

const lb = $('[data-lightbox]');
function openLightbox(src, title, desc) {
  $('img', lb).src = src; $('img', lb).alt = title;
  $('b', lb).textContent = title; $('figcaption span', lb).textContent = desc || '';
  lb.classList.add('is-open'); lenis?.stop();
}
function closeLightbox() { lb.classList.remove('is-open'); lenis?.start(); }
$('[data-lightbox-close]').addEventListener('click', closeLightbox);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

/* ---------- Contato ---------- */
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('E-mail copiado'); }
  catch { location.href = 'mailto:' + b.dataset.copy; }
}));
const clock = $('[data-clock]');
const tick = () => (clock.textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date()) + ' BRT');
tick(); setInterval(tick, 30000);

/* ---------- Portal: carrinho 3D (three.js) ---------- */
(function car3d() {
  const host = $('[data-car-canvas]');
  if (!window.THREE || !host) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(8.5, 6, 9.5);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x5f8a52, 0.62));
  const sun = new THREE.DirectionalLight(0xfff2cc, 0.75);
  sun.position.set(5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  scene.add(sun);

  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true });
  const world = new THREE.Group();
  scene.add(world);

  // ilha de grama
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.5, 40), mat(0xa9cf95));
  ground.position.y = -0.25; ground.receiveShadow = true; world.add(ground);
  const road = new THREE.Mesh(new THREE.RingGeometry(2.3, 3.1, 48), mat(0xeae6dc));
  road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; world.add(road);

  // árvores
  const tree = (x, z, s = 1) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), mat(0x8a6a4a)); trunk.position.y = 0.25;
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), mat(0x5fa36f)); top.position.y = 0.8;
    [trunk, top].forEach((m) => { m.castShadow = true; g.add(m); });
    g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
  };
  tree(-3.6, -1.2, 1.1); tree(-3.2, 1.6, 0.9); tree(3.5, -1.8, 1); tree(1.2, -3.6, 0.8); tree(-1, 3.6, 1.2);

  // carrinho
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1), mat(0xff7a6b)); body.position.y = 0.45;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1, 0.42, 0.86), mat(0xfbfcf7)); cabin.position.set(-0.15, 0.9, 0);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.76), mat(0x79b4dc)); glass.position.set(0.37, 0.9, 0);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), mat(0xffe46b));
  const l1 = lamp.clone(); l1.position.set(0.96, 0.5, 0.3); const l2 = lamp.clone(); l2.position.set(0.96, 0.5, -0.3);
  [body, cabin, glass, l1, l2].forEach((m) => { m.castShadow = true; car.add(m); });
  const wheelG = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14); wheelG.rotateX(Math.PI / 2);
  const wheels = [[0.6, 0.5], [0.6, -0.5], [-0.6, 0.5], [-0.6, -0.5]].map(([x, z]) => {
    const w = new THREE.Mesh(wheelG, mat(0x1f3a2e)); w.position.set(x, 0.22, z); w.castShadow = true; car.add(w); return w;
  });
  world.add(car);

  // placa "Ver como site" ao lado da pista
  const sign = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), mat(0x1f3a2e)); post.position.y = 0.45;
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.06), mat(0xffe46b)); board.position.y = 0.95;
  [post, board].forEach((m) => { m.castShadow = true; sign.add(m); });
  sign.position.set(0, 0, 1.4); world.add(sign);

  function resize() {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // arrastar para girar + scroll dá impulso
  let rotY = 0.6, vel = 0.004, dragging = false, lx = 0;
  host.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', (e) => { if (!dragging) return; vel = (e.clientX - lx) * 0.0025; lx = e.clientX; });
  host.addEventListener('pointerup', () => (dragging = false));
  ScrollTrigger.create({ trigger: host, start: 'top bottom', end: 'bottom top', onUpdate: (s) => (vel += s.getVelocity() / 600000) });

  let visible = false, angle = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
  gsap.ticker.add(() => {
    if (!visible) return;
    rotY += vel;
    vel += (0.004 - vel) * (dragging ? 0 : 0.03);
    world.rotation.y = rotY;
    angle += reduce ? 0 : 0.012;
    const R = 2.7;
    car.position.set(Math.cos(angle) * R, 0, Math.sin(angle) * R);
    car.rotation.y = -angle - Math.PI / 2;
    car.position.y = Math.abs(Math.sin(angle * 9)) * 0.03;
    wheels.forEach((w) => (w.rotation.z -= 0.25));
    renderer.render(scene, camera);
  });
})();

/* ---------- Start ---------- */
runLoader().then(() => { intro(); ScrollTrigger.refresh(); });
