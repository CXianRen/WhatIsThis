# 侧边栏组件 (SidebarComponent)

一个可重用的侧边栏组件，支持自定义内容插入和灵活配置。

## 特性

- 🎯 **可自定义内容** - 支持添加任意HTML内容或DOM元素
- 🎨 **灵活样式** - 内置默认样式，支持自定义样式覆盖
- 📱 **响应式设计** - 自动适配移动端和桌面端
- 🎮 **事件系统** - 支持监听显示/隐藏等事件
- ⚙️ **配置选项** - 多种配置选项满足不同需求
- 🔄 **动态管理** - 支持动态添加、移除、更新内容

## 快速开始

### 1. 引入组件

```html
<script src="/static/sidebar-component.js"></script>
```

### 2. 创建侧边栏实例

```javascript
const sidebar = new SidebarComponent({
  title: '我的侧边栏',
  containerId: 'container'
});
```

### 3. 添加自定义内容

```javascript
// 添加HTML字符串
sidebar.addContent('<p>这是一段文本</p>', 'text-content');

// 添加DOM元素
const myElement = document.createElement('div');
myElement.innerHTML = '<h3>自定义组件</h3>';
sidebar.addContent(myElement, 'custom-component');
```

## API 文档

### 构造函数选项

```javascript
const options = {
  containerId: 'container',        // 容器ID
  sidebarId: 'sidebar',           // 侧边栏ID
  overlayClass: 'sidebar-overlay', // 遮罩层CSS类
  toggleButtonClass: 'sidebar-toggle', // 切换按钮CSS类
  closeButtonClass: 'sidebar-close',   // 关闭按钮CSS类
  showClass: 'show',              // 显示状态CSS类
  title: '侧边栏',                // 标题
  position: 'left',               // 位置 (预留功能)
  autoHide: true,                 // 点击其他区域自动隐藏
  enableOverlay: true             // 启用遮罩层
};
```

### 主要方法

#### 显示/隐藏控制

```javascript
sidebar.show()    // 显示侧边栏
sidebar.hide()    // 隐藏侧边栏
sidebar.toggle()  // 切换显示状态
```

#### 内容管理

```javascript
// 添加内容
const contentId = sidebar.addContent(content, id);

// 移除内容
sidebar.removeContent(contentId);

// 更新内容
sidebar.updateContent(contentId, newContent);

// 获取内容元素
const element = sidebar.getContent(contentId);

// 清空所有内容
sidebar.clearContent();
```

#### 配置管理

```javascript
// 设置标题
sidebar.setTitle('新标题');
```

#### 事件系统

```javascript
// 监听事件
sidebar.on('show', (data) => {
  console.log('侧边栏已显示');
});

sidebar.on('hide', (data) => {
  console.log('侧边栏已隐藏');
});

// 移除事件监听
sidebar.off('show', handler);
```

#### 销毁组件

```javascript
sidebar.destroy();
```

## 使用示例

### 基本使用

```javascript
// 创建侧边栏
const sidebar = new SidebarComponent({
  title: '场景列表'
});

// 添加图片列表
const imageList = `
  <ul id="imgList">
    <li onclick="selectImage('image1.jpg')">图片1</li>
    <li onclick="selectImage('image2.jpg')">图片2</li>
  </ul>
`;
sidebar.addContent(imageList, 'imageList');
```

### 添加复杂组件

```javascript
// 创建天气组件
function createWeatherWidget() {
  const widget = document.createElement('div');
  widget.className = 'weather-widget';
  widget.innerHTML = `
    <h4>天气预报</h4>
    <div class="temperature">22°C</div>
    <div class="description">晴转多云</div>
  `;
  return widget;
}

// 添加到侧边栏
const weatherWidget = createWeatherWidget();
sidebar.addContent(weatherWidget, 'weather');
```

### 动态更新内容

```javascript
// 更新天气信息
function updateWeather(temp, desc) {
  const newWeatherHtml = `
    <h4>天气预报</h4>
    <div class="temperature">${temp}°C</div>
    <div class="description">${desc}</div>
  `;
  sidebar.updateContent('weather', newWeatherHtml);
}
```

### 事件处理

```javascript
// 监听侧边栏事件
sidebar.on('show', () => {
  console.log('侧边栏打开了');
  // 可以在这里加载动态数据
  loadSidebarData();
});

sidebar.on('hide', () => {
  console.log('侧边栏关闭了');
  // 可以在这里保存状态
  saveSidebarState();
});
```

## 样式自定义

组件提供了默认样式，你也可以通过CSS覆盖来自定义外观：

```css
/* 自定义侧边栏样式 */
.sidebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 自定义切换按钮 */
.sidebar-toggle {
  background: #ff6b6b;
  border-radius: 50%;
}

/* 自定义内容区域 */
.sidebar-content {
  padding: 20px;
}
```

## 在现有项目中的应用

在 `LWI.html` 项目中，侧边栏组件被用来替换原有的固定侧边栏实现：

```javascript
// 初始化侧边栏
function initSidebar() {
  sidebar = new SidebarComponent({
    title: '场景列表',
    containerId: 'container'
  });
  
  // 创建图片列表内容
  const imgListContent = createImageListContent();
  sidebar.addContent(imgListContent, 'imageList');
}

// 在需要时可以添加更多组件
function addExtraFeatures() {
  // 添加搜索功能
  const searchHtml = `
    <div class="search-box">
      <input type="text" placeholder="搜索场景..." />
    </div>
  `;
  sidebar.addContent(searchHtml, 'search');
  
  // 添加过滤器
  const filterHtml = `
    <div class="filter-section">
      <h4>过滤选项</h4>
      <label><input type="checkbox" /> 仅显示已标注</label>
      <label><input type="checkbox" /> 仅显示未处理</label>
    </div>
  `;
  sidebar.addContent(filterHtml, 'filters');
}
```

## 注意事项

1. **容器要求**: 确保指定的容器元素存在于页面中
2. **样式冲突**: 如果页面中有其他CSS可能冲突，请检查样式优先级
3. **事件清理**: 在单页应用中使用时，记得在适当时机调用 `destroy()` 方法
4. **内容ID**: 为了方便管理，建议为每个内容项指定唯一的ID

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 演示

查看 `sidebar-demo.html` 文件以获取完整的使用演示。
