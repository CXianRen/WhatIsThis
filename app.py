
# ================= 重定向到新的模块化架构 =================
"""
这个文件现在重定向到新的模块化架构。
原来的单一文件已经拆分为多个模块：

- config.py: 配置文件
- database.py: 数据库管理
- utils.py: 工具函数
- translation_service.py: 翻译服务
- routes/: 路由模块目录
  - main.py: 基础路由
  - group.py: 分组学习路由
  - novel.py: 小说阅读路由
  - novel_api.py: 小说管理API
  - translation.py: 翻译API
  - annotation.py: 标注模式路由
- main.py: 新的主入口文件

请使用 main.py 启动应用。
"""

print("⚠️  警告: app.py 已被重构!")
print("📁 新的模块化架构已创建")
print("🚀 请使用 'python main.py' 启动应用")
print("📚 所有功能已分解到独立模块中")

# 为了向后兼容，可以导入新的应用
try:
    from main import app
    print("✅ 成功导入新应用架构")
    
    if __name__ == '__main__':
        print("🔄 正在启动新的模块化应用...")
        app.run(host='0.0.0.0', port=5000, debug=True)
        
except ImportError as e:
    print(f"❌ 导入新架构失败: {e}")
    print("💡 请确保所有新模块文件都已创建")
