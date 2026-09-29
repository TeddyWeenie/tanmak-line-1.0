(function () {
  const obs = new MutationObserver(function () {
    if (document.getElementById("openBtn")) return;
    const how = document.getElementById("howBtn");
    if (!how || !how.parentNode) return;
    const b = document.createElement("button");
    b.id = "openBtn";
    b.type = "button";
    b.className = "ghost";
    b.textContent = "블랙박스 오프닝";
    b.addEventListener("click", function () {
      if (typeof window.playOpening === "function") window.playOpening();
    });
    how.parentNode.insertBefore(b, how);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
