import { siteConfig } from '../../config/siteConfig';
import styles from './Footer.module.css';

const legalLinks = [
  { label: 'Gizlilik ve Güvenlik', path: '/gizlilik-ve-guvenlik-politikasi/' },
  { label: 'Çerez Politikası', path: '/cerez-politikasi/' },
  { label: 'Bilgi Toplumu Hizmetleri', path: '/bilgi-toplumu-hizmetleri/' },
  { label: 'Kişisel Verilerin Korunması', path: '/kvkk-aydinlatma-metni/' },
];

export function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={styles.brandBand}>
        <div className={`${styles.container} ${styles.brandRow}`}>
          <a href="/" className={styles.logoLink} aria-label="Best Brands Enerji ana sayfa">
            <img src={siteConfig.logo.src} alt="Best Brands Energy Group" className={styles.logo} width="164" height="82" loading="lazy" />
          </a>
          <nav className={styles.socialLinks} aria-label="Sosyal medya">
            <a href={siteConfig.contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Best Brands Enerji LinkedIn (yeni sekmede açılır)">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.13 2.07 2.07 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" /></svg>
            </a>
            <a href={siteConfig.contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Best Brands Enerji Instagram (yeni sekmede açılır)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
          </nav>
        </div>
      </div>
      <div className={styles.legalBand}>
        <div className={styles.container}>
          <div className={styles.legalRow}>
            <nav aria-label="Yasal bilgiler">
              <ul className={styles.legalLinks}>
                {legalLinks.map(link => <li key={link.path}><a href={`${siteConfig.officialSiteUrl}${link.path}`}>{link.label}</a></li>)}
              </ul>
            </nav>
          </div>
          <p className={styles.copyright}>© {new Date().getFullYear()} {siteConfig.companyLegalName} Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
