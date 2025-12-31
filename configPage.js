(() => {
  const elVars = document.getElementById("vars");
  const elProviders = document.getElementById("providers");
  const elMsg = document.getElementById("msg");

  function setMsg(s) {
    if (elMsg) elMsg.textContent = s;
  }

  // 現在の設定をlocalStorageから読み、テキストエリアへ反映する。
  async function refresh() {
    try {
      const cfg = await window.SearchLinkHub.loadConfig();
      elVars.value = JSON.stringify(cfg.vars || {}, null, 2);
      elProviders.value = JSON.stringify(cfg.providers || [], null, 2);
      setMsg("");
    } catch (e) {
      console.error(e);
      setMsg("Config load failed. Console を確認してください。");
    }
  }

  document.getElementById("save").addEventListener("click", () => {
    try {
      const vars = JSON.parse(elVars.value || "{}");
      const providers = JSON.parse(elProviders.value || "[]");
      window.SearchLinkHub.saveConfig({ vars, providers });
      setMsg("Saved.");
    } catch (e) {
      setMsg("JSON parse error: " + e);
    }
  });

  document.getElementById("reset").addEventListener("click", async () => {
    window.SearchLinkHub.resetConfig();
    setMsg("Reset.");
    await refresh();
  });

  refresh();
})();
