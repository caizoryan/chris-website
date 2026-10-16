import { createElement } from "./element.js";
import { projects } from "./project-data.js";

const dialogDefinition = (id, title, children, options = {}) => ({
  id,
  className: "projects-container",
  layout: { position: "fixed", inset: 0, zIndex: 1100 },
  attributes: {
    role: "dialog", "aria-modal": "true", "aria-hidden": "true",
    "aria-labelledby": `${id}-title`, inert: true,
  },
  ...options,
  children: [{
    id: `${id}-panel`, className: `projects-panel ${options.panelClass ?? ""}`,
    layout: { position: "relative" },
    children: [
      {
        id: `${id}-header`, className: "projects-header",
        children: [
          { id: `${id}-title`, tag: "h2", text: title },
          {
            id: `${id}-close`, tag: "button", className: "projects-close", text: "×",
            attributes: { type: "button", "aria-label": `Close ${title.toLowerCase()}` },
            action: `close:${id}`,
          },
        ],
      },
      ...children,
    ],
  }],
});

export const dialogDefinitions = [
  dialogDefinition("projects-modal", "Projects", [{
    id: "project-grid", className: "project-grid",
    children: projects.map(({ id, src, caption }) => ({
      id: `project-${id}`, tag: "figure", className: "project-card",
      children: [
        { id: `project-${id}-image`, tag: "img", src, alt: caption, attributes: { loading: "lazy" } },
        { id: `project-${id}-caption`, tag: "figcaption", text: caption },
      ],
    })),
  }]),
  dialogDefinition("demo-reel-modal", "Demo Reel", [{
    id: "demo-reel-frame", tag: "iframe", className: "demo-reel-frame",
    attributes: {
      title: "Chris Steinkampf Demo Reel",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      referrerpolicy: "strict-origin-when-cross-origin", allowfullscreen: true,
    },
  }], {
    panelClass: "demo-reel-panel",
    embed: { id: "demo-reel-frame", src: "https://www.youtube.com/embed/s0UI4r9OnFA" },
  }),
];

export function createDialogs() {
  const registry = new Map();
  const actions = {};
  let activeDialog = null;
  let previousFocus = null;
  let triggers = [];
  let background = [];

  function synchronize() {
    for (const definition of dialogDefinitions) {
      const element = registry.get(definition.id).element;
      const open = definition.id === activeDialog;
      element.inert = !open;
      element.classList.toggle("is-open", open);
      element.setAttribute("aria-hidden", String(!open));
    }
    for (const { config, element } of triggers) {
      element.setAttribute("aria-expanded", String(config.attributes["aria-controls"] === activeDialog));
    }
    for (const element of background) element.inert = activeDialog !== null;
  }

  function close() {
    if (!activeDialog) return;
    const definition = dialogDefinitions.find(({ id }) => id === activeDialog);
    // Unload the reel on close to stop audio; it isn't requested before opening.
    if (definition.embed) registry.get(definition.embed.id).element.removeAttribute("src");
    activeDialog = null;
    synchronize();
    previousFocus?.focus({ preventScroll: true });
  }

  function open(id) {
    if (activeDialog === id) return;
    if (activeDialog) close();
    previousFocus = document.activeElement;
    activeDialog = id;
    const definition = dialogDefinitions.find(dialog => dialog.id === id);
    if (definition.embed) registry.get(definition.embed.id).element.src = definition.embed.src;
    synchronize();
    registry.get(`${id}-close`).element.focus({ preventScroll: true });
  }

  for (const { id } of dialogDefinitions) {
    actions[`open:${id}`] = () => open(id);
    actions[`close:${id}`] = close;
  }
  const instances = dialogDefinitions.map(config => createElement(config, { registry, actions }));
  for (const { element } of instances) {
    element.addEventListener("click", event => { if (event.target === element) close(); });
  }

  document.addEventListener("keydown", (event) => {
    if (!activeDialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key !== "Tab") return;
    const dialog = registry.get(activeDialog).element;
    const focusable = [...dialog.querySelectorAll("button, a[href], iframe, input, select, textarea, [tabindex]")]
      .filter(element => element.tabIndex >= 0 && element.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return {
    actions,
    elements: instances.map(({ element }) => element),
    get isOpen() { return activeDialog !== null; },
    connect(sceneRegistry, backgroundElements) {
      triggers = [...sceneRegistry.values()].filter(({ config }) => config.attributes?.["aria-controls"]);
      background = backgroundElements;
      synchronize();
    },
  };
}
