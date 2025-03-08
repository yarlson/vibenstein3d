import * as THREE from 'three';

/**
 * Base Animal class for all living entities in the game
 */
export class Animal {
  protected scene: THREE.Scene;
  protected position: THREE.Vector3;
  protected mesh: THREE.Group;
  protected isDead: boolean;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.position = position.clone();
    this.mesh = new THREE.Group();
    this.isDead = false;
  }

  /**
   * Create the animal's 3D representation
   * @returns The mesh group for the animal
   */
  create(): THREE.Group {
    // This should be overridden in subclasses
    return this.mesh;
  }

  /**
   * Update the animal's state
   * @param delta Time since last frame in seconds
   * @param time Current time in seconds
   * @param walls Array of wall objects to check collisions against
   */
  // In base class we don't use the parameters, but subclasses will
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_delta: number, _time: number, _walls: THREE.Object3D[]): void {
    // This should be overridden in subclasses
  }

  /**
   * Apply damage to the animal
   * @param damage Amount of damage to apply
   */
  // In base class we don't use the parameter, but subclasses will
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  takeDamage(_damage: number): void {
    // This should be overridden in subclasses
  }

  /**
   * Clean up resources when removing the animal
   */
  destroy(): void {
    if (this.mesh) {
      // Recursively remove all child meshes
      while (this.mesh.children.length > 0) {
        const child = this.mesh.children[0];
        this.mesh.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }

      // Remove the mesh from the scene
      this.scene.remove(this.mesh);

      // Mark as dead to ensure no further processing
      this.isDead = true;
    }
  }

  /**
   * Get the mesh for this animal
   */
  getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Check if the animal is dead
   */
  getIsDead(): boolean {
    return this.isDead;
  }

  /**
   * Get the position of the animal
   */
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}
