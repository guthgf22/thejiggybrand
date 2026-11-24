import { boot, $, $$, reduced, isTouch, addToCart, SMILE, ARROW, bindInlineForm, initMagnetic, replaceUrl, safely, scrollToTarget } from './core.js';
import { t, L, money, amountOf, currency } from './i18n.js';
import { CONFIG } from './config.js';
import { MAX_QTY } from './cart.js';
import { PRODUCTS, getProduct, getVariant, getPart, priceOf, materialOf, variantsByPrice, isBuyable, isSharp, shotsFor, SET } from './products.js';
import { pic } from './images.js';
import { cardHTML, bindCards } from './cards.js';

const { gsap, ScrollTrigger, SplitText } = window;
const main = $('[data-pdp]');
const params = new URLSearchParams(location.search);
// The hidden test piece has no page of its own.
const product = [getProduct(params.get('id'))].find((p) => p && !p.hidden);

// 7-segment readout: pad with "!" (a blank digit in DSEG) behind a row of ghost 8s.
function lcd(amount) {
  const ghost = `${'8'.repeat(Math.max(String(Math.floor(amount)).length, 3))}.88`;
  return { ghost, val: amount.toFixed(2).padStart(ghost.length, '!') };
}

const FIGS = `
  <div class="bars__figs">
    <figure class="fig">
      <svg viewBox="0 0 400 34" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><rect class="fill-glow" x="1" y="10" width="320" height="14" rx="7"/><rect x="1" y="10" width="320" height="14" rx="7"/><line x1="10" y1="14" x2="312" y2="14" opacity=".35"/><circle cx="370" cy="17" r="14"/><circle cx="370" cy="17" r="8"/></svg>
      <figcaption>${t('bars.fig.a')}</figcaption>
    </figure>
    <figure class="fig">
      <svg viewBox="0 0 400 34" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><rect class="fill-glow" x="1" y="10" width="320" height="14" rx="2"/><rect x="1" y="10" width="320" height="14" rx="2"/><line x1="8" y1="17" x2="314" y2="17"/><path d="M356 4v13a14 14 0 0 0 28 0V4"/><path d="M362 4v13a8 8 0 0 0 16 0V4"/></svg>
      <figcaption>${t('bars.fig.b')}</figcaption>
    </figure>
  </div>`;

// Photos for the ring's "how to use" steps.
const HOW_SHOTS = ['how-band', 'ring-red', 'how-3'];

function extraHTML(p) {
  if (p.id === 'the-j') {
    return `
    <section class="pdp__section">
      <header class="sec-head">
        <div><p class="eyebrow">${t('how.eyebrow')}</p><h2 class="sec-title" data-split>${t('how.title')}</h2></div>
      </header>
      <div class="steps">
        ${[1, 2, 3].map((i) => `
          <article class="step">
            <figure class="step__img" data-clip>${pic(HOW_SHOTS[i - 1], { sizes: '(max-width: 860px) 100vw, 33vw' })}</figure>
            <span class="how__num">0${i}</span>
            <h3>${t(`how.${i}.t`)}</h3>
            <p>${t(`how.${i}.d`)}</p>
          </article>`).join('')}
      </div>
    </section>`;
  }
  if (p.id === 'sniffy') {
    return `
    <section class="pdp__section pdp__duo">
      <figure class="pdp__duo-img" data-clip>${pic('bars-neon', { sizes: '(max-width: 860px) 100vw, 50vw', alt: L(p.name) })}</figure>
      <div class="pdp__duo-copy">
        <p class="eyebrow">${t('bars.eyebrow')}</p>
        <h2 class="sec-title" data-split>${t('bars.title')}</h2>
        <p class="lede">${t('bars.text')}</p>
        ${FIGS}
      </div>
    </section>`;
  }
  return '';
}

const variantText = (v) => `${v.name} · ${L(v.label)}`;

// One model in a picker: its name (Classic, Moon…) next to a sliver of its metal; a piece that isn't out yet
// carries a pink star. `data` is the attribute the picker reads (data-variant, or data-set-v in the set box).
const swatchHTML = (v, on, data) => `<button type="button" class="swatch${v.soon ? ' swatch--soon' : ''}" role="radio" aria-checked="${on}" aria-label="${variantText(v)}${v.soon ? ` (${t('pdp.soon')})` : ''}" style="--c:${v.swatch}" ${data}><i class="swatch__metal" aria-hidden="true"></i><span lang="en">${v.name.replace(/\s*(Jiggy|Sniffy)$/, '')}</span>${v.soon ? '<i class="swatch__soon" aria-hidden="true">✦</i>' : ''}</button>`;

// The other half of the set starts on the colors in the promo photo: gold ring, rose Sniffy.
const SET_PICK = { ring: 'nugget', earring: 'rose' };

// What this piece (as picked) and the other half of the set (in the color picked there) cost together.
const setFull = (price, other, pick) => amountOf(price) + amountOf(priceOf(other, getVariant(other, pick)));

// Ring + Sniffy offer, shown only while looking at one of the two. The 10% itself comes off in the bag
// (cart.discount), so it also applies when the pair ends up there separately.
function setHTML(p, price) {
  const kind = { [SET.ring]: 'earring', [SET.earring]: 'ring' }[p.id];
  if (!kind || p.status !== 'available') return '';
  const other = getProduct(SET[kind]);
  const pick = SET_PICK[kind];
  const full = setFull(price, other, pick);
  const swatches = other.variants.filter((v) => isBuyable(other, v)).map((v) => swatchHTML(v, v.id === pick, `data-set-v="${v.id}"`)).join('');
  return `
    <div class="pset" data-pset="${other.id}">
      <figure class="pset__img">${pic('bars-rose', { sizes: '120px', alt: '' })}<span class="pcard__tag pcard__tag--l pcard__tag--hot">${t('set.tag')}</span></figure>
      <div class="pset__body">
        <p class="pset__title">${t('set.title')}</p>
        <p class="pset__deal mono">${t('set.deal')}</p>
        <div class="opt">
          <div class="opt__label"><span>${t(`set.${kind}`)}</span><b data-pset-label lang="en">${variantText(getVariant(other, pick))}</b></div>
          <div class="swatches" role="radiogroup" aria-label="${t(`set.${kind}`)}">${swatches}</div>
        </div>
        <div class="pset__buy">
          <p class="pset__price mono" data-pset-price><s>${money(full)}</s><strong>${money(full - Math.round(full * SET.off))}</strong></p>
          <button type="button" class="btn" data-pset-add><span class="btn__roll" data-text="${t('set.cta')}">${t('set.cta')}</span></button>
        </div>
      </div>
    </div>`;
}

function infoHTML(p, variant, part) {
  const soon = p.status === 'soon';
  const now = priceOf(p, variant, part);
  const price = lcd(amountOf(now));
  const ig = CONFIG.instagram[0];
  const swatches = p.variants.length > 1 ? `
    <div class="opt">
      <div class="opt__label"><span>${t('pdp.metal')}</span><b data-variant-label lang="en">${variantText(variant)}</b></div>
      <div class="swatches" role="radiogroup" aria-label="${t('pdp.metal')}">
        ${variantsByPrice(p).map((v) => swatchHTML(v, v.id === variant.id, `data-variant="${v.id}"`)).join('')}
      </div>
    </div>` : '';
  // Sniffy: the pair or one of its pieces, each at its own price. Special editions come as the pair only.
  const parts = p.parts ? `
    <div class="opt" data-parts${variant.price ? ' hidden' : ''}>
      <div class="opt__label"><span>${t('bars.spec.parts')}</span><b data-part-label>${L(getPart(p, part).label)}</b></div>
      <div class="sizes sizes--parts" role="radiogroup" aria-label="${t('bars.spec.parts')}">
        ${p.parts.map((x) => `<button type="button" class="size size--part" role="radio" aria-checked="${x.id === part}" data-part="${x.id}">${L(x.label)}<small>${money(x.price)}</small></button>`).join('')}
      </div>
    </div>` : '';
  const sizes = p.sizes ? `
    <div class="opt">
      <div class="opt__label"><span>${t('pdp.size')}</span><b data-size-label>—</b></div>
      <div class="sizes" role="radiogroup" aria-label="${t('pdp.size')}">
        ${p.sizes.map((s) => `<button type="button" class="size" role="radio" aria-checked="false" data-size="${s}" ${soon ? 'disabled' : ''}>${s}</button>`).join('')}
      </div>
    </div>` : '';
  const buy = soon ? `
    <div class="pdp__soon">
      <p class="eyebrow">${t('pdp.soon')}</p>
      <p>${t('pdp.notify.text')}</p>
      <form class="inline-form" data-notify data-source="${p.id}" novalidate>
        <label class="sr-only" for="pdp-email">Email</label>
        <input id="pdp-email" type="email" autocomplete="email" placeholder="${t('footer.list.placeholder')}" required>
        <button type="submit">${t('pdp.notify')} ${ARROW}</button>
      </form>
      <p class="inline-form__msg" aria-live="polite"></p>
    </div>` : `
    <div class="buy">
      <div class="qty" role="group" aria-label="${t('pdp.qty')}">
        <button type="button" data-q="-1" aria-label="${t('cart.qty.less')}">−</button><span data-qty aria-live="polite">1</span><button type="button" data-q="1" aria-label="${t('cart.qty.more')}">+</button>
      </div>
      <button type="button" class="btn" data-add data-magnetic="0.1"><span class="btn__roll" data-text="${t('pdp.add')} — ${money(now)}">${t('pdp.add')}<span class="btn__price"> — ${money(now)}</span></span></button>
    </div>
    <div class="pdp__soon pdp__soon--variant">
      <p class="eyebrow">${t('pdp.soon')}</p>
      <p>${t('pdp.notify.text')}</p>
      <a class="inline-cta" href="${ig.url}" target="_blank" rel="noopener"><span>${t('form.ig')}</span><b lang="en">${ig.handle}</b>${ARROW}</a>
    </div>`;
  const acc = soon ? '' : `
    <div class="acc">
      <details open><summary>${t('pdp.details')}<i></i></summary><div class="acc__body"><ul>${variant.material ? `<li>${t('pdp.material')}: <span data-material>${L(materialOf(variant))}</span></li>` : ''}${L(p.details).map((d) => `<li>${d}</li>`).join('')}</ul></div></details>
      <details><summary>${t('pdp.care')}<i></i></summary><div class="acc__body"><p>${L(p.care)}</p></div></details>
      <details><summary>${t('pdp.shipping')}<i></i></summary><div class="acc__body"><p>${t('pdp.shipping.text', { amount: money(CONFIG.freeShipping) })}</p></div></details>
    </div>`;
  return `
    <div class="pdp__toprow mono"><span>${p.code}</span><span lang="en">${soon ? t('pdp.soon') : L(p.name)}</span></div>
    <h1 class="pdp__name" lang="en" data-variant-name>${variant.name || L(p.name)}</h1>
    <p class="pdp__tagline">${L(p.tagline)}</p>
    <div class="price-lcd" role="img" aria-label="${t('pdp.price')}: ${money(now)}">
      <span class="lcd" aria-hidden="true"><span class="lcd__ghost">${price.ghost}</span><span class="lcd__val">${price.val}</span></span>
      <span class="price-lcd__cur" aria-hidden="true">${currency}</span>
    </div>
    ${variant.material ? `<p class="pdp__material"><span>${t('pdp.material')}</span><b data-material>${L(materialOf(variant))}</b></p>` : ''}
    <p class="pdp__desc">${L(p.description)}${variant.material ? ` <span class="pdp__desc-mat">${t('pdp.material')}: <b data-material>${L(materialOf(variant))}</b>.</span>` : ''}</p>
    ${swatches}
    ${parts}
    ${sizes}
    ${p.sizeNote ? `<p class="note">${L(p.sizeNote)}</p>` : ''}
    ${buy}
    <ul class="perks">
      <li>${SMILE}${t('pdp.perk1')}</li>
      <li>${SMILE}${t('pdp.perk2', { amount: money(CONFIG.freeShipping) })}</li>
      ${p.pack ? `<li>${SMILE}${L(p.pack)}</li>` : ''}
    </ul>
    ${setHTML(p, now)}
    ${acc}`;
}

// The first shot is the selected piece; a piece that isn't out yet shows as a tinted, blurred teaser, or clear with
// a corner tag when the picture is its own (`sharp`).
// A gallery entry 'video:<name>' is a short clip (assets/video/<name>.mp4, still frame <name>.webp): silent (the files
// carry no sound, the owner's call on 20 Nov), looping, and loaded only as it comes near.
function shotHTML(p, img, i, variant) {
  if (img.startsWith('video:')) {
    const clip = img.slice(6);
    return `
    <figure class="pdp__shot pdp__shot--video">
      <video src="assets/video/${clip}.mp4" poster="assets/video/${clip}.webp" muted loop playsinline preload="none" aria-label="${L(p.name)}"></video>
    </figure>`;
  }
  const soon = p.status === 'soon' || (i === 0 && Boolean(variant.soon));
  const sharp = soon && isSharp(variant, img);
  const name = L(p.name);
  const tint = soon && variant.tint ? ` style="--tint:${variant.tint}"` : '';
  return `
    <figure class="pdp__shot ${i === 0 ? 'pdp__shot--main' : ''} ${soon ? (sharp ? 'pdp__shot--sharp' : 'pdp__shot--soon') : ''}"${sharp ? ` data-cat="${p.category}"` : ''}${tint}>
      ${pic(img, { alt: i === 0 ? `${variant.name || name} — ${L(variant.label)}` : name, sizes: i === 0 ? '(max-width: 860px) 100vw, 58vw' : '(max-width: 860px) 100vw, 29vw', eager: i === 0 })}
      ${sharp ? `<span class="pcard__tag pcard__tag--r pcard__tag--hot">${t('pdp.soon')}</span>` : ''}
      ${soon && !sharp ? `<span class="pcard__stamp">${t('pdp.soon')}</span>` : ''}
    </figure>`;
}

// Gallery clips play while at least half on screen: a swipe to them on a phone, a scroll to them on a desktop. With
// reduced motion they wait for the viewer, with the player's own controls.
let clipWatch = null;
// A clip starts loading a little before it's reached, so it plays as soon as it's on screen: on a desktop within a
// screen of view, on a phone once the photo before it is showing (the gallery's scroll handler warms it).
let clipWarm = null;
function warmClip(video) {
  if (!video || video.preload === 'auto' || video.readyState > 0 || !video.paused) return;
  video.preload = 'auto';
  video.load();
}
function watchClips(root) {
  const clips = $$('video', root);
  if (!clips.length) return;
  if (reduced) {
    clips.forEach((v) => { v.controls = true; });
    return;
  }
  clipWatch ||= new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {});
    else target.pause();
  }), { threshold: 0.5 });
  clipWarm ||= new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) warmClip(target);
  }), { rootMargin: '100% 0px' });
  clips.forEach((v) => {
    clipWatch.observe(v);
    clipWarm.observe(v);
  });
}

function render(p) {
  let variant = getVariant(p, params.get('v'));
  let part = getPart(p, params.get('p'))?.id || null;
  let size = null;
  let qty = 1;
  const soon = p.status === 'soon';
  const name = L(p.name);
  document.title = `${variant.name || name} — JIGGY`;
  $('meta[name="description"]').setAttribute('content', L(p.description));
  const priceNow = () => priceOf(p, variant, part);
  const meta = () => [L(variant.label), part && L(getPart(p, part).label), money(priceNow())].filter(Boolean).join(' · ');

  let shots = shotsFor(p, variant, part);
  const others = PRODUCTS.filter((x) => x.id !== p.id);

  main.innerHTML = `
    <nav class="crumbs mono" aria-label="Breadcrumb">
      <a href="shop.html">${t('nav.shop')}</a><span>/</span>
      <a href="shop.html?c=${p.category}">${t(`shop.filter.${p.category}`)}</a><span>/</span>
      <span lang="en">${name}</span>
    </nav>
    <div class="pdp__main">
      <div class="pdp__wrap">
        <div class="pdp__gallery" data-gallery>${shots.map((img, i) => shotHTML(p, img, i, variant)).join('')}</div>
        <span class="pdp__count mono" data-count${shots.length < 2 ? ' hidden' : ''}>1 / ${shots.length}</span>
      </div>
      <aside class="pdp__info" data-info>${infoHTML(p, variant, part)}</aside>
    </div>
    ${extraHTML(p)}
    <section class="pdp__section">
      <header class="sec-head"><div><p class="eyebrow">JIGGY</p><h2 class="sec-title" data-split>${t('pdp.related')}</h2></div></header>
      <div class="related" data-related>
        ${others.map((x) => cardHTML(x, x.variants.find((v) => !v.soon) || x.variants[0], { quick: false, family: true, sizes: '(max-width: 860px) 50vw, 33vw' })).join('')}
        <a class="related__all" href="shop.html" data-cursor="view">
          ${pic('ring-four', { sizes: '(max-width: 860px) 50vw, 33vw', alt: '' })}
          <span class="sec-title">${t('lineup.all')}</span>
        </a>
      </div>
    </section>
    ${soon ? '' : `
    <div class="mobile-buy" data-mobile-buy>
      <div><b lang="en" data-mb-name>${variant.name || name}</b><small data-mb-meta>${meta()}</small></div>
      <button type="button" class="btn" data-add-mobile>${t('pdp.add')}</button>
    </div>`}`;

  bindCards($('[data-related]'));

  /* variant */
  const info = $('[data-info]');
  const label = $('[data-variant-label]');
  const gallery = $('[data-gallery]');
  watchClips(gallery);
  const count = $('[data-count]');
  const pset = $('[data-pset]');
  const other = pset ? getProduct(pset.dataset.pset) : null;
  let otherPick = pset ? $('[data-set-v][aria-checked="true"]', pset).dataset.setV : null;
  const syncSoon = () => {
    info.classList.toggle('is-soon', Boolean(variant.soon));
    const bar = $('[data-mobile-buy]');
    if (bar) bar.hidden = Boolean(variant.soon);
  };
  syncSoon();
  // The price everywhere it shows: the color (special editions) and the part (Sniffy) both change it.
  const syncPrices = () => {
    const now = priceNow();
    const box = $('.price-lcd', info);
    if (box) {
      const { ghost, val } = lcd(amountOf(now));
      box.setAttribute('aria-label', `${t('pdp.price')}: ${money(now)}`);
      $('.lcd__ghost', box).textContent = ghost;
      $('.lcd__val', box).textContent = val;
    }
    const roll = $('[data-add] .btn__roll');
    const tag = roll && $('.btn__price', roll);
    if (tag) { roll.dataset.text = `${t('pdp.add')} — ${money(now)}`; tag.textContent = ` — ${money(now)}`; }
    const mb = $('[data-mb-meta]');
    if (mb) mb.textContent = meta();
    if (pset) {
      const full = setFull(now, other, otherPick);
      $('[data-pset-price]', pset).innerHTML = `<s>${money(full)}</s><strong>${money(full - Math.round(full * SET.off))}</strong>`;
    }
  };
  // Each color (and a part with a photo of its own) has its own photo set: fade the gallery out, swap it whole,
  // fade back in. Colors tapped in quick succession swap once, to the last one.
  let swapTimer = 0;
  let swapRun = 0;
  const swapGallery = () => {
    const run = ++swapRun;
    gallery.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      shots = shotsFor(p, variant, part);
      clipWatch?.disconnect();
      clipWarm?.disconnect();
      gallery.innerHTML = shots.map((img, i) => shotHTML(p, img, i, variant)).join('');
      watchClips(gallery);
      gallery.scrollLeft = 0;
      count.textContent = `1 / ${shots.length}`;
      count.hidden = shots.length < 2; // a single photo needs no "1 / 1"
      ScrollTrigger.refresh();
      const img = $('img', gallery);
      const done = () => setTimeout(() => { if (run === swapRun) gallery.classList.remove('is-swapping'); }, 20);
      (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    }, 220);
  };
  const keepInUrl = (key, value) => {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    replaceUrl(url);
  };
  const setVariant = (id) => {
    if (id === variant.id) return;
    variant = getVariant(p, id);
    $$('.swatch[data-variant]').forEach((s) => s.setAttribute('aria-checked', String(s.dataset.variant === id)));
    if (label) label.textContent = variantText(variant);
    $$('[data-material]').forEach((m) => { m.textContent = L(materialOf(variant)); });
    const partsRow = $('[data-parts]');
    if (partsRow) partsRow.hidden = Boolean(variant.price);
    $('[data-variant-name]').textContent = variant.name || name;
    document.title = `${variant.name || name} — JIGGY`;
    const mbName = $('[data-mb-name]');
    if (mbName) mbName.textContent = variant.name || name;
    syncSoon();
    syncPrices();
    swapGallery();
    keepInUrl('v', id);
  };
  $$('.swatch[data-variant]').forEach((s) => s.addEventListener('click', () => setVariant(s.dataset.variant)));

  /* part (Sniffy: the pair, the bar only or the channel only) */
  const setPart = (id) => {
    if (id === part) return;
    const lead = shots[0];
    part = id;
    $$('[data-part]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.part === id)));
    $('[data-part-label]').textContent = L(getPart(p, part).label);
    syncPrices();
    if (shotsFor(p, variant, part)[0] !== lead) swapGallery();
    keepInUrl('p', id);
  };
  $$('[data-part]').forEach((b) => b.addEventListener('click', () => setPart(b.dataset.part)));

  /* size */
  const sizeRow = $('[data-size-label]')?.closest('.opt');
  $$('.size[data-size]:not([disabled])').forEach((b) => b.addEventListener('click', () => {
    size = b.dataset.size;
    $$('.size[data-size]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    $('[data-size-label]').textContent = size;
    sizeRow.classList.remove('is-error');
  }));

  /* qty + add */
  const qtyEl = $('[data-qty]');
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.min(MAX_QTY, Math.max(1, qty + Number(b.dataset.q)));
    qtyEl.textContent = qty;
    $('[data-q="1"]').disabled = qty >= MAX_QTY;
  }));
  // "Added ✓" on the button for a moment. Another add while it shows only starts the moment over: the label it
  // comes back to is the one from before the first (it used to keep "Added ✓" for good).
  const flashes = new Map();
  const flash = (btn) => {
    const roll = btn.querySelector('.btn__roll');
    const box = roll || btn;
    if (!flashes.has(btn)) flashes.set(btn, { html: box.innerHTML, timer: 0 });
    const state = flashes.get(btn);
    clearTimeout(state.timer);
    const done = `${t('pdp.added')} ✓`;
    btn.classList.add('is-added');
    box.textContent = done;
    if (roll) roll.dataset.text = done;
    state.timer = setTimeout(() => {
      flashes.delete(btn);
      btn.classList.remove('is-added');
      box.innerHTML = state.html;
      if (roll) roll.dataset.text = roll.textContent;
      syncPrices(); // the part may have changed meanwhile
    }, 1800);
  };
  const add = (btn) => {
    if (!isBuyable(p, variant)) return;
    // A piece that comes in sizes doesn't go in the bag without one: point at the sizes instead.
    if (p.sizes && !size) {
      sizeRow.classList.add('is-error');
      const r = sizeRow.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight) scrollToTarget(scrollY + r.top - innerHeight / 3);
      return;
    }
    addToCart({ id: p.id, variant: variant.id, size, part, qty });
    flash(btn);
  };
  $('[data-add]')?.addEventListener('click', (e) => add(e.currentTarget));
  $('[data-add-mobile]')?.addEventListener('click', (e) => add(e.currentTarget));

  /* desktop: the info panel sticks beside the gallery; when it's taller than the screen it sticks by its
     bottom edge instead, so the set offer and the details below the fold can always be reached */
  const fitSticky = () => {
    // Phones stack the panel under the photos (not sticky): measuring it there would only force an early layout.
    if (getComputedStyle(info).position !== 'sticky') { info.style.top = ''; return; }
    const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 76;
    info.style.top = `${Math.min(hdr + innerHeight * 0.03, innerHeight - info.offsetHeight - 24)}px`;
  };
  fitSticky();
  window.addEventListener('resize', fitSticky);
  if ('ResizeObserver' in window) new ResizeObserver(fitSticky).observe(info);

  /* set offer: this piece in its current color (and part) + the other one in the color picked here */
  if (pset) {
    $$('[data-set-v]', pset).forEach((b) => b.addEventListener('click', () => {
      otherPick = b.dataset.setV;
      $$('[data-set-v]', pset).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      $('[data-pset-label]', pset).textContent = variantText(getVariant(other, otherPick));
      syncPrices();
    }));
    $('[data-pset-add]', pset).addEventListener('click', (e) => {
      if (!isBuyable(p, variant)) return;
      addToCart({ id: p.id, variant: variant.id, size, part }, { open: false });
      addToCart({ id: other.id, variant: otherPick });
      flash(e.currentTarget);
    });
  }

  /* notify (coming soon) */
  const notify = $('[data-notify]');
  if (notify) bindInlineForm(notify, 'jstring.ok', 'footer.list.bad');

  /* mobile: gallery counter + sticky buy bar */
  gallery.addEventListener('scroll', () => {
    const i = Math.round(gallery.scrollLeft / gallery.clientWidth);
    count.textContent = `${i + 1} / ${shots.length}`;
    if (!reduced) warmClip(gallery.children[i + 1]?.querySelector('video'));
  }, { passive: true });

  /* phones: a tap on the right two thirds of a shot (photo or clip) goes forward, on the left third back; the gallery
     stops at its first and last shot (no wrapping round, the owner's call). */
  const carousel = () => getComputedStyle(gallery).display === 'flex';
  const current = () => Math.round(gallery.scrollLeft / gallery.clientWidth);
  const goTo = (i) => gallery.scrollTo({ left: Math.max(0, Math.min(i, shots.length - 1)) * gallery.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  let touch = null;
  gallery.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, i: current(), at: Date.now() };
  }, { passive: true });
  gallery.addEventListener('touchend', (e) => {
    if (!touch || !carousel()) return;
    const t = e.changedTouches[0];
    const tap = Math.abs(t.clientX - touch.x) < 10 && Math.abs(t.clientY - touch.y) < 10 && Date.now() - touch.at < 300;
    if (tap) {
      const r = gallery.getBoundingClientRect();
      goTo(touch.i + (t.clientX - r.left < r.width / 3 ? -1 : 1));
    }
    touch = null;
  });
  const bar = $('[data-mobile-buy]');
  const addBtn = $('[data-add]');
  if (bar && addBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      bar.classList.toggle('is-shown', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(addBtn);
  }
}

function notFound() {
  document.title = '404 — JIGGY';
  main.innerHTML = `
    <div class="notfound">
      ${SMILE}
      <h1 class="sec-title">${t('pdp.notfound')}</h1>
      <a class="btn" href="shop.html"><span class="btn__roll" data-text="${t('pdp.back')}">${t('pdp.back')}</span>${ARROW}</a>
    </div>`;
}

function intro() {
  if (reduced || !product) return;
  const name = $('.pdp__name');
  const shot = $('.pdp__shot--main');
  const img = $('img', shot);
  const split = SplitText.create(name, { type: 'chars', mask: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'jig' } });
  // Phones fade the photo in: wiping it open with clip-path repaints the full-width photo on every frame.
  if (isTouch) tl.fromTo(shot, { opacity: 0, willChange: 'opacity' }, { opacity: 1, duration: 1, ease: 'power2.out', clearProps: 'opacity,willChange' }, 0);
  else tl.fromTo(shot, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'jigInOut' }, 0);
  // The zoom settles where the stylesheet has the photo (1.15 on blurred "soon" colours, keeping the blur's soft
  // edges out of frame) and hands the transform back to CSS.
  const end = gsap.getProperty(img, 'scaleX') || 1;
  tl.fromTo(img, { scale: end * 1.25 }, { scale: end, duration: 1.6, clearProps: 'transform' }, 0)
    .from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.035 }, 0.2)
    .from($$('.pdp__info > *:not(.pdp__name)'), { y: 30, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.35)
    .call(() => {
      // A color picked while the letters were still rising has renamed the heading meanwhile: revert() alone
      // would put the first color's name back.
      const now = name.textContent;
      split.revert();
      name.textContent = now;
    });
  $$('.fig svg').forEach((svg) => {
    const shapes = $$('rect:not(.fill-glow), circle, line, path', svg);
    shapes.forEach((s) => { const len = s.getTotalLength(); gsap.set(s, { strokeDasharray: len, strokeDashoffset: len }); });
    gsap.to(shapes, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: { trigger: svg, start: 'top 88%', toggleActions: 'play none none none' } });
  });
}

if (product) render(product); else notFound();
await boot({ loader: true }); // the weighing scale opens a visit that starts here, as on the home page
initMagnetic(main);
safely(intro);
ScrollTrigger.refresh();
