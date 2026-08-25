/* Home coverflow: snap a side window to center. Navigation is the <a> tags. */
(() => {
  const root = document.querySelector("[data-coverflow]");
  if (!(root instanceof HTMLElement)) return;

  const desktop = window.matchMedia("(min-width: 721px) and (hover: hover)");

  let slot = "center";
  let armed = true;
  let dwell = null;

  const activeCard = () => root.dataset.active || "tools";
  const occupant = (current, side) => {
    if (side === "left") return current === "research" ? "tools" : "research";
    return current === "systems" ? "tools" : "systems";
  };
  const readSlot = (clientX) => {
    const box = root.getBoundingClientRect();
    const x = (clientX - box.left) / box.width;
    if (slot === "center") {
      if (x < 0.24) return "left";
      if (x > 0.76) return "right";
      return "center";
    }
    if (slot === "left") {
      if (x > 0.38) return x > 0.76 ? "right" : "center";
      return "left";
    }
    if (x < 0.62) return x < 0.24 ? "left" : "center";
    return "right";
  };
  const cancelDwell = () => {
    if (dwell !== null) window.clearTimeout(dwell);
    dwell = null;
  };
  const reset = () => {
    cancelDwell();
    slot = "center";
    armed = true;
    root.dataset.active = "tools";
  };

  root.addEventListener("mousemove", (event) => {
    if (!desktop.matches) return;
    slot = readSlot(event.clientX);
    if (slot === "center") {
      cancelDwell();
      armed = true;
      return;
    }
    if (!armed) return;
    const next = occupant(activeCard(), slot);
    if (next === activeCard()) return;
    if (dwell !== null) return;
    dwell = window.setTimeout(() => {
      root.dataset.active = next;
      armed = false;
      dwell = null;
    }, 140);
  });
  root.addEventListener("mouseleave", reset);
  desktop.addEventListener("change", () => {
    if (!desktop.matches) reset();
  });
})();
