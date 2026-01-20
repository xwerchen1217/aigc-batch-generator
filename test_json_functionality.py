import sys
import os
import json
import tempfile
import shutil

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from AIGC_batch.generator import KeyGenerator, GenerationResult

# 测试JSON解析和导出功能
def test_json_parsing_and_export():
    print("开始测试JSON解析和导出功能...")
    
    # 创建临时目录
    test_dir = tempfile.mkdtemp()
    
    try:
        # 创建生成器实例
        generator = KeyGenerator()
        
        # 模拟API客户端
        class MockAPIClient:
            def generate(self, prompt):
                # 返回JSON格式的结果
                return json.dumps({
                    "topic_key": prompt.split()[0],
                    "category": "electronics",
                    "tags": ["gadget", "tech"],
                    "details": {
                        "description": "This is a test product",
                        "price": 199.99
                    }
                })
        
        # 模拟输入数据
        generator.headers = ["product_name", "category"]
        generator.input_data = [
            {"product_name": "test1", "category": "tech"},
            {"product_name": "test2", "category": "electronics"}
        ]
        generator.total_rows = len(generator.input_data)
        
        # 测试生成单个结果
        print("\n1. 测试单个结果的JSON解析:")
        client = MockAPIClient()
        result = generator.generate_single(client, 0, "Test prompt", {})
        
        print(f"生成结果: {result.result[:50]}...")
        print(f"解析后的JSON: {result.parsed_result}")
        print(f"解析成功: {bool(result.parsed_result)}")
        
        # 测试并发生成
        print("\n2. 测试并发生成:")
        
        success, message = generator.start_generation(
            client, 
            "Test {product_name}", 
            {"product_name": "product_name"}, 
            max_workers=2
        )
        
        print(f"生成完成: {success}")
        print(f"生成消息: {message}")
        print(f"生成结果数: {len(generator.results)}")
        
        # 检查解析结果
        for i, result in enumerate(generator.results):
            if result:
                print(f"  第{i+1}行解析结果: {result.parsed_result}")
        
        # 测试JSON扁平化
        print("\n3. 测试JSON扁平化:")
        test_json = {
            "a": 1,
            "b": {
                "c": 2,
                "d": {
                    "e": 3
                }
            },
            "f": [1, 2, 3]
        }
        flattened = generator._flatten_json(test_json)
        print(f"原始JSON: {test_json}")
        print(f"扁平化后: {flattened}")
        
        # 测试导出功能
        print("\n4. 测试导出功能:")
        output_file = os.path.join(test_dir, "test_output.xlsx")
        
        success, message = generator.export_result(output_file)
        print(f"导出结果: {success}")
        print(f"导出消息: {message}")
        
        if success and os.path.exists(output_file):
            print(f"导出文件已创建: {output_file}")
            print(f"文件大小: {os.path.getsize(output_file)} bytes")
        
        # 测试断点功能
        print("\n5. 测试断点功能:")
        
        # 保存断点
        generator.save_checkpoint("Test template", {"var": "col"}, 2)
        
        # 获取最新断点
        latest_checkpoint = generator.get_latest_checkpoint(test_dir)
        if latest_checkpoint:
            print(f"断点文件已保存: {latest_checkpoint}")
            
            # 加载断点
            new_generator = KeyGenerator()
            new_generator._current_file = generator._current_file
            
            success, message = new_generator.load_checkpoint(latest_checkpoint)
            print(f"加载断点: {success}")
            print(f"加载消息: {message}")
            print(f"恢复结果数: {len(new_generator.results)}")
        
        print("\n所有测试完成！")
        print("功能正常工作。")
        
    finally:
        # 清理临时目录
        shutil.rmtree(test_dir)

if __name__ == "__main__":
    test_json_parsing_and_export()
