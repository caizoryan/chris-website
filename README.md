# Steinkampf Audio — c4

A static, horizontally scrolling parallax landscape. No build step or runtime dependencies.

## Run and check

From this directory:

```sh
npm start        # http://127.0.0.1:4174 (requires Python 3)
npm test         # Node.js 20.12+; no npm install required
```

Use the wheel, horizontal touch/trackpad scrolling, arrow keys, or drag the compass.

## Layout

```text
index.html
assets/
  scene/         # Artwork used by the live landscape
  projects/      # Artwork used by the Projects dialog
src/
  script.js       # Application bootstrap
  scene-config.js # Scene objects, coordinates, depth, heading and compass settings
  element.js      # Object → DOM renderer and shared transform math
  scene.js        # Scene construction and generic parallax updates
  navigation.js   # Wheel, pointer, compass and keyboard navigation
  dialogs.js      # Projects/reel definitions, actions and focus handling
  project-data.js # Project image URLs and captions
styles/
  site.css       # Appearance, interactive states and responsive UI flow
tests/
  scene.test.js  # Asset, configuration, positioning and transform checks
archive/         # Inactive material; never imported by the running site
```

## Edit the scene

Change **`src/scene-config.js`**, not CSS selectors. Each element describes:

- `id`, tag, class, image `src` and accessible `alt` text.
- `layout`: position, size, stacking and any local transform.
- `parallax`: depth and optional endpoint anchoring.
- `children`: artwork and controls that inherit the parent's movement.
- `action`: the named interaction to run when clicked.

Numeric layout coordinates use **1% of the visible landscape height**. Strings
retain their CSS units, so child hitboxes can use percentages and the compass can
use pixels. Unitless values such as `zIndex` remain unitless.

```js
image("robot", "robot.png", {
  left: 36, bottom: 12, width: 33, zIndex: 4,
}, {
  alt: "Robot",
  parallax: { depth: 0.12 },
})
```

The renderer returns an instance with `config`, `element`, and `children`, stored
in an ID-keyed registry. Parallax iterates those instances, and dialogs find their
triggers through the same definitions. Adding a scene element does not require
another transform call or a positioning rule in CSS.

A depth of `0` moves with the ground; positive depth slows apparent movement.
Negative depth moves faster. `anchor: "end"` aligns shared-canvas artwork at the
right endpoint (the astronaut and canyon).

### Horizon and repetitions

`SCENE.horizon` and the mountains' source-image anchor position the **visible
ridge**, not the transparent PNG canvas, at the sky/land boundary. The mountain
strip repeats across the entire scene, including behind the heron/portal.

The active background SVG is a cropped, seam-free half of the original two-copy
SVG. Alternating copies are mirrored to join matching horizon edges. The
unmodified source is retained in `archive/artwork/background-original.svg`.

## Notes

- Files use lowercase kebab-case. Similar project roles have numeric suffixes.
- Original artwork, reference material, unused fonts and old utilities are
  preserved under `archive/`; see its README.
- The heading uses the existing Adobe Fonts stylesheet, with a system-font fallback.
  The reel loads YouTube only when opened and unloads when closed.
- On the signpost, Projects animates to the portal's Projects button and Contact
  animates to the end of the landscape. Demo Reel opens its dialog directly.
