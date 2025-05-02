import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 1);
scene.background = new THREE.Color(0xafafaf);

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

// Texture loading
const textureLoader = new THREE.TextureLoader();
const color = textureLoader.load('/textures/diff.jpg');
const normal = textureLoader.load('/textures/normal.jpg');
const displacement = textureLoader.load('/textures/displacement.jpg');

// Plane Material
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  roughness: 0.7,
  metalness: 0.1,
});

// Plane Creation
const planeGeometry = new THREE.PlaneGeometry(5, 5);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5; // Position it below the model
plane.receiveShadow = true;
scene.add(plane);

// Model loading
const loader = new GLTFLoader();
let modelMaterials = []; // 👈 Store all model materials for GUI control

loader.load('/model/model.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5);
  model.position.set(0, 1, 0);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Assign material with textures to the model
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5,
        map: color,
        normalMap: normal,
        displacementMap: displacement,
        displacementScale: 0.1,
        displacementBias: -0.05,
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
// GUI
const gui = new GUI();

// Model Material Control
const modelMaterialOptions = {
  metalness: 0.5,
  roughness: 0.5
};

const modelMaterialFolder = gui.addFolder('Model Material');
modelMaterialFolder.add(modelMaterialOptions, 'metalness', 0, 1, 0.01).onChange((val) => {
  // Update only model materials
  modelMaterials.forEach((mat) => {
    mat.metalness = val;
  });
});
modelMaterialFolder.add(modelMaterialOptions, 'roughness', 0, 1, 0.01).onChange((val) => {
  // Update only model materials
  modelMaterials.forEach((mat) => {
    mat.roughness = val;
  });
});
modelMaterialFolder.open();

// Plane Material Control (removed, not needed for model controls)


// Directional Light Control
const directionalLightFolder = gui.addFolder('Directional Light');
directionalLightFolder.add(directionalLight, 'intensity', 0, 10, 0.1).name('Intensity');
directionalLightFolder.add(directionalLight.position, 'x', -10, 10, 0.1).name('X Position');
directionalLightFolder.add(directionalLight.position, 'y', -10, 20, 0.1).name('Y Position');
directionalLightFolder.add(directionalLight.position, 'z', -10, 10, 0.1).name('Z Position');
directionalLightFolder.open();

// Camera controls
gui.add({ frontView: () => camera.position.set(0, 0, 1) }, 'frontView').name('Front View');
gui.add({ backView: () => camera.position.set(0, 0, -1) }, 'backView').name('Back View');
