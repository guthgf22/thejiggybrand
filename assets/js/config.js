// Brand-level settings. Edit prices in products.js, everything else here.
export const CONFIG = {
  brand: 'JIGGY',
  instagram: [
    { handle: '@thejiggybrand', url: 'https://www.instagram.com/thejiggybrand/' },
    { handle: '@cheekyjiggy', url: 'https://www.instagram.com/cheekyjiggy/' },
  ],
  // Shown in the footer and the contact section only when filled in.
  email: 'brandjiggy@gmail.com',
  phone: { label: '0539 565 16 16', tel: '+905395651616' },
  ageGate: 21,
  // Language decides currency: en → USD, tr → TRY.
  currency: { en: 'USD', tr: 'TRY' },
  freeShipping: { usd: 100, try: 3000 },
  shipping: {
    standard: { usd: 6, try: 150 },
    express: { usd: 14, try: 300 },
  },
  // E-mail sign-ups (newsletter, "notify me"). Paste a Formspree form URL here,
  // e.g. 'https://formspree.io/f/abcd1234'. Empty = the forms show an Instagram link instead.
  forms: {
    endpoint: '',
  },
  checkout: {
    // 'demo'     → shows a confirmation screen, nothing is charged (for testing).
    // 'whatsapp' → opens WhatsApp with the full order for the number below.
    // 'iyzico'   → card payment on iyzico's page. It runs on payHost only (the address iyzico approved, where the
    //              keys are set); the other copies of the site send the customer there with the bag.
    // checkout.html?odeme=test turns iyzico on for that visit while the mode is still 'demo'.
    mode: 'iyzico',
    whatsapp: '', // international format without +, e.g. '905551112233'
    payHost: 'https://thejiggybrand.com',
  },
};
