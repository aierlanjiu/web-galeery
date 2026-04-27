#!/usr/bin/env python3
"""赛车史PPT → MP4 视频渲染（Playwright recordVideo + ffmpeg 后处理）"""
import sys, os, time, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

WORK_DIR = Path(__file__).parent
HTML_FILE = WORK_DIR / "index.html"
VIDEO_DIR = WORK_DIR / "video_tmp"
OUT_MP4 = WORK_DIR / "赛车史三大赛事.mp4"

# 清理旧视频临时文件
if VIDEO_DIR.exists():
    import shutil
    shutil.rmtree(VIDEO_DIR)
VIDEO_DIR.mkdir()

WIDTH, HEIGHT = 1920, 1080

print(f"Recording: {HTML_FILE}?record")
print(f"Viewport: {WIDTH}x{HEIGHT}")
print(f"Output: {OUT_MP4}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": WIDTH, "height": HEIGHT},
        device_scale_factor=2,
        record_video_dir=str(VIDEO_DIR),
        record_video_size={"width": WIDTH, "height": HEIGHT},
    )
    page = context.new_page()

    # 隐藏计数器和进度条（录制画面里不需要）
    page.add_style_tag(content="""
      #counter, #rec-bar { display: none !important; }
    """)

    page.goto(f"file://{HTML_FILE.resolve()}?record")

    # 等待 RECORDING_STARTED 信号
    try:
        page.wait_for_function(
            "document.title === 'RECORDING_STARTED'",
            timeout=15000
        )
        print("Recording started...")
    except:
        print("WARN: No RECORDING_STARTED signal, proceeding anyway")

    # 等待 DONE_RECORDING 信号（最多 2 分钟）
    try:
        page.wait_for_function(
            "document.title === 'DONE_RECORDING'",
            timeout=120000
        )
        print("Recording complete!")
    except:
        print("WARN: Timeout waiting for DONE_RECORDING, stopping anyway")

    # 等一小段确保最后一帧写入
    page.wait_for_timeout(500)
    context.close()
    browser.close()

# 找到录制的 webm 文件
webm_files = list(VIDEO_DIR.glob("*.webm"))
if not webm_files:
    print("ERROR: No webm file found in", VIDEO_DIR)
    sys.exit(1)

webm_path = webm_files[0]
print(f"Raw webm: {webm_path} ({os.path.getsize(webm_path)/1024/1024:.0f} MB)")

# ffmpeg: webm → mp4 (h264 + aac)
# 如果是纯视频（无音频轨），加静音轨避免某些平台拒绝
result = subprocess.run([
    "ffmpeg", "-y",
    "-i", str(webm_path),
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-an",
    str(OUT_MP4),
], capture_output=True, text=True)

if result.returncode != 0:
    print("ffmpeg stderr:", result.stderr[-500:])
    sys.exit(1)

size_mb = os.path.getsize(OUT_MP4) / 1024 / 1024
print(f"Done: {OUT_MP4} ({size_mb:.0f} MB)")

# 清理临时文件
import shutil
shutil.rmtree(VIDEO_DIR)
print("Cleaned up temp files.")
