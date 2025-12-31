(() => {
  const STORAGE_KEY = "hackugyo.search_prices.config.v1";
  const URL_TRUNCATE_LEN = 110;

  const clone = (obj) => {
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  };

  const isPlainObject = (v) =>
    v !== null && typeof v === "object" && (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);

  function normalizeVars(vars) {
    if (!isPlainObject(vars)) return {};
    const out = {};
    for (const [k, v] of Object.entries(vars)) {
      if (typeof k === "string" && typeof v === "string") out[k] = v;
    }
    return out;
  }

  function normalizeProviders(providers) {
    if (!Array.isArray(providers)) return [];
    const out = [];
    for (const p of providers) {
      if (!isPlainObject(p)) continue;
      if (typeof p.template !== "string" || p.template.trim() === "") continue;

      const name =
        (typeof p.name === "string" && p.name.trim() !== "") ? p.name.trim() : p.template;

      const mode = (p.mode === "buy") ? "buy" : "sell";

      const item = { name, template: p.template };
      if (mode === "buy") item.mode = "buy";
      out.push(item);
    }
    return out;
  }

  function validateDefaultConfig(raw) {
    if (!isPlainObject(raw)) throw new Error("defaultConfig.json is not an object");

    const vars = normalizeVars(raw.vars);
    const providers = normalizeProviders(raw.providers);

    if (providers.length === 0) throw new Error("defaultConfig.providers is empty (or all invalid)");

    return { vars, providers };
  }

  function mergeWithDefaults(base, stored) {
    const merged = clone(base);

    if (!isPlainObject(stored)) return merged;

    const storedVars = normalizeVars(stored.vars);
    merged.vars = { ...merged.vars, ...storedVars };

    const storedProviders = normalizeProviders(stored.providers);
    if (storedProviders.length > 0) merged.providers = storedProviders;

    return merged;
  }

  let validatedDefaultCache = null;

  async function getValidatedDefaultConfig() {
    if (validatedDefaultCache) return clone(validatedDefaultCache);

    const getter = window.SearchPrices && window.SearchPrices.getDefaultConfig;
    if (typeof getter !== "function") {
      throw new Error("defaultConfigLoader.js is not loaded (window.SearchPrices.getDefaultConfig missing)");
    }

    const raw = await getter();
    validatedDefaultCache = validateDefaultConfig(raw);
    return clone(validatedDefaultCache);
  }

  async function loadConfig() {
    const base = await getValidatedDefaultConfig();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;

      const parsed = JSON.parse(raw);
      return mergeWithDefaults(base, parsed);
    } catch (e) {
      console.warn("loadConfig failed; fallback to default", e);
      return base;
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function resetConfig() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // templateで与えられたプレースホルダを置換してURLを作る。
  // 未定義のプレ-スホルダはそのまま残す。
  function applyTemplate(template, ctx) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      if (key === "q") return ctx.q;
      if (key === "q_enc") return encodeURIComponent(ctx.q);
      if (ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, key)) return String(ctx.vars[key]);
      return "{" + key + "}";
    });
  }

  // URL はリンク先としてはフルで使い、表示だけ末尾省略する。
  function truncateForDisplay(s, maxLen = URL_TRUNCATE_LEN) {
    if (!s) return "";
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + "…";
  }

  async function renderIndex() {
    const root = document.getElementById("content");
    if (!root) return;

    root.textContent = "";

    const params = new URLSearchParams(location.search);
    const q = (params.get("query") || "").trim();

    const input = document.getElementById("queryInput");
    if (input && input.value !== q) input.value = q;

    if (!q) {
      const p = document.createElement("p");
      p.innerHTML = '例: <code>?query=慈愛の王</code> のように指定するか、上の検索ボックスに入力。';
      root.appendChild(p);
      return;
    }

    const cfg = await loadConfig();

    const h2 = document.createElement("h2");
    h2.textContent = "Query: " + q;
    root.appendChild(h2);

    // providersをmodeで分類する。mode未指定はsellとして扱う。
    const sell = [];
    const buy = [];
    for (const prov of cfg.providers) {
      if (!prov || !prov.template) continue;
      const mode = (prov.mode === "buy") ? "buy" : "sell";
      (mode === "buy" ? buy : sell).push({ ...prov, mode });
    }

    const renderSection = (title, items, mode) => {
      const sec = document.createElement("div");
      sec.className = "section";

      const h3 = document.createElement("h3");
      h3.textContent = title;
      sec.appendChild(h3);

      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "該当なし";
        sec.appendChild(empty);
        root.appendChild(sec);
        return;
      }

      const ul = document.createElement("ul");
      ul.className = "link-list";

      for (const prov of items) {
        const url = applyTemplate(prov.template, { q, vars: cfg.vars });

        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "biglink";
        a.classList.add(`mode-${mode}`);
        a.textContent = prov.name || prov.template;
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        const badge = document.createElement("div");
        badge.className = `badge badge-${mode}`;
        badge.textContent = (mode === "buy") ? "買取" : "販売";
        a.appendChild(badge);

        const hint = document.createElement("div");
        hint.className = "urlhint";
        hint.textContent = truncateForDisplay(url, URL_TRUNCATE_LEN);
        hint.title = url;
        a.appendChild(hint);

        li.appendChild(a);
        ul.appendChild(li);
      }

      sec.appendChild(ul);
      root.appendChild(sec);
    };

    renderSection("販売", sell, "sell");
    renderSection("買取", buy, "buy");
  }

  window.SearchLinkHub = { loadConfig, saveConfig, resetConfig, applyTemplate };

  if (document.getElementById("content")) {
    renderIndex().catch((e) => {
      console.error(e);
      const root = document.getElementById("content");
      if (root) root.textContent = "設定の読み込みに失敗しました。Console を確認してください。";
    });
  }
})();
