import React from 'react';
import { Palace, Astrolabe } from '../types';
import PalaceCard from './PalaceCard';

interface GridMapProps {
  astrolabe: Astrolabe;
  onPalaceClick: (palace: Palace) => void;
}

// Visual mapping for 4x4 Grid
// ZWDS traditionally maps Earthly Branches to fixed positions
const GRID_MAPPING: Record<number, number> = {
  0: 5,  1: 6,  2: 7,  3: 8,
  7: 9, 11: 10,
  15: 11, 14: 0, 13: 1, 12: 2,
  8: 3, 4: 4
};

const GridMap: React.FC<GridMapProps> = ({ astrolabe, onPalaceClick }) => {
  const getPalaceByBranchIndex = (idx: number) => {
    return astrolabe.palaces.find(p => p.index === idx);
  };

  const renderCell = (gridIndex: number) => {
    const branchIndex = GRID_MAPPING[gridIndex];
    if (branchIndex === undefined) return null; 

    const palace = getPalaceByBranchIndex(branchIndex);
    if (!palace) return <div key={gridIndex} className="bg-slate-900 border border-slate-800"></div>;

    // Check for Flow Logic
    let isYearLife = false;
    let isMonthLife = false;
    let flowStars = undefined;
    let flowYearName = undefined;
    let flowMonthName = undefined;

    if (astrolabe.horoscope) {
        if (astrolabe.horoscope.year.index === palace.index) isYearLife = true;
        if (astrolabe.horoscope.month.index === palace.index) isMonthLife = true;
        
        if (astrolabe.horoscope.year.palaceNames) {
             flowYearName = astrolabe.horoscope.year.palaceNames[palace.index];
        }
        if (astrolabe.horoscope.month.palaceNames) {
             flowMonthName = astrolabe.horoscope.month.palaceNames[palace.index];
        }

        const stars = astrolabe.horoscope.month.palaces[palace.index];
        if (stars) {
            flowStars = stars;
        }
    }

    return (
      <PalaceCard 
        key={gridIndex} 
        palace={palace} 
        onClick={() => onPalaceClick(palace)}
        highlight={palace.isOriginalPalace}
        horoscope={astrolabe.horoscope}
        isYearLife={isYearLife}
        isMonthLife={isMonthLife}
        flowYearName={flowYearName}
        flowMonthName={flowMonthName}
        flowStars={flowStars}
      />
    );
  };

  const CenterInfo = () => (
    <div className="col-span-2 row-span-2 flex flex-col justify-center items-center text-center p-4 glass-soft rounded-lg m-2">
       <h2 className="text-2xl font-serif-sc font-bold text-amber-300 mb-2 animate-float">紫微斗数</h2>
       <div className="text-sm space-y-1 text-slate-300">
         <p><span className="text-slate-500">性别:</span> {astrolabe.originalGender}</p>
         <p><span className="text-slate-500">农历:</span> {astrolabe.lunarDate}</p>
         <p><span className="text-slate-500">五行:</span> {astrolabe.fiveElementsClass}</p>
         <p><span className="text-slate-500">命主:</span> {astrolabe.soul}</p>
         <p><span className="text-slate-500">身主:</span> {astrolabe.body}</p>
       </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-4 gap-0 w-full max-w-5xl mx-auto aspect-[1/2] md:aspect-square shadow-2xl glass rounded-2xl overflow-hidden">
        <div className="hidden md:contents">
            {Array.from({ length: 16 }).map((_, i) => {
                if (i === 5) return <CenterInfo key="center" />;
                if (i === 6 || i === 9 || i === 10) return null;
                return renderCell(i);
            })}
        </div>

        <div className="md:hidden flex flex-col gap-2 p-2">
            <div className="glass-soft p-4 rounded text-center mb-2">
                <h3 className="text-amber-300 text-lg font-bold">命盘概要</h3>
                <p className="text-sm text-slate-300">{astrolabe.lunarDate} | {astrolabe.fiveElementsClass}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
               {[0,1,2,3,7,11,15,14,13,12,8,4].map(gridIdx => {
                   return renderCell(gridIdx);
               })}
            </div>
        </div>
    </div>
  );
};

export default GridMap;
