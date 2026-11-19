from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import re
import io
import pandas as pd
from curl_cffi import requests

REPORT_MAP = {
    "conc_5d": {
        "title": "5日籌碼集中度",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E7%B1%8C%E7%A2%BC%E9%9B%86%E4%B8%AD%E5%BA%A65%E6%97%A5%E6%8E%92%E8%A1%8C.htm",
        "is_pct": True,
    },
    "conc_1d": {
        "title": "1日籌碼集中度",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E7%B1%8C%E7%A2%BC%E9%9B%86%E4%B8%AD%E5%BA%A61%E6%97%A5%E6%8E%92%E8%A1%8C.htm",
        "is_pct": True,
    },
    "conc_20d": {
        "title": "20日籌碼集中度",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E7%B1%8C%E7%A2%BC%E9%9B%86%E4%B8%AD%E5%BA%A620%E6%97%A5%E6%8E%92%E8%A1%8C.htm",
        "is_pct": True,
    },
    "conc_5d_sell": {
        "title": "5日籌碼發散(賣超)",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E7%B1%8C%E7%A2%BC%E7%99%BC%E6%95%A35%E6%97%A5%E6%8E%92%E8%A1%8C.htm",
        "is_pct": True,
    },
    "single_buyer_big": {
        "title": "單一買盤超大排行",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E5%96%AE%E4%B8%80%E8%B2%B7%E7%9B%A4%E8%B6%85%E5%A4%A7%E6%8E%92%E8%A1%8C.htm",
        "is_pct": True,
    },
    "vol_surge": {
        "title": "成交量倍增排行",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E6%88%90%E4%BA%A4%E9%87%8F%E5%80%8D%E5%A2%9E%E6%8E%92%E8%A1%8C.htm",
        "is_pct": False,
    },
}

def fetch_peicheng_table(url):
    try:
        res = requests.get(url, impersonate="chrome120", timeout=12)
        if res.status_code != 200:
            return pd.DataFrame()
        tables = pd.read_html(io.BytesIO(res.content), encoding='cp950', header=0)
        if not tables:
            return pd.DataFrame()
        df = tables[0].copy()
        df.columns = [str(c).strip() for c in df.columns]
        return df
    except Exception as e:
        print(f"fetch_peicheng_table error: {e}")
        return pd.DataFrame()

def _find_code_col(df):
    for col in df.columns:
        series_str = df[col].astype(str).str.strip()
        match_ratio = series_str.str.match(r'^\d{4,6}[A-Za-z0-9]*$').mean()
        if match_ratio >= 0.3:
            return col
    return df.columns[1] if len(df.columns) > 1 else df.columns[0]

def _format_cell(val, default_pct=False, col_name=""):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return "-"
    s = str(val).strip()
    if not s or s.lower() in ("nan", "none", "-"):
        return "-"
    if s.endswith("%"):
        return s
    cleaned = s.replace(",", "").replace("倍", "").strip()
    try:
        num = float(cleaned)
        if default_pct or ("集中度" in str(col_name)) or ("比例" in str(col_name)) or ("率" in str(col_name)):
            return f"{num:.2f}%"
        return f"{num:.2f}"
    except Exception:
        return s

def fetch_rankings(report_key="conc_5d"):
    config = REPORT_MAP.get(report_key, REPORT_MAP["conc_5d"])
    df = fetch_peicheng_table(config["url"])
    if df.empty or len(df.columns) < 2:
        return []

    code_col = _find_code_col(df)
    code_idx = list(df.columns).index(code_col)

    name_col = df.columns[code_idx + 1] if code_idx + 1 < len(df.columns) else df.columns[0]
    val1_col = df.columns[code_idx + 2] if code_idx + 2 < len(df.columns) else None
    val2_col = df.columns[code_idx + 3] if code_idx + 3 < len(df.columns) else None

    df[code_col] = df[code_col].astype(str).str.strip()
    valid_df = df[df[code_col].str.match(r'^\d{4,6}[A-Za-z0-9]*$') == True].reset_index(drop=True)

    records = []
    for idx, row in valid_df.iterrows():
        v1_str = _format_cell(row[val1_col], config.get("is_pct", False), val1_col) if val1_col else "-"
        v2_str = _format_cell(row[val2_col], config.get("is_pct", False), val2_col) if val2_col else ""

        records.append({
            "rank": idx + 1,
            "code": str(row[code_col]),
            "name": str(row[name_col]).strip(),
            "val1_label": str(val1_col) if val1_col else "數值",
            "val1": v1_str,
            "val2_label": str(val2_col) if val2_col else "",
            "val2": v2_str if val2_col else "",
        })
    return records

def get_beicheng_5d(stock_id: str):
    df = fetch_peicheng_table(REPORT_MAP["conc_5d"]["url"])
    if df.empty:
        return None
    target = str(stock_id).strip()
    code_col = _find_code_col(df)
    code_idx = list(df.columns).index(code_col)
    val_col = df.columns[code_idx + 3] if code_idx + 3 < len(df.columns) else (
        df.columns[code_idx + 2] if code_idx + 2 < len(df.columns) else None
    )
    if not val_col:
        return None

    df[code_col] = df[code_col].astype(str).str.strip()
    match = df[df[code_col] == target]
    if not match.empty:
        raw_val = str(match.iloc[0][val_col]).replace("%", "").strip()
        val = pd.to_numeric(raw_val, errors='coerce')
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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        mode = query.get('mode', ['single'])[0]

        if mode in ('rankings', 'rank5d'):
            report_type = query.get('type', ['conc_5d'])[0]
            rank_list = fetch_rankings(report_type)
            result_payload = {"rankings": rank_list, "type": report_type}
        else:
            stock_id = query.get('stock_id', ['6140'])[0]
            market = query.get('market', ['TWO'])[0]
            result_payload = fetch_single_stock(stock_id, market)

        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 's-maxage=600, stale-while-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(result_payload, ensure_ascii=False).encode('utf-8'))