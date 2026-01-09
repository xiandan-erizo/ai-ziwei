import { astro } from 'iztro';
import { Solar, Lunar } from 'lunar-javascript';
import { ChildLimit, Gender, SolarTime } from 'tyme4ts';
import { Astrolabe, Palace, Star, UserInput, FlowLayer, Horoscope, SiHua, BaZiChart, BaZiPillar, BaZiDaYun } from '../types';

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

  if (input.calendarType === 'lunar') {
    const dateStr = `${input.lunarYear}-${input.lunarMonth}-${input.lunarDay}`;
    astrolabe = astro.byLunar(dateStr, timeIndex, input.gender, input.isLeapMonth, true, 'zh-CN');
    
    // For BaZi with True Solar Time, we need to convert Lunar to Solar, then adjust for longitude
    const solarFromLunar = Solar.fromLunar(Lunar.fromYmd(input.lunarYear, input.lunarMonth, input.lunarDay));
    const [y, m, d] = [solarFromLunar.getYear(), solarFromLunar.getMonth(), solarFromLunar.getDay()];
    
    // Calculate True Solar Time for BaZi Generation
    // Beijing Time is GMT+8 (120 deg). 1 deg = 4 minutes.
    const longitude = input.longitude || 120;
    const offsetMinutes = (longitude - 120) * 4;
    
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
    const longitude = input.longitude || 120;
    const offsetMinutes = (longitude - 120) * 4;
    
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

  const palaces: Palace[] = astrolabe.palaces.map((p: any) => ({
    index: p.index,
    name: p.name,
    isBodyPalace: p.isBodyPalace,
    isOriginalPalace: p.isOriginalPalace,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    majorStars: mapStars(p.majorStars, 'major'),
    minorStars: mapStars(p.minorStars, 'minor'),
    adjectiveStars: mapStars(p.adjectiveStars, 'adjective'),
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
    decadal: {
      range: `${p.decadal.range[0]} - ${p.decadal.range[1]}`,
      heavenlyStem: p.decadal.heavenlyStem,
      earthlyBranch: p.decadal.earthlyBranch,
    },
    ages: p.ages
  }));

  let yearGZ = '', monthGZ = '', dayGZ = '', hourGZ = '';
  let baziChart: BaZiChart | undefined = undefined;

  if (lunarObj) {
      yearGZ = lunarObj.getYearInGanZhiExact ? lunarObj.getYearInGanZhiExact() : lunarObj.getYearInGanZhi();
      monthGZ = lunarObj.getMonthInGanZhiExact ? lunarObj.getMonthInGanZhiExact() : lunarObj.getMonthInGanZhi();
      dayGZ = lunarObj.getDayInGanZhiExact ? lunarObj.getDayInGanZhiExact() : lunarObj.getDayInGanZhi();
      hourGZ = lunarObj.getTimeInGanZhi();

      try {
          const eightChar = lunarObj.getEightChar();
          // Use Sect 1 (Standard/Traditional) to align start dates with traditional tools (usually 3 days = 1 year)
          // Also combined with True Solar Time adjustment above for correctness.
          eightChar.setSect(1);

          const dayGanStr = eightChar.getDayGan(); 
          const dayMaster = dayGanStr;
          const dayMasterWuXing = WU_XING_GAN[dayMaster] || '';
          const yearZhiStr = eightChar.getYearZhi();
          const dayZhiStr = eightChar.getDayZhi();

          const createPillar = (name: string, ganStr: string, zhiStr: string, nayin: string, xun: string): BaZiPillar => {
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
                  zhi: {
                      char: zhiStr,
                      wuxing: WU_XING_ZHI[zhiStr] || '',
                      hidden: hiddenStems
                  },
                  nayin,
                  kongwang: xun,
                  changsheng: getChangSheng(dayMaster, zhiStr),
                  shensha: getShenSha(dayMaster, dayZhiStr, yearZhiStr, zhiStr, ganStr)
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

          baziChart = {
              dayMaster,
              dayMasterWuXing,
              startYunAge,
              startYunDate: startYunDateStr,
              pillars: [
                  createPillar('年柱', eightChar.getYearGan(), eightChar.getYearZhi(), eightChar.getYearNaYin(), eightChar.getYearXunKong()),
                  createPillar('月柱', eightChar.getMonthGan(), eightChar.getMonthZhi(), eightChar.getMonthNaYin(), eightChar.getMonthXunKong()),
                  createPillar('日柱', eightChar.getDayGan(), eightChar.getDayZhi(), eightChar.getDayNaYin(), eightChar.getDayXunKong()),
                  createPillar('时柱', eightChar.getTimeGan(), eightChar.getTimeZhi(), eightChar.getTimeNaYin(), eightChar.getTimeXunKong()),
              ],
              daYun: daYunList
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

  return {
    palaces,
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    rawDates: {
      lunarYear: 0,
      lunarMonth: 0,
      lunarDay: 0,
      isLeap: false,
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
  const minuteStr = astrolabe.birthMinute !== undefined ? padZero(astrolabe.birthMinute) : '00';
  text += `阳历 (Solar):  ${astrolabe.solarDate} ${astrolabe.birthHour}:${minuteStr} (${astrolabe.time})\n`;
  text += `农历 (Lunar):  ${astrolabe.lunarDate}\n`;
  text += `八字 (BaZi):   ${astrolabe.fourPillars.year}年 ${astrolabe.fourPillars.month}月 ${astrolabe.fourPillars.day}日 ${astrolabe.fourPillars.hour}时\n`;
  
  if (astrolabe.bazi) {
      const b = astrolabe.bazi;
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
      text += `神煞: ${padRight(b.pillars[0].shensha.join(','), 8)} ${padRight(b.pillars[1].shensha.join(','), 8)} ${padRight(b.pillars[2].shensha.join(','), 8)} ${padRight(b.pillars[3].shensha.join(','), 8)}\n`;
      text += `空亡: ${padRight(b.pillars[0].kongwang, 8)} ${padRight(b.pillars[1].kongwang, 8)} ${padRight(b.pillars[2].kongwang, 8)} ${padRight(b.pillars[3].kongwang, 8)}\n`;
      
      text += `\n【大运 (Decadal Luck)】 (起运: ${b.startYunAge}岁 ${b.startYunDate ? '| '+b.startYunDate : ''})\n`;
      b.daYun.forEach((dy, i) => {
          const hiddenStr = dy.zhi.hidden.map(h => h.char).join('');
          text += `${dy.startAge}-${dy.endAge}岁: ${dy.gan.char}${dy.zhi.char} [${dy.gan.shishen}] {${hiddenStr}}\n`;
      });
  }

  if (astrolabe.longitude !== undefined) {
      let locStr = `经度 ${astrolabe.longitude}°`;
      if (astrolabe.latitude !== undefined) locStr += `, 纬度 ${astrolabe.latitude}°`;
      text += `地点 (Loc):    ${locStr} (真太阳时 True Solar Time)\n`;
  }
  
  const getPalaceInfo = (idx: number) => {
      const p = astrolabe.palaces.find(p => p.index === idx);
      if (!p) return 'Unknown';
      return `${p.name} [${p.earthlyBranch}]`;
  };

  if (astrolabe.horoscope) {
      const h = astrolabe.horoscope;
      text += `\n【流运设定 (Flow Rules)】\n`;
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
