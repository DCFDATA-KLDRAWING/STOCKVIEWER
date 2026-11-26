import React, { useState, useEffect } from 'react';

// --- 高階 SVG 雙軸圖表元件 (存銷比與營收) ---
const AdvancedInventoryRatioChart = ({ monthlyData, quarterlyData, currencyUnit }) => {
  if (!monthlyData || monthlyData.length === 0) return null;

  const sortedMonthlyData = [...monthlyData].sort((a, b) => new Date(a.month) - new Date(b.month));
  const sortedQuarterlyData = [...quarterlyData].sort((a, b) => a.quarter.localeCompare(b.quarter));

  const getQuarter = (monthStr) => {
    const parts = monthStr.split(/[-/]/);
    if (parts.length < 2) return "";
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const q = Math.ceil(m / 3);
    return `${y}Q${q}`;
  };

  const processedData = sortedMonthlyData.map((m, index, arr) => {
    const qLabel = getQuarter(m.month);
    const qData = sortedQuarterlyData.find(q => q.quarter === qLabel);
    const inventory = qData ? qData.inventory : null;
    
    let rev3MSum = null;
    let ratio = null;
    
    if (index >= 2) {
      const r0 = Number(arr[index].revenue) || 0;
      const r1 = Number(arr[index - 1].revenue) || 0;
      const r2 = Number(arr[index - 2].revenue) || 0;
      rev3MSum = r0 + r1 + r2;
      
      if (inventory !== null && rev3MSum > 0) {
        ratio = (Number(inventory) / rev3MSum) * 100;
      }
    }

    return { 
      ...m, 
      revenue: Number(m.revenue),
      inventory: inventory !== null ? Number(inventory) : null,
      ratio,
      quarterLabel: qLabel
    };
  });

  const width = 600; 
  const height = 450; 
  const padding = { top: 60, bottom: 60, left: 60, right: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const spacing = chartWidth / (processedData.length || 1);

  const allAbsValues = processedData.flatMap(d => [d.revenue, d.inventory].filter(v => v !== null && !isNaN(v)));
  const maxAbsValue = Math.max(...allAbsValues, 1) * 1.2;
  
  const allRatios = processedData.map(d => d.ratio).filter(v => v !== null && !isNaN(v));
  const maxRatio = Math.max(...allRatios, 100) * 1.2;

  const createPath = (key, isRatio = false) => {
    const points = processedData.map((d, i) => {
      if (d[key] === null || isNaN(d[key])) return null;
      const x = padding.left + (i + 0.5) * spacing;
      const maxVal = isRatio ? maxRatio : maxAbsValue;
      const y = padding.top + chartHeight - (d[key] / maxVal) * chartHeight;
      return { x, y };
    }).filter(Boolean);

    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const pathRevenue = createPath('revenue', false);
  const pathRatio = createPath('ratio', true);

  return (
    <div className="w-full bg-[#18181b] rounded-xl shadow-sm border border-zinc-700 p-3 sm:p-5 flex flex-col items-center">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs font-bold text-zinc-300 mb-3 sm:mb-4 px-1 justify-center w-full">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded-sm"></div> 存貨 ({currencyUnit})</span>
        <span className="flex items-center gap-1"><div className="w-4 h-1 bg-yellow-400"></div> 單月營收</span>
        <span className="flex items-center gap-1"><div className="w-4 h-1 bg-pink-500"></div> 存銷比(%)</span>
      </div>

      <div className="w-full max-w-[850px] mx-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-sans bg-zinc-900/80 rounded-lg">
          {[0, 0.25, 0.5, 0.75, 1].map((ratioGrid, i) => {
            const y = padding.top + chartHeight - chartHeight * ratioGrid;
            return (
              <g key={`grid-${i}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding.left - 4} y={y + 4} textAnchor="end" className="text-[12px] fill-zinc-400 font-semibold">
                  {((maxAbsValue * ratioGrid).toFixed(1))}
                </text>
                <text x={width - padding.right + 4} y={y + 4} textAnchor="start" className="text-[12px] fill-pink-400 font-bold">
                  {((maxRatio * ratioGrid).toFixed(1))}%
                </text>
              </g>
            );
          })}

          {processedData.map((d, i) => {
            const xCenter = padding.left + (i + 0.5) * spacing;
            const barWidth = spacing * 0.85; 
            const barX = xCenter - barWidth / 2;
            
            const invHeight = d.inventory !== null && !isNaN(d.inventory) ? (d.inventory / maxAbsValue) * chartHeight : 0;
            const invY = padding.top + chartHeight - invHeight;
            const showLabel = i % 3 === 0 || i === processedData.length - 1;

            return (
              <g key={`bar-${i}`} className="group cursor-pointer">
                <rect x={xCenter - spacing / 2} y={padding.top} width={spacing} height={chartHeight} fill="transparent" className="hover:fill-zinc-700/40 transition-colors" />
                
                {d.inventory !== null && !isNaN(d.inventory) && (
                  <rect x={barX} y={invY} width={barWidth} height={invHeight} fill="#60a5fa" rx="1" className="opacity-80 group-hover:opacity-100 transition-opacity" />
                )}

                <g className="opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <rect x={xCenter > width - 80 ? xCenter - 56 : xCenter > 80 ? xCenter - 28 : xCenter} y={padding.top - 36} width="56" height="30" fill="#27272a" fillOpacity="0.95" rx="4" stroke="#52525b" />
                  {d.ratio !== null && !isNaN(d.ratio) && (
                    <text x={xCenter > width - 80 ? xCenter - 28 : xCenter > 80 ? xCenter : xCenter + 28} y={padding.top - 20} textAnchor="middle" className="text-[12px] fill-pink-400 font-bold">
                      {d.ratio.toFixed(1)}%
                    </text>
                  )}
                  {d.revenue !== null && !isNaN(d.revenue) && (
                    <text x={xCenter > width - 80 ? xCenter - 28 : xCenter > 80 ? xCenter : xCenter + 28} y={padding.top - 8} textAnchor="middle" className="text-[10px] fill-yellow-400 font-bold">
                      營:{d.revenue}
                    </text>
                  )}
                </g>

                {showLabel && (
                  <text x={xCenter} y={height - 18} textAnchor="middle" className="text-[11px] fill-zinc-400 font-bold" transform={`rotate(-45, ${xCenter}, ${height - 18})`}>
                    {d.month.substring(2)}
                  </text>
                )}
                
                {(i === 0 || d.quarterLabel !== processedData[i - 1].quarterLabel) && (
                  <line x1={xCenter - spacing / 2} y1={height - 40} x2={xCenter - spacing / 2} y2={height - 10} stroke="#52525b" strokeDasharray="2 2" />
                )}
              </g>
            );
          })}
          
          <path d={pathRevenue} fill="none" stroke="#facc15" strokeWidth="2.5" className="drop-shadow-sm" />
          <path d={pathRatio} fill="none" stroke="#ec4899" strokeWidth="2.5" className="drop-shadow-md" />

          {processedData.map((d, i) => {
            const xCenter = padding.left + (i + 0.5) * spacing;
            return (
              <g key={`dots-${i}`}>
                {d.revenue !== null && !isNaN(d.revenue) && (
                   <circle cx={xCenter} cy={padding.top + chartHeight - (d.revenue / maxAbsValue) * chartHeight} r="2.5" fill="#facc15" stroke="#18181b" strokeWidth="1" />
                )}
                {d.ratio !== null && !isNaN(d.ratio) && (
                   <circle cx={xCenter} cy={padding.top + chartHeight - (d.ratio / maxRatio) * chartHeight} r="3.5" fill="#ec4899" stroke="#18181b" strokeWidth="1.5" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --- EBITDA 資本回報率 (改良版 ROIC) 圖表 ---
const AdvancedEbitdaROICChart = ({ quarterlyData }) => {
  if (!quarterlyData || quarterlyData.length === 0) return null;

  const sortedData = [...quarterlyData].sort((a, b) => a.quarter.localeCompare(b.quarter));
  const width = 600; 
  const height = 250; 
  const padding = { top: 40, bottom: 40, left: 45, right: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const spacing = chartWidth / (sortedData.length || 1);

  const validRatios = sortedData.map(d => d.roic).filter(v => v !== null && !isNaN(v));
  if (validRatios.length === 0) return null; 

  const maxVal = Math.max(...validRatios, 5) * 1.2;
  const minValRaw = Math.min(...validRatios, 0);
  const minVal = minValRaw < 0 ? minValRaw * 1.2 : 0;
  const range = maxVal - minVal || 1;

  const getY = (val) => padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  const zeroY = getY(0);

  const points = sortedData.map((d, i) => {
    if (d.roic === null || isNaN(d.roic)) return null;
    return { x: padding.left + (i + 0.5) * spacing, y: getY(d.roic), val: d.roic, quarter: d.quarter };
  }).filter(Boolean);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full bg-[#18181b] rounded-xl shadow-sm border border-zinc-700 p-3 sm:p-5 flex flex-col items-center mt-4 relative">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs font-bold text-zinc-300 mb-3 sm:mb-4 px-1 justify-center w-full">
        <span className="flex items-center gap-1"><div className="w-4 h-1 bg-purple-400"></div> 資本回報率 (ROIC %)</span>
      </div>
      
      <div className="w-full max-w-[850px] mx-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-sans bg-zinc-900/80 rounded-lg">
          {[0, 0.25, 0.5, 0.75, 1].map((ratioGrid, i) => {
            const val = minVal + range * ratioGrid;
            const y = getY(val);
            return (
              <g key={`roic-grid-${i}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding.left - 4} y={y + 4} textAnchor="end" className="text-[12px] fill-zinc-400 font-semibold">
                  {val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {minVal < 0 && (
            <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="#71717a" strokeWidth="2" />
          )}

          {sortedData.map((d, i) => {
            const xCenter = padding.left + (i + 0.5) * spacing;
            const hasData = d.roic !== null && !isNaN(d.roic);
            return (
              <g key={`roic-bar-${i}`} className="group cursor-pointer">
                <rect x={xCenter - spacing / 2} y={padding.top} width={spacing} height={chartHeight} fill="transparent" className="hover:fill-zinc-700/40 transition-colors" />
                
                {hasData && (
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <rect x={xCenter > width - 60 ? xCenter - 50 : xCenter > 60 ? xCenter - 25 : xCenter} y={getY(d.roic) - 30} width="50" height="22" fill="#27272a" fillOpacity="0.95" rx="4" stroke="#52525b" />
                    <text x={xCenter > width - 60 ? xCenter - 25 : xCenter > 60 ? xCenter : xCenter + 25} y={getY(d.roic) - 15} textAnchor="middle" className="text-[11px] fill-purple-400 font-bold">
                      {d.roic.toFixed(2)}%
                    </text>
                  </g>
                )}

                <text x={xCenter} y={height - 15} textAnchor="middle" className="text-[11px] fill-zinc-400 font-bold">
                  {d.quarter}
                </text>
              </g>
            );
          })}
          
          <path d={path} fill="none" stroke="#c084fc" strokeWidth="2.5" className="drop-shadow-sm" />

          {points.map((p, i) => (
             <circle key={`roic-dots-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#c084fc" stroke="#18181b" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
    </div>
  );
};

// --- 景氣波浪圖 ---
const CycleWaveMap = ({ activeStage }) => {
  const stages = [
    { id: 1, name: '谷底復甦', short: '盈餘落底', action: '逢低佈局', color: 'text-emerald-400', dotColor: 'bg-emerald-500', pos: { left: '20%', top: '75%' } },
    { id: 2, name: '景氣擴張', short: '盈餘成長', action: '估值擴張', color: 'text-blue-400', dotColor: 'bg-blue-500', pos: { left: '38%', top: '25%' } },
    { id: 3, name: '景氣高峰', short: '盈餘見頂', action: '居高思危', color: 'text-amber-400', dotColor: 'bg-amber-500', pos: { left: '68%', top: '25%' } },
    { id: 4, name: '收縮衰退', short: '盈餘衰退', action: '殺估值避開', color: 'text-red-400', dotColor: 'bg-red-500', pos: { left: '85%', top: '75%' } }
  ];

  return (
    <div className="relative w-full h-[200px] sm:h-[240px] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#3f3f46" strokeDasharray="2 2" strokeWidth="0.5" />
        <path d="M 5,80 C 25,80 30,20 55,20 C 80,20 85,80 100,80" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {stages.map(stage => {
        const isActive = activeStage === stage.id;
        return (
          <div key={stage.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: stage.pos.left, top: stage.pos.top }}>
            <div className={`relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-zinc-900 shadow-md z-10 transition-all duration-500 ${isActive ? stage.dotColor + ' scale-[1.6]' : 'bg-zinc-600'}`}>
               {isActive && <div className="absolute w-full h-full rounded-full animate-ping opacity-60 bg-inherit"></div>}
            </div>
            <div className={`mt-2 text-center w-20 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`font-bold ${isActive ? stage.color + ' text-xs' : 'text-zinc-500 text-[10px]'}`}>{stage.name}</div>
              <div className="text-[9px] text-zinc-400 mt-0.5 border border-zinc-700 bg-zinc-800 rounded px-1 inline-block">{stage.short}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- FinMind 資料抓取與財報邏輯運算核心 ---
const fetchFinMindInventoryData = async (stockCode, finmindToken = '') => {
  const cleanStockCode = String(stockCode || '').trim().replace(/[^\x20-\x7E]/g, '');
  const rawToken = finmindToken || localStorage.getItem('MY_STOCK_FINMIND_KEY') || '';
  const token = String(rawToken).trim().replace(/[^\x20-\x7E]/g, '');
  const now = new Date();
  
  // 抓取近 3 年資料以涵蓋 24 個月營收與 8 季財報
  const startDate = new Date(now.getFullYear() - 3, 0, 1).toISOString().split('T')[0];

  const buildUrl = (dataset) => {
    let u = `https://api.finmindtrade.com/api/v4/data?dataset=${dataset}&data_id=${stockCode}&start_date=${startDate}`;
    if (token) u += `&token=${token}`;
    return u;
  };

  // 同步抓取：月營收、資產負債表、損益表
  const [revRes, bsRes, isRes] = await Promise.all([
    fetch(buildUrl('TaiwanStockMonthRevenue')).then(r => r.json()),
    fetch(buildUrl('TaiwanStockBalanceSheet')).then(r => r.json()),
    fetch(buildUrl('TaiwanStockFinancialStatements')).then(r => r.json())
  ]);

  if (!revRes.data || revRes.data.length === 0) {
    throw new Error(`找不到股票代號 ${stockCode} 的月營收資料`);
  }

  // 1. 整理單月營收 (單位換算成「百萬元」)
  const monthlyData = revRes.data
    .map(item => {
      const d = item.date || '';
      const monthStr = d.substring(0, 7); // YYYY-MM
      const revInMillions = (Number(item.revenue) || 0) / 1000000;
      return {
        month: monthStr,
        revenue: Math.round(revInMillions * 10) / 10
      };
    })
    .filter((v, i, a) => a.findIndex(t => t.month === v.month) === i)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 24)
    .reverse();

  // 2. 整理資產負債表 (依季度歸戶：存貨、總資產、流動負債、短期借款)
  const bsMap = {};
  (bsRes.data || []).forEach(row => {
    const d = row.date;
    if (!d) return;
    const year = d.substring(0, 4);
    const m = parseInt(d.substring(5, 7), 10);
    const q = Math.ceil(m / 3);
    const qKey = `${year}Q${q}`;

    if (!bsMap[qKey]) {
      bsMap[qKey] = { quarter: qKey, inventory: 0, totalAssets: 0, currentLiab: 0, shortDebt: 0 };
    }

    const rawVal = Number(row.value);
    if (isNaN(rawVal)) return;
    const val = rawVal / 1000000; // 統一換算成「百萬元」

    const typeLower = String(row.type || '').toLowerCase();
    const originName = String(row.origin_name || '');

    if (
      typeLower.includes('inventor') ||
      originName.includes('存貨')
    ) {
      // 若同一季有多筆存貨相關科目，取較大值或累加（視財報結構而定，一般「存貨」為單一主科目）
      if (val > 0) bsMap[qKey].inventory = Math.max(bsMap[qKey].inventory, val);
    } else if (
      typeLower === 'totalassets' ||
      originName.includes('資產總額') ||
      originName.includes('資產總計')
    ) {
      bsMap[qKey].totalAssets = val;
    } else if (
      typeLower.includes('currentliabilities') ||
      originName.includes('流動負債合計') ||
      originName.includes('流動負債總額')
    ) {
      bsMap[qKey].currentLiab = val;
    } else if (
      typeLower.includes('shorttermborrowings') ||
      originName.includes('短期借款')
    ) {
      bsMap[qKey].shortDebt = val;
    }
  });

  // 3. 整理損益表 (計算營業利益與折舊，取得 EBITDA)
  const isMap = {};
  (isRes.data || []).forEach(row => {
    const d = row.date;
    if (!d) return;
    const year = d.substring(0, 4);
    const m = parseInt(d.substring(5, 7), 10);
    const q = Math.ceil(m / 3);
    const qKey = `${year}Q${q}`;

    if (!isMap[qKey]) {
      isMap[qKey] = { operatingIncome: 0, depreciation: 0 };
    }

    const val = (Number(row.value) || 0) / 1000000;
    const typeStr = (row.type || row.origin_name || '').toLowerCase();

    if (typeStr.includes('operatingincome') || typeStr.includes('營業利益') || typeStr.includes('營業淨利')) {
      isMap[qKey].operatingIncome = val;
    } else if (typeStr.includes('depreciation') || typeStr.includes('折舊')) {
      isMap[qKey].depreciation = val;
    }
  });

  // 4. 計算每季的改良版 ROIC
  const quarterlyData = Object.keys(bsMap)
    .sort()
    .slice(-8) // 取最近 8 季
    .map(qKey => {
      const bs = bsMap[qKey];
      const is = isMap[qKey] || { operatingIncome: 0, depreciation: 0 };
      
      const ebitda = (is.operatingIncome || 0) + (is.depreciation || 0);
      const nonInterestLiab = Math.max(0, (bs.currentLiab || 0) - (bs.shortDebt || 0));
      const investedCapital = Math.max(1, (bs.totalAssets || 0) - nonInterestLiab);

      let roic = 0;
      if (investedCapital > 1 && ebitda !== 0) {
        roic = Math.round(((ebitda * 4) / investedCapital) * 10000) / 100; // 年化 ROIC(%)
      }

      return {
        quarter: qKey,
        inventory: Math.round(bs.inventory * 10) / 10,
        roic: roic || 0
      };
    });

  // 5. 景氣位階自動推演演算法
  let cycleStage = 2; // 預設景氣擴張
  let cycleAnalysis = '';
  let dcfAdvice = '';

  const validQuarters = quarterlyData.filter(q => q.inventory > 0);
  if (validQuarters.length >= 2 && monthlyData.length >= 6) {
    const latestQ = validQuarters[validQuarters.length - 1];
    const prevQ = validQuarters[validQuarters.length - 2];
    
    // 計算近 3 個月營收合計
    const revRecent3 = monthlyData.slice(-3).reduce((acc, cur) => acc + cur.revenue, 0);
    const revPrev3 = monthlyData.slice(-6, -3).reduce((acc, cur) => acc + cur.revenue, 0);
    
    const latestRatio = revRecent3 > 0 ? (latestQ.inventory / revRecent3) * 100 : 0;
    const prevRatio = revPrev3 > 0 ? (prevQ.inventory / revPrev3) * 100 : 0;
    const revGrowth = revPrev3 > 0 ? ((revRecent3 - revPrev3) / revPrev3) * 100 : 0;

    if (latestRatio < prevRatio && revGrowth >= 0) {
      cycleStage = 1; // 谷底復甦
      cycleAnalysis = `存銷比從前期 ${prevRatio.toFixed(1)}% 降至 ${latestRatio.toFixed(1)}%，庫存去化良好且營收季增 ${revGrowth.toFixed(1)}%，進入谷底復甦。`;
      dcfAdvice = `此階段可採取積極逢低佈局思維。DCF 折現模型之「前三年成長率」可給予由負轉正之均值修復預期。`;
    } else if (latestRatio <= prevRatio * 1.05 && revGrowth > 5) {
      cycleStage = 2; // 景氣擴張
      cycleAnalysis = `營收動能持續放大 (季增 ${revGrowth.toFixed(1)}%)，存銷比維持健康低檔 (${latestRatio.toFixed(1)}%)，供不應求。`;
      dcfAdvice = `主升段估值擴張期。市場常給予較高本益比乘數，DCF 現金流充沛，可給予相對樂觀成長率。`;
    } else if (latestRatio > prevRatio && revGrowth < 0) {
      cycleStage = 4; // 收縮衰退
      cycleAnalysis = `營收動能放緩 (季增 ${revGrowth.toFixed(1)}%) 且存銷比急遽竄升至 ${latestRatio.toFixed(1)}%，存貨滯銷風險高。`;
      dcfAdvice = `景氣衰退收縮期，宜保守避開。DCF 模型應大幅下調永續成長率，並墊高折現率以反映評價下修風險。`;
    } else {
      cycleStage = 3; // 景氣高峰
      cycleAnalysis = `存銷比向上交叉走高至 ${latestRatio.toFixed(1)}%，雖然營收仍在歷史相對高檔，但下游拉貨已有放緩跡象。`;
      dcfAdvice = `居高思危。此時切勿用歷史最高獲利給予過度樂觀的 DCF 估值，市場反推隱含成長率若過高需慎防估值修正。`;
    }
  } else {
    cycleAnalysis = '資料筆數回溯計算中，目前呈現基礎財務指標。';
    dcfAdvice = '建議參考最新一季存貨週轉速度與營業現金流進行估值。';
  }

  return {
    companyName: `${stockCode}`,
    currencyUnit: '百萬元',
    monthlyData,
    quarterlyData,
    cycleStage,
    cycleAnalysis,
    dcfAdvice
  };
};

// --- Modal 主體 ---
export default function InventoryAnalysisModal({ isOpen, onClose, initialSymbol = '4958', finmindApiKey = '' }) {
  const [query, setQuery] = useState(initialSymbol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (initialSymbol) {
      setQuery(initialSymbol);
    }
  }, [initialSymbol]);

  if (!isOpen) return null;

  const extractStockCode = (str) => {
    const match = str.match(/\d{4}/);
    return match ? match[0] : str.trim();
  };

  const handleSearch = async () => {
    const code = extractStockCode(query);
    if (!code) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowRawData(false);

    try {
      const data = await fetchFinMindInventoryData(code, finmindApiKey);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(`獲取數據失敗: ${err.message || '請確認股號是否正確'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-2 sm:p-4 backdrop-blur-sm">
      <div className="relative bg-[#121214] border border-zinc-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-100 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-[#18181b] border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-pink-400 text-lg">📊</span>
            <h3 className="font-bold text-white text-base">存銷週期 & 改良版 ROIC 導航 (FinMind 官方數據引擎)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 搜尋列 */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="輸入股號 (如: 4958 或 2449)" 
            className="flex-1 bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-pink-500 font-mono"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-500 disabled:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            {loading ? '財報運算中...' : '生成研判'}
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-lg font-bold text-white">{result.companyName} - 存銷比動能 (單位: {result.currencyUnit})</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const code = extractStockCode(query || result.companyName);
                      if (code) window.open(`https://fubon-ebrokerdj.fbs.com.tw/z/zc/zcp/zcpa/zcpa_${code}.djhtm`, '_blank');
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-blue-950/60 border border-blue-700 text-blue-300 hover:bg-blue-900/60"
                  >
                    富邦存貨表
                  </button>
                  <button 
                    onClick={() => {
                      const code = extractStockCode(query || result.companyName);
                      if (code) window.open(`https://fubon-ebrokerdj.fbs.com.tw/z/zc/zcr/zcr_${code}.djhtm`, '_blank');
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-purple-950/60 border border-purple-700 text-purple-300 hover:bg-purple-900/60"
                  >
                    富邦損益表
                  </button>
                </div>
              </div>

              {/* 存銷比雙軸圖 */}
              <AdvancedInventoryRatioChart 
                monthlyData={result.monthlyData} 
                quarterlyData={result.quarterlyData} 
                currencyUnit={result.currencyUnit} 
              />

              {/* 改良版 ROIC 圖 */}
              <AdvancedEbitdaROICChart 
                quarterlyData={result.quarterlyData} 
              />

              {/* 景氣波浪圖與 DCF 指引 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-zinc-300 mb-2">當前循環位階</div>
                  <CycleWaveMap activeStage={result.cycleStage} />
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed bg-zinc-800/60 p-2.5 rounded border border-zinc-700/60">
                    <strong className="text-zinc-200">依據：</strong>{result.cycleAnalysis}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-pink-400 mb-2">💡 DCF 估值參數建議</div>
                    <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-800/60 p-3 rounded border border-zinc-700/60">
                      {result.dcfAdvice}
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-amber-300/80 bg-amber-950/20 p-2 rounded border border-amber-800/40">
                    提示：存銷比桃紅線高檔急升代表庫存堆積，此時反推隱含成長率若過高宜居高思危。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}