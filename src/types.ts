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

export interface Area {
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

export interface CollectionItem {
  [key: string]: boolean;
}

export interface Settings {
  locale?: string;
  visibleRarities: number[];
  hideCompleted: boolean;
}

export interface LocalStorage {
  collection: string[];
  settings: Settings;
}
