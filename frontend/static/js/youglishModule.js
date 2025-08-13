// youglishModule.js
const YouglishModule = (function () {
  let youglishWidget = null;
  let youglishAPIReady = false;
  let youglishTimer = null;
  let youglishStatus, youglishWord, youglishOverlay;

  // callback 函数
  closeCallback = null;

  // ===== 外部脚本加载 =====
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ===== 初始化模块 =====
  async function init({ statusEl, wordEl, overlayEl, ccb = null
  }) {
    youglishStatus = statusEl;
    youglishWord = wordEl;
    youglishOverlay = overlayEl;
    closeCallback = ccb;

    // 挂载全局回调（YouGlish 必须用全局的）
    window.onYouglishAPIReady = onYouglishAPIReady;

    youglishOverlay.addEventListener('click', (event) => {
      if (event.target === youglishOverlay) {
        close();
      }
    });


    // 加载 YouGlish API
    await loadScript("https://youglish.com/public/emb/widget.js");
  }

  // ===== YouGlish API 准备就绪 =====
  function onYouglishAPIReady() {
    youglishAPIReady = true;
    updateStatus("YouGlish API 已加载，正在初始化...");

    try {
      youglishWidget = new YG.Widget("youglish-widget-container", {
        width: 640,
        height: 400,
        components: 88,
        events: {
          onFetchDone,
          onCaptionConsumed,
          onVideoReady,
          onError
        }
      });
      updateStatus("Widget 已创建，可以开始搜索");
    } catch (e) {
      console.error("Widget 创建失败:", e);
      updateStatus("Widget 创建失败: " + e.message);
    }
  }

  // ===== 事件回调 =====
  function onFetchDone(event) {
    if (event.totalResult === 0) {
      updateStatus("没有找到结果");
    } else {
      updateStatus(`找到 ${event.totalResult} 个发音示例`);
    }
  }

  function onCaptionConsumed(event) {
    if (youglishWidget) {
      youglishWidget.pause();
      youglishTimer = setTimeout(() => {
        if (youglishWidget) youglishWidget.replay();
      }, 2000);
    }
  }

  function onVideoReady() {
    updateStatus("播放器已准备就绪");
  }

  function onError(event) {
    updateStatus("发生错误：" + event.code);
  }

  // ===== 工具函数 =====
  function updateStatus(msg) {
    if (youglishStatus) {
      youglishStatus.textContent = msg;
    }
  }

  // ===== 对外功能 =====
  function show(word) {
    if (!word) return;
    youglishWord.textContent = word;
    youglishOverlay.style.display = "flex";

    if (!youglishAPIReady) {
      updateStatus("等待 YouGlish API 加载...");
      const checkAPI = setInterval(() => {
        if (typeof YG !== "undefined" && youglishAPIReady) {
          clearInterval(checkAPI);
          search(word);
        }
      }, 500);

      setTimeout(() => {
        if (!youglishAPIReady) {
          clearInterval(checkAPI);
          updateStatus("YouGlish API 加载超时，请刷新页面重试");
        }
      }, 5000);
    } else {
      search(word);
    }
  }

  function search(word) {
    if (!youglishWidget) {
      updateStatus("Widget 未初始化");
      return;
    }
    updateStatus("正在搜索: " + word);
    try {
      youglishWidget.fetch(word, "english");
    } catch (e) {
      console.error("搜索失败:", e);
      updateStatus("搜索失败: " + e.message);
    }
  }

  function close() {
    youglishOverlay.style.display = "none";
    if (youglishWidget) {
      try {
        youglishWidget.pause();
      } catch { }
      if (youglishTimer) {
        clearTimeout(youglishTimer);
        youglishTimer = null;
      }
    }
    if (closeCallback && typeof closeCallback === "function") {
      closeCallback();
    }
  }

  // ===== 暴露 API =====
  return {
    init,
    show,
    close
  };
})();
