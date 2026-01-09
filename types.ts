// Updated types to support professional ZWDS requirements

export interface Star {
  name: string;
  type: 'major' | 'minor' | 'adjective' | 'other';
  brightness?: string; // Miao, Wang, De, Li, Ping, Bu, Xian
  mutagen?: string; // Lu, Quan, Ke, Ji (Base Chart)
  scope?: string;
}

export interface Palace {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean; // Life Palace
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: Star[];
  minorStars: Star[];
  adjectiveStars: Star[];
  changsheng12: string; // Life Stage
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  decadal: {
    range: string;
    heavenlyStem: string;
    earthlyBranch: string;
  };
  ages: number[];
}

export interface FourPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface SiHua {
    stem: string;
    lu: string;
    quan: string;
    ke: string;
    ji: string;
}

// Flow/Horoscope Data
export interface FlowLayer {
  index: number; // The earthly branch index (0-11) where this layer's Life Palace is located
  heavenlyStem: string;
  earthlyBranch: string;
  palaces: Record<number, Star[]>; // Map index (0-11) -> List of Flow Stars in that palace
  palaceNames: Record<number, string>; // Map index (0-11) -> Name of the Flow Palace (e.g., "Wealth")
}

export interface Horoscope {
  year: FlowLayer;
  month: FlowLayer;
  yearSiHua?: SiHua;
  monthSiHua?: SiHua;
  lunarDate: string; // The lunar date description of the focus date
  solarDate: string;
  monthRange?: {
    start: string;
    end: string;
    startName?: string; // Name of starting Solar Term (e.g., Li Chun)
    endName?: string;   // Name of ending Solar Term
  };
}

// BaZi Specific Types
export interface BaZiItem {
    char: string; // The Chinese Character (e.g., 甲, 子)
    wuxing: string; // Five Element (e.g., 木, 水)
    shishen?: string; // Ten God (e.g., 比肩, 正官) - Only for Stems or Hidden Stems
}

export interface BaZiPillar {
    name: string; // Year, Month, Day, Hour
    gan: BaZiItem;
    zhi: BaZiItem & {
        hidden: BaZiItem[]; // Hidden Stems in the Branch
    };
    nayin: string; // Na Yin (Melodic Element)
    kongwang: string; // Empty Death (Xun Kong)
    changsheng: string; // 12 Life Stage relative to Day Master
    shensha: string[]; // List of Gods/Evils (e.g., Tian Yi, Yi Ma)
}

export interface BaZiDaYun {
    startAge: number;
    endAge: number;
    startYear: number;
    endYear: number;
    gan: BaZiItem;
    zhi: BaZiItem & {
        hidden: BaZiItem[]; // Hidden Stems in the Branch
    };
}

export interface BaZiChart {
    pillars: BaZiPillar[]; // [Year, Month, Day, Hour]
    dayMaster: string;
    dayMasterWuXing: string;
    daYun: BaZiDaYun[]; // Array of Luck Pillars
    startYunAge: number; // Age when the first Da Yun starts
    startYunDate?: string; // Specific start date string (YYYY-MM-DD)
}

export interface Astrolabe {
  palaces: Palace[];
  solarDate: string;
  lunarDate: string;
  chineseDate: string; // Full string
  rawDates: {
    lunarYear: number;
    lunarMonth: number;
    lunarDay: number;
    isLeap: boolean;
  };
  fourPillars: FourPillars;
  bazi?: BaZiChart; // Added BaZi Chart Data
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  soul: string; // Ming Zhu
  body: string; // Shen Zhu
  fiveElementsClass: string; // Wu Xing Ju
  gender: 'Male' | 'Female';
  originalGender: '乾造' | '坤造'; // Chinese gender representation
  horoscope?: Horoscope; // Optional flow data
  longitude?: number; // Added for True Solar Time reference
  latitude?: number;  // Added for Location Precision
  birthHour?: number; // Preserved for text export accuracy
  birthMinute?: number; // Preserved for text export accuracy
}

export interface UserInput {
  calendarType: 'solar' | 'lunar';
  solarDate: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  birthHour: number;
  birthMinute: number;
  longitude: number; // For True Solar Time
  latitude?: number; // For detailed location logging
  gender: 'male' | 'female';
  focusDate?: string; // For calculating Flow layers (YYYY-MM-DD)
}