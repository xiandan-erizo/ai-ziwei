import React, { useRef, useEffect } from 'react';
import { BaZiChart as BaZiType, BaZiPillar, BaZiDaYun } from '../types';

interface BaZiChartProps {
    bazi: BaZiType;
    currentDate?: string; // To highlight current Da Yun
}

const PillarColumn: React.FC<{ pillar: BaZiPillar, title: string, highlight?: boolean }> = ({ pillar, title, highlight }) => {
    // Helper for element color mapping
    const getElementColor = (wuxing: string) => {
        switch (wuxing) {
            case '木': return 'text-green-400';
            case '火': return 'text-red-400';
            case '土': return 'text-amber-500';
            case '金': return 'text-yellow-200';
            case '水': return 'text-blue-400';
            default: return 'text-slate-300';
        }
    };

    return (
        <div className={`flex flex-col items-center rounded-lg p-3 min-w-[85px] md:min-w-[100px] border ${highlight ? 'bg-slate-800 border-purple-500/50 shadow-purple-900/20 shadow-lg' : 'bg-slate-900/50 border-slate-800'}`}>
            <span className="text-xs text-slate-500 mb-2 font-serif-sc">{title}</span>
            
            {/* Ten God (Stem) */}
            <span className="text-[10px] text-slate-400 mb-1 h-3 block font-medium">
                {pillar.gan.shishen}
            </span>
            
            {/* Stem */}
            <div className={`text-3xl font-serif-sc font-bold mb-1 ${getElementColor(pillar.gan.wuxing)}`}>
                {pillar.gan.char}
            </div>
            
            {/* Branch */}
            <div className={`text-3xl font-serif-sc font-bold mb-3 ${getElementColor(pillar.zhi.wuxing)}`}>
                {pillar.zhi.char}
            </div>

            {/* Hidden Stems */}
            <div className="flex flex-col gap-1 w-full border-t border-slate-800/50 pt-2">
                {pillar.zhi.hidden.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] px-1 bg-slate-800/30 rounded-sm">
                        <span className={`${getElementColor(h.wuxing)} font-bold`}>{h.char}</span>
                        <span className="text-slate-500 scale-90 origin-right whitespace-nowrap">{h.shishen}</span>
                    </div>
                ))}
            </div>

            {/* Shen Sha & Chang Sheng */}
            <div className="mt-2 w-full flex flex-col items-center gap-1 border-t border-slate-800/50 pt-1">
                 <div className="text-[10px] text-purple-300 font-medium">
                    {pillar.changsheng}
                 </div>
                 {pillar.shensha.length > 0 && (
                     <div className="flex flex-wrap justify-center gap-0.5">
                         {pillar.shensha.map((ss, i) => (
                             <span key={i} className="text-[9px] bg-indigo-900/40 text-indigo-200 px-1 rounded-sm border border-indigo-500/20 whitespace-nowrap">
                                 {ss}
                             </span>
                         ))}
                     </div>
                 )}
            </div>

            {/* Na Yin */}
            <div className="text-[10px] text-slate-500 pt-1 w-full text-center truncate mt-1">
                {pillar.nayin}
            </div>
             {/* Kong Wang */}
             <div className="text-[10px] text-slate-600 w-full text-center">
                {pillar.kongwang}
            </div>
        </div>
    );
};

const DaYunCard: React.FC<{ dy: BaZiDaYun, isActive: boolean }> = ({ dy, isActive }) => {
    return (
        <div className={`flex-shrink-0 flex flex-col items-center p-2 rounded-md border min-w-[65px] group relative ${isActive ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
             <div className="text-[10px] text-slate-500 mb-1">{dy.startAge}岁</div>
             <div className="text-[10px] text-slate-400 mb-1">{dy.gan.shishen}</div>
             <div className="text-lg font-serif-sc text-slate-200">{dy.gan.char}</div>
             <div className="text-lg font-serif-sc text-slate-200">{dy.zhi.char}</div>
             
             {/* Simple Hidden Stems display for Da Yun */}
             <div className="flex gap-0.5 mt-1 border-t border-slate-800/50 pt-1 w-full justify-center">
                 {dy.zhi.hidden.map((h,i) => (
                     <span key={i} className="text-[8px] text-slate-500">{h.char}</span>
                 ))}
             </div>

             <div className="text-[10px] text-slate-600 mt-1">{dy.startYear}</div>
        </div>
    );
};

const BaZiChart: React.FC<BaZiChartProps> = ({ bazi, currentDate }) => {
    // Determine active DaYun based on currentDate or today
    const now = currentDate ? new Date(currentDate) : new Date();
    const currentYear = now.getFullYear();
    
    // Find index of current active DaYun
    const activeDaYunIndex = bazi.daYun.findIndex(dy => currentYear >= dy.startYear && currentYear <= dy.endYear);

    // Scroll active DaYun into view on mount
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current && activeDaYunIndex !== -1) {
             const cardWidth = 76; // Approx width + margin
             const scrollPos = activeDaYunIndex * cardWidth - (scrollRef.current.clientWidth / 2) + (cardWidth / 2);
             scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
    }, [activeDaYunIndex]);

    return (
        <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 md:p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                        八字命盘 (BaZi)
                    </h3>
                    <div className="flex gap-4 text-sm bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                        <div>
                            <span className="text-slate-500 mr-2">日主:</span> 
                            <span className="font-bold text-lg text-slate-200">{bazi.dayMaster}</span>
                        </div>
                        <div className="w-px bg-slate-700"></div>
                        <div>
                            <span className="text-slate-500 mr-2">五行:</span> 
                            <span className="font-bold text-slate-200">{bazi.dayMasterWuXing}</span>
                        </div>
                    </div>
                </div>
                
                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-8 justify-items-center">
                    {/* Render in Order: Year, Month, Day, Hour */}
                    <PillarColumn pillar={bazi.pillars[0]} title="年柱 (Year)" />
                    <PillarColumn pillar={bazi.pillars[1]} title="月柱 (Month)" />
                    <PillarColumn pillar={bazi.pillars[2]} title="日柱 (Day)" highlight />
                    <PillarColumn pillar={bazi.pillars[3]} title="时柱 (Hour)" />
                </div>
            </div>

            {/* Da Yun Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-400">大运 (Decades)</h4>
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-normal bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                             起运: {bazi.startYunAge}岁
                        </span>
                        {bazi.startYunDate && (
                             <span className="text-[9px] text-slate-600 px-1">
                                 {bazi.startYunDate}
                             </span>
                        )}
                    </div>
                </div>
                
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {bazi.daYun.map((dy, idx) => (
                        <DaYunCard key={idx} dy={dy} isActive={idx === activeDaYunIndex} />
                    ))}
                    {bazi.daYun.length === 0 && <div className="text-slate-600 text-sm p-2">未起大运</div>}
                </div>
            </div>
            
            {/* Quick Flow Year (Current) Info if available */}
             {activeDaYunIndex !== -1 && (
                 <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                     <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">当前流年 (Current Year)</h4>
                     <p className="text-slate-300 text-sm">
                         当前处于 
                         <span className="text-purple-300 font-bold mx-1">
                             {bazi.daYun[activeDaYunIndex].gan.char}{bazi.daYun[activeDaYunIndex].zhi.char}
                         </span>
                         大运中 ({bazi.daYun[activeDaYunIndex].startYear} - {bazi.daYun[activeDaYunIndex].endYear})。
                     </p>
                 </div>
             )}
        </div>
    );
};

export default BaZiChart;