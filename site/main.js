/* Felipe Furlan · landing page
   Vanilla JS + GSAP/ScrollTrigger + Lenis (vendored, sem build).
   Timings e curvas vêm das referências estudadas:
   - entrada de texto: y 40→0 em 0.6s, ease [0.33,1,0.68,1] (Dennis Snellenberg)
   - preloader: cortina sobe em 0.8s, ease [0.76,0,0.24,1] (Olivier Larose)
   - magnético: 35% do deslocamento do mouse, elastic.out(1, 0.3)
   - janela da lista: quickTo 0.8s power3, pilha sobe em 0.5s [0.76,0,0.24,1]
*/

const WORLD_URL = null; // endereço do mundo 3D, quando estiver no ar
const DCE_URL = null;   // endereço do site do DCE

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => matchMedia('(min-width: 901px)').matches;
const EASE_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)';
const EASE_IO = 'cubic-bezier(0.76, 0, 0.24, 1)';

gsap.registerPlugin(ScrollTrigger);
if (window.CustomEase) {
  CustomEase.create('out', '0.33,1,0.68,1');
  CustomEase.create('io', '0.76,0,0.24,1');
}
// Sem o plugin CustomEase: aproximações nativas do GSAP
const outEase = window.CustomEase ? 'out' : 'power3.out';
const ioEase = window.CustomEase ? 'io' : 'power4.inOut';

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

/* ---------- Preloader ---------- */
function runPreloader() {
  const pre = $('[data-pre]');
  if (reduce) { pre.remove(); document.body.classList.remove('is-loading'); return Promise.resolve(); }
  const word = $('[data-pre-word]');
  const path = $('[data-pre-path]');
  const words = ['Olá', 'Hello', 'Hola', 'Ciao', 'Bonjour', 'こんにちは', 'Hallo', 'Olá'];
  const W = innerWidth, H = innerHeight;
  const initial = `M0 0 L${W} 0 L${W} ${H} Q${W / 2} ${H + 300} 0 ${H} L0 0`;
  const target = `M0 0 L${W} 0 L${W} ${H} Q${W / 2} ${H} 0 ${H} L0 0`;
  path.setAttribute('d', initial);
  Object.assign(pre.querySelector('svg').style, { top: 0, height: H + 300 + 'px' });

  gsap.to('.pre__word', { opacity: 0.75, duration: 1, delay: 0.2 });
  let i = 0;
  const step = () => {
    if (i >= words.length - 1) return;
    i += 1; word.textContent = words[i];
    setTimeout(step, 150);
  };
  setTimeout(step, 1000);

  return new Promise((res) => {
    const tl = gsap.timeline({ delay: 2.2 });
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

/* ---------- Botões com círculo que enche ---------- */
$$('.round, .pill').forEach((btn) => {
  const circle = $('.round__fill', btn);
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
// No celular, o botão fica sempre disponível
if (!isDesktop()) burger.classList.add('is-on');

/* ---------- Hero ---------- */
const marqueeTrack = $('[data-marquee]');
const marqueeP = $$('p', marqueeTrack);
let xPercent = 0;
let direction = -1;
function marqueeLoop() {
  if (xPercent < -100) xPercent = 0;
  else if (xPercent > 0) xPercent = -100;
  gsap.set(marqueeP, { xPercent });
  xPercent += 0.08 * direction;
  requestAnimationFrame(marqueeLoop);
}
if (!reduce) {
  gsap.to(marqueeTrack, {
    x: '-500px',
    scrollTrigger: { trigger: document.documentElement, scrub: 0.25, start: 0, end: innerHeight, onUpdate: (e) => (direction = e.direction * -1) },
  });
  requestAnimationFrame(marqueeLoop);
}

function heroIntro() {
  if (reduce) return;
  gsap.from('.fan__card', {
    y: 160, opacity: 0, rotate: 0, duration: 1.2, ease: 'power4.out', stagger: { each: 0.07, from: 'center' },
    clearProps: 'opacity',
  });
  gsap.to('[data-slide]', { y: 0, opacity: 1, duration: 0.6, ease: outEase, stagger: 0.08, delay: 0.2 });
  gsap.from('.marquee__track p', { yPercent: 100, duration: 0.9, ease: outEase, delay: 0.25 });
}

// paralaxe suave das fotos do hero ao rolar
if (!reduce) {
  $$('.fan__card').forEach((c, i) => {
    gsap.to(c, { y: (i % 2 ? -60 : -120) + 'px', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });
}

/* ---------- Reveals ---------- */
$$('[data-fade]').forEach((el) => {
  if (reduce) return;
  gsap.to(el, { y: 0, opacity: 1, duration: 0.6, ease: outEase, scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('h2[data-words]').forEach((el) => {
  const words = splitWords(el, true);
  if (reduce) return;
  gsap.to(words, { y: 0, duration: 0.7, ease: outEase, stagger: 0.03, scrollTrigger: { trigger: el, start: 'top 85%' } });
});
// Statement: cada palavra acende conforme o scroll avança
(() => {
  const el = $('.statement__text');
  if (!el) return;
  const words = splitWords(el, false);
  if (reduce) { words.forEach((w) => w.classList.add('is-on')); return; }
  ScrollTrigger.create({
    trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true,
    onUpdate: (st) => {
      const n = Math.round(st.progress * words.length);
      words.forEach((w, i) => w.classList.toggle('is-on', i < n));
    },
  });
})();

/* ---------- Projetos: janela + cursor que seguem o mouse ---------- */
(() => {
  const wrap = $('[data-projects]');
  const list = $('.projects__list', wrap);
  const modal = $('[data-modal]');
  const stack = $('[data-modal-stack]');
  const cur = $('[data-pcur]');
  const lab = $('[data-pcur-label]');
  if (!fine || reduce) return;

  const mx = gsap.quickTo(modal, 'left', { duration: 0.8, ease: 'power3' });
  const my = gsap.quickTo(modal, 'top', { duration: 0.8, ease: 'power3' });
  const cx = gsap.quickTo(cur, 'left', { duration: 0.5, ease: 'power3' });
  const cy = gsap.quickTo(cur, 'top', { duration: 0.5, ease: 'power3' });
  const lx = gsap.quickTo(lab, 'left', { duration: 0.45, ease: 'power3' });
  const ly = gsap.quickTo(lab, 'top', { duration: 0.45, ease: 'power3' });
  const move = (x, y) => { mx(x); my(y); cx(x); cy(y); lx(x); ly(y); };
  const show = (on) => gsap.to([modal, cur, lab], {
    scale: on ? 1 : 0, duration: 0.4, ease: on ? ioEase : 'power2.in',
  });

  wrap.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
  $$('.row', list).forEach((row) => {
    row.addEventListener('mouseenter', (e) => {
      move(e.clientX, e.clientY);
      stack.style.top = `${row.dataset.row * -100}%`;
      list.classList.add('is-hover');
      show(true);
    });
    row.addEventListener('mouseleave', () => { list.classList.remove('is-hover'); show(false); });
  });
  $$('.row[data-dce]').forEach((a) => { if (DCE_URL) { a.href = DCE_URL; a.target = '_blank'; a.removeAttribute('data-scroll'); } });
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
addEventListener('load', () => {
  runPreloader().then(heroIntro);
  ScrollTrigger.refresh();
});
