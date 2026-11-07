import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(min-width: 968px) and (prefers-reduced-motion: no-preference)', () => {
      // Stellar's root Lenis configuration. Interpolate the page itself so
      // foreground content and scrubbed backgrounds share one scroll position.
      const lenis = new Lenis({
        autoRaf: false,
        duration: 0.85,
        lerp: .085,
        wheelMultiplier: .72,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
      });
      const syncLock = () => {
        const locked = document.body.classList.contains('scroll-locked') ||
          document.documentElement.classList.contains('preloader-active');
        if (locked && !lenis.isStopped) lenis.stop();
        if (!locked && lenis.isStopped) lenis.start();
      };
      const observer = new MutationObserver(syncLock);
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      syncLock();

      const onScroll = () => ScrollTrigger.update();
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      lenis.on('scroll', onScroll);
      // Advance scroll before GSAP renders, avoiding a one-frame phase mismatch.
      gsap.ticker.add(tick, false, true);
      gsap.ticker.lagSmoothing(0);

      return () => {
        observer.disconnect();
        gsap.ticker.remove(tick);
        lenis.off('scroll', onScroll);
        lenis.destroy();
      };
    });
    return () => media.revert();
  }, []);

  return null;
}
