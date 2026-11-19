import React, { useEffect, useState } from 'react';

const ChipChart = ({ stockId, onClose }) => {
  const [chipData, setChipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChip = async () => {
      try {
        setLoading(true);
        setError(null);

        const cleanId = String(stockId).match(/[0-9a-zA-Z]+/)?.[0] || '6140';
        
        // 直接呼叫同網域下的 Vercel API
        const res = await fetch(`/api/chip?stock_id=${cleanId}`);
        if (!res.ok) {
          throw new Error('無法取得籌碼數據，請稍後再試');
        }
        const data = await res.json();
        setChipData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChip();
  }, [stockId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm pointer-events-auto">
      <div className="relative bg-[#121212] rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-gray-200">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-bold tracking-wider text-lg">
              {stockId} 籌碼集中度分析
            </h3>
            {chipData?.date && (
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                資料日期: {chipData.date}
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
              ⏳ 即時分析 Yahoo 與北城籌碼中...
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
                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-400">單日集中度 (前15大)</div>
                  <div className={`text-xl font-bold mt-1 ${parseFloat(chipData.day1_concentration) >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {chipData.day1_concentration}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-400">5日集中度 (北城)</div>
                  <div className={`text-xl font-bold mt-1 ${parseFloat(chipData.day5_concentration) >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {chipData.day5_concentration}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-zinc-800 text-center">
                  <div className="text-xs text-zinc-400">主力買賣超</div>
                  <div className={`text-xl font-bold mt-1 ${chipData.net_major_1d >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {chipData.net_major_1d > 0 ? `+${chipData.net_major_1d}` : chipData.net_major_1d} 張
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
      </div>
    </div>
  );
};

export default ChipChart;