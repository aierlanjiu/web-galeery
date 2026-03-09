import requests
import json
import time
import os
import datetime

# ==========================================
# 🔐 安全配置：从环境变量读取密钥
# ==========================================
APP_ID = os.getenv('WECHAT_APP_ID')
APP_SECRET = os.getenv('WECHAT_APP_SECRET')

# ==========================================
# 配置
# ==========================================
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wechat_data.json')

def get_access_token():
    """
    获取微信稳定版 Access Token (getStableAccessToken)
    文档: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/getStableAccessToken.html
    """
    url = "https://api.weixin.qq.com/cgi-bin/stable_token"
    payload = {
        "grant_type": "client_credential",
        "appid": APP_ID,
        "secret": APP_SECRET
    }
    
    try:
        resp = requests.post(url, json=payload)
        data = resp.json()
        
        if 'access_token' in data:
            return data['access_token']
        else:
            print(f"❌ 获取 Token 失败: {data}")
            return None
    except Exception as e:
        print(f"❌ 网络请求异常: {e}")
        return None

def get_total_followers(token):
    """
    获取粉丝总数 (通用接口，兼容个人订阅号)
    使用 /user/get 接口，返回里的 'total' 字段即为关注总数
    """
    url = f"https://api.weixin.qq.com/cgi-bin/user/get?access_token={token}"
    
    try:
        resp = requests.get(url)
        data = resp.json()
        
        if 'total' in data:
            return data['total']
        elif 'errcode' in data:
            print(f"⚠️ 接口调用失败: {data}")
            return 0
    except Exception as e:
        print(f"❌ 网络请求异常: {e}")
        return 0

def main():
    print(f"🚀 开始抓取微信数据... [{datetime.datetime.now()}]")
    
    if not APP_ID or not APP_SECRET:
        print("❌ 错误: 未找到环境变量 WECHAT_APP_ID 或 WECHAT_APP_SECRET")
        print("💡 请确保在宝塔计划任务中正确设置了 export 语句")
        return

    token = get_access_token()
    if not token:
        return

    # 1. 读取旧数据 (为了计算增长)
    previous_total = 0
    previous_growth = 0
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                previous_total = old_data.get('total_followers', 0)
                # 如果是同一天多次运行，保留之前的增长数据，否则会变成0
                if old_data.get('data_date') == datetime.date.today().strftime("%Y-%m-%d"):
                    previous_growth = old_data.get('daily_growth', 0)
        except Exception as e:
            print(f"⚠️ 读取旧数据失败: {e}")

    # 2. 获取当前总数
    current_total = get_total_followers(token)
    
    # 3. 计算增长 (Net Growth)
    # 如果是第一次运行，或者旧数据是0，则增长显示为0
    # 如果是同一天多次运行，增长保持不变（或者你可以选择重新计算，这里我们简单处理：如果是新的一天，diff就是增长）
    
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            old_check = json.load(f)
            last_date = old_check.get('data_date', '')
            
        if last_date != today_str:
            # 这是一个新日子的第一次运行，计算与昨天的差值
            daily_growth = current_total - previous_total
        else:
            # 今天已经运行过了，保持上次计算的增长值，或者实时更新总数但增长值基于昨天
            # 为了简单，如果今天运行多次，我们假设 'previous_total' 已经是今天的了，这样会导致增长变0
            # 所以更稳妥的做法是：我们只在脚本每天定时运行时更新 growth。
            # 这里做一个简单策略：如果是同一天，我们沿用旧的 growth，只更新 total
            daily_growth = previous_growth
            # 如果 total 变了 (比如刚才又有人关注了)，我们把这部分增量加进去? 
            # 算了，保持简单：growth = current - (previous_total - previous_growth)
            # 推导：yesterday_total = previous_total (if same day run) - previous_growth
            # daily_growth = current_total - yesterday_total
            if previous_total > 0:
                 yesterday_total = previous_total - previous_growth
                 daily_growth = current_total - yesterday_total
            else:
                daily_growth = 0
    else:
        daily_growth = 0

    final_data = {
        "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_followers": current_total,
        "daily_growth": daily_growth,
        "data_date": today_str,
    }

    # 写入 JSON 文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 数据已保存至: {OUTPUT_FILE}")
    print(f"📊 当前粉丝数: {final_data['total_followers']}")

if __name__ == "__main__":
    main()
