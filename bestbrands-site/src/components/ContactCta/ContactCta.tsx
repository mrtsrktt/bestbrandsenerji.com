import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { siteConfig } from '../../config/siteConfig';
import styles from './ContactCta.module.css';

gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);
CustomEase.create('contactEase', '.28,.11,.32,1');

export function ContactCta() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    let disposed = false;
    document.fonts.ready.then(() => {
      if (disposed) return;
      media.add('(min-width: 968px) and (prefers-reduced-motion: no-preference)', () => {
      const section = sectionRef.current;
      if (!section) return;
      gsap.fromTo(section.querySelector('img'), { yPercent: -50, willChange: 'transform', force3D: true }, {
        yPercent: 50,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
      const title = section.querySelector('h2')!;
      const description = section.querySelector('[data-contact-description]')!;
      const titleSplit = SplitText.create(title, {
        type: 'lines,chars', mask: 'lines', autoSplit: true, linesClass: styles.titleLine,
        onSplit(split) {
          const timeline = gsap.timeline({ scrollTrigger: { trigger: title, start: 'top 75%', end: 'bottom 87%' } });
          timeline.from(split.lines, {
            yPercent: 100, autoAlpha: 0, duration: 1.2, stagger: .1, ease: 'contactEase',
          });
          timeline.from(split.chars.filter(char => char.closest('em')), {
            yPercent: 40, autoAlpha: 0, filter: 'blur(2px)', duration: 1.2, stagger: .1, ease: 'contactEase',
          }, 0);
          return timeline;
        },
      });
      const descriptionSplit = SplitText.create(description, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(split) {
          return gsap.from(split.lines, {
            yPercent: 120, duration: 1.2, stagger: .13, ease: 'contactEase',
            scrollTrigger: { trigger: description, start: 'top 87%', end: 'bottom 87%' },
          });
        },
      });
      ScrollTrigger.refresh();
      return () => {
        titleSplit.revert();
        descriptionSplit.revert();
      };
      }, sectionRef);
      });
    return () => {
      disposed = true;
      media.revert();
    };
  }, []);

  return (
    <section id="iletisim" ref={sectionRef} className={styles.section} data-header-theme="dark" aria-labelledby="contact-title">
      <div className={styles.imageLayer} aria-hidden="true">
        <img className={styles.image} src="/assets/bestbrands-contact-solar-canopy.webp" alt="" width="1672" height="941" loading="lazy" decoding="async" />
      </div>
      <div className={styles.content}>
        <h2 id="contact-title" className={styles.title}>
          Geleceği birlikte<br />{' '}<em>şekillendirelim.</em>
        </h2>
        <div className={styles.descriptionMask}>
          <p className={styles.description} data-contact-description>Enerji yatırımları ve yeni iş birlikleri için ekibimizle iletişime geçin.</p>
        </div>
        <a className={styles.button} href={`${siteConfig.officialSiteUrl}/iletisim/`}>İletişime Geçin</a>
      </div>
    </section>
  );
}
