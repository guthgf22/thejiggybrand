import { t, L, money } from './i18n.js';
import { pic } from './images.js';
import { addToCart } from './core.js';
import { isBuyable, isSharp, priceOf, materialOf } from './products.js';

// Product card used by the shop grid and the "wear it with" row.
// Shop cards carry the piece's own name (Moon Jiggy) and its colour; `family: true` shows the line instead (The
// Jiggy), with no line under the name (the owner had those captions taken off, 20 Nov).
// Pieces that come in sizes (J-String) get no quick add: the size is picked on their page.
// A special edition that isn't out yet still shows its price; a product that is all coming soon (J-String) says so.
export function cardHTML(p, v = p.variants[0], { quick = true, family = false, sizes = '(max-width: 860px) 50vw, 25vw' } = {}) {
  const soon = !isBuyable(p, v);
  const sharp = soon && isSharp(v, v.image);
  const title = family ? L(p.name) : (v.name || L(p.name));
  const href = `product.html?id=${p.id}${p.variants.length > 1 && !family ? `&v=${v.id}` : ''}`;
  const label = `${title} — ${L(v.label)}`;
  const tint = v.tint ? ` style="--tint:${v.tint}"` : '';
  return `
  <article class="pcard ${soon ? 'pcard--soon' : ''}${sharp ? ' pcard--sharp' : ''}" data-cat="${p.category}" data-cursor="${soon ? 'soon' : 'view'}"${tint}>
    <div class="pcard__frame">
      <div class="pcard__media">
        ${pic(v.image, { alt: label, sizes })}
        ${(v.hover || p.hover) && !soon ? pic(v.hover || p.hover, { cls: 'pcard__alt', sizes }) : ''}
        <span class="pcard__tag pcard__tag--l">${p.code}</span>
        ${sharp ? `<span class="pcard__tag pcard__tag--r pcard__tag--hot">${t('lineup.soon')}</span>` : ''}
        ${soon && !sharp ? `<span class="pcard__stamp">${t('lineup.soon')}</span>` : ''}
      </div>
      ${quick && !soon && !p.sizes ? `<button type="button" class="pcard__quick" data-quick="${p.id}" data-variant="${v.id}"><span>${t('shop.quick')}</span><span aria-hidden="true">+</span></button>` : ''}
    </div>
    <div class="pcard__info">
      <h3 class="pcard__name" lang="en">${title}</h3>
      <span class="pcard__price">${p.status === 'soon' ? t('lineup.soon') : money(priceOf(p, v))}</span>
      ${family ? '' : `<p class="pcard__sub"><i class="pcard__swatch" style="--c:${v.swatch}"></i>${L(v.label)}</p>`}
      ${!family && v.material ? `<p class="pcard__mat">${L(materialOf(v))}</p>` : ''}
    </div>
    <a class="pcard__link" href="${href}" aria-label="${label}"></a>
  </article>`;
}

export function bindCards(root) {
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.pcard');
    if (!card) return;
    const r = card.querySelector('.pcard__media').getBoundingClientRect();
    card.style.setProperty('--cx', `${e.clientX - r.left}px`);
    card.style.setProperty('--cy', `${e.clientY - r.top}px`);
  });
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick]');
    if (!btn) return;
    e.preventDefault();
    addToCart({ id: btn.dataset.quick, variant: btn.dataset.variant });
  });
}
