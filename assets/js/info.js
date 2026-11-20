import { boot, $, $$, reduced } from './core.js';
import { money } from './i18n.js';
import { CONFIG } from './config.js';

const { gsap, ScrollTrigger } = window;

$$('[data-free]').forEach((el) => { el.textContent = money(CONFIG.freeShipping); });
$('[data-contact]').innerHTML = [
  ...CONFIG.instagram.map((i) => `<li><a href="${i.url}" target="_blank" rel="noopener"><strong>Instagram</strong> ${i.handle}</a></li>`),
  CONFIG.email ? `<li><a href="mailto:${CONFIG.email}"><strong>Email</strong> ${CONFIG.email}</a></li>` : '',
  CONFIG.phone ? `<li><a href="tel:${CONFIG.phone.tel}"><strong>Tel</strong> ${CONFIG.phone.label}</a></li>` : '',
].join('');

await boot();

const links = $$('.info__nav a');
$$('.info__sec').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 40%', end: 'bottom 40%',
    onToggle: (self) => self.isActive && links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${sec.id}`)),
  });
  if (!reduced) gsap.from(sec.children, { y: 40, opacity: 0, duration: 1, ease: 'jig', stagger: 0.08, scrollTrigger: { trigger: sec, start: 'top 85%', toggleActions: 'play none none none' } });
});
ScrollTrigger.refresh();
