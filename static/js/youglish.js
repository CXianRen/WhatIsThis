const SCRIPT_URL = "https://youglish.com/public/emb/widget.js";
const SCRIPT_TIMEOUT = 20_000;
let sdkPromise = null;
let nextMountId = 0;

function loadSDK() {
  if (window.YG?.Widget) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    const script = existingScript || document.createElement("script");
    const previousCallback = window.onYouglishAPIReady;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.removeEventListener("error", onError);
      script.removeEventListener("load", onLoad);
      if (window.onYouglishAPIReady === onReady) {
        window.onYouglishAPIReady = previousCallback;
      }
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    const onReady = () => {
      finish(window.YG?.Widget ? null : new Error("YouGlish API is unavailable."));
    };
    const onLoad = () => {
      if (window.YG?.Widget) onReady();
    };
    const onError = () => {
      finish(new Error("Could not load YouGlish. Check your connection and try again."));
    };
    const timeout = setTimeout(() => {
      finish(new Error("YouGlish took too long to load. Check your connection and try again."));
    }, SCRIPT_TIMEOUT);

    window.onYouglishAPIReady = onReady;
    script.addEventListener("error", onError);
    script.addEventListener("load", onLoad);
    if (!existingScript) {
      script.src = SCRIPT_URL;
      script.async = true;
      script.charset = "utf-8";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}

export default class YouGlishPlayer {
  constructor({
    container,
    components = 88, // Captions (8), speed (16), and native controls (64).
    autoStart = 0,
    onStatus = () => {},
    onReady = () => {},
  }) {
    this.container = container;
    this.components = components;
    this.autoStart = autoStart;
    this.onStatus = onStatus;
    this.onReady = onReady;
    this.widget = null;
    this.pendingSearch = null;
    this.readyPromise = null;
    this.generation = 0;
  }

  init() {
    if (this.readyPromise) return this.readyPromise;

    const generation = ++this.generation;
    const current = () => generation === this.generation;
    const guard = (callback) => (...args) => {
      if (current()) callback(...args);
    };
    this.readyPromise = loadSDK().then(() => {
      if (!current()) return;

      // The SDK replaces its mount node and retains widget IDs after close().
      const mount = document.createElement("div");
      mount.id = `${this.container.id || "youglish"}-player-${++nextMountId}`;
      this.container.replaceChildren(mount);
      const widget = new window.YG.Widget(mount, {
        components: this.components,
        autoStart: this.autoStart,
        videoQuality: "small",
        backgroundColor: "#171a17",
        textColor: "#f5f2eb",
        captionColor: "#f5f2eb",
        markerColor: "#b8e0c8",
        keywordColor: "#b8e0c8",
        captionSize: 28,
        events: {
          onFetchDone: guard((event) => this.handleFetchDone(event)),
          onPlayerReady: guard(() => this.onReady()),
          onError: guard((event) => this.handleError(event)),
        },
      });
      if (!current()) {
        try { widget.close(); } catch { /* The mount may already have been removed. */ }
        return;
      }
      this.widget = widget;
      this.runPendingSearch();
    }).catch((error) => {
      if (!current()) return;
      this.readyPromise = null;
      this.pendingSearch = null;
      this.container.replaceChildren();
      this.onStatus(error.message, true);
      throw error;
    });

    return this.readyPromise;
  }

  search(query, language, accent = "") {
    this.pendingSearch = { query, language, accent };

    if (!this.widget) {
      this.onStatus("Loading YouGlish…");
      this.init().catch(() => {});
      return;
    }

    this.runPendingSearch();
  }

  close() {
    // Cancel this consumer without interrupting another player's shared SDK load.
    this.generation += 1;
    const widget = this.widget;
    this.widget = null;
    this.readyPromise = null;
    this.pendingSearch = null;
    try {
      widget?.close();
    } catch {
      // Removing the iframe also stops playback if the provider close call fails.
    } finally {
      this.container.replaceChildren();
    }
  }

  runPendingSearch() {
    if (!this.widget || !this.pendingSearch) return;

    const { query, language, accent } = this.pendingSearch;
    this.pendingSearch = null;
    this.onStatus(`Searching for “${query}”…`);

    try {
      if (accent) {
        this.widget.fetch(query, language, accent);
      } else {
        this.widget.fetch(query, language);
      }
    } catch (error) {
      this.onStatus(`Search failed: ${error.message}`, true);
    }
  }

  handleFetchDone(event) {
    const total = Number(event?.totalResult || 0);
    this.onStatus(
      total > 0
        ? `${total.toLocaleString()} pronunciation example${total === 1 ? "" : "s"} found.`
        : "No pronunciation examples found.",
      total === 0,
    );
  }

  handleError(event) {
    const details = [];
    if (event?.code != null) details.push(String(event.code));
    if (event?.idx != null) details.push(`YouTube ${event.idx}`);
    const suffix = details.length ? ` (${details.join("; ")})` : "";
    this.onStatus(`YouGlish could not complete the request${suffix}.`, true);
  }
}
