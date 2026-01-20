import sys
import os
import time

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from AIGC_batch.generator import KeyGenerator, GenerationResult

# 测试生成耗时记录功能
def test_generation_time():
    print("测试生成耗时记录功能...")
    
    # 创建生成器实例
    generator = KeyGenerator()
    
    # 模拟API客户端
    class MockAPIClient:
        def generate(self, prompt):
            # 模拟API调用耗时
            time.sleep(0.5)
            return f"Generated result for: {prompt[:20]}..."
    
    # 测试单行生成耗时
    print("\n1. 测试单行生成耗时:")
    client = MockAPIClient()
    
    # 模拟输入数据
    generator.headers = ["col1", "col2"]
    generator.input_data = [
        {"col1": "value1", "col2": "value2"},
        {"col1": "value3", "col2": "value4"}
    ]
    
    # 测试生成单个结果
    result = generator.generate_single(client, 0, "Test prompt", {})
    print(f"生成结果: {result.success}")
    print(f"生成耗时: {result.generation_time:.2f}秒 (预期约0.5秒)")
    
    # 测试并发生成
    print("\n2. 测试并发生成:")
    
    # 增加更多测试数据
    generator.input_data = [{"col1": f"value{i}", "col2": f"value{i+1}"} for i in range(10)]
    generator.total_rows = len(generator.input_data)
    
    start_time = time.time()
    
    # 使用5并发
    success, message = generator.start_generation(
        client, 
        "Test prompt {col1}", 
        {"col1": "col1"}, 
        max_workers=5
    )
    
    end_time = time.time()
    total_time = end_time - start_time
    
    print(f"生成完成: {success}")
    print(f"生成消息: {message}")
    print(f"总耗时: {total_time:.2f}秒")
    print(f"预期耗时: ~2秒 (10条 * 0.5秒 / 5并发)")
    
    # 检查每个结果的耗时
    print("\n3. 检查每个结果的耗时:")
    for i, result in enumerate(generator.results[:5]):  # 只显示前5个
        if result:
            print(f"  第{i+1}行: {result.generation_time:.2f}秒")
    
    # 测试进度中的时间统计
    print("\n4. 测试进度中的时间统计:")
    progress = generator.get_progress()
    print(f"总生成耗时: {progress.get('total_generation_time', 0):.2f}秒")
    print(f"平均耗时: {progress.get('avg_generation_time', 0):.2f}秒/条")
    
    print("\n测试完成！")

if __name__ == "__main__":
    test_generation_time()
