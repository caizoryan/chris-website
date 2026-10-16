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

  image("rocks-distance", "rocks-distance.png", { left: 0, bottom: 15, width: 65, zIndex: 2 }, {
    parallax: { depth: 0.2 },
  }),
  image("rocks-foreground", "rocks-foreground.png", { left: 0, bottom: 0, width: 96, zIndex: 2 }, {
    parallax: { depth: 0 },
  }),
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
  image("robot", "robot.png", { left: 36, bottom: 12, width: 33, zIndex: 4 }, {
    alt: "Robot", parallax: { depth: 0.12 },
  }),
  image("basecamp", "basecamp.png", { left: 60, bottom: 13, width: 70, zIndex: 3 }, {
    alt: "Basecamp", parallax: { depth: 0.2 },
  }),

  {
    id: "signpost", className: "scene-element",
    layout: { position: "absolute", left: 105, bottom: 3, width: 34, aspectRatio: "2091 / 2996", zIndex: 5 },
    parallax: { depth: 0.05 },
    children: [
      image("signpost-artwork", "signpost.png", { left: 0, top: 0, width: "100%", height: "100%" }, {
        alt: "Signpost", style: { objectFit: "contain" },
      }),
      sceneButton("signpost-projects", "Projects", null, {
        left: "51%", top: "15%", width: "42%", height: "10%", zIndex: 1,
      }, {
        action: "navigate", destination: "portal-projects",
        attributes: { "data-signpost-item": "projects" },
      }),
      sceneButton("signpost-demo-reel", "Demo Reel", "demo-reel-modal", {
        left: "12%", top: "34%", width: "38%", height: "8%", zIndex: 1,
      }, { attributes: { "data-signpost-item": "demoReel" } }),
      sceneButton("signpost-contact", "Contact", null, {
        left: "51%", top: "30%", width: "42%", height: "9%", zIndex: 1,
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
  id: "heading", tag: "h1", className: "heading", text: "Steinkampf Audio",
  layout: { position: "fixed", top: "1vh", left: 0, width: "100%", zIndex: 10 },
};

export const COMPASS = {
  directions: ["N", "NW", "W", "SW", "S", "SE", "E", "NE"],
  step: 360,
  animationDuration: 650,
  mouseDrift: 30,
  bar: {
    id: "compass", tag: "nav", className: "compass-bar",
    attributes: { "aria-label": "Landscape compass", tabindex: "0" },
    layout: { position: "fixed", bottom: 0, left: 0, width: "100%", height: `${SCENE.compassHeight}px`, zIndex: 999 },
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
