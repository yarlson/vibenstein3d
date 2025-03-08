import {
  Scene,
  Camera,
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshLambertMaterial,
  Vector3,
  SphereGeometry,
  MeshBasicMaterial,
} from 'three';
import { Gun } from './Gun';

export class Pistol extends Gun {
  private isFiring: boolean;
  private lastShotTime: number;
  private readonly fireRate: number; // Shots per second
  private readonly barrelOffset: Vector3;
  private readonly bulletSpeed: number;
  private readonly bulletLifespan: number;
  private readonly bulletTrailLength: number;

  constructor(scene: Scene, camera: Camera) {
    super(scene, camera);
    this.isFiring = false;
    this.lastShotTime = 0;
    this.fireRate = 5; // 5 shots per second
    this.damage = 25;
    this.barrelOffset = new Vector3(0, 0.1, -0.5); // Relative to gun mesh
    this.bulletSpeed = 50;
    this.bulletLifespan = 2000; // 2 seconds
    this.bulletTrailLength = 2;
  }

  create(): Group {
    // Create gun mesh
    const gunGroup = new Group();

    // Create gun body
    const bodyGeometry = new BoxGeometry(0.2, 0.2, 0.6);
    const bodyMaterial = new MeshLambertMaterial({ color: 0x444444 });
    const body = new Mesh(bodyGeometry, bodyMaterial);
    gunGroup.add(body);

    // Create gun barrel
    const barrelGeometry = new CylinderGeometry(0.05, 0.05, 0.4);
    const barrelMaterial = new MeshLambertMaterial({ color: 0x333333 });
    const barrel = new Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.copy(this.barrelOffset);
    gunGroup.add(barrel);

    // Create gun handle
    const handleGeometry = new BoxGeometry(0.15, 0.4, 0.2);
    const handleMaterial = new MeshLambertMaterial({ color: 0x222222 });
    const handle = new Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, -0.2, 0);
    gunGroup.add(handle);

    // Position gun in front of camera
    gunGroup.position.set(0.3, -0.2, -0.5);

    this.mesh = gunGroup;
    this.camera.add(this.mesh); // Add the gun to the camera
    return gunGroup;
  }

  startFiring(): void {
    this.isFiring = true;
    this.tryShoot();
  }

  stopFiring(): void {
    this.isFiring = false;
  }

  update(delta: number): void {
    super.update(delta);

    // Handle continuous firing
    if (this.isFiring) {
      this.tryShoot();
    }
  }

  private tryShoot(): void {
    const currentTime = performance.now();
    const timeSinceLastShot = currentTime - this.lastShotTime;
    const minTimeBetweenShots = 1000 / this.fireRate;

    if (timeSinceLastShot >= minTimeBetweenShots) {
      this.shoot();
      this.lastShotTime = currentTime;
    }
  }

  private shoot(): void {
    if (!this.mesh) return;

    // Calculate barrel tip position in world space
    const barrelTip = this.barrelOffset.clone();
    this.mesh.localToWorld(barrelTip);

    // Create bullet
    const bulletGeometry = new SphereGeometry(0.05);
    const bulletMaterial = new MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new Mesh(bulletGeometry, bulletMaterial);

    // Set bullet position to barrel tip
    bullet.position.copy(barrelTip);

    // Calculate shooting direction from camera
    const direction = new Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);

    // Store bullet data
    bullet.userData = {
      velocity: this.bulletSpeed,
      direction: direction,
      createdAt: performance.now(),
      lifespan: this.bulletLifespan,
      alive: true,
      damage: this.damage,
      trailLength: this.bulletTrailLength,
      startPosition: barrelTip.clone(),
      previousPosition: barrelTip.clone(),
    };

    // Create bullet trail
    this.effects.createBulletTrail(bullet, 0xffff00);

    // Add bullet to scene and tracking array
    this.scene.add(bullet);
    this.bullets.push(bullet);

    // Create muzzle flash
    this.effects.createMuzzleFlash(barrelTip, direction);

    // Apply recoil animation
    this.applyRecoil();

    // Shake camera
    this.shakeCamera(0.05);
  }

  private applyRecoil(): void {
    if (!this.mesh) return;

    const originalPosition = this.mesh.position.clone();
    const originalRotation = this.mesh.rotation.clone();
    const recoilDistance = 0.05;
    const recoilAngle = 0.1;
    const recoilDuration = 100; // milliseconds
    const startTime = performance.now();

    const applyRecoilFrame = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / recoilDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      if (progress < 1) {
        // Move back and up
        this.mesh!.position.z = originalPosition.z + recoilDistance * (1 - easeOut);
        this.mesh!.position.y =
          originalPosition.y + recoilDistance * 0.5 * Math.sin(progress * Math.PI);

        // Rotate up
        this.mesh!.rotation.x = originalRotation.x - recoilAngle * (1 - easeOut);

        requestAnimationFrame(applyRecoilFrame);
      } else {
        // Reset to original position and rotation
        this.mesh!.position.copy(originalPosition);
        this.mesh!.rotation.copy(originalRotation);
      }
    };

    applyRecoilFrame();
  }
}
