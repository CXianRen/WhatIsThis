import YouGlishPlayer from "./youglish.js";
import { openWordbook, wordId, isDue, createReviewSession, scheduleReview } from "./wordbook-store.js";

const $ = (id) => document.getElementById(id);
const dateLabel = (time) => new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(time);

export function initWordbook({ languages, formatLanguage, onLookup, onLeaveSearch }) {
  let store;
  let entries = [];
  let current = null;
  let activeView = "search";
  let pending = false;
  let loading = false;
  let storageError = "";
  let session = null;
  let reviewPlayer = null;
  let editing = null;
  let toastTimer;
  let refreshNumber = 0;
  const favorite = $("favorite-button");
  const dialog = $("note-dialog");

  function message(id, text = "", error = false) {
    $(id).textContent = text;
    $(id).classList.toggle("is-error", error);
  }

  function toast(text) {
    clearTimeout(toastTimer);
    $("toast").textContent = text;
    $("toast").hidden = false;
    toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4500);
  }

  function updateFavorite() {
    const saved = current && entries.some((entry) => entry.id === wordId(current.query, current.language));
    favorite.hidden = !current;
    favorite.disabled = !store || pending;
    favorite.textContent = saved ? "★" : "☆";
    favorite.setAttribute("aria-pressed", String(Boolean(saved)));
    favorite.setAttribute("aria-label", saved ? "取消收藏当前词" : "收藏当前词");
  }

  function setPending(value) {
    pending = value;
    updateFavorite();
    for (const id of ["export-book", "import-book", "grade-again", "grade-familiar", "save-note", "remove-word"]) {
      $(id).disabled = value || !store;
    }
    $("end-review").disabled = value;
    $("close-note").disabled = value;
    $("start-review").disabled = value || !store || !entries.some((entry) => isDue(entry));
  }

  async function refresh() {
    if (!store) return;
    const number = ++refreshNumber;
    const result = await store.list();
    if (number !== refreshNumber) return;
    entries = result;
    if (session) {
      const previous = session.queue[0];
      const available = new Map(entries.map((entry) => [entry.id, entry]));
      session.queue = session.queue.map((entry) => available.get(entry.id))
        .filter((entry) => entry && isDue(entry));
      session.total = session.familiar + session.queue.length;
      if (session.queue.length === 0) {
        finishReview();
      } else if (JSON.stringify(previous) !== JSON.stringify(session.queue[0])) {
        renderReviewCard();
      }
    }
    renderList();
    updateFavorite();
  }

  async function connect() {
    if (loading) return;
    loading = true;
    $("retry-storage").hidden = true;
    message("book-status", "正在读取词本…");
    try {
      store = await openWordbook();
      storageError = "";
      await refresh();
    } catch (error) {
      store?.close();
      store = null;
      storageError = `${error.message} 查词仍可使用。`;
      message("book-status", storageError, true);
      $("retry-storage").hidden = false;
      toast(storageError);
    } finally {
      loading = false;
      setPending(false);
    }
  }

  function renderList() {
    const now = Date.now();
    const due = entries.filter((entry) => isDue(entry, now)).length;
    $("book-count").textContent = `${entries.length} 个词`;
    $("due-count").textContent = `今日复习 · ${due}`;
    $("start-review").disabled = !store || pending || due === 0;
    const filter = $("book-filter").value.trim().toLowerCase();
    const visible = entries.filter((entry) => `${entry.query}\n${entry.note}`.toLowerCase().includes(filter));
    const fragment = document.createDocumentFragment();
    for (const entry of visible) {
      const row = document.createElement("li");
      row.className = "word-row";
      row.dataset.id = entry.id;
      const lookup = document.createElement("button");
      lookup.type = "button";
      lookup.className = "word-lookup";
      lookup.setAttribute("aria-label", `查词：${entry.query}，${formatLanguage(entry.language, entry.accent)}`);
      const title = document.createElement("strong");
      title.textContent = entry.query;
      const meta = document.createElement("span");
      meta.className = "word-meta";
      meta.textContent = formatLanguage(entry.language, entry.accent);
      lookup.append(title, meta);
      if (entry.note) {
        const note = document.createElement("span");
        note.className = "word-note-preview";
        note.textContent = entry.note;
        lookup.append(note);
      }
      lookup.addEventListener("click", () => {
        showView("search");
        onLookup(entry);
      });
      const side = document.createElement("div");
      side.className = "word-row-side";
      const dueLabel = document.createElement("span");
      dueLabel.className = `due-label${isDue(entry, now) ? " is-due" : ""}`;
      dueLabel.textContent = isDue(entry, now) ? "待复习" : dateLabel(entry.review.dueAt);
      const edit = document.createElement("button");
      edit.className = "edit-word";
      edit.type = "button";
      edit.textContent = "笔记";
      edit.setAttribute("aria-label", `编辑 ${entry.query} 的笔记和口音`);
      edit.addEventListener("click", () => openNote(entry));
      side.append(dueLabel, edit);
      row.append(lookup, side);
      fragment.append(row);
    }
    $("word-list").replaceChildren(fragment);
    message("book-status", storageError || (entries.length === 0
      ? "还没有收藏，在查词结果右侧点 ☆ 即可添加。"
      : visible.length === 0 ? "没有找到匹配的词或笔记。" : ""), Boolean(storageError));
  }

  function stopReviewVideo() {
    reviewPlayer?.close();
    reviewPlayer = null;
    $("review-widget").hidden = true;
    $("review-provider").hidden = true;
    $("listen-example").disabled = false;
    $("listen-example").textContent = "听例句";
    message("review-player-status");
  }

  function showView(view) {
    if (view === activeView) return;
    if (activeView === "search") onLeaveSearch();
    else stopReviewVideo();
    activeView = view;
    $("search-view").hidden = view !== "search";
    $("wordbook-view").hidden = view !== "wordbook";
    // Language and accent apply to lookup; review uses each word's saved accent.
    document.querySelector(".locale-controls").hidden = view !== "search";
    for (const name of ["search", "wordbook"]) {
      if (name === view) $(`nav-${name}`).setAttribute("aria-current", "page");
      else $(`nav-${name}`).removeAttribute("aria-current");
    }
    if (view === "wordbook") refresh().catch((error) => toast(error.message));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  favorite.addEventListener("click", async () => {
    if (!current || !store || pending) return;
    const selected = { ...current };
    const id = wordId(selected.query, selected.language);
    setPending(true);
    try {
      if (await store.get(id)) {
        await store.remove(id);
        toast(`已取消收藏「${selected.query}」`);
      } else {
        await store.save(selected);
        toast(`已收藏「${selected.query}」，可在词本添加笔记。`);
        navigator.storage?.persist?.().catch(() => {});
      }
      await refresh();
    } catch (error) {
      toast(error.message);
    } finally {
      setPending(false);
    }
  });

  function openNote(entry) {
    if (pending) return;
    editing = entry;
    $("note-title").textContent = entry.query;
    $("note-language").textContent = languages[entry.language].label;
    $("word-note").value = entry.note;
    message("note-status");
    const options = languages[entry.language].accents;
    $("note-accents").hidden = options.length < 2;
    $("note-accent-options").replaceChildren();
    for (const option of options) {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "saved-accent";
      radio.value = option.code;
      radio.checked = option.code === entry.accent;
      const text = document.createElement("span");
      text.textContent = option.label;
      label.append(radio, text);
      $("note-accent-options").append(label);
    }
    dialog.showModal();
    $("word-note").focus({ preventScroll: true });
  }

  $("note-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!editing || pending) return;
    setPending(true);
    try {
      const accent = dialog.querySelector('input[name="saved-accent"]:checked')?.value || "";
      await store.save({ query: editing.query, language: editing.language, accent, note: $("word-note").value });
      await refresh();
      dialog.close();
      toast("笔记和口音已保存。");
    } catch (error) {
      message("note-status", error.message, true);
    } finally {
      setPending(false);
    }
  });
  $("remove-word").addEventListener("click", async () => {
    if (!editing || pending) return;
    setPending(true);
    try {
      await store.remove(editing.id);
      await refresh();
      dialog.close();
      toast("已取消收藏。");
    } catch (error) {
      message("note-status", error.message, true);
    } finally {
      setPending(false);
    }
  });
  $("close-note").addEventListener("click", () => { if (!pending) dialog.close(); });
  dialog.addEventListener("cancel", (event) => { if (pending) event.preventDefault(); });
  dialog.addEventListener("close", () => { editing = null; });

  $("start-review").addEventListener("click", async () => {
    if (!store || pending) return;
    setPending(true);
    try {
      await refresh();
      const queue = createReviewSession(entries);
      if (!queue.length) { toast("今天的复习已完成。"); return; }
      session = { queue, total: queue.length, familiar: 0 };
      $("book-home").hidden = true;
      $("review-view").hidden = false;
      renderReviewCard();
    } catch (error) {
      toast(error.message);
    } finally {
      setPending(false);
    }
  });

  function renderReviewCard() {
    stopReviewVideo();
    const entry = session.queue[0];
    $("review-word").textContent = entry.query;
    $("review-language").textContent = formatLanguage(entry.language, entry.accent);
    $("review-progress").textContent = `已熟悉 ${session.familiar} / ${session.total}`;
    $("review-note").hidden = !entry.note;
    $("review-note").open = false;
    $("review-note-text").textContent = entry.note;
    const next = scheduleReview(entry.review, "familiar", Date.now());
    $("next-review-label").textContent = `${dateLabel(next.dueAt)}再复习`;
    message("review-status", navigator.onLine === false ? "当前离线，可以继续文字复习。" : "");
    $("review-word").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function grade(rating) {
    if (!session || pending) return;
    const entry = session.queue[0];
    setPending(true);
    try {
      const saved = await store.grade(entry.id, rating);
      session.queue.shift();
      if (rating === "again") session.queue.splice(Math.min(2, session.queue.length), 0, saved);
      else session.familiar += 1;
      if (!session.queue.length) {
        const count = session.total;
        finishReview();
        toast(`本轮 ${count} 个词已完成，复习进度已保存。`);
      } else {
        renderReviewCard();
        if (rating === "again") message("review-status", `「${entry.query}」已安排在本轮再次练习。`);
      }
      await refresh();
    } catch (error) {
      message("review-status", error.message, true);
    } finally {
      setPending(false);
    }
  }

  function finishReview() {
    stopReviewVideo();
    session = null;
    $("review-view").hidden = true;
    $("book-home").hidden = false;
    renderList();
    $("start-review").focus({ preventScroll: true });
  }

  $("listen-example").addEventListener("click", () => {
    if (!session) return;
    if (navigator.onLine === false) {
      message("review-player-status", "听例句需要联网，你仍可继续文字复习。");
      return;
    }
    stopReviewVideo();
    const entry = session.queue[0];
    $("review-widget").hidden = false;
    $("review-provider").hidden = false;
    $("listen-example").textContent = "重新加载例句";
    message("review-player-status", "正在加载例句…");
    reviewPlayer = new YouGlishPlayer({
      container: $("review-widget"), components: 88, autoStart: 1,
      onStatus: (text, error) => {
        message("review-player-status", text, error);
        if (error && !$("review-widget").querySelector("iframe")) $("review-widget").hidden = true;
      },
      onReady: () => message("review-player-status", "若未自动播放，请点视频中的播放按钮。"),
    });
    reviewPlayer.search(entry.query, entry.language, entry.accent);
  });

  $("grade-again").addEventListener("click", () => grade("again"));
  $("grade-familiar").addEventListener("click", () => grade("familiar"));
  $("end-review").addEventListener("click", () => {
    if (pending) return;
    finishReview();
    toast("已保存完成的复习，剩余词下次继续。");
  });
  $("nav-search").addEventListener("click", () => showView("search"));
  $("nav-wordbook").addEventListener("click", () => showView("wordbook"));
  $("book-filter").addEventListener("input", renderList);
  $("retry-storage").addEventListener("click", connect);

  $("export-book").addEventListener("click", async () => {
    if (!store || pending) return;
    setPending(true);
    try {
      const backup = await store.exportBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `aidict-wordbook-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      message("backup-status", `已生成 ${backup.entries.length} 个词的备份，请保存下载文件。`);
    } catch (error) {
      message("backup-status", error.message, true);
    } finally { setPending(false); }
  });
  $("import-book").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async () => {
    const file = $("import-file").files[0];
    $("import-file").value = "";
    if (!file || !store || pending) return;
    setPending(true);
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error("备份文件过大（最多 100 MB）。");
      let parsed;
      try { parsed = JSON.parse(await file.text()); }
      catch { throw new Error("无法读取备份，请选择 AIDict 导出的 JSON 文件。"); }
      const result = await store.importBackup(parsed);
      await refresh();
      message("backup-status", `已导入 ${result.added} 个词，跳过 ${result.skipped} 个重复词。已有笔记和进度已保留。`);
    } catch (error) {
      message("backup-status", error.message, true);
    } finally { setPending(false); }
  });

  window.addEventListener("aidict:before-update", (event) => {
    if (pending || dialog.open) {
      event.preventDefault();
      toast(pending ? "正在保存，请稍后更新。" : "请先保存或关闭笔记，再更新应用。");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Stop a delayed autoplay request as well as an already playing review.
      stopReviewVideo();
    } else if (!pending && !dialog.open) {
      refresh().catch((error) => toast(error.message));
    }
  });
  // Refresh due counts across midnight or after another window changes the book.
  setInterval(() => {
    if (activeView === "wordbook" && !session && !pending && !dialog.open && !document.hidden) {
      refresh().catch(() => {});
    }
  }, 60000);
  connect();
  return {
    setCurrent(entry) { current = entry; updateFavorite(); },
  };
}
