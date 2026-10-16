import { createElement } from "./element.js";
import { COMPASS } from "./scene-config.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// A moving landmark's apparent speed is (1 - depth). Native scrollIntoView
// cannot account for that, so solve for its centered position explicitly.
export function centeredScrollPosition({ scrollLeft, centerOffset, depth, maxScroll }) {
  const speed = 1 - depth;
  return Math.abs(speed) < 0.000001
    ? scrollLeft
    : clamp(scrollLeft + centerOffset / speed, 0, maxScroll);
}

export function createNavigation({ page, updateParallax, registry: sceneRegistry }, isDialogOpen) {
  const { directions, step, animationDuration, mouseDrift } = COMPASS;
  const registry = new Map();
  const marks = directions.concat(directions).map((direction, index) => ({
    id: `compass-mark-${index}`,
    className: `compass-mark${index % directions.length === 0 ? " major" : ""}`,
    text: direction,
    layout: { position: "relative", width: `${step}px` },
    style: { flex: `0 0 ${step}px` },
    children: [{
      id: `compass-tick-${index}`, className: "compass-tick",
      layout: { position: "absolute", top: 0, left: "50%", height: `${index % directions.length === 0 ? 22 : 15}px` },
    }],
  }));
  const compass = createElement({
    ...COMPASS.bar,
    children: [COMPASS.pointer, COMPASS.readout, { ...COMPASS.track, children: marks }],
  }, { registry });
  const bar = compass.element;
  const track = registry.get(COMPASS.track.id).element;
  const degree = registry.get(COMPASS.readout.id).element;
  const maxPosition = (directions.length - 1) * step;
  const state = {
    position: 0,
    dragging: false,
    dragStartX: 0,
    dragStartPosition: 0,
    baseScroll: 0,
    derivedScroll: false,
    animation: null,
    degreeTimer: null,
  };

  const maxScroll = () => Math.max(0, page.scrollWidth - page.clientWidth);

  // --- Compass rendering and scroll synchronization ---
  function renderCompass(showDegree = false) {
    track.style.transform = `translateX(calc(50vw - ${state.position + step / 2}px))`;
    const angle = Math.round((360 - state.position / step * 45 + 360) % 360);
    degree.textContent = `${angle}°`;
    if (!showDegree) return;
    degree.classList.add("visible");
    clearTimeout(state.degreeTimer);
    state.degreeTimer = setTimeout(() => degree.classList.remove("visible"), 1000);
  }

  function setPosition(value, showDegree = false) {
    state.position = clamp(value, 0, maxPosition);
    state.derivedScroll = false;
    state.baseScroll = maxScroll() * state.position / maxPosition;
    page.scrollLeft = state.baseScroll;
    renderCompass(showDegree);
    updateParallax();
  }

  function cancelAnimation() {
    if (state.animation !== null) cancelAnimationFrame(state.animation);
    state.animation = null;
  }

  function resumeNativeScroll() {
    cancelAnimation();
    state.baseScroll = page.scrollLeft;
    state.derivedScroll = false;
  }

  page.addEventListener("scroll", () => {
    if (!state.derivedScroll) state.baseScroll = page.scrollLeft;
    state.position = maxScroll() ? page.scrollLeft / maxScroll() * maxPosition : 0;
    renderCompass();
    updateParallax();
  }, { passive: true });

  // --- Wheel, touch/native scrolling, and subtle mouse-derived movement ---
  function handleWheel(event) {
    if (event.ctrlKey || isDialogOpen()) return;
    event.preventDefault();
    resumeNativeScroll();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page.clientWidth : 1;
    page.scrollLeft += delta * multiplier;
  }
  page.addEventListener("wheel", handleWheel, { passive: false });
  bar.addEventListener("wheel", handleWheel, { passive: false });
  page.addEventListener("pointerdown", resumeNativeScroll, { passive: true });

  window.addEventListener("mousemove", (event) => {
    if (isDialogOpen() || state.dragging || state.animation !== null || bar.contains(event.target)) return;
    const offset = (event.clientX / window.innerWidth - 0.5) * mouseDrift;
    state.derivedScroll = true;
    page.scrollLeft = clamp(state.baseScroll + offset, 0, maxScroll());
  });

  // --- Shared animation for signpost destinations and arrow checkpoints ---
  function animateToPosition(value, onComplete = () => {}) {
    cancelAnimation();
    state.position = maxScroll() ? page.scrollLeft / maxScroll() * maxPosition : 0;
    const from = state.position;
    const target = clamp(value, 0, maxPosition);
    if (target === from) {
      onComplete();
      return;
    }
    const startedAt = performance.now();
    function animate(now) {
      const progress = Math.min(1, (now - startedAt) / animationDuration);
      const eased = 1 - (1 - progress) ** 3;
      setPosition(from + (target - from) * eased);
      state.animation = progress < 1 ? requestAnimationFrame(animate) : null;
      if (progress === 1) onComplete();
    }
    state.animation = requestAnimationFrame(animate);
  }

  function scrollTo(destination) {
    if (isDialogOpen() || !maxScroll()) return;
    if (destination === "end") {
      animateToPosition(maxPosition);
      return;
    }
    const target = sceneRegistry.get(destination);
    if (!target) return;
    updateParallax();
    let depth = 0;
    for (let element = target.element; element && element !== page; element = element.parentElement) {
      depth += sceneRegistry.get(element.id)?.config.parallax?.depth ?? 0;
    }
    const bounds = target.element.getBoundingClientRect();
    const centerOffset = bounds.left + bounds.width / 2
      - page.getBoundingClientRect().left - page.clientWidth / 2;
    const scrollLeft = centeredScrollPosition({ scrollLeft: page.scrollLeft, centerOffset, depth, maxScroll: maxScroll() });
    animateToPosition(scrollLeft / maxScroll() * maxPosition, () => {
      target.element.focus({ preventScroll: true });
    });
  }

  function moveToCheckpoint(direction) {
    const index = direction > 0
      ? Math.floor(state.position / step + 0.001) + 1
      : Math.ceil(state.position / step - 0.001) - 1;
    animateToPosition(index * step);
  }

  window.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key) || isDialogOpen()) return;
    if (event.target.isContentEditable || event.target.matches("input, textarea, select")) return;
    event.preventDefault();
    moveToCheckpoint(event.key === "ArrowRight" ? 1 : -1);
  });

  // --- Bounded compass dragging ---
  bar.addEventListener("pointerdown", (event) => {
    if (isDialogOpen()) return;
    cancelAnimation();
    state.dragging = true;
    state.dragStartX = event.clientX;
    state.dragStartPosition = state.position;
    bar.setPointerCapture(event.pointerId);
    renderCompass(true);
  });
  bar.addEventListener("pointermove", (event) => {
    if (state.dragging) setPosition(state.dragStartPosition - (event.clientX - state.dragStartX), true);
  });
  bar.addEventListener("pointerup", () => { state.dragging = false; });
  bar.addEventListener("pointercancel", () => { state.dragging = false; });
  bar.addEventListener("lostpointercapture", () => { state.dragging = false; });

  function refresh() {
    cancelAnimation();
    setPosition(state.position);
  }
  window.addEventListener("resize", refresh);
  return { element: bar, refresh, scrollTo };
}
