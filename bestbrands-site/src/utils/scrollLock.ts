/**
 * Scroll Lock Utility - DOM üzerinden scroll kilidi.
 * SmoothScroll bu sınıfı izleyerek Lenis hareketini de durdurur/devam ettirir.
 * Stellar Management referans mimarisine uygun olarak:
 * - Sayfa scrollbar genişliği ölçülür ve --scrollbar-width CSS değişkenine atanır.
 * - body öğesine .scroll-locked sınıfı eklenerek arka plan scroll'u kilitlenir.
 * - Header ve sayfa içeriğinin scrollbar kalkması sebebiyle yatay sıçraması (jitter) 0px'e indirilir.
 */

let lockCount = 0;
let cachedScrollbarWidth = 0;

export function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  if (cachedScrollbarWidth > 0) return cachedScrollbarWidth;
  cachedScrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  return cachedScrollbarWidth;
}

export function lockScroll(): void {
  if (typeof window === 'undefined') return;
  if (lockCount === 0) {
    const sbWidth = getScrollbarWidth();
    document.documentElement.style.setProperty('--scrollbar-width', `${sbWidth}px`);
    document.body.classList.add('scroll-locked');
  }
  lockCount++;
}

export function unlockScroll(): void {
  if (typeof window === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-width');
  }
}

export function resetScrollLock(): void {
  if (typeof window === 'undefined') return;
  lockCount = 0;
  document.body.classList.remove('scroll-locked');
  document.documentElement.style.removeProperty('--scrollbar-width');
}
