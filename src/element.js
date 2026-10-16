// Convert a declarative element into a DOM node and keep the definition beside
// its runtime node. Scene transforms, dialogs and controls share this registry.
const UNITLESS = new Set(["zIndex", "opacity", "aspectRatio", "flexGrow", "flexShrink", "order"]);

export function layoutValue(property, value) {
  return typeof value === "number" && !UNITLESS.has(property)
    ? `calc(${value} * var(--scene-unit))`
    : String(value);
}

export function createElement(config, { registry = new Map(), actions = {} } = {}) {
  if (registry.has(config.id)) throw new Error(`Duplicate element id: ${config.id}`);
  const element = document.createElement(config.tag ?? "div");
  if (config.id) element.id = config.id;
  if (config.className) element.className = config.className;
  if (config.text !== undefined) element.textContent = config.text;
  if (config.src) element.setAttribute("src", config.src);
  if (config.tag === "img") {
    element.alt = config.alt ?? "";
    element.draggable = false;
  }
  for (const [name, value] of Object.entries(config.attributes ?? {})) {
    if (value !== false && value != null) element.setAttribute(name, value === true ? "" : String(value));
  }
  for (const [property, value] of Object.entries(config.layout ?? {})) {
    element.style[property] = layoutValue(property, value);
  }
  Object.assign(element.style, config.style);
  if (config.action) {
    if (!actions[config.action]) throw new Error(`Unknown action: ${config.action}`);
    element.addEventListener("click", () => actions[config.action](instance));
  }
  const instance = { config, element, children: [] };
  if (config.id) registry.set(config.id, instance);
  instance.children = (config.children ?? []).map(child => createElement(child, { registry, actions }));
  element.append(...instance.children.map(child => child.element));
  return instance;
}

export function parallaxOffset({ depth, anchor = "start" }, scrollLeft, maxScroll) {
  return (scrollLeft - (anchor === "end" ? maxScroll : 0)) * depth;
}
