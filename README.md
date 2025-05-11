# 🥫 Three.js Assngs

An interactive 3D product viewer built using **Three.js**, with real-time customization controls for color, gloss, roughness, texture tiling, and more. Fully controllable via a sleek UI panel — like Blender, but in the browser.
---

## 🚀 Features

- Toggle shadows (on/off)
- Glossy vs rough material toggle
- Front and back camera views
- Live hex color input (`#ff0000`, `blue`, etc.)
- Texture tiling control (X, Y scaling)
- Texture rotation (radians)
- Model auto-rotation toggle
- Built-in OrbitControls for pan/zoom/rotate

---

## 🛠️ Tech Stack

- [Three.js](https://threejs.org/) – Core 3D rendering
- [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) – For loading .glb model
- [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) – Mouse interactions
- Vanilla JavaScript – UI logic
- HTML + CSS – UI and layout

---

## 📁 Folder Structure

```bash
├── public/
│   ├── model/
│   │   └── can.glb
│   └── textures/
│       └── texture2.png
├── src/
│   ├── main.js
│   └── style.css
├── index.html
├── README.md
└── vite.config.js (if using Vite)
