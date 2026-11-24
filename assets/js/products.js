// Catalog. Prices: usd + try. Product status: 'available' | 'soon'.
// Each variant has its own name (Classic Jiggy, Silver Sniffy…) and `material`. A variant with `soon: true`
// shows as "coming soon" (blurred photo tinted with `tint`) and can't be added to the bag.
// A coming-soon variant with `sharp: true` has pictures of its own (All Silver): they show clear, with "coming soon"
// on a corner tag instead of the stamp across the middle. `sharp` can also list the pictures that show clear (the
// J-String: its blurred teaser leads, the poster under it is clear).
// A variant with its own `price` (the special editions) costs that instead of the product's price; on a
// product with parts it is the price of the pair, which is then the only way it is sold. A product with `parts`
// (Sniffy) is bought as the pair or as one piece on its own: each part has its own price, the first
// is the default, and a variant's `partShots` names its photo of one part where there is one.
// A variant's `weight` (special editions) shows next to its material.
// Shop cards: the four ring colours share one scene (ring-dark, its ring recoloured per metal), and the three Sniffy
// colours one ear shot, so each row reads as one set; a variant's `hover`, the second photo its card shows on hover, overrides the product's so the metal
// matches the colour.
// Product page photos: the variant's `image` (also its card and bag photo), then its own
// `gallery`, then the product's shared `gallery`. Plain-backdrop studio shots live only in
// variant galleries, so they never show up outside the product page; the one exception is Gold Sniffy, whose card
// photo is its boxed studio shot (the owner's call).
// Copy is written as jewelry / tobacco-accessory language on purpose — payment
// providers and ad platforms reject explicit drug references.
const GOLD = 'linear-gradient(135deg,#f7da86,#b8862d 55%,#f2cf74)';
const SILVER = 'linear-gradient(135deg,#f6f7f8,#9ba1a7 55%,#e7e9ec)';
const BRASS = 'linear-gradient(135deg,#cdb06c,#8c6d31 60%,#b89a55)';
const ROSE = 'linear-gradient(135deg,#f3bea6,#ad6549 55%,#e8a98f)';
const SPECIAL = { en: 'Special edition', tr: 'Özel seri' };
// What each piece is made of. Payment providers ask for it, so it shows on the piece's page (under the price, in the
// description and the details) and on its shop card.
const M = {
  BRASS: { en: 'Brass', tr: 'Pirinç' },
  BRASS_SILVER: { en: 'Brass, silver-tone plating', tr: 'Pirinç, gümüş renk kaplama' },
  BRASS_GOLD: { en: 'Brass, gold-tone plating', tr: 'Pirinç, altın renk kaplama' },
  BRASS_ROSE: { en: 'Brass, rose-tone plating', tr: 'Pirinç, rose renk kaplama' },
  SILVER_925: { en: '925 sterling silver', tr: '925 ayar gümüş' },
  SILVER_GOLD: { en: '925 sterling silver, gold-tone plating', tr: '925 ayar gümüş, altın renk kaplama' },
  SILVER_ROSE: { en: '925 sterling silver, rose-tone plating', tr: '925 ayar gümüş, rose renk kaplama' },
  COTTON: { en: '100% cotton', tr: '%100 pamuk' },
};
// The plain four-ring shot (ring-four) is the "see all" card at the foot of every product page, so it stays out of the
// galleries to never show twice on a page.
// The Times Square clip shows the standard ring, so it closes the photos of the pieces that look like it (not the
// Gangster, which has its own face).
const CLIP = 'video:jiggy-ts';

export const PRODUCTS = [
  {
    id: 'the-j',
    code: 'No.01',
    category: 'rings',
    status: 'available',
    name: { en: 'The Jiggy', tr: 'The Jiggy' },
    tagline: { en: 'The ring that holds your smoke', tr: 'Sigara tutan yüzük' },
    price: { usd: 20, try: 999 },
    variants: [
      { id: 'classic', name: 'Classic Jiggy', material: M.BRASS, label: { en: 'Unplated', tr: 'Kaplamasız' }, image: 'ring-dark-brass', hover: 'how-3-brass', gallery: ['ring-classic-g2', 'ring-classic-g3', 'ring-noir', 'ring-stamp', CLIP], swatch: BRASS },
      { id: 'moon', name: 'Moon Jiggy', material: M.BRASS_SILVER, label: { en: 'Silver', tr: 'Gümüş' }, image: 'ring-dark-silver', hover: 'how-3-silver', gallery: ['ring-moon-g1', 'ring-moon-g2', 'ring-moon-g3', 'bars-real-2', 'lb-boxring', CLIP], swatch: SILVER },
      { id: 'nugget', name: 'Nugget Jiggy', material: M.BRASS_GOLD, label: { en: 'Gold', tr: 'Altın' }, image: 'ring-dark', gallery: ['ring-nugget-g1', 'ring-nugget-g2', 'ring-nugget-g3', 'ring-scale-night', 'lb-glove', CLIP], swatch: GOLD },
      { id: 'blush', name: 'Blush Jiggy', material: M.BRASS_ROSE, label: { en: 'Rose', tr: 'Rose' }, image: 'ring-dark-rose', hover: 'how-3-rose', gallery: ['ring-blush-g1', 'ring-blush-g2', 'ring-blush-g3', 'lb-fist', CLIP], swatch: ROSE },
      // The special edition: the standard ring in solid silver. Its card is the real dark-scene photo with the red laser
      // line, shifted to silver, shown clear with a "coming soon" corner tag (sharp). The gold and diamond pieces were
      // taken off the site at the owner's request (6 Nov 2026).
      { id: 'allsilver', name: 'All Silver Jiggy', material: M.SILVER_925, weight: { en: '15.5 g', tr: '15,5 gr' }, label: SPECIAL, price: { usd: 280, try: 14000 }, image: 'ring-laser-silver', gallery: ['ring-allsilver-velvet', 'ring-glow', 'how-3-silver', CLIP], swatch: SILVER, tint: '#cfd3d8', soon: true, sharp: true },
    ],
    sizes: null,
    sizeNote: { en: 'One size — open band adjusts', tr: 'Tek beden, bant ayarlanabilir' },
    pack: { en: 'Kraft box, plain label', tr: 'Kraft kutu, sade etiket' },
    hover: 'how-3',
    gallery: [], // the clip sits in the variants' own galleries (see CLIP)
    description: {
      en: 'The face is drilled clean through, so a cigarette or pre-roll sits in the ring — not between your fingers. Controller, steering wheel, glass, phone…',
      tr: 'Ön yüzü boydan boya delik; sigaran ya da sarman parmaklarının arasında değil, yüzükte durur. Oyun kolu, direksiyon, kadeh, telefon…',
    },
    details: {
      en: ['Drilled-through face holds standard cigarettes & pre-rolls', 'Open band — adjusts to most fingers', 'Raised XX grin on the face, JIGGY stamp on the side', 'Ships in the JIGGY kraft box'],
      tr: ['Boydan boya delik ön yüz, normal sigarayı ve sarmayı tutar', 'Açık bant, her parmağa göre ayarlanır', 'Önde kabartma XX gülen surat, yanda JIGGY damgası', 'JIGGY kraft kutusunda gönderilir'],
    },
    care: {
      en: 'Brass is alive: it darkens with time, skin and smoke — that is the point. A soft cloth brings the shine back. Keep it away from perfume, pools and the dishwasher.',
      tr: 'Pirinç zamanla, tenle ve dumanla koyulaşır; olayı da bu. Parlatmak istersen yumuşak bir bezle silmen yeter. Parfümden, havuz ve deniz suyundan uzak tut.',
    },
  },
  {
    id: 'sniffy',
    code: 'No.02',
    category: 'earrings',
    status: 'available',
    name: { en: 'The Sniffy', tr: 'The Sniffy' },
    tagline: { en: 'Two-part bar earrings', tr: 'İki parçalı çubuk küpe' },
    price: { usd: 100, try: 5000 },
    parts: [
      { id: 'pair', label: { en: 'Pair', tr: 'Çift' }, price: { usd: 100, try: 5000 } },
      { id: 'bar', label: { en: 'Bar only', tr: 'Sadece çubuk' }, price: { usd: 60, try: 3000 } },
      { id: 'channel', label: { en: 'Channel only', tr: 'Sadece kanal' }, price: { usd: 30, try: 1500 } },
    ],
    variants: [
      // Each colour shows its own photos, and the three cards are one set: the owner's ear shot and the model shot (hover)
      // in silver as shot, and in gold and rose with only the bar recoloured to the real gold / rose of the rings. The boxed
      // pair leads only for "channel only", which has no photo of its own.
      { id: 'silver', name: 'Silver Sniffy', material: M.SILVER_925, label: { en: 'Silver', tr: 'Gümüş' }, image: 'sniffy-ear', hover: 'bars-real', gallery: ['bar-silver-g', 'bars-real', 'sniffy-model', 'sniffy-box5-silver'], partShots: { bar: 'bar-silver-g', channel: 'sniffy-box5-silver' }, swatch: SILVER },
      { id: 'gold', name: 'Gold Sniffy', material: M.SILVER_GOLD, label: { en: 'Gold', tr: 'Altın' }, image: 'sniffy-ear-gold', hover: 'bars-real-gold2', gallery: ['bar-gold-g2', 'bars-real-gold2', 'sniffy-box5-gold', 'bars-gold'], partShots: { bar: 'bar-gold-g2', channel: 'sniffy-box5-gold' }, swatch: GOLD },
      { id: 'rose', name: 'Rose Sniffy', material: M.SILVER_ROSE, label: { en: 'Rose', tr: 'Rose' }, image: 'sniffy-ear-rose', hover: 'bars-real-rose2', gallery: ['bar-rose-g2', 'bars-real-rose2', 'sniffy-ts-rose', 'sniffy-box5-rose'], partShots: { bar: 'bar-rose-g2', channel: 'sniffy-box5-rose' }, swatch: ROSE },
    ],
    sizes: null,
    sizeNote: { en: 'Pair: 1 hollow bar + 1 open channel. The pieces are also sold on their own.', tr: 'Çift: 1 içi boş çubuk + 1 açık kanal. Parçalar tek tek de satılır.' },
    pack: { en: 'Own box, plain label', tr: 'Kendi kutusunda, sade etiket' },
    hover: 'sniffy-model',
    gallery: ['video:sniffy-glove', 'video:sniffy-woman'], // after every colour's own photos: the gloved clip, then the street one
    description: {
      en: 'Designed in two parts: one hollow bar, one open channel. A mismatched pair that reads as a clean line and carries more than it shows. Wear both, wear one, lend the other.',
      tr: 'İki parçadan oluşur: biri içi boş bir çubuk, diğeri açık bir kanal. Kulakta sade bir çizgi gibi durur ama göründüğünden fazlasını taşır. İkisini birden tak, tek tak ya da birini arkadaşına ver.',
    },
    details: {
      en: ['Pair: 1 hollow bar + 1 open channel. The pieces are also sold on their own.', 'Polished metal, stud post', 'JIGGY mark engraved near the tip', 'Lightweight enough for an all-nighter', 'Arrives in its own box'],
      tr: ['Çift: 1 içi boş çubuk + 1 açık kanal. Parçalar tek tek de satılır.', 'Parlak yüzey, çivi tipi küpe', 'Ucunda kazınmış JIGGY logosu', 'Sabaha kadar takılacak kadar hafif', 'Kendi kutusunda gelir'],
    },
    care: {
      en: 'Wipe with a soft dry cloth after a long night. Store the pair in its box so the channel keeps its edge.',
      tr: 'Uzun bir geceden sonra yumuşak, kuru bir bezle sil. Formu bozulmasın diye kutusunda sakla.',
    },
  },
  {
    id: 'j-string',
    code: 'No.03',
    category: 'underwear',
    status: 'soon',
    name: { en: 'J-String', tr: 'J-String' },
    tagline: { en: 'The G-string, signed', tr: 'JIGGY imzalı G-string' },
    price: { usd: 34, try: 990 },
    variants: [
      { id: 'black', name: 'J-String', material: M.COTTON, label: { en: 'Black', tr: 'Siyah' }, image: 'jstring-tease', gallery: ['jstring-poster'], swatch: '#111', sharp: ['jstring-poster'] },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeNote: null,
    hover: null,
    gallery: [],
    description: {
      en: 'Less fabric. More opinion. The first JIGGY piece you wear under everything else. Dropping soon — we’ll announce it on Instagram first.',
      tr: 'Kumaşı az, lafı çok. Her şeyin altına giyilen ilk JIGGY parçası. Çok yakında; çıktığı gün ilk Instagram’da duyuracağız.',
    },
    details: { en: [], tr: [] },
    care: { en: '', tr: '' },
  },
];

// The 1 TL test piece, for trying a real card payment cheaply. It is not in PRODUCTS, so no list, card or product page
// shows it; it reaches the bag only through a checkout link with #bag=. It ships free, and the server sells it only
// while the test switch is on there (`bash sunucu/sunucu.sh deneme-ac` / `deneme-kapat`).
export const TEST_PRODUCT = {
  id: 'deneme',
  code: 'TEST',
  category: 'test',
  status: 'available',
  hidden: true,
  name: { en: 'Test item', tr: 'Deneme ürünü' },
  tagline: { en: '', tr: '' },
  price: { usd: 1, try: 1 },
  variants: [{ id: 'deneme', name: 'Deneme ürünü (1 TL)', label: { en: 'Test', tr: 'Deneme' }, image: 'ring-dark', swatch: '#888' }],
  sizes: null,
  gallery: [],
};

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || (id === TEST_PRODUCT.id ? TEST_PRODUCT : undefined);
}

export function getVariant(product, variantId) {
  return product.variants.find((v) => v.id === variantId) || product.variants[0];
}

// Ring + Sniffy bought together: every ring–Sniffy pair in the bag gets `off` of the pair's price.
export const SET = { ring: 'the-j', earring: 'sniffy', off: 0.1 };

// The variants in the order the model picker shows them: by price, cheapest first, so the most expensive special
// edition always comes last (the owner's rule: silver, gold, then diamond). Same-price colours keep their order.
export function variantsByPrice(product) {
  return [...product.variants].sort((x, y) => priceOf(product, x).try - priceOf(product, y).try);
}

// Does this picture of a coming-soon piece show clear (its own photo or poster) rather than as the blurred teaser?
export function isSharp(variant, img) {
  return variant.sharp === true || (Array.isArray(variant.sharp) && variant.sharp.includes(img));
}

// Can this exact piece go in the bag right now?
export function isBuyable(product, variant) {
  return product.status === 'available' && !variant.soon;
}

// The part picked (Sniffy: pair, bar only, channel only), the default when none or an unknown one is asked for;
// null for products sold whole.
export function getPart(product, partId) {
  if (!product.parts) return null;
  return product.parts.find((x) => x.id === partId) || product.parts[0];
}

// What one piece costs: the variant's own price (a special edition, sold as the pair), else the part's, else the
// product's.
export function priceOf(product, variant, partId = null) {
  return variant?.price || getPart(product, partId)?.price || product.price;
}

// What the piece is made of, with its weight where there is one, as { en, tr } (null when unknown).
export function materialOf(variant) {
  if (!variant?.material) return null;
  if (!variant.weight) return variant.material;
  return { en: `${variant.material.en} · ${variant.weight.en}`, tr: `${variant.material.tr} · ${variant.weight.tr}` };
}

// Product page photos for one variant (led by its photo of the picked part, if it has one), in order, without repeats.
export function shotsFor(product, variant, partId = null) {
  const lead = (partId && variant.partShots?.[partId]) || variant.image;
  return [...new Set([lead, variant.image, ...(variant.gallery || []), ...product.gallery])];
}
