/**
 * Best Brands Enerji - Site Genel Yapılandırması
 * Video kaynağı, poster, şirket iletişim bilgileri ve temel yollar
 */

export const siteConfig = {
  companyName: 'Best Brands Enerji',
  companyLegalName: 'Best Brands Grup Enerji Yatırım A.Ş.',
  logo: {
    src: '/assets/bestbrands-white.png',
    alt: 'Best Brands Enerji Logosu',
    width: 164,
    height: 82,
  },
  hero: {
    videoSrc: '/assets/bestbrands-hero.mp4',
    posterSrc: '/assets/bestbrands-hero-poster.jpg',
    accessibleTitle: 'Best Brands Enerji - Yenilenebilir Enerji ve Geleceğin Altyapı Yatırımları',
    playbackSettings: {
      muted: true,
      playsInline: true,
      autoPlay: true,
      loop: false, // Tek sefer oynatım şartnamesi
    },
  },
  contact: {
    phone: '+90 216 606 40 71',
    phoneRaw: '+902166064071',
    email: 'info@bestbrandsenerji.com',
    address: 'Rüzgarlıbahçe Mahallesi Şehit Topçu Yzb. Sinan EROĞLU Caddesi No:6 / -2, Kavacık / Beykoz / İstanbul',
    linkedin: 'https://www.linkedin.com/company/best-brands-energy-group/',
    instagram: 'https://www.instagram.com/bestbrandsenerji/',
  },
  officialSiteUrl: 'https://bestbrandsenerji.com',
};
