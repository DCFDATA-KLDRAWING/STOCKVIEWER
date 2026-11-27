import React, { useState, useMemo, useEffect, useCallback } from 'react';

const IconWrap = ({ size = 14, className = '', children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const X = ({ size = 14, className = '' }) => (
  <IconWrap size={size} className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconWrap>
);

const Search = ({ size = 14, className = '' }) => (
  <IconWrap size={size} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </IconWrap>
);

const TrendingUp = ({ size = 14, className = '' }) => (
  <IconWrap size={size} className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconWrap>
);

const RefreshCw = ({ size = 14, className = '' }) => (
  <IconWrap size={size} className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </IconWrap>
);

const ClipboardPaste = ({ size = 14, className = '' }) => (
  <IconWrap size={size} className={className}>
    <path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3a1 1 0 0 0-1-1Z" />
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
  </IconWrap>
);

const INITIAL_REVENUE_ROWS = [
  { rank: 1, code: '2530', name: '華建', metricText: '15.52億', rateText: '7546.40%', price: '17.90元', capital: '2708.00億元', note: '本年度出售房地收入較去年度減少4,470,228仟元,本年度租金收入較去年度同期減少700仟元.' },
  { rank: 2, code: '4416', name: '三圓', metricText: '2.60億', rateText: '6889.66%', price: '7.77元', capital: '600.00億元', note: '出售資產' },
  { rank: 3, code: '5523', name: '豐謙', metricText: '2247萬', rateText: '5894.40%', price: '30.50元', capital: '1550.00億元', note: '本月營收認列建案及租賃收入所致。' },
  { rank: 4, code: '2442', name: '新美齊', metricText: '15.69億', rateText: '5522.59%', price: '11.35元', capital: '2636.00億元', note: '本年累計營收較去年同期增加，主係本期營建專案交屋認列收入增加所致。' },
  { rank: 5, code: '6169', name: '昱泉', metricText: '623萬', rateText: '2269.20%', price: '10.45元', capital: '234.00億元', note: '本月營收增加係認列一次性遊戲平台授權金。累積營收減少主係授權收入減少所致。' },
  { rank: 6, code: '6576', name: '逸達', metricText: '1.25億', rateText: '1895.41%', price: '69.70元', capital: '1002.00億元', note: '本月營收較去年同期增加，係因本期認列新劑型新藥Camcevi授權開發里程金收入，去年同期並無所致。' },
  { rank: 7, code: '9946', name: '三發地產', metricText: '7448萬', rateText: '1845.90%', price: '13.25元', capital: '3008.00億元', note: '本月及累月營收較去年同期增加，係因預售建案完工本月交屋入帳所致。' },
  { rank: 8, code: '2539', name: '櫻花建', metricText: '22.88億', rateText: '1314.14%', price: '28.60元', capital: '4613.00億元', note: '無異常。本月有「櫻花市鎮之櫻」、「櫻花柳川之櫻」、「櫻花詠綻」建案陸續過戶中。' },
  { rank: 9, code: '6423', name: '億而得', metricText: '5516萬', rateText: '1073.18%', price: '73.40元', capital: '—', note: '本公司115年10月營業收入較去年同期增加，主要係因115年10月權利金收入增加所致。' },
  { rank: 10, code: '2596', name: '綠意', metricText: '2875萬', rateText: '1040.01%', price: '31.10元', capital: '1000.00億元', note: '本公司「綠意領航1號」建案完工交屋，故本年累計營業收入淨額較去年同期增加。' },
  { rank: 11, code: '3308', name: '聯德', metricText: '369萬', rateText: '811.85%', price: '17.00元', capital: '986.00億元', note: '本公司10月分銷售無人機零件約293萬元，因此營收較去年同期增加' },
  { rank: 12, code: '2924', name: '宏太-KY', metricText: '1095萬', rateText: '526.96%', price: '16.10元', capital: '328.00億元', note: '因本期香港子公司新增成衣業務收入，及去年同期越南子公司依完比法認列工程收入較高所致。' },
  { rank: 13, code: '2254', name: '巨鎧精密-創', metricText: '1223萬', rateText: '480.55%', price: '110.50元', capital: '—', note: '本年累計營收較去年累計營收減少，係因客戶訂單減少所致。' },
  { rank: 14, code: '6101', name: '寬魚國際', metricText: '8483萬', rateText: '334.25%', price: '35.30元', capital: '1164.00億元', note: '本期營收較去年同期增加,係因本期演唱會規模較去年同期活動較大所致。' },
  { rank: 15, code: '3529', name: '力旺', metricText: '7.26億', rateText: '309.27%', price: '1970.00元', capital: '758.00億元', note: '' },
  { rank: 16, code: '2506', name: '太設', metricText: '3.92億', rateText: '294.76%', price: '8.27元', capital: '3870.00億元', note: '本月交屋較去年同期多' },
  { rank: 17, code: '1417', name: '嘉裕', metricText: '6815萬', rateText: '261.09%', price: '7.40元', capital: '2709.00億元', note: '' },
  { rank: 18, code: '3629', name: '地心引力', metricText: '320萬', rateText: '241.94%', price: '10.80元', capital: '322.00億元', note: '115/07入主後商業模式與交易標的改為公關活動標案。' },
  { rank: 19, code: '1456', name: '怡華', metricText: '5785萬', rateText: '223.61%', price: '14.70元', capital: '937.00億元', note: '本年累計認列建設收入較去年累計增加所致' },
  { rank: 20, code: '6617', name: '共信-KY', metricText: '931萬', rateText: '221.68%', price: '91.10元', capital: '—', note: '自2018年度起依據國際會計準則公報15號規定認列收入' },
  { rank: 21, code: '5301', name: '寶得利', metricText: '796萬', rateText: '217.80%', price: '6.40元', capital: '1380.00億元', note: '子公司受地緣政治影響,致使營收下滑。' },
  { rank: 22, code: '6674', name: '鋐寶科技', metricText: '7762萬', rateText: '181.42%', price: '18.40元', capital: '668.00億元', note: '部分前月遞延出貨之訂單，已於本月出貨' },
  { rank: 23, code: '5222', name: '全訊', metricText: '7308萬', rateText: '173.00%', price: '74.00元', capital: '—', note: '' },
  { rank: 24, code: '5205', name: '中茂', metricText: '132萬', rateText: '163.35%', price: '17.00元', capital: '170.00億元', note: '' },
  { rank: 25, code: '8476', name: '台境*', metricText: '3103萬', rateText: '152.56%', price: '15.30元', capital: '605.00億元', note: '因部分重大工程專案已逐漸完工，而新接獲案件尚未進入密集施工期導致收入認列降低。' },
  { rank: 26, code: '4702', name: '中美實', metricText: '1203萬', rateText: '151.39%', price: '9.65元', capital: '2250.00億元', note: '本月營收較去年同期增減變動達50％以上，主要是外銷銷售量增加所致。' },
  { rank: 27, code: '3209', name: '全科', metricText: '139.99億', rateText: '145.49%', price: '42.30元', capital: '1729.00億元', note: '115年10月銷貨客戶增加向本公司採購，以因應資通訊市場供需產銷變化。' },
  { rank: 28, code: '3516', name: '亞帝歐', metricText: '1.12億', rateText: '138.38%', price: '21.60元', capital: '519.00億元', note: '' },
  { rank: 29, code: '6441', name: '廣錠', metricText: '3025萬', rateText: '136.13%', price: '18.20元', capital: '308.00億元', note: '因子公司接獲專案，並按完工比列認列營收所致。' },
  { rank: 30, code: '3313', name: '斐成', metricText: '188萬', rateText: '132.92%', price: '8.20元', capital: '838.00億元', note: '本年累計營收較去年同期增加，主係本年合併子公司之營收增加所致。' },
  { rank: 31, code: '6589', name: '台康生技', metricText: '2.72億', rateText: '131.53%', price: '44.60元', capital: '1691.00億元', note: '本月:EG1206A達成里程碑依完工比例認列授權收入及CDMO業務成長。本年:自有產品授權金逐步認列及CDMO業務成長。' },
  { rank: 32, code: '3285', name: '微端', metricText: '1.75億', rateText: '130.72%', price: '61.00元', capital: '441.00億元', note: '因醫療產品及PCB鑽孔設備銷售量增加，致使整體營收較去年同期增加。' },
  { rank: 33, code: '4707', name: '磐亞', metricText: '1.50億', rateText: '128.49%', price: '23.10元', capital: '2865.00億元', note: '去年停工，致去年同期銷售量減少。' },
  { rank: 34, code: '1452', name: '宏益', metricText: '1.34億', rateText: '121.24%', price: '10.00元', capital: '1326.00億元', note: '' },
  { rank: 35, code: '6216', name: '居易', metricText: '7889萬', rateText: '120.43%', price: '17.55元', capital: '850.00億元', note: '主要客戶針對新機種開始拉貨，4G/5G 路由器和AP, switch 先前因缺料引起的出貨遞延到本月交貨' },
  { rank: 36, code: '6456', name: 'GIS-KY', metricText: '133.07億', rateText: '115.89%', price: '62.70元', capital: '3394.00億元', note: '主要係因市場需求增加所致。' },
  { rank: 37, code: '6725', name: '矽科宏晟', metricText: '6.66億', rateText: '114.13%', price: '185.50元', capital: '—', note: '因承接建廠專案，隨專案投入，營收與去年同期呈現成長。' },
  { rank: 38, code: '5533', name: '皇鼎', metricText: '1.30億', rateText: '110.71%', price: '13.45元', capital: '2852.00億元', note: '本月營收較去年同期增加達50%以上，係兩期個案營收組成因子不同。' },
  { rank: 39, code: '7777', name: '能率亞洲', metricText: '4208萬', rateText: '110.56%', price: '22.25元', capital: '—', note: '營業收入為投資標的之評價損益(含已實現及未實現)，投資標的的股數及公允價值變動情形，請參考本公司網站投資人專區/財務資訊。' },
  { rank: 40, code: '9912', name: '偉聯', metricText: '8865萬', rateText: '108.32%', price: '12.95元', capital: '544.00億元', note: '主要係本月新增客戶大額訂單出貨，致銷售金額大增，故本月營收較去年本月大幅增加。' }
];

const INITIAL_EPS_ROWS = [
  { rank: 1, code: '1550', name: '台全電機', metricText: 'EPS 5.59', rateText: '淨利 2.38億', price: '—', capital: '—', note: '營益 2.43億｜0()' },
  { rank: 2, code: '5262', name: '立達國際', metricText: 'EPS 4.45', rateText: '淨利 1.97億', price: '47.00元', capital: '—', note: '營益 2.65億｜5(47.00)' },
  { rank: 3, code: '1764', name: '長春石油', metricText: 'EPS 4.16', rateText: '淨利 21.20億', price: '—', capital: '—', note: '營益 16.93億｜0()' },
  { rank: 4, code: '2226', name: '中部汽車', metricText: 'EPS 3.29', rateText: '淨利 1.97億', price: '—', capital: '—', note: '營益 -382萬｜0()' },
  { rank: 5, code: '1775', name: '大東樹脂', metricText: 'EPS 3.13', rateText: '淨利 2.75億', price: '—', capital: '—', note: '營益 9414萬｜0()' },
  { rank: 6, code: '8368', name: '屏南有線', metricText: 'EPS 2.50', rateText: '淨利 5036萬', price: '—', capital: '—', note: '營益 8133萬｜0()' },
  { rank: 7, code: '6438', name: '迅得', metricText: 'EPS 2.46', rateText: '淨利 1.08億', price: '134.50元', capital: '—', note: '營益 1.19億｜27(134.50)' },
  { rank: 8, code: '3510', name: '易鼎', metricText: 'EPS 2.44', rateText: '淨利 4765萬', price: '—', capital: '—', note: '營益 5388萬｜0()' },
  { rank: 9, code: '2220', name: '南都汽車', metricText: 'EPS 2.29', rateText: '淨利 1.43億', price: '—', capital: '—', note: '營益 1.48億｜0()' },
  { rank: 10, code: '3539', name: '隨身遊戲', metricText: 'EPS 1.97', rateText: '淨利 2893萬', price: '—', capital: '—', note: '營益 3278萬｜0()' },
  { rank: 11, code: '8969', name: '北桃園', metricText: 'EPS 1.96', rateText: '淨利 6477萬', price: '—', capital: '—', note: '營益 1.10億｜0()' },
  { rank: 12, code: '9989', name: '天外天有', metricText: 'EPS 1.89', rateText: '淨利 9444萬', price: '—', capital: '—', note: '營益 1.07億｜0()' },
  { rank: 13, code: '8327', name: '洄瀾有線', metricText: 'EPS 1.87', rateText: '淨利 5612萬', price: '—', capital: '—', note: '營益 7545萬｜0()' },
  { rank: 14, code: '8957', name: '新唐城', metricText: 'EPS 1.78', rateText: '淨利 3575萬', price: '—', capital: '—', note: '營益 6013萬｜0()' },
  { rank: 15, code: '9968', name: '華歌爾', metricText: 'EPS 1.74', rateText: '淨利 1.39億', price: '—', capital: '—', note: '營益 8759萬｜0()' },
  { rank: 16, code: '6601', name: '三益科', metricText: 'EPS 1.62', rateText: '淨利 6814萬', price: '—', capital: '—', note: '營益 3349萬｜0()' },
  { rank: 17, code: '8350', name: '榮輪科技', metricText: 'EPS 1.62', rateText: '淨利 9751萬', price: '—', capital: '—', note: '營益 -681萬｜0()' },
  { rank: 18, code: '8975', name: '觀昇有線', metricText: 'EPS 1.50', rateText: '淨利 9359萬', price: '—', capital: '—', note: '營益 1.30億｜0()' },
  { rank: 19, code: '1548', name: '信昌機械', metricText: 'EPS 1.41', rateText: '淨利 1.67億', price: '—', capital: '—', note: '營益 693萬｜0()' },
  { rank: 20, code: '1498', name: '強冠企業', metricText: 'EPS 1.41', rateText: '淨利 7055萬', price: '—', capital: '—', note: '營益 7847萬｜0()' }
];

function formatPctValue(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '' || rawVal === '—') return '—';
  const str = String(rawVal).trim();
  if (str.includes('%')) return str;
  const num = Number(str.replace(/,/g, ''));
  if (Number.isNaN(num)) return str;
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function normalizeApiRow(item, idx) {
  const rawRate =
    item.val2 ??
    item.rateText ??
    item.yoy ??
    item.revYoY ??
    item.yoyPct ??
    item.growthPct ??
    item.changePct ??
    item.momPct ??
    '—';

  const rawMetric =
    item.val1 ??
    item.metricText ??
    item.revenueText ??
    item.epsText ??
    item.revenue ??
    '—';

  return {
    rank: Number(item.rank) || idx + 1,
    code: String(item.code || item.stockId || item.symbol || '').trim(),
    name: String(item.name || item.stockName || '').trim(),
    metricText: String(rawMetric),
    rateText: formatPctValue(rawRate),
    price: item.price || '—',
    capital: item.capital || '—',
    note: item.note || ''
  };
}

function parsePastedRanking(rawText) {
  const text = (rawText || '').trim();
  if (!text) return [];
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json.map(normalizeApiRow).filter(r => r.code && r.name);
    }
  } catch (_) {}

  return text
    .split(/[,\n]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((tok, idx) => {
      const m = tok.match(/^([0-9A-Za-z*]+)\s+(.+)$/);
      if (!m) return null;
      return {
        rank: idx + 1,
        code: m[1].trim(),
        name: m[2].trim(),
        metricText: '—',
        rateText: '—',
        price: '—',
        capital: '—',
        note: ''
      };
    })
    .filter(Boolean);
}
const RevenueRankingModal = ({ isOpen, onClose, onSelectStock }) => {
  const [tab, setTab] = useState('revenue'); // 'revenue' | 'eps'
  const [revenueRows, setRevenueRows] = useState(INITIAL_REVENUE_ROWS);
  const [epsRows, setEpsRows] = useState(INITIAL_EPS_ROWS);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchTabRanking = useCallback(async (targetTab) => {
    setLoading(true);
    const reportType = targetTab === 'revenue' ? 'tendy_rev' : 'tendy_eps';
    try {
      const res = await fetch(`/api/chip?mode=rankings&type=${reportType}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.rankings)
        ? data.rankings.map(normalizeApiRow).filter(r => r.code && r.name)
        : [];

      if (list.length > 0) {
        if (targetTab === 'revenue') setRevenueRows(list);
        else setEpsRows(list);
        setStatusMsg(`已同步${targetTab === 'revenue' ? '營收排行' : 'EPS 排行'}（${list.length} 筆）`);
      } else {
        setStatusMsg(`目前維持內建/已載入${targetTab === 'revenue' ? '營收排行' : 'EPS 排行'}資料`);
      }
    } catch (_) {
      setStatusMsg(`後端未更新或抓取逾時，已保留內建/已載入${targetTab === 'revenue' ? '營收排行' : 'EPS 排行'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchTabRanking(tab);
  }, [isOpen, tab, fetchTabRanking]);

  const currentRows = tab === 'revenue' ? revenueRows : epsRows;

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return currentRows;
    return currentRows.filter(
      r =>
        String(r.code).toLowerCase().includes(q) ||
        String(r.name).toLowerCase().includes(q) ||
        String(r.note).toLowerCase().includes(q)
    );
  }, [currentRows, keyword]);

  if (!isOpen) return null;

  const handleImportData = () => {
    const parsed = parsePastedRanking(pasteInput);
    if (parsed.length === 0) {
      setStatusMsg('無法辨識內容，請貼上「2530 華建,4416 三圓」或 JSON 陣列。');
      return;
    }
    if (tab === 'revenue') setRevenueRows(parsed);
    else setEpsRows(parsed);
    setStatusMsg(`已更新${tab === 'revenue' ? '營收排行' : 'EPS 排行'}（共 ${parsed.length} 筆）。`);
    setPasteInput('');
    setShowImporter(false);
  };

  const handlePickStock = (row) => {
    if (typeof onSelectStock === 'function') {
      // 🌟 把當前這個分頁（營收 40 檔或 EPS 20 檔）的所有代號打包成陣列一起傳出去
      const allCodesInTab = currentRows.map(r => String(r.code).trim()).filter(Boolean);
      onSelectStock(row.code, row.name, allCodesInTab);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[270] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" />
            <h2 className="text-sm sm:text-base font-black text-amber-300">
              4. 營收與 EPS 排行觀察
            </h2>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              點選股票直接切換至主畫面 K 線圖
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTabRanking(tab)}
              disabled={loading}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 重新抓
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImporter(!showImporter);
                setStatusMsg('');
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition-colors"
            >
              <ClipboardPaste size={13} /> 貼入/更新
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
            >
              <X size={14} /> 關閉
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="inline-flex bg-slate-800 p-1 rounded-xl border border-slate-700 self-start">
            <button
              type="button"
              onClick={() => setTab('revenue')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'revenue'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              營收排行 ({revenueRows.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('eps')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'eps'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EPS 排行 ({epsRows.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋股號、股名或題材說明..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {showImporter && (
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 space-y-2">
            <div className="text-xs text-slate-300 font-bold">
              貼上「{tab === 'revenue' ? '營收排行' : 'EPS 排行'}」資料（支援 `2530 華建,4416 三圓` 或 JSON 陣列）：
            </div>
            <textarea
              rows={3}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="例如：2530 華建,4416 三圓,5523 豐謙"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono outline-none focus:border-amber-400"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImporter(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImportData}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                套用至{tab === 'revenue' ? '營收排行' : 'EPS 排行'}
              </button>
            </div>
          </div>
        )}

        {statusMsg && (
          <div className="px-4 py-1.5 bg-slate-800/60 border-b border-slate-800 text-xs text-amber-300">
            {statusMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {loading && filteredRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              正在抓取排行資料...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              找不到符合條件的股票
            </div>
          ) : (
            filteredRows.map((row) => (
              <div
                key={`${tab}-${row.code}-${row.rank}`}
                onClick={() => handlePickStock(row)}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/70 rounded-xl p-3 cursor-pointer transition-all group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 text-xs font-black flex items-center justify-center transition-colors">
                      {row.rank}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      {row.name}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                      {row.code}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-sky-300">{row.metricText}</span>
                    <span className="font-mono font-bold text-rose-300">{row.rateText}</span>
                    {row.price && row.price !== '—' && (
                      <span className="font-mono text-slate-300">股價 {row.price}</span>
                    )}
                    {row.capital && row.capital !== '—' && (
                      <span className="text-slate-400">股本 {row.capital}</span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      看 K 線圖 →
                    </span>
                  </div>
                </div>

                {row.note && (
                  <p className="mt-2 text-xs text-slate-300/90 leading-relaxed pl-8">
                    {row.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueRankingModal;