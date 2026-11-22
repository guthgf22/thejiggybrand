import { boot, $, $$, reduced, replaceUrl } from './core.js';
import { t, amountOf } from './i18n.js';
import { PRODUCTS, isBuyable, priceOf } from './products.js';
import { cardHTML, bindCards } from './cards.js';

const { gsap, ScrollTrigger } = window;

const grid = $('[data-grid]');
// Rings first, then earrings, then underwear; inside each, cheapest first. Pieces not out yet (no price shown)
// close their group, also cheapest first.
const GROUPS = ['rings', 'earrings', 'underwear'];
const items = PRODUCTS.flatMap((p) => p.variants.map((v) => ({ p, v })))
  .map((x, i) => ({ ...x, i, group: GROUPS.indexOf(x.p.category), later: !isBuyable(x.p, x.v), cost: amountOf(priceOf(x.p, x.v)) }))
  .sort((a, b) => a.group - b.group || a.later - b.later || a.cost - b.cost || a.i - b.i);
grid.innerHTML = items.map(({ p, v }) => cardHTML(p, v)).join('');
bindCards(grid);

const chips = $$('[data-filter]');

function apply(filter, animate = true) {
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
  const cards = $$('.pcard', grid);
  const show = cards.filter((c) => filter === 'all' || c.dataset.cat === filter);
  $('[data-shop-count]').textContent = t('shop.count', { n: show.length });
  const swap = () => {
    cards.forEach((c) => { c.hidden = !show.includes(c); });
    ScrollTrigger.refresh();
    if (animate && !reduced) gsap.fromTo(show, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'jig', stagger: 0.05 });
  };
  if (!animate || reduced) return swap();
  gsap.to(cards.filter((c) => !c.hidden), { opacity: 0, y: -10, duration: 0.25, ease: 'power2.in', onComplete: swap });
}

const params = new URLSearchParams(location.search);
const initial = ['rings', 'earrings', 'underwear'].includes(params.get('c')) ? params.get('c') : 'all';
apply(initial, false);

chips.forEach((chip) => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  apply(f);
  const url = new URL(location.href);
  if (f === 'all') url.searchParams.delete('c'); else url.searchParams.set('c', f);
  replaceUrl(url);
}));

await boot({ loader: true }); // the weighing scale opens a visit that starts here, as on the home page
if (!reduced) {
  gsap.from($$('.pcard:not([hidden])', grid), {
    y: 60, opacity: 0, duration: 1.1, ease: 'jig', stagger: 0.07, delay: 0.1,
  });
}
ScrollTrigger.refresh();
