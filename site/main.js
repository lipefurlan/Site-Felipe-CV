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
// posição contínua: as fotos seguem o dedo/trackpad e depois assentam na mais próxima
const fan = $('[data-fan]');
const fanCards = $$('.fan__card', fan);
const fanCap = $('[data-fan-cap]');
const FN = fanCards.length;
const fanState = { pos: 2 }; // qual foto está no centro (pode ser fracionário durante o movimento)
const wrapOff = (v) => { let o = ((v % FN) + FN) % FN; if (o >= FN / 2) o -= FN; return o; };
// interpola os "assentos" do leque: 0 = centro, 1 = vizinho, 2 = ponta, 2.5 = some
const lerpSeat = (pts, a) => { const i = Math.min(Math.floor(a), pts.length - 2); return pts[i] + (pts[i + 1] - pts[i]) * (a - i); };
const SX = [0, 19, 36, 46], SY = [0, 9, 23, 32], SS = [1.08, 0.96, 0.92, 0.88];
function renderFan() {
  const vw = innerWidth / 100;
  const narrow = innerWidth <= 900;
  fanCards.forEach((card, i) => {
    const off = wrapOff(i - fanState.pos);
    const a = Math.min(Math.abs(off), 3);
    const sgn = Math.sign(off);
    const fadeFrom = narrow ? 1.4 : 2;
    gsap.set(card, {
      xPercent: -50,
      x: sgn * lerpSeat(SX, a) * (narrow ? 0.85 : 1) * vw,
      yPercent: lerpSeat(SY, a),
      rotate: -1 + off * 6,
      scale: lerpSeat(SS, a),
      zIndex: 10 - Math.round(a * 2),
      opacity: gsap.utils.clamp(0, 1, 1 - (a - fadeFrom) / 0.5),
    });
  });
  const idx = ((Math.round(fanState.pos) % FN) + FN) % FN;
  if (fanCap.dataset.i !== String(idx)) { fanCap.dataset.i = idx; fanCap.textContent = fanCards[idx].dataset.cap; }
}
let fanTween = null;
function fanTo(target, duration = 1.1, ease = 'power3.out') {
  fanTween?.kill();
  if (reduce) { fanState.pos = target; renderFan(); return; }
  fanTween = gsap.to(fanState, { pos: target, duration, ease, onUpdate: renderFan });
}
const fanGo = (dir) => fanTo(Math.round(fanState.pos) + dir);
renderFan();
let autoFan = reduce ? null : setInterval(() => fanTo(Math.round(fanState.pos) + 1, 1.4, 'power3.inOut'), 4500);
const stopAuto = () => { if (autoFan) { clearInterval(autoFan); autoFan = null; } };
$('[data-fan-prev]').addEventListener('click', () => { stopAuto(); fanGo(-1); });
$('[data-fan-next]').addEventListener('click', () => { stopAuto(); fanGo(1); });
fan.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { stopAuto(); fanGo(-1); } if (e.key === 'ArrowRight') { stopAuto(); fanGo(1); } });
// trackpad na horizontal (ou shift+roda): as fotos acompanham o gesto e assentam quando ele termina
let wheelIdle = null;
let wheelBase = null;
fan.addEventListener('wheel', (e) => {
  const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
  if (!dx) return;
  e.preventDefault(); stopAuto(); fanTween?.kill();
  if (wheelBase === null) wheelBase = Math.round(fanState.pos);
  const base = wheelBase;
  // no máximo uma foto por gesto, com resistência perto do limite
  fanState.pos = gsap.utils.clamp(base - 0.95, base + 0.95, fanState.pos + dx / 600);
  renderFan();
  clearTimeout(wheelIdle);
  wheelIdle = setTimeout(() => {
    const d = fanState.pos - base;
    wheelBase = null;
    fanTo(Math.abs(d) > 0.18 ? base + Math.sign(d) : base, 0.9);
  }, 120);
}, { passive: false });
// arrastar: segue o ponteiro; ao soltar, a velocidade decide para onde vai
let drag = null;
fan.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  stopAuto(); fanTween?.kill();
  drag = { x: e.clientX, pos: fanState.pos, t: performance.now(), lastX: e.clientX, v: 0, moved: false };
  fan.setPointerCapture(e.pointerId);
  fan.classList.add('is-drag');
});
fan.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const now = performance.now();
  drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.t);
  drag.lastX = e.clientX; drag.t = now;
  if (Math.abs(e.clientX - drag.x) > 6) drag.moved = true;
  fanState.pos = drag.pos - (e.clientX - drag.x) / (innerWidth * 0.19);
  renderFan();
});
const endDrag = (e) => {
  if (!drag) return;
  fan.classList.remove('is-drag');
  if (!drag.moved) {
    // clique simples numa foto lateral traz ela para o centro
    const card = e.target.closest('.fan__card');
    const i = fanCards.indexOf(card);
    if (i >= 0) fanTo(Math.round(fanState.pos) + Math.round(wrapOff(i - fanState.pos)));
  } else {
    fanTo(Math.round(fanState.pos - drag.v * 0.6), 0.9);
  }
  drag = null;
};
fan.addEventListener('pointerup', endDrag);
fan.addEventListener('pointercancel', endDrag);
addEventListener('resize', renderFan);

function heroIntro() {
  if (reduce) return;
  gsap.from(fanCards, { y: 220, duration: 1.3, ease: 'power4.out', stagger: { each: 0.07, from: 'center' } });
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

/* ---------- Vitrine de projetos: seção fixa, um projeto por gesto ---------- */
// A seção prende a página e cada gesto (roda, trackpad, tecla ou swipe) avança só um projeto,
// com uma transição de 1,2 s. Depois do último projeto a página volta a rolar normalmente.
(() => {
  const sec = $('[data-show]');
  const titles = $$('h2', $('[data-show-titles]'));
  const texts = $$(':scope > div', $('[data-show-texts]'));
  const stack = $('[data-show-stack]');
  const panels = $$('.panel', stack);
  const dots = $('[data-show-dots]');
  const counter = $('[data-show-i]');
  const n = titles.length;
  const firstPanel = (i) => panels.findIndex((p) => +p.dataset.p === i);
  let current = -1;
  titles.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Projeto ${i + 1}`);
    b.addEventListener('click', () => show(i));
    dots.appendChild(b);
  });
  const dotEls = $$('button', dots);
  $$('[data-dce]').forEach((a) => { if (DCE_URL) { a.href = DCE_URL; a.target = '_blank'; a.removeAttribute('data-scroll'); } });

  if (!isDesktop() || reduce) {
    // celular: sem fixar; a pilha vira uma faixa horizontal e os textos ficam todos visíveis
    sec.classList.add('show--static');
    const left = $('.show__left', sec);
    titles.forEach((t, i) => { t.classList.add('is-on'); texts[i].classList.add('is-on'); left.appendChild(t); left.appendChild(texts[i]); });
    $('[data-show-titles]').remove(); $('[data-show-texts]').remove();
    counter.textContent = '01';
    return;
  }

  // títulos: cada palavra entra por uma máscara (estilo Robin Noguier)
  const titleWords = titles.map((t) => splitWords(t, true));
  gsap.set(titles, { opacity: 1, y: 0 });
  titleWords.forEach((ws) => gsap.set(ws, { y: 0, yPercent: 140 }));
  gsap.set(texts, { opacity: 0, y: 24 });

  const GAP = 26;
  const panelH = () => panels[0].offsetHeight;
  // os dois painéis do projeto ficam centralizados; os vizinhos aparecem cortados em cima e embaixo
  const offsetFor = (i) => -(2 * panelH() + GAP) / 2 - firstPanel(i) * (panelH() + GAP);
  const imgs = panels.map((p) => $('img', p)).filter(Boolean);
  const DUR = 1.2;

  function show(i, instant = false) {
    i = gsap.utils.clamp(0, n - 1, i);
    if (i === current) return;
    const dir = i > current ? 1 : -1;
    const prev = current;
    current = i;
    dotEls.forEach((d, k) => d.classList.toggle('is-on', k === i));
    titles.forEach((t, k) => t.classList.toggle('is-on', k === i));
    texts.forEach((t, k) => t.classList.toggle('is-on', k === i));
    if (instant || prev < 0) {
      if (prev >= 0) { gsap.set(titleWords[prev], { yPercent: 140 }); gsap.set(texts[prev], { opacity: 0 }); }
      gsap.set(titleWords[i], { yPercent: 0 });
      gsap.set(texts[i], { opacity: 1, y: 0 });
      gsap.set(stack, { y: offsetFor(i), skewY: -7 });
      counter.textContent = String(i + 1).padStart(2, '0');
      return;
    }
    // texto que sai
    gsap.to(titleWords[prev], { yPercent: -140 * dir, duration: 0.5, ease: 'power3.in', stagger: 0.03 * dir, overwrite: true });
    gsap.to(texts[prev], { opacity: 0, y: -20 * dir, duration: 0.35, ease: 'power2.in', overwrite: true });
    // pilha: movimento com peso, inclina um pouco mais no meio do trajeto e as fotos fazem contrapeso
    gsap.to(stack, { y: offsetFor(i), duration: DUR, ease: 'power4.inOut', overwrite: 'auto' });
    gsap.fromTo(stack, { skewY: -7 }, { skewY: -10, duration: DUR / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 });
    gsap.fromTo(imgs, { yPercent: 0 }, { yPercent: 9 * dir, duration: DUR / 2, ease: 'sine.in', yoyo: true, repeat: 1, overwrite: true });
    // texto que entra, depois que a pilha já está chegando
    gsap.fromTo(titleWords[i], { yPercent: 140 * dir }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05 * dir, delay: 0.45, overwrite: true });
    gsap.fromTo(texts[i], { opacity: 0, y: 26 * dir }, { opacity: 1, y: 0, duration: 0.7, ease: outEase, delay: 0.6, overwrite: true });
    gsap.fromTo(counter, { yPercent: 60 * dir, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.5, ease: outEase, delay: 0.45, overwrite: true,
      onStart: () => { counter.textContent = String(i + 1).padStart(2, '0'); },
    });
  }

  // --- controle do scroll enquanto a seção está presa ---
  let active = false;
  let lockUntil = 0;
  const st = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: '+=100%', pin: '.show__pin',
    onToggle: (s) => { if (s.isActive && !active) engage(s.direction > 0 ? 0 : n - 1); },
    onRefresh: () => { if (current >= 0) gsap.set(stack, { y: offsetFor(current) }); },
  });
  const jump = (y) => { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); };
  function engage(i) {
    active = true;
    lenis?.stop();
    jump(st.start + Math.round((st.end - st.start) / 2));
    show(i);
    // a inércia do gesto que trouxe até aqui não pode pular o primeiro projeto
    lockUntil = performance.now() + 700;
  }
  function release(dir) {
    active = false;
    lenis?.start();
    jump(dir > 0 ? st.end + 2 : st.start - 2);
  }
  function step(dir) {
    const now = performance.now();
    if (now < lockUntil) return;
    if ((dir > 0 && current === n - 1) || (dir < 0 && current === 0)) { release(dir); return; }
    show(current + dir);
    lockUntil = now + DUR * 1000 - 150;
  }
  addEventListener('wheel', (e) => {
    if (!active) return;
    e.preventDefault();
    const now = performance.now();
    // um gesto contínuo (inclusive a inércia do trackpad) mantém a trava: só um projeto por gesto
    if (now < lockUntil) { lockUntil = Math.max(lockUntil, now + 160); return; }
    if (Math.abs(e.deltaY) < 4) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false, capture: true });
  addEventListener('keydown', (e) => {
    if (!active) return;
    const down = ['ArrowDown', 'PageDown', ' '].includes(e.key);
    const up = ['ArrowUp', 'PageUp'].includes(e.key);
    if (!down && !up) return;
    e.preventDefault();
    step(down ? 1 : -1);
  });
  let touchY = null;
  addEventListener('touchstart', (e) => { if (active) touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!active || touchY === null) return;
    e.preventDefault();
    const d = touchY - e.touches[0].clientY;
    if (Math.abs(d) > 50) { step(d > 0 ? 1 : -1); touchY = null; }
  }, { passive: false });
  // links do menu/âncoras que pedem para sair da seção
  addEventListener('click', (e) => { if (active && e.target.closest('[data-scroll]')) { active = false; lenis?.start(); } }, true);

  show(0, true);
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
