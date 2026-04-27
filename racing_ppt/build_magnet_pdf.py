#!/usr/bin/env python3
"""压制赛车科普卡片交付包 PDF — 雪沐视觉实验室品牌"""
import re, sys, os
from pathlib import Path
from playwright.sync_api import sync_playwright

WORK_DIR = Path(__file__).parent
IMAGES_DIR = WORK_DIR / "images"
PDF_OUT = WORK_DIR / "赛车科普卡片_交付包.pdf"
HTML_OUT = WORK_DIR / "赛车科普卡片_交付包.html"

BRAND = {
    "accent": "#c0392b",
    "dark": "#1a1a1a",
    "mid": "#555555",
    "serif": '"Noto Serif SC", "STSong", serif',
    "sans": '"Noto Sans SC", "PingFang SC", sans-serif',
}

with open(WORK_DIR / "article.md") as f:
    md = f.read()

def md_to_html(md_text: str) -> str:
    """简陋但够用的 MD→HTML 转换（避免依赖外部库）"""
    lines = md_text.split('\n')
    html_lines = []
    in_ul = in_table = in_blockquote = in_code = False
    code_lines = []

    for line in lines:
        stripped = line.strip()

        # 水平线
        if stripped == '---':
            html_lines.append('<hr>')
            continue

        # 标题
        if stripped.startswith('# ') and not stripped.startswith('## '):
            html_lines.append(f'<h1>{stripped[2:]}</h1>')
            continue
        if stripped.startswith('## '):
            html_lines.append(f'<h2>{stripped[3:]}</h2>')
            continue
        if stripped.startswith('### '):
            html_lines.append(f'<h3>{stripped[4:]}</h3>')
            continue
        if stripped.startswith('#### '):
            html_lines.append(f'<h4>{stripped[5:]}</h4>')
            continue

        # 代码块
        if stripped.startswith('```'):
            if not in_code:
                in_code = True
                code_lines = []
                continue
            else:
                html_lines.append('<pre><code>' + '\n'.join(code_lines) + '</code></pre>')
                in_code = False
                code_lines = []
                continue
        if in_code:
            code_lines.append(stripped)
            continue

        # 引用
        if stripped.startswith('> '):
            if not in_blockquote:
                html_lines.append('<blockquote>')
                in_blockquote = True
            html_lines.append(f'<p>{stripped[2:]}</p>')
            continue
        elif in_blockquote:
            html_lines.append('</blockquote>')
            in_blockquote = False

        # 表格
        if '|' in stripped and stripped.startswith('|'):
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            if all(c.startswith('---') or c.startswith(':--') for c in cells):
                continue  # 表头分隔行
            if not in_table:
                html_lines.append('<table>')
                in_table = True
                tag = 'th'
            else:
                tag = 'td'
            html_lines.append('<tr>' + ''.join(f'<{tag}>{c}</{tag}>' for c in cells) + '</tr>')
            continue
        elif in_table:
            html_lines.append('</table>')
            in_table = False

        # 加粗
        line_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', stripped)

        # 空行
        if not stripped:
            html_lines.append('<br>')
            continue

        html_lines.append(f'<p>{line_html}</p>')

    if in_blockquote: html_lines.append('</blockquote>')
    if in_table: html_lines.append('</table>')

    return '\n'.join(html_lines)


def inject_images(body_html: str) -> str:
    """在 h3 节点之间语义穿插图片"""
    imgs = {
        "lemans_1966.png": (IMAGES_DIR / "lemans_1966.png").exists(),
        "fuji_1976.png": (IMAGES_DIR / "fuji_1976.png").exists(),
        "sanremo_1985.png": (IMAGES_DIR / "sanremo_1985.png").exists(),
    }
    available = [k for k, v in imgs.items() if v]
    if not available:
        return body_html

    img_style = 'style="width:100%;border-radius:10px;margin:28px 0;box-shadow:0 4px 16px rgba(0,0,0,0.12);display:block;"'
    parts = re.split(r'(?=<h3[ >])', body_html)
    result = []
    img_idx = 0
    for i, part in enumerate(parts):
        result.append(part)
        if img_idx < len(available) and i < len(parts) - 1:
            result.append(f'\n<img src="images/{available[img_idx]}" {img_style} />\n')
            img_idx += 1
    # 未消耗的图片追加到末尾
    while img_idx < len(available):
        result.append(f'\n<img src="images/{available[img_idx]}" {img_style} />\n')
        img_idx += 1
    return "".join(result)


body_html = md_to_html(md)
body_html = inject_images(body_html)

html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700;900&family=Noto+Sans+SC:wght@300;400;500;700;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @page {{ margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: {BRAND['sans']};
    font-size: 14px;
    color: {BRAND['dark']};
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
  }}

  .cover {{
    background: {BRAND['dark']};
    color: #fff;
    min-height: 270mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40mm 20mm;
    position: relative;
    page-break-after: always;
  }}
  .cover::before {{
    content: "";
    position: absolute;
    top: -120px; right: -120px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, {BRAND['accent']}22 0%, transparent 70%);
    transform: rotate(-30deg);
  }}
  .cover h1 {{
    font-family: {BRAND['serif']};
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 16px;
    position: relative;
  }}
  .cover .sub {{
    font-family: {BRAND['sans']};
    font-size: 18px;
    opacity: .7;
    letter-spacing: .2em;
    margin-bottom: 40px;
    position: relative;
  }}
  .cover .brand {{
    font-family: {BRAND['serif']};
    font-size: 13px;
    opacity: .5;
    position: absolute;
    bottom: 30mm;
    letter-spacing: .1em;
  }}

  .content {{
    max-width: 680px;
    margin: 0 auto;
    padding: 20mm 15mm;
  }}
  h1 {{
    font-family: {BRAND['serif']};
    font-size: 28px;
    font-weight: 700;
    color: {BRAND['dark']};
    margin: 32px 0 16px;
  }}
  h2 {{
    font-family: {BRAND['serif']};
    font-size: 22px;
    font-weight: 600;
    color: {BRAND['dark']};
    margin: 28px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e5e5;
  }}
  h3 {{
    font-family: {BRAND['serif']};
    font-size: 18px;
    font-weight: 600;
    color: {BRAND['accent']};
    margin: 24px 0 10px;
  }}
  h4 {{
    font-family: {BRAND['sans']};
    font-size: 14px;
    font-weight: 700;
    color: {BRAND['accent']};
    margin: 18px 0 6px;
  }}
  p {{
    margin: 8px 0;
    color: {BRAND['mid']};
  }}
  strong {{ color: {BRAND['dark']}; }}
  hr {{
    border: none;
    border-top: 1px solid #ddd;
    margin: 28px 0;
  }}
  blockquote {{
    border-left: 3px solid {BRAND['accent']};
    background: rgba(192,57,43,0.06);
    padding: 12px 18px;
    margin: 14px 0;
    font-style: italic;
  }}
  blockquote p {{ margin: 4px 0; }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 20px;
    font-size: 13px;
  }}
  th {{
    background: {BRAND['dark']};
    color: #fff;
    padding: 8px 12px;
    font-weight: 700;
    text-align: left;
  }}
  td {{
    padding: 7px 12px;
    border-bottom: 1px solid #e5e5e5;
    color: {BRAND['mid']};
  }}
  tr:nth-child(even) td {{
    background: rgba(0,0,0,0.03);
  }}

  .footer {{
    background: {BRAND['dark']};
    color: #fff;
    padding: 20mm 15mm;
    page-break-before: always;
    font-size: 13px;
  }}
  .footer .tier {{
    margin: 10px 0;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }}
  .footer .tier .price {{
    font-family: {BRAND['serif']};
    font-size: 20px;
    font-weight: 700;
    color: {BRAND['accent']};
  }}
  .footer .closing {{
    margin-top: 30px;
    font-style: italic;
    opacity: .6;
    font-size: 12px;
  }}
</style>
</head>
<body>

<div class="cover">
  <h1>赛车科普卡片<br>AI 生成系统</h1>
  <div class="sub">RACING SCIENCE CARD · DELIVERY PACKAGE</div>
  <div class="brand">雪沐视觉实验室 · Xuemu Lab</div>
</div>

<div class="content">
{body_html}
</div>

<div class="footer">
  <h3 style="color:#fff;font-family:{BRAND['serif']};">阶梯定价</h3>
  <div class="tier">
    <span class="price">1.9 元</span> · 单期破冰
    <br>解锁三套 Codex 元提示词模板，填入你的赛车主题即可出图
  </div>
  <div class="tier">
    <span class="price">129 元</span> · 进阶变现桥梁
    <br>获取《赛车科普卡片·百图解码全书》+ 批量生成脚本 + 98 张示例 Prompt 库
  </div>
  <div class="tier">
    <span class="price">699 元</span> · 高阶圈层入局
    <br>「雪沐实验室·高阶玩家社群」全站终身源码库 + Codex 无 Key 方案定制
  </div>
  <p style="margin-top:20px;opacity:.7;">GitHub: github.com/your-org/racing-science-card-skill</p>
  <p class="closing">In the noise, signal is king. — 雪沐视觉实验室 · Xuemu Lab<br>art.zedpapa.top</p>
</div>

</body>
</html>"""

# 写入 HTML
with open(HTML_OUT, "w") as f:
    f.write(html)
print(f"HTML → {HTML_OUT}")

# 压制 PDF
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 794, "height": 1123})
    page.goto(f"file://{HTML_OUT.resolve()}")
    page.wait_for_timeout(2000)
    page.pdf(
        path=str(PDF_OUT),
        format="A4",
        print_background=True,
        margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
    )
    browser.close()

size_kb = os.path.getsize(PDF_OUT) / 1024
print(f"PDF  → {PDF_OUT} ({size_kb:.0f} KB)")
