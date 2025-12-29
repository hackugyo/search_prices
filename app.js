(() => {
  const STORAGE_KEY = "search_prices_config_v1"; // プロジェクト固有がおすすめ

  const defaultConfig = {
    vars: {
      whisper_fqdn: "whisper.wisdom-guild.net/search/php?q=",
      hareruya_shibuya_fqdn: "shops.hareruyamtg.com/shibuya/products/search/result/?product=",
      hareruya_akiba_fqdn: "shops.hareruyamtg.com/akihabara/products/search/result/?product=",
      amenity_fqdn: "www.amenitydream.com/product-list?keyword=",
      mercari_fqdn: "jp.mercari.com/search?keyword=",
      surugaya_fqdn: "www.suruga-ya.jp/search?category=5&insStock=On&ck=true&brand=%E3%82%A6%E3%82%A3%E3%82%B6%E3%83%BC%E3%82%BA%E3%83%BB%E3%82%AA%E3%83%96%E3%83%BB%E3%82%B6%E3%83%BB%E3%82%B3%E3%83%BC%E3%82%B9%E3%83%88&search_word=",
      buy_hareruya_fqdn: "www.hareruyamtg.com/ja/purchase/search?swww.hareruyamtg.com/ja/purchase/search?suggest_type=all&purchaseFlg=1&sort=price&order=ASC&page=1&product=",
      buy_dorasuta_fqdn: "buy.dorasuta.jp/mtg/product-list?kw=",
      buy_cardrush_fqdn: "cardrush.media/mtg/buying_prices?displayMode=%E3%83%AA%E3%82%B9%E3%83%88&limit=100&rarity=&model_number=&amount=&page=1&sort%5Bkey%5D=name&sort%5Border%5D=desc&associations%5B%5D=ocha_product&to_json_option%5Bmethods%5D=name_with_condition&to_json_option%5Bexcept%5D%5B%5D=original_image_source&to_json_option%5Bexcept%5D%5B%5D=created_at&to_json_option%5Binclude%5D%5Bocha_product%5D%5Bonly%5D%5B%5D=id&to_json_option%5Binclude%5D%5Bocha_product%5D%5Bmethods%5D%5B%5D=image_source&display_category%5B%5D=%E9%AB%98%E9%A1%8D%E7%B3%BB&display_category%5B%5D=foil%E7%B3%BB&display_category%5B%5D=%E3%82%B9%E3%82%BF%E3%83%B3%E3%83%80%E3%83%BC%E3%83%89&display_category%5B%5D=%E3%82%B9%E3%82%BF%E3%83%B3%E3%83%80%E3%83%BC%E3%83%89%E6%9C%80%E6%96%B0%E5%BC%BE&display_category%5B%5D=%E3%83%91%E3%82%A4%E3%82%AA%E3%83%8B%E3%82%A2%E4%BB%A5%E4%B8%8B&display_category%5B%5D=%E3%83%A2%E3%83%80%E3%83%B3%E4%BB%A5%E4%B8%8B%E6%9C%80%E6%96%B0%E5%BC%BE&name=",
      goodgame_fqdn: "goodgame.co.jp/search?options%5Bprefix%5D=last&filter.v.availability=1&filter.v.price.gte=&filter.v.price.lte=&sort_by=relevance&q=",
      buy_serra_fqdn: "cardshop-serra.com/mtg/buy_product?name=",
      arcana_fqdn: "shop.arcana-tcg.com/search?sort_by=relevance&options%5Bprefix%5D=last&filter.v.availability=1&filter.v.price.gte=&filter.v.price.lte=&filter.p.tag=MTG&q=",
      
    },
    providers: [
      { name: "Whisper", template: "https://{whisper_fqdn}{q_enc}" },
      { name: "GoodGame", template: "https://{goodgame_fqdn}{q_enc}" },
      { name: "ARCANA", template: "https://{arcana_fqdn}{q_enc}" },
      { name: "晴れる屋MTG 渋谷", template: "https://{hareruya_shibuya_fqdn}{q_enc}" },
      { name: "晴れる屋MTG 秋葉原", template: "https://{hareruya_akiba_fqdn}{q_enc}" },      
      { name: "アメニティードリーム", template: "https://{amenity_fqdn}{q_enc}" },
      { name: "メルカリ", template: "https://{mercari_fqdn}{q_enc}" },
      { name: "駿河屋", template: "https://{surugaya_fqdn}{q_enc}" },
      { name: "晴れる屋 買取", mode: "buy", template: "https://{buy_hareruya_fqdn}{q_enc}" },
      { name: "ドラスタ 買取", mode: "buy", template: "https://{buy_dorasuta_fqdn}{q_enc}" },
      { name: "ラッシュ 買取", mode: "buy",  template: "https://{buy_cardrush_fqdn}{q_enc}" },
      { name: "Serra 買取", mode: "buy", template: "https://{buy_serra_fqdn}{q_enc}" },
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
