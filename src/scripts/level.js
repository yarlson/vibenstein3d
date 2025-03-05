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
        floorMaterial.map.repeat.set(10, 10);
        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        
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
        wallMaterial.map.repeat.set(2, 1);
        wallMaterial.map.wrapS = wallMaterial.map.wrapT = THREE.RepeatWrapping;

        // Create outer walls
        const walls = [
            { size: [1, 3, 50], position: [25, 1.5, 0] },  // Right wall
            { size: [1, 3, 50], position: [-25, 1.5, 0] }, // Left wall
            { size: [50, 3, 1], position: [0, 1.5, 25] },  // Front wall
            { size: [50, 3, 1], position: [0, 1.5, -25] }  // Back wall
        ];

        walls.forEach((wall, index) => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
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
        wallMaterial.map.repeat.set(2, 1);
        wallMaterial.map.wrapS = wallMaterial.map.wrapT = THREE.RepeatWrapping;

        // Define maze segments (each is a wall piece)
        const mazeSegments = [
            // Main corridor
            { size: [1, 3, 20], position: [5, 1.5, 0] },
            { size: [1, 3, 20], position: [-5, 1.5, 0] },
            
            // Cross corridors
            { size: [12, 3, 1], position: [0, 1.5, 5] },
            { size: [12, 3, 1], position: [0, 1.5, -5] },
            
            // Side rooms
            { size: [8, 3, 1], position: [9, 1.5, 8] },
            { size: [8, 3, 1], position: [-9, 1.5, 8] },
            { size: [8, 3, 1], position: [9, 1.5, -8] },
            { size: [8, 3, 1], position: [-9, 1.5, -8] },
            
            // Room dividers
            { size: [1, 3, 6], position: [13, 1.5, 5] },
            { size: [1, 3, 6], position: [-13, 1.5, 5] },
            { size: [1, 3, 6], position: [13, 1.5, -5] },
            { size: [1, 3, 6], position: [-13, 1.5, -5] }
        ];

        mazeSegments.forEach((segment, index) => {
            const geometry = new THREE.BoxGeometry(...segment.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
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