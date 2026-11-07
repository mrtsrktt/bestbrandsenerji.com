import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import styles from './MegaMenu.module.css';
import type { MenuPanelId } from '../../types/navigation';
import { corporateData, investmentsData, investorRelationsData } from '../../data/navigationData';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

// GSAP CustomEase Kaydı - Stellar Management 1:1 Luxury Easing (0.28, 0.11, 0.32, 1)
gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create('myEase', '0.28, 0.11, 0.32, 1');

// Görsel kart geçişlerinde lüks galeri hissiyatı için yumuşak fiziksel ofset (50px)
const CARD_ENTRY_PHYSICAL_PX = 50;

interface MegaMenuProps {
  activePanel: MenuPanelId | null;
  onClose: () => void;
  headerBgRef?: React.RefObject<HTMLDivElement | null>;
}

interface SubMenuConfig {
  menuRef: React.RefObject<HTMLDivElement | null>;
  tl: gsap.core.Timeline | null;
  init: () => gsap.core.Timeline;
  exit?: () => gsap.core.Tween;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  activePanel,
  onClose,
  headerBgRef,
}) => {
  // DOM Referansları
  const rootRef = useRef<HTMLDivElement>(null);
  const modalBgRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const heightContainerRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);

  // 3 Ayrı Panel DOM Referansı (Kalıcı Mounted)
  const kurumsalRef = useRef<HTMLDivElement>(null);
  const yatirimlarimizRef = useRef<HTMLDivElement>(null);
  const yatirimciRef = useRef<HTMLDivElement>(null);

  // Durum ve Zaman Çizelgesi Referansları
  const [isOpenState, setIsOpenState] = useState(false);
  const isOpenRef = useRef<boolean>(false);
  const isClosingRef = useRef<boolean>(false);
  const currentSubMenuRef = useRef<MenuPanelId | null>(null);
  const activeSubTlRef = useRef<gsap.core.Timeline | null>(null);
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const subMenusRef = useRef<Record<MenuPanelId, SubMenuConfig> | null>(null);
  const splitTextInstancesRef = useRef<SplitText[]>([]);
  const resizeTimerRef = useRef<number | null>(null);

  // Kapsayıcı Yükseklik Güncellemesi (Stellar A(N) fonksiyonu 1:1)
  const updateContainerHeight = useCallback((targetEl: HTMLElement | null, animate = true) => {
    const container = heightContainerRef.current;
    if (!container || !targetEl) return;

    const prevH = container.style.height;
    container.style.height = 'auto';
    const targetH = targetEl.scrollHeight;
    container.style.height = prevH;

    gsap.killTweensOf(container);

    if (animate) {
      gsap.to(container, {
        height: targetH,
        duration: 0.8,
        ease: 'myEase',
        overwrite: 'auto',
      });
    } else {
      gsap.set(container, {
        height: targetH,
      });
    }
  }, []);

  // -------------------------------------------------------------
  // GSAP MASTER TIMELINE VE SUB-MENU YAPILANDIRMASI
  // -------------------------------------------------------------
  useLayoutEffect(() => {
    if (!surfaceRef.current || !modalBgRef.current) return;

    // Master Timeline (b) - Stellar Management 1:1 Katı Perde & Backdrop Mimarisi
    const b = gsap.timeline({
      ease: 'myEase',
      paused: true,
      onStart: () => {
        setIsOpenState(true);
      },
    });

    b.fromTo(modalBgRef.current, {
      autoAlpha: 0,
    }, {
      autoAlpha: 1,
      duration: 1.2,
      ease: 'linear',
    })
    .fromTo(surfaceRef.current, {
      yPercent: -100,
    }, {
      yPercent: 0,
      duration: 1.2,
      ease: 'myEase',
    }, '<')
    .fromTo(socialsRef.current, {
      autoAlpha: 0,
      filter: 'blur(5px)',
    }, {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: 0.6,
      ease: 'myEase',
    }, '<70%')
    .fromTo(contactRef.current, {
      autoAlpha: 0,
      x: 30,
    }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.8,
      ease: 'myEase',
    }, '<40%');

    // Başlangıçta progress 0'a çekilir
    b.reverse();
    masterTimelineRef.current = b;
    if (typeof window !== 'undefined') {
      (window as any).__masterTimeline = b;
    }

    // Sub-Menu Tanımları (S)
    const subMenus: Record<MenuPanelId, SubMenuConfig> = {
      kurumsal: {
        menuRef: kurumsalRef,
        tl: null,
        init: () => {
          const N = gsap.timeline({ paused: true });
          const targets = kurumsalRef.current?.querySelectorAll(`.${styles.titleLink}`);
          if (targets && targets.length > 0) {
            const st = new SplitText(targets, { type: 'lines', mask: 'lines', aria: 'none' });
            splitTextInstancesRef.current.push(st);
            return N.set(kurumsalRef.current, { autoAlpha: 1 })
                    .fromTo(st.lines,
                      { yPercent: 120, autoAlpha: 0 },
                      { duration: 0.8, yPercent: 0, autoAlpha: 1, ease: 'myEase', stagger: 0.1 }
                    );
          }
          if (kurumsalRef.current) {
            return N.set(kurumsalRef.current, { autoAlpha: 1 });
          }
          return N;
        },
      },
      yatirimlarimiz: {
        menuRef: yatirimlarimizRef,
        tl: null,
        init: () => {
          const N = gsap.timeline({ paused: true });
          const cards = yatirimlarimizRef.current?.querySelectorAll(
            `.${styles.investmentVisualCard}, .${styles.allInvestmentsLink}`
          );
          if (cards && cards.length > 0) {
            return N.set(yatirimlarimizRef.current, { autoAlpha: 1 })
                    .fromTo(cards,
                      { x: CARD_ENTRY_PHYSICAL_PX, autoAlpha: 0 },
                      { x: 0, autoAlpha: 1, ease: 'myEase', duration: 0.8, stagger: 0.05 }
                    );
          }
          if (yatirimlarimizRef.current) {
            return N.set(yatirimlarimizRef.current, { autoAlpha: 1 });
          }
          return N;
        },
        exit: () => gsap.to(yatirimlarimizRef.current, {
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power2.out',
        }),
      },
      'yatirimci-iliskileri': {
        menuRef: yatirimciRef,
        tl: null,
        init: () => {
          const N = gsap.timeline({ paused: true });
          const targets = yatirimciRef.current?.querySelectorAll(
            `.${styles.investorLinkLabel}, .${styles.investorColHeader}`
          );
          if (targets && targets.length > 0) {
            const st = new SplitText(targets, { type: 'lines', mask: 'lines', aria: 'none' });
            splitTextInstancesRef.current.push(st);
            return N.set(yatirimciRef.current, { autoAlpha: 1 })
                    .fromTo(st.lines,
                      { yPercent: 120, autoAlpha: 0 },
                      { duration: 0.8, yPercent: 0, autoAlpha: 1, ease: 'myEase', stagger: 0.06 }
                    );
          }
          if (yatirimciRef.current) {
            return N.set(yatirimciRef.current, { autoAlpha: 1 });
          }
          return N;
        },
      },
    };

    subMenusRef.current = subMenus;

    // Fontlar yüklendiğinde yükseklik ölçümünü tazele
    document.fonts.ready.then(() => {
      if (isOpenRef.current && currentSubMenuRef.current && subMenusRef.current) {
        const activeSub = subMenusRef.current[currentSubMenuRef.current];
        if (activeSub?.menuRef.current) {
          updateContainerHeight(activeSub.menuRef.current, false);
        }
      }
    });

    return () => {
      if (b) {
        b.kill();
      }
      Object.values(subMenus).forEach((sub) => {
        if (sub.tl) {
          sub.tl.kill();
        }
      });
      splitTextInstancesRef.current.forEach((st) => {
        try {
          st.revert();
        } catch {
          // ignore
        }
      });
      splitTextInstancesRef.current = [];
    };
  }, [updateContainerHeight]);

  // -------------------------------------------------------------
  // REZİZE DİNLEYİCİSİ (Açıkken resize olduğunda Stellar O() tetikler)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (!isOpenRef.current || !currentSubMenuRef.current) return;
      onClose();
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(() => {
        if (currentSubMenuRef.current && subMenusRef.current) {
          const sub = subMenusRef.current[currentSubMenuRef.current];
          if (sub?.menuRef.current) {
            updateContainerHeight(sub.menuRef.current, false);
          }
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
    };
  }, [onClose, updateContainerHeight]);

  // -------------------------------------------------------------
  // MENÜ AÇMA / DEĞİŞTİRME / KAPAMA İŞLEMLERİ (Stellar T(N) & O())
  // -------------------------------------------------------------
  const openSubMenu = useCallback((panelId: MenuPanelId) => {
    const b = masterTimelineRef.current;
    const subMenus = subMenusRef.current;
    if (!b || !subMenus) return;

    const R = subMenus[panelId];
    if (!R || !R.menuRef.current) return;

    // Önceki kapanış callback'ini iptal et (interruption anında temizleme engeli)
    b.eventCallback('onReverseComplete', null);

    const isRecoveringFromClose = !isOpenRef.current || isClosingRef.current || b.reversed();

    if (isRecoveringFromClose) {
      // ---------------------------------------------------------
      // FRESH OPEN / REOPEN (İlk Açılış veya Kapanırken Hızlı Yeniden Açılış)
      // ---------------------------------------------------------
      isClosingRef.current = false;
      isOpenRef.current = true;
      setIsOpenState(true);

      // Hedef panel haricindeki tüm panellerin tween'lerini durdur ve gizle
      Object.entries(subMenus).forEach(([key, sub]) => {
        if (sub.menuRef.current) {
          gsap.killTweensOf(sub.menuRef.current);
          if (key !== panelId) {
            gsap.set(sub.menuRef.current, { autoAlpha: 0 });
          }
        }
        if (key !== panelId && sub.tl) {
          sub.tl.pause().progress(0);
        }
      });

      // Hedef paneli anında görünür kıl
      gsap.killTweensOf(R.menuRef.current);
      gsap.set(R.menuRef.current, { autoAlpha: 1 });

      // 1. Dinamik yükseklik: 10ms sonra 0'dan hedef yüksekliğe 0.8s myEase ile açılır
      setTimeout(() => {
        if (R.menuRef.current) {
          updateContainerHeight(R.menuRef.current, true);
        }
      }, 10);

      // 2. Ana panel timeline'ını 1x hızla ileri oynat (1.2s)
      b.timeScale(1).play();

      // 3. Scroll'u kilitle (header ve sayfa sıçraması 0px)
      lockScroll();

      // 4. Alt menü timeline'ını oluştur ve 0.3s gecikmeyle başlat (SplitText satır maskeleri)
      if (!R.tl) {
        R.tl = R.init();
      }
      currentSubMenuRef.current = panelId;
      activeSubTlRef.current = R.tl;
      R.tl.timeScale(1).play(0).delay(0.3);
      return;
    }

    // ---------------------------------------------------------
    // TAB SWITCH (Açıkken Menü Değişimi - Stellar T(N) 1:1)
    // ---------------------------------------------------------
    if (currentSubMenuRef.current !== panelId) {
      const prevPanelId = currentSubMenuRef.current;
      const prevSub = prevPanelId ? subMenus[prevPanelId] : null;
      const prevTl = activeSubTlRef.current;

      // 1. Önceki alt menü timeline'ını durdur ve sıfırla
      if (prevTl) {
        prevTl.pause().progress(0);
      }
      if (prevSub?.menuRef.current) {
        gsap.killTweensOf(prevSub.menuRef.current);
        gsap.set(prevSub.menuRef.current, { autoAlpha: 0 });
      }

      // 2. Hedef paneli anında görünür kıl
      gsap.killTweensOf(R.menuRef.current);
      gsap.set(R.menuRef.current, { autoAlpha: 1 });

      // 3. Kapsayıcı yüksekliğini yeni menünün yüksekliğine yumuşakça taşı (0.8s myEase)
      updateContainerHeight(R.menuRef.current, true);

      // 4. Yeni alt menü timeline'ını başlat
      if (!R.tl) {
        R.tl = R.init();
      }
      currentSubMenuRef.current = panelId;
      activeSubTlRef.current = R.tl;
      R.tl.play(0);
    }
  }, [updateContainerHeight]);

  const closeMenu = useCallback(() => {
    const b = masterTimelineRef.current;
    const subMenus = subMenusRef.current;
    if (!b) return;

    // Kapanma sürecini anında işaretle
    isClosingRef.current = true;
    isOpenRef.current = false;

    const x = currentSubMenuRef.current;
    const currentSub = x && subMenus ? subMenus[x] : null;
    const k = activeSubTlRef.current;

    // 1. Alt menü çıkışı: Yatırımlarımız exit() ile solar, diğerleri double-speed reverse
    if (currentSub?.exit) {
      if (k) {
        k.pause().progress(0);
      }
      currentSub.exit();
    } else if (k) {
      k.timeScale(2).reverse();
    }

    // 2. Ana panel timeline'ını double-speed reverse et (1.2s / 2 = 0.6s)
    b.timeScale(2).reverse();

    // 3. Kapanış tamamlandığında DOM temizliği
    b.eventCallback('onReverseComplete', () => {
      if (!isOpenRef.current) {
        setIsOpenState(false);
        currentSubMenuRef.current = null;
        activeSubTlRef.current = null;
        isClosingRef.current = false;
        if (heightContainerRef.current) {
          gsap.set(heightContainerRef.current, { height: 0 });
        }
        if (subMenus) {
          Object.values(subMenus).forEach((sub) => {
            if (sub.menuRef.current) {
              gsap.killTweensOf(sub.menuRef.current);
              gsap.set(sub.menuRef.current, { autoAlpha: 0 });
            }
          });
        }
        unlockScroll();
      }
      b.eventCallback('onReverseComplete', null);
    });
  }, []);

  // -------------------------------------------------------------
  // PROPS TEPKİSİ: activePanel değişiminde open/switch/close
  // -------------------------------------------------------------
  useEffect(() => {
    if (activePanel) {
      openSubMenu(activePanel);
    } else if (isOpenRef.current || isClosingRef.current) {
      closeMenu();
    }
  }, [activePanel, openSubMenu, closeMenu]);

  // -------------------------------------------------------------
  // BACKDROP VE ETKİLEŞİM HANDLER'LARI
  // -------------------------------------------------------------
  const handleBackdropEnter = () => {
    if (isOpenRef.current || isClosingRef.current || isOpenState) {
      onClose();
    }
  };

  const handleBackdropClick = () => {
    if (isOpenRef.current || isClosingRef.current || isOpenState) {
      onClose();
    }
  };

  // -------------------------------------------------------------
  // PANEL İÇERİK RENDER YARDIMCISI (Bileşen ve Tasarım Bütünlüğü)
  // -------------------------------------------------------------
  const renderPanelMarkup = (panelId: MenuPanelId, isInteractive: boolean) => {
    if (panelId === 'kurumsal') {
      return (
        <nav className={styles.menuGrid}>
          <ul
            className={styles.corporateMenuColumn}
            data-nav="companyMenu"
          >
            {corporateData.links.map((link) => (
              <li key={link.id} className={styles.menuGridItem}>
                <a
                  href={link.url}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  className={styles.titleLink}
                  onClick={isInteractive ? onClose : (e) => e.preventDefault()}
                  tabIndex={isInteractive ? 0 : -1}
                  aria-hidden={!isInteractive}
                >
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      );
    }

    if (panelId === 'yatirimlarimiz') {
      return (
        <div>
          <div className={styles.investmentsGrid}>
            {investmentsData.cards.map((card) => (
              <a
                key={card.id}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.investmentVisualCard}
                onClick={isInteractive ? onClose : (e) => e.preventDefault()}
                tabIndex={isInteractive ? 0 : -1}
                aria-hidden={!isInteractive}
              >
                <div className={styles.cardImageContainer}>
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    className={styles.cardImage}
                    loading="lazy"
                  />
                  <div className={styles.cardBottomGradient} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardSubtitle}>{card.subtitle}</span>
                  <div className={styles.cardTitleRow}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <span className={styles.cardHoverArrow} aria-hidden="true">
                      →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Tüm Yatırımlarımız Sade Metin Bağlantısı */}
          <div className={styles.allInvestmentsRow}>
            <a
              href={investmentsData.allInvestmentsLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.allInvestmentsLink}
              onClick={isInteractive ? onClose : (e) => e.preventDefault()}
              tabIndex={isInteractive ? 0 : -1}
              aria-hidden={!isInteractive}
            >
              <span>{investmentsData.allInvestmentsLink.label}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      );
    }

    if (panelId === 'yatirimci-iliskileri') {
      return (
        <div>
          <div className={styles.investorColumnsGrid}>
            {investorRelationsData.columns.map((column) => (
              <div key={column.id} className={styles.investorColumn}>
                <h4 className={styles.investorColHeader}>{column.title}</h4>
                <div className={styles.investorLinkList}>
                  {column.links.map((link) => {
                    if (link.isDisabled) {
                      return (
                        <div
                          key={link.id}
                          className={styles.investorDisabledItem}
                          title={link.description || 'Yakında kullanıma açılacaktır'}
                          aria-disabled="true"
                        >
                          <span>{link.label}</span>
                          {link.badge && <span className={styles.badge}>{link.badge}</span>}
                        </div>
                      );
                    }

                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.investorLinkItem}
                        onClick={isInteractive ? onClose : (e) => e.preventDefault()}
                        tabIndex={isInteractive ? 0 : -1}
                        aria-hidden={!isInteractive}
                      >
                        <span className={styles.investorLinkLabel}>{link.label}</span>
                        <span className={styles.investorLinkArrow} aria-hidden="true">
                          →
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const isInteractive = Boolean(activePanel);

  return (
    <>
      {/* Stellar 1:1 Sabit Arka Plan Katmanı (.modal-bg) - Pointer girdiğinde kapatır */}
      <div
        ref={modalBgRef}
        className={styles.modalBg}
        onMouseEnter={handleBackdropEnter}
        onMouseOver={handleBackdropEnter}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div
        ref={rootRef}
        id="megamenu-root"
        role="region"
        aria-label="Açılır Menü İçeriği"
        aria-hidden={!isInteractive}
        inert={!isInteractive ? true : undefined}
        className={`${styles.menuRoot} ${isOpenState ? styles.isVisible : ''} ${isInteractive ? styles.isInteractive : ''}`}
      >
        {/* Kırpma Maskesi: Header arkasındaki taşmaları yukarıdan sınırlar */}
        <div className={styles.menuMask}>
          {/* Kesintisiz Tek Zemin Yüzeyi (#111814): Header arkasından yukarıdan aşağı kayan koyu zemin */}
          <div ref={surfaceRef} className={styles.menuWrapper}>
            {/* Header Arkası Zemin Boşluğu: Header navigation öğelerinin arkasını kaplar */}
            <div
              ref={headerBgRef}
              className={styles.surfaceHeaderBackdrop}
              aria-hidden="true"
            />

            {/* Dinamik Yükseklik Konteyneri: Menü değişimlerinde yüksekliği GSAP ile akıcı biçimde yönetir */}
            <div ref={heightContainerRef} className={styles.heightContainer}>
              <div className={styles.panelsContainer}>
                {/* Panel 1: Kurumsal */}
                <div
                  ref={kurumsalRef}
                  id="megamenu-panel-kurumsal"
                  className={styles.panelShell}
                  aria-hidden={activePanel !== 'kurumsal'}
                  inert={activePanel !== 'kurumsal' ? true : undefined}
                >
                  {renderPanelMarkup('kurumsal', activePanel === 'kurumsal')}
                </div>

                {/* Panel 2: Yatırımlarımız */}
                <div
                  ref={yatirimlarimizRef}
                  id="megamenu-panel-yatirimlarimiz"
                  className={styles.panelShell}
                  aria-hidden={activePanel !== 'yatirimlarimiz'}
                  inert={activePanel !== 'yatirimlarimiz' ? true : undefined}
                >
                  <div className={styles.innerWrap}>
                    {renderPanelMarkup('yatirimlarimiz', activePanel === 'yatirimlarimiz')}
                  </div>
                </div>

                {/* Panel 3: Yatırımcı İlişkileri */}
                <div
                  ref={yatirimciRef}
                  id="megamenu-panel-yatirimci-iliskileri"
                  className={styles.panelShell}
                  aria-hidden={activePanel !== 'yatirimci-iliskileri'}
                  inert={activePanel !== 'yatirimci-iliskileri' ? true : undefined}
                >
                  <div className={styles.innerWrap}>
                    {renderPanelMarkup('yatirimci-iliskileri', activePanel === 'yatirimci-iliskileri')}
                  </div>
                </div>
              </div>
            </div>

            {/* Stellar 1:1 Alt İletişim & Sosyal Medya Barı - Master Timeline (b)'ye bağlı */}
            <div className={styles.menuBottom}>
              <div className={styles.menuBottomInner}>
                <div ref={socialsRef} className={styles.socials}>
                  <a
                    href="https://www.instagram.com/bestbrandsenerji"
                    className={styles.socialItem}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram'da Best Brands Enerji"
                    tabIndex={isInteractive ? 0 : -1}
                    aria-hidden={!isInteractive}
                  >
                    <svg
                      preserveAspectRatio="none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.socialSvg}
                      aria-hidden="true"
                    >
                      <path d="M18.2905 6.56663C18.2743 5.87521 18.1448 5.19113 17.9072 4.54163C17.6974 3.9848 17.3674 3.48114 16.9405 3.06663C16.526 2.63976 16.0223 2.30968 15.4655 2.09996C14.816 1.86233 14.1319 1.73283 13.4405 1.71663C12.5572 1.66663 12.2738 1.66663 10.0072 1.66663C7.7405 1.66663 7.45716 1.66663 6.57383 1.71663C5.88241 1.73283 5.19833 1.86233 4.54883 2.09996C3.992 2.30968 3.48834 2.63976 3.07383 3.06663C2.64668 3.47927 2.31898 3.98366 2.11549 4.54163C1.87063 5.18941 1.73817 5.87425 1.72383 6.56663C1.67383 7.44996 1.67383 7.73329 1.67383 9.99996C1.67383 12.2666 1.67383 12.55 1.72383 13.4333C1.73817 14.1257 1.87063 14.8105 2.11549 15.4583C2.31898 16.0163 2.64668 16.5206 3.07383 16.9333C3.48834 17.3602 3.992 17.6902 4.54883 17.9C5.19833 18.1376 5.88241 18.2671 6.57383 18.2833C7.45716 18.3333 7.7405 18.3333 10.0072 18.3333C12.2738 18.3333 12.5572 18.3333 13.4405 18.2833C14.1319 18.2671 14.816 18.1376 15.4655 17.9C16.0184 17.6825 16.5205 17.3535 16.9406 16.9334C17.3607 16.5133 17.6897 16.0112 17.9072 15.4583C18.1448 14.8088 18.2743 14.1247 18.2905 13.4333C18.2905 12.55 18.3405 12.2666 18.3405 9.99996C18.3405 7.73329 18.3405 7.44996 18.2905 6.56663ZM16.7905 13.3333C16.7844 13.8623 16.6886 14.3864 16.5072 14.8833C16.3677 15.2427 16.1549 15.5691 15.8823 15.8418C15.6097 16.1144 15.2833 16.3272 14.9238 16.4666C14.4269 16.6481 13.9028 16.7439 13.3738 16.75C12.5405 16.7916 12.2322 16.8 10.0405 16.8C7.84883 16.8 7.5405 16.8 6.70716 16.75C6.15777 16.7623 5.6105 16.6777 5.0905 16.5C4.73107 16.3605 4.40465 16.1477 4.13204 15.8751C3.85943 15.6025 3.64661 15.2761 3.50716 14.9166C3.32195 14.4092 3.22609 13.8735 3.22383 13.3333C3.22383 12.5 3.17383 12.1916 3.17383 9.99996C3.17383 7.80829 3.17383 7.49996 3.22383 6.66663C3.22609 6.12644 3.32195 5.59074 3.50716 5.08329C3.64661 4.72387 3.85943 4.39745 4.13204 4.12484C4.40465 3.85223 4.73107 3.63941 5.0905 3.49996C5.59794 3.31475 6.13365 3.21889 6.67383 3.21663C7.50716 3.21663 7.8155 3.16663 10.0072 3.16663C12.1988 3.16663 12.5072 3.16663 13.3405 3.21663C13.8695 3.22269 14.3936 3.3185 14.8905 3.49996C15.2499 3.63941 15.5763 3.85223 15.849 4.12484C16.1216 4.39745 16.3344 4.72387 16.4738 5.08329C16.6704 5.58871 16.7776 6.12448 16.7905 6.66663C16.8322 7.49996 16.8405 7.80829 16.8405 9.99996C16.8405 12.1916 16.8322 12.5 16.7905 13.3333Z" fill="currentColor"></path>
                      <path d="M10.006 5.71619C9.15883 5.71619 8.33069 5.9674 7.6263 6.43806C6.92191 6.90872 6.3729 7.57768 6.04871 8.36036C5.72451 9.14304 5.63969 10.0043 5.80496 10.8352C5.97023 11.666 6.37818 12.4293 6.97722 13.0283C7.57625 13.6273 8.33947 14.0353 9.17035 14.2006C10.0012 14.3658 10.8625 14.281 11.6452 13.9568C12.4278 13.6326 13.0968 13.0836 13.5675 12.3792C14.0381 11.6748 14.2893 10.8467 14.2893 9.99952C14.2893 8.86351 13.838 7.77403 13.0348 6.97075C12.2315 6.16746 11.142 5.71619 10.006 5.71619ZM10.006 12.7745C9.45715 12.7745 8.92063 12.6118 8.46428 12.3068C8.00794 12.0019 7.65226 11.5685 7.44223 11.0615C7.23219 10.5544 7.17724 9.99644 7.28431 9.45814C7.39139 8.91985 7.65568 8.42539 8.04377 8.0373C8.43186 7.64921 8.92632 7.38491 9.46462 7.27784C10.0029 7.17077 10.5609 7.22572 11.0679 7.43575C11.575 7.64579 12.0084 8.00147 12.3133 8.45781C12.6182 8.91416 12.781 9.45068 12.781 9.99952C12.781 10.3639 12.7092 10.7248 12.5698 11.0615C12.4303 11.3981 12.2259 11.7041 11.9682 11.9617C11.7105 12.2194 11.4046 12.4238 11.0679 12.5633C10.7313 12.7027 10.3704 12.7745 10.006 12.7745Z" fill="currentColor"></path>
                      <path d="M14.457 4.55078C14.2593 4.55078 14.0659 4.60943 13.9015 4.71931C13.737 4.82919 13.6088 4.98537 13.5332 5.1681C13.4575 5.35082 13.4377 5.55189 13.4762 5.74587C13.5148 5.93985 13.6101 6.11804 13.7499 6.25789C13.8898 6.39774 14.068 6.49298 14.2619 6.53157C14.4559 6.57015 14.657 6.55035 14.8397 6.47466C15.0224 6.39897 15.1786 6.2708 15.2885 6.10635C15.3984 5.9419 15.457 5.74856 15.457 5.55078C15.457 5.28556 15.3517 5.03121 15.1641 4.84367C14.9766 4.65614 14.7222 4.55078 14.457 4.55078Z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/best-brands-enerji"
                    className={styles.socialItem}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn'de Best Brands Enerji"
                    tabIndex={isInteractive ? 0 : -1}
                    aria-hidden={!isInteractive}
                  >
                    <svg
                      preserveAspectRatio="none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.socialSvg}
                      aria-hidden="true"
                    >
                      <path d="M17.417 17.4171H14.3053V12.5446C14.3053 11.3829 14.282 9.88791 12.6853 9.88791C11.0645 9.88791 10.817 11.1521 10.817 12.4587V17.4171H7.70784V7.3979H10.6945V8.76374H10.7345C11.0338 8.25273 11.466 7.8324 11.9852 7.54743C12.5043 7.26247 13.091 7.12354 13.6828 7.14541C16.8328 7.14541 17.4153 9.21874 17.4153 11.9171V17.4171H17.417ZM4.19701 6.02707C3.83977 6.02757 3.49042 5.9221 3.19315 5.72401C2.89587 5.52592 2.66402 5.24411 2.52693 4.91423C2.38984 4.58435 2.35368 4.22122 2.42301 3.87078C2.49233 3.52034 2.66404 3.19834 2.91641 2.9455C3.16878 2.69267 3.49046 2.52037 3.84077 2.45039C4.19108 2.38041 4.55428 2.41591 4.88441 2.55239C5.21455 2.68887 5.49678 2.92019 5.69542 3.21711C5.89406 3.51402 6.00017 3.86317 6.00034 4.2204C6.00067 4.45747 5.95427 4.69228 5.8638 4.9114C5.77333 5.13053 5.64057 5.32968 5.47309 5.49747C5.30561 5.66525 5.10671 5.79839 4.88775 5.88926C4.66879 5.98013 4.43407 6.02696 4.19701 6.02707ZM5.75534 17.4171H2.63784V7.3979H5.75534V17.4171Z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/bestbrandsenerji"
                    className={styles.socialItem}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook'ta Best Brands Enerji"
                    tabIndex={isInteractive ? 0 : -1}
                    aria-hidden={!isInteractive}
                  >
                    <svg
                      preserveAspectRatio="none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.socialSvg}
                      aria-hidden="true"
                    >
                      <path d="M8.19721 18.3333V11H5.56055V7.99996H8.19721V5.70746C8.19721 3.10496 9.74805 1.66663 12.1205 1.66663C12.8994 1.67742 13.6765 1.7451 14.4455 1.86913V4.42579H13.1364C12.9132 4.39585 12.6861 4.41656 12.4719 4.48639C12.2578 4.55621 12.0621 4.67336 11.8995 4.82914C11.7368 4.98492 11.6113 5.17533 11.5323 5.38624C11.4533 5.59715 11.4228 5.82315 11.443 6.04746V7.99996H14.3239L13.8639 11H11.4472V18.3333H8.19721Z" fill="currentColor"></path>
                    </svg>
                  </a>
                  <a
                    href="https://x.com/bestbrandsenerji"
                    className={styles.socialItem}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X'te Best Brands Enerji"
                    tabIndex={isInteractive ? 0 : -1}
                    aria-hidden={!isInteractive}
                  >
                    <svg
                      preserveAspectRatio="none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.socialSvg}
                      aria-hidden="true"
                    >
                      <path d="M11.425 8.82236L17.0083 2.33069H15.6833L10.8333 7.96402L6.95833 2.33069H2.5L8.35833 10.8557L2.5 17.664H3.825L8.94167 11.714L13.0333 17.664H17.5L11.425 8.82236ZM9.61667 10.9307L9.025 10.0807L4.3 3.33069H6.33333L10.1417 8.78069L10.7333 9.63069L15.6833 16.714H13.65L9.60833 10.9307H9.61667Z" fill="currentColor"></path>
                    </svg>
                  </a>
                </div>

                <a
                  ref={contactRef}
                  href="https://bestbrandsenerji.com/hakkimizda/iletisim/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                  onClick={isInteractive ? onClose : (e) => e.preventDefault()}
                  tabIndex={isInteractive ? 0 : -1}
                  aria-hidden={!isInteractive}
                >
                  <span>İletişim</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
