import * as THREE from 'three';
import { PlayerControls } from './controls.js';
import { Physics } from './physics.js';
import { Level } from './level.js';
import { AssetLoader } from './assetLoader.js';

export class Scene {
    constructor(container) {
        console.log('Initializing Scene...');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        console.log('Initializing physics...');
        // Initialize physics
        this.physics = new Physics(this.scene);

        // Initialize asset loader
        console.log('Initializing asset loader...');
        this.assetLoader = new AssetLoader();

        console.log('Creating level...');
        // Create level first
        this.level = new Level(this.scene, this.physics, this.assetLoader);
        this.level.create();

        // Position camera after level creation - moved further back and up slightly
        this.camera.position.set(0, 2, -10);
        this.camera.lookAt(0, 2, 0);
        console.log('Camera position:', this.camera.position);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Initialize controls after renderer setup
        console.log('Initializing controls...');
        this.controls = new PlayerControls(this.camera, this.renderer.domElement, this.physics);

        // Setup lighting
        console.log('Setting up lighting...');
        this.setupLighting();
        
        // Add axes helper for debugging
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        console.log('Scene initialization complete');
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Main directional light (sun-like)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 10, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        this.scene.add(mainLight);

        // Add point lights for atmosphere
        const pointLights = [
            { position: [5, 2.5, 5], color: 0xff7777, intensity: 0.5 },
            { position: [-5, 2.5, -5], color: 0x7777ff, intensity: 0.5 },
            { position: [5, 2.5, -5], color: 0x77ff77, intensity: 0.5 },
            { position: [-5, 2.5, 5], color: 0xffff77, intensity: 0.5 }
        ];

        pointLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, light.intensity, 10);
            pointLight.position.set(...light.position);
            this.scene.add(pointLight);
        });
    }

    // Handle window resize
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Update scene
    update(deltaTime) {
        if (this.controls) {
            this.controls.update(deltaTime);
        }
    }

    // Render the scene
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Get camera for controls
    getCamera() {
        return this.camera;
    }

    // Get scene for adding objects
    getScene() {
        return this.scene;
    }

    // Lock controls
    lockControls() {
        if (this.controls) {
            this.controls.lock();
        }
    }

    // Unlock controls
    unlockControls() {
        if (this.controls) {
            this.controls.unlock();
        }
    }

    // Add a method to load assets
    async loadAssets() {
        console.log('Loading assets...');
        try {
            await this.assetLoader.loadAllTextures();
            console.log('Assets loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load assets:', error);
            return false;
        }
    }

    // Clean up
    dispose() {
        if (this.level) {
            this.level.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        // Clean up textures
        if (this.assetLoader) {
            // The textures will be disposed when the level is disposed
            this.assetLoader = null;
        }
    }
} 