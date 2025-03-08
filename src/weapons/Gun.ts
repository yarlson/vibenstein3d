import { Scene, Camera, Group, Mesh, Raycaster, Object3D } from 'three';
import { GunEffects } from '../utils/GunEffects';
import { useEnemyStore } from '../state/enemyStore';
import { useGameStore } from '../state/gameStore';

// Interface for objects that can take damage
interface DamageableObject {
  takeDamage: (damage: number) => void;
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
    // Update existing bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Move bullet forward
      if (bullet.userData.direction) {
        bullet.position.add(
          bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * delta)
        );
      }

      // Check for collisions
      const hasCollided = this.checkBulletCollisions(bullet);

      // Check if bullet has traveled too far
      const distanceTraveled = bullet.position.distanceTo(bullet.userData.startPosition);
      if (distanceTraveled > bullet.userData.maxDistance || hasCollided) {
        // Remove bullet from scene
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  protected checkBulletCollisions(bullet: Mesh): boolean {
    // Get store instances
    const enemyStore = useEnemyStore.getState();
    const gameStore = useGameStore.getState();
    
    // 1. FIRST PRIORITY: Check for enemy collisions (most important)
    // Get enemy instances from the enemy store
    const enemies = enemyStore.getEnemyInstances();
    if (enemies.length > 0) {
      for (const enemy of enemies) {
        if (enemy.getIsDead()) continue;

        const enemyPosition = enemy.getPosition();
        // Use a larger collision radius for enemies to make hits easier
        const hitRadius = 3;
        const distance = bullet.position.distanceTo(enemyPosition);

        if (distance < hitRadius) {
          // Hit an enemy!
          console.log(
            `ENEMY HIT! Distance: ${distance.toFixed(2)}, applying damage: ${bullet.userData.damage}`
          );

          // Mark bullet for removal
          bullet.userData.alive = false;

          // Create impact effect
          this.effects.createImpactEffect(
            bullet.position.clone(),
            bullet.userData.direction.clone().negate(),
            null
          );

          // Apply damage to enemy
          enemy.takeDamage(bullet.userData.damage);

          return true;
        }
      }
    }

    // 2. Check for wall collisions
    const walls = gameStore.walls;
    if (walls.length > 0) {
      // Create a ray from the bullet's previous position to its current position
      const ray = new Raycaster(
        bullet.userData.previousPosition || bullet.position.clone(),
        bullet.userData.direction.clone(),
        0,
        bullet.position.distanceTo(bullet.userData.previousPosition || bullet.position.clone())
      );

      // Check for intersections with walls
      const intersects = ray.intersectObjects(walls, true);
      if (intersects.length > 0) {
        // Hit a wall!
        console.log(`WALL HIT! Distance: ${intersects[0].distance.toFixed(2)}`);

        // Create impact effect at the intersection point
        this.effects.createImpactEffect(
          intersects[0].point,
          intersects[0].face?.normal || bullet.userData.direction.clone().negate(),
          // Cast to Mesh to avoid type issues with the impact effect
          intersects[0].object as Mesh
        );

        return true;
      }
    }

    // Store current position as previous position for next frame
    bullet.userData.previousPosition = bullet.position.clone();

    return false;
  }

  protected applyDamage(object: Object3D, damage: number): void {
    // Check if object is damageable using type guard
    if (this.isDamageable(object)) {
      object.takeDamage(damage);
    }
  }

  // Type guard to check if an object can take damage
  protected isDamageable(object: Object3D): object is Object3D & DamageableObject {
    return 'takeDamage' in object && typeof (object as { takeDamage?: unknown }).takeDamage === 'function';
  }

  protected destroyObject(object: Object3D): void {
    // Remove object from scene
    this.scene.remove(object);

    // If it's a wall, remove from walls array
    const gameStore = useGameStore.getState();
    const wallIndex = gameStore.walls.indexOf(object);
    if (wallIndex !== -1) {
      gameStore.removeWall(object);
    }
  }

  protected shakeCamera(intensity: number = 0.1): void {
    // Use the shakeCamera function from the game store if available
    const gameStore = useGameStore.getState();
    if (gameStore.shakeCamera) {
      gameStore.shakeCamera(intensity);
    } else {
      // Fallback to local implementation if store function not available
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
}
