const SCRIPT_URL = "https://youglish.com/public/emb/widget.js";

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
    onStatus = () => {},
    onFetch = () => {},
    onTrackChange = () => {},
    onStateChange = () => {},
    onSpeedChange = () => {},
    onReady = () => {},
  }) {
    this.container = container;
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
  }

  init() {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise((resolve, reject) => {
      const createWidget = () => {
        try {
          if (!window.YG?.Widget) {
            throw new Error("YouGlish API is unavailable.");
          }

          // YouGlish replaces its mount node. Keep our outer layout container intact.
          const mount = document.createElement("div");
          mount.id = `${this.container.id}-player`;
          this.container.replaceChildren(mount);
          this.widget = new window.YG.Widget(mount, {
            components: 8,
            autoStart: 0,
            videoQuality: "small",
            backgroundColor: "#171a17",
            textColor: "#f5f2eb",
            captionColor: "#f5f2eb",
            markerColor: "#b8e0c8",
            keywordColor: "#b8e0c8",
            captionSize: 28,
            events: {
              onFetchDone: (event) => this.handleFetchDone(event),
              onVideoChange: (event) => this.handleVideoChange(event),
              onPlayerReady: () => this.handlePlayerReady(),
              onPlayerStateChange: (event) => this.handleStateChange(event),
              onSpeedChange: (event) => this.handleSpeedChange(event),
              onError: (event) => this.handleError(event),
            },
          });

          resolve();
          this.runPendingSearch();
        } catch (error) {
          reject(error);
          this.onStatus(error.message, true);
        }
      };

      if (window.YG?.Widget) {
        createWidget();
        return;
      }

      window.onYouglishAPIReady = createWidget;

      const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
      if (existingScript) return;

      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.charset = "utf-8";
      script.addEventListener("error", () => {
        const error = new Error("Could not load YouGlish. Check your connection and try again.");
        script.remove();
        reject(error);
        this.onStatus(error.message, true);
      });
      document.head.appendChild(script);
    }).catch((error) => {
      this.readyPromise = null;
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
    const total = Number(event?.totalResult || 0);
    this.totalResults = total;
    if (total === 0) this.isReady = false;
    this.onFetch({ total, query: event?.query || "", language: event?.lang || "" });
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
    const code = event?.code ? ` (${event.code})` : "";
    this.onStatus(`YouGlish could not complete the request${code}.`, true);
  }
}
