import { createWorld } from './world.js';

const menuToggle = document.querySelector('.menu-toggle');
document.querySelectorAll('[data-investor]').forEach(link=>{link.href='https://bestbrandsenerji.com/finansal-ve-operasyonel-veriler/';});
document.querySelectorAll('a[href="https://bestbrandsenerji.com/iletisim/"]').forEach(link=>{link.href='https://bestbrandsenerji.com/hakkimizda/iletisim/';});
const mobileMenu = document.querySelector('.mobile-menu');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  mobileMenu.classList.toggle('open', open);
  mobileMenu.inert = !open;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { menuToggle.click(); menuToggle.focus(); }
});

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wrap = document.querySelector('#scene-wrap');
const chapters = [...document.querySelectorAll('.chapter')];
const pauseButton = document.querySelector('#pause');
const captions = ['Doğadan gelen güç, geleceğe dönüşüyor.', 'Hassasiyetle ölçüyor, güvenle ilerliyoruz.', 'Aynı vizyonla, daha güçlü yarınlara.'];
let paused = reduceMotion.matches || new URLSearchParams(location.search).get('still') === '1';
let currentChapter = -1;
function updateChapter(index, progress) {
  if (index !== currentChapter) {
    currentChapter = index;
    document.querySelector('#scene-caption-text').textContent = captions[index];
    chapters.forEach((chapter, i) => {
      chapter.classList.toggle('active', index === i);
      chapter.setAttribute('aria-pressed', String(index === i));
    });
  }
  chapters.forEach((chapter,i)=>{chapter.querySelector('.chapter-track > span').style.width = `${i < index ? 100 : i === index ? progress * 100 : 0}%`;});
}
function updatePause() {
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.setAttribute('aria-label', paused ? 'Animasyonu oynat' : 'Animasyonu duraklat');
  pauseButton.innerHTML = paused ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 9 6-9 6Z" /></svg>' : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>';
}
try {
  const world = createWorld(document.querySelector('#world'), { reducedMotion: reduceMotion.matches, onProgress: updateChapter });
  wrap.classList.add('ready');
  world.setPaused(paused);
  chapters.forEach((chapter, index) => chapter.addEventListener('click', () => world.seekChapter(index)));
  pauseButton.addEventListener('click', () => { paused = !paused; world.setPaused(paused); updatePause(); });
  document.querySelector('#replay').addEventListener('click', () => { world.seekChapter(0); paused = false; world.setPaused(false); updatePause(); });
  reduceMotion.addEventListener('change', event => { paused = event.matches; world.setPaused(paused); updatePause(); });
  updatePause();
  // Exposed for deterministic visual review, without an extra user-facing control.
  window.heroReview = { seek: world.seek, chapter: world.seekChapter, pause: () => { paused = true; world.setPaused(true); updatePause(); } };
} catch (error) {
  console.error('3D scene unavailable:', error);
  wrap.classList.add('failed');
  document.querySelector('.playback').hidden = true;
  chapters.forEach((chapter, index) => chapter.addEventListener('click', () => updateChapter(index, 1)));
  updateChapter(0, 1);
}
