import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 1);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Fullscreen toggle
window.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Model loading
const loader = new GLTFLoader();
let modelMaterials = []; // 👈 Store all model materials for GUI control

loader.load('/model/statue.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.1, 0.1, 0.1);
  model.position.set(0, -0.5, 0);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5
      });
      modelMaterials.push(child.material);
    }
  });

  scene.add(model);
});

// Animation loop
const clock = new THREE.Clock();
const animate = () => {
  renderer.render(scene, camera);
  controls.update();
  requestAnimationFrame(animate);
};
animate();

// GUI
const gui = new GUI();

const shadowOptions = { shadows: true };
gui.add(shadowOptions, 'shadows').name("Toggle Shadows").onChange((enabled) => {
  renderer.shadowMap.enabled = enabled;
  directionalLight.castShadow = enabled;
  floor.receiveShadow = enabled;
});

const materialOptions = {
  metalness: 0.5,
  roughness: 0.5
};

const materialFolder = gui.addFolder('Model Material');
materialFolder.add(materialOptions, 'metalness', 0, 1, 0.01).onChange((val) => {
  modelMaterials.forEach((mat) => (mat.metalness = val));
});
materialFolder.add(materialOptions, 'roughness', 0, 1, 0.01).onChange((val) => {
  modelMaterials.forEach((mat) => (mat.roughness = val));
});
materialFolder.open();

const directionalLightFolder = gui.addFolder('Directional Light');

// Add sliders for x, y, z position individually
directionalLightFolder.add(directionalLight, 'intensity', 0, 10, 0.1).name('Intensity');
directionalLightFolder.add(directionalLight.position, 'x', -10, 10, 0.1).name('X Position');
directionalLightFolder.add(directionalLight.position, 'y', -10, 20, 0.1).name('Y Position');
directionalLightFolder.add(directionalLight.position, 'z', -10, 10, 0.1).name('Z Position');

directionalLightFolder.open();