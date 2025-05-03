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

const texture2 = textureLoader.load('/textures/texture.png');
texture2.colorSpace = THREE.SRGBColorSpace;
texture2.wrapS = THREE.RepeatWrapping;
texture2.wrapT = THREE.RepeatWrapping;
texture2.repeat.set(1, 1);

const texture3 = textureLoader.load('/textures/texture3.png');
texture3.colorSpace = THREE.SRGBColorSpace;
texture3.wrapS = THREE.RepeatWrapping;
texture3.wrapT = THREE.RepeatWrapping;
texture3.repeat.set(1, 1);

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
        map: texture2,
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
const colorInput = document.getElementById('colorInput');
const rotationToggle = document.getElementById('rotationToggle');
const texture1Btn = document.getElementById('texture1');
const texture2Btn = document.getElementById('texture2');

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

if (backBtn) {
  backBtn.addEventListener('click', () => {
    camera.position.set(0, 1, 3);
    controls.target.set(0, 1, 0);
  });
}

if (frontBtn) {
  frontBtn.addEventListener('click', () => {
    camera.position.set(0, 1, -3);
    controls.target.set(0, 1, 0);
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

// 🌟 Texture Switching via Image Buttons
if (texture1Btn) {
  texture1Btn.addEventListener('click', () => {
    modelMaterials.forEach((mat) => {
      mat.map = texture2;
      mat.needsUpdate = true;
    });
  });
}

if (texture2Btn) {
  texture2Btn.addEventListener('click', () => {
    modelMaterials.forEach((mat) => {
      mat.map = texture3;
      mat.needsUpdate = true;
    });
  });
}
