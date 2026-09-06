const installButton = document.getElementById("install-button");
const updateButton = document.getElementById("update-button");
const status = document.getElementById("pwa-status");
const offlineIndicator = document.getElementById("offline-indicator");
const appBase = new URL("../../", import.meta.url);
const standalone = window.matchMedia("(display-mode: standalone)");
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let installPrompt = null;
let registration = null;
let updating = false;
let reloadAvailable = false;
let hadController = "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller);

function setStatus(message) {
  if (status) status.textContent = message;
}

function renderInstallButton() {
  if (!installButton) return;
  installButton.hidden = standalone.matches || navigator.standalone === true
    || (!installPrompt && !isIOS);
}

function renderConnection() {
  if (!offlineIndicator) return;
  offlineIndicator.hidden = navigator.onLine;
  offlineIndicator.textContent = "离线 · 词本和文字复习可用";
}

function showUpdate() {
  if (!registration?.waiting || !updateButton) return;
  updateButton.hidden = false;
  setStatus("新版本已准备好，可在复习结束后更新。");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  renderInstallButton();
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  if (installButton) installButton.hidden = true;
  setStatus("已安装 AIDict。");
});

installButton?.addEventListener("click", async () => {
  if (!installPrompt) {
    setStatus("在 Safari 中打开，点“分享”→“添加到主屏幕”，即可安装 AIDict。");
    return;
  }
  const prompt = installPrompt;
  installPrompt = null;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setStatus(choice.outcome === "accepted" ? "正在安装 AIDict…" : "也可以继续在浏览器中使用。");
  } catch {
    setStatus("请使用浏览器菜单中的“安装应用”或“添加到主屏幕”。");
  }
  renderInstallButton();
});

updateButton?.addEventListener("click", () => {
  if ((!registration?.waiting && !reloadAvailable) || updating) return;
  // The app can cancel while a note or review result is being saved.
  const ready = window.dispatchEvent(new CustomEvent("aidict:before-update", { cancelable: true }));
  if (!ready) return;
  updating = true;
  updateButton.disabled = true;
  setStatus("正在更新…");
  if (reloadAvailable) window.location.reload();
  else registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
});

window.addEventListener("online", renderConnection);
window.addEventListener("offline", renderConnection);
standalone.addEventListener("change", renderInstallButton);
renderInstallButton();
renderConnection();

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Other open tabs keep their current card and unsaved text.
    if (updating) window.location.reload();
    else if (hadController) {
      reloadAvailable = true;
      if (updateButton) updateButton.hidden = false;
      setStatus("新版本已在其他窗口启用，可在复习结束后更新此页。");
    }
    hadController = true;
  });

  try {
    registration = await navigator.serviceWorker.register(new URL("sw.js", appBase), {
      scope: appBase.href,
      updateViaCache: "none",
    });
    showUpdate();
    if (registration.active && !registration.waiting) setStatus("应用已缓存，可离线打开词本和复习。");

    const observeInstall = (worker) => {
      if (!worker) return;
      let installed = ["installed", "activating", "activated"].includes(worker.state);
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          installed = true;
          if (navigator.serviceWorker.controller) showUpdate();
          else setStatus("应用已缓存，可离线打开词本和复习。");
        } else if (worker.state === "redundant" && !installed) {
          setStatus("应用缓存未完成，请联网后重新打开。收藏数据不受影响。");
        }
      });
    };
    observeInstall(registration.installing);
    registration.addEventListener("updatefound", () => observeInstall(registration.installing));
    window.addEventListener("online", () => registration.update().catch(() => {}));
  } catch {
    setStatus(navigator.onLine
      ? "暂时无法启用离线缓存，可以继续在线使用。"
      : "请联网打开一次，完成应用缓存后即可离线使用。");
  }
} else {
  setStatus("当前环境未启用离线缓存，请通过 HTTPS 或 localhost 打开。");
}
