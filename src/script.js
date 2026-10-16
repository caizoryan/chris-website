import { createScene } from "./scene.js";
import { createDialogs } from "./dialogs.js";
import { createNavigation } from "./navigation.js";

// Bootstrap only: definitions, rendering, dialogs and navigation live in their
// own modules. Nothing here needs to know an individual artwork's coordinates.
const dialogs = createDialogs();
const scene = createScene({
  ...dialogs.actions,
  navigate: ({ config }) => navigation.scrollTo(config.destination),
});
const navigation = createNavigation(scene, () => dialogs.isOpen);

document.body.append(scene.page, scene.title, navigation.element, ...dialogs.elements);
dialogs.connect(scene.registry, [scene.page, navigation.element]);
scene.updateParallax();
navigation.refresh();
