import test from "node:test";
import assert from "node:assert/strict";
import {
  DB_NAME,
  wordId,
  scheduleReview,
  isDue,
  createReviewSession,
  validateBackup,
  openWordbook,
} from "../static/js/wordbook-store.js";

const NOW = Date.UTC(2026, 8, 6);
const DAY = 86_400_000;

function entry(query = "Apple", overrides = {}) {
  return {
    id: wordId(query, "english"),
    query,
    language: "english",
    accent: "uk",
    note: "Try saying this first.",
    createdAt: NOW - DAY,
    updatedAt: NOW - DAY,
    review: { step: 0, dueAt: NOW - DAY, lastReviewedAt: null },
    ...overrides,
  };
}

function backup(entries = [entry()]) {
  return { format: "aidict-wordbook", version: 1, exportedAt: NOW, entries };
}

test("database identity stays stable when a module version query changes", async () => {
  const versioned = await import("../static/js/wordbook-store.js?version=next");
  assert.equal(versioned.DB_NAME, DB_NAME);
  assert.equal(validateBackup(backup()).format, "aidict-wordbook");
});

test("word IDs ignore casing, surrounding/repeated whitespace, and Unicode composition", () => {
  assert.equal(wordId("  APPLE \n pie  ", "english"), wordId("apple pie", "english"));
  assert.equal(wordId("cafe\u0301", "french"), wordId("CAFÉ", "french"));
  assert.notEqual(wordId("chat", "english"), wordId("chat", "french"));
  assert.throws(() => wordId(" ", "english"));
  assert.throws(() => wordId("apple", "constructor"));
  assert.throws(() => wordId("x".repeat(161), "english"));
});

test("familiar expands intervals up to 60 days; again resets progress without mutating input", () => {
  const original = Object.freeze({ step: 0, dueAt: NOW, lastReviewedAt: null });
  let review = original;
  const expectedDays = [1, 3, 7, 14, 30, 60, 60];
  for (const [index, days] of expectedDays.entries()) {
    review = scheduleReview(review, "familiar", NOW);
    assert.equal(review.dueAt, NOW + days * DAY);
    assert.equal(review.step, Math.min(index + 1, 6));
    assert.equal(review.lastReviewedAt, NOW);
  }
  assert.deepEqual(original, { step: 0, dueAt: NOW, lastReviewedAt: null });
  assert.deepEqual(scheduleReview(review, "again", NOW), { step: 0, dueAt: NOW, lastReviewedAt: NOW });
  assert.equal(scheduleReview(scheduleReview(review, "again", NOW), "familiar", NOW).dueAt, NOW + DAY);
  assert.throws(() => scheduleReview(review, "unknown", NOW));
  assert.throws(() => scheduleReview(review, "familiar", NaN));
});

test("a session selects the oldest due words, caps the round, and never mutates the list", () => {
  const entries = Array.from({ length: 12 }, (_, index) => entry(`word ${index}`, {
    review: { step: 0, dueAt: NOW - index * DAY, lastReviewedAt: null },
  }));
  entries.push(entry("future", { review: { step: 1, dueAt: NOW + DAY, lastReviewedAt: NOW } }));
  const before = structuredClone(entries);
  const session = createReviewSession(entries, NOW);
  assert.equal(session.length, 8);
  assert.equal(session[0].query, "word 11");
  assert.equal(session.at(-1).query, "word 4");
  assert.deepEqual(entries, before);
  assert.equal(createReviewSession(entries, NOW, 10).length, 10);
  assert.equal(createReviewSession(entries.slice(0, 2), NOW).length, 2);
  assert.deepEqual(createReviewSession([entries.at(-1)], NOW), []);
  assert.equal(isDue(entry("now", { review: { step: 0, dueAt: NOW, lastReviewedAt: null } }), NOW), true);
  assert.throws(() => createReviewSession(entries, NOW, 11));
});

test("backup survives JSON roundtrip, keeps notes/progress, and drops unrecognized fields", () => {
  const original = backup([entry("Café", {
    id: wordId("Café", "french"), language: "french", accent: "qc",
    note: "<script>this is only text</script>\n☕",
    review: { step: 3, dueAt: NOW + 7 * DAY, lastReviewedAt: NOW },
  })]);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(original))), original);
  const extra = JSON.parse(JSON.stringify(original));
  extra.entries[0].unknown = "ignored";
  assert.deepEqual(validateBackup(extra), original);
  assert.deepEqual(validateBackup(backup([])).entries, []);
});

test("backup rejects malformed fields anywhere in the file before import can start", () => {
  const corrupt = [
    { id: "english:another-word" },
    { query: "" },
    { language: "german" },
    { accent: "qc" },
    { note: 42 },
    { note: "a".repeat(1001) },
    { createdAt: -1 },
    { updatedAt: "yesterday" },
    { review: { step: 7, dueAt: NOW, lastReviewedAt: NOW } },
    { review: { step: 0, dueAt: null, lastReviewedAt: null } },
    { review: { step: 1, dueAt: NOW, lastReviewedAt: null } },
    { review: { step: 0, dueAt: NOW } },
  ];
  for (const fields of corrupt) {
    assert.throws(() => validateBackup(backup([entry(), entry("next", fields)])), /第 2 个词条/);
  }
  for (const value of [null, [], {}, { ...backup(), version: 2 }, { ...backup(), exportedAt: null }]) {
    assert.throws(() => validateBackup(value));
  }
  assert.throws(() => validateBackup(backup(Array(10001).fill(entry()))), /10000/);
});

test("all current app languages and their supported accents can be backed up", () => {
  const locales = {
    english: ["", "us", "uk", "aus", "ca", "ie", "sco", "nz"],
    swedish: [""], dutch: ["", "nl", "be"], french: ["", "fr", "qc", "be", "ch"],
    chinese: ["", "cn", "tw", "sg", "hk", "sh", "mo", "mn"],
  };
  for (const [language, accents] of Object.entries(locales)) {
    for (const accent of accents) {
      const item = entry("sample", { id: wordId("sample", language), language, accent });
      assert.deepEqual(validateBackup(backup([item])).entries[0], item);
    }
  }
});

test("missing browser storage reports an explicit failure", async () => {
  // Node intentionally has no IndexedDB; integration tests run in a browser.
  if (globalThis.indexedDB) return;
  await assert.rejects(openWordbook(), /不支持本地词本存储/);
});
