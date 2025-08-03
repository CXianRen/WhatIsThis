# 统一面板组件 - more-panel 与 sidebar 合并

## 概述

成功将原有的 `more-panel` 与 `sidebar` 合并成一个统一的面板组件，支持四个位置（顶部、底部、左侧、右侧）的面板显示。

## 主要改动

### 1. JavaScript 组件 (`/static/sidebar-component.js`)

- **重构为统一面板组件**: 从原来只支持顶部的侧边栏，扩展为支持四个方向的面板
- **新增配置选项**:
  - `position`: 'left', 'right', 'top', 'bottom'
  - `showToggleButton`: 是否显示切换按钮
  - `height`: 底部/顶部面板的高度
  - `width`: 左右面板的宽度

### 2. CSS 样式 (`/static/sidebar-component.css`)

- **位置特定样式**: 为每个位置添加专门的CSS类
  - `.sidebar-top`: 顶部面板样式
  - `.sidebar-bottom`: 底部面板样式  
  - `.sidebar-left`: 左侧面板样式
  - `.sidebar-right`: 右侧面板样式
- **响应式设计**: 针对移动设备优化
- **动画效果**: 每个位置都有对应的滑入动画

### 3. HTML 文件更新 (`/templates/LWI.html`)

- **移除原有 more-panel**: 删除了原有的固定HTML结构
- **新增双面板系统**:
  - `sidebar`: 顶部面板，显示场景列表
  - `morePanel`: 底部面板，显示词汇详情
- **事件处理更新**: 适配新的面板组件API

## 功能特点

### 🎯 核心功能
- ✅ 四个位置支持（顶部、底部、左侧、右侧）
- ✅ 可配置的切换按钮
- ✅ 遮罩层和自动隐藏
- ✅ 自定义内容插入
- ✅ 完整的事件系统

### 📱 响应式设计
- ✅ 移动设备适配
- ✅ 触摸友好的滚动
- ✅ 小屏幕优化

### ♿ 无障碍访问
- ✅ 键盘导航支持
- ✅ 屏幕阅读器友好
- ✅ 高对比度模式支持

### 🎨 主题系统
- ✅ 深色主题支持
- ✅ 浅色主题支持
- ✅ 自定义主题扩展

## 使用示例

### 基本用法

```javascript
// 创建底部面板（替代原有的more-panel）
const morePanel = new SidebarComponent({
  title: '词汇详情',
  position: 'bottom',
  showToggleButton: false,
  enableOverlay: true
});

// 添加内容
const content = document.createElement('div');
content.innerHTML = '<p>面板内容</p>';
morePanel.addContent(content, 'content-id');

// 显示面板
morePanel.show();
```

### 配置选项

```javascript
const panel = new SidebarComponent({
  containerId: 'container',     // 容器ID
  sidebarId: 'my-panel',       // 面板ID
  title: '我的面板',            // 面板标题
  position: 'bottom',          // 位置：left/right/top/bottom
  showToggleButton: false,     // 是否显示切换按钮
  enableOverlay: true,         // 是否启用遮罩层
  autoHide: true,             // 点击外部是否自动隐藏
  height: '50vh',             // 高度（顶部/底部面板）
  width: '300px'              // 宽度（左右面板）
});
```

## API 方法

### 内容管理
- `addContent(content, id)`: 添加内容
- `removeContent(id)`: 移除内容
- `updateContent(id, newContent)`: 更新内容
- `clearContent()`: 清空所有内容

### 显示控制
- `show()`: 显示面板
- `hide()`: 隐藏面板
- `toggle()`: 切换显示状态

### 事件系统
- `on(event, handler)`: 绑定事件
- `off(event, handler)`: 移除事件
- `trigger(event, data)`: 触发事件

### 其他
- `setTitle(title)`: 设置标题
- `destroy()`: 销毁组件

## 文件结构

```
/static/
├── sidebar-component.js     # 统一面板组件
├── sidebar-component.css    # 组件样式文件
└── ...

/templates/
├── LWI.html                # 主应用文件（已更新）
├── panel-test.html         # 测试页面
└── ...
```

## 测试

创建了测试页面 `/templates/panel-test.html` 来验证所有四个位置的面板功能。

## 向后兼容

- ✅ 保持了原有的API接口
- ✅ CSS类名保持兼容
- ✅ 事件系统向下兼容

## 性能优化

- ✅ CSS外部文件加载，带内联样式后备
- ✅ 懒加载样式应用
- ✅ 事件委托优化
- ✅ DOM操作缓存

## 总结

成功将 `more-panel` 与 `sidebar` 合并为统一的面板组件，提供了更灵活、更强大的面板系统。新组件支持四个方向的面板显示，完全兼容原有功能，并且增加了许多新特性。
