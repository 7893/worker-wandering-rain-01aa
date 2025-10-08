#!/usr/bin/env python3
"""
标记数据库中时间戳错误的记录
由于无法确定正确的时间，我们在 extra 字段中标记这些记录
"""
import requests
import json
import time
import os

# 从环境变量或配置读取
BASE_URL = "https://w9cigs8ax3ponzm-ioftnbqu5k6zb6ea.adb.ap-tokyo-1.oraclecloudapps.com/ords"
SCHEMA = "admin"
TABLE = "colorevents"
DB_USER = "ADMIN"
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

if not DB_PASSWORD:
    print("错误: 请设置 DB_PASSWORD 环境变量")
    exit(1)

API_URL = f"{BASE_URL}/{SCHEMA}/{TABLE}/"
auth = (DB_USER, DB_PASSWORD)

def get_error_records():
    """获取所有时间戳错误的记录（2025-10-01 之前的）"""
    offset = 0
    limit = 100
    error_records = []
    
    while True:
        response = requests.get(f"{API_URL}?limit={limit}&offset={offset}", auth=auth)
        if response.status_code != 200:
            print(f"查询失败: {response.status_code}")
            break
            
        data = response.json()
        items = data.get('items', [])
        
        for item in items:
            event_at = item.get('event_at', '')
            if event_at < '2025-10-01':
                error_records.append(item)
        
        if not data.get('hasMore', False):
            break
            
        offset += limit
        print(f"已扫描 {offset} 条记录，发现 {len(error_records)} 条错误...")
        time.sleep(0.1)  # 避免请求过快
    
    return error_records

def mark_record(record_id, note):
    """标记单条记录"""
    url = f"{API_URL}{record_id}"
    payload = {
        "extra": json.dumps({"note": note, "original_timestamp_error": True})
    }
    response = requests.put(url, json=payload, auth=auth, headers={'Content-Type': 'application/json'})
    return response.status_code == 200

def main():
    print("开始扫描错误的时间戳记录...")
    error_records = get_error_records()
    
    print(f"\n发现 {len(error_records)} 条时间戳错误的记录")
    print(f"时间范围: {min(r['event_at'] for r in error_records)} ~ {max(r['event_at'] for r in error_records)}")
    print(f"ID 范围: {min(r['id'] for r in error_records)} ~ {max(r['id'] for r in error_records)}")
    
    choice = input("\n选择操作:\n1. 标记这些记录（在 extra 字段添加标记）\n2. 仅显示统计信息\n请输入 (1/2): ")
    
    if choice == '1':
        print("\n开始标记记录...")
        success = 0
        for i, record in enumerate(error_records):
            if mark_record(record['id'], "timestamp_error_before_utc_fix"):
                success += 1
            if (i + 1) % 10 == 0:
                print(f"已处理 {i + 1}/{len(error_records)} 条")
                time.sleep(0.5)
        
        print(f"\n完成! 成功标记 {success}/{len(error_records)} 条记录")
    else:
        print("\n仅显示统计信息，未修改数据")

if __name__ == "__main__":
    main()
