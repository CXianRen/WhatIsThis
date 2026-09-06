// IndexedDB already separates origins; include the project base so independent
// GitHub Pages projects on the same origin do not share a wordbook.
export const DB_NAME = `aidict-wordbook:${encodeURIComponent(new URL("../../", import.meta.url).pathname)}`;
const DB_VERSION = 1;
const STORE_NAME = "entries";
const DAY = 24 * 60 * 60 * 1000;
const INTERVALS = [1, 3, 7, 14, 30, 60];
const MAX_TIMESTAMP = 8_640_000_000_000_000;

export const MAX_BACKUP_ENTRIES = 10_000;
export const QUERY_MAX_LENGTH = 160;
export const NOTE_MAX_LENGTH = 1_000;

const ACCENTS = Object.freeze({
  english: ["", "us", "uk", "aus", "ca", "ie", "sco", "nz"],
  swedish: [""],
  dutch: ["", "nl", "be"],
  french: ["", "fr", "qc", "be", "ch"],
  chinese: ["", "cn", "tw", "sg", "hk", "sh", "mo", "mn"],
});

function fail(message) {
  throw new Error(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeQuery(query) {
  if (typeof query !== "string") fail("词条必须是文字。");
  const normalized = query.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (!normalized || normalized.length > QUERY_MAX_LENGTH) {
    fail(`词条长度需为 1–${QUERY_MAX_LENGTH} 个字符。`);
  }
  return normalized;
}

function validateLanguage(language) {
  if (typeof language !== "string" || !Object.hasOwn(ACCENTS, language)) {
    fail("词条的语言不受支持。");
  }
  return language;
}

function validateAccent(language, accent) {
  validateLanguage(language);
  if (typeof accent !== "string" || !ACCENTS[language].includes(accent)) {
    fail("词条的口音与语言不匹配。");
  }
  return accent;
}

function validateNote(note) {
  if (typeof note !== "string" || note.length > NOTE_MAX_LENGTH) {
    fail(`笔记不能超过 ${NOTE_MAX_LENGTH} 个字符。`);
  }
  return note;
}

function validateTime(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_TIMESTAMP) {
    fail("词条的时间记录无效。");
  }
  return value;
}

function validateReview(review) {
  if (!isRecord(review) || !Number.isInteger(review.step) || review.step < 0 || review.step > INTERVALS.length) {
    fail("词条的复习记录无效。");
  }
  const dueAt = validateTime(review.dueAt);
  const lastReviewedAt = review.lastReviewedAt === null ? null : validateTime(review.lastReviewedAt);
  if (review.step > 0 && lastReviewedAt === null) fail("词条缺少上次复习时间。");
  return { step: review.step, dueAt, lastReviewedAt };
}

export function wordId(query, language) {
  return `${validateLanguage(language)}:${normalizeQuery(query).toLowerCase()}`;
}

export function scheduleReview(review, rating, now = Date.now()) {
  const current = validateReview(review);
  validateTime(now);
  if (rating === "again") return { step: 0, dueAt: now, lastReviewedAt: now };
  if (rating !== "familiar") fail("请选择“再练”或“熟悉”。");
  const interval = INTERVALS[Math.min(current.step, INTERVALS.length - 1)];
  return {
    step: Math.min(current.step + 1, INTERVALS.length),
    dueAt: validateTime(now + interval * DAY),
    lastReviewedAt: now,
  };
}

export function isDue(entry, now = Date.now()) {
  validateTime(now);
  return validateReview(entry.review).dueAt <= now;
}

export function createReviewSession(entries, now = Date.now(), limit = 8) {
  validateTime(now);
  if (!Array.isArray(entries)) fail("词本数据无效。");
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) fail("每轮最多复习 10 个词。");
  return entries.filter((entry) => isDue(entry, now))
    .sort((a, b) => a.review.dueAt - b.review.dueAt || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .slice(0, limit);
}

// Validate and copy every field before opening an import transaction. Unknown
// fields are discarded so a backup never gains access to application state.
export function validateBackup(backup) {
  if (!isRecord(backup) || backup.format !== "aidict-wordbook" || backup.version !== 1) {
    fail("请选择 AIDICT 词本备份文件（版本 1）。");
  }
  validateTime(backup.exportedAt);
  if (!Array.isArray(backup.entries) || backup.entries.length > MAX_BACKUP_ENTRIES) {
    fail(`备份最多包含 ${MAX_BACKUP_ENTRIES} 个词条。`);
  }
  const entries = backup.entries.map((entry, index) => {
    try {
      if (!isRecord(entry)) fail("词条格式无效。");
      const query = normalizeQuery(entry.query);
      const language = validateLanguage(entry.language);
      const id = wordId(query, language);
      if (entry.id !== id) fail("词条标识与内容不匹配。");
      return {
        id,
        query,
        language,
        accent: validateAccent(language, entry.accent),
        note: validateNote(entry.note),
        createdAt: validateTime(entry.createdAt),
        updatedAt: validateTime(entry.updatedAt),
        review: validateReview(entry.review),
      };
    } catch (error) {
      fail(`备份第 ${index + 1} 个词条无效：${error.message}`);
    }
  });
  return { format: "aidict-wordbook", version: 1, exportedAt: backup.exportedAt, entries };
}

function storageError(error) {
  if (error?.name === "QuotaExceededError") return new Error("本地存储空间不足，未能保存。请先导出词本备份，再清理空间。", { cause: error });
  if (error?.name === "SecurityError" || error?.name === "NotAllowedError") {
    return new Error("浏览器禁止本地存储，请在浏览器设置中允许此网站保存数据。", { cause: error });
  }
  return new Error("词本存储操作失败，数据未确认保存。请重试或重新打开应用。", { cause: error });
}

export function openWordbook() {
  return new Promise((resolve, reject) => {
    let request;
    let settled = false;
    try {
      if (!globalThis.indexedDB) {
        reject(new Error("此浏览器不支持本地词本存储，请使用支持 IndexedDB 的浏览器。"));
        return;
      }
      request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(storageError(error));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onblocked = () => {
      settled = true;
      reject(new Error("词本更新被另一个页面占用，请关闭其他 AIDICT 页面后重试。"));
    };
    request.onerror = () => {
      settled = true;
      reject(storageError(request.error));
    };
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      resolve(createStore(request.result));
    };
  });
}

function createStore(db) {
  let closed = false;
  const close = () => {
    closed = true;
    db.close();
  };
  db.onversionchange = close;
  db.onclose = () => { closed = true; };

  // Resolve only after commit, never on an individual request's success.
  function transaction(mode, operation) {
    if (closed) return Promise.reject(new Error("词本连接已关闭，请重新打开应用。"));
    return new Promise((resolve, reject) => {
      let tx;
      let result;
      let operationError;
      try {
        tx = db.transaction(STORE_NAME, mode);
      } catch (error) {
        reject(storageError(error));
        return;
      }
      const abort = (error) => {
        operationError = error?.name === "Error" ? error : storageError(error);
        tx.abort();
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(operationError || storageError(tx.error));
      tx.onerror = () => {}; // onabort is the single failure exit.
      try {
        operation(tx.objectStore(STORE_NAME), (value) => { result = value; }, abort);
      } catch (error) {
        abort(error);
      }
    });
  }

  function mutate(id, transform) {
    return transaction("readwrite", (store, finish, abort) => {
      const request = store.get(id);
      request.onsuccess = () => {
        try {
          const entry = transform(request.result);
          if (request.result !== undefined) {
            store.put(entry);
            finish(entry);
          } else {
            const count = store.count();
            count.onsuccess = () => {
              if (count.result >= MAX_BACKUP_ENTRIES) {
                abort(new Error(`词本最多保存 ${MAX_BACKUP_ENTRIES} 个词条，请先整理词本。`));
                return;
              }
              try {
                store.add(entry);
                finish(entry);
              } catch (error) {
                abort(error);
              }
            };
          }
        } catch (error) {
          abort(error);
        }
      };
    });
  }

  return {
    close,
    list() {
      return transaction("readonly", (store, finish) => {
        const request = store.getAll();
        request.onsuccess = () => finish(request.result.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)));
      });
    },
    get(id) {
      return transaction("readonly", (store, finish) => {
        const request = store.get(id);
        request.onsuccess = () => finish(request.result);
      });
    },
    async save(input) {
      if (!isRecord(input)) fail("词条格式无效。");
      const query = normalizeQuery(input.query);
      const language = validateLanguage(input.language);
      const accent = validateAccent(language, input.accent);
      const note = input.note === undefined ? undefined : validateNote(input.note);
      const id = wordId(query, language);
      return mutate(id, (existing) => {
        const now = Date.now();
        return {
          id, query, language, accent,
          note: note ?? existing?.note ?? "",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          review: existing?.review ?? { step: 0, dueAt: now, lastReviewedAt: null },
        };
      });
    },
    remove(id) {
      return transaction("readwrite", (store, finish) => {
        const request = store.get(id);
        request.onsuccess = () => {
          store.delete(id);
          finish(request.result !== undefined);
        };
      });
    },
    async updateNote(id, note) {
      validateNote(note);
      return mutate(id, (existing) => {
        if (!existing) fail("词条已不存在，请刷新词本。");
        return { ...existing, note, updatedAt: Date.now() };
      });
    },
    grade(id, rating, now = Date.now()) {
      return mutate(id, (existing) => {
        if (!existing) fail("词条已不存在，请刷新词本。");
        return { ...existing, updatedAt: now, review: scheduleReview(existing.review, rating, now) };
      });
    },
    async importBackup(backup) {
      const { entries } = validateBackup(backup);
      return transaction("readwrite", (store, finish, abort) => {
        let added = 0;
        let skipped = 0;
        let position = 0;
        let total = 0;
        // Enqueue the next read from the previous write's success callback so
        // duplicates inside the same file see the first inserted entry.
        const next = () => {
          if (position === entries.length) {
            finish({ added, skipped });
            return;
          }
          const entry = entries[position++];
          const request = store.get(entry.id);
          request.onsuccess = () => {
            try {
              if (request.result !== undefined) {
                skipped += 1;
                next();
              } else {
                if (total >= MAX_BACKUP_ENTRIES) {
                  fail(`导入后词本超过 ${MAX_BACKUP_ENTRIES} 个词条，未导入任何内容。请先整理词本。`);
                }
                const insert = store.add(entry);
                insert.onsuccess = () => {
                  added += 1;
                  total += 1;
                  next();
                };
              }
            } catch (error) {
              abort(error);
            }
          };
        };
        const count = store.count();
        count.onsuccess = () => {
          total = count.result;
          next();
        };
      });
    },
    async exportBackup() {
      return {
        format: "aidict-wordbook",
        version: 1,
        exportedAt: Date.now(),
        entries: await this.list(),
      };
    },
  };
}
