/* Felipe Furlan · landing page
   Vanilla JS + GSAP/ScrollTrigger + Lenis (vendored, sem build).
   Timings e curvas vêm das referências estudadas:
   - entrada de texto: y 40→0 em 0.6s, ease [0.33,1,0.68,1] (Dennis Snellenberg)
   - preloader: cortina sobe em 0.8s, ease [0.76,0,0.24,1] (Olivier Larose)
   - magnético: 35% do deslocamento do mouse, elastic.out(1, 0.3)
   - vitrine: seção fixa, scroll troca o projeto e desliza a pilha inclinada (Robin Noguier)
*/

const WORLD_URL = null; // endereço do mundo 3D, quando estiver no ar
const DCE_URL = null;   // endereço do site do DCE

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => matchMedia('(min-width: 901px)').matches;

gsap.registerPlugin(ScrollTrigger);
const outEase = 'power3.out';
const ioEase = 'power4.inOut';

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
  else $(target)?.scrollIntoView({ behavior: 'smooth' });
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

/* ---------- Split em palavras ---------- */
function splitWords(el, masked) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = w;
    if (masked) {
      const mask = document.createElement('span');
      mask.className = 'words-mask';
      mask.appendChild(span);
      el.appendChild(mask);
    } else el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return $$('.w', el);
}

/* ---------- Abertura: saudações ---------- */
function runPreloader() {
  const pre = $('[data-pre]');
  if (reduce) { pre.remove(); document.body.classList.remove('is-loading'); return Promise.resolve(); }
  const word = $('[data-pre-word]');
  const path = $('[data-pre-path]');
  const words = ['Olá', 'Hello', 'Hola', 'Ciao', 'Bonjour', 'Hallo', 'こんにちは', 'Olá'];
  const W = innerWidth, H = innerHeight;
  const initial = `M0 0 L${W} 0 L${W} ${H} Q${W / 2} ${H + 300} 0 ${H} L0 0`;
  const target = `M0 0 L${W} 0 L${W} ${H} Q${W / 2} ${H} 0 ${H} L0 0`;
  path.setAttribute('d', initial);
  Object.assign(pre.querySelector('svg').style, { top: 0, height: H + 300 + 'px' });

  gsap.to('.pre__word', { opacity: 1, duration: 0.6, delay: 0.1 });
  let i = 0;
  const step = () => {
    if (i >= words.length - 1) return;
    i += 1; word.textContent = words[i];
    setTimeout(step, 230);
  };
  setTimeout(step, 800);

  return new Promise((res) => {
    const tl = gsap.timeline({ delay: 2.6 });
    tl.to(path, { attr: { d: target }, duration: 0.7, ease: ioEase, delay: 0.3 }, 0)
      .to(pre, { yPercent: -100, duration: 0.8, ease: ioEase, delay: 0.2 }, 0)
      .add(() => { document.body.classList.remove('is-loading'); res(); }, 0.5)
      .add(() => pre.remove());
  });
}

/* ---------- Magnético ---------- */
if (fine && !reduce) {
  $$('[data-magnetic]').forEach((el) => {
    const k = parseFloat(el.dataset.strength || '0.35');
    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.3)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.3)' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * k);
      yTo((e.clientY - (r.top + r.height / 2)) * k);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- Pílulas com círculo que enche ---------- */
$$('.pill').forEach((btn) => {
  const circle = $('.pill__fill', btn);
  if (!circle || reduce) return;
  const tl = gsap.timeline({ paused: true });
  tl.to(circle, { top: '-25%', width: '150%', duration: 0.4, ease: 'power3.in' }, 'enter')
    .to(circle, { top: '-150%', width: '125%', duration: 0.25 }, 'exit');
  let t;
  btn.addEventListener('mouseenter', () => { clearTimeout(t); tl.tweenFromTo('enter', 'exit'); });
  btn.addEventListener('mouseleave', () => { t = setTimeout(() => tl.play(), 300); });
});

/* ---------- Nav / burger / menu ---------- */
const burger = $('[data-burger]');
const menu = $('[data-menu]');
const menuPath = $('[data-menu-path]');
let menuOpen = false;
function menuCurve(open) {
  const h = innerHeight;
  return open
    ? `M100 0 L100 ${h} Q100 ${h / 2} 100 0`
    : `M100 0 L200 0 L200 ${h} L100 ${h} Q-100 ${h / 2} 100 0`;
}
function openMenu() {
  menuOpen = true;
  burger.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  gsap.to(menu, { x: 0, duration: 0.8, ease: ioEase });
  gsap.fromTo(menuPath, { attr: { d: menuCurve(false) } }, { attr: { d: menuCurve(true) }, duration: 1, ease: ioEase });
  gsap.to('.menu__links a', { x: 0, opacity: 1, duration: 0.8, ease: ioEase, stagger: 0.05, delay: 0.1 });
  lenis?.stop();
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  gsap.to(menu, { x: 'calc(100% + 100px)', duration: 0.8, ease: ioEase });
  gsap.to(menuPath, { attr: { d: menuCurve(false) }, duration: 0.8, ease: ioEase });
  gsap.to('.menu__links a', { x: 80, opacity: 0, duration: 0.5, ease: ioEase });
  lenis?.start();
}
burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom top+=200',
  onEnter: () => burger.classList.add('is-on'),
  onLeaveBack: () => { burger.classList.remove('is-on'); closeMenu(); },
});
if (!isDesktop()) burger.classList.add('is-on');

/* ---------- Hero: carrossel em leque ---------- */
const fan = $('[data-fan]');
const fanCards = $$('.fan__card', fan);
const fanCap = $('[data-fan-cap]');
let fanIndex = 2; // qual foto está no centro
// cinco "assentos": deslocamento horizontal (vw), vertical (%), rotação, escala e camada
const SEATS = [
  { x: -36, y: 24, r: -12, s: 0.92, z: 1 },
  { x: -19, y: 10, r: -6, s: 0.96, z: 2 },
  { x: 0, y: 0, r: -1, s: 1.08, z: 3 },
  { x: 19, y: 8, r: 5, s: 0.96, z: 2 },
  { x: 36, y: 22, r: 11, s: 0.92, z: 1 },
];
const seatOf = (i) => (((i - fanIndex) % fanCards.length) + fanCards.length + 2) % fanCards.length; // 2 = centro
function layoutFan(animate = true) {
  const vw = innerWidth / 100;
  const narrow = innerWidth <= 900;
  fanCards.forEach((card, i) => {
    const seat = SEATS[seatOf(i)];
    const x = (narrow ? seat.x * 0.85 : seat.x) * vw;
    const props = { xPercent: -50, x, yPercent: seat.y, rotate: seat.r, scale: seat.s, zIndex: seat.z, opacity: narrow && seat.z === 1 ? 0 : 1 };
    if (animate && !reduce) gsap.to(card, { ...props, duration: 0.9, ease: 'power3.out' });
    else gsap.set(card, props);
  });
  fanCap.textContent = fanCards[fanIndex].dataset.cap;
}
function fanGo(dir) { fanIndex = (fanIndex + dir + fanCards.length) % fanCards.length; layoutFan(); }
layoutFan(false);
let autoFan = reduce ? null : setInterval(() => fanGo(1), 4500);
const stopAuto = () => { if (autoFan) { clearInterval(autoFan); autoFan = null; } };
$('[data-fan-prev]').addEventListener('click', () => { stopAuto(); fanGo(-1); });
$('[data-fan-next]').addEventListener('click', () => { stopAuto(); fanGo(1); });
fanCards.forEach((c, i) => c.addEventListener('click', () => { stopAuto(); if (i !== fanIndex) { fanIndex = i; layoutFan(); } }));
fan.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { stopAuto(); fanGo(-1); } if (e.key === 'ArrowRight') { stopAuto(); fanGo(1); } });
// roda do mouse na horizontal (trackpad ou shift+roda) gira o leque
let wheelLock = 0;
fan.addEventListener('wheel', (e) => {
  const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
  if (!dx) return;
  e.preventDefault();
  const now = Date.now();
  if (now - wheelLock < 500) return;
  wheelLock = now; stopAuto(); fanGo(dx > 0 ? 1 : -1);
}, { passive: false });
// arrastar
let dragX = null;
fan.addEventListener('pointerdown', (e) => { dragX = e.clientX; fan.setPointerCapture(e.pointerId); });
fan.addEventListener('pointerup', (e) => {
  if (dragX === null) return;
  const d = e.clientX - dragX; dragX = null;
  if (Math.abs(d) > 40) { stopAuto(); fanGo(d < 0 ? 1 : -1); }
});
addEventListener('resize', () => layoutFan(false));

function heroIntro() {
  if (reduce) return;
  gsap.from(fanCards, { y: 200, opacity: 0, duration: 1.2, ease: 'power4.out', stagger: { each: 0.07, from: 'center' }, clearProps: 'opacity' });
  gsap.to('[data-slide]', { y: 0, opacity: 1, duration: 0.6, ease: outEase, stagger: 0.08, delay: 0.2 });
  gsap.to($$('.hero__name .w'), { y: 0, duration: 0.8, ease: outEase, stagger: 0.06 });
}

/* ---------- Reveals ---------- */
splitWords($('.hero__name'), true);
$$('[data-fade]').forEach((el) => {
  if (reduce) return;
  gsap.to(el, { y: 0, opacity: 1, duration: 0.6, ease: outEase, scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('h2[data-words]').forEach((el) => {
  const words = splitWords(el, true);
  if (reduce) return;
  gsap.to(words, { y: 0, duration: 0.7, ease: outEase, stagger: 0.03, scrollTrigger: { trigger: el, start: 'top 85%' } });
});

/* ---------- Vitrine de projetos: seção fixa, scroll troca o projeto ---------- */
(() => {
  const sec = $('[data-show]');
  const titles = $$('h2', $('[data-show-titles]'));
  const texts = $$(':scope > div', $('[data-show-texts]'));
  const stack = $('[data-show-stack]');
  const panels = $$('.panel', stack);
  const dots = $('[data-show-dots]');
  const counter = $('[data-show-i]');
  const n = titles.length;
  let current = -1;
  titles.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Projeto ${i + 1}`);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
  });
  const dotEls = $$('button', dots);
  const setActive = (i) => {
    if (i === current) return;
    current = i;
    titles.forEach((t, k) => t.classList.toggle('is-on', k === i));
    texts.forEach((t, k) => t.classList.toggle('is-on', k === i));
    dotEls.forEach((d, k) => d.classList.toggle('is-on', k === i));
    counter.textContent = String(i + 1).padStart(2, '0');
  };
  const GAP = 26;
  // painel ativo centralizado na coluna: metade de um painel para cima, mais os anteriores
  const offsetFor = (p) => -(panels[0].offsetHeight / 2) - p * (panels[0].offsetHeight + GAP);
  $$('[data-dce]').forEach((a) => { if (DCE_URL) { a.href = DCE_URL; a.target = '_blank'; a.removeAttribute('data-scroll'); } });

  if (!isDesktop() || reduce) {
    // celular: sem fixar; a pilha vira uma faixa horizontal e os textos ficam todos visíveis
    setActive(0);
    sec.classList.add('show--static');
    // intercala título e texto de cada projeto, e some com a pilha única
    const left = $('.show__left', sec);
    titles.forEach((t, i) => { t.classList.add('is-on'); texts[i].classList.add('is-on'); left.appendChild(t); left.appendChild(texts[i]); });
    $('[data-show-titles]').remove(); $('[data-show-texts]').remove();
    return;
  }
  let st;
  function goTo(i) { if (st) scrollTo(st.start + (st.end - st.start) * (i / (n - 1))); }
  st = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: () => '+=' + innerHeight * (n - 1) * 0.9, pin: '.show__pin', scrub: true,
    snap: { snapTo: 1 / (n - 1), duration: 0.5, ease: 'power2.inOut' },
    onUpdate: (s) => {
      const p = s.progress * (n - 1);
      setActive(Math.round(p));
      gsap.set(stack, { y: offsetFor(p), skewY: -7 });
    },
  });
  gsap.set(stack, { y: offsetFor(0), skewY: -7 });
  setActive(0);
})();

/* ---------- Faixa de imagens ---------- */
(() => {
  const sec = $('[data-slides]');
  if (!sec || reduce) return;
  const st = { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true };
  gsap.fromTo('[data-slides-a]', { x: 0 }, { x: 150, ease: 'none', scrollTrigger: st });
  gsap.fromTo('[data-slides-b]', { x: 0 }, { x: -150, ease: 'none', scrollTrigger: st });
  gsap.fromTo('[data-slides-curve]', { height: 50 }, { height: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: '90% top', scrub: true } });
})();

/* ---------- Carreira: seção fixa, scroll corre a linha ---------- */
(() => {
  const sec = $('[data-career]');
  const track = $('[data-career-track]');
  const prog = $('[data-career-progress]');
  const bar = $('[data-career-bar]');
  const counter = $('[data-career-i]');
  const miles = $$('.mile', track);
  const dist = () => Math.max(0, track.scrollWidth - (innerWidth - 2 * track.offsetLeft));
  if (reduce) { sec.querySelector('.career__view').style.overflowX = 'auto'; return; }
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.5), pin: '.career__pin', scrub: 0.4, invalidateOnRefresh: true,
      onUpdate: (st) => {
        const p = st.progress;
        prog.style.width = `${p * 100}%`;
        bar.style.width = `${10 + p * 90}%`;
        counter.textContent = String(Math.min(miles.length, 1 + Math.floor(p * miles.length))).padStart(2, '0');
      },
    },
  });
})();

/* ---------- Sobre: paralaxe da foto ---------- */
(() => {
  const img = $('[data-parallax]');
  if (!img || reduce) return;
  gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
})();

/* ---------- Contato: copiar, relógio, 3D ---------- */
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('E-mail copiado'); }
  catch { location.href = `mailto:${b.dataset.copy}`; }
}));
$$('[data-world]').forEach((a) => a.addEventListener('click', (e) => {
  if (WORLD_URL) { a.href = WORLD_URL; return; }
  e.preventDefault();
  toast('O mundo 3D está em construção');
}));
function tick() {
  const t = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  $$('[data-clock]').forEach((el) => (el.textContent = t));
}
tick(); setInterval(tick, 20000);

/* ---------- Início ---------- */
// a abertura começa assim que o DOM existe, sem esperar imagens
runPreloader().then(heroIntro);
addEventListener('load', () => ScrollTrigger.refresh());
