import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class MinimalistPlushWorld {
  constructor(container) {
    this.container = container;
    this.width = Math.max(container.clientWidth, 1);
    this.height = Math.max(container.clientHeight, 1);
    
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.targetMouse = new THREE.Vector2(0.5, 0.5);
    
    this.customUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    };
    
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.width <= 900 ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; 
    
    this.container.appendChild(this.renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.load('./assets/hero_hd.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      
      this.createPlushPlane(texture);
    });

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
    window.addEventListener('pointermove', this.onMouseMove.bind(this), { passive: true });

    this.clock = new THREE.Clock();
    this.animate();
  }

  createPlushPlane(texture) {
    // Increased subdivisions for smoother, deeper waves
    this.geometry = new THREE.PlaneGeometry(16, 9, 128, 128); 

    this.material = new THREE.MeshBasicMaterial({ 
      map: texture,
      side: THREE.DoubleSide
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.customUniforms.uTime;
      shader.uniforms.uMouse = this.customUniforms.uMouse;

      shader.vertexShader = `
        uniform float uTime;
        uniform vec2 uMouse;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        `#include <begin_vertex>`,
        `
        #include <begin_vertex>
        
        // Intensified wave effect (faster and deeper)
        float waveX = sin(position.x * 1.2 + uTime * 1.5) * 0.2;
        float waveY = cos(position.y * 1.2 + uTime * 1.2) * 0.2;
        
        // Edge mask to prevent pulling the texture away from the screen edges
        // using pow() to make the "safe" anchoring zone smaller and closer to the very edges
        float edgeMask = pow(sin(uv.x * 3.1415), 0.5) * pow(sin(uv.y * 3.1415), 0.5);
        
        // Stronger mouse interaction
        float dist = distance(uv, uMouse);
        float push = exp(-dist * 5.0) * 0.5; // Wider radius, much deeper push
        
        // Apply movement
        transformed.z += (waveX + waveY + push) * edgeMask;
        `
      );
    };

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    
    this.updatePlaneScale();
  }

  updatePlaneScale() {
    if (!this.mesh) return;
    
    const viewportAspect = this.width / this.height;
    const imageAspect = 16 / 9;
    
    const vFov = (this.camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * this.camera.position.z;
    const visibleWidth = visibleHeight * viewportAspect;
    
    let scale = viewportAspect > imageAspect ? visibleWidth / 16 : visibleHeight / 9;
    
    // Slight overscan to hide any deeper wave gaps at the very edge
    scale *= 1.06;
    
    this.mesh.scale.set(scale, scale, scale);
  }

  onMouseMove(event) {
    const bounds = this.container.getBoundingClientRect();
    this.targetMouse.x = THREE.MathUtils.clamp((event.clientX - bounds.left) / this.width, 0, 1);
    this.targetMouse.y = 1.0 - THREE.MathUtils.clamp((event.clientY - bounds.top) / this.height, 0, 1);
  }

  onResize() {
    this.width = Math.max(this.container.clientWidth, 1);
    this.height = Math.max(this.container.clientHeight, 1);
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.width <= 900 ? 1.5 : 2));
    this.renderer.setSize(this.width, this.height);
    
    this.updatePlaneScale();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const time = this.clock.getElapsedTime();
    this.mouse.lerp(this.targetMouse, 0.08); // Slightly faster mouse follow

    this.customUniforms.uTime.value = time;
    this.customUniforms.uMouse.value.copy(this.mouse);
    
    const mouseX = (this.mouse.x - 0.5) * 2;
    const mouseY = (this.mouse.y - 0.5) * 2;
    
    if (this.mesh) {
        // Increased parallax rotation
        this.mesh.rotation.y = mouseX * 0.06;
        this.mesh.rotation.x = -mouseY * 0.06;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
