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

export const PLAYER_STATE = Object.freeze({
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
});

export default class YouGlishPlayer {
  constructor({
    container,
    components = 8,
    autoStart = 0,
    onStatus = () => {},
    onFetch = () => {},
    onTrackChange = () => {},
    onStateChange = () => {},
    onSpeedChange = () => {},
    onReady = () => {},
  }) {
    this.container = container;
    this.components = components;
    this.autoStart = autoStart;
    this.onStatus = onStatus;
    this.onFetch = onFetch;
    this.onTrackChange = onTrackChange;
    this.onStateChange = onStateChange;
    this.onSpeedChange = onSpeedChange;
    this.onReady = onReady;
    this.widget = null;
    this.isReady = false;
    this.totalResults = 0;
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
          onVideoChange: guard((event) => this.handleVideoChange(event)),
          onPlayerReady: guard(() => this.handlePlayerReady()),
          onPlayerStateChange: guard((event) => this.handleStateChange(event)),
          onSpeedChange: guard((event) => this.handleSpeedChange(event)),
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

  play() {
    return this.runCommand("play", () => this.widget.play());
  }

  close() {
    // Cancel this consumer without interrupting another player's shared SDK load.
    this.generation += 1;
    const widget = this.widget;
    this.widget = null;
    this.readyPromise = null;
    this.pendingSearch = null;
    this.isReady = false;
    this.totalResults = 0;
    try {
      widget?.close();
    } catch {
      // Removing the iframe also stops playback if the provider close call fails.
    } finally {
      this.container.replaceChildren();
    }
  }

  pause() {
    return this.runCommand("pause", () => this.widget.pause());
  }

  replay() {
    return this.runCommand("replay", () => this.widget.replay());
  }

  next() {
    return this.runCommand("next example", () => this.widget.next());
  }

  previous() {
    return this.runCommand("previous example", () => this.widget.previous());
  }

  move(seconds) {
    return this.runCommand("seek", () => this.widget.move(seconds));
  }

  setSpeed(speed) {
    return this.runCommand("change speed", () => this.widget.setSpeed(speed));
  }

  runPendingSearch() {
    if (!this.widget || !this.pendingSearch) return;

    const { query, language, accent } = this.pendingSearch;
    this.pendingSearch = null;
    this.totalResults = 0;
    // A successful new search can reuse the player without another onPlayerReady event.
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

  runCommand(label, command) {
    if (!this.widget || !this.isReady || this.totalResults === 0) return false;

    try {
      command();
      return true;
    } catch (error) {
      this.onStatus(`Could not ${label}: ${error.message}`, true);
      return false;
    }
  }

  handleFetchDone(event) {
    const generation = this.generation;
    const total = Number(event?.totalResult || 0);
    this.totalResults = total;
    if (total === 0) this.isReady = false;
    this.onFetch({ total, query: event?.query || "", language: event?.lang || "" });
    if (generation !== this.generation) return;
    this.onStatus(
      total > 0
        ? `${total.toLocaleString()} pronunciation example${total === 1 ? "" : "s"} found.`
        : "No pronunciation examples found.",
      total === 0,
    );
  }

  handleVideoChange(event) {
    this.onTrackChange({
      trackNumber: Number(event?.trackNumber || 0),
      videoId: event?.video || "",
    });
  }

  handlePlayerReady() {
    this.isReady = true;
    this.onReady();
  }

  handleStateChange(event) {
    this.onStateChange(Number(event?.state ?? PLAYER_STATE.UNSTARTED));
  }

  handleSpeedChange(event) {
    this.onSpeedChange(Number(event?.speed || 1));
  }

  handleError(event) {
    const details = [];
    if (event?.code != null) details.push(String(event.code));
    if (event?.idx != null) details.push(`YouTube ${event.idx}`);
    const suffix = details.length ? ` (${details.join("; ")})` : "";
    this.onStatus(`YouGlish could not complete the request${suffix}.`, true);
  }
}
