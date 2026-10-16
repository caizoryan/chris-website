import { createElement, parallaxOffset } from "./element.js";
import { SCENE, landscape, heading } from "./scene-config.js";

export function createScene(actions) {
  document.documentElement.style.setProperty(
    "--scene-unit",
    `calc((100svh - ${SCENE.compassHeight}px) / ${SCENE.height})`,
  );
  const registry = new Map();
  const viewport = createElement(landscape, { registry, actions });
  const title = createElement(heading, { registry });
  const movingElements = [...registry.values()].filter(({ config }) => config.parallax);

  function updateParallax() {
    const page = viewport.element;
    const maxScroll = Math.max(0, page.scrollWidth - page.clientWidth);
    for (const { config, element } of movingElements) {
      const offset = parallaxOffset(config.parallax, page.scrollLeft, maxScroll);
      const baseTransform = config.layout?.transform ?? "";
      element.style.transform = `translate3d(${offset}px, 0, 0) ${baseTransform}`.trim();
    }
  }

  return {
    registry,
    page: viewport.element,
    title: title.element,
    updateParallax,
  };
}
