import { CONFIG } from './config.js';
import { t, L, lang, savedLang, setLang, applyI18n, money, amountOf } from './i18n.js';
import { cart, MAX_QTY } from './cart.js';
import { getProduct, getVariant, getPart, shotsFor } from './products.js';
import { src } from './images.js';

const { gsap, ScrollTrigger, SplitText, CustomEase, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('jig', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('jigInOut', 'M0,0 C0.76,0 0.24,1 1,1');
// Phones resize the viewport whenever the address bar slides; re-measuring every trigger then stutters the scroll.
ScrollTrigger.config({ ignoreMobileResize: true });

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
export let lenis = null;

export const SMILE = `<svg class="smile" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 18l10 10M26 18L16 28M38 18l10 10M48 18L38 28"/><path d="M12 38c6 12 34 12 40 0"/><path d="M9.5 40.5l5-5M49.5 35.5l5 5"/></svg>`;
const ARROW = `<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
export { ARROW };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export { $, $$ };

/* ------------------------------------------------------------------ shell */

function shellHTML() {
  const other = lang === 'tr' ? 'en' : 'tr';
  return `
  <a class="skip" href="#main">${t('nav.skip')}</a>
  <header class="hdr" data-hdr>
    <a class="hdr__logo" href="index.html" aria-label="JIGGY — ${t('nav.home')}">${SMILE}<span class="badge">JIGGY</span></a>
    <nav class="hdr__nav" aria-label="Primary">
      <a href="shop.html" data-roll>${t('nav.shop')}</a>
      <a href="shop.html?c=rings" data-roll>${t('nav.rings')}</a>
      <a href="shop.html?c=earrings" data-roll>${t('nav.earrings')}</a>
      <a href="product.html?id=j-string" lang="en" data-roll>${t('nav.jstring')}</a>
      <a href="index.html#wild" data-roll>${t('nav.lookbook')}</a>
    </nav>
    <div class="hdr__right">
      <button class="hdr__lang" type="button" data-switch-lang="${other}" aria-label="${t('nav.lang')}">
        <span class="${lang === 'en' ? 'is-on' : ''}">EN</span><i>/</i><span class="${lang === 'tr' ? 'is-on' : ''}">TR</span>
      </button>
      <button class="hdr__bag" type="button" data-cart-open aria-label="${t('nav.bag')}">
        <span>${t('nav.bag')}</span><span class="hdr__count" data-cart-count>0</span>
      </button>
      <button class="hdr__burger" type="button" data-menu aria-expanded="false" aria-controls="menu">
        <span class="hdr__burger-label">${t('nav.menu')}</span><span class="hdr__burger-lines"><i></i><i></i></span>
      </button>
    </div>
  </header>

  <div class="menu" id="menu" aria-hidden="true" data-lenis-prevent>
    <nav class="menu__links">
      <a href="shop.html"><span>${t('nav.shop')}</span></a>
      <a href="shop.html?c=rings"><span>${t('nav.rings')}</span></a>
      <a href="shop.html?c=earrings"><span>${t('nav.earrings')}</span></a>
      <a href="product.html?id=j-string" lang="en"><span>${t('nav.jstring')}</span></a>
      <a href="index.html#wild"><span>${t('nav.lookbook')}</span></a>
    </nav>
    <div class="menu__foot">
      <div class="menu__lang" role="group" aria-label="${t('nav.lang')}">
        <button type="button" data-switch-lang="tr" aria-pressed="${lang === 'tr'}">Türkçe · ₺</button>
        <button type="button" data-switch-lang="en" aria-pressed="${lang === 'en'}" lang="en">English · $</button>
      </div>
      ${CONFIG.instagram.map((i) => `<a href="${i.url}" target="_blank" rel="noopener" lang="en">${i.handle}</a>`).join('')}
      <span>${t('footer.legal')}</span>
    </div>
  </div>

  <div class="drawer" data-drawer aria-hidden="true">
    <div class="drawer__scrim" data-cart-close></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1" data-lenis-prevent>
      <header class="drawer__head">
        <h2 id="cart-title">${t('cart.title')} <sup data-cart-count>0</sup></h2>
        <button type="button" class="drawer__close" data-cart-close>${t('nav.close')}</button>
      </header>
      <div class="drawer__ship" data-ship>
        <p data-ship-text></p>
        <div class="drawer__bar"><span data-ship-bar></span></div>
      </div>
      <ul class="drawer__lines" data-lines></ul>
      <div class="drawer__empty" data-empty>
        ${SMILE}
        <h3>${t('cart.empty.title')}</h3>
        <p>${t('cart.empty.text')}</p>
        <a class="btn" href="shop.html"><span class="btn__roll" data-text="${t('cart.empty.cta')}">${t('cart.empty.cta')}</span></a>
      </div>
      <footer class="drawer__foot" data-foot>
        <div class="drawer__set" data-set-row hidden><span>${t('cart.set')}</span><span data-set-off></span></div>
        <div class="drawer__total"><span>${t('cart.subtotal')}</span><strong data-subtotal></strong></div>
        <p class="drawer__note">${t('cart.note')}</p>
        <div class="drawer__age">
          <p>${t('cart.age.policy')}</p>
          <label class="check" data-age><input type="checkbox" id="cart-age" data-age-check><span>${t('cart.age.label')}</span></label>
          <p class="drawer__age-error" data-age-error hidden>${t('cart.age.error')}</p>
        </div>
        <a class="btn btn--wide" href="checkout.html" data-checkout><span class="btn__roll" data-text="${t('cart.checkout')}">${t('cart.checkout')}</span>${ARROW}</a>
      </footer>
    </aside>
  </div>

  <div class="curtain" aria-hidden="true"><div class="curtain__mark">${SMILE}</div></div>
  <div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>
  <div class="grain" aria-hidden="true"></div>`;
}

function footerHTML() {
  const year = new Date().getFullYear();
  const ig = CONFIG.instagram.map((i) => `<a href="${i.url}" target="_blank" rel="noopener" data-roll>${i.handle}</a>`).join('');
  const email = CONFIG.email ? `<a href="mailto:${CONFIG.email}" data-roll>${CONFIG.email}</a>` : '';
  const phone = CONFIG.phone ? `<a href="tel:${CONFIG.phone.tel}" data-roll>${CONFIG.phone.label}</a>` : '';
  return `
  <footer class="ftr">
    <div class="ftr__top">
      <nav class="ftr__col" aria-label="${t('footer.shop')}">
        <p class="eyebrow">${t('footer.shop')}</p>
        <a href="product.html?id=the-j" data-roll lang="en">The Jiggy</a>
        <a href="product.html?id=sniffy" data-roll lang="en">The Sniffy</a>
        <a href="product.html?id=j-string" data-roll>J-String</a>
        <a href="shop.html" data-roll>${t('shop.filter.all')}</a>
      </nav>
      <nav class="ftr__col" aria-label="${t('footer.help')}">
        <p class="eyebrow">${t('footer.help')}</p>
        <a href="info.html#shipping" data-roll>${t('footer.shipping')}</a>
        <a href="info.html#returns" data-roll>${t('footer.returns')}</a>
        <a href="info.html#care" data-roll>${t('footer.care')}</a>
        <a href="info.html#contact" data-roll>${t('footer.contact')}</a>
      </nav>
      <nav class="ftr__col ftr__col--corp" aria-label="${t('footer.corp')}">
        <p class="eyebrow">${t('footer.corp')}</p>
        <a href="hakkimizda.html" data-roll>${t('footer.about')}</a>
        <a href="teslimat-ve-iade.html" data-roll>${t('footer.delivery')}</a>
        <a href="gizlilik.html" data-roll>${t('footer.privacy')}</a>
        <a href="mesafeli-satis-sozlesmesi.html" data-roll>${t('footer.mss')}</a>
        <a href="on-bilgilendirme.html" data-roll>${t('footer.preinfo')}</a>
        <a href="yas-politikasi.html" data-roll>${t('footer.age')}</a>
      </nav>
      <nav class="ftr__col" aria-label="${t('footer.follow')}">
        <p class="eyebrow">${t('footer.follow')}</p>
        ${ig}${email}${phone}
      </nav>
    </div>
    <div class="ftr__word" aria-hidden="true"><span>J</span><span>I</span><span>G</span><span>G</span><span>Y</span><span class="ftr__smile">${SMILE}</span></div>
    <div class="ftr__pay"><img src="assets/img/pay/iyzico-band-white.svg" width="456" height="32" alt="${t('footer.pay')}" loading="lazy" decoding="async"></div>
    <div class="ftr__bottom">
      <span>© ${year} JIGGY — ${t('footer.made')}</span>
      <span>${t('footer.legal')}</span>
      <button type="button" data-top data-roll>${t('footer.top')} ↑</button>
    </div>
  </footer>`;
}

function renderShell() {
  document.body.insertAdjacentHTML('afterbegin', shellHTML());
  const slot = $('[data-footer]');
  if (slot) slot.outerHTML = footerHTML();
  // Split link labels for the hover roll effect.
  $$('[data-roll]').forEach((el) => {
    if (el.querySelector('.roll')) return;
    const text = el.textContent.trim();
    el.innerHTML = `<span class="roll" data-text="${text}">${text}</span>`;
  });
}

/* ------------------------------------------------------------- smooth scroll */

// Smooth wheel scrolling is a desktop nicety; phones keep their native (faster) touch scroll. While Lenis is
// stopped (menu, bag or age gate open) it swallows every wheel turn, so those carry data-lenis-prevent: the
// wheel then scrolls them natively, and the page under them stays put (html.is-locked).
function initLenis() {
  if (reduced || isTouch) return;
  lenis = new Lenis({ duration: 1.15, easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Photos stay on the page: no right-click / long-press menu on them and no dragging them out (style.css turns off
// selection and the iOS save sheet). Screenshots can't be stopped, but saving a file is no longer one click away.
function guardMedia() {
  const onMedia = (e) => e.target instanceof Element && e.target.closest('img, picture, video, svg, canvas');
  document.addEventListener('contextmenu', (e) => { if (onMedia(e)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (onMedia(e)) e.preventDefault(); });
}

// Decorative loops (spinning stamp, neon flicker…) only run while their section is on screen.
function initLiveSections() {
  const els = $$('[data-live]');
  if (!els.length || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-live')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('is-live', en.isIntersecting));
  }, { rootMargin: '80px 0px' });
  els.forEach((el) => io.observe(el));
}

// The page holds still under the menu, the bag and the age gate. Unlocking waits until none of them is open:
// a bag opened while the curtain was still lifting stayed open after the page had unlocked itself.
export function lockScroll(on) {
  if (!on && (document.documentElement.classList.contains('menu-open') || $('[data-drawer]')?.classList.contains('is-open') || $('.gate'))) return;
  document.documentElement.classList.toggle('is-locked', on);
  if (!lenis) return;
  on ? lenis.stop() : lenis.start();
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4, ...opts });
  else {
    const el = typeof target === 'string' ? $(target) : target;
    if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
    else if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
}

/* ------------------------------------------------------------------ cursor */

function initCursor() {
  if (isTouch) return;
  const el = $('.cursor');
  const label = $('.cursor__label', el);
  document.documentElement.classList.add('has-cursor');
  const xTo = gsap.quickTo(el, 'x', { duration: 0.16, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.16, ease: 'power3' });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { gsap.set(el, { x: e.clientX, y: e.clientY }); el.classList.add('is-visible'); shown = true; }
    xTo(e.clientX);
    yTo(e.clientY);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { el.classList.remove('is-visible'); shown = false; });
  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest('[data-cursor], a, button, input, textarea, select, label, summary, [role="radio"]');
    el.classList.remove('is-label', 'is-link', 'is-text');
    if (!target) return;
    if (target.dataset.cursor === 'hide') {
      el.classList.add('is-text');
    } else if (target.dataset.cursor) {
      label.textContent = t(`cursor.${target.dataset.cursor}`);
      el.classList.add('is-label');
    } else if (target.matches('input, textarea, select')) {
      el.classList.add('is-text');
    } else {
      el.classList.add('is-link');
    }
  });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
}

/* ---------------------------------------------------------------- magnetic */

export function initMagnetic(root = document) {
  if (isTouch || reduced) return;
  $$('[data-magnetic]', root).forEach((el) => {
    if (el.dataset.magneticReady) return;
    el.dataset.magneticReady = '1';
    const strength = parseFloat(el.dataset.magnetic) || 0.28;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ------------------------------------------------------------ transitions */

const CURTAIN_KEY = 'jiggy.curtain';
const SCALE_KEY = 'jiggy.scale'; // set when the logo is tapped on another page: the home page opens with the scale

// /shop and /shop.html are one page (Netlify serves both), and so are / and /index.html.
const pagePath = (path) => path.replace(/(index)?(\.html)?$/, '');

// The element a #hash names, or null. Looked up by id rather than as a selector: hashes like Facebook's #_=_ or
// #123 aren't valid selectors, and querySelector threw on them.
function hashTarget(hash) {
  if (!hash || hash.length < 2) return null;
  try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
}

function initTransitions() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    const samePage = pagePath(url.pathname) === pagePath(location.pathname) && url.search === location.search;
    // A link to the page we're on (the empty bag's "shop the drop" on the shop page) has nothing to load:
    // it just has to get the menu and the bag out of the way.
    if (samePage && url.hash) {
      const target = hashTarget(url.hash);
      if (target) {
        e.preventDefault();
        closeMenu();
        closeCart();
        scrollToTarget(target);
        replaceUrl(url.hash);
        // The skip link is for the keyboard: focus has to move past the header, not only the view.
        if (a.classList.contains('skip')) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
      return;
    }
    // The header logo replays the weighing scale (people love it): on the spot on the home page, on arrival from elsewhere.
    const scale = a.matches('.hdr__logo') && !reduced;
    if (samePage) {
      e.preventDefault();
      closeMenu();
      closeCart();
      if (scale) replayScale();
      return;
    }
    e.preventDefault();
    if (scale) { try { sessionStorage.setItem(SCALE_KEY, '1'); } catch (err) { /* ignore */ } }
    leaveTo(url.href);
  });
  // Back (or forward) to a page the browser kept as it was: the language may have been switched on the page after
  // it, and the menu that led away would still be open over it. (cart.js reloads the bag itself.)
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    if (savedLang() !== lang) { location.reload(); return; }
    gsap.set('.curtain', { clipPath: 'inset(100% 0 0 0)' });
    closeMenu(true);
  });
}

// Sandboxed frames (e.g. previews) may refuse URL rewrites; the page works without them.
export function replaceUrl(url) {
  try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
}

export function leaveTo(href, { reload = false } = {}) {
  try { sessionStorage.setItem(CURTAIN_KEY, '1'); } catch (e) { /* ignore */ }
  const go = () => (reload ? location.reload() : location.assign(href));
  if (reduced) { go(); return; }
  const curtain = $('.curtain');
  gsap.timeline({ onComplete: go })
    .set(curtain, { clipPath: 'inset(100% 0 0 0)', visibility: 'visible' })
    .to(curtain, { clipPath: 'inset(0% 0 0 0)', duration: 0.7, ease: 'jigInOut' })
    .fromTo('.curtain__mark', { scale: 0.6, rotate: -20, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.3');
}

function revealCurtain() {
  const curtain = $('.curtain');
  let came = false;
  try { came = sessionStorage.getItem(CURTAIN_KEY) === '1'; sessionStorage.removeItem(CURTAIN_KEY); } catch (e) { /* ignore */ }
  if (!came || reduced) {
    gsap.set(curtain, { clipPath: 'inset(100% 0 0 0)' });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .set(curtain, { clipPath: 'inset(0% 0 0 0)', visibility: 'visible' })
      .set('.curtain__mark', { opacity: 1, scale: 1 })
      .to('.curtain__mark', { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1)
      .to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'jigInOut' }, 0.2)
      .set(curtain, { clipPath: 'inset(100% 0 0 0)' });
  });
}

/* ------------------------------------------------------------------ header */

function initHeader() {
  const hdr = $('[data-hdr]');
  let last = 0;
  const onScroll = (y) => {
    const down = y > last;
    hdr.classList.toggle('is-hidden', down && y > 240 && !document.documentElement.classList.contains('menu-open'));
    hdr.classList.toggle('is-scrolled', y > 40);
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  $$('[data-switch-lang]').forEach((btn) => btn.addEventListener('click', () => {
    if (btn.dataset.switchLang === lang) { closeMenu(); return; }
    setLang(btn.dataset.switchLang);
    // With a #hash in the address, assigning the same URL is only an in-page jump: the curtain would
    // close and nothing would load. Drop the hash and reload for real.
    replaceUrl(location.pathname + location.search);
    leaveTo(location.href, { reload: true });
  }));
  $('[data-menu]').addEventListener('click', () => (document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu()));
}

let menuTl;
function openMenu() {
  const menu = $('#menu');
  document.documentElement.classList.add('menu-open');
  $('[data-menu]').setAttribute('aria-expanded', 'true');
  $('.hdr__burger-label').textContent = t('nav.close');
  menu.setAttribute('aria-hidden', 'false');
  lockScroll(true);
  menuTl?.kill();
  menuTl = gsap.timeline()
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'jigInOut' })
    .fromTo('.menu__links span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'jig', stagger: 0.06 }, '-=0.35')
    .fromTo('.menu__foot > *', { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05 }, '-=0.5');
}

function closeMenu(instant = false) {
  if (!document.documentElement.classList.contains('menu-open')) return;
  const menu = $('#menu');
  document.documentElement.classList.remove('menu-open');
  $('[data-menu]').setAttribute('aria-expanded', 'false');
  $('.hdr__burger-label').textContent = t('nav.menu');
  menu.setAttribute('aria-hidden', 'true');
  lockScroll(false);
  menuTl?.kill();
  if (instant) { gsap.set(menu, { clipPath: 'inset(0 0 100% 0)', visibility: 'hidden' }); return; }
  menuTl = gsap.timeline()
    .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'jigInOut' })
    .set(menu, { visibility: 'hidden' });
}

/* -------------------------------------------------------------------- cart */

export function variantLabel(product, line) {
  const parts = [];
  if (line.variant) parts.push(L(getVariant(product, line.variant).label));
  if (line.part) parts.push(L(getPart(product, line.part).label));
  if (line.size) parts.push(line.size);
  return parts.join(' · ');
}

// The bag line's photo: the piece's own, or its photo of the part picked when there is one.
export function lineImage(product, line) {
  return shotsFor(product, getVariant(product, line.variant), line.part)[0];
}

// A bag line is named after the piece itself (Moon Jiggy), falling back to the product line.
export function lineName(product, line) {
  return getVariant(product, line.variant).name || L(product.name);
}

function lineHTML(line) {
  const p = getProduct(line.id);
  const key = cart.keyOf(line);
  const href = `product.html?id=${p.id}${line.variant ? `&v=${line.variant}` : ''}${line.part ? `&p=${line.part}` : ''}`;
  return `
  <li class="line" data-key="${key}">
    <a class="line__img" href="${href}"><img src="${src(lineImage(p, line), true)}" alt="" width="88" height="110" loading="lazy"></a>
    <div class="line__info">
      <a class="line__name" href="${href}" lang="en">${lineName(p, line)}</a>
      <span class="line__meta">${variantLabel(p, line)}</span>
      <div class="qty" role="group" aria-label="${t('pdp.qty')}">
        <button type="button" data-step="-1" aria-label="${t('cart.qty.less')}">−</button>
        <span aria-live="polite">${line.qty}</span>
        <button type="button" data-step="1" aria-label="${t('cart.qty.more')}"${line.qty >= MAX_QTY ? ' disabled' : ''}>+</button>
      </div>
    </div>
    <div class="line__end">
      <span class="line__price">${money(cart.unit(line) * line.qty)}</span>
      <button type="button" class="line__rm" data-remove>${t('cart.remove')}</button>
    </div>
  </li>`;
}

export function shippingProgress(subtotal) {
  const goal = amountOf(CONFIG.freeShipping);
  return { goal, left: Math.max(goal - subtotal, 0), pct: Math.min(subtotal / goal, 1) };
}

function renderCart() {
  const drawer = $('[data-drawer]');
  const count = cart.count();
  $$('[data-cart-count]').forEach((el) => { el.textContent = count; });
  $('.hdr__bag').classList.toggle('has-items', count > 0);
  const empty = cart.lines.length === 0;
  drawer.classList.toggle('is-empty', empty);
  $('[data-lines]', drawer).innerHTML = cart.lines.map(lineHTML).join('');
  const off = cart.discount();
  $('[data-set-row]', drawer).hidden = off === 0;
  $('[data-set-off]', drawer).textContent = `−${money(off)}`;
  const sub = cart.total();
  $('[data-subtotal]', drawer).textContent = money(sub);
  const ship = shippingProgress(sub);
  $('[data-ship-text]', drawer).textContent = ship.left > 0 ? t('cart.ship.away', { amount: money(ship.left) }) : t('cart.ship.done');
  $('[data-ship-bar]', drawer).style.transform = `scaleX(${ship.pct})`;
}

let lastFocus = null;
export function openCart() {
  const drawer = $('[data-drawer]');
  if (drawer.classList.contains('is-open')) return;
  lastFocus = document.activeElement;
  closeMenu();
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  lockScroll(true);
  setTimeout(() => $('.drawer__panel').focus(), 50);
  if (!reduced) {
    gsap.fromTo($$('.line', drawer), { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'jig', stagger: 0.06, delay: 0.2 });
  }
}

export function closeCart() {
  const drawer = $('[data-drawer]');
  if (!drawer.classList.contains('is-open')) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  lockScroll(false);
  lastFocus?.focus?.();
}

function initCart() {
  const drawer = $('[data-drawer]');
  renderCart();
  cart.subscribe(renderCart);
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); }
    if (e.target.closest('[data-cart-close]')) closeCart();
  });
  // 21+ check before checkout: the box must be ticked, and the answer is remembered for this visit.
  const age = $('[data-age-check]', drawer);
  const ageWrap = $('[data-age]', drawer);
  const ageError = $('[data-age-error]', drawer);
  try { age.checked = sessionStorage.getItem('jiggy.age.cart') === '1'; } catch (err) { /* ignore */ }
  age.addEventListener('change', () => {
    ageWrap.classList.toggle('is-error', false);
    ageError.hidden = true;
    try { sessionStorage.setItem('jiggy.age.cart', age.checked ? '1' : '0'); } catch (err) { /* ignore */ }
  });
  $('[data-checkout]', drawer).addEventListener('click', (e) => {
    if (age.checked) return;
    e.preventDefault();
    ageWrap.classList.add('is-error');
    ageError.hidden = false;
    age.focus();
  });
  drawer.addEventListener('click', (e) => {
    const li = e.target.closest('.line');
    if (!li) return;
    const key = li.dataset.key;
    const line = cart.lines.find((l) => cart.keyOf(l) === key);
    if (!line) return;
    const step = e.target.closest('[data-step]');
    if (step) cart.setQty(key, line.qty + Number(step.dataset.step));
    if (e.target.closest('[data-remove]')) {
      gsap.to(li, { x: 60, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => cart.remove(key) });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeMenu(); }
    if (e.key === 'Tab' && drawer.classList.contains('is-open')) trapFocus(e, $('.drawer__panel'));
  });
}

function trapFocus(e, container) {
  const items = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const lastEl = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
  else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
}

// Adds to cart with a little bump on the bag counter, then opens the drawer.
export function addToCart(item, { open = true } = {}) {
  cart.add(item);
  const badge = $('.hdr__count');
  if (!reduced) gsap.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
  if (open) setTimeout(openCart, 220);
}

/* ------------------------------------------------------------------ footer */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// E-mail sign-ups post to CONFIG.forms.endpoint (a Formspree-style URL). Until one is set,
// the form is swapped for an Instagram link so nobody is told they're "on the list" when they aren't.
export function bindInlineForm(form, okKey, badKey) {
  const msg = form.nextElementSibling;
  const endpoint = CONFIG.forms?.endpoint;
  if (!endpoint) {
    const ig = CONFIG.instagram[0];
    form.outerHTML = `<a class="inline-cta" href="${ig.url}" target="_blank" rel="noopener"><span>${t('form.ig')}</span><b lang="en">${ig.handle}</b>${ARROW}</a>`;
    if (msg?.classList.contains('inline-form__msg')) msg.remove();
    return;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    if (!EMAIL_RE.test(input.value.trim())) {
      msg.textContent = t(badKey);
      form.classList.add('is-error');
      input.focus();
      return;
    }
    form.classList.remove('is-error');
    button.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: input.value.trim(), source: form.dataset.source || 'footer', lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.classList.add('is-done');
      msg.textContent = t(okKey);
      input.value = '';
    } catch (err) {
      msg.textContent = t('form.error');
    } finally {
      button.disabled = false;
    }
  });
}

function initFooter() {
  $('[data-top]')?.addEventListener('click', () => scrollToTarget(0));
}

function animateFooter() {
  const word = $('.ftr__word');
  if (!word || reduced) return;
  gsap.from($$('.ftr__word > span', word), {
    yPercent: 100, duration: 1.2, ease: 'jig', stagger: 0.06,
    scrollTrigger: { trigger: word, start: 'top 95%' },
  });
}

/* ------------------------------------------------------------------ loader */

// The scale's two tempos, in seconds. Someone's very first visit gets the long one: people love the scale (owner,
// 6 Nov), so it holds on 4:20 and stays on screen about three seconds. Every later time, a new visit or the logo, it
// plays through in about a second and a half (owner, 19 Nov).
const SCALE_TEMPO = {
  long: { rise: 0.8, read0: 0.45, read: 0.1, lock: 0.1, blink: 0.12, flash: 0.07, flashes: 3, hold: 1.3, out: 0.45, msgOut: 0.3, wipe: 0.8 },
  short: { rise: 0.4, read0: 0.12, read: 0.045, lock: 0.05, blink: 0.05, flash: 0.05, flashes: 1, hold: 0.2, out: 0.28, msgOut: 0.2, wipe: 0.42 },
};

function runLoader(long = false) {
  const loader = $('.loader');
  if (!loader) return Promise.resolve();
  const s = long ? SCALE_TEMPO.long : SCALE_TEMPO.short;
  const val = $('.lcd__val', loader);
  lockScroll(true);
  const reads = ['0.00', '0.00', '1.24', '2.97', '3.88', '4.36', '4.15', '4.23', '4.20', '4.20'];
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => { loader.remove(); resolve(); },
    });
    tl.from('.loader__scale', { y: 40, opacity: 0, duration: s.rise, ease: 'jig' })
      .from('.loader__msg', { opacity: 0, duration: s.rise / 2 }, `-=${s.rise / 2}`);
    reads.forEach((r, i) => tl.call(() => { val.textContent = r; }, null, s.read0 + i * s.read));
    tl.call(() => { val.textContent = '4:20'; loader.classList.add('is-locked'); }, null, `+=${s.lock}`)
      .to($('.lcd', loader), { opacity: 0.25, duration: s.flash, repeat: s.flashes, yoyo: true, ease: 'steps(1)' }, `+=${s.blink}`)
      .to('.loader__scale', { scale: 0.92, opacity: 0, duration: s.out, ease: 'power3.in' }, `+=${s.hold}`)
      .to('.loader__msg', { opacity: 0, duration: s.msgOut }, '<')
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: s.wipe, ease: 'jigInOut' }, '-=0.15');
  });
}

// A clean copy of the scale, taken before its first run: the logo plays it again over the page.
let scaleCopy = null;
function replayScale() {
  if (!scaleCopy || $('.loader')) return;
  document.body.append(scaleCopy.cloneNode(true));
  runLoader().then(() => lockScroll(false));
}

/* --------------------------------------------------------------- age gate */

const GATE_KEY = 'jiggy.age.ok';

function gate() {
  let ok = false;
  try { ok = localStorage.getItem(GATE_KEY) === '1'; } catch (e) { /* ignore */ }
  if (ok) return Promise.resolve();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" data-lenis-prevent>
      <div class="gate__box">
        <div class="gate__smile">${SMILE}</div>
        <p class="eyebrow">${CONFIG.ageGate}+</p>
        <h2 id="gate-title">${t('gate.title')}</h2>
        <p class="gate__text">${t('gate.text')}</p>
        <div class="gate__btns">
          <button type="button" class="btn" data-gate="yes" data-magnetic><span class="btn__roll" data-text="${t('gate.yes')}">${t('gate.yes')}</span></button>
          <button type="button" class="btn btn--ghost" data-gate="no"><span class="btn__roll" data-text="${t('gate.no')}">${t('gate.no')}</span></button>
        </div>
        <p class="gate__fine">${t('gate.fine')}</p>
      </div>
    </div>`);
  const el = $('.gate');
  lockScroll(true);
  initMagnetic(el);
  if (!reduced) {
    gsap.timeline()
      .from(el, { opacity: 0, duration: 0.5 })
      .from($$('.gate__box > *', el), { y: 30, opacity: 0, duration: 0.8, ease: 'jig', stagger: 0.07 }, '-=0.2');
  }
  setTimeout(() => $('[data-gate="yes"]', el).focus(), 100);
  return new Promise((resolve) => {
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-gate]');
      if (!btn) return;
      if (btn.dataset.gate === 'no') {
        $('.gate__text', el).textContent = t('gate.denied');
        $('.gate__btns', el).remove();
        return;
      }
      try { localStorage.setItem(GATE_KEY, '1'); } catch (err) { /* ignore */ }
      gsap.to(el, {
        opacity: 0, duration: reduced ? 0 : 0.5, ease: 'power2.out',
        onComplete: () => { el.remove(); lockScroll(false); resolve(); },
      });
    });
  });
}

/* ------------------------------------------------------- generic reveals */

// Entrance animations play once via toggleActions rather than `once: true`: a once-trigger kills itself the
// moment it's created already scrolled past (a reload mid-page, a #link), and doing that while ScrollTrigger
// is still measuring the others threw and left the rest of the page's animations unset.
export function initReveals(root = document) {
  if (reduced) return;
  if (isTouch) touchReveals(root);
  else desktopReveals(root);
  $$('[data-parallax]', root).forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: -amount * 100 }, {
      yPercent: amount * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Phones get lighter entrances: a fade and a rise as CSS transitions (.rv / .rv-in), which the compositor runs on
// its own. The clip-path wipes and line-by-line splits below repainted the whole page every frame while it scrolled.
let revealIO;
const revealSets = new Map();
function touchReveals(root) {
  revealIO = revealIO || new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    revealIO.unobserve(en.target);
    revealSets.get(en.target)?.forEach((el, i) => {
      el.classList.add('rv-in');
      // Back to plain markup once it has landed, so the element's own transitions work again.
      setTimeout(() => { el.classList.remove('rv', 'rv-in'); el.style.transitionDelay = ''; }, 1300 + i * 80);
    });
    revealSets.delete(en.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  const watch = (trigger, els) => {
    els.forEach((el, i) => { el.classList.add('rv'); if (i) el.style.transitionDelay = `${i * 0.08}s`; });
    revealSets.set(trigger, els);
    revealIO.observe(trigger);
  };
  $$('[data-split], [data-clip]', root).forEach((el) => watch(el, [el]));
  $$('[data-reveal]', root).forEach((el) => watch(el, el.dataset.reveal === 'stagger' ? [...el.children] : [el]));
}

function desktopReveals(root) {
  $$('[data-split]', root).forEach((el) => {
    // Lines rise out of a mask, then the original markup comes back: Turkish İ/Ğ/Ü/Ş/Ç marks
    // reach past these tight heading lines and a mask left in place would shave them off.
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 140, duration: 1.1, ease: 'jig', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      onComplete: () => split.revert(),
    });
  });
  $$('[data-reveal]', root).forEach((el) => {
    const targets = el.dataset.reveal === 'stagger' ? el.children : el;
    gsap.from(targets, {
      y: 40, opacity: 0, duration: 1, ease: 'jig', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
    });
  });
  $$('[data-clip]', root).forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'jigInOut' });
    if (!img) return;
    // The zoom settles where the stylesheet has the photo (1.15 on the blurred "soon" shots, so their soft edges stay
    // out of frame) and then hands the transform back to CSS, or hover zooms would stay dead. The photo's own CSS
    // transition is off meanwhile, otherwise it chases every frame of the tween.
    const end = gsap.getProperty(img, 'scaleX') || 1;
    const own = !img.hasAttribute('data-parallax');
    img.style.transition = 'none';
    tl.fromTo(img, { scale: end * 1.3 }, {
      scale: end, duration: 1.6, ease: 'jig',
      onComplete: () => { if (own) gsap.set(img, { clearProps: 'transform' }); img.style.transition = ''; },
    }, 0);
  });
}

/* -------------------------------------------------------------------- boot */

// Runs each setup step on its own so one failing animation can't take the page down with it.
export function safely(...steps) {
  steps.forEach((step) => {
    try { step(); } catch (err) { console.error(`[${step.name}]`, err); }
  });
}

// SplitText re-splits on its own once late fonts arrive, so slow networks don't need to hold the intro long.
function fontsReady() {
  return Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
}

export async function boot({ loader = false } = {}) {
  applyI18n(document);
  guardMedia();
  renderShell();
  initLenis();
  initCursor();
  initHeader();
  initCart();
  initFooter();
  initTransitions();
  initLiveSections();
  await fontsReady();

  let firstVisit = true;
  let fromLogo = false;
  try {
    firstVisit = !sessionStorage.getItem('jiggy.session');
    sessionStorage.setItem('jiggy.session', '1');
    fromLogo = sessionStorage.getItem(SCALE_KEY) === '1';
    sessionStorage.removeItem(SCALE_KEY);
  } catch (e) { /* ignore */ }
  // Only someone who has never been in (never said yes at the age gate) gets the long scale.
  let firstEver = true;
  try { firstEver = localStorage.getItem(GATE_KEY) !== '1'; } catch (e) { /* ignore */ }
  scaleCopy = $('.loader')?.cloneNode(true) || null;
  if (loader && (firstVisit || fromLogo) && !reduced) {
    try { sessionStorage.removeItem(CURTAIN_KEY); } catch (e) { /* ignore */ }
    await runLoader(firstEver);
  } else {
    $('.loader')?.remove();
    await revealCurtain();
  }
  document.documentElement.classList.add('is-ready');
  await gate();
  lockScroll(false);
  safely(initMagnetic, initReveals, animateFooter);
  const target = hashTarget(location.hash);
  if (target) setTimeout(() => scrollToTarget(target, { immediate: false }), 300);
}
