export interface Style {
  background: string;
  font: string;
}

export interface Color {
  name: {
    en: string;
    zh_tw: string;
  };
  style: Style;
}

export interface Area extends Record<string, string> {
  en: string;
  zh_tw: string;
}

export interface Eureka {
  id: string;
  name: {
    en: string;
    zh_tw: string;
  };
  colors: string[];
  images: string[];
  rarity: number;
  source: {
    en: string;
    zh_tw: string;
  };
  area: string;
}

export interface EurekasData {
  eurekas: Eureka[];
  colors: Record<string, Color>;
  areas: Record<string, Area>;
}

export interface Settings {
  locale?: string
  visibleRarities: number[]
  hideCompleted: boolean
}
