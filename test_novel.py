#!/usr/bin/env python3
"""
测试脚本：处理单个章节
"""

import os
import sys
import json
from novel_process import process_chapter, split_sentences, read_chapter_file

def test_single_chapter(chapter_path: str):
    """测试处理单个章节"""
    print(f"测试处理章节: {chapter_path}")
    
    if not os.path.exists(chapter_path):
        print(f"文件不存在: {chapter_path}")
        return
    
    # 读取内容
    content = read_chapter_file(chapter_path)
    if not content:
        print("无法读取文件内容")
        return
    
    print(f"文件内容长度: {len(content)} 字符")
    print(f"前100字符: {content[:100]}...")
    
    # 拆分句子
    sentences = split_sentences(content)
    print(f"\n拆分得到 {len(sentences)} 个句子:")
    
    for i, sentence in enumerate(sentences[:5]):  # 只显示前5个句子
        print(f"  {i+1}. {sentence}")
    
    if len(sentences) > 5:
        print(f"  ... (还有 {len(sentences) - 5} 个句子)")
    
    # 询问是否继续翻译
    choice = input(f"\n是否开始翻译这 {len(sentences)} 个句子？(y/n): ").strip().lower()
    
    if choice == 'y':
        # 设置输出文件
        base_dir = os.path.dirname(chapter_path)
        output_file = os.path.join(base_dir, 'en_test.json')
        
        print(f"\n开始翻译，结果将保存到: {output_file}")
        result = process_chapter(chapter_path, output_file)
        
        if "error" not in result:
            print(f"\n翻译完成！共处理 {result['total_sentences']} 个句子")
            print(f"结果已保存到: {output_file}")
        else:
            print(f"翻译失败: {result['error']}")
    else:
        print("取消翻译")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        # 默认使用第一章
        chapter_path = "/workspaces/WhatIsThis/data/noval/cultivation_of_commoner/chapter_1/zh.txt"
        print(f"未指定文件，使用默认文件: {chapter_path}")
    else:
        chapter_path = sys.argv[1]
    
    test_single_chapter(chapter_path)

if __name__ == "__main__":
    main()
