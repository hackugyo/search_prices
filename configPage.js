(() => {
  const elVars = document.getElementById("vars");
  const elProviders = document.getElementById("providers");
  const elMsg = document.getElementById("msg");

  function setMsg(s) {
    if (elMsg) elMsg.textContent = s;
  }

  function refresh() {
    const cfg = window.SearchLinkHub.loadConfig();
    elVars.value = JSON.stringify(cfg.vars || {}, null, 2);
    elProviders.value = JSON.stringify(cfg.providers || [], null, 2);
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

  document.getElementById("reset").addEventListener("click", () => {
    window.SearchLinkHub.resetConfig();
    setMsg("Reset.");
    setTimeout(() => location.reload(), 300);
  });

  refresh();
})();
