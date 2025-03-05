import * as THREE from 'three';
import { PlayerControls } from './controls.js';

export class Scene {
    constructor(container) {
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
        this.camera.position.set(0, 1.6, 0); // Position camera at average human height
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Initialize controls
        this.controls = new PlayerControls(this.camera, this.renderer.domElement);

        // Add some basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Add a floor (temporary, will be replaced with proper level geometry)
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Add some walls (temporary, will be replaced with proper level geometry)
        const wallGeometry = new THREE.BoxGeometry(1, 3, 20);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create walls to form a corridor
        const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1.position.set(5, 1.5, 0);
        this.scene.add(wall1);

        const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2.position.set(-5, 1.5, 0);
        this.scene.add(wall2);

        // Add end walls
        const endWallGeometry = new THREE.BoxGeometry(11, 3, 1);
        const endWall1 = new THREE.Mesh(endWallGeometry, wallMaterial);
        endWall1.position.set(0, 1.5, 10);
        this.scene.add(endWall1);

        const endWall2 = new THREE.Mesh(endWallGeometry, wallMaterial);
        endWall2.position.set(0, 1.5, -10);
        this.scene.add(endWall2);
    }

    // Handle window resize
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Update scene
    update(deltaTime) {
        // Update controls
        this.controls.update(deltaTime);
    }

    // Render the scene
    render() {
        this.renderer.render(this.scene, this.camera);
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
        this.controls.lock();
    }

    // Unlock controls
    unlockControls() {
        this.controls.unlock();
    }
} 