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
    # 🌟 投信買賣超系列（來自 report_r5）
    "it_buy_1d": {"title": "投信1日買超", "type": "it", "section": "buy", "days": "1d"},
    "it_buy_5d": {"title": "投信5日買超", "type": "it", "section": "buy", "days": "5d"},
    "it_sell_1d": {"title": "投信1日賣超", "type": "it", "section": "sell", "days": "1d"},
    "it_sell_5d": {"title": "投信5日賣超", "type": "it", "section": "sell", "days": "5d"},
    "prev_strong": {
        "title": "昨強勢股",
        "url": "https://www.peicheng.com.tw/asp/main/report/dream_report/%E6%98%A8%E5%BC%B7%E5%8B%A2%E8%82%A1.htm",
        "is_pct": False,
    },
    # 🌟 基本面系列（來自 report_r1.html）
    "fund_roe": {"title": "基本面 - ROE排行", "type": "fundamental", "cat": "fund_roe"},
    "fund_turnover": {"title": "基本面 - 週轉率排行", "type": "fundamental", "cat": "fund_turnover"},
    "fund_mom": {"title": "基本面 - 高MOM排行", "type": "fundamental", "cat": "fund_mom"},
    "fund_yoy": {"title": "基本面 - 高YOY排行", "type": "fundamental", "cat": "fund_yoy"},
    "fund_yield": {"title": "基本面 - 高殖利率排行", "type": "fundamental", "cat": "fund_yield"},
    "fund_dividend": {"title": "基本面 - 高配股排行", "type": "fundamental", "cat": "fund_dividend"},
    "fund_eps": {"title": "基本面 - 高EPS排行", "type": "fundamental", "cat": "fund_eps"},
    "fund_margin": {"title": "基本面 - 高毛利排行", "type": "fundamental", "cat": "fund_margin"},

}

def fetch_peicheng_html(url):
    try:
        res = requests.get(url, impersonate="chrome120", timeout=12)
        if res.status_code != 200:
            return ""
        # 嘗試 cp950 或 big5 解碼
        content = res.content
        try:
            return content.decode("cp950")
        except Exception:
            return content.decode("big5", errors="ignore")
    except Exception as e:
        print(f"fetch_peicheng_html error: {e}")
        return ""

def fetch_peicheng_table(url):
    html = fetch_peicheng_html(url)
    if not html:
        return pd.DataFrame()
    try:
        tables = pd.read_html(io.StringIO(html), header=0)
        if not tables:
            return pd.DataFrame()
        df = tables[0].copy()
        df.columns = [str(c).strip() for c in df.columns]

        # 檢查欄位名稱是否包含「代號」或「股票代號」
        has_code_col = any("代號" in str(c) for c in df.columns)

        # 如果第一列是像「昨3%強勢股」這種大標題，欄名不會有代號，這時往下找真正的表頭列
        if not has_code_col:
            for idx, row in df.iterrows():
                row_str = " ".join([str(x).strip() for x in row.values if pd.notnull(x)])
                if "代號" in row_str:
                    new_cols = [str(x).strip() for x in row.values]
                    df = df.iloc[idx + 1:].copy()
                    df.columns = new_cols
                    df = df.reset_index(drop=True)
                    break

        return df
    except Exception as e:
        print(f"pd.read_html error: {e}")
        return pd.DataFrame()

def _find_code_col(df):
    # 優先找欄位名稱包含「代號」的欄位
    for col in df.columns:
        if "代號" in str(col):
            return col

    # 次選：尋找內容含有 4~6 碼數字股票代號的欄位（只要有 match 就選中，不再用 >= 0.3 的比例卡死）
    for col in df.columns:
        series_str = df[col].astype(str).str.strip().str.replace('\u3000', '')
        matches = series_str.str.match(r'^\d{4,6}[A-Za-z0-9]*$')
        if matches.sum() >= 1:  # 只要有股票代碼就認定是代碼欄
            return col

    return df.columns[0]

# 專門解析投信報表 (report_r5.html)
def parse_it_report(section="buy", days="1d"):
    url = "https://www.peicheng.com.tw/asp/main/report/report_r5.html"
    html = fetch_peicheng_html(url)
    if not html:
        return []

    try:
        tables = pd.read_html(io.StringIO(html))
        if not tables:
            return []
        df = tables[0]

        # 找到「投信近日買超」與「投信近日賣超」的行索引
        buy_row_idx = None
        sell_row_idx = None

        for idx, row in df.iterrows():
            row_str = " ".join([str(x) for x in row.values])
            if "投信近日買超" in row_str:
                buy_row_idx = idx
            elif "投信近日賣超" in row_str:
                sell_row_idx = idx

        # 決定要切哪一段
        if section == "buy":
            start_idx = buy_row_idx + 1 if buy_row_idx is not None else 0
            end_idx = sell_row_idx if sell_row_idx is not None else len(df)
        else:
            start_idx = sell_row_idx + 1 if sell_row_idx is not None else 0
            end_idx = len(df)

        sub_df = df.iloc[start_idx:end_idx].reset_index(drop=True)

        # 欄位對應（一日: 0,1,2；三日: 4,5,6；五日: 8,9,10；十日: 12,13,14）
        col_map = {
            "1d": (0, 1, 2),
            "3d": (4, 5, 6),
            "5d": (8, 9, 10),
            "10d": (12, 13, 14),
        }
        c_code, c_name, c_vol = col_map.get(days, (0, 1, 2))

        records = []
        rank = 1
        for _, row in sub_df.iterrows():
            code = str(row.iloc[c_code]).strip()
            name = str(row.iloc[c_name]).strip()
            vol = str(row.iloc[c_vol]).strip()

            # 只要代碼是 4~6 碼純數字就收錄
            if re.match(r'^\d{4,6}$', code):
                # 處理張數格式
                try:
                    v_float = float(vol.replace(",", ""))
                    v_str = f"{v_float:,.1f} 張" if "." in vol else f"{int(v_float):,} 張"
                except Exception:
                    v_str = f"{vol} 張"

                records.append({
                    "rank": rank,
                    "code": code,
                    "name": name,
                    "val1_label": f"{'買超' if section == 'buy' else '賣超'}張數",
                    "val1": v_str,
                    "val2_label": "",
                    "val2": "",
                })
                rank += 1
                if rank > 20: # 該報表只列前 20 名
                    break

        return records
    except Exception as e:
        print(f"parse_it_report error: {e}")
        return []

# 專門解析基本面報表 (report_r1.html)
def parse_fundamental_report(category="fund_roe"):
    url = "https://www.peicheng.com.tw/asp/main/report/report_r1.html"
    html = fetch_peicheng_html(url)
    if not html:
        return []

    col_map = {
        "fund_roe": (0, 1),        # ROE排行
        "fund_turnover": (3, 4),   # 週轉率排行
        "fund_mom": (6, 7),        # 高MOM排行
        "fund_yoy": (9, 10),       # 高YOY排行
        "fund_yield": (12, 13),    # 高殖利率排行
        "fund_dividend": (15, 16), # 高配股排行
        "fund_eps": (18, 19),      # 高EPS排行
        "fund_margin": (21, 22),   # 高毛利排行
    }
    c_code, c_name = col_map.get(category, (0, 1))

    try:
        tables = pd.read_html(io.StringIO(html))
        if not tables:
            return []
        df = tables[0]

        records = []
        rank = 1
        for _, row in df.iterrows():
            if len(row) <= max(c_code, c_name):
                continue
            code = str(row.iloc[c_code]).strip()
            name = str(row.iloc[c_name]).strip()

            if re.match(r'^\d{4,6}[A-Za-z0-9]*$', code):
                records.append({
                    "rank": rank,
                    "code": code,
                    "name": name,
                    "val1_label": "基本面入選",
                    "val1": "TOP",
                    "val2_label": "",
                    "val2": "",
                })
                rank += 1
        return records
    except Exception as e:
        print(f"parse_fundamental_report error: {e}")
        return []

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
        if default_pct or ("集中度" in str(col_name)) or ("比例" in str(col_name)):
            return f"{num:.2f}%"
        return f"{num:.2f}"
    except Exception:
        return s

def fetch_rankings(report_key="conc_5d"):
    config = REPORT_MAP.get(report_key, REPORT_MAP["conc_5d"])
    
    # 如果是投信報表走專屬解析
    if config.get("type") == "it":
        return parse_it_report(config.get("section", "buy"), config.get("days", "1d"))
    # 如果是基本面報表走專屬解析
    if config.get("type") == "fundamental":
        return parse_fundamental_report(config.get("cat", "fund_roe"))
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