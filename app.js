(() => {
  const STORAGE_KEY = "search_link_hub_config_v1";

  const defaultConfig = {
    vars: {
      hareruya_fqdn: "shops.hareruyamtg.com/shibuya/products/search/result/?product=",
      amenity_fqdn: "www.amenitydream.com/product-list?keyword=",
      mercari_fqdn: "jp.mercari.com/search?keyword="
    },
    providers: [
      {
        name: "晴れる屋MTG 渋谷",
        template: "https://{hareruya_fqdn}{q_enc}",
      },
      {
        name: "アメニティードリーム",
        template: "https://{amenity_fqdn}{q_enc}",
      },
      {
        name: "メルカリ",
        template: "https://{mercari_fqdn}{q_enc}",
      },
    ],
  };

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultConfig);
      const parsed = JSON.parse(raw);
      return {
        vars: parsed.vars && typeof parsed.vars === "object" ? parsed.vars : {},
        providers: Array.isArray(parsed.providers) ? parsed.providers : [],
      };
    } catch {
      return structuredClone(defaultConfig);
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

    const params = new URLSearchParams(location.search);
    const q = params.get("query") || "";

    if (!q) {
      const p = document.createElement("p");
      p.innerHTML = '例: <code>/?query=慈愛の王</code>';
      root.appendChild(p);
      return;
    }

    const cfg = loadConfig();
    const h2 = document.createElement("h2");
    h2.textContent = "Query: " + q;
    root.appendChild(h2);

    const ul = document.createElement("ul");
    for (const prov of cfg.providers) {
      if (!prov || !prov.template) continue;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.textContent = prov.name || prov.template;
      a.href = applyTemplate(prov.template, { q, vars: cfg.vars });
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.appendChild(a);
      ul.appendChild(li);
    }
    root.appendChild(ul);
  }

  window.SearchLinkHub = { loadConfig, saveConfig, resetConfig, applyTemplate };

  if (document.getElementById("content")) renderIndex();
})();
