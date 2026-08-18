const SCRIPT_URL = "https://youglish.com/public/emb/widget.js";

export default class YouGlishPlayer {
  constructor({ container, onStatus }) {
    this.container = container;
    this.onStatus = onStatus;
    this.widget = null;
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

          this.widget = new window.YG.Widget(this.container, {
            components: 92,
            autoStart: 0,
            videoQuality: "small",
            events: {
              onFetchDone: (event) => this.handleFetchDone(event),
              onPlayerReady: () => this.onStatus("Player ready."),
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

      const previousReadyHandler = window.onYouglishAPIReady;
      window.onYouglishAPIReady = () => {
        if (typeof previousReadyHandler === "function") previousReadyHandler();
        createWidget();
      };

      const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
      if (existingScript) return;

      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.charset = "utf-8";
      script.addEventListener("error", () => {
        const error = new Error("Could not load YouGlish. Check your connection and try again.");
        reject(error);
        this.onStatus(error.message, true);
      });
      document.head.appendChild(script);
    });

    return this.readyPromise;
  }

  search(query, language) {
    this.pendingSearch = { query, language };

    if (!this.widget) {
      this.onStatus("Loading YouGlish…");
      this.init().catch(() => {});
      return;
    }

    this.runPendingSearch();
  }

  runPendingSearch() {
    if (!this.widget || !this.pendingSearch) return;

    const { query, language } = this.pendingSearch;
    this.pendingSearch = null;
    this.onStatus(`Searching for “${query}”…`);

    try {
      this.widget.fetch(query, language);
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
    const code = event?.code ? ` (${event.code})` : "";
    this.onStatus(`YouGlish could not complete the search${code}.`, true);
  }
}
