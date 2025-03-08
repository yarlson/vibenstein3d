import { 
  Scene, 
  Camera, 
  Group, 
  Mesh, 
  Raycaster, 
  Object3D, 
  Vector3, 
  SphereGeometry, 
  MeshBasicMaterial,
  PlaneGeometry
} from 'three';
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
      const currentTime = performance.now();

      // Check if bullet should be removed due to lifetime
      if (bullet.userData.createdAt && 
          bullet.userData.lifespan && 
          currentTime - bullet.userData.createdAt > bullet.userData.lifespan) {
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
        bullet.position.add(
          bullet.userData.direction.clone().multiplyScalar(bullet.userData.velocity * delta)
        );
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
          const trailEnd = bullet.position.clone().sub(
            bullet.userData.direction.clone().multiplyScalar(bullet.userData.trailLength)
          );
          positions[3] = trailEnd.x;
          positions[4] = trailEnd.y;
          positions[5] = trailEnd.z;
        }
        
        bullet.userData.trail.geometry.attributes.position.needsUpdate = true;
      }

      // Check for collisions
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

          // Create hit flash effect (but no impact marker)
          this.createEnemyHitEffect(bullet.position.clone());

          // Apply damage to enemy
          enemy.takeDamage(bullet.userData.damage);

          return true;
        }
      }
    }

    // 2. Check for wall collisions
    const walls = gameStore.walls;
    console.log(`Checking wall collisions, total walls: ${walls.length}`);
    if (walls.length > 0) {
      if (!bullet.userData.previousPosition) {
        // If this is the first update, set the previous position to be slightly behind the current position
        bullet.userData.previousPosition = bullet.position.clone().sub(
          bullet.userData.direction.clone().multiplyScalar(0.1)
        );
      }
      
      // Calculate direction and distance for raycasting
      const rayDirection = bullet.userData.direction.clone().normalize();
      const rayFrom = bullet.userData.previousPosition.clone();
      const rayTo = bullet.position.clone();
      const rayDistance = rayFrom.distanceTo(rayTo);
      
      // Create a ray for collision detection
      const ray = new Raycaster(rayFrom, rayDirection, 0, rayDistance);

      // Check for intersections with walls
      const intersects = ray.intersectObjects(walls, true);
      console.log(`Wall intersections found: ${intersects.length}`);
      if (intersects.length > 0) {
        // Hit a wall!
        console.log(`WALL HIT! Distance: ${intersects[0].distance.toFixed(2)}, Object: `, {
          type: intersects[0].object.userData?.type || 'unknown',
          parent: intersects[0].object.parent ? 'exists' : 'null',
          position: intersects[0].point
        });

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

    // 3. Check for floor collision
    if (bullet.position.y <= 0.05) {
      // Create a temporary impact effect for the floor
      this.createFloorHitEffect(bullet.position.clone().set(bullet.position.x, 0.01, bullet.position.z));
      return true;
    }

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
      side: 2 // DoubleSide
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
