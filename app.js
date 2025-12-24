(() => {
  const STORAGE_KEY = "search_prices_config_v1"; // プロジェクト固有がおすすめ

  const defaultConfig = {
    vars: {
      whisper_fqdn: "whisper.wisdom-guild.net/search/php?q=",
      hareruya_shibuya_fqdn: "shops.hareruyamtg.com/shibuya/products/search/result/?product=",
      amenity_fqdn: "www.amenitydream.com/product-list?keyword=",
      mercari_fqdn: "jp.mercari.com/search?keyword="
    },
    providers: [
      { name: "Whisper", template: "https://{whisper_fqdn}{q_enc}" },
      { name: "晴れる屋MTG 渋谷", template: "https://{hareruya_shibuya_fqdn}{q_enc}" },
      { name: "アメニティードリーム", template: "https://{amenity_fqdn}{q_enc}" },
      { name: "メルカリ", template: "https://{mercari_fqdn}{q_enc}" },
    ],
  };

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

    const ul = document.createElement("ul");
    ul.className = "link-list";

    for (const prov of cfg.providers) {
      if (!prov || !prov.template) continue;

      const url = applyTemplate(prov.template, { q, vars: cfg.vars });

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "biglink";
      a.textContent = prov.name || prov.template;
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const hint = document.createElement("div");
      hint.className = "urlhint";
      hint.textContent = url;

      a.appendChild(hint);
      li.appendChild(a);
      ul.appendChild(li);
    }

    root.appendChild(ul);
  }

  window.SearchLinkHub = { loadConfig, saveConfig, resetConfig, applyTemplate };

  if (document.getElementById("content")) renderIndex();
})();
