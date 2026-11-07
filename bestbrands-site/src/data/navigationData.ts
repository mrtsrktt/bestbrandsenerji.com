import type {
  HeaderNavItem,
  CorporatePanelData,
  InvestmentsPanelData,
  InvestorRelationsPanelData,
} from '../types/navigation';
import { siteConfig } from '../config/siteConfig';

export const headerNavItems: HeaderNavItem[] = [
  {
    id: 'kurumsal',
    label: 'Kurumsal',
    hasDropdown: true,
    panelId: 'kurumsal',
  },
  {
    id: 'yatirimlarimiz',
    label: 'Yatırımlarımız',
    hasDropdown: true,
    panelId: 'yatirimlarimiz',
  },
  {
    id: 'yatirimci-iliskileri',
    label: 'Yatırımcı İlişkileri',
    hasDropdown: true,
    panelId: 'yatirimci-iliskileri',
  },
  {
    id: 'basin-odasi',
    label: 'Basın Odası',
    hasDropdown: false,
    url: 'https://bestbrandsenerji.com/basin-bulteni/',
    isExternal: true,
  },
  {
    id: 'iletisim',
    label: 'İletişim',
    hasDropdown: false,
    url: 'https://bestbrandsenerji.com/hakkimizda/iletisim/',
    isExternal: true,
  },
];

export const corporateData: CorporatePanelData = {
  links: [
    {
      id: 'hakkimizda',
      label: 'Hakkımızda',
      url: 'https://bestbrandsenerji.com/hakkimizda/',
      description: 'Geleceğe değer katan sürdürülebilir enerji vizyonumuz',
      isExternal: true,
    },
    {
      id: 'yonetim-kurulu-mesaji',
      label: 'Yönetim Kurulu Mesajı',
      url: 'https://bestbrandsenerji.com/yonetim-kurulu-mesaji/',
      description: 'Grup stratejimiz ve paydaşlarımıza taahhütlerimiz',
      isExternal: true,
    },
    {
      id: 'yonetim',
      label: 'Yönetim',
      url: 'https://bestbrandsenerji.com/yonetim/',
      description: 'Deneyimli ve yetkin kurumsal yönetim kadromuz',
      isExternal: true,
    },
    {
      id: 'degerlerimiz',
      label: 'Değerlerimiz',
      url: 'https://bestbrandsenerji.com/degerlerimiz/',
      description: 'Şeffaflık, çevreye saygı ve kurumsal ilkelerimiz',
      isExternal: true,
    },
    {
      id: 'surdurulebilirlik',
      label: 'Sürdürülebilirlik',
      url: 'https://bestbrandsenerji.com/surdurulebilirlik/',
      description: 'Geleceğe saygılı ve çevreye duyarlı temiz enerji üretimi',
      isExternal: true,
    },
    {
      id: 'kariyer',
      label: 'Kariyer',
      url: 'https://bestbrandsenerji.com/kariyer/',
      description: 'Ekibimize katılın ve temiz enerjinin geleceğini şekillendirin',
      isExternal: true,
    },
  ],
  featureCard: {
    tag: 'Kurumsal Vizyon',
    title: 'Doğanın Gücüyle Yenilenebilir Yarınlar',
    description: 'Yenilikçi teknolojiler ve sürdürülebilir yatırımlarla Türkiye’nin enerji dönüşümüne değer katıyoruz.',
    imageSrc: '/assets/corporate-overview.jpg',
    imageAlt: 'Best Brands Enerji Tesisleri Genel Bakış',
    url: 'https://bestbrandsenerji.com/hakkimizda/',
  },
};

export const investmentsData: InvestmentsPanelData = {
  cards: [
    {
      id: 'ges',
      title: 'Güneş Enerjisi Santralleri',
      subtitle: 'Güneş Enerjisi Yatırımları',
      description: 'Yenilenebilir enerji üretimine yönelik güneş enerjisi santrali yatırımları.',
      imageSrc: '/assets/investments-solar-erzurum.jpg',
      imageAlt: 'Best Brands Enerji Güneş Enerjisi Santrali Sahası',
      url: 'https://bestbrandsenerji.com/yatirimlarimiz/',
      isExternal: true,
    },
    {
      id: 'arac-muayene',
      title: 'Araç Muayene İstasyonları',
      subtitle: 'Muayene İstasyonu Yatırımları',
      description: 'Beste & Esbi araç muayene istasyonu yatırımlarımızı keşfedin.',
      imageSrc: '/assets/investments-vehicle-inspection.webp',
      imageAlt: 'Beste & Esbi Araç Muayene İstasyonları Görseli',
      url: 'https://bestbrandsenerji.com/yatirimlarimiz/',
      isExternal: true,
    },
  ],
  allInvestmentsLink: {
    id: 'tum-yatirimlarimiz',
    label: 'Tüm Yatırımlarımız',
    url: 'https://bestbrandsenerji.com/yatirimlarimiz/',
    description: 'Yatırım portföyünü resmi sitede görüntüleyin',
    isExternal: true,
  },
};

export const investorRelationsData: InvestorRelationsPanelData = {
  columns: [
    {
      id: 'bildirimler',
      title: 'Bildirimler',
      links: [
        {
          id: 'kap-bildirimleri',
          label: 'KAP Bildirimleri',
          url: 'https://bestbrandsenerji.com/kap-bildirimleri/',
          isExternal: true,
        },
        {
          id: 'bildirimler-ve-duyurular',
          label: 'Bildirimler ve Duyurular',
          url: 'https://bestbrandsenerji.com/bildirimler-ve-duyurular/',
          isExternal: true,
        },
      ],
    },
    {
      id: 'raporlar-ve-veriler',
      title: 'Raporlar ve Veriler',
      links: [
        {
          id: 'finansal-operasyonel',
          label: 'Finansal ve Operasyonel Veriler',
          url: 'https://bestbrandsenerji.com/finansal-ve-operasyonel-veriler/',
          isExternal: true,
        },
        {
          id: 'finansal-faaliyet-raporlari',
          label: 'Finansal Raporlar ve Faaliyet Raporları',
          url: 'https://bestbrandsenerji.com/mali-tablolar-faaliyet-raporlari/',
          isExternal: true,
        },
        {
          id: 'kurumsal-sunum',
          label: 'Kurumsal Sunum',
          url: 'https://bestbrandsenerji.com/kurumsal-sunum/',
          isExternal: true,
        },
        {
          id: 'hisse-bilgileri',
          label: 'Hisse Bilgileri',
          isDisabled: true,
          badge: 'Hazırlanıyor',
          description: 'Hisse ve piyasa verileri entegrasyonu devam etmektedir',
        },
        {
          id: 'halka-arz',
          label: 'Halka Arz ve Yatırım Süreci',
          url: 'https://bestbrandsenerji.com/halka-arz-ve-yatirim-sureci/',
          isExternal: true,
        },
      ],
    },
    {
      id: 'kurumsal-yonetim',
      title: 'Kurumsal Yönetim',
      links: [
        {
          id: 'genel-kurul',
          label: 'Genel Kurul',
          url: 'https://bestbrandsenerji.com/genel-kurul-bilgilendirme/',
          isExternal: true,
        },
        {
          id: 'sirket-yapisi',
          label: 'Şirket Yapısı ve Temel Belgeler',
          url: 'https://bestbrandsenerji.com/sirket-yapisi-ve-temel-belgeler/',
          isExternal: true,
        },
        {
          id: 'komiteler',
          label: 'Komiteler',
          url: 'https://bestbrandsenerji.com/kurumsal-yonetim/',
          isExternal: true,
        },
        {
          id: 'politika-ilkeler',
          label: 'Politika ve İlkeler',
          url: 'https://bestbrandsenerji.com/politika-ve-ilkeler/',
          isExternal: true,
        },
        {
          id: 'denetim-hukuki',
          label: 'Denetim ve Hukuki Belgeler',
          url: 'https://bestbrandsenerji.com/denetim-ve-hukuki-belgeler/',
          isExternal: true,
        },
        {
          id: 'bilgi-toplumu',
          label: 'Bilgi Toplumu Hizmetleri',
          url: 'https://bestbrandsenerji.com/bilgi-toplumu-hizmetleri/',
          isExternal: true,
        },
      ],
    },
  ],
  footerContact: {
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    linkedinUrl: siteConfig.contact.linkedin,
    instagramUrl: siteConfig.contact.instagram,
  },
};
