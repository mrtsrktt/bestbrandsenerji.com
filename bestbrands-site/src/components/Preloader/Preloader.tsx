import React, { useState, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import styles from './Preloader.module.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
  if (!CustomEase.get('myEase')) {
    CustomEase.create('myEase', '0.28, 0.11, 0.32, 1');
  }
}

interface PreloaderProps {
  onReveal?: () => void;
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onReveal, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Logo Parça Referansları
  const typoSubRef = useRef<SVGImageElement>(null);
  const typoBrandsRef = useRef<SVGImageElement>(null);
  const typoBestRef = useRef<SVGImageElement>(null);
  const emblemRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    // Başlangıç scroll kilidi
    document.documentElement.classList.add('preloader-active');
    document.body.classList.add('scroll-locked');
    window.scrollTo(0, 0);

    let tl: gsap.core.Timeline | null = null;

    document.fonts.ready.catch(() => {}).then(() => {
      tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove('preloader-active');
          document.body.classList.remove('scroll-locked');
          setIsVisible(false);
          onComplete?.();
        },
      });

      // 1. Başlangıç: Tüm logo öğeleri kristal netliğinde görünür
      tl.set(containerRef.current, { autoAlpha: 1 });

      // 2. Faz 1: Tipografi Satırlarının Maske İçinden Aşağı Kayarak Ayrılması (Stagger)
      // İlk 0.35s logonun bütünlüğü izleyici tarafından algılanır
      tl.to(typoSubRef.current, {
        y: 60,
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.in',
        delay: 0.35,
      })
      .to(typoBrandsRef.current, {
        y: 80,
        autoAlpha: 0,
        duration: 0.42,
        ease: 'power2.in',
      }, '-=0.18')
      .to(typoBestRef.current, {
        y: 90,
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.in',
      }, '-=0.22')

      // 3. Faz 2: Kalan Enerji Ambleminin Merkeze Kusursuz Akışı (Stellar 1:1 Geometrik Hiza)
      // viewBox 600px genişlikte: Amblem merkezi 471.5px -> Hedef 300px (Delta: -171.5px)
      .to(emblemRef.current, {
        x: -171.5,
        duration: 0.6,
        ease: 'myEase',
      }, '-=0.15')

      // 4. Faz 3: Amblem merkezde hafifçe büyür ve yumuşakça kaybolur.
      .to(emblemRef.current, {
        scale: 1.08,
        transformOrigin: '471.5px 150px',
        duration: 0.4,
        ease: 'power1.out',
      }, '+=0.04')
      .to(emblemRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power1.inOut',
      }, '+=0.02')

      // 5. Faz 4: Yeşil perde yukarı kayarak hero alanını açar.
      .to(curtainRef.current, {
        yPercent: -100,
        duration: 1.0,
        ease: 'myEase',
      }, '-=0.12')

      // Hero, perde kalkmaya başladığı anda oynatılır.
      .addLabel('reveal', '<')
      .to(backdropRef.current, {
        autoAlpha: 0,
        duration: 0.8,
        ease: 'myEase',
      }, '<')
      .call(() => {
        onReveal?.();
      }, undefined, 'reveal');
    });

    return () => {
      if (tl) {
        tl.kill();
      }
      document.documentElement.classList.remove('preloader-active');
      document.body.classList.remove('scroll-locked');
    };
  }, [onReveal, onComplete]);

  if (!isVisible) return null;

  return (
    <div ref={containerRef} className={styles.preloader} aria-label="Best Brands Yükleniyor">
      {/* 1. Logo Kapsayıcısı ve SVG Maske Katmanı */}
      <div className={styles.logoWrapper}>
        <svg
          className={styles.logoSvg}
          viewBox="0 0 600 299"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tipografiyi alt sınırdan ve sağdan temizce kırpan taşma maskesi */}
            <clipPath id="typo-overflow-clip">
              <rect x="0" y="0" width="365" height="299" />
            </clipPath>
          </defs>

          {/* Tipografi Grubu (Maske İçerisinde) */}
          <g clipPath="url(#typo-overflow-clip)">
            {/* Satır 1: BEST */}
            <image
              ref={typoBestRef}
              href="/assets/logo-best.png"
              width="600"
              height="299"
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Satır 2: BRANDS */}
            <image
              ref={typoBrandsRef}
              href="/assets/logo-brands.png"
              width="600"
              height="299"
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Satır 3: GRUP ENERJİ YATIRIMLARI */}
            <image
              ref={typoSubRef}
              href="/assets/logo-sub.png"
              width="600"
              height="299"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          {/* Enerji Amblemi Grubu (Maske Dışında, Merkeze Akacak Öğeler) */}
          <g ref={emblemRef}>
            <image
              href="/assets/logo-emblem.png"
              width="600"
              height="299"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </svg>
      </div>

      {/* Marka yeşili intro zemini */}
      <div ref={curtainRef} className={styles.preloaderCurtain} />

      {/* Perde kalkarken hero ile yeşil zemin arasındaki yumuşak geçiş */}
      <div ref={backdropRef} className={styles.preloaderBackdrop} />
    </div>
  );
};
