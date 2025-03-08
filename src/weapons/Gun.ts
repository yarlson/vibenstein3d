import {
  Scene,
  Camera,
  Mesh,
  Group,
  MeshBasicMaterial,
  Vector3,
  Raycaster,
  PlaneGeometry,
  SphereGeometry,
  Object3D,
} from 'three';
import { GunEffects } from '../utils/GunEffects';
import { useEnemyStore } from '../state/enemyStore';
import { useGameStore } from '../state/gameStore';
import { triggerCameraShake } from '../utils/cameraUtils';

/**
 * Recursively checks if an object or any of its parents is an enemy.
 * This is a strict check to avoid creating impact markers on enemies.
 */
function isEnemyObject(object: Object3D | null): boolean {
  if (!object) return false;

  // Check the object itself
  if (object.userData && object.userData.type === 'enemy') {
    return true;
  }

  // Check for enemy ID
  if (object.userData && object.userData.parentId) {
    return true;
  }

  // Check name for enemy identifier
  if (object.name && object.name.toLowerCase().includes('enemy')) {
    return true;
  }

  // Recursively check parent
  if (object.parent) {
    return isEnemyObject(object.parent);
  }

  return false;
}

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
    // Skip the whole method if no bullets
    if (this.bullets.length === 0) {
      return;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const currentTime = performance.now();

      // Check if bullet should be removed due to lifetime
      if (
        bullet.userData.createdAt &&
        bullet.userData.lifespan &&
        currentTime - bullet.userData.createdAt > bullet.userData.lifespan
      ) {
        // Remove bullet and trail
        this.scene.remove(bullet);
        if (bullet.userData.trail) {
          this.scene.remove(bullet.userData.trail);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Move bullet forward using velocity
      if (bullet.userData.direction && bullet.userData.velocity) {
        const movementDelta = bullet.userData.direction
          .clone()
          .multiplyScalar(bullet.userData.velocity * delta);
        bullet.position.add(movementDelta);
      }

      // Update bullet trail if it exists
      if (bullet.userData.trail) {
        const positions = bullet.userData.trail.geometry.attributes.position.array;

        // Trail start position (bullet's current position)
        positions[0] = bullet.position.x;
        positions[1] = bullet.position.y;
        positions[2] = bullet.position.z;

        // Trail end position (bullet's position minus direction * trailLength)
        if (bullet.userData.direction && bullet.userData.trailLength) {
          const trailEnd = bullet.position
            .clone()
            .sub(bullet.userData.direction.clone().multiplyScalar(bullet.userData.trailLength));
          positions[3] = trailEnd.x;
          positions[4] = trailEnd.y;
          positions[5] = trailEnd.z;
        }

        bullet.userData.trail.geometry.attributes.position.needsUpdate = true;
      }

      const hasCollided = this.checkBulletCollisions(bullet);

      // Check if bullet has traveled too far (max distance is 100 units if not specified)
      const maxDistance = 100;
      if (bullet.userData.startPosition) {
        const distanceTraveled = bullet.position.distanceTo(bullet.userData.startPosition);
        if (distanceTraveled > maxDistance) {
          // Remove bullet and trail
          this.scene.remove(bullet);
          if (bullet.userData.trail) {
            this.scene.remove(bullet.userData.trail);
          }
          this.bullets.splice(i, 1);
          continue;
        }
      }

      // If bullet collided with something, remove it
      if (hasCollided) {
        // Remove bullet and trail
        this.scene.remove(bullet);
        if (bullet.userData.trail) {
          this.scene.remove(bullet.userData.trail);
        }
        this.bullets.splice(i, 1);
      }

      // Store current position as previous position for next frame
      bullet.userData.previousPosition = bullet.position.clone();
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
        if (enemy.getIsDead()) {
          continue;
        }

        const enemyPosition = enemy.getPosition();
        // Use a larger collision radius for enemies to make hits easier
        const hitRadius = 3;
        const distance = bullet.position.distanceTo(enemyPosition);

        if (distance < hitRadius) {
          // Get the damage amount from the bullet (default to 25 if not set)
          const damage = bullet.userData.damage || 25;

          // Mark bullet for removal
          bullet.userData.alive = false;

          // Create hit flash effect (but no impact marker)
          this.createEnemyHitEffect(bullet.position.clone());

          // DIRECT DAMAGE APPLICATION: Bypass method calls that might be failing
          try {
            // First try the normal takeDamage method
            enemy.takeDamage(damage);

            // Force update enemy in store as well
            enemyStore.updateEnemy(enemy.getId(), {
              health: enemy.getHealth(),
              isAlive: enemy.getHealth() > 0,
            });
          } catch (error) {
            console.error(
              'Error applying damage to enemy:',
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Emergency direct manipulation of enemy health
            try {
              // @ts-expect-error - Emergency debug access to private property
              enemy.health -= damage;

              // Force update in store
              enemyStore.updateEnemy(enemy.getId(), {
                health: enemy.getHealth(),
                isAlive: enemy.getHealth() > 0,
              });

              // Force kill enemy if health <= 0
              if (enemy.getHealth() <= 0) {
                try {
                  enemy.die();
                } catch (dieError) {
                  console.error(
                    'Error calling die():',
                    dieError instanceof Error ? dieError.message : 'Unknown error'
                  );
                  // Last resort: directly set alive to false
                  // Force property access on enemy
                  Object.defineProperty(enemy, 'alive', {
                    value: false,
                    writable: true,
                  });
                  enemyStore.updateEnemy(enemy.getId(), { isAlive: false });
                }
              }
            } catch (directError) {
              console.error('Emergency direct manipulation failed:', directError);
            }
          }

          return true;
        }
      }
    } else {
      console.log('No enemies found in store. Cannot check for collisions.');
    }

    // 2. Check for wall/environment collisions using raycasting
    const walls = gameStore.walls;
    if (walls.length > 0 && bullet.userData.previousPosition) {
      // Calculate direction and distance for raycasting
      const rayDirection = bullet.userData.direction.clone().normalize();
      const rayFrom = bullet.userData.previousPosition.clone();
      const rayTo = bullet.position.clone();
      const rayDistance = rayFrom.distanceTo(rayTo);

      // Create a ray for collision detection
      const ray = new Raycaster(rayFrom, rayDirection, 0, rayDistance);

      // Check for intersections with walls
      const intersects = ray.intersectObjects(walls, true);

      if (intersects.length > 0) {
        // Ensure the hit object has userData for the mark
        const hitObject = intersects[0].object as Mesh;

        // Get the impact point and normal
        const impactPoint = intersects[0].point.clone();
        let impactNormal: Vector3;

        // Use face normal if available, otherwise use direction
        if (intersects[0].face && intersects[0].face.normal) {
          impactNormal = intersects[0].face.normal.clone();
        } else {
          impactNormal = bullet.userData.direction.clone().negate();
        }

        // Use the strict isEnemyObject check
        const isEnemy = isEnemyObject(hitObject);

        if (isEnemy) {
          // For enemies, just create a hit effect with no impact marker
          this.createEnemyHitEffect(impactPoint.clone());
        } else {
          // For walls and other objects, create normal impact effect
          this.effects.createImpactEffect(impactPoint, impactNormal, hitObject);
        }

        return true;
      }
    }

    // 3. Check for floor collision
    if (bullet.position.y <= 0.05) {
      // Create a temporary impact effect for the floor
      this.createFloorHitEffect(
        bullet.position.clone().set(bullet.position.x, 0.01, bullet.position.z)
      );
      return true;
    }

    // No collisions detected
    return false;
  }

  // Helper method to create a hit effect for enemy hits without impact markers
  private createEnemyHitEffect(position: Vector3): void {
    // Create a simple blood/hit flash
    const flashGeometry = new SphereGeometry(0.2, 8, 8);
    const flashMaterial = new MeshBasicMaterial({
      color: 0xff0000, // Red flash for enemy hits
      transparent: true,
      opacity: 0.8,
    });
    const flash = new Mesh(flashGeometry, flashMaterial);

    // Position flash at hit point
    flash.position.copy(position);

    // Add to scene
    this.scene.add(flash);

    // Fade out and remove
    const startTime = performance.now();
    const duration = 150; // milliseconds

    const fadeOut = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        flash.material.opacity = 0.8 * (1 - progress);
        flash.scale.setScalar(1 + progress * 2); // Expand as it fades
        requestAnimationFrame(fadeOut);
      } else {
        this.scene.remove(flash);
      }
    };

    fadeOut();
  }

  // Helper method to create a hit effect for floor hits without impact markers
  private createFloorHitEffect(position: Vector3): void {
    // Create a dusty impact flash
    const flashGeometry = new SphereGeometry(0.15, 8, 8);
    const flashMaterial = new MeshBasicMaterial({
      color: 0xcccccc, // Gray dust for floor hits
      transparent: true,
      opacity: 0.7,
    });
    const flash = new Mesh(flashGeometry, flashMaterial);

    // Position flash at impact point
    flash.position.copy(position);

    // Add to scene
    this.scene.add(flash);

    // Create a temporary floor mark that fades quickly
    const markGeometry = new PlaneGeometry(0.4, 0.4);
    const markMaterial = new MeshBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: 2, // DoubleSide
    });
    const mark = new Mesh(markGeometry, markMaterial);

    // Position and rotate the mark to lie flat on the floor
    mark.position.copy(position).setY(0.01); // Just above the floor
    mark.rotation.x = -Math.PI / 2; // Rotate to lie flat

    // Add to scene
    this.scene.add(mark);

    // Fade out and remove both effects
    const startTime = performance.now();
    const duration = 1000; // 1 second

    const fadeOut = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        // Fade out flash quickly
        if (progress < 0.3) {
          flash.material.opacity = 0.7 * (1 - progress / 0.3);
          flash.scale.setScalar(1 + progress * 3);
        } else if (flash.parent) {
          this.scene.remove(flash);
        }

        // Fade out mark more slowly
        mark.material.opacity = 0.5 * (1 - progress);

        requestAnimationFrame(fadeOut);
      } else {
        // Clean up both objects
        if (flash.parent) this.scene.remove(flash);
        if (mark.parent) this.scene.remove(mark);
      }
    };

    fadeOut();
  }

  protected applyDamage(object: Object3D, damage: number): void {
    // Check if object is damageable using type guard
    if (this.isDamageable(object)) {
      object.takeDamage(damage);
    }
  }

  // Type guard to check if an object can take damage
  protected isDamageable(object: Object3D): object is Object3D & DamageableObject {
    return (
      'takeDamage' in object &&
      typeof (object as { takeDamage?: unknown }).takeDamage === 'function'
    );
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
    // Use the triggerCameraShake function from EnemyController
    triggerCameraShake(intensity);
  }
}
