# Developer Specification: Wolfenstein 3D–Inspired FPS

## 1. Project Overview

**Concept:**  
Develop a first-person shooter inspired by Wolfenstein 3D, targeted for modern desktop browsers. The game combines classic maze-like levels, hit-scan combat, and straightforward enemy AI with modern visual enhancements, dynamic lighting, high-resolution textures, and post-processing effects. The game is session-based (no save/load), with handcrafted levels defined using a grid-based layout, and features a HUD that displays health, ammo, keys, and score.

---

## 2. Requirements

### Gameplay Features

- **Player Movement & Controls:**

  - Classic WASD movement with mouse look (using pointer lock).
  - Collision detection prevents passing through walls.
  - Game-over state when health reaches zero, with a restart option.

- **Combat:**

  - **Player Shooting:**
    - Implemented via hit-scan using Three.js’s Raycaster.
    - Immediate damage and visual feedback (e.g., muzzle flash, impact sparks).
  - **Enemy Shooting:**
    - Enemies also use hit-scan shooting toward the player with cooldowns.

- **Enemy AI:**

  - States: Idle, Chase, Attack, and Death.
  - Enemies remain idle until the player is in detection range, then chase and attack with hit-scan shooting.
  - On death, trigger animations and remove enemies from active gameplay.

- **Interactive Objects:**

  - Keys, switches, doors, and secret passages.
  - Trigger zones using collision detection; when collided, update game state (e.g., collect key, open door).
  - Door animations via AnimationMixer or tweening.

- **Weapon Management & Pickups:**

  - Weapon switching via key mapping (e.g., 1=pistol, 2=machine gun, 3=shotgun).
  - Collision-based pickups for health, ammo, and keys that update game state.

- **HUD & Scoring:**

  - Overlay displaying player health, ammo count, keys collected, and score.
  - Score based on enemy kills and level completion time.
  - Real-time state updates using a global state manager.

- **Level Design:**

  - Handcrafted, maze-like levels defined by a grid-based layout.
  - Levels represented as 2D arrays or JSON files mapping cells (e.g., 0 = empty, 1 = wall, 2 = door, 3 = key).
  - Parsing these grids to instantiate corresponding 3D objects in the scene.
  - Static geometry for walls and floors integrated with physics for collision.

- **Visual & Audio Enhancements:**
  - Dynamic lighting (directional, ambient, point lights) with shadows.
  - High-resolution textures using PBR materials, normal/bump maps.
  - Post-processing effects (bloom, tone mapping, SSAO, vignette) via react-postprocessing.
  - Particle effects for muzzle flashes, impact sparks, and enemy death animations.
  - Spatial sound effects (no background music).

### Technical Requirements

- **Target Platforms:**  
  Modern desktop browsers.

- **Performance:**
  - Asynchronous asset loading using Suspense and react-three-fiber’s useLoader.
  - Optimization through texture compression, glTF asset optimization (gltf-pipeline or glTF-Transform), and potential texture atlasing.

---

## 3. Architecture Choices

### Frontend & Rendering

- **Framework:** React with TypeScript.
- **3D Rendering:**
  - **react-three-fiber:** Declarative Three.js integration.
  - **Three.js:** Core rendering engine.
  - **react-three/drei:** Pre-built helpers (camera controls, loaders, debug tools).

### State Management

- **Zustand:**  
  Lightweight, global state manager for player stats, enemy states, inventory, and HUD updates.

### Physics & Collision

- **cannon-es:**  
  Physics engine.
- **@react-three/cannon:**  
  Integration of cannon-es with react-three-fiber to manage collisions for walls, player, and interactive triggers.

### Asset Pipeline

- **Models & Textures:**
  - glTF/glb format for models (with embedded animations).
  - Tools: gltf-pipeline/glTF-Transform for model optimization.
  - Sharp and imagemin for texture compression (WebP/JPEG).
  - Optional: Texture atlasing tools (e.g., TexturePacker).

### UI & Styling

- **CSS Modules:**  
  For scoped, maintainable styling of HUDs, menus, and overlays.

### Build & Deployment

- **Bundler:** Vite (or Create React App with TypeScript) for efficient builds, hot reloading, and module bundling.
- **Deployment:** Static hosting on platforms like Vercel, Netlify, or GitHub Pages.
- **Version Control & CI/CD:** Git with optional GitHub Actions for continuous integration.

---

## 4. Data Handling

### Level Data

- **Format:**  
  Define levels as 2D arrays or JSON files. Example:
  ```json
  {
    "grid": [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 3, 1],
      [1, 0, 1, 0, 1],
      [1, 2, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    "enemies": [{ "position": [2, 1], "type": "grunt" }]
  }
  ```
- **Parsing:**  
  A dedicated React component (e.g., `<LevelGrid>`) loops over the grid, mapping cell values to 3D objects with predefined positions (using a consistent cell size).

### Asset Loading

- **Approach:**  
  Use react-three-fiber’s **useLoader** and React’s **Suspense** to load models and textures asynchronously.
- **Optimization:**  
  Implement texture compression and model optimization as part of the build process.

---

## 5. Error Handling Strategies

### Code-Level Error Handling

- **TypeScript:**  
  Use strict type-checking to prevent runtime errors.
- **Component Boundaries:**  
  Use React error boundaries to catch errors in rendering and display fallback UI if needed.

### Collision & Game State

- **Collision Events:**  
  Wrap collision callbacks (e.g., onCollide in interactive objects) with try/catch to handle unexpected errors without crashing the game loop.
- **State Management:**  
  Ensure Zustand state updates are atomic and validate inputs to avoid inconsistent states.

### Logging & Debugging

- **Browser Console:**  
  Log errors and warnings during development.
- **In-Game Debug Tools:**  
  Integrate tools like react-three/drei’s Stats and Leva for runtime monitoring of performance and state.
- **Optional:**  
  Integrate an error tracking service (e.g., Sentry) in production to capture and report runtime errors.

---

## 6. Testing Plan

### Manual Testing

- **Gameplay Testing:**  
  Regularly play through levels to ensure that:
  - Player movement and collision work correctly.
  - Enemy AI transitions (idle, chase, attack, death) perform as expected.
  - Interactive objects (keys, doors, switches) trigger correctly on collision.
  - HUD updates accurately reflect game state.
- **Level Design:**  
  Verify that levels parsed from grid data render correctly and that enemy placements, pickups, and interactive elements are balanced.

### Debugging Tools

- **In-Game Debug Overlays:**  
  Use Stats (FPS) and collision visualization helpers to monitor performance and physics interactions.
- **Leva Panel:**  
  Toggle debug parameters and adjust game variables in real time to fine-tune gameplay.

### Automated Testing (Optional / Future Considerations)

- **Unit Tests:**  
  While initial testing is manual, consider writing unit tests for critical functions (such as level data parsing, state updates in Zustand, and collision callback functions) using Jest.
- **Integration Tests:**  
  For core game logic, you might use React Testing Library to simulate events and verify state changes, though this is secondary given the graphical nature of the project.

---

## 7. Developer Workflow & Milestones

### Setup & Initial Development

- **Environment Setup:**  
  Configure React with TypeScript, react-three-fiber, Zustand, and cannon-es. Ensure Vite (or CRA) is configured for hot reloading and module bundling.
- **Basic Scene & Player:**  
  Develop the basic Three.js scene, implement player movement with collision detection, and set up the camera with pointer lock.
- **Grid-Based Level Prototype:**  
  Create a simple grid-based level using hardcoded data to render walls, doors, and pickups.

### Core Mechanics Implementation

- **Combat System:**  
  Implement hit-scan shooting for the player and enemies using Three.js’s Raycaster.
- **Enemy AI:**  
  Develop the state machine for enemy behavior and integrate basic animations.
- **Interactive Objects:**  
  Integrate collision triggers for keys and doors, updating game state via Zustand.
- **HUD & UI:**  
  Build the HUD overlay using React and CSS Modules; integrate state updates for health, ammo, keys, and score.

### Visual Polish & Enhancements

- **Lighting & Materials:**  
  Enhance the scene with dynamic lighting, shadows, and high-res textures.
- **Post-Processing Effects:**  
  Integrate react-postprocessing for bloom, tone mapping, and ambient occlusion.
- **Particle Effects:**  
  Implement muzzle flashes and impact effects.

### Finalization & Testing

- **Iterative Playtesting:**  
  Conduct thorough manual testing across levels, ensuring smooth gameplay and balanced difficulty.
- **Error Handling & Logging:**  
  Add error boundaries, robust collision handling, and logging mechanisms.
- **Optimization & Deployment:**  
  Optimize asset loading, bundle size, and deploy the game on a static hosting service.
