import { getProduct, getVariant, getPart, priceOf, isBuyable, SET } from './products.js';
import { amountOf } from './i18n.js';

const KEY = 'jiggy.cart.v1';
// Most of one piece a bag line holds.
export const MAX_QTY = 9;
const subscribers = new Set();

const keyOf = (l) => `${l.id}|${l.variant || ''}|${l.size || ''}|${l.part || ''}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    // Drop lines whose product or piece no longer exists or can't be bought (renamed, coming soon…).
    const kept = raw.filter((l) => {
      const p = l && getProduct(l.id);
      if (!p) return false;
      l.qty = Math.min(Math.floor(Number(l.qty)), MAX_QTY);
      if (!(l.qty > 0)) return false;
      const v = l.variant ? p.variants.find((x) => x.id === l.variant) : p.variants[0];
      l.part = getPart(p, l.part)?.id || null; // bags from before parts existed hold the pair
      return Boolean(v) && isBuyable(p, v);
    });
    // Two lines that came out as the same piece (an old pair line and a new one) become one.
    const merged = new Map();
    kept.forEach((l) => {
      const found = merged.get(keyOf(l));
      if (found) found.qty = Math.min(found.qty + l.qty, MAX_QTY);
      else merged.set(keyOf(l), l);
    });
    return [...merged.values()];
  } catch (e) {
    return [];
  }
}

let lines = load();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* storage blocked */ }
  subscribers.forEach((fn) => fn(lines));
}

// One piece of a bag line, in the active currency.
function unit(l) {
  const p = getProduct(l.id);
  return p ? amountOf(priceOf(p, getVariant(p, l.variant), l.part)) : 0;
}

export const cart = {
  get lines() {
    return lines;
  },
  count() {
    return lines.reduce((n, l) => n + l.qty, 0);
  },
  add({ id, variant = null, size = null, part = null, qty = 1 }) {
    const p = getProduct(id);
    part = (p && getPart(p, part)?.id) || null;
    const key = keyOf({ id, variant, size, part });
    const found = lines.find((l) => keyOf(l) === key);
    if (found) found.qty = Math.min(found.qty + qty, MAX_QTY);
    else lines.push({ id, variant, size, part, qty: Math.min(qty, MAX_QTY) });
    persist();
  },
  setQty(key, qty) {
    const line = lines.find((l) => keyOf(l) === key);
    if (!line) return;
    if (qty <= 0) lines = lines.filter((l) => l !== line);
    else line.qty = Math.min(qty, MAX_QTY);
    persist();
  },
  remove(key) {
    lines = lines.filter((l) => keyOf(l) !== key);
    persist();
  },
  clear() {
    lines = [];
    persist();
  },
  unit,
  subtotal() {
    return lines.reduce((sum, l) => sum + unit(l) * l.qty, 0);
  },
  // How many ring + Sniffy pairs are in the bag (any colors, any Sniffy part).
  sets() {
    const qty = (id) => lines.reduce((n, l) => n + (l.id === id ? l.qty : 0), 0);
    return Math.min(qty(SET.ring), qty(SET.earring));
  },
  // Set discount in the active currency: each ring + Sniffy pair gets `off` of the two pieces' prices (the
  // dearest ones are paired first), rounded to whole units so every total adds up on screen.
  discount() {
    const units = (id) => lines.filter((l) => l.id === id).flatMap((l) => Array(l.qty).fill(unit(l))).sort((a, b) => b - a);
    const rings = units(SET.ring);
    const earrings = units(SET.earring);
    let off = 0;
    for (let i = 0; i < Math.min(rings.length, earrings.length); i += 1) off += Math.round((rings[i] + earrings[i]) * SET.off);
    return off;
  },
  // What the pieces cost after the set discount, before shipping.
  total() {
    return this.subtotal() - this.discount();
  },
  keyOf,
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};

function reload() {
  lines = load();
  subscribers.forEach((fn) => fn(lines));
}

// Keep several open tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) reload();
});
// A page brought back by the back button as it was (bfcache) missed what the pages after it did to the bag: an
// order placed, pieces added. Not every browser hands it the storage events it missed, and then its old bag would
// show, and its next change would write that old bag back over the new one.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) reload();
});
