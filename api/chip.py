from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import re
import pandas as pd
from curl_cffi import requests

# 取得北城 5 日集中度原始表格
def fetch_beicheng_5d_table():
    url = "https://www.peicheng.com.tw/asp/main/report/dream_report/%E7%B1%8C%E7%A2%BC%E9%9B%86%E4%B8%AD%E5%BA%A65%E6%97%A5%E6%8E%92%E8%A1%8C.htm"
    try:
        tables = pd.read_html(url, encoding='cp950', header=0)
        df = tables[0].iloc[:, [1, 2, 3, 4]].copy()
        df.columns = ['代碼', '名稱', '1日集中度', '5日集中度']
        df['代碼'] = df['代碼'].astype(str).str.strip()
        df['名稱'] = df['名稱'].astype(str).str.strip()
        df['1日集中度'] = pd.to_numeric(df['1日集中度'], errors='coerce')
        df['5日集中度'] = pd.to_numeric(df['5日集中度'], errors='coerce')
        df = df.dropna(subset=['5日集中度']).reset_index(drop=True)
        return df
    except Exception:
        return pd.DataFrame()

# 查單檔 5 日集中度
def get_beicheng_5d(stock_id: str):
    df = fetch_beicheng_5d_table()
    if df.empty:
        return None
    target = str(stock_id).strip()
    match = df[df['代碼'] == target]
    if not match.empty:
        val = match.iloc[0]['5日集中度']
        if pd.notnull(val):
            return round(float(val), 2)
    return None

def extract_clean_json(text, marker="root.App.main"):
    idx = text.find(marker)
    if idx == -1: return None
    start = text.find('{', idx)
    if start == -1: return None
    depth, end = 0, start
    for i in range(start, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    raw_js = text[start:end]
    clean_str = re.sub(r':\s*undefined\b', ': null', raw_js)
    return json.loads(clean_str)

def fetch_single_stock(stock_id, market="TWO"):
    target = str(stock_id).strip()
    url = f"https://tw.stock.yahoo.com/quote/{target}.{market}/broker-trading"
    res = requests.get(url, impersonate="chrome120", timeout=12)

    if res.status_code != 200:
        market = "TW" if market == "TWO" else "TWO"
        url = f"https://tw.stock.yahoo.com/quote/{target}.{market}/broker-trading"
        res = requests.get(url, impersonate="chrome120", timeout=12)

    buyers, sellers = [], []
    net_major = 0
    trade_date = ""

    if res.status_code == 200:
        app_data = extract_clean_json(res.text)
        if app_data:
            b_data = (
                app_data.get("context", {})
                .get("dispatcher", {})
                .get("stores", {})
                .get("QuoteChipStore", {})
                .get("brokerTrades", {})
                .get("data", {})
            )
            raw_b = b_data.get("buyerRankList", [])
            raw_s = b_data.get("sellerRankList", [])
            trade_date = str(b_data.get("date", ""))[:10]

            buy_sum = sum([float(b["volume"]) for b in raw_b])
            sell_sum = sum([abs(float(s["volume"])) for s in raw_s])
            net_major = int(buy_sum - sell_sum)

            buyers = [{"rank": b["rank"], "name": b["name"], "volume": b["volume"]} for b in raw_b]
            sellers = [{"rank": s["rank"], "name": s["name"], "volume": s["volume"]} for s in raw_s]

    day5_conc = get_beicheng_5d(target)

    return {
        "stock_id": target,
        "date": trade_date,
        "day5_concentration": f"{day5_conc}%" if day5_conc is not None else "未進前200名",
        "net_major_1d": net_major,
        "buyers_top15": buyers,
        "sellers_top15": sellers
    }

# 取得 5 日集中度前 200 大排行榜清單
def fetch_top_rankings():
    df = fetch_beicheng_5d_table()
    if df.empty:
        return []
    records = []
    for idx, row in df.iterrows():
        records.append({
            "rank": idx + 1,
            "code": str(row['代碼']),
            "name": str(row['名稱']),
            "day1": f"{row['1日集中度']:.2f}%" if pd.notnull(row['1日集中度']) else "-",
            "day5": f"{row['5日集中度']:.2f}%" if pd.notnull(row['5日集中度']) else "-"
        })
    return records

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        mode = query.get('mode', ['single'])[0]

        if mode == 'rank5d':
            # 回傳 5 日排行榜資料
            rank_list = fetch_top_rankings()
            result_payload = {"rankings": rank_list}
        else:
            # 預設：查詢單檔股票籌碼
            stock_id = query.get('stock_id', ['6140'])[0]
            market = query.get('market', ['TWO'])[0]
            result_payload = fetch_single_stock(stock_id, market)

        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 's-maxage=600, stale-while-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(result_payload, ensure_ascii=False).encode('utf-8'))