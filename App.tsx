import React, { useState, useRef, useEffect } from 'react';
import { calculateAstrolabe, formatChartAsText } from './services/iztroService';
import { analyzeChart } from './services/openaiService';
import { Astrolabe, Horoscope, Palace, Star, UserInput } from './types';
import GridMap from './components/GridMap';
import BaZiChart from './components/BaZiChart';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

const renderMarkdown = (text: string) => ({ __html: marked.parse(text || '') });

// --- Icons ---
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5v-10.5" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const MapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

const PalaceModal = ({ palace, onClose, horoscope }: { palace: Palace; onClose: () => void; horoscope?: Horoscope | null }) => {
    const getFlowTags = (starName: string) => {
        if (!horoscope) return [] as string[];
        const tags: string[] = [];
        if (horoscope.yearSiHua) {
            if (horoscope.yearSiHua.lu === starName) tags.push('年禄');
            if (horoscope.yearSiHua.quan === starName) tags.push('年权');
            if (horoscope.yearSiHua.ke === starName) tags.push('年科');
            if (horoscope.yearSiHua.ji === starName) tags.push('年忌');
        }
        if (horoscope.monthSiHua) {
            if (horoscope.monthSiHua.lu === starName) tags.push('月禄');
            if (horoscope.monthSiHua.quan === starName) tags.push('月权');
            if (horoscope.monthSiHua.ke === starName) tags.push('月科');
            if (horoscope.monthSiHua.ji === starName) tags.push('月忌');
        }
        return tags;
    };

    const renderStar = (s: Star, colorClass: string, showMutagen = true, key?: string) => {
        const flowTags = getFlowTags(s.name);
        return (
            <span key={key || `${s.name}-${s.brightness || ''}`} className={`flex items-center gap-1 px-2 py-1 border rounded text-sm ${colorClass}`}>
                {s.name}
                {s.brightness && <span className="text-xs opacity-60 font-normal">{s.brightness}</span>}
                {showMutagen && s.mutagen && <span className="text-[10px] bg-white/10 px-1 rounded ml-1 text-white">{s.mutagen}</span>}
                {flowTags.length > 0 && (
                    <span className="text-[10px] text-emerald-200 bg-emerald-900/40 border border-emerald-500/40 px-1 rounded">
                        {flowTags.join('')}
                    </span>
                )}
            </span>
        );
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass glass-strong rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-800/70 flex justify-between items-center bg-slate-900/60 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-serif-sc text-amber-200">{palace.name} <span className="text-sm text-slate-400">({palace.heavenlyStem}{palace.earthlyBranch})</span></h3>
                        <p className="text-xs text-slate-500">
                           大限 {palace.decadal.range} | 宫干 {palace.heavenlyStem}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"><CloseIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto overscroll-contain">
                    <div className="mb-4">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">主星</h4>
                        <div className="flex flex-wrap gap-2">
                            {palace.majorStars.length > 0
                                ? palace.majorStars.map((s, i) => renderStar(s, 'bg-red-900/20 border-red-900/50 text-red-300 font-bold', true, `major-${i}-${s.name}`))
                                : <span className="text-slate-600 text-sm">无</span>}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">辅星</h4>
                        <div className="flex flex-wrap gap-2">
                            {palace.minorStars.length > 0
                                ? palace.minorStars.map((s, i) => renderStar(s, 'bg-sky-900/20 border-sky-900/50 text-sky-300', true, `minor-${i}-${s.name}`))
                                : <span className="text-slate-600 text-sm">无</span>}
                        </div>
                    </div>

                    <div className="mb-4">
                         <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">杂曜</h4>
                         <div className="flex flex-wrap gap-2">
                             {palace.adjectiveStars.length > 0 ? palace.adjectiveStars.map((s, i) => (
                                 <span key={i} className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                     {s.name}
                                 </span>
                             )) : <span className="text-slate-600 text-sm">无</span>}
                         </div>
                    </div>

                    {palace.toughStars && palace.toughStars.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">煞曜</h4>
                            <div className="flex flex-wrap gap-2">
                                {palace.toughStars.map((s, i) => renderStar(s, 'bg-rose-900/20 border-rose-900/50 text-rose-300', false, `tough-${i}-${s.name}`))}
                            </div>
                        </div>
                    )}

                    {palace.isEmptyPalace && palace.borrowFromPalace && (
                        <div className="mb-4">
                            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">空宫借星</h4>
                            <div className="text-sm text-slate-300">
                                对宫 {palace.borrowFromPalace.fromPalaceName}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(palace.borrowedMajorStars || []).length > 0
                                    ? palace.borrowedMajorStars?.map((s, i) => renderStar(s, 'bg-emerald-900/20 border-emerald-900/50 text-emerald-300', true, `borrowed-${i}-${s.name}`))
                                    : <span className="text-slate-600 text-sm">无</span>}
                            </div>
                        </div>
                    )}

                    {palace.surrounding && (
                        <div className="mb-4">
                            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">三方四正</h4>
                            <div className="text-sm text-slate-300 space-y-1">
                                <div>对宫: {(palace.surrounding.oppositePalace || palace.surrounding.opposite).name}</div>
                                <div>三方: {(palace.surrounding.trinePalaces || palace.surrounding.trine).map(t => t.name).join('、')}</div>
                                <div>四正: {(palace.surrounding.fourRectificationPalaces || palace.surrounding.fourRectification).map(t => t.name).join('、')}</div>
                            </div>
                        </div>
                    )}

                    {horoscope?.month?.palaces?.[palace.index] && horoscope.month.palaces[palace.index].length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">流曜</h4>
                            <div className="flex flex-wrap gap-2">
                                {horoscope.month.palaces[palace.index].map((s, i) => (
                                    <span key={`flow-${i}-${s.name}`} className="flex items-center gap-1 px-2 py-1 bg-amber-900/20 border border-amber-900/50 rounded text-amber-300 text-sm">
                                        {s.name}{s.mutagen ? `[流${s.mutagen}]` : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-sm">
                        <div>
                             <span className="text-slate-500 block text-xs">长生 12</span>
                             <span className="text-slate-300">{palace.changsheng12}</span>
                        </div>
                        <div>
                             <span className="text-slate-500 block text-xs">博士 12</span>
                             <span className="text-slate-300">{palace.boshi12}</span>
                        </div>
                         <div>
                             <span className="text-slate-500 block text-xs">将前 12</span>
                             <span className="text-slate-300">{palace.jiangqian12}</span>
                        </div>
                        <div>
                             <span className="text-slate-500 block text-xs">岁前 12</span>
                             <span className="text-slate-300">{palace.suiqian12}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'zwds' | 'bazi'>('zwds');
  const [input, setInput] = useState<UserInput>({
    calendarType: 'solar',
    solarDate: '1990-01-01',
    lunarYear: 1990,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    birthHour: 12,
    birthMinute: 0,
    longitude: 120.0,
    latitude: 30.0,
    gender: 'male',
    focusDate: new Date().toISOString().split('T')[0]
  });

  const [astrolabe, setAstrolabe] = useState<Astrolabe | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
    const [typedAnalysis, setTypedAnalysis] = useState<string>('');
    const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
    const [reasoning, setReasoning] = useState<string>('');
    const [showReasoning, setShowReasoning] = useState<boolean>(false);
    const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
    const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const analysisScrollRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (field: keyof UserInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    try {
        const result = calculateAstrolabe(input);
        setAstrolabe(result);
        setAnalysis(''); 
        setIsFormCollapsed(true);
        // Smooth scroll to chart after a brief delay to allow render
        setTimeout(() => {
            chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (e) {
        console.error(e);
        alert("计算失败，请检查输入格式。");
    }
  };

    const handleAnalyze = async () => {
            if (!astrolabe) return;
            setIsAnalyzing(true);
          setAnalysis('');
          setTypedAnalysis('');
          setShowAnalysisModal(true);
              setReasoning('');
              setShowReasoning(false);
          setAutoFollow(true);
            try {
                const result = await analyzeChart(astrolabe, {
                    onToken: (chunk) => {
                        setAnalysis(prev => prev + chunk);
                    },
                    onReasoningToken: (chunk) => {
                        setReasoning(prev => prev + chunk);
                    }
                });
                // Ensure final content captured (in case stream didn't flush trailing)
                if (result) {
                    setAnalysis(prev => result.length > prev.length ? result : prev);
                }
            } catch (e) {
                console.error(e);
                alert("AI 分析失败，请稍后再试。");
            } finally {
                setIsAnalyzing(false);
                setAutoFollow(false);
            }
    };

      // Typewriter effect for streamed content
      useEffect(() => {
          if (typingTimer.current) {
              clearInterval(typingTimer.current);
              typingTimer.current = null;
          }

          if (!analysis || analysis.length === 0) {
              setTypedAnalysis('');
              return;
          }

          typingTimer.current = setInterval(() => {
              setTypedAnalysis(prev => {
                  if (prev.length >= analysis.length) {
                      if (typingTimer.current) {
                          clearInterval(typingTimer.current);
                          typingTimer.current = null;
                      }
                      return prev;
                  }
                  const remaining = analysis.length - prev.length;
                  const step = Math.max(1, Math.ceil(remaining / 6));
                  const nextLen = Math.min(analysis.length, prev.length + step);
                  const next = analysis.slice(0, nextLen);
                  if (nextLen >= analysis.length && typingTimer.current) {
                      clearInterval(typingTimer.current);
                      typingTimer.current = null;
                  }
                  return next;
              });
          }, 20);

          return () => {
              if (typingTimer.current) {
                  clearInterval(typingTimer.current);
                  typingTimer.current = null;
              }
          };
      }, [analysis]);

      // Auto-follow scroll when streaming, stop when user scrolls away or when generation ends
      useEffect(() => {
          if (!autoFollow || !isAnalyzing) return;
          const el = analysisScrollRef.current;
          if (!el) return;
          el.scrollTop = el.scrollHeight;
      }, [typedAnalysis, reasoning, autoFollow, isAnalyzing]);

  const copyToClipboard = async (text: string) => {
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (clipboard && typeof clipboard.writeText === 'function') {
          try {
              await clipboard.writeText(text);
              return true;
          } catch (e) {
              console.warn('clipboard.writeText failed, falling back to execCommand', e);
          }
      }
      if (typeof document === 'undefined') return false;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
  };

  const handleCopy = async () => {
      if (!astrolabe) return;
      const text = formatChartAsText(astrolabe);
      try {
          const ok = await copyToClipboard(text);
          alert(ok ? "盘面信息已复制到剪贴板！" : "复制失败，请手动复制。");
      } catch (e) {
          console.error(e);
          alert("复制失败，请手动复制。");
      }
  };

  const handleCopyAnalysis = async () => {
      const text = typedAnalysis || analysis;
      if (!text) return;
      try {
          const ok = await copyToClipboard(text);
          alert(ok ? "AI 解读已复制到剪贴板！" : "复制失败，请手动复制。");
      } catch (e) {
          console.error(e);
          alert("复制失败，请手动复制。");
      }
  };

  return (
    <div className="app-shell min-h-screen text-slate-100 font-ui px-4 md:px-8 pb-32 pt-6">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-8 md:mb-10 text-center relative animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-[10px] uppercase tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    命理实验室
                </div>
                <h1 className="mt-4 text-3xl md:text-5xl font-serif-sc font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 mb-2">
                    Iztro 命理探索
                </h1>
                <p className="text-slate-400 text-sm">紫微斗数 · 八字排盘 · AI解读</p>
            </header>

            {/* Controls */}
            <div className="glass rounded-2xl mb-8 overflow-hidden transition-all duration-300">
                <div 
                    className={`p-6 ${isFormCollapsed ? 'hidden md:block' : 'block'}`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Date Type Toggle & Date Input */}
                        <div className="space-y-4">
                            <div className="flex bg-slate-900/70 p-1 rounded-lg w-full border border-slate-700/60">
                                <button 
                                    onClick={() => handleInputChange('calendarType', 'solar')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${input.calendarType === 'solar' ? 'bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <SunIcon /> 阳历
                                </button>
                                <button 
                                    onClick={() => handleInputChange('calendarType', 'lunar')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${input.calendarType === 'lunar' ? 'bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <MoonIcon /> 农历
                                </button>
                            </div>

                            {input.calendarType === 'solar' ? (
                                <div className="flex flex-col">
                                    <label className="text-xs text-slate-500 mb-1">阳历日期</label>
                                    <input 
                                        type="date" 
                                        value={input.solarDate}
                                        onChange={(e) => handleInputChange('solarDate', e.target.value)}
                                        className="input-field px-3 py-2 text-sm w-full"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">年</label>
                                        <input type="number" value={input.lunarYear} onChange={(e) => handleInputChange('lunarYear', parseInt(e.target.value))} className="input-field w-full px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">月</label>
                                        <input type="number" value={input.lunarMonth} onChange={(e) => handleInputChange('lunarMonth', parseInt(e.target.value))} className="input-field w-full px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">日</label>
                                        <input type="number" value={input.lunarDay} onChange={(e) => handleInputChange('lunarDay', parseInt(e.target.value))} className="input-field w-full px-2 py-2 text-sm" />
                                    </div>
                                    <div className="col-span-3 flex items-center gap-2 mt-1">
                                        <input type="checkbox" id="leap" checked={input.isLeapMonth} onChange={(e) => handleInputChange('isLeapMonth', e.target.checked)} className="rounded bg-slate-800 border-slate-700" />
                                        <label htmlFor="leap" className="text-xs text-slate-400">闰月</label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Time & Gender */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1">出生时辰 (0-23)</label>
                                    <input 
                                        type="number" 
                                        min="0" max="23"
                                        value={input.birthHour}
                                        onChange={(e) => handleInputChange('birthHour', parseInt(e.target.value))}
                                        className="input-field w-full px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1">分钟</label>
                                    <input 
                                        type="number" 
                                        min="0" max="59"
                                        value={input.birthMinute}
                                        onChange={(e) => handleInputChange('birthMinute', parseInt(e.target.value))}
                                        className="input-field w-full px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1">性别</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" checked={input.gender === 'male'} onChange={() => handleInputChange('gender', 'male')} className="text-emerald-400 focus:ring-emerald-400 bg-slate-800 border-slate-700" />
                                        <span className="text-sm">男 (乾造)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" checked={input.gender === 'female'} onChange={() => handleInputChange('gender', 'female')} className="text-emerald-400 focus:ring-emerald-400 bg-slate-800 border-slate-700" />
                                        <span className="text-sm">女 (坤造)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapIcon /> 经度</label>
                                    <input 
                                        type="number" 
                                        step="0.0001"
                                        value={input.longitude}
                                        onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                                        className="input-field w-full px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1">纬度</label>
                                    <input 
                                        type="number" 
                                        step="0.0001"
                                        value={input.latitude || 0}
                                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                                        className="input-field w-full px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-tight">
                                用于真太阳时计算。默认 (120°) 为北京时间中心。
                            </p>
                        </div>

                        {/* Action */}
                        <div className="flex flex-col justify-end space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CalendarIcon /> 流运日期</label>
                                <input 
                                    type="date"
                                    value={input.focusDate}
                                    onChange={(e) => handleInputChange('focusDate', e.target.value)}
                                    className="input-field w-full px-3 py-2 text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleCalculate}
                                className="w-full btn-primary font-bold py-2.5 rounded-lg transition-all active:scale-95"
                            >
                                排盘
                            </button>
                        </div>
                    </div>
                </div>

                {/* Collapse Toggle (Mobile Only) */}
                {astrolabe && (
                     <div 
                        className="md:hidden flex justify-center py-2 bg-slate-900/60 border-t border-slate-800/60 cursor-pointer hover:bg-slate-900/80"
                        onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                     >
                         {isFormCollapsed ? (
                             <span className="flex items-center gap-1 text-xs text-slate-400"><ChevronDownIcon /> 展开配置</span>
                         ) : (
                             <span className="flex items-center gap-1 text-xs text-slate-400"><ChevronUpIcon /> 收起配置</span>
                         )}
                     </div>
                )}
            </div>

            <div ref={chartRef}>
                {astrolabe && (
                    <div className="space-y-4 md:space-y-6 animate-fade-in">
                        {/* Toolbar - Sticky on Mobile */}
                        <div className="sticky top-0 z-30 md:static -mx-4 px-4 py-3 md:mx-0 md:p-3 md:rounded-lg glass-soft border-b md:border border-slate-800/60 shadow-xl md:shadow-none flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                                <h2 className="text-sm md:text-lg font-serif-sc text-slate-300">
                                    {astrolabe.fourPillars.year}年 {astrolabe.fourPillars.month}月 {astrolabe.fourPillars.day}日
                                </h2>
                                
                                {/* Tabs */}
                                <div className="flex bg-slate-900/70 p-1 rounded-lg border border-slate-700/60">
                                    <button 
                                        onClick={() => setActiveTab('zwds')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'zwds' ? 'bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        紫微斗数
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('bazi')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'bazi' ? 'bg-emerald-500/20 text-emerald-100 shadow-sm shadow-emerald-900/30' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        八字排盘
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-end">
                                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 hover:bg-slate-800 rounded text-xs md:text-sm text-slate-200 transition-colors border border-slate-700/60">
                                    <CopyIcon /> <span className="hidden md:inline">复制</span>
                                </button>
                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/40 rounded text-xs md:text-sm text-emerald-200 transition-colors disabled:opacity-50"
                                >
                                    <SparklesIcon /> {isAnalyzing ? '分析中...' : 'AI 解读'}
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {activeTab === 'zwds' ? (
                            <GridMap astrolabe={astrolabe} onPalaceClick={setSelectedPalace} />
                        ) : (
                            astrolabe.bazi ? <BaZiChart bazi={astrolabe.bazi} currentDate={input.focusDate} /> : <div className="p-8 text-center text-slate-500">无法生成八字数据</div>
                        )}

                    </div>
                )}
            </div>
        </div>

        {/* Analysis Modal */}
        {showAnalysisModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAnalysisModal(false)}>
                <div className="glass glass-strong relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-800/80" onClick={e => e.stopPropagation()}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-sky-400"></div>
                    <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-800/70 bg-slate-900/60">
                        <div className="flex items-center gap-2 text-white font-semibold">
                            <SparklesIcon /> AI 命理分析
                            {isAnalyzing && <span className="text-xs text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full">生成中...</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-xs text-slate-200 border border-slate-700/60 transition-colors"
                            >
                                <CopyIcon /> 复制盘面
                            </button>
                            <button
                                onClick={handleCopyAnalysis}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/70 rounded text-xs text-emerald-100 border border-emerald-500/40 transition-colors"
                            >
                                <CopyIcon /> 复制解读
                            </button>
                            <button
                                onClick={() => setShowAnalysisModal(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-300"
                                aria-label="关闭分析"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>
                    <div
                        ref={analysisScrollRef}
                        className="p-5 md:p-6 overflow-y-auto max-h-[70vh]"
                        onScroll={() => {
                            const el = analysisScrollRef.current;
                            if (!el) return;
                            const threshold = 24;
                            const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
                            const nearBottom = distance <= threshold;
                            setAutoFollow(prev => {
                                const next = isAnalyzing && nearBottom;
                                return prev === next ? prev : next;
                            });
                        }}
                    >
                        {/* Reasoning (chain-of-thought) collapsible - placed above main content */}
                        {reasoning && (
                            <div className="mb-6 border-b border-slate-800/70 pb-4">
                                <button
                                    onClick={() => setShowReasoning(v => !v)}
                                    className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-amber-200 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded hover:bg-amber-500/20 transition-colors"
                                >
                                    <span className={`transition-transform ${showReasoning ? 'rotate-90' : ''}`}>▶</span>
                                    思考过程（reasoning）
                                    {!showReasoning && <span className="text-[10px] text-amber-100/80">（点击展开）</span>}
                                </button>
                                {showReasoning && (
                                    <div className="mt-3 bg-slate-900/60 border border-amber-500/20 rounded-lg p-3 max-h-[30vh] overflow-y-auto">
                                        <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={renderMarkdown(reasoning)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {typedAnalysis ? (
                            <div className="prose prose-invert prose-sm md:prose-base max-w-none animate-[fadeIn_0.3s_ease]" dangerouslySetInnerHTML={renderMarkdown(typedAnalysis)} />
                        ) : (
                            <div className="text-slate-400 text-sm">正在生成中，请稍候...</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {selectedPalace && activeTab === 'zwds' && (
            <PalaceModal palace={selectedPalace} horoscope={astrolabe?.horoscope} onClose={() => setSelectedPalace(null)} />
        )}
    </div>
  );
}
