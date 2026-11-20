import { boot, $, $$, reduced, SMILE, ARROW, variantLabel, lineName, lineImage, scrollToTarget } from './core.js';
import { t, L, money, amountOf } from './i18n.js';
import { CONFIG } from './config.js';
import { cart } from './cart.js';
import { getProduct } from './products.js';
import { src } from './images.js';

const { gsap } = window;
const root = $('[data-co]');
const main = $('[data-co-main]');
const form = $('[data-form]');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const docs = $('[data-docs]');
const docsBody = $('[data-docs-body]');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
$('[data-paynote]').textContent = t(CONFIG.checkout.mode === 'whatsapp' ? 'co.pay.whatsapp' : 'co.pay.demo');

const method = () => form.querySelector('input[name="method"]:checked').value;

function shippingCost(subtotal) {
  if (method() === 'standard' && subtotal >= amountOf(CONFIG.freeShipping)) return 0;
  return amountOf(CONFIG.shipping[method()]);
}

// With nothing in the bag the form steps aside for a note, and comes back (filled in as it was) once something
// lands in the bag again, say from another tab.
function render() {
  $('.co__empty', root)?.remove();
  main.hidden = !cart.lines.length;
  if (main.hidden) {
    root.insertAdjacentHTML('beforeend', `
      <div class="co__empty">
        ${SMILE}
        <h1 class="sec-title">${t('co.empty')}</h1>
        <a class="btn" href="shop.html"><span class="btn__roll" data-text="${t('cart.empty.cta')}">${t('cart.empty.cta')}</span>${ARROW}</a>
      </div>`);
    return false;
  }
  $('[data-co-lines]', root).innerHTML = cart.lines.map((l) => {
    const p = getProduct(l.id);
    return `
      <div class="co__line">
        <div class="co__thumb"><img src="${src(lineImage(p, l), true)}" alt="" width="70" height="88"><span>${l.qty}</span></div>
        <div><b lang="en">${lineName(p, l)}</b><small>${variantLabel(p, l)}</small></div>
        <span>${money(cart.unit(l) * l.qty)}</span>
      </div>`;
  }).join('');
  // Ara toplam is after the set discount; free shipping is judged on that same amount.
  const off = cart.discount();
  $('[data-co-set]', root).hidden = off === 0;
  $('[data-co-off]', root).textContent = `−${money(off)}`;
  const sub = cart.total();
  const ship = shippingCost(sub);
  $('[data-co-sub]', root).textContent = money(sub);
  $('[data-co-ship]', root).textContent = ship === 0 ? t('co.free') : money(ship);
  $('[data-co-total]', root).textContent = money(sub + ship);
  const freeStd = sub >= amountOf(CONFIG.freeShipping);
  $('[data-rate="standard"]').textContent = freeStd ? t('co.free') : money(CONFIG.shipping.standard);
  $('[data-rate="express"]').textContent = money(CONFIG.shipping.express);
  const label = `${t('co.place')} — ${money(sub + ship)}`;
  const place = $('[data-place]');
  place.textContent = label;
  place.dataset.text = label;
  fillDocs();
  return true;
}

function validate() {
  let first = null;
  $$('.field', form).forEach((f) => {
    const input = f.querySelector('input, select');
    const v = input.value.trim();
    const bad = (input.required && !v) || (input.type === 'email' && v && !EMAIL_RE.test(v));
    f.classList.toggle('is-error', bad);
    if (input.type === 'email') f.querySelector('em').textContent = v ? t('co.invalid.email') : t('co.required');
    if (bad && !first) first = input;
  });
  // The agreements and the 21+ statement are two boxes, both required.
  $$('[data-check]', form).forEach((box) => {
    const ok = box.querySelector('input').checked;
    box.classList.toggle('is-error', !ok);
    if (!ok && !first) first = box.querySelector('input');
  });
  $('[data-co-age-error]', form).hidden = form.elements.age.checked;
  if (first) {
    scrollToTarget(first.closest('.co__block'), { offset: -100 });
    setTimeout(() => first.focus({ preventScroll: true }), 400);
  }
  return !first;
}

function orderText(id, data) {
  const lines = cart.lines.map((l) => {
    const p = getProduct(l.id);
    return `• ${l.qty} × ${lineName(p, l)} (${variantLabel(p, l)}) — ${money(cart.unit(l) * l.qty)}`;
  });
  const off = cart.discount();
  const sub = cart.total();
  const ship = shippingCost(sub);
  return [
    `JIGGY — ${id}`,
    ...lines,
    ...(off ? [`${t('cart.set')}: −${money(off)}`] : []),
    `${t('co.subtotal')}: ${money(sub)}`,
    `${t('co.shipping')}: ${ship === 0 ? t('co.free') : money(ship)} (${t(`co.${data.method}`)})`,
    `${t('co.total')}: ${money(sub + ship)}`,
    '',
    `${data.first} ${data.last}`,
    data.address,
    `${data.zip} ${data.city}, ${data.country}`,
    data.email,
    data.phone,
    '',
    // The 21+ statement goes on the order's record with its date and time (Mesafeli Satış Sözleşmesi 5.3).
    `${t('co.age.record')} · ${new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`,
  ].join('\n');
}

// waUrl is set in WhatsApp mode: the order only reaches the brand once the customer sends that message.
function success(id, waUrl) {
  const kind = waUrl ? 'wa' : 'demo';
  const cta = waUrl
    ? `<a class="btn" href="${waUrl}" target="_blank" rel="noopener"><span class="btn__roll" data-text="${t('co.success.wa.cta')}">${t('co.success.wa.cta')}</span>${ARROW}</a>`
    : `<a class="btn" href="shop.html"><span class="btn__roll" data-text="${t('co.success.cta')}">${t('co.success.cta')}</span>${ARROW}</a>`;
  root.innerHTML = `
    <div class="co__done">
      ${SMILE}
      <p class="eyebrow">${id}</p>
      <h1>${t(`co.success.${kind}.title`)}</h1>
      <p>${t(`co.success.${kind}.text`, { id })}</p>
      ${cta}
    </div>`;
  scrollToTarget(0, { immediate: true });
  if (!reduced) {
    gsap.from('.co__done > *', { y: 40, opacity: 0, duration: 1, ease: 'jig', stagger: 0.08 });
    gsap.fromTo('.co__done .smile', { rotate: -30, scale: 0.4 }, { rotate: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.45)' });
  }
}

// "Sözleşmeleri oku": the pre-information form and the distance sales agreement as their pages show them, with this
// order's details on top, in Turkish like the agreements. The texts are fetched the first time the box opens; the
// details follow the form and the bag while it is open.
function orderFacts() {
  const f = form.elements;
  const val = (...names) => names.map((n) => f[n].value.trim()).filter(Boolean).map(esc);
  const sub = cart.total();
  const off = cart.discount();
  const ship = shippingCost(sub);
  const rows = [
    ['Alıcı', val('first', 'last').join(' ')],
    ['Adres', [...val('address'), val('zip', 'city').join(' '), esc($('#f-country').selectedOptions[0].textContent)].filter(Boolean).join(', ')],
    ['E-posta', val('email').join('')],
    ['Telefon', val('phone').join('')],
    ['Ürünler', cart.lines.map((l) => {
      const p = getProduct(l.id);
      return `${l.qty} × ${esc(lineName(p, l))} (${esc(variantLabel(p, l))}) — ${money(cart.unit(l) * l.qty)}`;
    }).join('<br>')],
    ...(off ? [['Set indirimi', `−${money(off)}`]] : []),
    ['Kargo', `${t(`co.${method()}`)} · ${ship === 0 ? t('co.free') : money(ship)}`],
    ['Toplam', money(sub + ship)],
    ['Tarih', new Date().toLocaleDateString('tr-TR')],
  ];
  return `<h3>Bu siparişin bilgileri</h3>
    <dl class="co__facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v || '—'}</dd></div>`).join('')}</dl>`;
}

async function agreement(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const page = new DOMParser().parseFromString(await res.text(), 'text/html');
  const doc = page.querySelector('.legal__doc');
  doc.querySelector('.legal__en')?.remove();
  // One h1 per page: inside the box a title steps down to h3 and its articles to h4.
  doc.querySelectorAll('h1, h2').forEach((h) => {
    const step = page.createElement(h.tagName === 'H1' ? 'h3' : 'h4');
    step.innerHTML = h.innerHTML;
    h.replaceWith(step);
  });
  // Links open beside the checkout, so the form stays as filled in.
  doc.querySelectorAll('a[href]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  return `<section class="co__doc">${doc.innerHTML}</section>`;
}

function fillDocs() {
  if (docs.open) $('[data-docs-order]', docsBody).innerHTML = orderFacts();
}

let docsReady = false;
docs.addEventListener('toggle', async () => {
  if (!docs.open) return;
  fillDocs();
  if (docsReady) return;
  docsReady = true;
  try {
    const texts = await Promise.all(['on-bilgilendirme.html', 'mesafeli-satis-sozlesmesi.html'].map(agreement));
    $('[data-docs-links]', docsBody).outerHTML = texts.join('');
  } catch (err) {
    docsReady = false; // the two links stay in the box; the next opening tries again
  }
});
form.addEventListener('input', fillDocs);

form.addEventListener('change', (e) => {
  if (e.target.name === 'method') render();
  const f = e.target.closest('.field');
  if (f && f.classList.contains('is-error') && e.target.value.trim()) f.classList.remove('is-error');
  const box = e.target.closest('[data-check]');
  if (box && e.target.checked) {
    box.classList.remove('is-error');
    if (e.target.name === 'age') $('[data-co-age-error]', form).hidden = true;
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  data.country = $('#f-country').selectedOptions[0].textContent;
  const id = `JG-${String(Date.now()).slice(-6)}`;
  const waUrl = CONFIG.checkout.mode === 'whatsapp' && CONFIG.checkout.whatsapp
    ? `https://wa.me/${CONFIG.checkout.whatsapp}?text=${encodeURIComponent(orderText(id, data))}`
    : null;
  stopRendering();
  cart.clear();
  success(id, waUrl);
});

// The order is placed once: after that the thank-you screen stays whatever happens to the bag.
const stopRendering = cart.subscribe(render);

render();
await boot();
if (!reduced && !main.hidden) {
  gsap.from('.co__form > *', { y: 40, opacity: 0, duration: 1, ease: 'jig', stagger: 0.07 });
  gsap.from('.co__sticky > *', { y: 30, opacity: 0, duration: 1, ease: 'jig', stagger: 0.07, delay: 0.2 });
}
