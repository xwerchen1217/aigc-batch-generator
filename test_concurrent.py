import requests
import time
import json

# 测试API URL和端口
BASE_URL = "http://localhost:5002"

# 测试并发生成功能
def test_concurrent_generation():
    print("开始测试并发生成功能...")
    
    # 1. 配置API（这里需要替换为有效的API配置）
    api_config = {
        "api_url": "https://open.bigmodel.cn/api/paas/v4/",
        "api_key": "your_api_key_here",  # 替换为实际的API Key
        "model": "glm-4.7"
    }
    
    response = requests.post(f"{BASE_URL}/api/config", json=api_config)
    if not response.json().get("success"):
        print(f"API配置失败: {response.json().get('message')}")
        print("提示: 请先在界面上配置有效的API参数")
        return
    
    print("API配置成功")
    
    # 2. 测试并发生成（这里假设已经上传了文件）
    # 注意：实际测试需要先上传文件
    test_data = {
        "start_index": 0,
        "max_workers": 10  # 测试10并发
    }
    
    response = requests.post(f"{BASE_URL}/api/generate", json=test_data)
    if response.json().get("success"):
        print(f"生成任务已启动，并发数: {test_data['max_workers']}")
        print(f"任务ID: {response.json().get('data', {}).get('task_id', 'N/A')}")
        
        # 3. 检查进度
        print("开始监控进度...")
        for _ in range(10):  # 检查10次
            time.sleep(3)
            progress_response = requests.get(f"{BASE_URL}/api/progress")
            progress_data = progress_response.json().get("data", {})
            
            print(f"\r进度: {progress_data.get('current', 0)}/{progress_data.get('total', 0)} ({progress_data.get('progress', 0)}%)", end="")
            
            if progress_data.get("status") in ["completed", "error"]:
                break
        
        print("\n测试完成")
        
    else:
        print(f"生成任务启动失败: {response.json().get('message')}")
        print("提示: 请先上传文件并完成预览")

if __name__ == "__main__":
    test_concurrent_generation()
