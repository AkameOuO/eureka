export interface Style {
  background: string;
  text: string;
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

export interface LabelDefinition {
  name: {
    en: string;
    zh_tw: string;
  };
  colors: {
    background: string;
    text: string;
  };
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
  labels: string[];
}

export interface EurekasData {
  eurekas: Eureka[];
  colors: Record<string, Color>;
  areas: Record<string, Area>;
  labels: Record<string, LabelDefinition>;
}

export interface Settings {
  locale?: string
  visibleRarities: number[]
  hideCompleted: boolean
}
