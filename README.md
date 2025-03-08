# Wolfenstein 3D-Inspired FPS

A modern first-person shooter game inspired by Wolfenstein 3D, built with React, Three.js, and TypeScript. The game features classic maze-like levels, hit-scan combat, and straightforward enemy AI with modern visual enhancements.

## Features

- Classic WASD movement with mouse look
- Hit-scan combat system
- Enemy AI with states (Idle, Chase, Attack, Death)
- Interactive objects (keys, doors, switches)
- Dynamic ceiling lighting system with customizable light fixtures
- Grid-based level design
- HUD with health, ammo, and score tracking

## Tech Stack

- React 18 with TypeScript
- Three.js for 3D rendering
- React Three Fiber for React integration
- Cannon.js for physics
- Zustand for state management
- Vite for build tooling

## Lighting System

The game features a dynamic lighting system with:

- Customizable ceiling lights with different colors and intensities
- Separate light grid for independent placement of light fixtures
- Realistic light falloff and shadows
- Support for different types of lights (ceiling lamps, wall sconces, etc.)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal

## Development

- `src/components/` - Reusable UI and 3D components
- `src/scenes/` - Level and scene definitions
- `src/state/` - Zustand store and game state logic
- `src/assets/` - Textures, models, and sounds

## Controls

- WASD - Movement
- Mouse - Look around
- Left Click - Shoot
- 1-3 - Switch weapons
- ESC - Pause game

## License

MIT
