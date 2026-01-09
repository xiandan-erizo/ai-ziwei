import { astro } from 'iztro';
import { Solar, Lunar } from 'lunar-javascript';
import { Astrolabe, Palace, Star, UserInput, FlowLayer, Horoscope, SiHua } from '../types';

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
// Returns the Start (Jie) and End (Next Jie) for the month containing the date
const getSolarTermRange = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        // lunar-javascript uses month 1-12
        const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const lunar = solar.getLunar();
        
        // ZWDS Months are based on Jie (Section), not Qi (Middle).
        // JIE_NAMES: 立春, 惊蛰, 清明, 立夏, 芒种, 小暑, 立秋, 白露, 寒露, 立冬, 大雪, 小寒
        const JIE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

        // Helper to find nearest PREVIOUS Jie (Strictly Jie, skipping Qi)
        let startTerm = lunar.getPrevJieQi(true); // true = inclusive
        let attempts = 0;
        while (startTerm && !JIE_NAMES.includes(startTerm.getName()) && attempts < 5) {
            // If it's a Qi (e.g. Chun Fen), go back further
            const sDate = startTerm.getSolar();
            // Go back 1 day before this term to search again
            const prevDay = sDate.next(-1);
            startTerm = prevDay.getLunar().getPrevJieQi(true);
            attempts++;
        }

        // Helper to find nearest NEXT Jie
        let endTerm = lunar.getNextJieQi(false); // false = exclusive (strict next)
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
            
            // Format: YYYY-MM-DD HH:mm:ss
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

export const calculateAstrolabe = (input: UserInput): Astrolabe => {
  const timeIndex = calculateTimeIndex(input.birthHour, input.birthMinute, input.longitude);
  let astrolabe: any;

  if (input.calendarType === 'lunar') {
    const dateStr = `${input.lunarYear}-${input.lunarMonth}-${input.lunarDay}`;
    astrolabe = astro.byLunar(dateStr, timeIndex, input.gender, input.isLeapMonth, true, 'zh-CN');
  } else {
    astrolabe = astro.bySolar(input.solarDate, timeIndex, input.gender, true, 'zh-CN');
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

  const lunar = astrolabe.lunar;
  let yearGZ = '', monthGZ = '', dayGZ = '', hourGZ = '';

  if (lunar) {
      yearGZ = lunar.getYearInGanZhiExact ? lunar.getYearInGanZhiExact() : lunar.getYearInGanZhi();
      monthGZ = lunar.getMonthInGanZhiExact ? lunar.getMonthInGanZhiExact() : lunar.getMonthInGanZhi();
      dayGZ = lunar.getDayInGanZhiExact ? lunar.getDayInGanZhiExact() : lunar.getDayInGanZhi();
      hourGZ = lunar.getTimeInGanZhi();
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
        
        // Calculate detailed solar term range for the specific focus date
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
                monthRange: termRange // Use our calculated range instead of flow.monthly.startDate
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

// Formatter for "Copy/Paste"
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
  // Explicit birth time with minute
  const minuteStr = astrolabe.birthMinute !== undefined ? padZero(astrolabe.birthMinute) : '00';
  text += `阳历 (Solar):  ${astrolabe.solarDate} ${astrolabe.birthHour}:${minuteStr} (${astrolabe.time})\n`;
  text += `农历 (Lunar):  ${astrolabe.lunarDate}\n`;
  text += `八字 (BaZi):   ${astrolabe.fourPillars.year}年 ${astrolabe.fourPillars.month}月 ${astrolabe.fourPillars.day}日 ${astrolabe.fourPillars.hour}时\n`;
  
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
      
      // Detailed Month Range
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