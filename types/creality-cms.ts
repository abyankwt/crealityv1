export type CrealityPopupData = {
  enabled: boolean;
  title: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
};

export type CrealityHeroSlideData = {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button1_text: string;
  button1_link: string;
  button2_text: string;
  button2_link: string;
  order: number;
};

export type CrealitySeasonalCampaignHero = {
  title: string;
  subtitle: string;
  image: string;
};

export type CrealitySeasonalCampaignData = {
  enabled: boolean;
  slug: string;
  nav_label: string;
  hero: CrealitySeasonalCampaignHero;
  products: number[];
};
