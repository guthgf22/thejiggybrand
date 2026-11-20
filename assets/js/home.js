import { boot, $, $$, reduced, isTouch, safely } from './core.js';
import { t, money } from './i18n.js';
import { CONFIG } from './config.js';
import { getProduct } from './products.js';

const { gsap, ScrollTrigger, SplitText } = window;

function fillData() {
  $$('[data-price]').forEach((el) => {
    const p = getProduct(el.dataset.price);
    if (p) el.textContent = money(p.price);
  });
  const ship = $('[data-perk="ship"]');
  if (ship) ship.textContent = t('kraft.p1', { amount: money(CONFIG.freeShipping) });
  $('[data-peek-hint]').textContent = t(isTouch ? 'jstring.peek.touch' : 'jstring.peek');
}

/* ------------------------------------------------------------------ hero */

function hero() {
  const el = $('.hero');
  const media = $('.hero__media', el);
  const photo = $('.hero__base img', el);
  const spot = $('.hero__spot', el);
  const lit = $('.hero__lit', spot);
  const state = { x: 0, y: 0 };
  let R = 0;
  let ring = { x: 0, y: 0, w: 0, h: 0 };
  // The lit copy of the photo sits in a round, soft-edged spot that only ever moves by transform: the spot
  // goes where the light is and the photo inside shifts back by the same amount, so both photos stay lined up.
  // (An animated mask repainted the whole full-screen photo every frame — scrolling stuttered and the hero
  // could sit there washed out on some PCs until the repaint caught up.)
  const place = () => {
    spot.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    lit.style.transform = `translate3d(${R - state.x}px, ${R - state.y}px, 0)`;
  };
  // Where the ring lands on screen: data-ring / data-ring-m give its centre and size as fractions of the photo,
  // plus the photo's aspect, mapped through object-fit: cover and the photo's object-position.
  const findRing = () => {
    const [fx, fy, fw, fh, aspect] = media.dataset[matchMedia('(max-width: 860px)').matches ? 'ringM' : 'ring'].split(' ').map(Number);
    const [px, py] = getComputedStyle(photo).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    const h = Math.max(W / aspect, H);
    const w = h * aspect;
    return { x: (W - w) * px + fx * w, y: (H - h) * py + fy * h, w: fw * w, h: fh * h };
  };
  const home = () => ({ x: ring.x, y: ring.y });
  const measure = () => {
    R = spot.offsetWidth / 2;
    ring = findRing();
    el.style.setProperty('--hw', `${el.offsetWidth}px`);
    el.style.setProperty('--hh', `${el.offsetHeight}px`);
    el.style.setProperty('--rx', `${ring.x}px`);
    el.style.setProperty('--ry', `${ring.y}px`);
    el.style.setProperty('--rw', `${ring.w}px`);
    el.style.setProperty('--rh', `${ring.h}px`);
    el.classList.add('has-ring');
  };
  measure();
  Object.assign(state, home());
  place();
  let parked = true; // the light rests at its home spot until the pointer moves over the hero
  window.addEventListener('resize', () => {
    measure();
    if (parked) Object.assign(state, home());
    place();
  });
  if (reduced) return;

  // Ambient motion stops as soon as the hero leaves the screen.
  const ambient = [];
  ScrollTrigger.create({
    trigger: el, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => ambient.forEach((tw) => tw.paused(!self.isActive)),
  });

  if (!isTouch) {
    // Desktop: the light follows the cursor like a lighter, and the flame flickers (opacity only).
    ambient.push(gsap.to(spot, { opacity: 'random(0.8, 1)', duration: 'random(0.08, 0.22)', ease: 'none', repeat: -1, repeatRefresh: true }));
    const qx = gsap.quickTo(state, 'x', { duration: 0.9, ease: 'power3', onUpdate: place });
    const qy = gsap.quickTo(state, 'y', { duration: 0.9, ease: 'power3', onUpdate: place });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      parked = false;
      qx(e.clientX - r.left);
      qy(e.clientY - r.top);
    });
    el.addEventListener('pointerleave', () => { const h = home(); parked = true; qx(h.x); qy(h.y); });
  }
  // Phones: the flame drifts over the ring and flickers by itself — CSS animations (.hero__spot in style.css),
  // so the compositor keeps them going even while the page is busy loading.

  // Scroll-out: content drifts up, image sinks.
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__media', { yPercent: 18, scale: isTouch ? 1 : 1.06, ease: 'none' }, 0)
    .to('.hero__grid', { yPercent: -12, opacity: 0.2, ease: 'none' }, 0);
}

function heroIntro() {
  const items = $$('.hero [data-hero]');
  gsap.set(items, { visibility: 'visible' });
  if (reduced) return;
  const litWord = $('.hero__lit-word');
  // Letters rise out of masks, but "lit." stays out of the split: its glow reaches well past the letters and a
  // mask boxes it in. The split is also never reverted — letters set apart lose their kerning, and snapping
  // back to the joined text made the whole line jump sideways once the intro ended.
  const splits = $$('.hero__line').map((l) => SplitText.create(l, { type: 'chars', mask: 'chars', ignore: litWord }));
  gsap.set(litWord, { opacity: 0 });
  const tl = gsap.timeline({ defaults: { ease: 'jig' } });
  // Fade + zoom instead of animating the photo's CSS filter, which would repaint it every frame.
  tl.fromTo('.hero__media', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)
    .fromTo(['.hero__media img', '.hero__fx'], { scale: 1.25 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
    .from(splits[0].chars, { yPercent: 105, duration: 1.3, stagger: 0.045 }, 0.15)
    .from(splits[1].chars, { yPercent: 105, duration: 1.3, stagger: 0.045 }, 0.3)
    .from('.hero__meta > *', { y: 20, opacity: 0, duration: 1, stagger: 0.1 }, 0.5)
    .from('.hero__foot > *', { y: 30, opacity: 0, duration: 1.1, stagger: 0.12 }, 0.7)
    .from('.hero__scroll', { opacity: 0, duration: 1 }, 1);
  // "lit." catches like a lighter: a few failed sparks, then it holds.
  gsap.timeline({ delay: 0.9 })
    .set(litWord, { opacity: 0.15, textShadow: 'none' })
    .to(litWord, { opacity: 1, duration: 0.05, repeat: 5, yoyo: true, ease: 'steps(1)' })
    .set(litWord, { clearProps: 'textShadow' })
    .to(litWord, { opacity: 1, duration: 0.1 });
}

/* --------------------------------------------------------------- marquee */

function marquee() {
  const track = $('.band__track');
  const item = $('.band__item', track);
  track.appendChild(item.cloneNode(true));
  if (reduced) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
  loop.totalTime(loop.duration() * 200); // room to run backwards
  let dir = 1;
  ScrollTrigger.create({
    trigger: '.band', start: 'top bottom', end: 'bottom top',
    onToggle: (self) => loop.paused(!self.isActive),
    onUpdate(self) {
      dir = self.direction;
      const boost = gsap.utils.clamp(1, 7, 1 + Math.abs(self.getVelocity()) / 350);
      gsap.to(loop, { timeScale: dir * boost, duration: 0.25, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2 }) });
    },
  });
}

/* ---------------------------------------------------------------- lineup */

function cards() {
  $$('.pcard').forEach((card) => {
    const media = $('.pcard__media', card);
    card.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      card.style.setProperty('--cx', `${e.clientX - r.left}px`);
      card.style.setProperty('--cy', `${e.clientY - r.top}px`);
    });
  });
}

/* ------------------------------------------------------------------ bars */

function bars() {
  if (reduced) return;
  $$('.fig svg').forEach((svg) => {
    const shapes = $$('rect:not(.fill-glow), circle, line, path', svg);
    shapes.forEach((s) => {
      const len = s.getTotalLength ? s.getTotalLength() : 400;
      gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.to(shapes, {
      strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.12,
      scrollTrigger: { trigger: svg, start: 'top 88%', toggleActions: 'play none none none' },
    });
    gsap.from($$('.fill-glow', svg), { opacity: 0, duration: 1, delay: 1, scrollTrigger: { trigger: svg, start: 'top 88%', toggleActions: 'play none none none' } });
  });
}

/* ------------------------------------------------------------------ wild */

function wild() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    if (reduced) return;
    const track = $('.wild__track');
    const bar = $('.wild__progress span');
    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        // Horizontal travel runs a bit faster than the wheel so the pin doesn't overstay.
        trigger: '.wild', start: 'top top', end: () => `+=${distance() * 0.7}`,
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
  });
}

/* ----------------------------------------------------------------- kraft */

// The box opens as the section scrolls past (closed, lid up, ring inside). A click or tap on the photo — or a
// swipe on phones — steps through it by hand from then on, round and round.
function kraft() {
  const media = $('.kraft__media');
  const frames = $$('[data-kraft-seq] img');
  const steps = $$('.kraft__steps i');
  let current = 0;
  let manual = false;
  const show = (k) => {
    current = (k + frames.length) % frames.length;
    frames.forEach((f, i) => f.classList.toggle('is-active', i <= current));
    steps.forEach((s, i) => s.classList.toggle('is-on', i === current));
  };
  const take = (k) => { manual = true; show(k); };
  ScrollTrigger.create({
    trigger: media, start: 'top 70%', end: 'bottom 45%',
    onUpdate: (self) => { if (!manual) show(Math.min(frames.length - 1, Math.floor(self.progress * frames.length))); },
    onLeave: () => { if (!manual) show(frames.length - 1); },
    onLeaveBack: () => { if (!manual) show(0); },
  });
  let x0 = null;
  media.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  media.addEventListener('pointercancel', () => { x0 = null; });
  media.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    take(current + (Math.abs(dx) > 40 && dx > 0 ? -1 : 1)); // swipe right goes back; swipe left or a tap goes on
  });
  media.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    take(current + 1);
  });
}

/* ------------------------------------------------------------------ peek */

// "Hover to peek": a lens over the blurred photo shows it sharp. Same trick as the hero light — the lens
// moves by transform and the sharp photo inside shifts back by the same amount, so nothing repaints.
function peek() {
  const box = $('[data-peek]');
  if (!box) return;
  const lens = $('.peek__lens', box);
  const sharp = $('.peek__sharp', box);
  let R = 0;
  const measure = () => {
    R = lens.offsetWidth / 2;
    box.style.setProperty('--pw', `${box.offsetWidth}px`);
    box.style.setProperty('--ph', `${box.offsetHeight}px`);
  };
  const place = (x, y) => {
    lens.style.transform = `translate3d(${x - R}px, ${y - R}px, 0)`;
    sharp.style.transform = `translate3d(${R - x}px, ${R - y}px, 0)`;
  };
  // Until someone moves it, the lens waits over the spot named in data-rest / data-rest-m ("x y aspect": a point
  // of the photo as fractions, and the photo's aspect) — mapped through object-fit: cover onto the section.
  let touched = false;
  const rest = () => {
    if (touched) return;
    const [fx, fy, aspect] = box.dataset[matchMedia('(max-width: 860px)').matches ? 'restM' : 'rest'].split(' ').map(Number);
    const W = box.offsetWidth;
    const H = box.offsetHeight;
    const s = Math.max(W / aspect, H);
    place(fx * aspect * s + (W - aspect * s) / 2, fy * s + (H - s) / 2);
  };
  measure();
  rest();
  window.addEventListener('resize', () => { measure(); rest(); });
  const at = (x, y, lift = 0) => {
    const r = box.getBoundingClientRect();
    place(x - r.left, y - r.top - lift);
  };
  // Mouse: the lens follows the cursor.
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    touched = true;
    at(e.clientX, e.clientY);
    box.classList.add('is-peeking');
  });
  // Touch: nothing sharp until a finger rests on the photo for a beat; then the lens follows it (sitting a little
  // above the fingertip so the finger doesn't cover it, the page holding still) and vanishes when the finger
  // lifts. A quick swipe never turns into a peek — it just scrolls the page.
  if (isTouch) box.classList.add('is-touch');
  let hold = 0;
  let holding = false;
  let start = null;
  const stop = () => {
    clearTimeout(hold);
    holding = false;
    box.classList.remove('is-holding', 'is-peeking');
  };
  box.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY };
    clearTimeout(hold);
    hold = setTimeout(() => {
      holding = true;
      at(start.x, start.y, R * 0.6);
      box.classList.add('is-holding', 'is-peeking');
    }, 120);
  }, { passive: true });
  box.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (holding) {
      e.preventDefault();
      at(t.clientX, t.clientY, R * 0.6);
    } else if (start && Math.hypot(t.clientX - start.x, t.clientY - start.y) > 8) {
      clearTimeout(hold);
    }
  }, { passive: false });
  box.addEventListener('touchend', stop);
  box.addEventListener('touchcancel', stop);
}

/* ----------------------------------------------------------------- neon */

function neon() {
  const el = $('.neon');
  if (reduced) { el.classList.add('is-on'); return; }
  let lit = false;
  ScrollTrigger.create({
    trigger: el, start: 'top 65%',
    onEnter: () => {
      if (lit) return;
      lit = true;
      const tl = gsap.timeline();
      [0.1, 0.07, 0.16, 0.05, 0.1, 0.32].forEach((d) => tl.call(() => el.classList.toggle('is-on'), null, `+=${d}`));
      tl.call(() => el.classList.add('is-on'), null, '+=0.2');
    },
  });
}

/* ------------------------------------------------------------------ init */

fillData();
await boot({ loader: true });
safely(hero, heroIntro, marquee, cards, bars, wild, peek, neon, kraft);
ScrollTrigger.refresh();
