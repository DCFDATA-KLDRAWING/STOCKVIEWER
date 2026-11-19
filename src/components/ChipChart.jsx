import React, { useEffect, useState } from 'react';

// 向 FinMind 取得最近一個交易日的成交量（張）
async function fetchFinMindLatestVolumeLots(stockId, apiKey = '') {
  const start = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    dataset: 'TaiwanStockPrice',
    data_id: stockId,
    start_date: startDate,
  });
  if (apiKey) {
    params.append('token', apiKey);
  }

  const res = await fetch(`https://api.finmindtrade.com/api/v4/data?${params.toString()}`);
  if (!res.ok) return null;

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : [];

  for (let i = rows.length - 1; i >= 0; i--) {
    const rawVol = Number(rows[i]?.Trading_Volume);
    if (!Number.isNaN(rawVol) && rawVol > 0) {
      const lots = Math.round(rawVol / 1000);
      if (lots > 0) return lots;
    }
  }
  return null;
}

const REPORT_OPTIONS = [
  { key: 'conc_5d', label: '🔥 5日籌碼集中度' },
  { key: 'conc_1d', label: '⚡ 1日籌碼集中度' },
  { key: 'conc_20d', label: '🌊 20日籌碼集中度' },
  { key: 'it_buy_1d', label: '🟢 投信1日買超前20名' },
  { key: 'it_buy_5d', label: '🟢 投信5日買超前20名' },
  { key: 'it_sell_1d', label: '🔴 投信1日賣超前20名' },
  { key: 'it_sell_5d', label: '🔴 投信5日賣超前20名' },
  { key: 'prev_strong', label: '📈 昨強勢股' },
];

const ChipChart = ({
  stockId,
  onClose,
  finmindApiKey,
  onSelectStock,
  initialShowRank = false,
  visitedCodes = [],
  onMarkVisited,
}) => {
  const [chipData, setChipData] = useState(null);
  const [day1ConcentrationStr, setDay1ConcentrationStr] = useState('-');
  const [volumeLots, setVolumeLots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 排行榜狀態
  const [showRankModal, setShowRankModal] = useState(initialShowRank);
  const [currentReportType, setCurrentReportType] = useState('conc_5d');
  const [rankingList, setRankingList] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);

  // 載入指定排行榜
  const loadRankings = async (typeKey = currentReportType) => {
    try {
      setRankLoading(true);
      const res = await fetch(`/api/chip?mode=rankings&type=${encodeURIComponent(typeKey)}`);
      if (!res.ok) throw new Error('讀取排行榜失敗');
      const data = await res.json();
      setRankingList(data?.rankings || []);
    } catch (e) {
      console.error(e);
      setRankingList([]);
    } finally {
      setRankLoading(false);
    }
  };

  useEffect(() => {
    if (initialShowRank) {
      setShowRankModal(true);
      loadRankings(currentReportType);
    }
  }, [initialShowRank]);

  // 切換選單類別
  const handleTypeChange = (newType) => {
    setCurrentReportType(newType);
    loadRankings(newType);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        setDay1ConcentrationStr('-');
        setVolumeLots(null);

        const cleanId = String(stockId || '').match(/[0-9a-zA-Z]+/)?.[0] || '6140';
        const effectiveKey =
          finmindApiKey || localStorage.getItem('MY_STOCK_FINMIND_KEY') || '';

        const [chipRes, lots] = await Promise.all([
          fetch(`/api/chip?stock_id=${encodeURIComponent(cleanId)}`),
          fetchFinMindLatestVolumeLots(cleanId, effectiveKey),
        ]);

        if (!chipRes.ok) {
          throw new Error('無法取得籌碼數據，請稍後再試');
        }

        const data = await chipRes.json();
        setChipData(data);
        setVolumeLots(lots);

        const netMajor = Number(data?.net_major_1d ?? 0);
        if (lots && lots > 0) {
          const pct = ((netMajor / lots) * 100).toFixed(2);
          setDay1ConcentrationStr(`${pct}%`);
        } else {
          setDay1ConcentrationStr('-');
        }
      } catch (err) {
        setError(err.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [stockId, finmindApiKey]);

  // 開啟並載入排行榜
  const handleOpenRankings = async () => {
    setShowRankModal(true);
    await loadRankings(currentReportType);
  };

  // 點擊股號切換 K 線圖
  const handleStockClick = (targetCode) => {
    if (onMarkVisited) {
      onMarkVisited(targetCode);
    }
    if (onSelectStock) {
      onSelectStock(targetCode);
    }
    setShowRankModal(false);
    if (onClose) {
      onClose(); // 切換後關閉籌碼彈窗回到 K 線看圖
    }
  };

  const day1Num = parseFloat(day1ConcentrationStr);
  const day5Num = parseFloat(chipData?.day5_concentration);
  const netMajorVal = Number(chipData?.net_major_1d ?? 0);
  const visitedSet = new Set(visitedCodes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm pointer-events-auto">
      <div className="relative bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-gray-200">

        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-b border-gray-800">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-white font-bold tracking-wider text-lg">
              {stockId} 籌碼集中度分析
            </h3>
            {chipData?.date && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                資料日期: {chipData.date}
              </span>
            )}
            {volumeLots && (
              <span className="text-xs bg-zinc-800 text-cyan-300 px-2 py-0.5 rounded">
                成交量: {volumeLots.toLocaleString()} 張
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading && (
            <div className="h-64 flex justify-center items-center text-cyan-400 font-bold">
              ⏳ 即時分析籌碼與成交量中...
            </div>
          )}

          {error && (
            <div className="h-64 flex flex-col justify-center items-center text-red-400 font-bold">
              <span className="text-4xl mb-2">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && chipData && (
            <div className="space-y-4">
              {/* 頂部數據卡片 */}
              <div className="grid grid-cols-3 gap-3">
                {/* 1日集中度 */}
                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-400">單日集中度 (前15大)</div>
                  <div
                    className={`text-xl font-bold mt-1 ${
                      !Number.isNaN(day1Num) && day1Num >= 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {day1ConcentrationStr}
                  </div>
                </div>

                {/* 5日集中度 */}
                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center relative flex flex-col justify-between items-center">
                  <div className="text-xs text-zinc-400">5日集中度</div>
                  <div
                    className={`text-xl font-bold mt-1 ${
                      !Number.isNaN(day5Num) && day5Num >= 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {chipData.day5_concentration}
                  </div>
                  {/* 排行榜連結點 */}
                  <button
                    onClick={handleOpenRankings}
                    className="mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-200 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>📊 點此查看排行</span>
                  </button>
                </div>

                {/* 主力買賣超 */}
                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-400">主力買賣超</div>
                  <div
                    className={`text-xl font-bold mt-1 ${
                      netMajorVal >= 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {netMajorVal > 0 ? `+${netMajorVal}` : netMajorVal} 張
                  </div>
                </div>
              </div>

              {/* 前 15 大買賣超分點對照表 */}
              <div className="bg-[#1a1a1a] rounded-lg border border-zinc-800 p-3">
                <div className="text-sm font-semibold text-zinc-300 mb-2">前 15 大分點買賣超明細</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* 買超 */}
                  <div>
                    <div className="text-red-400 font-bold mb-1 pb-1 border-b border-zinc-800 flex justify-between">
                      <span>買超券商</span>
                      <span>張數</span>
                    </div>
                    {chipData.buyers_top15?.map((b) => (
                      <div key={b.rank} className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-300">{b.rank}. {b.name}</span>
                        <span className="text-red-400 font-mono">+{b.volume}</span>
                      </div>
                    ))}
                  </div>

                  {/* 賣超 */}
                  <div>
                    <div className="text-emerald-400 font-bold mb-1 pb-1 border-b border-zinc-800 flex justify-between">
                      <span>賣超券商</span>
                      <span>張數</span>
                    </div>
                    {chipData.sellers_top15?.map((s) => (
                      <div key={s.rank} className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-300">{s.rank}. {s.name}</span>
                        <span className="text-emerald-400 font-mono">{s.volume}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 多報表排行榜彈窗（附帶切換選單） */}
        {showRankModal && (
          <div className="absolute inset-0 bg-[#161616] z-50 flex flex-col">
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-bold hidden sm:inline">排行類別:</span>
                <select
                  value={currentReportType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="bg-zinc-800 text-cyan-300 border border-zinc-700 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-bold"
                >
                  {REPORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 hidden xs:inline">點擊股號切換K線</span>
                <button
                  onClick={() => setShowRankModal(false)}
                  className="text-gray-300 hover:text-white px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs border border-zinc-700"
                >
                  返回
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {rankLoading ? (
                <div className="h-48 flex items-center justify-center text-cyan-400 text-sm">
                  ⏳ 正在載入最新排行榜...
                </div>
              ) : rankingList.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                  查無該排行資料或外部報表更新中
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-zinc-400 bg-zinc-800/80 sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="p-2 text-center w-10">#</th>
                      <th className="p-2">股號 / 名稱 (點擊看K線)</th>
                      <th className="p-2 text-right">
                        {rankingList[0]?.val1_label || '指標1'}
                      </th>
                      {rankingList[0]?.val2_label && (
                        <th className="p-2 text-right">
                          {rankingList[0]?.val2_label}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {rankingList.map((item) => {
                      const isVisited = visitedSet.has(String(item.code));
                      const v1Num = parseFloat(item.val1);
                      const v2Num = parseFloat(item.val2);

                      return (
                        <tr
                          key={`${item.code}-${item.rank}`}
                          className={`hover:bg-zinc-800/40 transition-colors ${
                            isVisited ? 'bg-zinc-900/60' : ''
                          }`}
                        >
                          <td className="p-2 text-center text-zinc-500 font-mono">{item.rank}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleStockClick(item.code)}
                              className="text-cyan-400 font-bold hover:underline hover:text-cyan-200 text-left flex items-center gap-1.5"
                            >
                              <span className="bg-cyan-950/60 border border-cyan-800 px-1 rounded text-cyan-300 font-mono">
                                {item.code}
                              </span>
                              <span className={isVisited ? 'text-zinc-400' : ''}>{item.name}</span>
                              {isVisited && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded">
                                  已看
                                </span>
                              )}
                            </button>
                          </td>
                          <td
                            className={`p-2 text-right font-mono ${
                              !Number.isNaN(v1Num) && v1Num >= 0 ? 'text-red-400 font-bold' : 'text-zinc-300'
                            }`}
                          >
                            {item.val1}
                          </td>
                          {item.val2_label && (
                            <td
                              className={`p-2 text-right font-mono ${
                                !Number.isNaN(v2Num) && v2Num >= 0 ? 'text-red-400 font-bold' : 'text-zinc-300'
                              }`}
                            >
                              {item.val2}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChipChart;