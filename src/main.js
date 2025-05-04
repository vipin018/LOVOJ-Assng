import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xafafaf);

const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera);

const isMobile = window.innerWidth < 768;
const defaultDesktopCamPos = new THREE.Vector3(0.5, 1, -4);
const defaultMobileCamPos = new THREE.Vector3(0.5, 1, -5);

// set initial camera pos
camera.position.copy(isMobile ? defaultMobileCamPos : defaultDesktopCamPos);
const defaultCameraPosition = camera.position.clone();

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
  if (!document.fullscreenElement && canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  }
});

// Texture loading
const textureLoader = new THREE.TextureLoader();

const texture = textureLoader.load('/textures/texture2.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);
texture.center.set(0.5, 0.5);

const texture2 = textureLoader.load('/textures/texture2.png');
texture2.colorSpace = THREE.SRGBColorSpace;
texture2.wrapS = THREE.RepeatWrapping;
texture2.wrapT = THREE.RepeatWrapping;
texture2.repeat.set(1, 1);
texture2.center.set(0.5, 0.5);


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
const colorInput = document.getElementById('colorInput');
const rotationToggle = document.getElementById('rotationToggle');
const tileXInput = document.getElementById('tileX');
const tileYInput = document.getElementById('tileY');
const rotationInput = document.getElementById('rotation');
const texture1Btn = document.getElementById('texture1Btn');
const texture2Btn = document.getElementById('texture2Btn');

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
      gsap.to(mat, {
        duration: 1,
        metalness: 0.7,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
        ior: 1.6,
        envMapIntensity: 2.0,
        onUpdate: () => { mat.needsUpdate = true; }
      });
    });
  });
}

if (roughBtn) {
  roughBtn.addEventListener('click', () => {
    modelMaterials.forEach((mat) => {
      gsap.to(mat, {
        duration: 1,
        metalness: 0.0,
        roughness: 1.0,
        clearcoat: 0.0,
        clearcoatRoughness: 1.0,
        reflectivity: 0.0,
        ior: 1.0,
        envMapIntensity: 0.5,
        onUpdate: () => { mat.needsUpdate = true; }
      });
    });
  });
}


if (frontBtn) {
  frontBtn.addEventListener('click', () => {
    const camPos = window.innerWidth < 768 ? { x: 0.5, y: 1, z: -5 } : { x: 0, y: 1, z: -5 };
    gsap.to(camera.position, {
      duration: 1,
      ...camPos,
      onUpdate: () => controls.update()
    });
  });
}

if (backBtn) {
  backBtn.addEventListener('click', () => {
    const camPos = window.innerWidth < 768 ? { x: 0.5, y: 1, z: 5 } : { x: 0, y: 1, z: 5 };
    gsap.to(camera.position, {
      duration: 1,
      ...camPos,
      onUpdate: () => controls.update()
    });
  });
}


if (colorInput) {
  colorInput.addEventListener('input', (e) => {
    modelMaterials.forEach((mat) => {
      gsap.to(mat.color, {
        duration: 0.5,
        ...new THREE.Color(e.target.value)
      });
    });
  });
}


if (rotationToggle) {
  rotationToggle.addEventListener('click', () => {
    allowRotation = !allowRotation;
    controls.enableRotate = allowRotation;
    if (!allowRotation) {
      const pos = window.innerWidth < 768 ? defaultMobileCamPos : defaultDesktopCamPos;
      gsap.to(camera.position, {
        duration: 1,
        x: pos.x, y: pos.y, z: pos.z,
        onUpdate: () => controls.update()
      });
      gsap.to(controls.target, {
        duration: 1,
        x: 0, y: 0, z: 0,
        onUpdate: () => controls.update()
      });
    }
  });
}


if (tileXInput) {
  tileXInput.addEventListener('input', () => {
    gsap.to(texture.repeat, { duration: 0.5, x: parseFloat(tileXInput.value) });
  });
}

if (tileYInput) {
  tileYInput.addEventListener('input', () => {
    gsap.to(texture.repeat, { duration: 0.5, y: parseFloat(tileYInput.value) });
  });
}

if (rotationInput) {
  rotationInput.addEventListener('input', () => {
    gsap.to(texture, { duration: 0.5, rotation: parseFloat(rotationInput.value) });
  });
}


const dropdownToggle = document.querySelector('.dropdown-toggle');
const controlsMenu = document.querySelector('.controls');

dropdownToggle.addEventListener('click', () => {
  controlsMenu.classList.toggle('show');
});
