// Updated types to support professional ZWDS requirements

export interface Star {
  name: string;
  type: 'major' | 'minor' | 'adjective' | 'other';
  brightness?: string; // Miao, Wang, De, Li, Ping, Bu, Xian
  mutagen?: string; // Lu, Quan, Ke, Ji (Base Chart)
  scope?: string;
}

export interface PalaceMutagen {
  star: string;
  mutagen: string;
  type: Star['type'];
}

export interface BorrowInfo {
  fromPalaceIndex: number;
  fromPalaceName: string;
  rule: string;
  ruleVersion?: string;
}

export interface PalaceSurrounding {
  trine: { index: number; name: string }[];
  opposite: { index: number; name: string };
  fourRectification: { index: number; name: string }[];
  trinePalaces?: { index: number; name: string }[];
  oppositePalace?: { index: number; name: string };
  fourRectificationPalaces?: { index: number; name: string }[];
  majorStarsUnion: Star[];
  mutagensUnion: PalaceMutagen[];
}

export interface Palace {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean; // Life Palace
  heavenlyStem: string;
  earthlyBranch: string;
  stemBranch?: string;
  majorStars: Star[];
  minorStars: Star[];
  adjectiveStars: Star[];
  toughStars?: Star[];
  mutagens?: PalaceMutagen[];
  isEmptyPalace?: boolean;
  borrowFromPalace?: BorrowInfo;
  borrowedMajorStars?: Star[];
  changsheng12: string; // Life Stage
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  life12?: string;
  scholar12?: string;
  yearFront12?: string;
  generalFront12?: string;
  decadal: {
    range: string;
    heavenlyStem: string;
    earthlyBranch: string;
  };
  ages: number[];
  surrounding?: PalaceSurrounding;
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

export interface MutagenMapEntry {
  star: string;
  palaceIndex: number;
  palaceName: string;
}

export interface MutagenMap {
  lu: MutagenMapEntry[];
  quan: MutagenMapEntry[];
  ke: MutagenMapEntry[];
  ji: MutagenMapEntry[];
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
    xun?: string; // Xun (10-day cycle)
    nayin: string; // Na Yin (Melodic Element)
    kongwang: string; // Empty Death (Xun Kong)
    changsheng: string; // 12 Life Stage relative to Day Master
    shensha: string[]; // List of Gods/Evils (e.g., Tian Yi, Yi Ma)
    selfSeat?: string; // Terrain of stem sitting on branch
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

export interface BaZiShenSha {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
  ruleVersion: string;
}

export interface BaZiFlow {
  yearGanzhi?: string;
  monthGanzhi?: string;
  dayGanzhi?: string;
  relations?: BaZiRelations;
}

export interface BaZiChart {
    pillars: BaZiPillar[]; // [Year, Month, Day, Hour]
    dayMaster: string;
    dayMasterWuXing: string;
    taiYuan?: string;
    taiXi?: string;
    mingGong?: string;
    shenGong?: string;
    providerSect?: 1 | 2;
    dayBoundary?: string;
    daYun: BaZiDaYun[]; // Array of Luck Pillars
    startYunAge: number; // Age when the first Da Yun starts
    startYunDate?: string; // Specific start date string (YYYY-MM-DD)
    fiveElementsCount?: BaZiFiveElementsCount;
    relations?: BaZiRelations;
    meta?: BaZiMeta;
    shenSha?: BaZiShenSha;
    flow?: BaZiFlow;
    dayMasterStrength?: BaZiDayMasterStrength;
    usefulGod?: string;
    favorableElements?: string[];
    unfavorableElements?: string[];
    pattern?: string;
    analysisNotes?: string;
}

export interface BaZiDayMasterStrength {
  score: number;
  level: string;
  method: string;
}

export interface SolarTermInfo {
  name: string;
  datetime: string;
}

export interface BaZiCalendarRule {
  sect: 1 | 2;
  dayBoundary: string;
  yearPillarRule: string;
  monthPillarRule: string;
}

export interface SolarTimeInfo {
  timezone: string;
  enabled: boolean;
  type: string;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes?: number | null;
  totalOffsetMinutes: number;
  correctedDatetime: string;
  hourBranchBefore: string;
  hourBranchAfter: string;
  longitude: number;
  latitude?: number;
  longitudeSource?: string;
  dayBoundaryRule?: string;
}

export interface BaZiFiveElementsCount {
  stems: Record<string, number>;
  branches: Record<string, number>;
  hiddenStems: Record<string, number>;
  total: Record<string, number>;
}

export interface BaZiRelations {
  stems: Record<string, Record<string, unknown>>;
  branches: Record<string, Record<string, unknown>>;
  raw: Record<string, unknown>;
  events?: BaZiRelationEvent[];
}

export interface BaZiRelationEvent {
  pillar: string;
  category: 'stem' | 'branch';
  type: string;
  data: unknown;
}

export interface BaZiMeta {
  timezone: string;
  calendarRule: BaZiCalendarRule;
  solarTime: SolarTimeInfo;
  solarTimeEnabled: boolean;
  shenShaRuleVersion?: string;
  providerSect?: 1 | 2;
  dayBoundary?: string;
  solarTerms?: {
    liChun?: SolarTermInfo;
    monthStart?: SolarTermInfo;
    monthEnd?: SolarTermInfo;
    currentJieQi?: string;
  };
  lunarDateDetail?: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
    leapMonthOfYear?: number;
    monthDayCount?: number;
  };
}

export interface AstrolabeMeta {
  ruleVersion: string;
  starCatalogVersion?: string;
  dataSources: Record<string, string>;
  calendarRule: BaZiCalendarRule;
  fixLeap?: boolean;
}

export interface DecadalMutagenMap {
  range: string;
  heavenlyStem: string;
  earthlyBranch: string;
  palaceIndex: number;
  palaceName: string;
  map: MutagenMap;
}

export interface StarCatalogEntry {
  name: string;
  type: Star['type'];
  brightness?: string;
  isTransformable?: boolean;
  priority?: number;
}

export interface Astrolabe {
  palaces: Palace[];
  solarDate: string;
  lunarDate: string;
  chineseDate: string; // Full string
  timeIndex?: number;
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
  mutagenMap?: {
    origin?: MutagenMap;
    decadal?: DecadalMutagenMap[];
    currentDecadal?: DecadalMutagenMap & { age?: number };
    yearly?: MutagenMap;
    monthly?: MutagenMap;
  };
  starCatalog?: Record<string, StarCatalogEntry>;
  annualAgeMapping?: Record<number, number>;
  meta?: AstrolabeMeta;
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
