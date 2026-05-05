#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from tempfile import NamedTemporaryFile


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT.parent / "01_账号数据及宣传物料" / "user_analysis.xls"
WECHAT_DATA = ROOT / "wechat_data.json"
USER_GROWTH = ROOT / "user_growth.json"


class TableTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_cell = False
        self.current: list[str] = []
        self.cells: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() in {"td", "th"}:
            self.in_cell = True
            self.current = []

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"td", "th"} and self.in_cell:
            text = "".join(self.current).strip()
            if text:
                self.cells.append(re.sub(r"\s+", " ", text))
            self.in_cell = False
            self.current = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.current.append(data)


def parse_int(value: str) -> int:
    return int(value.replace(",", "").strip())


def parse_rows(path: Path) -> list[dict]:
    parser = TableTextParser()
    parser.feed(path.read_text(encoding="utf-8"))
    rows: list[dict] = []
    cells = parser.cells
    for index, cell in enumerate(cells):
        if re.fullmatch(r"20\d{2}-\d{2}-\d{2}", cell):
            chunk = cells[index:index + 5]
            if len(chunk) < 5:
                continue
            date, new_followers, unfollows, net_growth, total_followers = chunk
            rows.append({
                "date": date,
                "new_followers": parse_int(new_followers),
                "unfollows": parse_int(unfollows),
                "net_growth": parse_int(net_growth),
                "total_followers": parse_int(total_followers),
            })
    if not rows:
        raise ValueError(f"No subscriber rows found in {path}")
    rows.sort(key=lambda item: item["date"])
    return rows


def load_existing_growth(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON list")
    return data


def write_json_atomic(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def merge_growth(existing: list[dict], incoming: list[dict]) -> list[dict]:
    merged = {row["date"]: row for row in existing if "date" in row}
    for row in incoming:
        merged[row["date"]] = row
    return [merged[key] for key in sorted(merged)]


def main() -> int:
    arg_parser = argparse.ArgumentParser(description="Update web_gallery subscriber JSON from WeChat HTML xls export.")
    arg_parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    args = arg_parser.parse_args()

    rows = parse_rows(args.input)
    existing = load_existing_growth(USER_GROWTH)
    merged = merge_growth(existing, rows)
    latest = rows[-1]
    wechat_data = {
        "updated_at": f"{latest['date']} 23:59:59",
        "total_followers": latest["total_followers"],
        "daily_growth": latest["net_growth"],
        "data_date": latest["date"],
    }

    write_json_atomic(USER_GROWTH, merged)
    write_json_atomic(WECHAT_DATA, wechat_data)
    print(f"updated {WECHAT_DATA} total_followers={latest['total_followers']} daily_growth={latest['net_growth']}")
    print(f"updated {USER_GROWTH} rows={len(merged)} latest={latest['date']}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
