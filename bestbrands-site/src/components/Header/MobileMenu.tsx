import React, { useState, useRef, useEffect } from 'react';
import styles from './MobileMenu.module.css';
import {
  headerNavItems,
  corporateData,
  investmentsData,
  investorRelationsData,
} from '../../data/navigationData';
import { siteConfig } from '../../config/siteConfig';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, triggerButtonRef }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  // Açılışta odağı menüye taşı; kapanışta hamburger butonuna döndür
  useEffect(() => {
    if (isOpen) {
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else {
        drawerRef.current?.focus();
      }
    } else {
      triggerButtonRef.current?.focus();
    }
  }, [isOpen, triggerButtonRef]);

  // Modal Focus Trap ve Escape dinleyicisi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return (
    <div
      ref={drawerRef}
      id="mobile-navigation-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Mobil Menü"
      tabIndex={-1}
      className={`${styles.mobileDrawer} ${isOpen ? styles.isOpen : ''}`}
      onKeyDown={handleKeyDown}
      hidden={!isOpen}
    >
      <div className={styles.navSection}>
        {headerNavItems.map((item) => {
          if (!item.hasDropdown) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directLink}
                onClick={onClose}
                tabIndex={isOpen ? 0 : -1}
              >
                <span>{item.label}</span>
              </a>
            );
          }

          const isExpanded = openAccordion === item.id;

          return (
            <div key={item.id} className={styles.accordionGroup}>
              <button
                type="button"
                className={`${styles.accordionHeader} ${isExpanded ? styles.isHeaderActive : ''}`}
                onClick={() => toggleAccordion(item.id)}
                aria-expanded={isExpanded}
                aria-controls={`mobile-panel-${item.id}`}
                tabIndex={isOpen ? 0 : -1}
              >
                <span>{item.label}</span>
                <svg
                  className={`${styles.accordionChevron} ${isExpanded ? styles.isExpanded : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <div
                id={`mobile-panel-${item.id}`}
                className={`${styles.accordionBody} ${isExpanded ? styles.isExpanded : ''}`}
                aria-hidden={!isExpanded}
                hidden={!isExpanded}
              >
                {/* Kurumsal Akordeon İçeriği */}
                {item.id === 'kurumsal' && (
                  <div className={styles.subLinkList}>
                    {corporateData.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.subLinkItem}
                        onClick={onClose}
                        tabIndex={isExpanded ? 0 : -1}
                      >
                        <span>{link.label}</span>
                        <span className={styles.linkArrow} aria-hidden="true">→</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Yatırımlarımız Akordeon İçeriği */}
                {item.id === 'yatirimlarimiz' && (
                  <div className={styles.subLinkList}>
                    {investmentsData.cards.map((card) => (
                      <a
                        key={card.id}
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.subLinkItem}
                        onClick={onClose}
                        tabIndex={isExpanded ? 0 : -1}
                      >
                        <div className={styles.cardInfo}>
                          <span className={styles.cardItemTitle}>{card.title}</span>
                          <span className={styles.cardItemSubtitle}>{card.subtitle}</span>
                        </div>
                        <span className={styles.linkArrow} aria-hidden="true">→</span>
                      </a>
                    ))}
                    <a
                      href={investmentsData.allInvestmentsLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.subLinkItem} ${styles.allInvestmentsMobileLink}`}
                      onClick={onClose}
                      tabIndex={isExpanded ? 0 : -1}
                    >
                      <span>{investmentsData.allInvestmentsLink.label}</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                )}

                {/* Yatırımcı İlişkileri Akordeon İçeriği */}
                {item.id === 'yatirimci-iliskileri' && (
                  <div className={styles.subLinkList}>
                    {investorRelationsData.columns.flatMap((col) => col.links).map((link) => {
                      if (link.isDisabled) {
                        return (
                          <div
                            key={link.id}
                            className={`${styles.subLinkItem} ${styles.disabledLinkItem}`}
                            tabIndex={-1}
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
                          className={styles.subLinkItem}
                          onClick={onClose}
                          tabIndex={isExpanded ? 0 : -1}
                        >
                          <span>{link.label}</span>
                          <span className={styles.linkArrow} aria-hidden="true">→</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobil Alt İletişim Alanı */}
      <div className={styles.mobileFooter}>
        <a
          href={`tel:${siteConfig.contact.phoneRaw}`}
          className={styles.mobileContactItem}
          tabIndex={isOpen ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>{siteConfig.contact.phone}</span>
        </a>

        <a
          href={`mailto:${siteConfig.contact.email}`}
          className={styles.mobileContactItem}
          tabIndex={isOpen ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
          <span>{siteConfig.contact.email}</span>
        </a>

        <div className={styles.mobileSocialRow}>
          <a
            href={siteConfig.contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileSocialBtn}
            tabIndex={isOpen ? 0 : -1}
          >
            LinkedIn →
          </a>
          <a
            href={siteConfig.contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileSocialBtn}
            tabIndex={isOpen ? 0 : -1}
          >
            Instagram →
          </a>
        </div>
      </div>
    </div>
  );
};
