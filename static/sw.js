// Service Worker for WhatIsThis PWA
const CACHE_NAME = 'whatisthis-v1.0.0';
const urlsToCache = [
  '/',
  '/static/style.css',
  '/static/sidebar-component.css',
  '/static/sidebar-component.js',
  '/static/word_detail_panel.css',
  '/static/word_detail_panel.js',
  '/static/favicon.svg',
  '/static/apple-touch-icon.svg',
  '/static/favicon-192.svg',
  '/static/favicon-512.svg',
  '/app1',
  '/app2', 
  '/app3',
  '/app4',
  '/novel-upload',
  '/novel-translation'
];

// 安装事件 - 缓存资源
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 获取事件 - 提供缓存内容
self.addEventListener('fetch', function(event) {
  // 只处理GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有资源，返回缓存的版本
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // 否则从网络获取
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(function(response) {
          // 检查是否为有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应，因为它是一次性的
          const responseToCache = response.clone();

          // 将新资源添加到缓存
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function(error) {
          console.log('Service Worker: Network fetch failed', error);
          
          // 如果是导航请求且网络失败，返回离线页面
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// 推送通知事件
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'WhatIsThis 有新内容',
    icon: '/static/favicon-192.svg',
    badge: '/static/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('WhatIsThis', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// 后台同步事件
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 这里可以添加后台同步逻辑
      console.log('Service Worker: Performing background sync')
    );
  }
});

// 消息事件 - 与页面通信
self.addEventListener('message', function(event) {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({version: CACHE_NAME});
  }
});
