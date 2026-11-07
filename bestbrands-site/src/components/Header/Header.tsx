import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Header.module.css';
import { headerNavItems } from '../../data/navigationData';
import type { MenuPanelId } from '../../types/navigation';
import { siteConfig } from '../../config/siteConfig';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { lockScroll, unlockScroll, resetScrollLock } from '../../utils/scrollLock';

export const Header: React.FC = () => {
  const [activePanel, setActivePanel] = useState<MenuPanelId | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOnLightSection, setIsOnLightSection] = useState(false);

  useEffect(() => {
    let frame: number | null = null;
    const update = () => {
      frame = null;
      setIsOnLightSection([...document.querySelectorAll('[data-header-theme="dark"]')].some(section => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= 50 && bounds.bottom > 50;
      }));
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const useDarkNavigation = isOnLightSection && !activePanel && !isMobileOpen;

  const headerRef = useRef<HTMLElement>(null);
  const headerBgRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  const activePanelRef = useRef<MenuPanelId | null>(null);
  const preventOpenOnFocusRef = useRef<boolean>(false);
  const hoverIntentTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  // Unmount sırasında scroll kilidini ve hover timer'ını sıfırla
  useEffect(() => {
    return () => {
      resetScrollLock();
      if (hoverIntentTimerRef.current) {
        window.clearTimeout(hoverIntentTimerRef.current);
      }
    };
  }, []);

  // Masaüstü hover ile açma - Premium soft niyet eşiği (60ms) ile ani fırlamayı önler, açıkken anında geçiş yapar
  const handleMouseEnterItem = (panelId?: MenuPanelId) => {
    if (!panelId) return;
    if (activePanelRef.current === panelId) {
      return;
    }

    if (hoverIntentTimerRef.current) {
      window.clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }

    if (activePanelRef.current) {
      // Menü zaten açıkken sekmeler arası geçiş anında (0ms) gerçekleşir
      setActivePanel(panelId);
    } else {
      // Menü kapalıyken imlecin header üzerinden hızlıca geçişlerinde sert/ani açılmayı önleyen
      // fark edilmeyecek kadar akıcı (60ms) niyet eşiği
      hoverIntentTimerRef.current = window.setTimeout(() => {
        setActivePanel(panelId);
        hoverIntentTimerRef.current = null;
      }, 60);
    }
  };

  const handleMouseLeaveItem = () => {
    if (hoverIntentTimerRef.current) {
      window.clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  };

  // Klavye odaklanması ile açma - Escape sonrası odak iadesinde menüyü yeniden açmaz
  const handleButtonFocus = (panelId?: MenuPanelId) => {
    if (!panelId) return;
    if (preventOpenOnFocusRef.current) {
      preventOpenOnFocusRef.current = false;
      return;
    }
    if (activePanelRef.current === panelId) {
      return;
    }
    setActivePanel(panelId);
  };

  // Buton tıklama davranışı: Tıklandığında aç/kapat toggle çalışır
  const handleButtonClick = (panelId: MenuPanelId) => {
    setActivePanel((prev) => (prev === panelId ? null : panelId));
  };

  const handleCloseAll = useCallback(() => {
    setActivePanel(null);
    setIsMobileOpen(false);
  }, []);

  // Odak header/panel dışındaki bir öğeye çıktığında açık paneli kapat
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (e.relatedTarget && headerRef.current && !headerRef.current.contains(e.relatedTarget as Node)) {
      setActivePanel(null);
    }
  };

  // Escape tuşu dinleyicisi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePanelRef.current) {
          const closingPanelId = activePanelRef.current;
          preventOpenOnFocusRef.current = true;
          setActivePanel(null);
          const trigger = document.getElementById(`nav-button-${closingPanelId}`);
          trigger?.focus();
        }
        if (isMobileOpen) {
          setIsMobileOpen(false);
          hamburgerButtonRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  // Mobil menü açıkken masaüstü genişliğine geçildiğinde menü durumunu ve scroll kilidini temizle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 961) {
        setIsMobileOpen(false);
        unlockScroll();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobil menü açıkken scroll kilidi (Lenis olmadan, sıçramasız)
  useEffect(() => {
    if (isMobileOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }, [isMobileOpen]);

  return (
    <header
      ref={headerRef}
      className={`${styles.headerWrapper} ${isMobileOpen ? styles.isMobileOpen : ''} ${useDarkNavigation ? styles.onLightSection : ''}`}
      onBlur={handleBlur}
    >
      {/* Editoryal Koyu Tema Zemin Katmanı (#111814) */}
      <div
        ref={headerBgRef}
        className={styles.headerBg}
        aria-hidden="true"
      />

      <div className={styles.navContainer}>
        {/* Logo */}
        <a
          href="/"
          className={styles.logoLink}
          aria-label={`${siteConfig.companyName} Anasayfa`}
          onClick={() => handleCloseAll()}
        >
          <img
            src={useDarkNavigation ? '/assets/bestbrands-logo.png' : siteConfig.logo.src}
            alt={siteConfig.logo.alt}
            className={styles.logoImage}
            width={siteConfig.logo.width}
            height={siteConfig.logo.height}
          />
        </a>

        {/* Masaüstü Navigasyon */}
        <nav className={styles.desktopNavList} aria-label="Ana Gezinti Menüsü">
          {headerNavItems.map((item) => {
            const hasPanel = item.hasDropdown && item.panelId;
            const isActive = activePanel === item.panelId;

            return (
              <div
                key={item.id}
                className={styles.navItem}
              >
                {hasPanel ? (
                  <button
                    id={`nav-button-${item.panelId}`}
                    type="button"
                    className={`${styles.navButton} ${isActive ? styles.isActive : ''}`}
                    aria-expanded={isActive}
                    aria-haspopup="true"
                    aria-controls={`megamenu-panel-${item.panelId}`}
                    onMouseEnter={() => handleMouseEnterItem(item.panelId)}
                    onMouseLeave={handleMouseLeaveItem}
                    onFocus={() => handleButtonFocus(item.panelId)}
                    onClick={() => item.panelId && handleButtonClick(item.panelId)}
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`${styles.navChevron} ${isActive ? styles.isFlipped : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
                  </button>
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.navDirectLink}
                    onClick={() => handleCloseAll()}
                  >
                    <span>{item.label}</span>
                  </a>
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobil Hamburger Butonu */}
        <button
          ref={hamburgerButtonRef}
          type="button"
          className={styles.mobileMenuToggle}
          aria-label={isMobileOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation-drawer"
          onClick={() => setIsMobileOpen((prev) => !prev)}
        >
          {isMobileOpen ? (
            <svg
              className={styles.hamburgerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg
              className={styles.hamburgerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Masaüstü Mega Menü Paneli */}
      <MegaMenu
        activePanel={activePanel}
        headerBgRef={headerBgRef}
        onClose={handleCloseAll}
      />

      {/* Mobil ve Tablet Menü Çekmecesi */}
      <MobileMenu
        isOpen={isMobileOpen}
        onClose={handleCloseAll}
        triggerButtonRef={hamburgerButtonRef}
      />
    </header>
  );
};
