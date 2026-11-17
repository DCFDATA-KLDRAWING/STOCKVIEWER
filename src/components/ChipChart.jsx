import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const ChipChart = ({ stockId, market = 'TWO', onClose }) => {
  const [option, setOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDataAndDraw = async () => {
      try {
        setLoading(true);
        // 1. 抓取 Yahoo 歷史資料 (使用 corsproxy 解決前端跨域問題)
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockId}.${market}?range=3mo&interval=1d`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;
        
        const res = await fetch(proxyUrl);
        const data = await res.json();
        
        if (!data.chart.result) throw new Error("找不到該檔股票資料");
        
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        // 2. 資料清洗與前端指標運算
        let rawData = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.close[i] === null) continue;
          
          // 轉換日期
          const date = new Date(timestamps[i] * 1000).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
          const open = quote.open[i];
          const close = quote.close[i];
          const high = quote.high[i];
          const low = quote.low[i];
          const volume = Math.round(quote.volume[i] / 1000); // 轉成張數

          // 模擬您的主力買賣超邏輯 (正負亂數)
          const direction = close >= open ? 1 : -1;
          const ratio = (Math.random() * 0.3 + 0.05) * direction;
          const chipNet = Math.round(volume * ratio);

          rawData.push({ date, open, close, low, high, volume, chipNet });
        }

        // 取最後 40 天來算均線，再切出最後 25 天顯示
        const calcData = rawData.slice(-40);
        
        // 輔助函式：計算 N 日移動平均
        const calculateMA = (dayCount, dataList, field) => {
          let result = [];
          for (let i = 0; i < dataList.length; i++) {
            if (i < dayCount - 1) {
              result.push('-');
              continue;
            }
            let sum = 0;
            for (let j = 0; j < dayCount; j++) {
              sum += dataList[i - j][field];
            }
            result.push((sum / dayCount).toFixed(2));
          }
          return result;
        };

        // 輔助函式：計算 N 日籌碼集中度
        const calculateConcentration = (dayCount, dataList) => {
          let result = [];
          for (let i = 0; i < dataList.length; i++) {
            if (i < dayCount - 1) {
              result.push('-');
              continue;
            }
            let chipSum = 0;
            let volSum = 0;
            for (let j = 0; j < dayCount; j++) {
              chipSum += dataList[i - j].chipNet;
              volSum += dataList[i - j].volume;
            }
            result.push(volSum === 0 ? 0 : ((chipSum / volSum) * 100).toFixed(2));
          }
          return result;
        };

        // 算出所有指標
        const ma5 = calculateMA(5, calcData, 'close');
        const ma10 = calculateMA(10, calcData, 'close');
        const ma20 = calculateMA(20, calcData, 'close');
        const concen5 = calculateConcentration(5, calcData);
        const concen20 = calculateConcentration(20, calcData);

        // 只取最後 25 天給圖表顯示 (符合您原本的切片邏輯)
        const plotData = calcData.slice(-25);
        const dates = plotData.map(item => item.date.substring(5)); // 取 MM/DD
        
        // K線資料格式：[開盤, 收盤, 最低, 最高]
        const klineData = plotData.map(item => [item.open, item.close, item.low, item.high]);
        const chipNetData = plotData.map(item => item.chipNet);
        
        const plotMa5 = ma5.slice(-25);
        const plotMa10 = ma10.slice(-25);
        const plotMa20 = ma20.slice(-25);
        const plotConcen5 = concen5.slice(-25);
        const plotConcen20 = concen20.slice(-25);

        // 3. 配置 ECharts 選項 (完美復刻三層三竹暗黑版)
        const upColor = '#FF3B30'; // 紅漲
        const downColor = '#34C759'; // 綠跌

        setOption({
          backgroundColor: '#121212',
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            borderColor: '#444',
            textStyle: { color: '#fff' }
          },
          // 讓三張圖的十字游標同步連動
          axisPointer: { link: { xAxisIndex: 'all' } },
          
          // 定義三層版面比例：K線(50%)、集中度(25%)、買賣超(25%)
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
          
          // 配置圖例
          legend: [
            { top: '2%', left: '10%', data: ['日K', '5MA', '10MA', '20MA'], textStyle: { color: '#FFF' } },
            { top: '55%', left: '10%', data: ['5日集中度', '20日集中度'], textStyle: { color: '#FFF' } }
          ],

          series: [
            // 第一層：K線與均線
            { name: '日K', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: klineData, itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor } },
            { name: '5MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa5, smooth: true, lineStyle: { color: '#FFFFFF', width: 1.5 }, symbol: 'none' },
            { name: '10MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa10, smooth: true, lineStyle: { color: '#FFCC00', width: 1.5 }, symbol: 'none' },
            { name: '20MA', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: plotMa20, smooth: true, lineStyle: { color: '#AF52DE', width: 1.5 }, symbol: 'none' },
            
            // 第二層：集中度雙線
            { name: '5日集中度', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: plotConcen5, lineStyle: { color: '#0A84FF', width: 2 }, itemStyle: { color: '#0A84FF' } },
            { name: '20日集中度', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: plotConcen20, lineStyle: { color: '#FF453A', width: 2 }, itemStyle: { color: '#FF453A' } },
            
            // 第三層：主力買賣超柱狀
            {
              name: '主力買賣超',
              type: 'bar',
              xAxisIndex: 2,
              yAxisIndex: 2,
              data: chipNetData,
              itemStyle: {
                color: (params) => params.value >= 0 ? upColor : downColor
              }
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
  }, [stockId, market]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="relative bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-full max-w-5xl h-[85vh] flex flex-col">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-b border-gray-800">
          <h3 className="text-white font-bold tracking-wider text-lg">
            {stockId} 籌碼集中度分析
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* 圖表渲染區 */}
        <div className="flex-1 p-2 w-full h-full relative">
          {loading && <div className="absolute inset-0 flex justify-center items-center text-white">⏳ 載入與計算中...</div>}
          {error && <div className="absolute inset-0 flex justify-center items-center text-red-500">❌ {error}</div>}
          
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