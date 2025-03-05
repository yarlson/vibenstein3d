# Modern Wolfenstein 3D

A modern reimagining of the classic Wolfenstein 3D game, built with Three.js.

## Project Overview

This project is a retro-inspired first-person shooter that captures the core gameplay mechanics and aesthetic of Wolfenstein 3D while incorporating modern graphics, dynamic lighting, smooth animations, and 3D spatial audio.

## Features

- First-person movement and shooting mechanics
- Handcrafted maze-like levels with modern visual polish
- Predictable enemy behavior
- Interactive elements (keys, switches, doors, secret passages)
- Level-based progression
- Classic HUD and scoring system
- Three weapon types: pistol, machine gun, shotgun

## Development Setup

1. Clone the repository
2. Open index.html in a modern web browser
3. For development, use a local web server to avoid CORS issues

## Project Structure

```
/project-root
  /src
    /assets         # Textures, audio, and models
    /levels         # Hardcoded level definitions
    /lib            # External libraries (e.g., three.js)
    /scripts        # Main game logic and utilities
  /tests           # Unit and integration tests
  index.html       # Main entry point
```

## Controls

- WASD: Movement
- Mouse: Look around
- Left Click: Shoot
- ESC: Pause game

## Browser Support

The game is designed for modern desktop browsers with WebGL support.

## License

MIT License 