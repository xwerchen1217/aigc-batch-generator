"""
通用API客户端模块
支持任意OpenAI兼容的API服务（自定义URL、Key、Model）
"""

import requests
from typing import Optional


class UniversalAPIClient:
    """通用API客户端 - 支持OpenAI兼容格式"""

    def __init__(self, api_url: str, api_key: str, model: str):
        """
        初始化API客户端
        :param api_url: API基础URL（如: https://open.bigmodel.cn/api/paas/v4/）
        :param api_key: API密钥
        :param model: 模型名称
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.model = model

        # 确保URL包含chat/completions路径
        if not self.api_url.endswith('/chat/completions'):
            self.chat_url = f"{self.api_url}/chat/completions"
        else:
            self.chat_url = self.api_url

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 500, **kwargs) -> str:
        """
        调用API生成内容
        :param prompt: 提示词
        :param temperature: 温度参数
        :param max_tokens: 最大token数
        :return: 生成结果
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(
                self.chat_url,
                headers=headers,
                json=data,
                timeout=60
            )
            response.raise_for_status()

            result = response.json()

            # 兼容不同API的响应格式
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"].strip()
            else:
                raise Exception(f"API响应格式异常: {result}")

        except requests.exceptions.RequestException as e:
            raise Exception(f"API请求失败: {e}")

    def test_connection(self) -> tuple[bool, str]:
        """测试API连接"""
        try:
            result = self.generate("测试连接，请回复'连接成功'")
            if "连接成功" in result or "成功" in result:
                return True, "连接成功"
            else:
                return True, f"连接成功（响应: {result[:50]}）"
        except Exception as e:
            return False, str(e)


# API配置类（运行时存储在内存）
class APIConfig:
    """API配置管理（内存存储，不持久化）"""

    def __init__(self):
        self._client: Optional[UniversalAPIClient] = None
        self._api_url: Optional[str] = None
        self._model: Optional[str] = None

    def configure(self, api_url: str, api_key: str, model: str) -> tuple[bool, str]:
        """
        配置API
        :param api_url: API地址
        :param api_key: API密钥
        :param model: 模型名称
        """
        try:
            self._client = UniversalAPIClient(api_url, api_key, model)
            self._api_url = api_url
            self._model = model

            success, message = self._client.test_connection()
            if success:
                return True, "配置成功"
            else:
                self._client = None
                return False, f"连接测试失败: {message}"
        except Exception as e:
            self._client = None
            return False, str(e)

    def is_configured(self) -> bool:
        """检查是否已配置"""
        return self._client is not None

    def get_client(self) -> Optional[UniversalAPIClient]:
        """获取客户端"""
        return self._client

    def generate(self, prompt: str, **kwargs) -> str:
        """生成内容"""
        if not self.is_configured():
            raise Exception("API未配置，请先配置API")
        return self._client.generate(prompt, **kwargs)

    def clear(self):
        """清除配置"""
        self._client = None
        self._api_url = None
        self._model = None

    def get_config_info(self) -> dict:
        """获取配置信息（不包含敏感信息）"""
        return {
            "api_url": self._api_url,
            "model": self._model
        }


# 全局API配置实例（内存存储）
api_config = APIConfig()
