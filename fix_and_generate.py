import json
import re
import os
from pathlib import Path

def extract_title(prompt_text):
    match = re.search(r'Title: "(.*?)"', prompt_text)
    if match: return match.group(1)
    match = re.search(r'featuring "(.*?)"', prompt_text)
    if match: return match.group(1)
    if "Computational Aesthetics" in prompt_text:
        parts = prompt_text.split(":")
        if len(parts) > 1: return parts[1].split("。")[0].strip()
    return "Unknown Title"

def get_category(id_val, title, prompt, filename="", filepath=""):
    text = title + " " + prompt + " " + filename + " " + filepath
    if any(k in text for k in ["智慧交通", "Traffic", "Smart", "Aesthetics", "轨迹", "指标"]):
        return "智慧交通"
    if any(k in text for k in ["座舱", "Cockpit", "Interior", "HMI", "屏幕", "仪表", "智能驾驶", "智驾", "AD", "Autonomous", "L2", "L3", "L4", "感知识别", "感知"]):
        return "智能驾驶"
    if any(k in text for k in ["动力", "总成", "Powertrain", "Engine", "Motor", "电池", "Battery", "能量", "Energy", "三电", "新能源", "传动", "混动", "内燃机"]):
        return "动力总成"
    if any(k in text for k in ["赛车", "拉力", "竞赛", "AI赛车", "方程式", "竞技", "改装"]):
        return "赛车竞技"
    if any(k in text for k in ["轮胎", "越野", "Tire", "Offroad"]):
        return "轮胎越野"
    return "底盘操控"

def get_mapped_category(old_cat):
    if old_cat in ["悬挂硬件与几何", "转向与制动系统", "底盘与动力学", "整车工程"]: return "底盘操控"
    if old_cat in ["轮胎与越野"]: return "轮胎越野"
    if old_cat in ["内燃机与传动（含混动基础）", "新能源赛车与趋势", "动力总成与能源"]: return "动力总成"
    if old_cat in ["智能座舱", "智能驾驶"]: return "智能驾驶"
    if old_cat in ["智慧交通"]: return "智慧交通"
    if old_cat in ["赛车改装与拉力技术", "AI与智能赛车", "赛车竞技"]: return "赛车竞技"
    return "底盘操控"

def main():
    base_dir = '/Users/papazed/00_Publiac Account/web_gallery'
    prompts_path = os.path.join(base_dir, 'prompts.json')
    assets_dir = os.path.join(base_dir, 'assets')
    output_path = os.path.join(base_dir, 'web_data.json')
    web_data = []
    used_images = set()
    max_id = 0

    try:
        with open(output_path, 'r', encoding='utf-8') as f:
            web_data = json.load(f)
            for item in web_data:
                # Record existing paths so we don't process them again
                img_path = item.get('image_path', '')
                if img_path.startswith('./'):
                    img_path = img_path[2:]
                used_images.add(os.path.abspath(os.path.join(base_dir, img_path)))
                if item.get('id', 0) > max_id:
                    max_id = item.get('id', 0)
        print(f"✅ Loaded {len(web_data)} existing items. Preserving your manual edits! Scanning for new directory assets...")
    except Exception as e:
        print(f"Could not load existing web_data.json (maybe it does not exist). Starting fresh: {e}")
    
    # 2. Scanning all remaining images
    skip_dirs = ['news', 'student_works', 'students']
    images_by_folder = {}

    for ext in ['*.webp', '*.png', '*.jpg', '*.jpeg']:
        for img_path in Path(assets_dir).rglob(ext):
            abs_path = str(img_path.absolute())
            if abs_path in used_images:
                continue
                
            rel_path = img_path.relative_to(assets_dir)
            parts = rel_path.parts
            
            if len(parts) > 0 and parts[0] in skip_dirs:
                continue
                
            folder_key = str(img_path.parent)
            if folder_key not in images_by_folder:
                images_by_folder[folder_key] = []
            images_by_folder[folder_key].append(img_path)

    # 3. Process grouped images
    for folder_path_str, images in images_by_folder.items():
        folder_path = Path(folder_path_str)
        
        # Check if this folder has a curated main image (visual / unwatermarked / poster)
        main_img = None
        for img in images:
            name = img.name.lower()
            if 'visual' in name or 'unwatermarked' in name or 'poster' in name:
                main_img = img
                if 'visual' in name:
                    break
        
        # If it's an auto-generated folder with a main image + prompt.txt
        if main_img and (folder_path / 'prompt.txt').exists():
            # Treat the whole folder as one item, using the main image
            images_to_process = [main_img]
        else:
            # Treat each image in the folder as a separate item (legacy/uncategorized)
            images_to_process = images
            
        for img_path in images_to_process:
            max_id += 1
            rel_path = img_path.relative_to(assets_dir)
            parts = rel_path.parts
            
            # Extract category & title from path
            title = img_path.stem
            category_from_path = "未分类"
            if len(parts) >= 4:
                category_from_path = parts[-3]
            elif len(parts) >= 2:
                category_from_path = parts[0]
            
            # Map category
            category = get_mapped_category(category_from_path)
            if category == "底盘操控" and category_from_path != "悬挂硬件与几何":
                 # Use fallback analysis if path didn't provide a clear mapping
                 category = get_category(max_id, title, "", img_path.name, folder_path_str)
                 
            # Fix title if it's "visual"
            if title.lower() in ['visual', 'unwatermarked'] and len(parts) >= 2:
                title = parts[-2]
                
            # Attempt to read prompt
            prompt_content = f"VISUAL ARCHITECT - 【{category}】: 内部档案 {title}"
            possible_prompt_file = img_path.parent / 'prompt.txt'
            if possible_prompt_file.exists():
                try:
                    with open(possible_prompt_file, 'r', encoding='utf-8') as pf:
                        raw_content = pf.read().strip()
                        if raw_content:
                            prompt_content = raw_content
                except:
                    pass
            
            web_data.append({
                "id": max_id,
                "category": category,
                "title": title,
                "prompt": prompt_content,
                "image_path": f"./assets/{'/'.join(parts)}"
            })
            used_images.add(str(img_path.absolute()))

    # 4. Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(web_data, f, ensure_ascii=False, indent=4)
    
    print(f"✨ Success! Final web_data.json has {len(web_data)} items.")

if __name__ == "__main__":
    main()
