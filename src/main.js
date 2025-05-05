// --- Cleaned & Improved T-Shirt Viewer Code ---

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera);

const isMobile = window.innerWidth < 768;
const defaultCamPos = isMobile ? new THREE.Vector3(0, 0.5, 2) : new THREE.Vector3(0, 0.5, 1.5);
camera.position.copy(defaultCamPos);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 3, 4);
dirLight.castShadow = true;
scene.add(dirLight);

// --- Ground Plane ---
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
plane.receiveShadow = true;
scene.add(plane);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- Environment Map ---
const envMap = new THREE.CubeTextureLoader().load([
  '/2/px.jpg', '/2/nx.jpg',
  '/2/py.jpg', '/2/ny.jpg',
  '/2/pz.jpg', '/2/nz.jpg',
]);
scene.environment = envMap;

// --- Textures ---
const textureLoader = new THREE.TextureLoader();
const [defaultTexture, altTexture] = [
  textureLoader.load('/textures/texture3.png'),
  textureLoader.load('/textures/texture2.png'),
];

[defaultTexture, altTexture].forEach(tex => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.center.set(0.5, 0.5);
  tex.repeat.set(1, 1);
});

// --- Load Model ---
let model;
const modelMaterials = [];
new GLTFLoader().load('/model/tshirt.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5);
  model.position.set(0, -0.5, 0);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = child.receiveShadow = true;
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: defaultTexture,
        envMap,
        roughness: 0.8,
        metalness: 0,
      });
      modelMaterials.push(child.material);
    }
  });

  scene.add(model);
});

// --- Animation Loop ---
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

// --- Responsiveness ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

window.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// --- UI Bindings ---
const UI = (id) => document.getElementById(id);

UI('toggleShadows')?.addEventListener('click', () => {
  const toggle = !renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = toggle;
  dirLight.castShadow = toggle;
  plane.receiveShadow = toggle;
  model?.traverse(child => {
    if (child.isMesh) {
      child.castShadow = child.receiveShadow = toggle;
    }
  });
});

UI('increaseGloss')?.addEventListener('click', () => {
  modelMaterials.forEach(mat => {
    gsap.to(mat, {
      roughness: 0.2,
      clearcoat: 0.2,
      reflectivity: 0.1,
      envMapIntensity: 1.5,
      duration: 0.8
    });
  });
});

UI('increaseRough')?.addEventListener('click', () => {
  modelMaterials.forEach(mat => {
    gsap.to(mat, {
      roughness: 1.0,
      clearcoat: 0.0,
      reflectivity: 0.0,
      envMapIntensity: 0.5,
      duration: 0.8
    });
  });
});

UI('frontView')?.addEventListener('click', () => {
  gsap.to(camera.position, {
    x: 0, y: 1, z: 3,
    duration: 1,
    onUpdate: () => controls.update()
  });
});

UI('backView')?.addEventListener('click', () => {
  gsap.to(camera.position, {
    x: 0, y: 1, z: -2,
    duration: 1,
    onUpdate: () => controls.update()
  });
});

UI('colorInput')?.addEventListener('input', (e) => {
  modelMaterials.forEach(mat => mat.color.set(e.target.value));
});

UI('rotationToggle')?.addEventListener('click', () => {
  controls.enableRotate = !controls.enableRotate;
  if (!controls.enableRotate) {
    gsap.to(camera.position, {
      x: defaultCamPos.x,
      y: defaultCamPos.y,
      z: defaultCamPos.z,
      duration: 1,
      onUpdate: () => controls.update()
    });
  }
});

// Get the slider values and update the texture's repeat property
const tileX = document.getElementById('tileX');
const tileY = document.getElementById('tileY');

tileX.addEventListener('input', () => {
  texture.repeat.x = tileX.value;
});

tileY.addEventListener('input', () => {
  texture.repeat.y = tileY.value;
});


const rotationInput = document.getElementById('rotation');

rotationInput.addEventListener('input', () => {
  texture.center.set(0.5, 0.5); // Ensuring the texture rotates around its center
  texture.rotation = rotationInput.value;
});

UI('texture1Btn')?.addEventListener('click', () => {
  modelMaterials.forEach(mat => { mat.map = defaultTexture; mat.needsUpdate = true; });
});

UI('texture2Btn')?.addEventListener('click', () => {
  modelMaterials.forEach(mat => { mat.map = altTexture; mat.needsUpdate = true; });
});

UI('uploadTexture')?.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.center.set(0.5, 0.5);
      modelMaterials.forEach(mat => {
        mat.map = texture;
        mat.needsUpdate = true;
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// --- Dropdown UI ---
UI('dropdownToggle')?.addEventListener('click', () => {
  document.querySelector('.controls')?.classList.toggle('show');
});
