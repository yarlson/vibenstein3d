import * as THREE from 'three';

export class AssetLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = new Map();
        this.loadingPromises = [];
    }

    async loadTexture(path, name) {
        console.log(`Loading texture: ${name} from ${path}`);
        try {
            const promise = new Promise((resolve, reject) => {
                this.textureLoader.load(
                    path,
                    (texture) => {
                        console.log(`Texture loaded successfully: ${name}`);
                        this.loadedTextures.set(name, texture);
                        resolve(texture);
                    },
                    (progress) => {
                        console.log(`Loading progress for ${name}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                    },
                    (error) => {
                        console.error(`Error loading texture ${name}:`, error);
                        reject(error);
                    }
                );
            });
            this.loadingPromises.push(promise);
            return promise;
        } catch (error) {
            console.error(`Failed to initiate texture loading for ${name}:`, error);
            throw error;
        }
    }

    getTexture(name) {
        if (!this.loadedTextures.has(name)) {
            console.warn(`Texture ${name} not found, using fallback`);
            return this.getFallbackTexture();
        }
        return this.loadedTextures.get(name);
    }

    getFallbackTexture() {
        // Create a simple checkerboard pattern as fallback
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#606060';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillRect(64, 64, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    async loadAllTextures() {
        console.log('Starting to load all textures...');
        const texturesToLoad = [
            { path: 'src/assets/textures/wall.jpg', name: 'wall' },
            { path: 'src/assets/textures/floor.jpg', name: 'floor' },
            { path: 'src/assets/textures/ceiling.jpg', name: 'ceiling' }
        ];

        try {
            for (const texture of texturesToLoad) {
                await this.loadTexture(texture.path, texture.name);
            }
            console.log('All textures loaded successfully');
        } catch (error) {
            console.error('Error loading textures:', error);
            // Continue with fallback textures
        }
    }

    isLoading() {
        return this.loadingPromises.length > 0;
    }

    async waitForLoad() {
        if (this.loadingPromises.length === 0) {
            return;
        }
        try {
            await Promise.all(this.loadingPromises);
            this.loadingPromises = [];
            console.log('All assets loaded successfully');
        } catch (error) {
            console.error('Error waiting for assets to load:', error);
            this.loadingPromises = [];
            throw error;
        }
    }
} 