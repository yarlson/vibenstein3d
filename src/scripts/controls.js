import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import * as THREE from 'three';

export class PlayerControls {
    constructor(camera, domElement, physics) {
        // Store camera reference
        this.camera = camera;
        
        // Initialize PointerLock controls
        this.controls = new PointerLockControls(this.camera, domElement);
        this.physics = physics;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        // Movement parameters
        this.moveSpeed = 5.0; // Units per second
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (!this.controls.isLocked) return;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Escape':
                    this.controls.unlock();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (!this.controls.isLocked) return;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });

        // Click to start
        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });

        // Lock/unlock handlers
        this.controls.addEventListener('lock', () => {
            console.log('Controls locked');
            // Reset movement state when controls are locked
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        });

        this.controls.addEventListener('unlock', () => {
            console.log('Controls unlocked');
            // Reset movement state when controls are unlocked
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        });
    }

    update(deltaTime) {
        if (!this.controls || !this.controls.isLocked) {
            return;
        }

        try {
            // Calculate movement direction
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            // Apply movement to velocity
            const actualMoveSpeed = this.moveSpeed * deltaTime;
            
            if (this.moveForward || this.moveBackward) {
                this.velocity.z = -this.direction.z * actualMoveSpeed;
            } else {
                this.velocity.z = 0;
            }
            
            if (this.moveLeft || this.moveRight) {
                this.velocity.x = -this.direction.x * actualMoveSpeed;
            } else {
                this.velocity.x = 0;
            }

            // Get collision-adjusted movement
            if (this.velocity.length() > 0) {
                const adjustedVelocity = this.physics.getAdjustedMovement(
                    this.camera.position,
                    this.velocity
                );

                // Apply movement
                if (adjustedVelocity) {
                    this.controls.moveRight(-adjustedVelocity.x);
                    this.controls.moveForward(-adjustedVelocity.z);
                }
            }
        } catch (error) {
            console.error('Error in controls update:', error);
        }
    }

    // Lock controls
    lock() {
        if (this.controls) {
            this.controls.lock();
        }
    }

    // Unlock controls
    unlock() {
        if (this.controls) {
            this.controls.unlock();
        }
    }

    // Check if controls are locked
    isLocked() {
        return this.controls ? this.controls.isLocked : false;
    }
} 