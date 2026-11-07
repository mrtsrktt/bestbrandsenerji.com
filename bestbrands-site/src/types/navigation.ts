export type MenuPanelId = 'kurumsal' | 'yatirimlarimiz' | 'yatirimci-iliskileri';

export interface NavLinkItem {
  id: string;
  label: string;
  url?: string;
  description?: string;
  badge?: string;
  isDisabled?: boolean;
  isExternal?: boolean;
}

export interface InvestmentCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  url: string;
  isExternal?: boolean;
}

export interface CorporatePanelData {
  links: NavLinkItem[];
  featureCard: {
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    tag: string;
    url: string;
  };
}

export interface InvestmentsPanelData {
  cards: InvestmentCardItem[];
  allInvestmentsLink: NavLinkItem;
}

export interface InvestorRelationsGroup {
  id: string;
  title: string;
  links: NavLinkItem[];
}

export interface InvestorRelationsPanelData {
  columns: InvestorRelationsGroup[];
  footerContact: {
    phone: string;
    email: string;
    linkedinUrl: string;
    instagramUrl: string;
  };
}

export type MegaMenuContent =
  | { type: 'corporate'; data: CorporatePanelData }
  | { type: 'investments'; data: InvestmentsPanelData }
  | { type: 'investor-relations'; data: InvestorRelationsPanelData };

export interface HeaderNavItem {
  id: string;
  label: string;
  hasDropdown: boolean;
  panelId?: MenuPanelId;
  url?: string;
  isExternal?: boolean;
}
