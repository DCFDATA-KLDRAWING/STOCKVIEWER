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

        const cleanId = String(stockId).match(/[0-9a-zA-Z]+/)?.[0] || '6140';

        // ==========================================
        // 1. 從 Google Sheets 抓取「真實籌碼歷史」
        // ==========================================
        const fetchGoogleSheetHistory = async () => {
          try {
            const sheetUrl = 'https://docs.google.com/spreadsheets/d/1qXbIbn0wYDZlokHogl5cWUAOLtH613PJb2Akc2kT_Qk/gviz/tq?tqx=out:csv&sheet=籌碼歷史';
            const res = await fetch(sheetUrl);
            const csvText = await res.text();
            
            const chipMap = {};
            const lines = csvText.split('\n');
            lines.forEach(line => {
              const parts = line.replace(/"/g, '').split(',');
              // 假設 Google Sheet 格式: [日期, 代碼, 名稱, 集中度] (例如: 2026-11-17, 6140, 訊達, 15.3)
              if (parts.length >= 4 && parts[1] === cleanId) {
                // 將日期統一轉為 YYYY-MM-DD 格式作為 Key
                const dateKey = parts[0].trim();
                const concenValue = parseFloat(parts[3]);
                if (!isNaN(concenValue)) {
                  chipMap[dateKey] = concenValue;
                }
              }
            });
            return chipMap;
          } catch (e) {
            console.warn("無法取得 Google Sheet 籌碼歷史:", e);
            return {}; // 失敗則回傳空物件，不影響 K 線顯示
          }
        };

        // ==========================================
        // 2. 從 Yahoo 抓取「K 線資料」(保留您的 Proxy 備援機制)
        // ==========================================
        const fetchYahooData = async (suffix) => {
          const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanId}.${suffix}?range=3mo&interval=1d`;
          const proxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`
          ];

          for (let proxyUrl of proxies) {
            try {
              const res = await fetch(proxyUrl);
              const data = await res.json();
              if (data?.chart?.result) return data.chart.result[0];
            } catch (e) {}
          }
          return null;
        };

        // 同時發動兩個請求，節省等待時間
        const [chipHistoryMap, yahooResult] = await Promise.all([
          fetchGoogleSheetHistory(),
          fetchYahooData('TWO').then(res => res ? res : fetchYahooData('TW'))
        ]);

        if (!yahooResult) {
          throw new Error("無法取得 K 線資料，可能是伺服器防火牆阻擋，請稍後再試。");
        }

        const timestamps = yahooResult.timestamp;
        const quote = yahooResult.indicators.quote[0];

        // ==========================================
        // 3. 資料清洗與合併 (將真實集中度塞入 K 線)
        // ==========================================
        let rawData = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.close[i] === null) continue;
          
          // 轉換 Yahoo timestamp 為 YYYY-MM-DD 以便與 Sheet 比對
          const d = new Date(timestamps[i] * 1000);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const fullDateKey = `${yyyy}-${mm}-${dd}`;
          const shortDate = `${mm}/${dd}`; // 顯示用
          
          const open = quote.open[i];
          const close = quote.close[i];
          const high = quote.high[i];
          const low = quote.low[i];
          const volume = Math.round(quote.volume[i] / 1000); 

          // 🔥 神奇的一刻：從 Google Sheet 中拿出對應日期的真實集中度！
          // 如果那天剛好沒抓到資料，就填入 '-'，ECharts 會自動讓線條斷開，不會畫錯。
          const realConcen = chipHistoryMap[fullDateKey] !== undefined ? chipHistoryMap[fullDateKey] : '-';

          rawData.push({ date: shortDate, open, close, low, high, volume, concentration: realConcen });
        }

        const calcData = rawData.slice(-40);
        
        // 計算 K 線均線 (MA)
        const calculateMA = (dayCount, dataList) => {
          let result = [];
          for (let i = 0; i < dataList.length; i++) {
            if (i < dayCount - 1) { result.push('-'); continue; }
            let sum = 0;
            for (let j = 0; j < dayCount; j++) sum += dataList[i - j].close;
            result.push((sum / dayCount).toFixed(2));
          }
          return result;
        };

        const ma5 = calculateMA(5, calcData);
        const ma10 = calculateMA(10, calcData);
        const ma20 = calculateMA(20, calcData);

        // 取最後 25 天繪圖
        const plotData = calcData.slice(-25);
        const dates = plotData.map(item => item.date); 
        
        const klineData = plotData.map(item => [item.open, item.close, item.low, item.high]);
        
        // 抓出要畫的均線與集中度
        const plotMa5 = ma5.slice(-25);
        const plotMa10 = ma10.slice(-25);
        const plotMa20 = ma20.slice(-25);
        const plotRealConcen = plotData.map(item => item.concentration);

        const upColor = '#FF3B30'; 
        const downColor = '#34C759';

        // ==========================================
        // 4. ECharts 兩層式版面配置 (配合真實數據)
        // ==========================================
        setOption({
          backgroundColor: '#121212',
          tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(30, 30, 30, 0.9)', borderColor: '#444', textStyle: { color: '#fff' } },
          axisPointer: { link: { xAxisIndex: 'all' } },
          grid: [
            { left: '10%', right: '5%', top: '10%', height: '50%' }, // 上層 K 線
            { left: '10%', right: '5%', top: '65%', height: '25%' }  // 下層 集中度
          ],
          xAxis: [
            { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#444' } } },
            { type: 'category', data: dates, gridIndex: 1, axisLabel: { color: '#CCC' }, axisLine: { lineStyle: { color: '#444' } } }
          ],
          yAxis: [
            { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#CCC' } },
            { scale: true, gridIndex: 1, splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#CCC', formatter: '{value}%' } }
          ],
          legend: [
            { top: '2%', left: '10%', data: ['日K', '5MA', '10MA', '20MA'], textStyle: { color: '#FFF' } },
            { top: '60%', left: '10%', data: ['真實籌碼集中度'], textStyle: { color: '#FFF' } }
          ],
          series: [
            { name: '日K', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: klineData, itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor } },
            { name: '5MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa5, smooth: true, lineStyle: { color: '#FFFFFF', width: 1.5 }, symbol: 'none' },
            { name: '10MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa10, smooth: true, lineStyle: { color: '#FFCC00', width: 1.5 }, symbol: 'none' },
            { name: '20MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa20, smooth: true, lineStyle: { color: '#AF52DE', width: 1.5 }, symbol: 'none' },
            // 🔥 真實雲端籌碼線
            { 
              name: '真實籌碼集中度', 
              type: 'line', 
              xAxisIndex: 1, 
              yAxisIndex: 1, 
              data: plotRealConcen, 
              connectNulls: true, // 允許略過沒有資料的日子(如假日)連線
              lineStyle: { color: '#0A84FF', width: 2 }, 
              itemStyle: { color: '#0A84FF' },
              symbol: 'circle',
              symbolSize: 6
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
      <div className="relative bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-full max-w-5xl h-[85vh] flex flex-col">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-b border-gray-800">
          <h3 className="text-white font-bold tracking-wider text-lg">
            {stockId} 真實籌碼集中度分析
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* 圖表渲染區 */}
        <div className="flex-1 p-2 w-full h-full relative">
          {loading && <div className="absolute inset-0 flex justify-center items-center text-cyan-400 font-bold">⏳ 同步雲端歷史數據中...</div>}
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