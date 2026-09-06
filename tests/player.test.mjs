import assert from "node:assert/strict";
import { test } from "node:test";

let moduleId = 0;

async function setup(t) {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const widgets = [];
  class Element extends EventTarget {
    constructor(tagName, id = "") {
      super();
      this.tagName = tagName;
      this.id = id;
      this.children = [];
      this.parent = null;
    }
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
    }
    replaceChildren(...children) {
      this.children.forEach((child) => { child.parent = null; });
      this.children = [];
      children.forEach((child) => this.appendChild(child));
    }
    remove() {
      if (this.parent) {
        this.parent.children = this.parent.children.filter((child) => child !== this);
        this.parent = null;
      }
    }
  }
  const head = new Element("head");
  globalThis.window = {};
  globalThis.document = {
    head,
    createElement: (tagName) => new Element(tagName),
    querySelector: () => head.children.find((child) => child.tagName === "script") || null,
  };
  class Widget {
    constructor(mount, options) {
      this.id = mount.id;
      this.options = options;
      this.calls = [];
      this.container = mount.parent;
      this.container.replaceChildren(new Element("iframe"));
      widgets.push(this);
    }
    fetch(...args) { this.calls.push(["fetch", ...args]); }
    play() { this.calls.push(["play"]); }
    close() { this.calls.push(["close"]); }
    emit(name, data) { this.options.events[name](data); }
  }
  const { default: Player } = await import(`../static/js/youglish.js?test=${++moduleId}`);
  t.after(() => {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  });
  return {
    Player, widgets, head,
    container: (id = "player") => new Element("div", id),
    readySDK() {
      window.YG = { Widget };
      window.onYouglishAPIReady?.();
    },
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("two players share SDK load and retain their playback options", async (t) => {
  const env = await setup(t);
  const search = new env.Player({ container: env.container("search") });
  const review = new env.Player({ container: env.container("review"), components: 88, autoStart: 1 });
  search.search("apple", "english");
  search.search("pear", "english", "uk");
  review.search("bonjour", "french");
  assert.equal(env.head.children.length, 1);
  env.readySDK();
  await flush();
  assert.equal(env.widgets.length, 2);
  assert.deepEqual(env.widgets[0].calls, [["fetch", "pear", "english", "uk"]]);
  assert.equal(env.widgets[0].options.components, 8);
  assert.equal(env.widgets[0].options.autoStart, 0);
  assert.equal(env.widgets[1].options.components, 88);
  assert.equal(env.widgets[1].options.autoStart, 1);
  assert.notEqual(env.widgets[0].id, env.widgets[1].id);
  search.close();
  review.close();
});

test("closing a loading player cancels its search without cancelling another player", async (t) => {
  const env = await setup(t);
  const container = env.container();
  const status = [];
  const closed = new env.Player({ container, onStatus: (...args) => status.push(args) });
  const active = new env.Player({ container: env.container("review") });
  closed.search("old", "english");
  active.search("new", "english");
  closed.close();
  const count = status.length;
  env.readySDK();
  await flush();
  assert.equal(env.widgets.length, 1);
  assert.equal(container.children.length, 0);
  assert.equal(status.length, count);
  assert.deepEqual(env.widgets[0].calls, [["fetch", "new", "english"]]);
  closed.search("reopened", "english");
  await flush();
  assert.equal(env.widgets.length, 2);
  assert.deepEqual(env.widgets[1].calls, [["fetch", "reopened", "english"]]);
  closed.close();
  active.close();
});

test("close before ready removes the iframe and ignores stale events after reopening", async (t) => {
  const env = await setup(t);
  env.readySDK();
  const container = env.container();
  const events = [];
  const player = new env.Player({
    container,
    onStatus: (...args) => events.push(args),
    onReady: () => events.push("ready"),
    onTrackChange: () => events.push("track"),
    onStateChange: () => events.push("state"),
  });
  player.search("apple", "english");
  await flush();
  const old = env.widgets[0];
  assert.equal(container.children.length, 1);
  player.close();
  assert.deepEqual(old.calls.at(-1), ["close"]);
  assert.equal(container.children.length, 0);
  player.search("pear", "english");
  await flush();
  assert.notEqual(old.id, env.widgets[1].id);
  const count = events.length;
  old.emit("onFetchDone", { totalResult: 100 });
  old.emit("onPlayerReady");
  old.emit("onVideoChange", { trackNumber: 2 });
  old.emit("onPlayerStateChange", { state: 1 });
  old.emit("onError", { code: 1, idx: 5 });
  assert.equal(events.length, count);
  assert.equal(player.totalResults, 0);
  assert.equal(player.isReady, false);
  player.close();
});

test("close removes the iframe even when the provider close call throws", async (t) => {
  const env = await setup(t);
  env.readySDK();
  const container = env.container();
  const player = new env.Player({ container });
  player.search("apple", "english");
  await flush();
  env.widgets[0].close = () => { throw new Error("provider failed"); };
  assert.doesNotThrow(() => player.close());
  assert.equal(container.children.length, 0);
  assert.equal(player.widget, null);
  assert.equal(player.play(), false);
  assert.doesNotThrow(() => player.close());
});

for (const failure of ["error", "timeout"]) {
  test(`SDK ${failure} permits a fresh download and successful retry`, async (t) => {
    const env = await setup(t);
    const status = [];
    const player = new env.Player({ container: env.container(), onStatus: (...args) => status.push(args) });
    if (failure === "timeout") t.mock.timers.enable({ apis: ["setTimeout"] });
    player.search("apple", "english");
    const oldScript = env.head.children[0];
    if (failure === "timeout") t.mock.timers.tick(20_000);
    else oldScript.dispatchEvent(new Event("error"));
    await flush();
    assert.equal(status.at(-1)[1], true);
    assert.equal(env.head.children.length, 0);
    assert.equal(player.readyPromise, null);
    player.search("pear", "english");
    assert.equal(env.head.children.length, 1);
    assert.notEqual(env.head.children[0], oldScript);
    env.readySDK();
    await flush();
    assert.deepEqual(env.widgets[0].calls, [["fetch", "pear", "english"]]);
    player.close();
  });
}

test("commands wait for ready and a reused ready player can search again", async (t) => {
  const env = await setup(t);
  env.readySDK();
  const player = new env.Player({ container: env.container() });
  player.search("apple", "english");
  await flush();
  const widget = env.widgets[0];
  widget.emit("onFetchDone", { totalResult: 2 });
  assert.equal(player.play(), false);
  widget.emit("onPlayerReady");
  assert.equal(player.play(), true);
  player.search("pear", "english");
  assert.equal(player.play(), false);
  widget.emit("onFetchDone", { totalResult: 1 });
  assert.equal(player.play(), true);
  widget.emit("onFetchDone", { totalResult: 0 });
  assert.equal(player.isReady, false);
  assert.equal(player.play(), false);
  player.close();
});

test("provider errors include a supplied YouTube code without skipping videos", async (t) => {
  const env = await setup(t);
  env.readySDK();
  const status = [];
  const player = new env.Player({ container: env.container(), onStatus: (...args) => status.push(args) });
  player.search("apple", "english");
  await flush();
  const widget = env.widgets[0];
  widget.emit("onError", { code: 1, idx: 5 });
  assert.match(status.at(-1)[0], /YouTube 5/);
  widget.emit("onError", { code: 2 });
  assert.doesNotMatch(status.at(-1)[0], /YouTube/);
  assert.deepEqual(widget.calls, [["fetch", "apple", "english"]]);
  player.close();
});
