/* Home windows: hover a column to bring that tile forward. Links stay native. */
(() => {
  const root = document.querySelector("[data-coverflow]");
  if (!(root instanceof HTMLElement)) return;

  const desktop = window.matchMedia("(min-width: 721px) and (hover: hover)");

  const pick = (clientX) => {
    const box = root.getBoundingClientRect();
    const x = (clientX - box.left) / box.width;
    const current = root.dataset.focus || "tools";
    if (x < 0.31) return "research";
    if (x > 0.69) return "systems";
    if (x > 0.38 && x < 0.62) return "tools";
    return current;
  };

  root.addEventListener("mousemove", (event) => {
    if (!desktop.matches) return;
    root.dataset.focus = pick(event.clientX);
  });
  root.addEventListener("mouseleave", () => {
    delete root.dataset.focus;
  });
  desktop.addEventListener("change", () => {
    if (!desktop.matches) delete root.dataset.focus;
  });
})();
