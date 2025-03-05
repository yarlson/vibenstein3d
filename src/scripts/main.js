/**
 * Modern Wolfenstein 3D
 * Main entry point for the game
 */

import { Scene } from './scene.js';

// Game state constants and configuration
const CONFIG = {
    DEBUG: false,
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight
};

// Game state variables
const gameState = {
    isLoading: true,
    isPaused: false,
    score: 0,
    health: 100,
    ammo: 50,
    scene: null,
    lastTime: 0
};

// Initialize game when the window loads
window.addEventListener('load', () => {
    console.log('Game initialization started');
    initGame();
});

// Handle window resizing
window.addEventListener('resize', () => {
    CONFIG.CANVAS_WIDTH = window.innerWidth;
    CONFIG.CANVAS_HEIGHT = window.innerHeight;
    if (gameState.scene) {
        gameState.scene.resize(window.innerWidth, window.innerHeight);
    }
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gameState.isPaused = true;
    }
});

/**
 * Game loop function
 * @param {number} currentTime - Current timestamp
 */
function gameLoop(currentTime) {
    if (gameState.isPaused) {
        return;
    }

    // Calculate delta time
    const deltaTime = (currentTime - gameState.lastTime) / 1000;
    gameState.lastTime = currentTime;

    // Update game logic
    gameState.scene.update(deltaTime);

    // Render the scene
    gameState.scene.render();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

/**
 * Initialize the game
 * This function sets up:
 * - Three.js scene
 * - Asset loading
 * - Controls initialization
 * - Game loop setup
 */
function initGame() {
    try {
        // Initialize Three.js scene
        const container = document.getElementById('game-container');
        gameState.scene = new Scene(container);
        
        // Add instructions
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.innerHTML = 'Click to start<br><br>' +
            'WASD or Arrow Keys: Move<br>' +
            'Mouse: Look around<br>' +
            'ESC: Pause';
        
        // Show HUD
        const hud = document.getElementById('hud');
        hud.style.display = 'block';
        
        // Start game loop
        gameState.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.textContent = 'Failed to initialize game. Please check console for details.';
    }
} 