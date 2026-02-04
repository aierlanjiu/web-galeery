import os
import glob
from PIL import Image

def optimize_assets():
    # 1. Convert assets_extracted to WebP
    target_dir = "assets_extracted"
    files = glob.glob(os.path.join(target_dir, "*.png"))
    print(f"Found {len(files)} images in {target_dir}")

    for file_path in files:
        try:
            with Image.open(file_path) as img:
                # Resize if larger than 1024x1024
                if img.width > 1024 or img.height > 1024:
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                
                webp_path = file_path.rsplit('.', 1)[0] + ".webp"
                # Save as WebP, quality 80 is usually a great balance
                img.save(webp_path, "WEBP", quality=80)
            
            # Remove the original file
            os.remove(file_path)
            print(f"Converted & Resized {file_path} -> {webp_path}")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    # 1.5 Optimize existing assets in 'assets/' (WebP resizing)
    assets_dir = "assets"
    existing_assets = glob.glob(os.path.join(assets_dir, "*.webp"))
    print(f"Checking {len(existing_assets)} existing assets in {assets_dir}...")
    
    for file_path in existing_assets:
        try:
            with Image.open(file_path) as img:
                if img.width > 1024 or img.height > 1024:
                    print(f"Resizing {file_path} ({img.width}x{img.height})...")
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                    img.save(file_path, "WEBP", quality=80)
                    print(f"Saved optimized {file_path}")
        except Exception as e:
            print(f"Error checking/resizing {file_path}: {e}")

    # 2. Update web_data.json references
    json_path = "web_data.json"
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Only replace .png if it follows assets_extracted to be super safe, 
        # but based on search, web_data.json only has these.
        # Simple replace is fine given the context check.
        new_content = content.replace(".png", ".webp")
        
        with open(json_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Updated web_data.json references.")

    # 3. Optimize UI images in 'images/' (In-place, no extension change)
    ui_dir = "images"
    ui_files = glob.glob(os.path.join(ui_dir, "*.*"))
    for file_path in ui_files:
        ext = file_path.rsplit('.', 1)[-1].lower()
        if ext in ['png', 'jpg', 'jpeg']:
            try:
                with Image.open(file_path) as img:
                    # Optimize and save in place
                    if ext == 'png':
                         img.save(file_path, "PNG", optimize=True)
                    else:
                         img.save(file_path, "JPEG", optimize=True, quality=85)
                print(f"Optimized UI image: {file_path}")
            except Exception as e:
                print(f"Error optimizing UI image {file_path}: {e}")

if __name__ == "__main__":
    optimize_assets()
