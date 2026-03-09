import os
import glob
from PIL import Image
from pathlib import Path

def optimize_assets():
    base_dir = '/Users/papazed/00_Publiac Account/web_gallery'
    assets_dir = os.path.join(base_dir, 'assets')
    
    # 递归查找所有图片
    all_images = []
    for ext in ['*.png', '*.webp', '*.jpg', '*.jpeg']:
        for path in Path(assets_dir).rglob(ext):
            all_images.append(str(path))
    
    print(f"🚀 Found {len(all_images)} images to check in {assets_dir} and its subdirectories.")

    for file_path in all_images:
        try:
            with Image.open(file_path) as img:
                needs_save = False
                original_size = os.path.getsize(file_path)
                
                # A. 统一缩放：最大宽度/高度 1280px
                if img.width > 1280 or img.height > 1280:
                    print(f"📏 Resizing {os.path.basename(file_path)} from {img.width}x{img.height}")
                    img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                    needs_save = True
                
                # B. 统一格式转换与压缩
                webp_path = file_path.rsplit('.', 1)[0] + ".webp"
                
                # 如果不是 webp，或者虽然是 webp 但经过了缩放，就需要重新保存
                if not file_path.endswith('.webp') or needs_save:
                    print(f"📦 Compressing {os.path.basename(file_path)} -> WebP (Quality 80)")
                    img.save(webp_path, "WEBP", quality=80, method=6)
                    
                    # 如果原文件不是 webp，删除原文件
                    if not file_path.endswith('.webp'):
                        os.remove(file_path)
                    
                    new_size = os.path.getsize(webp_path)
                    print(f"✅ Saved: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                    
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")

    print("✨ Image optimization complete.")

if __name__ == "__main__":
    optimize_assets()
