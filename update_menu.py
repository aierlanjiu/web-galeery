import requests
import json
import os

# ==========================================
# 🔐 从环境变量读取密钥
# ==========================================
APP_ID = os.getenv('WECHAT_APP_ID')
APP_SECRET = os.getenv('WECHAT_APP_SECRET')

def get_stable_access_token():
    """获取稳定版 Access Token"""
    url = "https://api.weixin.qq.com/cgi-bin/stable_token"
    payload = {
        "grant_type": "client_credential",
        "appid": APP_ID,
        "secret": APP_SECRET
    }
    try:
        resp = requests.post(url, json=payload)
        data = resp.json()
        return data.get('access_token')
    except Exception as e:
        print(f"❌ Token 获取失败: {e}")
        return None

def create_menu(token):
    url = f"https://api.weixin.qq.com/cgi-bin/menu/create?access_token={token}"
    
    # 🌟 定义菜单结构
    menu_data = {
        "button": [
            {
                "type": "view",
                "name": "🌌 视觉基地",
                "url": "http://art.zedpapa.top"
            },
            {
                "type": "view",
                "name": "🚀 学员展厅",
                "url": "http://art.zedpapa.top/student_showcase.html"
            },
            {
                "name": "关于我们",
                "sub_button": [
                    {
                        "type": "view",
                        "name": "📜 招生简章",
                        "url": "https://mp.weixin.qq.com/s/EmidUGyxo94euzRRM9oHLQ"
                    },
                    {
                        "type": "view",
                        "name": "⚡ 部署同款基地",
                        "url": "https://www.aliyun.com/daily-act/ecs/activity_selection?userCode=pwy21djx"
                    }
                ]
            }
        ]
    }
    
    # 提交请求 (ensure_ascii=False 确保中文不乱码)
    resp = requests.post(url, data=json.dumps(menu_data, ensure_ascii=False).encode('utf-8'))
    result = resp.json()
    
    if result.get("errcode") == 0:
        print("✅ 菜单更新成功！请取消关注后重新关注查看效果。")
    else:
        print(f"❌ 更新失败: {result}")

if __name__ == "__main__":
    print("🚀 正在连接微信服务器更新菜单...")
    
    if not APP_ID or not APP_SECRET:
        print("❌ 错误: 环境变量未设置。请在服务器上运行此脚本。")
    else:
        token = get_stable_access_token()
        if token:
            create_menu(token)
