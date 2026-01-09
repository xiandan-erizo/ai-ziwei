import React, { useState, useRef } from 'react';
import { calculateAstrolabe, formatChartAsText } from './services/iztroService';
import { analyzeChart } from './services/openaiService';
import { Astrolabe, Palace, UserInput } from './types';
import GridMap from './components/GridMap';
import BaZiChart from './components/BaZiChart';

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

const PalaceModal = ({ palace, onClose }: { palace: Palace; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-serif-sc text-purple-200">{palace.name} <span className="text-sm text-slate-400">({palace.heavenlyStem}{palace.earthlyBranch})</span></h3>
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
                            {palace.majorStars.length > 0 ? palace.majorStars.map((s, i) => (
                                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-red-900/20 border border-red-900/50 rounded text-red-300 text-sm font-bold">
                                    {s.name} <span className="text-xs opacity-60 font-normal">{s.brightness}</span>
                                    {s.mutagen && <span className="text-[10px] bg-white/10 px-1 rounded ml-1 text-white">{s.mutagen}</span>}
                                </span>
                            )) : <span className="text-slate-600 text-sm">无</span>}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">辅星</h4>
                        <div className="flex flex-wrap gap-2">
                            {palace.minorStars.length > 0 ? palace.minorStars.map((s, i) => (
                                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-900/20 border border-purple-900/50 rounded text-purple-300 text-sm">
                                    {s.name} <span className="text-xs opacity-60 font-normal">{s.brightness}</span>
                                </span>
                            )) : <span className="text-slate-600 text-sm">无</span>}
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

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
      const result = await analyzeChart(astrolabe);
      setAnalysis(result);
      setIsAnalyzing(false);
  };

  const handleCopy = () => {
      if (!astrolabe) return;
      const text = formatChartAsText(astrolabe);
      navigator.clipboard.writeText(text);
      alert("盘面信息已复制到剪贴板！");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-6 md:mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-serif-sc font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mb-2">
                    Iztro 命理探索
                </h1>
                <p className="text-slate-500 text-sm">紫微斗数 · 八字排盘 · AI解读</p>
            </header>

            {/* Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg mb-8 overflow-hidden transition-all duration-300">
                <div 
                    className={`p-6 ${isFormCollapsed ? 'hidden md:block' : 'block'}`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Date Type Toggle & Date Input */}
                        <div className="space-y-4">
                            <div className="flex bg-slate-800 p-1 rounded-lg w-full">
                                <button 
                                    onClick={() => handleInputChange('calendarType', 'solar')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${input.calendarType === 'solar' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <SunIcon /> 阳历
                                </button>
                                <button 
                                    onClick={() => handleInputChange('calendarType', 'lunar')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${input.calendarType === 'lunar' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
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
                                        className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none w-full"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">年</label>
                                        <input type="number" value={input.lunarYear} onChange={(e) => handleInputChange('lunarYear', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">月</label>
                                        <input type="number" value={input.lunarMonth} onChange={(e) => handleInputChange('lunarMonth', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1">日</label>
                                        <input type="number" value={input.lunarDay} onChange={(e) => handleInputChange('lunarDay', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm" />
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
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1">分钟</label>
                                    <input 
                                        type="number" 
                                        min="0" max="59"
                                        value={input.birthMinute}
                                        onChange={(e) => handleInputChange('birthMinute', parseInt(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1">性别</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" checked={input.gender === 'male'} onChange={() => handleInputChange('gender', 'male')} className="text-purple-500 focus:ring-purple-500 bg-slate-800 border-slate-700" />
                                        <span className="text-sm">男 (乾造)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" checked={input.gender === 'female'} onChange={() => handleInputChange('gender', 'female')} className="text-purple-500 focus:ring-purple-500 bg-slate-800 border-slate-700" />
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
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1">纬度</label>
                                    <input 
                                        type="number" 
                                        step="0.0001"
                                        value={input.latitude || 0}
                                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
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
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleCalculate}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-purple-900/20 transition-all active:scale-95"
                            >
                                排盘
                            </button>
                        </div>
                    </div>
                </div>

                {/* Collapse Toggle (Mobile Only) */}
                {astrolabe && (
                     <div 
                        className="md:hidden flex justify-center py-2 bg-slate-800/50 border-t border-slate-800 cursor-pointer hover:bg-slate-800"
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
                        <div className="sticky top-0 z-30 md:static -mx-4 px-4 py-3 md:mx-0 md:p-3 md:rounded-lg bg-slate-950/90 backdrop-blur-md md:bg-slate-900/50 border-b md:border border-slate-800 shadow-xl md:shadow-none flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                                <h2 className="text-sm md:text-lg font-serif-sc text-slate-300">
                                    {astrolabe.fourPillars.year}年 {astrolabe.fourPillars.month}月 {astrolabe.fourPillars.day}日
                                </h2>
                                
                                {/* Tabs */}
                                <div className="flex bg-slate-800/80 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setActiveTab('zwds')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'zwds' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        紫微斗数
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('bazi')}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'bazi' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        八字排盘
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-end">
                                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs md:text-sm text-slate-300 transition-colors border border-slate-700">
                                    <CopyIcon /> <span className="hidden md:inline">复制</span>
                                </button>
                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={isAnalyzing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-900/80 border border-indigo-700/50 rounded text-xs md:text-sm text-indigo-300 transition-colors disabled:opacity-50"
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

                        {/* Analysis Result */}
                        {analysis && (
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden mt-4">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <SparklesIcon /> AI 命理分析
                                </h3>
                                <div className="prose prose-invert prose-purple max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm md:text-base leading-relaxed">
                                        {analysis}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        {selectedPalace && activeTab === 'zwds' && (
            <PalaceModal palace={selectedPalace} onClose={() => setSelectedPalace(null)} />
        )}
    </div>
  );
}
