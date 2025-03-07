import { Scene, Camera, Group, Mesh, Raycaster, Object3D, Vector3, Sphere } from 'three';
import { GunEffects } from '../utils/GunEffects';

interface Bunny {
  isDead: boolean;
  scale: number;
  mesh: Mesh;
  takeDamage: (damage: number) => void;
}

declare global {
  interface Window {
    walls?: Object3D[];
    bunnies?: Bunny[];
    impactMarkers?: Mesh[];
  }
}

export class Gun {
  protected scene: Scene;
  protected camera: Camera;
  public mesh: Group | null;
  protected bullets: Mesh[];
  protected canShoot: boolean;
  protected damage: number;
  protected effects: GunEffects;

  constructor(scene: Scene, camera: Camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = null;
    this.bullets = [];
    this.canShoot = true;
    this.damage = 10; // Default damage
    this.effects = new GunEffects(scene);

    // Initialize global arrays if they don't exist
    if (!window.walls) window.walls = [];
    if (!window.impactMarkers) window.impactMarkers = [];
  }

  create(): Group | null {
    // Override in subclasses
    return null;
  }

  update(delta: number): void {
    this.updateBullets(delta);
  }

  startFiring(): void {
    // Override in subclasses
  }

  stopFiring(): void {
    // Override in subclasses
  }

  protected updateBullets(delta: number): void {
    const currentTime = performance.now();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Check if bullet should be removed
      if (currentTime - bullet.userData.createdAt > bullet.userData.lifespan || !bullet.userData.alive) {
        // Remove bullet and trail
        this.scene.remove(bullet);
        if (bullet.userData.trail) {
          this.scene.remove(bullet.userData.trail);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Move bullet
      const bulletSpeed = bullet.userData.velocity * delta;
      bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bulletSpeed));

      // Update bullet trail
      if (bullet.userData.trail) {
        const positions = bullet.userData.trail.geometry.attributes.position.array;

        // Trail start position (bullet's current position)
        positions[0] = bullet.position.x;
        positions[1] = bullet.position.y;
        positions[2] = bullet.position.z;

        // Trail end position (bullet's position minus direction)
        const trailEnd = bullet.position.clone().sub(
          bullet.userData.direction.clone().multiplyScalar(bullet.userData.trailLength)
        );
        positions[3] = trailEnd.x;
        positions[4] = trailEnd.y;
        positions[5] = trailEnd.z;

        bullet.userData.trail.geometry.attributes.position.needsUpdate = true;
      }

      // Check for collisions
      this.checkBulletCollisions(bullet);
    }
  }

  protected checkBulletCollisions(bullet: Mesh): boolean {
    // Create a raycaster for collision detection
    const raycaster = new Raycaster();
    raycaster.set(bullet.position, bullet.userData.direction);

    // Check for intersections with walls
    const intersects = raycaster.intersectObjects(window.walls || []);

    // If we hit something close enough, mark the bullet for removal
    if (intersects.length > 0 && intersects[0].distance < bullet.userData.velocity / 20) {
      bullet.userData.alive = false;

      // Create impact effect
      this.effects.createImpactEffect(
        intersects[0].point,
        intersects[0].face?.normal || new Vector3(0, 1, 0),
        intersects[0].object as Mesh
      );

      // Apply damage to the hit object if it has health
      if (intersects[0].object.userData.health !== undefined) {
        this.applyDamage(intersects[0].object, bullet.userData.damage);
      }

      return true;
    }

    // Check for floor collision
    if (bullet.position.y <= 0.05) {
      bullet.userData.alive = false;

      // Create impact effect for floor
      const floorNormal = new Vector3(0, 1, 0);
      this.effects.createImpactEffect(
        new Vector3(bullet.position.x, 0, bullet.position.z),
        floorNormal,
        null
      );

      return true;
    }

    // Check for bunny collisions if they exist
    if (window.bunnies) {
      for (const bunny of window.bunnies) {
        if (bunny.isDead) continue;

        const bunnyRadius = 1 * bunny.scale;
        const bunnySphere = new Sphere(bunny.mesh.position, bunnyRadius);

        if (bunnySphere.containsPoint(bullet.position)) {
          bullet.userData.alive = false;

          // Create impact effect
          this.effects.createImpactEffect(
            bullet.position.clone(),
            bullet.userData.direction.clone().negate(),
            bunny.mesh
          );

          // Apply damage to bunny
          bunny.takeDamage(bullet.userData.damage);
          return true;
        }
      }
    }

    return false;
  }

  protected applyDamage(object: Object3D, damage: number): void {
    if (object.userData.health !== undefined) {
      object.userData.health -= damage;
      if (object.userData.health <= 0) {
        this.destroyObject(object);
      }
    }
  }

  protected destroyObject(object: Object3D): void {
    // Remove all impact markers associated with this object
    if (window.impactMarkers) {
      for (let i = window.impactMarkers.length - 1; i >= 0; i--) {
        const marker = window.impactMarkers[i];
        if (marker.userData.parentObject === object) {
          this.scene.remove(marker);
          window.impactMarkers.splice(i, 1);
        }
      }
    }

    // Remove the object from the scene
    this.scene.remove(object);

    // Remove from walls array if it's there
    if (window.walls) {
      const wallIndex = window.walls.indexOf(object);
      if (wallIndex !== -1) {
        window.walls.splice(wallIndex, 1);
      }
    }
  }

  protected shakeCamera(intensity: number = 0.1): void {
    const originalPosition = this.camera.position.clone();
    const originalRotation = this.camera.rotation.clone();
    const duration = 200; // Duration in milliseconds
    const startTime = performance.now();

    const shake = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed < duration) {
        // Calculate shake offset
        const offsetX = (Math.random() - 0.5) * intensity;
        const offsetY = (Math.random() - 0.5) * intensity;
        const offsetZ = (Math.random() - 0.5) * intensity;

        // Apply offset to camera position
        this.camera.position.set(
          originalPosition.x + offsetX,
          originalPosition.y + offsetY,
          originalPosition.z + offsetZ
        );

        // Apply slight rotation shake
        this.camera.rotation.set(
          originalRotation.x + (Math.random() - 0.5) * 0.1 * intensity,
          originalRotation.y + (Math.random() - 0.5) * 0.1 * intensity,
          originalRotation.z + (Math.random() - 0.5) * 0.1 * intensity
        );

        requestAnimationFrame(shake);
      } else {
        // Reset to original position and rotation
        this.camera.position.copy(originalPosition);
        this.camera.rotation.copy(originalRotation);
      }
    };

    shake();
  }
} 