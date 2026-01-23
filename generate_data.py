import json
import re
import os

def extract_title(prompt_text):
    match = re.search(r'Title: "(.*?)"', prompt_text)
    if match:
        return match.group(1)
    # Fallback: try to find "featuring"
    match = re.search(r'featuring "(.*?)"', prompt_text)
    if match:
        return match.group(1)
    return "Unknown Title"

def get_category(id):
    # 1. 整车工程 (Vehicle Engineering): [1, 2]
    # 2. 底盘与动力学 (Chassis & Dynamics): [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 34, 35, 36]
    # 3. 动力总成与能源 (Powertrain & Energy): [11, 17, 18, 19, 20, 21, 22, 37, 38]
    # 4. 智能座舱 (Intelligent Cockpit): [23, 24, 25, 26, 27]
    # 5. 智能驾驶 (Autonomous Driving): [28, 29, 30, 31, 32, 33]
    
    if id in [1, 2]:
        return "整车工程"
    elif id in [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 34, 35, 36]:
        return "底盘与动力学"
    elif id in [11, 17, 18, 19, 20, 21, 22, 37, 38]:
        return "动力总成与能源"
    elif id in [23, 24, 25, 26, 27]:
        return "智能座舱"
    elif id in [28, 29, 30, 31, 32, 33]:
        return "智能驾驶"
    else:
        return "未分类"

def main():
    try:
        with open('prompts.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"Error reading prompts.json: {e}")
        return

    web_data = []
    
    for item in raw_data:
        id = item.get('id')
        prompt = item.get('prompt', '')
        
        title = extract_title(prompt)
        category = get_category(id)
        # Using assets_extracted with image{id}.png naming convention as requested
        image_path = f"./assets_extracted/image{id}.png"
        
        # Verify image exists (optional, but good practice)
        # if not os.path.exists(image_path):
        #    print(f"Warning: Image not found for ID {id}: {image_path}")

        web_data.append({
            "id": id,
            "category": category,
            "title": title,
            "prompt": prompt,
            "image_path": image_path
        })

    with open('web_data.json', 'w', encoding='utf-8') as f:
        json.dump(web_data, f, ensure_ascii=False, indent=4)
    
    print(f"Successfully generated web_data.json with {len(web_data)} items.")

if __name__ == "__main__":
    main()
