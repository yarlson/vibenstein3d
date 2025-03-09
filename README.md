Below is the updated README with a new, more blunt description as requested:

---

# Vibenstein ThreeD

Vibenstein ThreeD is a first-person shooter—a pretty basic, low-budget shooter coded by Cursor. It features maze-like levels, hit-scan combat, simple enemy AI, and basic dynamic lighting. The gameplay is straightforward and rough around the edges. If you’re here to play, jump into the action; if you’re here to tinker, check out the built-in level editor.

---

## For Players

### Overview

Vibenstein ThreeD offers a no-frills FPS experience:

- **Basic Controls:** Move with WASD and look around with your mouse (or use on-screen controls on mobile).
- **Simple Combat:** Engage in hit-scan shooting with a few available weapons (Pistol, Machine Gun, Shotgun).
- **Enemy Encounters:** Battle straightforward AI enemies that simply chase and attack.
- **Basic Environments:** Navigate maze-like levels filled with walls, keys, doors, and secret passages.
- **Dynamic Lighting:** Experience a simple ceiling lighting system with four light types (Warm, Cool, Bright, Dim).
- **HUD & Scoring:** View your health, ammo, keys, and score through an on-screen overlay.

### How to Play

You can play the game live at: [https://vibenstein3d.yarlson.dev/](https://vibenstein3d.yarlson.dev/)

#### Controls

- **Movement:** WASD keys (or on-screen controls for mobile)
- **Look Around:** Mouse (or touch gestures on mobile)
- **Shoot:** Left-click (or tap the fire button)
- **Switch Weapons:** Keys 1–3
- **Pause/Menu:** ESC

#### Getting Started

1. **Visit the Game:** Open [https://vibenstein3d.yarlson.dev/](https://vibenstein3d.yarlson.dev/) in your browser.
2. **Jump In:** Use the controls above to move, look around, and engage enemies.
3. **Experience the Action:** It’s a raw, no-frills shooter—just enough to get you in the game.

---

## For Developers

### Project Overview

Vibenstein ThreeD is built using web technologies to deliver a straightforward FPS:

- **React 18 & TypeScript:** For a reliable, type-safe UI.
- **Three.js & React Three Fiber:** To create and manage the 3D scene.
- **Cannon-es & @react-three/cannon:** For basic physics and collision detection.
- **Zustand:** A lightweight state management solution handling player stats, enemy behavior, inventory, HUD, and more.
- **Vite:** For fast builds and hot-reloading.

### Code Structure

- **`src/components/`** – Contains reusable 3D and UI components (e.g., HUD, Player, Weapon, LevelGrid).
- **`src/scenes/`** – Defines the entire game scene; the main scene is rendered by `<Scene>`.
- **`src/state/`** – Global state management using Zustand for game, enemy, and player stores.
- **`src/assets/`** – Assets such as models, textures, and SVG files.
- **`src/editor/`** – A built-in level editor for creating and modifying game levels.
   - **Editor Components:** Toolbar, GridEditor, PropertyEditor, LivePreview.
   - **Editor Store & Hooks:** Manage level data, grid configuration, and update routines.
- **`src/utils/`** – Helper functions for level parsing, camera effects, and gun effects.
- **`src/weapons/`** – Contains weapon classes (Pistol, Gun) and their associated effects.
- **`src/types/`** – TypeScript type definitions (for level, weapons, JSON modules).

### The Built-In Level Editor

Developers can tweak and extend levels directly within the project. The editor provides:

- **Grid-Based Editing:** Place walls, doors, keys, and lights on a configurable grid.
- **Toolbar:** Pick from a set of predefined elements with simple icons and color cues.
- **Property Panel:** View and update properties for selected grid cells—add enemy spawns, adjust light type, or modify cell values.
- **Live Preview:** See your level in action with an interactive, real-time preview.
- **Layer Switching:** Toggle between editing “walls & objects” and “lights” layers.

To launch the editor, navigate to the `/editor` route in your browser (for example, during development at [http://localhost:3000/editor](http://localhost:3000/editor)).

### Getting Started for Developers

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/vibenstein-threed.git
   cd vibenstein-threed
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at the provided URL.
4. **Explore the Codebase:**
   - Modify components in `src/components/` and scenes in `src/scenes/`.
   - Use the level editor (`/editor`) to design and test new levels.
   - Tweak global states in the Zustand stores located in `src/state/`.

### Build & Deployment

- **Building the App:**
  ```bash
  npm run build
  ```
- **Previewing the Production Build:**
  ```bash
  npm run preview
  ```
- **Deployment:**  
  Vibenstein ThreeD is optimized for static hosting. Consider deploying on platforms like Vercel, Netlify, or GitHub Pages.

### Development Workflow

- **Editor Mode:**  
  Use the in-app level editor to rapidly prototype and iterate on level design.
- **Testing & Debugging:**  
  Utilize in-game debugging tools (Stats, Leva panel) and React error boundaries.
- **Contributing:**  
  Follow standard Git workflows and run linting and formatting commands:
  ```bash
  npm run lint
  npm run format
  ```

### Additional Resources

- **Documentation:**  
  Inline code comments and the `docs/` folder provide additional details.
- **CI/CD & Version Control:**  
  ESLint, Prettier, and TypeScript configuration files ensure code quality and consistency.

---

## License

This project is licensed under the MIT License.

---

Enjoy playing Vibenstein ThreeD—and if you decide to dive in and tweak the code, good luck (and happy coding)!
