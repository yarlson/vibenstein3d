import {
  Scene,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Float32BufferAttribute,
  CircleGeometry,
  Object3D,
} from 'three';
import { useGameStore } from '../state/gameStore';

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

export class GunEffects {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createBulletTrail(bullet: Mesh, color: number): void {
    // Create line geometry for trail
    const geometry = new BufferGeometry();
    const positions = new Float32Array(6); // 2 points * 3 coordinates

    // Initial positions (will be updated in updateBullets)
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    // Create line material
    const material = new LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
    });

    // Create line and add to scene
    const trail = new Line(geometry, material);
    this.scene.add(trail);

    // Store trail reference in bullet
    bullet.userData.trail = trail;
  }

  createMuzzleFlash(position: Vector3, direction: Vector3): void {
    // Create flash geometry
    const flashGeometry = new SphereGeometry(0.1, 8, 8);
    const flashMaterial = new MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new Mesh(flashGeometry, flashMaterial);

    // Position flash at muzzle
    flash.position.copy(position);
    flash.position.addScaledVector(direction, 0.1); // Move flash slightly forward

    // Add to scene
    this.scene.add(flash);

    // Fade out and remove
    const startTime = performance.now();
    const duration = 50; // milliseconds

    const fadeOut = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        flash.material.opacity = 0.8 * (1 - progress);
        flash.scale.setScalar(1 + progress);
        requestAnimationFrame(fadeOut);
      } else {
        this.scene.remove(flash);
      }
    };

    fadeOut();
  }

  createImpactEffect(position: Vector3, normal: Vector3, hitObject: Mesh | null): void {
    // Create impact flash
    const flashGeometry = new SphereGeometry(0.1, 8, 8);
    const flashMaterial = new MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new Mesh(flashGeometry, flashMaterial);

    // Position flash at impact point
    flash.position.copy(position);

    // Add to scene
    this.scene.add(flash);

    // STRICT check: Do not create any impact markers on enemies under any circumstances
    if (hitObject && !isEnemyObject(hitObject)) {
      // Create a black circular impact mark (only for non-enemy objects)
      const markSize = 0.1; // Size of the impact mark
      const markGeometry = new CircleGeometry(markSize, 16); // Circle geometry for perfect circle
      const markMaterial = new MeshBasicMaterial({
        color: 0x000000, // Black color
        transparent: true,
        opacity: 0.9, // Start with high opacity
        depthWrite: false, // Prevents z-fighting
        side: 2, // DoubleSide - visible from both sides
      });
      const mark = new Mesh(markGeometry, markMaterial);

      // Ensure the normal is normalized
      const normalizedNormal = normal.clone().normalize();

      // Position mark slightly in front of the impact point along the normal
      mark.position.copy(position).addScaledVector(normalizedNormal, 0.01);

      // Set up the rotation to align with the normal
      if (normalizedNormal.lengthSq() > 0) {
        // Find rotation that aligns with the normal
        mark.lookAt(position.clone().add(normalizedNormal));
      }

      // Store reference to hit object for cleanup and add userData for tracking
      mark.userData = {
        parentObject: hitObject,
        lifetime: 0,
        maxLifetime: 5.0, // 5 seconds lifetime
        initialOpacity: 0.9,
        fadeRate: 0.05, // Will fade based on delta time in game update loop
      };

      // Add to scene and add to game store for tracking
      this.scene.add(mark);
      const gameStore = useGameStore.getState();
      gameStore.addImpactMarker(mark);
    }

    // Fade out flash
    const startTime = performance.now();
    const duration = 100; // milliseconds

    const fadeFlash = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        flash.material.opacity = 0.8 * (1 - progress);
        flash.scale.setScalar(1 + progress * 2);
        requestAnimationFrame(fadeFlash);
      } else {
        this.scene.remove(flash);
      }
    };

    fadeFlash();
  }
}
