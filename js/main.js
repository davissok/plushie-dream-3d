import { MinimalistPlushWorld } from './scene.js?v=responsive-1';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-canvas-container');
  const stage = document.querySelector('.scene-stage');
  const compactLayout = window.matchMedia('(max-width: 900px)');

  // Keep the immersive background on desktop and a dedicated image on mobile.
  const placeScene = () => {
    if (compactLayout.matches) {
      stage.appendChild(container);
    } else {
      document.body.prepend(container);
    }
  };

  placeScene();
  compactLayout.addEventListener('change', placeScene);

  // The CSS image remains visible on devices without WebGL support.
  try {
    new MinimalistPlushWorld(container);
  } catch (error) {
    console.warn('Using the static collection image because WebGL is unavailable.', error);
  }
});
