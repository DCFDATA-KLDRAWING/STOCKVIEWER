import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const ChipChart = ({ stockId, onClose }) => {
  const [option, setOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDataAndDraw = async () => {
      try {
        setLoading(true);
        setError(null);

        // 防呆：取出純代碼 (例如 "6140")
        const cleanId = String(stockId).match(/[0-9a-zA-Z]+/)?.[0] || '6140';

        // ==========================================
        // 1. 純淨版：只從 Google Sheets 抓取真實籌碼歷史
        // ==========================================
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1qXbIbn0wYDZlokHogl5cWUAOLtH613PJb2Akc2kT_Qk/gviz/tq?tqx=out:csv&sheet=籌碼歷史';
        const res = await fetch(sheetUrl);
        
        if (!res.ok) {
          throw new Error("網路連線異常，無法讀取雲端資料庫。");
        }
        
        const csvText = await res.text();
        const rawData = [];
        const lines = csvText.split('\n');
        
        // 解析 CSV 內容
        lines.forEach(line => {
          const parts = line.replace(/"/g, '').split(',');
          // 確保是這檔股票，且格式正確 [日期, 代碼, 名稱, 集中度]
          if (parts.length >= 4 && String(parts[1]).trim() === cleanId) {
            const dateRaw = parts[0].trim();
            const concenValue = parseFloat(parts[3]);
            
            if (!isNaN(concenValue)) {
              // 把 2026-11-17 縮短為 11/17，讓 X 軸更好看
              const dateParts = dateRaw.split('-');
              const shortDate = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : dateRaw;
              
              rawData.push({ date: shortDate, concentration: concenValue });
            }
          }
        });

        if (rawData.length === 0) {
          throw new Error(`雲端資料庫中，目前找不到 ${cleanId} 的籌碼歷史紀錄。`);
        }

        // ==========================================
        // 2. 繪圖準備 (取最近 40 天的資料)
        // ==========================================
        const plotData = rawData.slice(-40);
        const dates = plotData.map(item => item.date);
        const concenData = plotData.map(item => item.concentration);

        // ==========================================
        // 3. ECharts 單層漸層專業圖表
        // ==========================================
        setOption({
          backgroundColor: '#121212',
          tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'cross' }, 
            backgroundColor: 'rgba(30, 30, 30, 0.9)', 
            borderColor: '#444', 
            textStyle: { color: '#fff' },
            valueFormatter: (value) => value + '%' // 滑鼠移上去自動加 %
          },
          grid: { 
            left: '12%', 
            right: '8%', 
            top: '15%', 
            bottom: '15%' 
          },
          xAxis: { 
            type: 'category', 
            data: dates, 
            axisLabel: { color: '#CCC' }, 
            axisLine: { lineStyle: { color: '#444' } },
            boundaryGap: false // 讓線條從最邊緣開始畫
          },
          yAxis: { 
            type: 'value',
            scale: true, 
            splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, 
            axisLabel: { color: '#CCC', formatter: '{value}%' } 
          },
          series: [
            { 
              name: '籌碼集中度', 
              type: 'line', 
              data: concenData, 
              lineStyle: { color: '#0A84FF', width: 3 }, 
              itemStyle: { color: '#0A84FF' },
              // 加上漸層面積，視覺效果更像專業看盤軟體
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(10, 132, 255, 0.6)' }, // 頂部較亮
                    { offset: 1, color: 'rgba(10, 132, 255, 0.05)' } // 底部透明
                  ]
                }
              },
              symbol: 'circle',
              symbolSize: 8,
              smooth: true // 讓折線平滑
            }
          ]
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndDraw();
  }, [stockId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm pointer-events-auto">
      <div className="relative bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl h-[70vh] flex flex-col">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-b border-gray-800 rounded-t-xl">
          <h3 className="text-white font-bold tracking-wider text-lg">
            {stockId} 籌碼集中度趨勢
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* 圖表渲染區 */}
        <div className="flex-1 p-4 w-full h-full relative">
          {loading && <div className="absolute inset-0 flex justify-center items-center text-cyan-400 font-bold">⏳ 讀取雲端歷史數據中...</div>}
          {error && <div className="absolute inset-0 flex flex-col justify-center items-center text-red-400 font-bold p-6 text-center">
            <span className="text-4xl mb-2">⚠️</span>
            <span>{error}</span>
          </div>}
          
          {!loading && !error && option && (
            <ReactECharts 
              option={option} 
              style={{ height: '100%', width: '100%' }} 
              notMerge={true}
              lazyUpdate={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChipChart;