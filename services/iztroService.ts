import { astro } from 'iztro';
import { Solar, Lunar, LunarYear } from 'lunar-javascript';
import {
  ChildLimit,
  Gender,
  SolarTime,
  LunarHour,
  DefaultEightCharProvider,
  LunarSect2EightCharProvider,
  HeavenStem,
  EarthBranch
} from 'tyme4ts';
import { calculateRelation, getShen } from 'cantian-tymext';
import {
  Astrolabe,
  Palace,
  Star,
  UserInput,
  FlowLayer,
  Horoscope,
  SiHua,
  BaZiChart,
  BaZiPillar,
  BaZiDaYun,
  PalaceMutagen,
  BaZiFiveElementsCount,
  BaZiRelations,
  BaZiMeta,
  MutagenMap,
  MutagenMapEntry,
  PalaceSurrounding,
  AstrolabeMeta,
  StarCatalogEntry,
  DecadalMutagenMap
} from '../types';

// Calculate Time Index (0-11) based on True Solar Time
export const calculateTimeIndex = (hour: number, minute: number, longitude: number): number => {
  const timeDifferenceMinutes = (longitude - 120) * 4;
  let totalMinutes = hour * 60 + minute + timeDifferenceMinutes;
  
  if (totalMinutes < 0) totalMinutes += 1440;
  if (totalMinutes >= 1440) totalMinutes -= 1440;
  
  const trueHour = totalMinutes / 60;

  if (trueHour >= 23 || trueHour < 1) return 0;
  if (trueHour >= 1 && trueHour < 3) return 1;
  return Math.floor((trueHour + 1) / 2);
};

export const getChineseTimeLabel = (index: number): string => {
  const branches = ['子 (Zi)', '丑 (Chou)', '寅 (Yin)', '卯 (Mao)', '辰 (Chen)', '巳 (Si)', '午 (Wu)', '未 (Wei)', '申 (Shen)', '酉 (You)', '戌 (Xu)', '亥 (Hai)'];
  return branches[index] || '';
};

// Si Hua Mapping based on Heavenly Stem
const SI_HUA_MAP: Record<string, { lu: string, quan: string, ke: string, ji: string }> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
};

const TOUGH_STAR_SET = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']);
const eightCharProvider1 = new DefaultEightCharProvider();
const eightCharProvider2 = new LunarSect2EightCharProvider();

const getSiHua = (stem: string): SiHua | undefined => {
    const map = SI_HUA_MAP[stem];
    if (!map) return undefined;
    return { stem, ...map };
};

// Calculate Solar Term Range for Flow Month
const getSolarTermRange = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const lunar = solar.getLunar();
        
        const JIE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

        let startTerm = lunar.getPrevJieQi(true); 
        let attempts = 0;
        while (startTerm && !JIE_NAMES.includes(startTerm.getName()) && attempts < 5) {
            const sDate = startTerm.getSolar();
            const prevDay = sDate.next(-1);
            startTerm = prevDay.getLunar().getPrevJieQi(true);
            attempts++;
        }

        let endTerm = lunar.getNextJieQi(false);
        attempts = 0;
        while (endTerm && !JIE_NAMES.includes(endTerm.getName()) && attempts < 5) {
            const sDate = endTerm.getSolar();
            const nextDay = sDate.next(1);
            endTerm = nextDay.getLunar().getNextJieQi(true);
            attempts++;
        }

        if (startTerm && endTerm) {
            const s = startTerm.getSolar();
            const e = endTerm.getSolar();
            
            const format = (sol: any) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${sol.getYear()}-${pad(sol.getMonth())}-${pad(sol.getDay())} ${pad(sol.getHour())}:${pad(sol.getMinute())}`;
            };

            return {
                start: format(s),
                end: format(e),
                startName: startTerm.getName(),
                endName: endTerm.getName()
            };
        }
    } catch (e) {
        console.warn("Solar term calculation failed", e);
    }
    return undefined;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatDateTime = (date: Date) => {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const TEN_GODS: Record<string, Record<string, string>> = {
    '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
    '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
    '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
    '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
    '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
    '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
    '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
    '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
    '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
    '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' },
};

const getTenGod = (dayGanName: string, targetGanName: string): string => {
    return TEN_GODS[dayGanName]?.[targetGanName] || '';
};

const WU_XING_GAN: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const WU_XING_ZHI: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

const createElementCounter = () => ({
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
});

const addElementCount = (counter: Record<string, number>, element: string | undefined) => {
    if (!element) return;
    counter[element] = (counter[element] || 0) + 1;
};

const ELEMENT_GENERATES: Record<string, string> = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木'
};

const ELEMENT_CONTROLS: Record<string, string> = {
    '木': '土',
    '土': '水',
    '水': '火',
    '火': '金',
    '金': '木'
};

const getGeneratorOf = (element: string) => {
    return Object.keys(ELEMENT_GENERATES).find((key) => ELEMENT_GENERATES[key] === element) || '';
};

const getSelfSeat = (gan: string, zhi: string) => {
    try {
        return HeavenStem.fromName(gan).getTerrain(EarthBranch.fromName(zhi)).toString();
    } catch {
        return '';
    }
};

const computeDayMasterStrength = (element: string, counts: BaZiFiveElementsCount) => {
    const generator = getGeneratorOf(element);
    const child = ELEMENT_GENERATES[element] || '';
    const controller = ELEMENT_CONTROLS[element] || '';

    const supportive = (counts.total[element] || 0) + (counts.total[generator] || 0);
    const opposing = (counts.total[child] || 0) + (counts.total[controller] || 0);
    const score = supportive - opposing;

    let level = 'balanced';
    if (score >= 2) level = 'strong';
    if (score <= -2) level = 'weak';

    const favorable = level === 'strong' ? [child, controller].filter(Boolean) : [element, generator].filter(Boolean);
    const unfavorable = level === 'strong' ? [element, generator].filter(Boolean) : [child, controller].filter(Boolean);

    return {
        strength: { score, level, method: 'simple_wuxing_balance' },
        favorable,
        unfavorable
    };
};

const buildFiveElementsCount = (pillars: BaZiPillar[]): BaZiFiveElementsCount => {
    const stems = createElementCounter();
    const branches = createElementCounter();
    const hiddenStems = createElementCounter();

    pillars.forEach((pillar) => {
        addElementCount(stems, WU_XING_GAN[pillar.gan.char]);
        addElementCount(branches, WU_XING_ZHI[pillar.zhi.char]);
        pillar.zhi.hidden.forEach((hidden) => addElementCount(hiddenStems, hidden.wuxing));
    });

    const total = createElementCounter();
    Object.keys(total).forEach((key) => {
        total[key] = (stems[key] || 0) + (branches[key] || 0) + (hiddenStems[key] || 0);
    });

    return { stems, branches, hiddenStems, total };
};

const normalizeRelations = (
    relationsRaw: Record<string, unknown>,
    keyMap: Record<string, string>
): BaZiRelations => {
    const stems: Record<string, Record<string, unknown>> = {};
    const branches: Record<string, Record<string, unknown>> = {};
    const events: BaZiRelations['events'] = [];

    Object.entries(relationsRaw).forEach(([key, value]) => {
        const targetKey = keyMap[key] || key;
        const relation = value as Record<string, any>;
        stems[targetKey] = relation?.天干 || {};
        branches[targetKey] = relation?.地支 || {};

        const stemRelations = relation?.天干 || {};
        Object.entries(stemRelations).forEach(([type, items]) => {
            (items as unknown[]).forEach((item) => {
                events?.push({ pillar: targetKey, category: 'stem', type, data: item });
            });
        });

        const branchRelations = relation?.地支 || {};
        Object.entries(branchRelations).forEach(([type, items]) => {
            (items as unknown[]).forEach((item) => {
                events?.push({ pillar: targetKey, category: 'branch', type, data: item });
            });
        });
    });

    return { stems, branches, raw: relationsRaw, events };
};

const buildRelations = (pillars: BaZiPillar[]): BaZiRelations | undefined => {
    try {
        const relationsRaw = calculateRelation({
            '年': { 天干: pillars[0].gan.char, 地支: pillars[0].zhi.char },
            '月': { 天干: pillars[1].gan.char, 地支: pillars[1].zhi.char },
            '日': { 天干: pillars[2].gan.char, 地支: pillars[2].zhi.char },
            '时': { 天干: pillars[3].gan.char, 地支: pillars[3].zhi.char },
        });

        const keyMap: Record<string, string> = { '年': 'year', '月': 'month', '日': 'day', '时': 'hour' };
        return normalizeRelations(relationsRaw as Record<string, unknown>, keyMap);
    } catch (e) {
        console.warn("Failed to calculate relations", e);
        return undefined;
    }
};

const buildMutagenMap = (palaces: Palace[]): MutagenMap => {
    const map: MutagenMap = { lu: [], quan: [], ke: [], ji: [] };
    const mapKey: Record<string, keyof MutagenMap> = {
        '禄': 'lu',
        '权': 'quan',
        '科': 'ke',
        '忌': 'ji',
        'Lu': 'lu',
        'Quan': 'quan',
        'Ke': 'ke',
        'Ji': 'ji',
    };

    palaces.forEach((palace) => {
        palace.mutagens?.forEach((mutagen) => {
            const key = mapKey[mutagen.mutagen];
            if (!key) return;
            const entry: MutagenMapEntry = {
                star: mutagen.star,
                palaceIndex: palace.index,
                palaceName: palace.name
            };
            map[key].push(entry);
        });
    });

    return map;
};

const buildMutagenMapFromFlow = (flow: FlowLayer, sihua: SiHua): MutagenMap => {
    const map: MutagenMap = { lu: [], quan: [], ke: [], ji: [] };
    const addEntry = (key: keyof MutagenMap, starName: string) => {
        if (!starName) return;
        let foundIndex: number | null = null;
        Object.entries(flow.palaces).forEach(([idx, stars]) => {
            if (foundIndex !== null) return;
            if (stars?.some((s) => s.name === starName)) {
                foundIndex = Number(idx);
            }
        });
        if (foundIndex === null) return;
        map[key].push({
            star: starName,
            palaceIndex: foundIndex,
            palaceName: flow.palaceNames[foundIndex] || ''
        });
    };

    addEntry('lu', sihua.lu);
    addEntry('quan', sihua.quan);
    addEntry('ke', sihua.ke);
    addEntry('ji', sihua.ji);

    return map;
};

const buildMutagenMapFromPalaces = (palaces: Palace[], sihua: SiHua): MutagenMap => {
    const map: MutagenMap = { lu: [], quan: [], ke: [], ji: [] };
    const allStars = (palace: Palace) => [
        ...palace.majorStars,
        ...palace.minorStars,
        ...palace.adjectiveStars,
        ...(palace.toughStars || [])
    ];
    const findStarEntries = (starName: string) => {
        const entries: MutagenMapEntry[] = [];
        palaces.forEach((palace) => {
            if (allStars(palace).some((star) => star.name === starName)) {
                entries.push({
                    star: starName,
                    palaceIndex: palace.index,
                    palaceName: palace.name
                });
            }
        });
        return entries;
    };

    map.lu = sihua.lu ? findStarEntries(sihua.lu) : [];
    map.quan = sihua.quan ? findStarEntries(sihua.quan) : [];
    map.ke = sihua.ke ? findStarEntries(sihua.ke) : [];
    map.ji = sihua.ji ? findStarEntries(sihua.ji) : [];

    return map;
};

const buildSurrounding = (palaces: Palace[], index: number): PalaceSurrounding => {
    const getPalace = (idx: number) => palaces.find((p) => p.index === idx);
    const trineIndices = [(index + 4) % 12, (index + 8) % 12];
    const oppositeIndex = (index + 6) % 12;
    const fourRectIndices = [index, oppositeIndex, ...trineIndices];

    const trine = trineIndices
        .map((idx) => getPalace(idx))
        .filter(Boolean)
        .map((p) => ({ index: p!.index, name: p!.name }));

    const oppositePalace = getPalace(oppositeIndex);

    const fourRectification = fourRectIndices
        .map((idx) => getPalace(idx))
        .filter(Boolean)
        .map((p) => ({ index: p!.index, name: p!.name }));

    const majorStarMap = new Map<string, Star>();
    const mutagenMap = new Map<string, PalaceMutagen>();

    fourRectIndices.forEach((idx) => {
        const palace = getPalace(idx);
        if (!palace) return;
        palace.majorStars.forEach((star) => {
            if (!majorStarMap.has(star.name)) {
                majorStarMap.set(star.name, star);
            }
        });
        palace.mutagens?.forEach((mutagen) => {
            const key = `${mutagen.star}:${mutagen.mutagen}`;
            if (!mutagenMap.has(key)) {
                mutagenMap.set(key, mutagen);
            }
        });
    });

    return {
        trine,
        trinePalaces: trine,
        opposite: {
            index: oppositePalace?.index ?? oppositeIndex,
            name: oppositePalace?.name ?? ''
        },
        oppositePalace: {
            index: oppositePalace?.index ?? oppositeIndex,
            name: oppositePalace?.name ?? ''
        },
        fourRectification,
        fourRectificationPalaces: fourRectification,
        majorStarsUnion: Array.from(majorStarMap.values()),
        mutagensUnion: Array.from(mutagenMap.values())
    };
};

const buildStarCatalog = (palaces: Palace[]): Record<string, StarCatalogEntry> => {
    const catalog: Record<string, StarCatalogEntry> = {};
    const typePriority: Record<Star['type'], number> = {
        major: 1,
        minor: 2,
        adjective: 3,
        other: 4
    };

    const addStar = (star: Star) => {
        const existing = catalog[star.name];
        const entry: StarCatalogEntry = existing || {
            name: star.name,
            type: star.type,
            brightness: star.brightness,
            isTransformable: Boolean(star.mutagen),
            priority: typePriority[star.type] ?? 9
        };

        if (existing) {
            entry.isTransformable = entry.isTransformable || Boolean(star.mutagen);
            if (!entry.brightness && star.brightness) entry.brightness = star.brightness;
            if ((typePriority[star.type] ?? 9) < (entry.priority ?? 9)) {
                entry.type = star.type;
                entry.priority = typePriority[star.type] ?? entry.priority;
            }
        }

        catalog[star.name] = entry;
    };

    palaces.forEach((palace) => {
        palace.majorStars.forEach(addStar);
        palace.minorStars.forEach(addStar);
        palace.adjectiveStars.forEach(addStar);
        palace.toughStars?.forEach(addStar);
    });

    return catalog;
};

// --- Shen Sha (Gods & Evils) Helpers ---
// Simplified lookup tables
const TIAN_YI_MAP: Record<string, string[]> = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['巳', '卯'], '癸': ['巳', '卯'],
    '辛': ['午', '寅']
};
const WEN_CHANG_MAP: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
};
const YI_MA_MAP: Record<string, string> = {
    '申': '寅', '子': '寅', '辰': '寅',
    '寅': '申', '午': '申', '戌': '申',
    '亥': '巳', '卯': '巳', '未': '巳',
    '巳': '亥', '酉': '亥', '丑': '亥'
};
const TAO_HUA_MAP: Record<string, string> = {
    '申': '酉', '子': '酉', '辰': '酉',
    '寅': '卯', '午': '卯', '戌': '卯',
    '亥': '子', '卯': '子', '未': '子',
    '巳': '午', '酉': '午', '丑': '午'
};

const getShenSha = (dayGan: string, dayZhi: string, yearZhi: string, targetZhi: string, targetGan?: string): string[] => {
    const list: string[] = [];
    
    // Tian Yi Gui Ren (Nobleman) - Based on Day Gan or Year Gan (using Day Gan primarily here)
    if (TIAN_YI_MAP[dayGan]?.includes(targetZhi)) list.push('天乙');
    
    // Wen Chang (Academic) - Based on Day Gan
    if (WEN_CHANG_MAP[dayGan] === targetZhi) list.push('文昌');

    // Yi Ma (Horse) - Based on Day Zhi or Year Zhi
    if (YI_MA_MAP[dayZhi] === targetZhi || YI_MA_MAP[yearZhi] === targetZhi) list.push('驿马');

    // Tao Hua (Peach Blossom) - Based on Day Zhi or Year Zhi
    if (TAO_HUA_MAP[dayZhi] === targetZhi || TAO_HUA_MAP[yearZhi] === targetZhi) list.push('桃花');

    // Lu Shen (Prosperity)
    const LU_MAP: Record<string, string> = {'甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子'};
    if (LU_MAP[dayGan] === targetZhi) list.push('禄神');

    // Yang Ren (Goat Blade)
    const YANG_REN_MAP: Record<string, string> = {'甲':'卯','乙':'辰','丙':'午','丁':'未','戊':'午','己':'未','庚':'酉','辛':'戌','壬':'子','癸':'丑'};
    if (YANG_REN_MAP[dayGan] === targetZhi) list.push('羊刃');

    return list;
};

// 12 Life Stages (Chang Sheng) Logic
const CHANG_SHENG_ORDER = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const BRANCHES = ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'];

const CHANG_SHENG_START: Record<string, number> = {
    '甲': 0, '乙': 7, '丙': 3, '戊': 3, '丁': 10, '己': 10, '庚': 6, '辛': 1, '壬': 9, '癸': 4
};

const getChangSheng = (stem: string, branch: string): string => {
    const startIndex = CHANG_SHENG_START[stem];
    if (startIndex === undefined) return '';
    const branchIndex = BRANCHES.indexOf(branch);
    if (branchIndex === -1) return '';
    const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(stem);
    let offset = isYang ? (branchIndex - startIndex + 12) % 12 : (startIndex - branchIndex + 12) % 12;
    return CHANG_SHENG_ORDER[offset] || '';
};

export const calculateAstrolabe = (input: UserInput): Astrolabe => {
  const timeIndex = calculateTimeIndex(input.birthHour, input.birthMinute, input.longitude);
  let astrolabe: any;
  let lunarObj: any;
  let trueSolarDate: Date | null = null;
  const solarTimeOffsetMinutes = (input.longitude - 120) * 4;
  const providerSect: 1 | 2 = 1;
  const dayBoundary = 'ziEarly';
  const timezone = 'Asia/Shanghai';
  const calendarRule = {
      sect: providerSect,
      dayBoundary,
      yearPillarRule: 'li_chun',
      monthPillarRule: 'jie_qi'
  };
  LunarHour.provider = calendarRule.sect === 2 ? eightCharProvider2 : eightCharProvider1;
  const astrolabeMeta: AstrolabeMeta = {
      ruleVersion: 'zwds-bazi-v1',
      starCatalogVersion: 'iztro-2.5.4',
      dataSources: {
          iztro: '2.5.4',
          'lunar-javascript': '1.6.13',
          tyme4ts: '1.3.4',
          'cantian-tymext': '0.0.21'
      },
      calendarRule,
      fixLeap: true
  };

  if (input.calendarType === 'lunar') {
    const dateStr = `${input.lunarYear}-${input.lunarMonth}-${input.lunarDay}`;
    astrolabe = astro.byLunar(dateStr, timeIndex, input.gender, input.isLeapMonth, true, 'zh-CN');
    
    // For BaZi with True Solar Time, we need to convert Lunar to Solar, then adjust for longitude
    const lunarDate = Lunar.fromYmd(input.lunarYear, input.lunarMonth, input.lunarDay, input.isLeapMonth);
    const solarFromLunar = lunarDate.getSolar();
    const [y, m, d] = [solarFromLunar.getYear(), solarFromLunar.getMonth(), solarFromLunar.getDay()];
    
    // Calculate True Solar Time for BaZi Generation
    // Beijing Time is GMT+8 (120 deg). 1 deg = 4 minutes.
    const offsetMinutes = solarTimeOffsetMinutes;
    trueSolarDate = new Date(y, m - 1, d, input.birthHour, input.birthMinute);
    trueSolarDate.setMinutes(trueSolarDate.getMinutes() + offsetMinutes);

    const solarObj = Solar.fromYmdHms(
        trueSolarDate.getFullYear(), 
        trueSolarDate.getMonth() + 1, 
        trueSolarDate.getDate(), 
        trueSolarDate.getHours(), 
        trueSolarDate.getMinutes(), 
        trueSolarDate.getSeconds()
    );
    lunarObj = solarObj.getLunar();

  } else {
    astrolabe = astro.bySolar(input.solarDate, timeIndex, input.gender, true, 'zh-CN');
    
    const [y, m, d] = input.solarDate.split('-').map(Number);
    
    // Calculate True Solar Time for BaZi Generation
    const offsetMinutes = solarTimeOffsetMinutes;
    trueSolarDate = new Date(y, m - 1, d, input.birthHour, input.birthMinute);
    trueSolarDate.setMinutes(trueSolarDate.getMinutes() + offsetMinutes);

    const solarObj = Solar.fromYmdHms(
        trueSolarDate.getFullYear(), 
        trueSolarDate.getMonth() + 1, 
        trueSolarDate.getDate(), 
        trueSolarDate.getHours(), 
        trueSolarDate.getMinutes(), 
        trueSolarDate.getSeconds()
    );
    lunarObj = solarObj.getLunar();
  }

  const mapStars = (stars: any[], type: Star['type']): Star[] => {
    return stars.map(s => ({
      name: s.name,
      brightness: s.brightness,
      mutagen: s.mutagen, 
      type: type,
      scope: s.scope
    }));
  };

  const palaces: Palace[] = astrolabe.palaces.map((p: any) => {
    const majorStars = mapStars(p.majorStars, 'major');
    const minorStars = mapStars(p.minorStars, 'minor');
    const adjectiveStars = mapStars(p.adjectiveStars, 'adjective');
    const allStars = [...majorStars, ...minorStars, ...adjectiveStars];
    const mutagens: PalaceMutagen[] = allStars
        .filter((star) => star.mutagen)
        .map((star) => ({
            star: star.name,
            mutagen: star.mutagen || '',
            type: star.type
        }));
    const toughStars = allStars.filter((star) => TOUGH_STAR_SET.has(star.name));

    return {
      index: p.index,
      name: p.name,
      isBodyPalace: p.isBodyPalace,
      isOriginalPalace: p.isOriginalPalace,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch,
      stemBranch: `${p.heavenlyStem}${p.earthlyBranch}`,
      majorStars,
      minorStars,
      adjectiveStars,
      toughStars,
      mutagens,
      changsheng12: p.changsheng12,
      boshi12: p.boshi12,
      jiangqian12: p.jiangqian12,
      suiqian12: p.suiqian12,
      life12: p.changsheng12,
      scholar12: p.boshi12,
      yearFront12: p.suiqian12,
      generalFront12: p.jiangqian12,
      decadal: {
        range: `${p.decadal.range[0]} - ${p.decadal.range[1]}`,
        heavenlyStem: p.decadal.heavenlyStem,
        earthlyBranch: p.decadal.earthlyBranch,
      },
      ages: p.ages
    };
  });

  palaces.forEach((palace) => {
      if (!palace.majorStars.length) {
          const oppositeIndex = (palace.index + 6) % 12;
          const opposite = palaces.find((p) => p.index === oppositeIndex);
          palace.isEmptyPalace = true;
          palace.borrowFromPalace = {
              fromPalaceIndex: oppositeIndex,
              fromPalaceName: opposite?.name || '',
              rule: 'empty_palace_borrow_opposite',
              ruleVersion: 'zwds-empty-palace-v1'
          };
          palace.borrowedMajorStars = opposite?.majorStars || [];
      } else {
          palace.isEmptyPalace = false;
      }
  });

  palaces.forEach((palace) => {
      palace.surrounding = buildSurrounding(palaces, palace.index);
  });

  const annualAgeMapping: Record<number, number> = {};
  palaces.forEach((palace) => {
      palace.ages?.forEach((age) => {
          annualAgeMapping[age] = palace.index;
      });
  });

  const originMutagenMap = buildMutagenMap(palaces);
  const starCatalog = buildStarCatalog(palaces);
  const decadalMapByRange = new Map<string, DecadalMutagenMap>();
  const parseDecadalRange = (range: string) => {
      const match = range.match(/(\d+)\s*-\s*(\d+)/);
      if (!match) return { start: 0, end: 0 };
      return { start: Number(match[1]), end: Number(match[2]) };
  };

  palaces.forEach((palace) => {
      const range = palace.decadal.range;
      if (!range || decadalMapByRange.has(range)) return;
      const sihua = getSiHua(palace.decadal.heavenlyStem);
      if (!sihua) return;
      decadalMapByRange.set(range, {
          range,
          heavenlyStem: palace.decadal.heavenlyStem,
          earthlyBranch: palace.decadal.earthlyBranch,
          palaceIndex: palace.index,
          palaceName: palace.name,
          map: buildMutagenMapFromPalaces(palaces, sihua)
      });
  });

  const decadalMutagenMaps = Array.from(decadalMapByRange.values()).sort((a, b) => {
      const ra = parseDecadalRange(a.range);
      const rb = parseDecadalRange(b.range);
      return ra.start - rb.start;
  });

  let currentDecadal: (DecadalMutagenMap & { age?: number }) | undefined;
  const focusDateStr = input.focusDate || new Date().toISOString().split('T')[0];
  if (focusDateStr) {
      const [by, bm, bd] = input.solarDate.split('-').map(Number);
      const [fy, fm, fd] = focusDateStr.split('-').map(Number);
      let age = fy - by;
      if (fm < bm || (fm === bm && fd < bd)) {
          age -= 1;
      }
      const entry = decadalMutagenMaps.find((m) => {
          const range = parseDecadalRange(m.range);
          return age >= range.start && age <= range.end;
      });
      if (entry) {
          currentDecadal = { ...entry, age };
      }
  }

  let yearGZ = '', monthGZ = '', dayGZ = '', hourGZ = '';
  let baziChart: BaZiChart | undefined = undefined;
  const lunarDateDetail = (() => {
      if (lunarObj) {
          const lunarYear = lunarObj.getYear();
          const lunarMonthRaw = lunarObj.getMonth();
          const lunarMonth = Math.abs(lunarMonthRaw);
          const lunarDay = lunarObj.getDay();
          const isLeapMonth = lunarMonthRaw < 0;
          let leapMonthOfYear: number | undefined = undefined;
          let monthDayCount: number | undefined = undefined;
          try {
              const lunarYearObj = LunarYear.fromYear(lunarYear);
              leapMonthOfYear = lunarYearObj.getLeapMonth();
              const lunarMonthObj = lunarYearObj.getMonth(lunarMonthRaw);
              monthDayCount = lunarMonthObj?.getDayCount();
          } catch (e) {
              console.warn("Failed to resolve lunar month details", e);
          }
          return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeapMonth, leapMonthOfYear, monthDayCount };
      }
      return {
          year: input.lunarYear,
          month: input.lunarMonth,
          day: input.lunarDay,
          isLeapMonth: input.isLeapMonth
      };
  })();

  if (lunarObj) {
      yearGZ = lunarObj.getYearInGanZhiExact ? lunarObj.getYearInGanZhiExact() : lunarObj.getYearInGanZhi();
      monthGZ = lunarObj.getMonthInGanZhiExact ? lunarObj.getMonthInGanZhiExact() : lunarObj.getMonthInGanZhi();
      dayGZ = lunarObj.getDayInGanZhiExact ? lunarObj.getDayInGanZhiExact() : lunarObj.getDayInGanZhi();
      hourGZ = lunarObj.getTimeInGanZhi();

      try {
          const eightChar = lunarObj.getEightChar();
          // Align with providerSect for consistency across boundary rules.
          eightChar.setSect(providerSect);

          const dayGanStr = eightChar.getDayGan(); 
          const dayMaster = dayGanStr;
          const dayMasterWuXing = WU_XING_GAN[dayMaster] || '';
          const yearZhiStr = eightChar.getYearZhi();
          const dayZhiStr = eightChar.getDayZhi();
          const yearXun = lunarObj.getYearXunExact ? lunarObj.getYearXunExact() : lunarObj.getYearXun();
          const monthXun = lunarObj.getMonthXunExact ? lunarObj.getMonthXunExact() : lunarObj.getMonthXun();
          const dayXun = lunarObj.getDayXunExact ? lunarObj.getDayXunExact() : lunarObj.getDayXun();
          const hourXun = lunarObj.getTimeXun ? lunarObj.getTimeXun() : '';
          const yearXunKong = lunarObj.getYearXunKongExact ? lunarObj.getYearXunKongExact() : lunarObj.getYearXunKong();
          const monthXunKong = lunarObj.getMonthXunKongExact ? lunarObj.getMonthXunKongExact() : lunarObj.getMonthXunKong();
          const dayXunKong = lunarObj.getDayXunKongExact ? lunarObj.getDayXunKongExact() : lunarObj.getDayXunKong();
          const hourXunKong = lunarObj.getTimeXunKong ? lunarObj.getTimeXunKong() : '';

          const createPillar = (
              name: string,
              ganStr: string,
              zhiStr: string,
              nayin: string,
              xun: string,
              kongwang: string
          ): BaZiPillar => {
              const hiddenStemsList = HIDDEN_STEMS[zhiStr] || [];
              const hiddenStems = hiddenStemsList.map(hChar => ({
                  char: hChar,
                  wuxing: WU_XING_GAN[hChar] || '',
                  shishen: getTenGod(dayMaster, hChar)
              }));

              return {
                  name,
                  gan: {
                      char: ganStr,
                      wuxing: WU_XING_GAN[ganStr] || '',
                      shishen: name !== '日柱' ? getTenGod(dayMaster, ganStr) : '日主'
                  },
                  xun,
                  zhi: {
                      char: zhiStr,
                      wuxing: WU_XING_ZHI[zhiStr] || '',
                      hidden: hiddenStems
                  },
                  nayin,
                  kongwang,
                  changsheng: getChangSheng(dayMaster, zhiStr),
                  shensha: getShenSha(dayMaster, dayZhiStr, yearZhiStr, zhiStr, ganStr),
                  selfSeat: getSelfSeat(ganStr, zhiStr)
              };
          };

          const daYunList: BaZiDaYun[] = [];
          let startYunAge = 0;
          let startYunDateStr = '';

          const padYmd = (value: number) => value.toString().padStart(2, '0');
          const formatYmd = (year: number, month: number, day: number) => {
              return `${year}-${padYmd(month)}-${padYmd(day)}`;
          };

          try {
              if (trueSolarDate) {
                  const solarTime = SolarTime.fromYmdHms(
                      trueSolarDate.getFullYear(),
                      trueSolarDate.getMonth() + 1,
                      trueSolarDate.getDate(),
                      trueSolarDate.getHours(),
                      trueSolarDate.getMinutes(),
                      trueSolarDate.getSeconds()
                  );
                  const gender = input.gender === 'male' ? Gender.MAN : Gender.WOMAN;
                  const childLimit = ChildLimit.fromSolarTime(solarTime, gender);
                  let decadeFortune = childLimit.getStartDecadeFortune();
                  startYunAge = decadeFortune.getStartAge();

                  const startTime = childLimit.getEndTime();
                  startYunDateStr = formatYmd(startTime.getYear(), startTime.getMonth(), startTime.getDay());

                  for (let i = 0; i < 10; i++) {
                      const startAge = decadeFortune.getStartAge();
                      if (startAge > 110) break;

                      const gz = decadeFortune.getSixtyCycle().toString();
                      if (!gz || gz.length < 2) {
                          decadeFortune = decadeFortune.next(1);
                          continue;
                      }

                      const ganChar = gz.charAt(0);
                      const zhiChar = gz.charAt(1);

                      const hiddenStemsList = HIDDEN_STEMS[zhiChar] || [];
                      const hiddenStems = hiddenStemsList.map(hChar => ({
                          char: hChar,
                          wuxing: WU_XING_GAN[hChar] || '',
                          shishen: getTenGod(dayMaster, hChar)
                      }));

                      daYunList.push({
                          startAge: startAge,
                          endAge: decadeFortune.getEndAge(),
                          startYear: decadeFortune.getStartSixtyCycleYear().getYear(),
                          endYear: decadeFortune.getEndSixtyCycleYear().getYear(),
                          gan: {
                              char: ganChar,
                              wuxing: WU_XING_GAN[ganChar] || '',
                              shishen: getTenGod(dayMaster, ganChar)
                          },
                          zhi: {
                              char: zhiChar,
                              wuxing: WU_XING_ZHI[zhiChar] || '',
                              shishen: '',
                              hidden: hiddenStems
                          }
                      });

                      decadeFortune = decadeFortune.next(1);
                  }
              }
          } catch (e) {
              console.warn("Tyme4ts DaYun calculation failed, falling back to lunar-javascript", e);
          }

          if (daYunList.length === 0) {
              const yun = eightChar.getYun(input.gender === 'male' ? 1 : 0);
              const daYunArr = yun.getDaYun() || [];

              if (daYunArr.length > 0) {
                  startYunAge = daYunArr[0].getStartAge();
                  const startSolar = yun.getStartSolar();
                  startYunDateStr = startSolar.toYmd();
              }

              for (let i = 0; i < daYunArr.length; i++) {
                  const dy = daYunArr[i];
                  const startAge = dy.getStartAge();
                  if (startAge > 110) break;

                  const gz = dy.getGanZhi();
                  if (!gz || gz.length < 2) continue;

                  const ganChar = gz.charAt(0);
                  const zhiChar = gz.charAt(1);

                  const hiddenStemsList = HIDDEN_STEMS[zhiChar] || [];
                  const hiddenStems = hiddenStemsList.map(hChar => ({
                      char: hChar,
                      wuxing: WU_XING_GAN[hChar] || '',
                      shishen: getTenGod(dayMaster, hChar)
                  }));

                  daYunList.push({
                      startAge: startAge,
                      endAge: dy.getEndAge(),
                      startYear: dy.getStartYear(),
                      endYear: dy.getEndYear(),
                      gan: {
                          char: ganChar,
                          wuxing: WU_XING_GAN[ganChar] || '',
                          shishen: getTenGod(dayMaster, ganChar)
                      },
                      zhi: {
                          char: zhiChar,
                          wuxing: WU_XING_ZHI[zhiChar] || '',
                          shishen: '',
                          hidden: hiddenStems
                      }
                  });
              }
          }

          const pillars = [
              createPillar('年柱', eightChar.getYearGan(), eightChar.getYearZhi(), eightChar.getYearNaYin(), yearXun, yearXunKong),
              createPillar('月柱', eightChar.getMonthGan(), eightChar.getMonthZhi(), eightChar.getMonthNaYin(), monthXun, monthXunKong),
              createPillar('日柱', eightChar.getDayGan(), eightChar.getDayZhi(), eightChar.getDayNaYin(), dayXun, dayXunKong),
              createPillar('时柱', eightChar.getTimeGan(), eightChar.getTimeZhi(), eightChar.getTimeNaYin(), hourXun, hourXunKong),
          ];
          const fiveElementsCount = buildFiveElementsCount(pillars);
          const relations = buildRelations(pillars);
          const strengthInfo = computeDayMasterStrength(dayMasterWuXing, fiveElementsCount);
          const sizhu = pillars.map((pillar) => `${pillar.gan.char}${pillar.zhi.char}`).join(' ');
          const shenList = getShen(sizhu, input.gender === 'male' ? 1 : 0);
          const shenSha = {
              year: shenList?.[0] || [],
              month: shenList?.[1] || [],
              day: shenList?.[2] || [],
              hour: shenList?.[3] || [],
              ruleVersion: 'cantian-tymext@0.0.21'
          };
          const mergeShenSha = (base: string[], extra: string[]) => {
              return Array.from(new Set([...(base || []), ...(extra || [])]));
          };
          pillars[0].shensha = mergeShenSha(pillars[0].shensha, shenSha.year);
          pillars[1].shensha = mergeShenSha(pillars[1].shensha, shenSha.month);
          pillars[2].shensha = mergeShenSha(pillars[2].shensha, shenSha.day);
          pillars[3].shensha = mergeShenSha(pillars[3].shensha, shenSha.hour);

          let taiYuan = '';
          let taiXi = '';
          let mingGong = '';
          let shenGong = '';
          try {
              if (trueSolarDate) {
                  const tymeSolarTime = SolarTime.fromYmdHms(
                      trueSolarDate.getFullYear(),
                      trueSolarDate.getMonth() + 1,
                      trueSolarDate.getDate(),
                      trueSolarDate.getHours(),
                      trueSolarDate.getMinutes(),
                      trueSolarDate.getSeconds()
                  );
                  const tymeEightChar = tymeSolarTime.getLunarHour().getEightChar();
                  taiYuan = tymeEightChar.getFetalOrigin().toString();
                  taiXi = tymeEightChar.getFetalBreath().toString();
                  mingGong = tymeEightChar.getOwnSign().toString();
                  shenGong = tymeEightChar.getBodySign().toString();
              }
          } catch (e) {
              console.warn("Failed to calculate fetal/origin signs", e);
          }

          const solarTimeEnabled = Boolean(trueSolarDate);
          const hourBranchBefore = getChineseTimeLabel(
              calculateTimeIndex(input.birthHour, input.birthMinute, 120)
          );
          const hourBranchAfter = getChineseTimeLabel(
              calculateTimeIndex(input.birthHour, input.birthMinute, input.longitude)
          );
          const correctedDateTime = trueSolarDate ? formatDateTime(trueSolarDate) : '';
          const longitudeCorrectionMinutes = solarTimeOffsetMinutes;
          const equationOfTimeMinutes: number | null = null;
          const totalOffsetMinutes = longitudeCorrectionMinutes + (equationOfTimeMinutes ?? 0);
          const solarDateForTerms = trueSolarDate
              ? `${trueSolarDate.getFullYear()}-${pad2(trueSolarDate.getMonth() + 1)}-${pad2(trueSolarDate.getDate())}`
              : input.solarDate;
          const termRange = getSolarTermRange(solarDateForTerms);
          const jieQiTable = lunarObj.getJieQiTable?.();
          const liChunSolar = jieQiTable?.['立春'];
          const liChunInfo = liChunSolar && liChunSolar.toYmdHms
              ? { name: '立春', datetime: liChunSolar.toYmdHms() }
              : undefined;

          const baziMeta: BaZiMeta = {
              timezone,
              calendarRule,
              solarTime: {
                  timezone,
                  enabled: solarTimeEnabled,
                  type: 'localMeanSolarTime',
                  longitudeCorrectionMinutes,
                  equationOfTimeMinutes,
                  totalOffsetMinutes,
                  correctedDatetime: correctedDateTime,
                  hourBranchBefore,
                  hourBranchAfter,
                  longitude: input.longitude,
                  latitude: input.latitude,
                  longitudeSource: 'input',
                  dayBoundaryRule: calendarRule.dayBoundary
              },
              solarTimeEnabled,
              shenShaRuleVersion: 'cantian-tymext@0.0.21',
              providerSect,
              dayBoundary,
              solarTerms: {
                  liChun: liChunInfo,
                  monthStart: termRange?.start && termRange?.startName ? { name: termRange.startName, datetime: termRange.start } : undefined,
                  monthEnd: termRange?.end && termRange?.endName ? { name: termRange.endName, datetime: termRange.end } : undefined,
                  currentJieQi: lunarObj.getJieQi?.() || undefined
              },
              lunarDateDetail
          };

              baziChart = {
                  dayMaster,
                  dayMasterWuXing,
                  taiYuan,
                  taiXi,
                  mingGong,
                  shenGong,
                  providerSect,
                  dayBoundary,
                  startYunAge,
                  startYunDate: startYunDateStr,
                  pillars,
                  daYun: daYunList,
                  fiveElementsCount,
              relations,
              meta: baziMeta,
              shenSha,
              dayMasterStrength: strengthInfo.strength,
              favorableElements: strengthInfo.favorable,
              unfavorableElements: strengthInfo.unfavorable,
              analysisNotes: 'dayMasterStrength uses simple_wuxing_balance; usefulGod and pattern not computed'
          };

      } catch (e) {
          console.warn("Failed to generate detailed BaZi", e);
      }
  } else {
      const parts = astrolabe.chineseDate.trim().split(/\s+/);
      const stripUnit = (str: string) => str && str.length > 0 ? str.substring(0, str.length - 1) : '';
      yearGZ = stripUnit(parts[0]);
      monthGZ = stripUnit(parts[1]);
      dayGZ = stripUnit(parts[2]);
      hourGZ = stripUnit(parts[3]);
  }

  let horoscopeData: Horoscope | undefined = undefined;

  if (input.focusDate) {
    try {
        const flow = astrolabe.horoscope(input.focusDate);
        const termRange = getSolarTermRange(input.focusDate);

        const mapFlowLayer = (layer: any): FlowLayer => {
             const flowPalaces: Record<number, Star[]> = {};
             const flowPalaceNames: Record<number, string> = {};
             let lifePalaceIndex = -1;
             
             if (layer && Array.isArray(layer.palaces)) {
                 layer.palaces.forEach((p: any) => {
                     if (p) {
                         if (p.name) {
                             flowPalaceNames[p.index] = p.name;
                             if (p.name === '命宫' || p.name.includes('命')) {
                                 lifePalaceIndex = p.index;
                             }
                         }
                         if (Array.isArray(p.stars)) {
                            const stars = p.stars.map((s: any) => ({
                                name: s.name,
                                type: 'other',
                                brightness: s.brightness,
                                mutagen: s.mutagen 
                            }));
                            flowPalaces[p.index] = stars;
                         }
                     }
                 });
             }
             
             if (lifePalaceIndex === -1 && layer.index !== undefined) {
                 lifePalaceIndex = layer.index;
             }

             if (lifePalaceIndex !== -1) {
                 const baseNames = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
                 baseNames.forEach((name, seqIdx) => {
                     const targetIndex = (lifePalaceIndex - seqIdx + 12) % 12;
                     if (!flowPalaceNames[targetIndex]) {
                         flowPalaceNames[targetIndex] = name;
                     }
                 });
             }

             return {
                 index: lifePalaceIndex,
                 heavenlyStem: layer?.heavenlyStem ?? '',
                 earthlyBranch: layer?.earthlyBranch ?? '',
                 palaces: flowPalaces,
                 palaceNames: flowPalaceNames
             };
        };

        if (flow) {
            horoscopeData = {
                solarDate: input.focusDate,
                lunarDate: flow.lunarDate ?? '',
                year: mapFlowLayer(flow.yearly),
                month: mapFlowLayer(flow.monthly),
                yearSiHua: getSiHua(flow.yearly.heavenlyStem),
                monthSiHua: getSiHua(flow.monthly.heavenlyStem),
                monthRange: termRange
            };
        }
    } catch (e) {
        console.warn("Failed to generate horoscope data", e);
    }
  }

  if (baziChart && input.focusDate) {
      try {
          const [fy, fm, fd] = input.focusDate.split('-').map(Number);
          const flowSolar = Solar.fromYmd(fy, fm, fd);
          const flowLunar = flowSolar.getLunar();
          const flowYear = flowLunar.getYearInGanZhiExact ? flowLunar.getYearInGanZhiExact() : flowLunar.getYearInGanZhi();
          const flowMonth = flowLunar.getMonthInGanZhiExact ? flowLunar.getMonthInGanZhiExact() : flowLunar.getMonthInGanZhi();
          const flowDay = flowLunar.getDayInGanZhiExact ? flowLunar.getDayInGanZhiExact() : flowLunar.getDayInGanZhi();

          const flowRelationsRaw = calculateRelation({
              '年': { 天干: baziChart.pillars[0].gan.char, 地支: baziChart.pillars[0].zhi.char },
              '月': { 天干: baziChart.pillars[1].gan.char, 地支: baziChart.pillars[1].zhi.char },
              '日': { 天干: baziChart.pillars[2].gan.char, 地支: baziChart.pillars[2].zhi.char },
              '时': { 天干: baziChart.pillars[3].gan.char, 地支: baziChart.pillars[3].zhi.char },
              '流年': { 天干: flowYear[0], 地支: flowYear[1] },
              '流月': { 天干: flowMonth[0], 地支: flowMonth[1] }
          });

          const flowRelations = normalizeRelations(flowRelationsRaw as Record<string, unknown>, {
              '年': 'year',
              '月': 'month',
              '日': 'day',
              '时': 'hour',
              '流年': 'flowYear',
              '流月': 'flowMonth'
          });

          baziChart.flow = {
              yearGanzhi: flowYear,
              monthGanzhi: flowMonth,
              dayGanzhi: flowDay,
              relations: flowRelations
          };
      } catch (e) {
          console.warn("Failed to calculate BaZi flow", e);
      }
  }

  const mutagenMap = {
      origin: originMutagenMap,
      decadal: decadalMutagenMaps,
      currentDecadal,
      yearly: horoscopeData?.yearSiHua ? buildMutagenMapFromPalaces(palaces, horoscopeData.yearSiHua) : undefined,
      monthly: horoscopeData?.monthSiHua ? buildMutagenMapFromPalaces(palaces, horoscopeData.monthSiHua) : undefined
  };

  return {
    palaces,
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    timeIndex,
    rawDates: {
      lunarYear: lunarDateDetail.year,
      lunarMonth: lunarDateDetail.month,
      lunarDay: lunarDateDetail.day,
      isLeap: lunarDateDetail.isLeapMonth,
    },
    fourPillars: {
      year: yearGZ,
      month: monthGZ,
      day: dayGZ,
      hour: hourGZ,
    },
    bazi: baziChart,
    time: astrolabe.time,
    timeRange: astrolabe.timeRange,
    sign: astrolabe.sign,
    zodiac: astrolabe.zodiac,
    soul: astrolabe.soul, 
    body: astrolabe.body,
    fiveElementsClass: astrolabe.fiveElementsClass,
    gender: input.gender === 'male' ? 'Male' : 'Female',
    originalGender: input.gender === 'male' ? '乾造' : '坤造',
    horoscope: horoscopeData,
    mutagenMap,
    starCatalog,
    annualAgeMapping,
    meta: astrolabeMeta,
    longitude: input.longitude,
    latitude: input.latitude,
    birthHour: input.birthHour,
    birthMinute: input.birthMinute
  };
};

export const formatChartAsText = (astrolabe: Astrolabe): string => {
  const getDisplayWidth = (str: string) => {
    let len = 0;
    for (let i = 0; i < str.length; i++) {
        len += str.charCodeAt(i) > 255 ? 2 : 1;
    }
    return len;
  };

  const padRight = (str: string, length: number) => {
    const len = getDisplayWidth(str);
    const padLen = Math.max(0, length - len);
    return str + ' '.repeat(padLen);
  };

  const padZero = (n: number) => n.toString().padStart(2, '0');

  let text = `【紫微斗数排盘 | Zi Wei Dou Shu Chart】\n`;
  text += `------------------------------------------------\n`;
  text += `性别 (Gender): ${astrolabe.originalGender} (${astrolabe.gender})\n`;
  if (astrolabe.meta) {
      const meta = astrolabe.meta;
      text += `规则版本: ${meta.ruleVersion} | 星曜表: ${meta.starCatalogVersion || ''}\n`;
  }
  const minuteStr = astrolabe.birthMinute !== undefined ? padZero(astrolabe.birthMinute) : '00';
  text += `阳历 (Solar):  ${astrolabe.solarDate} ${astrolabe.birthHour}:${minuteStr} (${astrolabe.time})\n`;
  text += `农历 (Lunar):  ${astrolabe.lunarDate}\n`;
  text += `八字 (BaZi):   ${astrolabe.fourPillars.year}年 ${astrolabe.fourPillars.month}月 ${astrolabe.fourPillars.day}日 ${astrolabe.fourPillars.hour}时\n`;
  
  if (astrolabe.bazi) {
      const b = astrolabe.bazi;
      const shenShaByPillar = b.shenSha
          ? [b.shenSha.year, b.shenSha.month, b.shenSha.day, b.shenSha.hour]
          : b.pillars.map((p) => p.shensha);
      text += `------------------------------------------------\n`;
      text += `【八字命盘】\n`;
      text += `      年柱     月柱     日柱     时柱\n`;
      text += `十神: ${padRight(b.pillars[0].gan.shishen || '', 8)} ${padRight(b.pillars[1].gan.shishen || '', 8)} ${padRight('日主', 8)} ${padRight(b.pillars[3].gan.shishen || '', 8)}\n`;
      text += `天干: ${padRight(b.pillars[0].gan.char, 8)} ${padRight(b.pillars[1].gan.char, 8)} ${padRight(b.pillars[2].gan.char, 8)} ${padRight(b.pillars[3].gan.char, 8)}\n`;
      text += `地支: ${padRight(b.pillars[0].zhi.char, 8)} ${padRight(b.pillars[1].zhi.char, 8)} ${padRight(b.pillars[2].zhi.char, 8)} ${padRight(b.pillars[3].zhi.char, 8)}\n`;
      
      const getHiddenStr = (p: BaZiPillar) => {
          return p.zhi.hidden.map(h => `${h.char}${h.shishen}`).join(' ');
      };
      
      text += `藏干: ${padRight(getHiddenStr(b.pillars[0]), 8)} ${padRight(getHiddenStr(b.pillars[1]), 8)} ${padRight(getHiddenStr(b.pillars[2]), 8)} ${padRight(getHiddenStr(b.pillars[3]), 8)}\n`;
      text += `纳音: ${padRight(b.pillars[0].nayin, 8)} ${padRight(b.pillars[1].nayin, 8)} ${padRight(b.pillars[2].nayin, 8)} ${padRight(b.pillars[3].nayin, 8)}\n`;
      text += `长生: ${padRight(b.pillars[0].changsheng, 8)} ${padRight(b.pillars[1].changsheng, 8)} ${padRight(b.pillars[2].changsheng, 8)} ${padRight(b.pillars[3].changsheng, 8)}\n`;
      text += `神煞: ${padRight(shenShaByPillar[0].join(','), 8)} ${padRight(shenShaByPillar[1].join(','), 8)} ${padRight(shenShaByPillar[2].join(','), 8)} ${padRight(shenShaByPillar[3].join(','), 8)}\n`;
      text += `旬:   ${padRight(b.pillars[0].xun || '', 8)} ${padRight(b.pillars[1].xun || '', 8)} ${padRight(b.pillars[2].xun || '', 8)} ${padRight(b.pillars[3].xun || '', 8)}\n`;
      text += `空亡: ${padRight(b.pillars[0].kongwang, 8)} ${padRight(b.pillars[1].kongwang, 8)} ${padRight(b.pillars[2].kongwang, 8)} ${padRight(b.pillars[3].kongwang, 8)}\n`;
      text += `自坐: ${padRight(b.pillars[0].selfSeat || '', 8)} ${padRight(b.pillars[1].selfSeat || '', 8)} ${padRight(b.pillars[2].selfSeat || '', 8)} ${padRight(b.pillars[3].selfSeat || '', 8)}\n`;

      if (b.taiYuan || b.taiXi || b.mingGong || b.shenGong) {
          text += `胎元: ${b.taiYuan || ''}  胎息: ${b.taiXi || ''}  命宫: ${b.mingGong || ''}  身宫: ${b.shenGong || ''}\n`;
      }
      if (b.providerSect || b.dayBoundary) {
          text += `口径: providerSect=${b.providerSect ?? ''} dayBoundary=${b.dayBoundary ?? ''}\n`;
      }
      
      text += `\n【大运 (Decadal Luck)】 (起运: ${b.startYunAge}岁 ${b.startYunDate ? '| '+b.startYunDate : ''})\n`;
      b.daYun.forEach((dy, i) => {
          const hiddenStr = dy.zhi.hidden.map(h => h.char).join('');
          text += `${dy.startAge}-${dy.endAge}岁: ${dy.gan.char}${dy.zhi.char} [${dy.gan.shishen}] {${hiddenStr}}\n`;
      });
  }

  if (astrolabe.longitude !== undefined) {
      let locStr = `经度 ${astrolabe.longitude}°`;
      if (astrolabe.latitude !== undefined) locStr += `, 纬度 ${astrolabe.latitude}°`;
      text += `地点 (Loc):    ${locStr}\n`;
      const meta = astrolabe.bazi?.meta;
      if (meta?.solarTime) {
          const ts = meta.solarTime;
          const typeLabel = ts.type === 'localMeanSolarTime' ? '地方平太阳时' : ts.type;
          text += `太阳时: ${ts.correctedDatetime} | 类型 ${typeLabel} | 经度校正 ${ts.longitudeCorrectionMinutes} 分钟`;
          if (ts.equationOfTimeMinutes !== null && ts.equationOfTimeMinutes !== undefined) {
              text += ` | 均时差 ${ts.equationOfTimeMinutes} 分钟`;
          }
          text += ` | 总偏移 ${ts.totalOffsetMinutes} 分钟\n`;
          text += `校正时辰: ${ts.hourBranchBefore} -> ${ts.hourBranchAfter}\n`;
          text += `口径: sect=${meta.calendarRule.sect}, dayBoundary=${meta.calendarRule.dayBoundary}, yearRule=${meta.calendarRule.yearPillarRule}, monthRule=${meta.calendarRule.monthPillarRule}\n`;
      }
  }
  
  const getPalaceInfo = (idx: number) => {
      const p = astrolabe.palaces.find(p => p.index === idx);
      if (!p) return 'Unknown';
      return `${p.name} [${p.earthlyBranch}]`;
  };

  if (astrolabe.horoscope) {
      const h = astrolabe.horoscope;
      text += `\n【流运设定 (Flow Rules)】\n`;
      text += `焦点日期 (Focus Date): ${h.solarDate} (UTC+8)\n`;
      text += `起法规则: 流年按立春交节(Solar Terms), 流月按节气(Solar Terms)\n`;
      text += `------------------------------------------------\n`;
      
      const yearLifeLoc = getPalaceInfo(h.year.index);
      text += `流年 (Year): ${h.year.heavenlyStem}${h.year.earthlyBranch}年 [命宫在 ${yearLifeLoc}]\n`;
      if (h.yearSiHua) {
          text += `  流年四化: 禄-${h.yearSiHua.lu}, 权-${h.yearSiHua.quan}, 科-${h.yearSiHua.ke}, 忌-${h.yearSiHua.ji}\n`;
      }
      
      const monthLifeLoc = getPalaceInfo(h.month.index);
      text += `流月 (Month): ${h.month.heavenlyStem}${h.month.earthlyBranch}月 [命宫在 ${monthLifeLoc}]\n`;
      if (h.monthSiHua) {
          text += `  流月四化: 禄-${h.monthSiHua.lu}, 权-${h.monthSiHua.quan}, 科-${h.monthSiHua.ke}, 忌-${h.monthSiHua.ji}\n`;
      }
      
      if (h.monthRange?.start) {
        text += `  流月范围: 起于 ${h.monthRange.startName} (${h.monthRange.start})\n`;
        text += `            止于 ${h.monthRange.endName} (${h.monthRange.end})\n`;
        text += `            (注: 以上为北京时间 UTC+8 交节时刻)\n`;
      } else {
        text += `  流月范围: 请参考万年历节气交接日\n`;
      }

      text += `\n【流运对照表 (Flow Palace Cross-Reference)】\n`;
      text += `--------------------------------------------------------\n`;
      text += `地支 (Branch)| 本命 (Original) | 流年 (Year) | 流月 (Month)\n`;
      text += `--------------------------------------------------------\n`;
      
      const sortedForMap = [...astrolabe.palaces].sort((a, b) => a.index - b.index);
      sortedForMap.forEach(p => {
        const branchName = `[${p.earthlyBranch}]`;
        const originalName = p.name;
        const cleanName = (n: string) => n.replace('流年', '').replace('流月', '').replace('宫', '');
        
        const yearName = h.year.palaceNames[p.index] ? cleanName(h.year.palaceNames[p.index]) : '--';
        const monthName = h.month.palaceNames[p.index] ? cleanName(h.month.palaceNames[p.index]) : '--';
        
        text += `${padRight(branchName, 8)}| ${padRight(originalName, 10)}| ${padRight(yearName, 10)}| ${monthName}\n`;
      });
      text += `--------------------------------------------------------\n`;
  }

  const formatMutagenEntries = (entries: MutagenMapEntry[]) => {
      if (!entries || entries.length === 0) return '--';
      return entries.map((entry) => `${entry.star}@${entry.palaceName}`).join('、');
  };

  if (astrolabe.mutagenMap?.origin) {
      text += `\n【四化落点 (Mutagen Map)】\n`;
      const origin = astrolabe.mutagenMap.origin;
      text += `本命: 禄-${formatMutagenEntries(origin.lu)} 权-${formatMutagenEntries(origin.quan)} 科-${formatMutagenEntries(origin.ke)} 忌-${formatMutagenEntries(origin.ji)}\n`;
      if (astrolabe.mutagenMap.decadal?.length) {
          const currentRange = astrolabe.mutagenMap.currentDecadal?.range;
          const currentAge = astrolabe.mutagenMap.currentDecadal?.age;
          astrolabe.mutagenMap.decadal.forEach((decadal) => {
              const map = decadal.map;
              const marker = decadal.range === currentRange ? '*' : '';
              const ageInfo = decadal.range === currentRange && currentAge !== undefined ? ` 年龄${currentAge}` : '';
              text += `大限${marker}(${decadal.range}${ageInfo}): 禄-${formatMutagenEntries(map.lu)} 权-${formatMutagenEntries(map.quan)} 科-${formatMutagenEntries(map.ke)} 忌-${formatMutagenEntries(map.ji)}\n`;
          });
      }
      if (astrolabe.mutagenMap.yearly) {
          const yearly = astrolabe.mutagenMap.yearly;
          text += `流年: 禄-${formatMutagenEntries(yearly.lu)} 权-${formatMutagenEntries(yearly.quan)} 科-${formatMutagenEntries(yearly.ke)} 忌-${formatMutagenEntries(yearly.ji)}\n`;
      }
      if (astrolabe.mutagenMap.monthly) {
          const monthly = astrolabe.mutagenMap.monthly;
          text += `流月: 禄-${formatMutagenEntries(monthly.lu)} 权-${formatMutagenEntries(monthly.quan)} 科-${formatMutagenEntries(monthly.ke)} 忌-${formatMutagenEntries(monthly.ji)}\n`;
      }
  }

  text += `\n`;
  text += `五行局 (Element): ${astrolabe.fiveElementsClass}\n`;
  text += `命主 (Ming Zhu):  ${astrolabe.soul}\n`;
  text += `身主 (Shen Zhu):  ${astrolabe.body}\n`;
  text += `------------------------------------------------\n\n`;

  const sortedPalaces = [...astrolabe.palaces].sort((a, b) => a.index - b.index);

  sortedPalaces.forEach(p => {
    const palaceName = p.name;
    const stemBranch = `${p.heavenlyStem}${p.earthlyBranch}`;
    const labels = [];
    
    if (p.isOriginalPalace && (p.name === '命宫' || p.name.includes('命'))) labels.push("【本命】");
    if (p.isBodyPalace) labels.push("【身宫】");

    if (astrolabe.horoscope) {
        const yearPName = astrolabe.horoscope.year.palaceNames[p.index];
        const monthPName = astrolabe.horoscope.month.palaceNames[p.index];

        if (yearPName && (yearPName.includes('命') || yearPName === '命宫')) labels.push(`<流年命宫>`);
        if (monthPName && (monthPName.includes('命') || monthPName === '命宫')) labels.push(`<流月命宫>`);
    }
    
    text += `${palaceName} [${stemBranch}] ${labels.join('')}\n`;
    text += `  大限 (Decadal): ${p.decadal.range} | 宫干: ${p.heavenlyStem}\n`;
    
    const formatStar = (s: Star) => {
       let str = s.name;
       if (s.mutagen) str += `[${s.mutagen}]`;
       
       const flowTags = [];
       if (astrolabe.horoscope?.yearSiHua) {
           if (s.name === astrolabe.horoscope.yearSiHua.lu) flowTags.push('年禄');
           if (s.name === astrolabe.horoscope.yearSiHua.quan) flowTags.push('年权');
           if (s.name === astrolabe.horoscope.yearSiHua.ke) flowTags.push('年科');
           if (s.name === astrolabe.horoscope.yearSiHua.ji) flowTags.push('年忌');
       }
       if (astrolabe.horoscope?.monthSiHua) {
           if (s.name === astrolabe.horoscope.monthSiHua.lu) flowTags.push('月禄');
           if (s.name === astrolabe.horoscope.monthSiHua.quan) flowTags.push('月权');
           if (s.name === astrolabe.horoscope.monthSiHua.ke) flowTags.push('月科');
           if (s.name === astrolabe.horoscope.monthSiHua.ji) flowTags.push('月忌');
       }
       
       if (s.brightness) str += `(${s.brightness})`;
       if (flowTags.length > 0) str += `{${flowTags.join(',')}}`;
       return str;
    };

    const major = p.majorStars.map(formatStar).join('  ');
    const minor = p.minorStars.map(formatStar).join('  ');
    const adjective = p.adjectiveStars.map(formatStar).join('  '); 
    
    text += `  主星 (Major): ${major || '--'}\n`;
    text += `  辅星 (Minor): ${minor || '--'}\n`;
    text += `  杂曜 (Mini):  ${adjective || '--'}\n`; 
    if (p.isEmptyPalace && p.borrowFromPalace) {
        const borrowed = (p.borrowedMajorStars || []).map(formatStar).join('  ');
        text += `  空宫借星: 对宫 ${p.borrowFromPalace.fromPalaceName} | 主星 ${borrowed || '--'}\n`;
    }
    if (p.surrounding) {
        const trines = p.surrounding.trinePalaces || p.surrounding.trine;
        const opposite = p.surrounding.oppositePalace || p.surrounding.opposite;
        const fourRect = p.surrounding.fourRectificationPalaces || p.surrounding.fourRectification;
        text += `  三方四正: 对宫 ${opposite.name} | 三方 ${trines.map(t => t.name).join('、')} | 四正 ${fourRect.map(t => t.name).join('、')}\n`;
    }

    if (astrolabe.horoscope) {
        const mStars = astrolabe.horoscope.month.palaces[p.index] || [];
        const flowStarsList = mStars.map(s => {
             let n = s.name;
             if (s.mutagen) n += `[流${s.mutagen}]`;
             return n;
        }).join(' ');
        if (flowStarsList) text += `  流曜 (Flow):  ${flowStarsList}\n`;
    }

    text += `  长生12: ${p.changsheng12}\n`;
    text += `  博士12: ${p.boshi12}\n`;
    text += `  岁前12: ${p.suiqian12}\n`;
    text += `  将前12: ${p.jiangqian12}\n`;
    text += `\n`;
  });

  return text;
};
