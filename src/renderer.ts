import * as THREE from 'three';

export interface RendererContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  skyDome: THREE.Mesh;
  createMaterial: (color: THREE.ColorRepresentation, options?: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  createCanvasTexture: (width: number, height: number, draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void) => THREE.CanvasTexture;
  updateSunPosition: (trainZ: number) => void;
  resize: () => void;
}

export function setupRenderer(container: HTMLElement): RendererContext {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Ultra-Realistic Soft Shadow Mapping
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc2ddf5, 0.00038); // Atmospheric horizon aerial perspective

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 4000);

  // Balanced Indian Tropical Hemisphere Lighting
  const hemiLight = new THREE.HemisphereLight(0xd5e8ff, 0x4d5538, 0.95);
  scene.add(hemiLight);

  // Warm Directional Sunlight with Cascaded Soft Shadows
  const sun = new THREE.DirectionalLight(0xfff3de, 1.6);
  sun.position.set(-180, 260, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 700;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Procedural Helper Functions
  const createMaterial = (
    color: THREE.ColorRepresentation,
    options?: THREE.MeshStandardMaterialParameters
  ): THREE.MeshStandardMaterial => {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05,
      ...(options || {})
    });
  };

  const createCanvasTexture = (
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  ): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      draw(ctx, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return texture;
  };

  // Panoramic Atmospheric Sky Dome (Deep tropical azure zenith fading to warm golden horizon haze)
  const skyTexture = createCanvasTexture(1024, 512, (c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#104c94'); // Deep royal azure zenith
    grad.addColorStop(0.35, '#2e75bc');
    grad.addColorStop(0.65, '#6da8db');
    grad.addColorStop(0.85, '#aed0ed');
    grad.addColorStop(1.0, '#e0edf8'); // Warm golden-cyan horizon haze
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    // Subtle sun flare glow on horizon
    const sunGlow = c.createRadialGradient(w * 0.45, h * 0.72, 10, w * 0.45, h * 0.72, 140);
    sunGlow.addColorStop(0.0, 'rgba(255, 252, 230, 0.65)');
    sunGlow.addColorStop(0.4, 'rgba(255, 240, 200, 0.25)');
    sunGlow.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    c.fillStyle = sunGlow;
    c.beginPath();
    c.arc(w * 0.45, h * 0.72, 140, 0, Math.PI * 2);
    c.fill();
  });

  const skyGeo = new THREE.SphereGeometry(2800, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    fog: false
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  const updateSunPosition = (trainZ: number) => {
    // Keep sun shadow frustum centered around the train
    sun.position.set(-180, 260, trainZ - 120);
    sun.target.position.set(0, 0, trainZ + 20);
    sun.target.updateMatrixWorld();
    skyDome.position.z = trainZ;
  };

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    sun,
    hemiLight,
    skyDome,
    createMaterial,
    createCanvasTexture,
    updateSunPosition,
    resize
  };
}
