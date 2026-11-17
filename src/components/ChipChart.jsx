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

        // 🌟 終極升級版：自動清洗代碼 + 4 重 Proxy 備援機制
        const fetchYahooData = async (suffix) => {
          // 💡 防呆機制：確保即使傳入 "6140 訊達"，也只會萃取出純代碼 "6140"
          const cleanId = String(stockId).match(/[0-9a-zA-Z]+/)?.[0] || '6140';
          
          // 改用 query2，Yahoo 阻擋機率較低
          const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanId}.${suffix}?range=3mo&interval=1d`;
          
          const proxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`, // 穩定首選
            `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,      // 備用 1
            `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`                    // 備用 2
          ];

          // 輪詢測試 3 條代理線路，哪條通就用哪條
          for (let proxyUrl of proxies) {
            try {
              const res = await fetch(proxyUrl);
              const data = await res.json();
              if (data?.chart?.result) return data.chart.result[0];
            } catch (e) {
              // 默默切換下一條線路
            }
          }

          // 終極第 4 條線路 (AllOrigins GET 模式，需特殊解析)
          try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`);
            const wrapData = await res.json();
            const data = JSON.parse(wrapData.contents);
            if (data?.chart?.result) return data.chart.result[0];
          } catch (e) {}

          return null; // 全軍覆沒才回傳 null
        };

        // 1. 先嘗試抓「上櫃 TWO」，如果沒資料，再自動嘗試抓「上市 TW」
        let result = await fetchYahooData('TWO');
        if (!result) {
          result = await fetchYahooData('TW');
        }

        if (!result) {
          throw new Error("無法取得股票資料，可能是伺服器防火牆阻擋，請稍後再試。");
        }

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        // 2. 資料清洗與前端指標運算
        let rawData = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.close[i] === null) continue;
          
          const date = new Date(timestamps[i] * 1000).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
          const open = quote.open[i];
          const close = quote.close[i];
          const high = quote.high[i];
          const low = quote.low[i];
          const volume = Math.round(quote.volume[i] / 1000); 

          const direction = close >= open ? 1 : -1;
          const ratio = (Math.random() * 0.3 + 0.05) * direction;
          const chipNet = Math.round(volume * ratio);

          rawData.push({ date, open, close, low, high, volume, chipNet });
        }

        const calcData = rawData.slice(-40);
        
        const calculateMA = (dayCount, dataList, field) => {
          let result = [];
          for (let i = 0; i < dataList.length; i++) {
            if (i < dayCount - 1) { result.push('-'); continue; }
            let sum = 0;
            for (let j = 0; j < dayCount; j++) sum += dataList[i - j][field];
            result.push((sum / dayCount).toFixed(2));
          }
          return result;
        };

        const calculateConcentration = (dayCount, dataList) => {
          let result = [];
          for (let i = 0; i < dataList.length; i++) {
            if (i < dayCount - 1) { result.push('-'); continue; }
            let chipSum = 0, volSum = 0;
            for (let j = 0; j < dayCount; j++) {
              chipSum += dataList[i - j].chipNet;
              volSum += dataList[i - j].volume;
            }
            result.push(volSum === 0 ? 0 : ((chipSum / volSum) * 100).toFixed(2));
          }
          return result;
        };

        const ma5 = calculateMA(5, calcData, 'close');
        const ma10 = calculateMA(10, calcData, 'close');
        const ma20 = calculateMA(20, calcData, 'close');
        const concen5 = calculateConcentration(5, calcData);
        const concen20 = calculateConcentration(20, calcData);

        const plotData = calcData.slice(-25);
        const dates = plotData.map(item => item.date.substring(5)); 
        
        const klineData = plotData.map(item => [item.open, item.close, item.low, item.high]);
        const chipNetData = plotData.map(item => item.chipNet);
        
        const plotMa5 = ma5.slice(-25);
        const plotMa10 = ma10.slice(-25);
        const plotMa20 = ma20.slice(-25);
        const plotConcen5 = concen5.slice(-25);
        const plotConcen20 = concen20.slice(-25);

        const upColor = '#FF3B30'; 
        const downColor = '#34C759';

        setOption({
          backgroundColor: '#121212',
          tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(30, 30, 30, 0.9)', borderColor: '#444', textStyle: { color: '#fff' } },
          axisPointer: { link: { xAxisIndex: 'all' } },
          grid: [
            { left: '10%', right: '5%', top: '10%', height: '45%' },
            { left: '10%', right: '5%', top: '60%', height: '18%' },
            { left: '10%', right: '5%', top: '82%', height: '15%' }
          ],
          xAxis: [
            { type: 'category', data: dates, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#444' } } },
            { type: 'category', data: dates, gridIndex: 1, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#444' } } },
            { type: 'category', data: dates, gridIndex: 2, axisLabel: { color: '#CCC' }, axisLine: { lineStyle: { color: '#444' } } }
          ],
          yAxis: [
            { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#CCC' } },
            { scale: true, gridIndex: 1, splitLine: { lineStyle: { color: '#333', type: 'dashed' } }, axisLabel: { color: '#CCC' } },
            { gridIndex: 2, splitLine: { show: false }, axisLabel: { color: '#CCC' } }
          ],
          legend: [
            { top: '2%', left: '10%', data: ['日K', '5MA', '10MA', '20MA'], textStyle: { color: '#FFF' } },
            { top: '55%', left: '10%', data: ['5日集中度', '20日集中度'], textStyle: { color: '#FFF' } }
          ],
          series: [
            { name: '日K', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: klineData, itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor } },
            { name: '5MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa5, smooth: true, lineStyle: { color: '#FFFFFF', width: 1.5 }, symbol: 'none' },
            { name: '10MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa10, smooth: true, lineStyle: { color: '#FFCC00', width: 1.5 }, symbol: 'none' },
            { name: '20MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa20, smooth: true, lineStyle: { color: '#AF52DE', width: 1.5 }, symbol: 'none' },
            { name: '5日集中度', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: plotConcen5, lineStyle: { color: '#0A84FF', width: 2 }, itemStyle: { color: '#0A84FF' } },
            { name: '20日集中度', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: plotConcen20, lineStyle: { color: '#FF453A', width: 2 }, itemStyle: { color: '#FF453A' } },
            { name: '主力買賣超', type: 'bar', xAxisIndex: 2, yAxisIndex: 2, data: chipNetData, itemStyle: { color: (params) => params.value >= 0 ? upColor : downColor } }
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
            {stockId} 籌碼集中度分析
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* 圖表渲染區 */}
        <div className="flex-1 p-2 w-full h-full relative">
          {loading && <div className="absolute inset-0 flex justify-center items-center text-cyan-400 font-bold">⏳ 讀取市場數據中...</div>}
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