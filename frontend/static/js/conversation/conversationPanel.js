// ConversationPanel.js
export default class ConversationPanel {
  constructor(container) {
    this.container = container;
    this.mounted = false;

    this.sessionId = null;
    this.wordsState = { all: [], used: [], unused: [] };
  }

  mount() {
    if (this.mounted) return;
    this.mounted = true;
    this.render();
    this.bindEvents();
  }

  unmount() {
    if (!this.mounted) return;
    this.mounted = false;
    this.container.innerHTML = "";
  }

  render() {
    this.container.innerHTML = `
      <div class="conversation-panel shell">
        <header>
          <h1>🗣️ Conversational Practice</h1>
          <span class="pill">AI-driven</span>
        </header>
        <main>
          <section>
            <div class="chat"></div>
            <div class="composer">
              <input class="msg" placeholder="Type or dictate your message…"/>
              <button class="btn-mic" title="Dictate (optional)">🎙️</button>
              <button class="btn-send">Send</button>
            </div>
          </section>
          <aside>
            <div class="row">
              <label class="muted">Who starts?</label>
              <select class="starter">
                <option value="ai">AI starts</option>
                <option value="me">I start</option>
              </select>
            </div>
            <div class="row">
              <label class="muted">Level</label>
              <select class="cefr">
                <option>A1</option><option selected>A2</option>
                <option>B1</option><option>B2</option>
                <option>C1</option><option>C2</option>
              </select>
            </div>
            <div class="row">
              <button class="btn-begin small">Begin Session</button>
              <button class="btn-themes small">List Saved Themes</button>
            </div>
            <div class="section">
              <div class="muted">Tip: say “new theme” to create one, or reply with a theme ID.</div>
            </div>
            <div class="section wordsPanel">
              <h3>Theme words</h3>
              <div class="words-chips chips"></div>
              <div class="words-legend legend"></div>
            </div>
          </aside>
        </main>
      </div>
    `;

    // refs
    this.chatEl = this.container.querySelector(".chat");
    this.msgEl = this.container.querySelector(".msg");
    this.btnSend = this.container.querySelector(".btn-send");
    this.btnMic = this.container.querySelector(".btn-mic");
    this.btnBegin = this.container.querySelector(".btn-begin");
    this.btnThemes = this.container.querySelector(".btn-themes");
    this.starterSel = this.container.querySelector(".starter");
    this.cefrSel = this.container.querySelector(".cefr");
    this.wordsChips = this.container.querySelector(".words-chips");
    this.wordsLegend = this.container.querySelector(".words-legend");
  }

  bindEvents() {
    this.btnBegin.addEventListener("click", () => this.startSession());
    this.btnSend.addEventListener("click", () => this.sendMessage());
    this.btnThemes.addEventListener("click", () => this.listThemes());
    this.btnMic.addEventListener("click", () => this.startDictation());
  }

  /* UI helpers */
  addBubble(text, who) {
    const b = document.createElement("div");
    b.className = "bubble " + (who === "ai" ? "ai" : "me");
    b.textContent = text;
    this.chatEl.appendChild(b);
    this.chatEl.scrollTop = this.chatEl.scrollHeight;
  }

  showTyping() {
    if (this.pendingBubble) return;
    const b = document.createElement("div");
    b.className = "bubble ai typing";
    b.innerHTML = '<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
    this.chatEl.appendChild(b);
    this.chatEl.scrollTop = this.chatEl.scrollHeight;
    this.pendingBubble = b;
  }

  replaceTypingWith(text) {
    if (this.pendingBubble) {
      this.pendingBubble.classList.remove("typing");
      this.pendingBubble.textContent = text || "";
      this.pendingBubble = null;
    } else {
      this.addBubble(text || "", "ai");
    }
  }

  renderWords(progress) {
    if (!progress) return;
    const all = progress.words_all || this.wordsState.all;
    const unused = progress.words_unused ?? this.wordsState.unused;
    const used = progress.words_used || all.filter(w => !unused.includes(w));
    this.wordsState = { all, used, unused };

    this.wordsChips.innerHTML = "";
    all.forEach(w => {
      const span = document.createElement("span");
      span.className = "chip " + (used.includes(w) ? "used" : "unused");
      span.textContent = w;
      this.wordsChips.appendChild(span);
    });
    this.wordsLegend.textContent = `${used.length}/${all.length} used`;
  }

  /* API helpers */
  async postJSON(url, data) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  /* Core logic */
  async startSession() {
    this.chatEl.innerHTML = "";
    this.wordsState = { all: [], used: [], unused: [] };
    this.wordsChips.innerHTML = "";
    this.wordsLegend.textContent = "";

    const starter = this.starterSel.value;
    const cefr = this.cefrSel.value;
    const res = await this.postJSON("/api/conversation/start", { starter, cefr });
    this.sessionId = res.session_id;
    if (res.ai_text) this.addBubble(res.ai_text, "ai");
    this.renderWords(res.progress);
  }

  async sendMessage() {
    if (!this.sessionId) {
      alert("Start a session first");
      return;
    }
    const text = this.msgEl.value.trim();
    if (!text) return;
    this.addBubble(text, "me");
    this.msgEl.value = "";

    this.showTyping();
    try {
      const r = await this.postJSON("/api/conversation/turn", {
        session_id: this.sessionId,
        user_text: text,
      });
      this.replaceTypingWith(r.ai_text || "[no response]");
      this.renderWords(r.progress);
    } catch (err) {
      this.replaceTypingWith("… failed to respond. Please try again.");
    }
  }

  async listThemes() {
    const r = await fetch("/api/themes");
    const data = await r.json();
    if (data.length === 0) {
      this.addBubble("No saved themes yet. Say “new theme”.", "ai");
      return;
    }
    const lines = data
      .map(t => `[${t.id}] ${t.name} (${t.target_lang})`)
      .join("\n");
    this.addBubble("Saved themes:\n" + lines + "\nReply with an ID to pick one.", "ai");
  }

  /* Dictation */
  startDictation() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Browser speech recognition not available here.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      this.msgEl.value = t;
    };
    recognition.start();
  }
}
