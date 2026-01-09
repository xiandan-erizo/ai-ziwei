import React from 'react';
import { Palace, Star, Horoscope } from '../types';

interface PalaceCardProps {
  palace: Palace;
  onClick: () => void;
  highlight?: boolean;
  horoscope?: Horoscope; // Pass full horoscope context
  // Derived props for backwards compatibility or ease
  isYearLife?: boolean;
  isMonthLife?: boolean;
  flowYearName?: string;
  flowMonthName?: string;
  flowStars?: Star[]; 
}

interface StarBadgeProps {
  star: Star;
  isMajor?: boolean;
  isFlow?: boolean;
  yearSiHua?: string; // 'lu', 'quan', 'ke', 'ji' or null
  monthSiHua?: string; // 'lu', 'quan', 'ke', 'ji' or null
}

const StarBadge: React.FC<StarBadgeProps> = ({ star, isMajor, isFlow, yearSiHua, monthSiHua }) => {
    // Color coding for Base Chart Mutagens
    let mutagenColor = "";
    if (star.mutagen === '禄') mutagenColor = "text-green-400 bg-green-900/30 border-green-700";
    else if (star.mutagen === '权') mutagenColor = "text-yellow-400 bg-yellow-900/30 border-yellow-700";
    else if (star.mutagen === '科') mutagenColor = "text-blue-400 bg-blue-900/30 border-blue-700";
    else if (star.mutagen === '忌') mutagenColor = "text-red-500 bg-red-900/30 border-red-700";

    const baseColor = isFlow 
        ? "text-amber-300" 
        : (isMajor ? "text-red-300" : "text-sky-300");

    // Flow Si Hua Badges
    const renderFlowBadge = (type: string, label: string, colorClass: string) => (
        <span className={`ml-0.5 px-[2px] text-[8px] rounded border ${colorClass} leading-none flex items-center h-3`}>
            {label}
        </span>
    );

    return (
        <div className={`flex items-center gap-0.5 text-xs mr-2 mb-1 flex-wrap`}>
            <span className={`${baseColor} font-medium whitespace-nowrap`}>
                {star.name}
                {star.brightness && <span className="text-[10px] opacity-60 ml-0.5 scale-90">{star.brightness}</span>}
            </span>
            
            {/* Base Mutagen */}
            {star.mutagen && (
                <span className={`ml-0.5 px-0.5 text-[10px] rounded border ${mutagenColor}`}>
                    {isFlow ? '流' : ''}{star.mutagen}
                </span>
            )}

            {/* Flow Year Si Hua */}
            {yearSiHua && yearSiHua === 'lu' && renderFlowBadge('lu', '年禄', 'text-green-300 border-green-600 bg-green-900/50')}
            {yearSiHua && yearSiHua === 'quan' && renderFlowBadge('quan', '年权', 'text-yellow-300 border-yellow-600 bg-yellow-900/50')}
            {yearSiHua && yearSiHua === 'ke' && renderFlowBadge('ke', '年科', 'text-blue-300 border-blue-600 bg-blue-900/50')}
            {yearSiHua && yearSiHua === 'ji' && renderFlowBadge('ji', '年忌', 'text-red-300 border-red-600 bg-red-900/50')}

            {/* Flow Month Si Hua */}
            {monthSiHua && monthSiHua === 'lu' && renderFlowBadge('lu', '月禄', 'text-green-200 border-green-500/80 bg-green-800/60')}
            {monthSiHua && monthSiHua === 'quan' && renderFlowBadge('quan', '月权', 'text-yellow-200 border-yellow-500/80 bg-yellow-800/60')}
            {monthSiHua && monthSiHua === 'ke' && renderFlowBadge('ke', '月科', 'text-blue-200 border-blue-500/80 bg-blue-800/60')}
            {monthSiHua && monthSiHua === 'ji' && renderFlowBadge('ji', '月忌', 'text-red-200 border-red-500/80 bg-red-800/60')}
        </div>
    );
};

const PalaceCard: React.FC<PalaceCardProps> = ({ 
    palace, onClick, highlight, horoscope,
    isYearLife, isMonthLife, flowYearName, flowMonthName, flowStars 
}) => {
  
  // Helper to determine flow Si Hua for a specific star
  const getSiHuaType = (starName: string, type: 'year' | 'month'): string | undefined => {
      if (!horoscope) return undefined;
      const sihua = type === 'year' ? horoscope.yearSiHua : horoscope.monthSiHua;
      if (!sihua) return undefined;
      if (sihua.lu === starName) return 'lu';
      if (sihua.quan === starName) return 'quan';
      if (sihua.ke === starName) return 'ke';
      if (sihua.ji === starName) return 'ji';
      return undefined;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col h-full p-1.5 md:p-2 border border-slate-700 
        hover:border-emerald-400 hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer 
        min-h-[160px] overflow-hidden group
        ${highlight ? 'bg-slate-800/80 ring-1 ring-emerald-400' : 'bg-slate-900'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-1 border-b border-slate-800 pb-1">
        <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-1">
                <span className={`font-serif-sc font-bold text-sm truncate ${palace.isOriginalPalace ? 'text-red-400' : 'text-slate-200'}`}>
                    {palace.name}
                </span>
                {palace.isOriginalPalace && <span className="bg-red-900/50 text-red-300 text-[9px] px-1 rounded flex-shrink-0">命</span>}
                {palace.isBodyPalace && <span className="bg-yellow-900/50 text-yellow-300 text-[9px] px-1 rounded flex-shrink-0">身</span>}
                
                {isYearLife && <span className="bg-blue-900/60 text-blue-300 text-[9px] px-1 rounded border border-blue-700/50 flex-shrink-0">流命</span>}
                {isMonthLife && <span className="bg-amber-900/60 text-amber-300 text-[9px] px-1 rounded border border-amber-700/50 flex-shrink-0">月命</span>}
            </div>
            
            {(flowYearName || flowMonthName) && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                    {flowYearName && !isYearLife && (
                         <span className="text-[9px] text-blue-400/80">流{flowYearName.replace('宫','')}</span>
                    )}
                    {flowMonthName && !isMonthLife && (
                         <span className="text-[9px] text-amber-400/80">月{flowMonthName.replace('宫','')}</span>
                    )}
                </div>
            )}
        </div>
        <div className="text-right pl-1 flex-shrink-0">
            <span className="block text-xs text-yellow-600 font-serif-sc">{palace.heavenlyStem}</span>
            <span className="block text-xs text-slate-500 font-mono">{palace.earthlyBranch}</span>
        </div>
      </div>

      {/* Stars Area */}
      <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-0.5">
        <div className="flex flex-wrap content-start">
            {palace.majorStars.map((s, i) => (
                <StarBadge key={i} star={s} isMajor={true} 
                    yearSiHua={getSiHuaType(s.name, 'year')}
                    monthSiHua={getSiHuaType(s.name, 'month')}
                />
            ))}
        </div>
        <div className="flex flex-wrap content-start">
            {palace.minorStars.map((s, i) => (
                <StarBadge key={i} star={s} isMajor={false} 
                    yearSiHua={getSiHuaType(s.name, 'year')}
                    monthSiHua={getSiHuaType(s.name, 'month')}
                />
            ))}
        </div>
        {/* Adjective (Tiny) */}
        <div className="flex flex-wrap content-start opacity-60 mt-0.5">
             {palace.adjectiveStars.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[9px] mr-1 text-slate-500">{s.name}</span>
            ))}
        </div>

        {/* Flow Stars */}
        {flowStars && flowStars.length > 0 && (
             <div className="mt-1 pt-1 border-t border-slate-800 border-dashed">
                <div className="flex flex-wrap content-start">
                    {flowStars.map((s, i) => (
                        <StarBadge key={`flow-${i}`} star={s} isFlow={true} />
                    ))}
                </div>
             </div>
        )}
      </div>

      {/* Footer: Split Rows for State */}
      <div className="mt-auto pt-1 border-t border-slate-800 grid grid-cols-2 gap-x-1 text-[9px] text-slate-500 leading-tight">
         <div>
            <span className="text-slate-600 block">长生</span>
            <span className="text-slate-400">{palace.changsheng12}</span>
         </div>
         <div className="text-right">
            <span className="text-slate-600 block">博士</span>
            <span className="text-slate-400">{palace.boshi12}</span>
         </div>
         <div className="col-span-2 flex justify-between border-t border-slate-800/50 mt-0.5 pt-0.5">
             <span>{palace.suiqian12} / {palace.jiangqian12}</span>
             <span className="font-mono text-amber-300">{palace.decadal.range}</span>
         </div>
      </div>
    </div>
  );
};

export default PalaceCard;
