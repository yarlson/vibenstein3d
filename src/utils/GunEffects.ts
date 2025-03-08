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

    // Create impact mark if we hit an object
    if (hitObject) {
      const markSize = 0.2;
      const markGeometry = new PlaneGeometry(markSize, markSize);
      const markMaterial = new MeshBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const mark = new Mesh(markGeometry, markMaterial);

      // Position and rotate mark
      mark.position.copy(position).addScaledVector(normal, 0.01); // Offset slightly to avoid z-fighting
      mark.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);

      // Store reference to hit object for cleanup
      mark.userData.parentObject = hitObject;

      // Add to scene and tracking array
      this.scene.add(mark);
      window.impactMarkers = window.impactMarkers || [];
      window.impactMarkers.push(mark);

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
          const markers = window.impactMarkers || [];
          const index = markers.indexOf(mark);
          if (index !== -1) {
            markers.splice(index, 1);
          }
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
