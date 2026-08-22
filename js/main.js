import { MinimalistPlushWorld } from './scene.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-canvas-container');
  const world = new MinimalistPlushWorld(container);
});
