const project = (id, file, caption) => ({
  id,
  src: new URL(`../assets/projects/${file}`, import.meta.url).href,
  caption,
});

export const projects = [
  project("foley-editor-01", "sound-designer-foley-editor.png", "Sound Designer - Foley Editor"),
  project("foley-editor-02", "sound-designer-foley-editor-02.jpeg", "Sound Designer - Foley Editor"),
  project("sound-designer-01", "sound-designer.jpeg", "Sound Designer"),
  project("dialogue-sound-music", "dialogue-editor-sound-designer-music-editor.jpg", "Dialogue Editor - Sound Designer - Music Editor"),
  project("foley-editor", "foley-editor.jpg", "Foley Editor"),
  project("sound-designer-02", "sound-designer-02.jpg", "Sound Designer"),
  project("composer", "composer-sound-designer-technical-sound-designer.png", "Composer - Sound Designer - Technical Sound Designer"),
  project("sound-librarian", "sound-designer-sound-librarian.png", "Sound Designer - Sound Librarian"),
  project("dialogue-recordist-editor", "dialogue-recordist-dialogue-editor.png", "Dialogue Recordist - Dialogue Editor"),
  project("dialogue-recordist", "dialogue-recordist.jpg", "Dialogue Recordist"),
  project("foley-artist", "sound-designer-foley-artist.png", "Sound Designer - Foley Artist"),
  project("dialogue-editor", "dialogue-editor.jpg", "Dialogue Editor"),
];
