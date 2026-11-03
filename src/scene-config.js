// Scene coordinates are measured in 1% of the visible landscape's height.
// Numbers in `layout` use those units; strings keep CSS units (%, px, etc.).
// This is the single place to tune artwork, positioning, stacking and depth.
const artwork = (file) => new URL(`../assets/scene/${file}`, import.meta.url).href;

export const SCENE = {
  height: 100,
  width: 790,
  compassHeight: 80,
  horizon: 61.5,
};

const image = (id, file, layout, options = {}) => ({
  id,
  tag: "img",
  className: "scene-element scene-image",
  src: artwork(file),
  alt: "",
  layout: { position: "absolute", ...layout },
  ...options,
});

const layer = (id, depth, zIndex, children) => ({
  id,
  className: "scene-element scene-layer",
  layout: { position: "absolute", inset: 0, zIndex },
  parallax: { depth },
  children,
});

const sceneButton = (id, text, dialog, layout, options = {}) => ({
  id,
  tag: "button",
  text,
  action: options.action ?? (dialog ? `open:${dialog}` : undefined),
  destination: options.destination,
  attributes: {
    type: "button",
    ...(dialog && { "aria-controls": dialog, "aria-expanded": "false" }),
    ...options.attributes,
  },
  className: options.className ?? "signpost-link",
  layout: { position: "absolute", ...layout },
});

const backgroundTileWidth = 3090 / 1741 * SCENE.height;
const mountainWidth = 294;
// The PNG includes large transparent margins. Its lowest ridge edge is near
// source y=1335, not at the bottom of its 2250px canvas. Anchor that edge to
// the sky/land boundary so the mountains don't float below the horizon.
const mountainTop = SCENE.horizon - mountainWidth * 1335 / 6713;
const fillerWidth = 6993 / 4688 * SCENE.height;

export const sceneElements = [
  // The active SVG is one seam-free half of the original two-copy artwork.
  // Alternate its orientation so the rolling horizon joins at matching edges.
  layer("background", 0.45, -1, Array.from({ length: 5 }, (_, index) =>
    image(`background-tile-${index}`, "background.svg", {
      left: index * backgroundTileWidth, top: 0,
      width: `calc(${backgroundTileWidth} * var(--scene-unit) + 1px)`, height: "100%",
      transform: index % 2 ? "scaleX(-1)" : "none",
    }),
  )),

  layer("mountains", 0.2, 0, [0, 1, 2].map((index) =>
    image(`mountain-tile-${index}`, "mountains.png", {
      left: index * mountainWidth, top: mountainTop, width: mountainWidth,
      transform: index % 2 ? "scaleX(-1)" : "none",
    }, {
      // Discard stray marks in the transparent margins, not the ridge itself.
      style: { clipPath: "inset(52% 0 36.8% 0)" },
    }),
  )),

  image("sun", "sun.png", { left: -8, top: 0, width: 60, zIndex: 0 }, {
    parallax: { depth: 0.78 },
  }),

  // An opening in the clouds leaves the planets and perched heron readable.
  // layer("clouds", 0.58, 1, [-5, 305, 460, 615, 770].map((left, index) =>
  //   image(`cloud-tile-${index}`, "clouds.png", { left, top: -8, width: 155 }, {
  //     style: { opacity: 0.95 },
  //   }),
  // )),

  {
    id: "planets", className: "scene-element",
    layout: { position: "absolute", left: 310, top: -8, width: 68, aspectRatio: "1487 / 1098", zIndex: 1 },
    parallax: { depth: 0.28 },
    children: [
      image("planet-artwork", "planets.png", { left: 0, top: 0, width: "100%" }, {
        alt: "Two luminous planets in the sky",
      }),
      image("bird", "bird.png", { left: "6%", top: "25%", width: "50%" }, {
        alt: "A bird flying across the planets",
      }),
    ],
  },

  // Filler ground between the checkpoints. Each strip is the ground band of a
  // full-height panel (source canvas 6993×4688), so its horizon meets SCENE.horizon.
  ...[[1, 170], [2, 425]].map(([index, left]) =>
    image(`rocks-filler-${index}`, `rocks-filler-${index}.png`, {
      left, top: 60, width: fillerWidth, zIndex: 2,
    }, {
      parallax: { depth: 0.1 },
      style: { maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)" },
    }),
  ),
  image("portal-ground", "portal-ground.png", { left: 270, top: 5, width: 178, zIndex: 2 }, {
    parallax: { depth: 0.1 },
  }),

  {
    id: "rock-portal", className: "scene-element",
    layout: { position: "absolute", left: 300, bottom: -4, width: 95, aspectRatio: "1971 / 1877", zIndex: 4 },
    parallax: { depth: 0.1 },
    children: [
      image("portal-artwork", "rock-portal.png", { left: 0, top: 0, width: "100%" }, {
        alt: "A heron perched on a sandstone arch, casting long shadows",
      }),
      sceneButton("portal-projects", "Projects", "projects-modal", {
        left: "55%", top: "53%", transform: "translateX(-50%)",
        padding: "calc(.65 * var(--scene-unit)) calc(2.4 * var(--scene-unit))",
      }, { className: "portal-projects" }),
    ],
  },

  image("bird-shadow", "bird-shadow.png", { left: 405, top: 66, width: 13, zIndex: 3 }, {
    parallax: { depth: 0.1 },
  }),
  // The basecamp panel shares the scene's 2250px-tall canvas; the props below
  // are placed to match archive/reference/basecamp-mockup.jpg at the start.
  image("basecamp", "basecamp.png", { left: 0, top: 0, width: 3980 / 2250 * SCENE.height, zIndex: 3 }, {
    alt: "An open shipping container with a shade awning and a storage trunk",
    parallax: { depth: 0.1 },
  }),
  image("pots", "pots.png", { left: 78.7, top: 66.5, width: 31.5, zIndex: 4 }, {
    alt: "Two small jars beside a pot on a tripod stand", parallax: { depth: 0.1 },
  }),

  {
    id: "projector", className: "scene-element",
    layout: { position: "absolute", left: 3.5, top: 68.6, width: 33.6, aspectRatio: "657 / 466", zIndex: 5 },
    parallax: { depth: 0.1 },
    children: [
      image("projector-artwork", "projector.png", { left: 0, top: 0, width: "100%" }, {
        alt: "A projector cabled to a small control box",
      }),
      sceneButton("projector-demo-reel", "Demo Reel", "demo-reel-modal", {
        left: "25%", top: "36%", transform: "translate(-50%, -50%)",
        padding: "calc(.35 * var(--scene-unit)) calc(1.3 * var(--scene-unit))",
      }, { className: "projector-demo-reel" }),
    ],
  },

  {
    id: "signpost", className: "scene-element",
    layout: { position: "absolute", left: 93.2, top: 28.4, width: 64, aspectRatio: "1620 / 2160", zIndex: 5 },
    parallax: { depth: 0.05 },
    children: [
      image("signpost-artwork", "signpost.png", { left: 0, top: 0, width: "100%", height: "100%" }, {
        alt: "Signpost", style: { objectFit: "contain" },
      }),
      sceneButton("signpost-basecamp", "Basecamp", null, {
        left: "33%", top: "45.5%", width: "16%", height: "4.5%", zIndex: 1,
      }, {
        action: "navigate", destination: "start",
        attributes: { "data-signpost-item": "basecamp" },
      }),
      sceneButton("signpost-projects", "Projects", null, {
        left: "50%", top: "43.5%", width: "15%", height: "4.5%", zIndex: 1,
      }, {
        action: "navigate", destination: "portal-projects",
        attributes: { "data-signpost-item": "projects" },
      }),
      sceneButton("signpost-contact", "Contact", null, {
        left: "50.5%", top: "50.5%", width: "15%", height: "4.5%", zIndex: 1,
      }, {
        action: "navigate", destination: "end",
        attributes: { "data-signpost-item": "contact" },
      }),
    ],
  },

  image("waterfall", "waterfall.png", { left: 570, bottom: 0, width: 220, zIndex: 4 }, {
    alt: "A waterfall flowing into a pool in a rocky canyon", parallax: { depth: 0 },
  }),
  image("astronaut", "astronaut.png", { left: 570, bottom: 0, width: 220, zIndex: 5 }, {
    alt: "Chris in a spacesuit overlooking the canyon",
    // These files share a canvas. Align at the endpoint, with slightly faster
    // foreground movement on the approach to the canyon.
    parallax: { depth: -0.04, anchor: "end" },
  }),
];

export const landscape = {
  id: "landscape", tag: "main", className: "scroll-container",
  attributes: { "aria-label": "Explore the Steinkampf Audio landscape" },
  layout: { position: "relative", width: "100%", height: `calc(100svh - ${SCENE.compassHeight}px)` },
  children: [{
    id: "scene", className: "scene",
    layout: { position: "relative", width: SCENE.width, minWidth: "100%", height: "100%" },
    children: sceneElements,
  }],
};

export const heading = {
  id: "heading", tag: "h1", className: "heading",
  layout: { position: "fixed", top: "1vh", left: 0, width: "100%", zIndex: 10 },
  children: [{
    id: "heading-logo", tag: "img", className: "heading-logo",
    src: artwork("logo.png"), alt: "Steinkampf Audio",
  }],
};

export const COMPASS = {
  directions: ["N", "NW", "W", "SW", "S", "SE", "E", "NE"],
  step: 360,
  animationDuration: 650,
  mouseDrift: 30,
  bar: {
    id: "compass", tag: "nav", className: "compass-bar",
    attributes: { "aria-label": "Landscape compass", tabindex: "0" },
    layout: { position: "fixed", bottom: "2.5%", left: "2.5%", width: "95%", height: `${SCENE.compassHeight}px`, zIndex: 999 },
  },
  pointer: {
    id: "compass-pointer", className: "compass-pointer",
    layout: { position: "absolute", left: "50%", top: 0, width: 0, height: 0, zIndex: 2, transform: "translateX(-50%)" },
  },
  track: {
    id: "compass-track", className: "compass-track",
    layout: { position: "absolute", left: 0, top: "13px" },
  },
  readout: {
    id: "compass-degree", className: "compass-degree", text: "0°",
    layout: { position: "absolute", left: "50%", top: "-28px", transform: "translateX(-50%)" },
  },
};
