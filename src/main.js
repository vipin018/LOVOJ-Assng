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
const defaultDesktopCamPos = new THREE.Vector3(-0.25, 0, 0.85);
const defaultMobileCamPos = new THREE.Vector3(0, 0, 1);

camera.position.copy(isMobile ? defaultMobileCamPos : defaultDesktopCamPos);


// loader
const loadingManager = new THREE.LoadingManager();
const loaderElement = document.getElementById('loader');

loadingManager.onLoad = () => {

  loaderElement.classList.add('fade-out');
  setTimeout(() => {
    loaderElement.style.display = 'none';
  }, 1000); 
};

// Texture loading
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

// Lights

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.25);
directionalLight.position.set(1, 2, 2);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.radius = 10;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 5;
directionalLight.shadow.camera.left = -1;
directionalLight.shadow.camera.right = 1;
directionalLight.shadow.camera.top = 1;
directionalLight.shadow.camera.bottom = -1;

scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.5);
spotLight.position.set(0, 2.5, 1);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.3;
scene.add(spotLight);

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
const texture = textureLoader.load('/textures/texture2.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1, 1);
texture.center.set(0.5, 0.5);
texture.rotation = 0;

// Env Map
const envMap = cubeTextureLoader.load([
  '/2/px.jpg', '/2/nx.jpg',
  '/2/py.jpg', '/2/ny.jpg',
  '/2/pz.jpg', '/2/nz.jpg',
]);
scene.environment = envMap;

const roomMaterial = new THREE.MeshStandardMaterial({
  color: "#8D7564",
  roughness: 0.8,
  metalness: 0.1,
  side: THREE.DoubleSide 
});

const roomSize = 3;


const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), roomMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

// Back Wall
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), roomMaterial);
backWall.position.z = -roomSize / 2;
backWall.position.y = roomSize / 2 - 0.5;
scene.add(backWall);

// Left Wall
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), roomMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -roomSize / 2;
leftWall.position.y = roomSize / 2 - 0.5;
scene.add(leftWall);

// Right Wall
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), roomMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = roomSize / 2;
rightWall.position.y = roomSize / 2 - 0.5;
scene.add(rightWall);

// Ceiling
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), roomMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomSize - 0.5;
scene.add(ceiling);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Variables
let model;
const modelMaterials = [];
let shadowsOn = true;
let allowRotation = true;

// Load model
gltfLoader.load('/model/tshirt.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.5, 0.5, 0.5);
  model.position.set(0, -0.5, 0);
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: texture,
        envMap: envMap,
        envMapIntensity: 1.0,
        metalness: 0.0,
        roughness: 0.8,
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

// Event Listeners
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    shadowsOn = !shadowsOn;
    renderer.shadowMap.enabled = shadowsOn;
    directionalLight.castShadow = shadowsOn;
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
        metalness: 0.05, 
        roughness: 0.2, 
        clearcoat: 0.1,
        clearcoatRoughness: 0.1,
        reflectivity: 0.05,
        ior: 1.2,
        envMapIntensity: 1.2,
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
    const camPos = window.innerWidth < 768 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: 1  };
    gsap.to(camera.position, {
      duration: 1,
      ...camPos,
      onUpdate: () => controls.update()
    });
  });
}

if (backBtn) {
  backBtn.addEventListener('click', () => {
    const camPos = window.innerWidth < 768 ? { x: 0, y: 0, z: -1 } : { x: 0, y: 0, z: -1 };
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

// Toggle the dropdown for mobile view, always visible on desktop
dropdownToggle.addEventListener('click', () => {
  if (window.innerWidth < 768) {
    controlsMenu.classList.toggle('show'); 
    if (controlsMenu.classList.contains('show')) {
      dropdownToggle.style.display = 'none'; 
    }
  }
});