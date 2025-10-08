#!/usr/bin/env python3
"""删除时间戳错误的历史数据"""
import requests
import os
import time

BASE_URL = "https://w9cigs8ax3ponzm-ioftnbqu5k6zb6ea.adb.ap-tokyo-1.oraclecloudapps.com/ords"
SCHEMA = "admin"
TABLE = "colorevents"
DB_USER = "ADMIN"
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

if not DB_PASSWORD:
    print("请设置 DB_PASSWORD 环境变量")
    print("例如: export DB_PASSWORD='your_password'")
    exit(1)

API_URL = f"{BASE_URL}/{SCHEMA}/{TABLE}/"
auth = (DB_USER, DB_PASSWORD)

print("扫描错误数据...")
offset = 0
error_ids = []

while True:
    response = requests.get(f"{API_URL}?limit=100&offset={offset}", auth=auth)
    if response.status_code != 200:
        break
    
    data = response.json()
    for item in data['items']:
        if item['event_at'] < '2025-10-01':
            error_ids.append(item['id'])
    
    if not data.get('hasMore'):
        break
    offset += 100
    print(f"已扫描 {offset} 条，发现 {len(error_ids)} 条错误")

print(f"\n发现 {len(error_ids)} 条时间戳错误的记录")
confirm = input("确认删除这些记录? (yes/no): ")

if confirm.lower() == 'yes':
    print("\n开始删除...")
    for i, record_id in enumerate(error_ids):
        response = requests.delete(f"{API_URL}{record_id}", auth=auth)
        if (i + 1) % 10 == 0:
            print(f"已删除 {i + 1}/{len(error_ids)}")
            time.sleep(0.2)
    print(f"\n完成! 删除了 {len(error_ids)} 条记录")
else:
    print("取消操作")
