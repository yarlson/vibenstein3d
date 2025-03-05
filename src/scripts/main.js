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
    lastTime: 0,
    errorState: false
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

// Handle pointer lock change
document.addEventListener('pointerlockchange', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (document.pointerLockElement) {
        // Controls are locked, hide the loading screen
        loadingScreen.style.display = 'none';
        gameState.isPaused = false;
    } else {
        // Controls are unlocked, show the loading screen with instructions
        loadingScreen.style.display = 'flex';
        loadingScreen.innerHTML = 'Click to start<br><br>' +
            'WASD or Arrow Keys: Move<br>' +
            'Mouse: Look around<br>' +
            'ESC: Pause';
        gameState.isPaused = true;
    }
});

/**
 * Game loop function
 * @param {number} currentTime - Current timestamp
 */
function gameLoop(currentTime) {
    try {
        if (gameState.isPaused || gameState.errorState) {
            return;
        }

        // Calculate delta time
        const deltaTime = Math.min((currentTime - gameState.lastTime) / 1000, 0.1);
        gameState.lastTime = currentTime;

        // Update game logic
        gameState.scene.update(deltaTime);

        // Render the scene
        gameState.scene.render();

        // Request next frame
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
        gameState.errorState = true;
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'flex';
        loadingScreen.textContent = 'An error occurred. Please refresh the page.';
    }
}

/**
 * Initialize the game
 * This function sets up:
 * - Three.js scene
 * - Asset loading
 * - Controls initialization
 * - Game loop setup
 */
async function initGame() {
    try {
        // Show loading screen
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'flex';
        loadingScreen.textContent = 'Loading game assets...';

        // Initialize Three.js scene
        const container = document.getElementById('game-container');
        gameState.scene = new Scene(container);
        
        // Initialize scene and load assets
        const initialized = await gameState.scene.initialize();
        if (!initialized) {
            throw new Error('Failed to initialize game scene');
        }
        
        // Add instructions
        loadingScreen.innerHTML = 'Click to start<br><br>' +
            'WASD or Arrow Keys: Move<br>' +
            'Mouse: Look around<br>' +
            'ESC: Pause';
        
        // Show HUD
        const hud = document.getElementById('hud');
        hud.style.display = 'block';
        
        // Start game loop
        gameState.lastTime = performance.now();
        gameState.errorState = false;
        gameState.isLoading = false;
        requestAnimationFrame(gameLoop);
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        gameState.errorState = true;
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.textContent = 'Failed to initialize game. Please check console for details.';
    }
}

// Clean up function for when the game needs to be destroyed
function cleanup() {
    if (gameState.scene) {
        gameState.scene.dispose();
    }
} 