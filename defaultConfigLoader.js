(() => {
  const NS = "SearchPrices";
  const CFG_PATH = "defaultConfig.json";

  const clone = (obj) => {
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  };

  let cache = null;
  let inflight = null;
  console.log("[defaultConfigLoader] fetching:", new URL(CFG_PATH, document.baseURI).toString());

  async function fetchDefaultConfig() {
    const url = new URL(CFG_PATH, document.baseURI);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`fetch ${CFG_PATH} failed: ${res.status}`);
    return await res.json();
  }

  async function getDefaultConfig() {
    if (cache) return clone(cache);
    if (inflight) return clone(await inflight);

    inflight = (async () => {
      const cfg = await fetchDefaultConfig();
      cache = cfg;
      inflight = null;
      return cfg;
    })();

    return clone(await inflight);
  }

  window[NS] = window[NS] || {};
  window[NS].getDefaultConfig = getDefaultConfig;
})();
