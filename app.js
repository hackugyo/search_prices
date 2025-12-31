(() => {
  const STORAGE_KEY = "search_prices_config_v1"; // プロジェクト固有がおすすめ
  const defaultConfig = window.SEARCH_PRICES_DEFAULT_CONFIG;
  if (!defaultConfig) {
    throw new Error("defaultConfig.js must be loaded before app.js");
  }

  function loadConfig() {
    const base = structuredClone(defaultConfig);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;

      const parsed = JSON.parse(raw);

      // vars はデフォルトに上書きマージ
      if (parsed.vars && typeof parsed.vars === "object") {
        Object.assign(base.vars, parsed.vars);
      }

      // providers は「配列かつ1件以上」なら採用。空ならデフォルトへ。
      if (Array.isArray(parsed.providers) && parsed.providers.length > 0) {
        base.providers = parsed.providers;
      }

      return base;
    } catch {
      return base;
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function resetConfig() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function applyTemplate(template, ctx) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      if (key === "q") return ctx.q;
      if (key === "q_enc") return encodeURIComponent(ctx.q);
      if (ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, key)) return String(ctx.vars[key]);
      return "{" + key + "}";
    });
  }

  function renderIndex() {
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

    const cfg = loadConfig();

    const h2 = document.createElement("h2");
    h2.textContent = "Query: " + q;
    root.appendChild(h2);
   
    // providers を mode で分割（未指定は sell）
    const sell = [];
    const buy = [];
    for (const prov of cfg.providers) {
      if (!prov || !prov.template) continue;
      const mode = (prov.mode === "buy") ? "buy" : "sell";
      (mode === "buy" ? buy : sell).push({ ...prov, mode });
    }
   
    // セクション描画関数
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
   
        // バッジ
        const badge = document.createElement("div");
        badge.className = `badge badge-${mode}`;
        badge.textContent = (mode === "buy") ? "買取" : "販売";
        a.appendChild(badge);
   
        // URLヒント（省略表示）
        const hint = document.createElement("div");
        hint.className = "urlhint";
        hint.textContent = truncateForDisplay ? truncateForDisplay(url, 110) : url;
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

  function truncateForDisplay(s, maxLen = 110) {
    if (!s) return "";
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + "…";
  }

  window.SearchLinkHub = { loadConfig, saveConfig, resetConfig, applyTemplate };

  if (document.getElementById("content")) renderIndex();
})();
