import * as THREE from 'three';

export class Level {
    constructor(scene, physics, assetLoader) {
        this.scene = scene;
        this.physics = physics;
        this.assetLoader = assetLoader;
        this.meshes = [];
    }

    create() {
        console.log('Creating level geometry...');
        // Create floor
        this.createFloor();
        
        // Create outer walls
        this.createOuterWalls();
        
        // Create inner maze structure
        this.createMaze();
        
        console.log(`Created ${this.meshes.length} meshes for level`);
    }

    createFloor() {
        console.log('Creating floor...');
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            map: this.assetLoader.getTexture('floor'),
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });

        // Clone the texture for independent repeat settings
        floorMaterial.map = floorMaterial.map.clone();
        // Set repeat based on floor size (50x50) - using smaller repeat for better visual
        floorMaterial.map.repeat.set(8, 8);
        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        // Ensure proper texture filtering
        floorMaterial.map.minFilter = THREE.LinearFilter;
        floorMaterial.map.magFilter = THREE.LinearFilter;
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.meshes.push(floor);
        console.log('Floor created');
    }

    createOuterWalls() {
        console.log('Creating outer walls...');
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: this.assetLoader.getTexture('wall'),
            roughness: 0.7,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        // Create outer walls
        const walls = [
            { size: [1, 3, 50], position: [25, 1.5, 0], repeat: [25, 2, 25] },  // Right wall
            { size: [1, 3, 50], position: [-25, 1.5, 0], repeat: [25, 2, 25] }, // Left wall
            { size: [50, 3, 1], position: [0, 1.5, 25], repeat: [25, 2, 1] },  // Front wall
            { size: [50, 3, 1], position: [0, 1.5, -25], repeat: [25, 2, 1] }  // Back wall
        ];

        walls.forEach((wall, index) => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const material = wallMaterial.clone(); // Clone material for each wall
            material.map = wallMaterial.map.clone(); // Clone texture for independent repeat settings
            material.map.repeat.set(wall.repeat[0], wall.repeat[1]);
            material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
            // Ensure proper texture filtering
            material.map.minFilter = THREE.LinearFilter;
            material.map.magFilter = THREE.LinearFilter;
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...wall.position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.physics.addCollider(mesh);
            this.meshes.push(mesh);
            console.log(`Created outer wall ${index + 1}`);
        });
    }

    createMaze() {
        console.log('Creating maze structure...');
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: this.assetLoader.getTexture('wall'),
            roughness: 0.7,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        // Define maze segments (each is a wall piece)
        const mazeSegments = [
            // Main corridor
            { size: [1, 3, 20], position: [5, 1.5, 0], repeat: [1, 2, 10] },
            { size: [1, 3, 20], position: [-5, 1.5, 0], repeat: [1, 2, 10] },
            
            // Cross corridors
            { size: [12, 3, 1], position: [0, 1.5, 5], repeat: [6, 2, 1] },
            { size: [12, 3, 1], position: [0, 1.5, -5], repeat: [6, 2, 1] },
            
            // Side rooms
            { size: [8, 3, 1], position: [9, 1.5, 8], repeat: [4, 2, 1] },
            { size: [8, 3, 1], position: [-9, 1.5, 8], repeat: [4, 2, 1] },
            { size: [8, 3, 1], position: [9, 1.5, -8], repeat: [4, 2, 1] },
            { size: [8, 3, 1], position: [-9, 1.5, -8], repeat: [4, 2, 1] },
            
            // Room dividers
            { size: [1, 3, 6], position: [13, 1.5, 5], repeat: [1, 2, 3] },
            { size: [1, 3, 6], position: [-13, 1.5, 5], repeat: [1, 2, 3] },
            { size: [1, 3, 6], position: [13, 1.5, -5], repeat: [1, 2, 3] },
            { size: [1, 3, 6], position: [-13, 1.5, -5], repeat: [1, 2, 3] }
        ];

        mazeSegments.forEach((segment, index) => {
            const geometry = new THREE.BoxGeometry(...segment.size);
            const material = wallMaterial.clone(); // Clone material for each segment
            material.map = wallMaterial.map.clone(); // Clone texture for independent repeat settings
            material.map.repeat.set(segment.repeat[0], segment.repeat[1]);
            material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
            // Ensure proper texture filtering
            material.map.minFilter = THREE.LinearFilter;
            material.map.magFilter = THREE.LinearFilter;
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...segment.position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.physics.addCollider(mesh);
            this.meshes.push(mesh);
            console.log(`Created maze segment ${index + 1}`);
        });

        // Add some decorative elements
        this.addDecorations();
    }

    addDecorations() {
        // Add columns at intersections
        const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const columnMaterial = new THREE.MeshStandardMaterial({
            map: this.assetLoader.getTexture('wall'),
            roughness: 0.5,
            metalness: 0.5
        });

        const columnPositions = [
            [5, 1.5, 5],
            [5, 1.5, -5],
            [-5, 1.5, 5],
            [-5, 1.5, -5]
        ];

        columnPositions.forEach(pos => {
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(...pos);
            column.castShadow = true;
            column.receiveShadow = true;
            this.scene.add(column);
            this.physics.addCollider(column);
            this.meshes.push(column);
        });
    }

    // Clean up method
    dispose() {
        this.meshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (mesh.material.map) mesh.material.map.dispose();
                mesh.material.dispose();
            }
            this.scene.remove(mesh);
        });
        this.meshes = [];
    }
}
