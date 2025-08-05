// PWA 安装和管理脚本
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    // 注册 Service Worker
    this.registerServiceWorker();
    
    // 监听安装提示事件
    this.setupInstallPrompt();
    
    // 检查是否已安装
    this.checkInstallation();
    
    // 添加全屏支持
    this.setupFullscreen();
    
    // 监听网络状态
    this.setupNetworkStatus();
  }

  // 注册 Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/static/sw.js');
        console.log('PWA: Service Worker registered successfully', registration);
        
        // 监听 Service Worker 更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
        
      } catch (error) {
        console.log('PWA: Service Worker registration failed', error);
      }
    }
  }

  // 设置安装提示
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstalledNotification();
    });
  }

  // 检查是否已安装
  checkInstallation() {
    // 检查是否在独立模式下运行
    if (window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('PWA: App is running in installed mode');
    }
  }

  // 显示安装按钮
  showInstallButton() {
    // 创建安装按钮
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.innerHTML = '📱 安装应用';
    installButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('mouseover', () => {
      installButton.style.transform = 'translateY(-2px)';
      installButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    installButton.addEventListener('mouseout', () => {
      installButton.style.transform = 'translateY(0)';
      installButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    installButton.addEventListener('click', () => {
      this.installApp();
    });
    
    document.body.appendChild(installButton);
  }

  // 隐藏安装按钮
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.remove();
    }
  }

  // 安装应用
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      console.log('PWA: Install prompt result', result);
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // 设置全屏功能
  setupFullscreen() {
    // 添加全屏切换按钮
    const fullscreenButton = document.createElement('button');
    fullscreenButton.id = 'fullscreen-btn';
    fullscreenButton.innerHTML = '⛶';
    fullscreenButton.title = '切换全屏';
    fullscreenButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    
    fullscreenButton.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        fullscreenButton.innerHTML = '⛶';
        fullscreenButton.title = '退出全屏';
      } else {
        fullscreenButton.innerHTML = '⛶';
        fullscreenButton.title = '进入全屏';
      }
    });
    
    document.body.appendChild(fullscreenButton);
  }

  // 切换全屏
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('无法进入全屏模式:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // 设置网络状态监听
  setupNetworkStatus() {
    window.addEventListener('online', () => {
      this.showNetworkStatus('已连接到网络', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNetworkStatus('网络连接断开，正在离线模式下运行', 'warning');
    });
  }

  // 显示网络状态
  showNetworkStatus(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10001;
      background: ${type === 'success' ? '#4caf50' : '#ff9800'};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // 显示更新通知
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10001;
      background: #2196f3;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    notification.innerHTML = '📦 应用有新版本可用，点击刷新';
    
    notification.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.body.appendChild(notification);
  }

  // 显示安装成功通知
  showInstalledNotification() {
    this.showNetworkStatus('应用安装成功！', 'success');
  }
}

// 页面加载完成后初始化 PWA
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
});

// 导出PWA管理器
window.PWAManager = PWAManager;
