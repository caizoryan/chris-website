import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";
import { SCENE, COMPASS, landscape, heading, sceneElements } from "../src/scene-config.js";
import { dialogDefinitions } from "../src/dialogs.js";
import { createElement, layoutValue, parallaxOffset } from "../src/element.js";
import { centeredScrollPosition } from "../src/navigation.js";

const flatten = (nodes) => nodes.flatMap(node => [node, ...flatten(node.children ?? [])]);
const definitions = flatten([landscape, heading, ...dialogDefinitions]);
const find = (id) => definitions.find(node => node.id === id);

test("element ids are unique and all active artwork exists", () => {
  const ids = definitions.map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const definition of definitions) {
    if (!definition.src) continue;
    assert(existsSync(new URL(definition.src)), definition.src);
    assert(!definition.src.includes("/archive/"), "The live scene must not depend on archive/");
    assert.match(fileURLToPath(definition.src).split("/").at(-1), /^[a-z0-9-]+\.(png|jpe?g|svg)$/);
  }
});

test("every file in assets/ is referenced by an active element", () => {
  const referenced = new Set(definitions.filter(node => node.src).map(node => fileURLToPath(node.src)));
  const assets = new URL("../assets/", import.meta.url);
  for (const file of readdirSync(assets, { recursive: true, withFileTypes: true })) {
    if (!file.isFile() || file.name.startsWith(".")) continue;
    const path = join(file.parentPath, file.name);
    assert(referenced.has(path), `Unused active asset: ${path}`);
  }
});

test("all top-level artwork carries its own parallax and layout", () => {
  for (const element of sceneElements) {
    assert.equal(typeof element.parallax.depth, "number", element.id);
    assert.equal(element.layout.position, "absolute", element.id);
    assert.equal(typeof element.layout.zIndex, "number", element.id);
  }
  assert(SCENE.width > SCENE.height);
  assert.equal(COMPASS.directions.length, 8);
});

test("mountains cover the entire world, including the portal, at the horizon", () => {
  const mountains = find("mountains");
  assert(!mountains.style?.maskImage, "There must not be a portal-area mountain mask");
  const tiles = mountains.children;
  assert.equal(tiles.length, 3);
  assert.equal(tiles[0].layout.left, 0);
  for (const tile of tiles) {
    const ridgeFoot = tile.layout.top + tile.layout.width * 1335 / 6713;
    assert(Math.abs(ridgeFoot - SCENE.horizon) < 0.001);
  }
  assert(tiles.at(-1).layout.left + tiles.at(-1).layout.width >= SCENE.width);
});

test("portal controls and bird remain children of their moving artwork", () => {
  assert(find("rock-portal").children.some(node => node.id === "portal-projects"));
  assert(find("planets").children.some(node => node.id === "bird"));
  assert.equal(find("portal-projects").action, "open:projects-modal");
  assert.equal(find("signpost-projects").action, "navigate");
  assert.equal(find("signpost-projects").destination, "portal-projects");
  assert.equal(find("signpost-contact").action, "navigate");
  assert.equal(find("signpost-contact").destination, "end");
  assert.equal(find("signpost-projects").attributes["aria-expanded"], undefined);
  assert.equal(find("signpost-demo-reel").action, "open:demo-reel-modal");
  for (const id of ["portal-projects", "bird", "signpost-projects"]) {
    assert.equal(find(id).parallax, undefined, "Children inherit their parent's movement");
  }
});

test("landmark centering accounts for parallax and clamps to scene bounds", () => {
  assert.equal(centeredScrollPosition({ scrollLeft: 1000, centerOffset: 900, depth: 0.1, maxScroll: 5000 }), 2000);
  assert.equal(centeredScrollPosition({ scrollLeft: 3000, centerOffset: -900, depth: 0.1, maxScroll: 5000 }), 2000);
  assert.equal(centeredScrollPosition({ scrollLeft: 0, centerOffset: -900, depth: 0.1, maxScroll: 5000 }), 0);
  assert.equal(centeredScrollPosition({ scrollLeft: 4500, centerOffset: 900, depth: 0.1, maxScroll: 5000 }), 5000);
  assert.equal(centeredScrollPosition({ scrollLeft: 1000, centerOffset: 900, depth: 1, maxScroll: 5000 }), 1000);
});

test("scene units, percentages and unitless layout properties are preserved", () => {
  assert.equal(layoutValue("left", 36), "calc(36 * var(--scene-unit))");
  assert.equal(layoutValue("left", "55%"), "55%");
  assert.equal(layoutValue("top", "-1px"), "-1px");
  assert.equal(layoutValue("zIndex", 4), "4");
});

test("object renderer retains definitions, DOM nodes, child instances and actions", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag, style: {}, attributes: new Map(), listeners: new Map(),
        setAttribute(name, value) { this.attributes.set(name, value); },
        addEventListener(name, listener) { this.listeners.set(name, listener); },
        append(...children) { this.children = children; },
      };
    },
  };
  try {
    const registry = new Map();
    let clicked;
    const config = {
      id: "test-parent", layout: { left: 36, zIndex: 4 },
      children: [{
        id: "test-button", tag: "button", text: "Projects", action: "open",
        layout: { left: "55%" }, attributes: { type: "button" },
      }],
    };
    const instance = createElement(config, { registry, actions: { open: node => { clicked = node; } } });
    assert.equal(instance.config, config);
    assert.equal(registry.get(config.id), instance);
    assert.equal(instance.element.style.left, "calc(36 * var(--scene-unit))");
    assert.equal(instance.element.style.zIndex, "4");
    assert.equal(instance.element.children[0], instance.children[0].element);
    assert.equal(instance.children[0].config, config.children[0]);
    instance.children[0].element.listeners.get("click")();
    assert.equal(clicked, instance.children[0]);
    assert.throws(() => createElement(config, { registry }), /Duplicate element id/);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("generic parallax handles ordinary and endpoint-anchored elements", () => {
  assert.equal(parallaxOffset({ depth: 0.2 }, 1000, 5000), 200);
  assert.equal(parallaxOffset({ depth: 0 }, 1000, 5000), 0);
  assert.equal(parallaxOffset({ depth: -0.04, anchor: "end" }, 1000, 5000), 160);
  assert.equal(Math.abs(parallaxOffset({ depth: -0.04, anchor: "end" }, 5000, 5000)), 0);
});

test("no scene coordinates or obsolete selectors remain in CSS", () => {
  const css = readFileSync(new URL("../styles/site.css", import.meta.url), "utf8");
  assert(!/(?:^|[;{])\s*(?:left|right|top|bottom|inset|z-index|position)\s*:/.test(css));
  for (const oldSelector of [".rocksTop", ".rocksBottom", ".mountain-layer", ".grey-box", ".menu__label"]) {
    assert(!css.includes(oldSelector), oldSelector);
  }
});
