import * as THREE from 'three';

export class Physics {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.raycaster = new THREE.Raycaster();
        this.playerRadius = 0.5; // Player collision radius
        this.playerHeight = 1.6; // Player height for collision
    }

    // Add a mesh as a collider
    addCollider(mesh) {
        this.colliders.push(mesh);
    }

    // Check if a movement is valid (no collision)
    checkCollision(position, direction, distance) {
        // Cast rays in movement direction and slightly to the sides for better collision detection
        const rays = [
            direction,
            direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8),
            direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 8)
        ];

        for (const ray of rays) {
            this.raycaster.set(position, ray);
            const intersects = this.raycaster.intersectObjects(this.colliders);
            
            if (intersects.length > 0 && intersects[0].distance < distance + this.playerRadius) {
                return false;
            }
        }

        return true;
    }

    // Get adjusted movement vector that prevents wall clipping
    getAdjustedMovement(position, velocity) {
        const direction = velocity.clone().normalize();
        const distance = velocity.length();

        if (this.checkCollision(position, direction, distance)) {
            return velocity;
        }

        // If collision detected, try sliding along walls
        const slideDirections = [
            new THREE.Vector3(velocity.x, 0, 0),
            new THREE.Vector3(0, 0, velocity.z)
        ];

        for (const slideVelocity of slideDirections) {
            if (slideVelocity.length() > 0) {
                const slideDirection = slideVelocity.clone().normalize();
                const slideDistance = slideVelocity.length();

                if (this.checkCollision(position, slideDirection, slideDistance)) {
                    return slideVelocity;
                }
            }
        }

        return new THREE.Vector3(); // No movement possible
    }
} 