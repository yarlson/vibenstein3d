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
  PlaneGeometry,
} from 'three';
import { useGameStore } from '../state/gameStore';

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
    console.log("Creating impact effect:", { position, normal, hitObject: hitObject ? 'exists' : 'null' });
    
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

    // Create impact mark if we hit a valid wall object (not an enemy or floor)
    if (hitObject && hitObject.userData && hitObject.userData.type === 'wall') {
      console.log("Creating impact mark on wall:", { 
        hitObjectType: hitObject.userData?.type || 'unknown',
        hitObjectParent: hitObject.parent ? 'exists' : 'null'
      });
      
      // Create a slightly larger mark for better visibility
      const markSize = 0.3;
      const markGeometry = new PlaneGeometry(markSize, markSize);
      const markMaterial = new MeshBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.8,
        depthWrite: false, // Prevents z-fighting
        side: 2 // DoubleSide - visible from both sides
      });
      const mark = new Mesh(markGeometry, markMaterial);

      // Ensure the normal is normalized
      const normalizedNormal = normal.clone().normalize();
      
      // Position mark slightly in front of the impact point along the normal
      // to avoid z-fighting with the wall
      mark.position.copy(position).addScaledVector(normalizedNormal, 0.01);
      
      // Set up the rotation to align with the normal
      // We need the mark to face outward from the surface it hit
      if (normalizedNormal.lengthSq() > 0) {
        // Find rotation that aligns with the normal
        mark.lookAt(position.clone().add(normalizedNormal));
        // Adjust rotation to face outward from the surface
        mark.rotateY(Math.PI); // Rotate 180 degrees
      }

      // Store reference to hit object for cleanup
      mark.userData.parentObject = hitObject;
      // Add creation time for lifetime tracking
      mark.userData.createdAt = performance.now();
      mark.userData.lifetime = 0;
      mark.userData.maxLifetime = 5; // 5 seconds lifetime

      // Add to scene and add to game store for tracking
      this.scene.add(mark);
      const gameStore = useGameStore.getState();
      gameStore.addImpactMarker(mark);  // Use the dedicated impact marker function
      console.log("Impact marker added to store, total markers:", gameStore.impactMarkers.length);

      // Fade out mark over time
      const startTime = performance.now();
      const duration = 5000; // 5 seconds

      const fadeMark = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1 && mark.parent) {
          mark.material.opacity = 0.8 * (1 - progress);
          requestAnimationFrame(fadeMark);
        } else if (mark.parent) {
          this.scene.remove(mark);
          // Remove from game store using the impact marker function
          const gameStore = useGameStore.getState();
          gameStore.removeImpactMarker(mark);
        }
      };

      fadeMark();
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
