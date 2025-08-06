#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单测试 - 测试 AI_Dictionary 函数是否能正常返回
"""

import sys
import os

# 添加项目根目录到 Python 路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
from utils import AI_Dictionary

def test_ai_dictionary():
    """测试 AI_Dictionary 函数"""
    print("🧪 测试 AI_Dictionary 函数")
    # 测试单词
    test_word = "hello"
    print(f"测试单词: {test_word}")
    
    result = AI_Dictionary(test_word)
    print(f"返回结果: {result}")

    # query again (should return cached result)
    result = AI_Dictionary(test_word)
    print(f"再次查询结果: {result}")

if __name__ == "__main__":
    success = test_ai_dictionary()