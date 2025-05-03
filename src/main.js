import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xafafaf);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-2, 3, 2);
const defaultCameraPosition = camera.position.clone();

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 2, 2);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

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
const texture = textureLoader.load('/textures/texture3.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);

// Env Map
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  '/2/px.jpg', '/2/nx.jpg',
  '/2/py.jpg', '/2/ny.jpg',
  '/2/pz.jpg', '/2/nz.jpg',
]);
scene.environment = envMap;

// Plane
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  roughness: 0.7,
  metalness: 0.1,
});
const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
plane.receiveShadow = true;
scene.add(plane);

// GUI
const gui = new GUI();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Variables
let model;
const modelMaterials = [];
let shadowsOn = true;
let allowRotation = true;

// Load model
const loader = new GLTFLoader();
loader.load('/model/can.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5);
  model.position.set(0, -0.5, 0);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.7,
        map: texture,
        envMap: envMap,
        envMapIntensity: 1.2,
        clearcoat: 0.4,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
        ior: 1.4,
      });
      modelMaterials.push(child.material);
    }
  });

  scene.add(model);
});

// Animate
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

// UI Elements
const toggleBtn = document.getElementById('toggleShadows');
const glossyBtn = document.getElementById('increaseGloss');
const roughBtn = document.getElementById('increaseRough');
const frontBtn = document.getElementById('frontView');
const backBtn = document.getElementById('backView');
const intensitySlider = document.getElementById('lightIntensity');
const colorInput = document.getElementById('colorInput');
const rotationToggle = document.getElementById('rotationToggle');

// Event Listeners
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    shadowsOn = !shadowsOn;
    renderer.shadowMap.enabled = shadowsOn;
    directionalLight.castShadow = shadowsOn;
    plane.receiveShadow = shadowsOn;
    if (model) {
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = shadowsOn;
          child.receiveShadow = shadowsOn;
        }
      });
    }
  });
}

if (glossyBtn) {
  glossyBtn.addEventListener('click', () => {
    modelMaterials.forEach((mat) => {
      Object.assign(mat, {
        metalness: 0.7,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
        ior: 1.6,
        envMapIntensity: 2.0,
        needsUpdate: true,
      });
    });
  });
}

if (roughBtn) {
  roughBtn.addEventListener('click', () => {
    modelMaterials.forEach((mat) => {
      Object.assign(mat, {
        metalness: 0.0,
        roughness: 1.0,
        clearcoat: 0.0,
        clearcoatRoughness: 1.0,
        reflectivity: 0.0,
        ior: 1.0,
        envMapIntensity: 0.5,
        needsUpdate: true,
      });
    });
  });
}

if (frontBtn) {
  frontBtn.addEventListener('click', () => {
    camera.position.set(0, 2, 3);
    controls.target.set(0, 1, 0);
  });
}

if (backBtn) {
  backBtn.addEventListener('click', () => {
    camera.position.set(0, 2, -3);
    controls.target.set(0, 1, 0);
  });
}

if (intensitySlider) {
  intensitySlider.addEventListener('input', (e) => {
    directionalLight.intensity = parseFloat(e.target.value);
  });
}

if (colorInput) {
  colorInput.addEventListener('input', (e) => {
    modelMaterials.forEach((mat) => mat.color.set(e.target.value));
  });
}

if (rotationToggle) {
  rotationToggle.addEventListener('click', () => {
    allowRotation = !allowRotation;
    controls.enableRotate = allowRotation;
    if (!allowRotation) {
      camera.position.copy(defaultCameraPosition);
      controls.target.set(0, 0, 0);
    }
  });
}