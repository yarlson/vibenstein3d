import * as THREE from 'three';
import { Animal } from './Animal';
import { EnemyType as EnemyTypeEnum } from '../types/level';
import { useEnemyStore } from '../state/enemyStore';
import { usePlayerStore } from '../state/playerStore';
import { useGameStore } from '../state/gameStore';
import { v4 as uuidv4 } from 'uuid';
import { triggerCameraShake } from '../utils/cameraUtils';

// Add specific types for WebAudioAPI compatibility at the top of the file
interface AudioContextWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Add interface for objects with geometry
interface ObjectWithGeometry extends THREE.Object3D {
  geometry?: THREE.BufferGeometry;
}

// Interface for enemy parts to make TypeScript happy
interface EnemyParts {
  [key: string]: THREE.Mesh;
}

// Different configurations for enemy types
interface EnemyConfig {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  detectionRange: number;
  scale: number;
  color: number;
  bulletColor: number;
}

// Configurations for different enemy types
const ENEMY_CONFIGS: Record<EnemyTypeEnum, EnemyConfig> = {
  [EnemyTypeEnum.Grunt]: {
    health: 30,
    speed: 2,
    damage: 5,
    attackRange: 15,
    detectionRange: 20,
    scale: 0.8,
    color: 0x333333,
    bulletColor: 0xff0000,
  },
  [EnemyTypeEnum.Guard]: {
    health: 50,
    speed: 1.5,
    damage: 10,
    attackRange: 15,
    detectionRange: 20,
    scale: 1,
    color: 0x555555,
    bulletColor: 0xff5500,
  },
  [EnemyTypeEnum.Boss]: {
    health: 200,
    speed: 1,
    damage: 20,
    attackRange: 20,
    detectionRange: 30,
    scale: 1.5,
    color: 0x990000,
    bulletColor: 0xff0000,
  },
};

/**
 * Recursively checks if an object or any of its parents is an enemy.
 * This is a strict check to avoid creating impact markers on enemies.
 */
function isEnemyObject(object: THREE.Object3D | null): boolean {
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

/**
 * Enemy class for hostile NPCs
 */
export class Enemy extends Animal {
  private camera: THREE.Camera;
  private type: EnemyTypeEnum;
  private health: number;
  private attackRange: number;
  private detectionRange: number;
  private shootInterval: number;
  private lastShootTime: number;
  private damage: number;
  private accuracy: number;
  private moveSpeed: number;
  private rotationSpeed: number;
  private parts: EnemyParts;
  private bulletSpeed: number;
  private bullets: THREE.Mesh[];
  private isAggressive: boolean; // Future behavior modes
  private bulletSize: number;
  private bulletColor: number;
  private scale: number;
  private audioContext: AudioContext | null;

  // Unique identifier for the enemy
  private id: string;

  // New explicit alive flag: enemy is active only if alive is true.
  public alive: boolean = true;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    camera: THREE.Camera,
    type: EnemyTypeEnum = EnemyTypeEnum.Grunt
  ) {
    super(scene, position);

    this.camera = camera;
    this.type = type;

    // Generate a unique ID for this enemy
    this.id = uuidv4();

    console.log(`[ENEMY] Created enemy with ID ${this.id} of type ${type}`);

    // Load configuration based on enemy type
    const config = ENEMY_CONFIGS[type];

    this.health = config.health;
    this.moveSpeed = config.speed;
    this.damage = config.damage;
    this.attackRange = config.attackRange;
    this.detectionRange = config.detectionRange;
    this.scale = config.scale;
    this.bulletColor = config.bulletColor;

    // Common properties for all enemy types
    this.shootInterval = 2000; // milliseconds
    this.lastShootTime = 0;
    this.accuracy = 0.8;
    this.rotationSpeed = 2;
    this.parts = {};
    this.bulletSpeed = 20;
    this.bullets = [];
    this.isAggressive = true;
    this.bulletSize = 0.1;

    // Initialize audio if supported
    try {
      // Use proper typing for AudioContext compatibility
      const AudioContextConstructor =
        window.AudioContext || (window as AudioContextWithWebkit).webkitAudioContext;

      if (AudioContextConstructor) {
        this.audioContext = new AudioContextConstructor();
        this.loadSounds();
      } else {
        this.audioContext = null;
      }
    } catch (error) {
      // Log the error and continue
      this.audioContext = null;
      console.log('Error initializing audio context:', error);
    }
  }

  /**
   * Create the enemy's 3D representation
   */
  create(): THREE.Group {
    console.log(`[ENEMY] Creating 3D mesh for enemy ${this.id}`);

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Add userData to identify as enemy and track alive status
    this.mesh.userData = {
      type: 'enemy',
      alive: this.alive,
      id: this.id,
    };

    // Apply scale
    this.mesh.scale.set(this.scale, this.scale, this.scale);

    // Create enemy body (torso)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: ENEMY_CONFIGS[this.type].color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    // Add userData to identify as enemy
    body.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(body);
    this.parts.body = body;

    // Create enemy head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: ENEMY_CONFIGS[this.type].color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    // Add userData to identify as enemy
    head.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(head);
    this.parts.head = head;

    // Create enemy eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 2.5, 0.3);
    // Add userData to identify as enemy
    leftEye.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(leftEye);
    this.parts.leftEye = leftEye;

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 2.5, 0.3);
    // Add userData to identify as enemy
    rightEye.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(rightEye);
    this.parts.rightEye = rightEye;

    // Create enemy arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 1.5, 0);
    leftArm.castShadow = true;
    // Add userData to identify as enemy
    leftArm.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(leftArm);
    this.parts.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 1.5, 0);
    rightArm.castShadow = true;
    // Add userData to identify as enemy
    rightArm.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(rightArm);
    this.parts.rightArm = rightArm;

    // Create enemy gun
    const gunGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.6, 1.5, 0.4);
    // Add userData to identify as enemy
    gun.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(gun);
    this.parts.gun = gun;

    // Create enemy legs
    const legGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.5, 0);
    leftLeg.castShadow = true;
    // Add userData to identify as enemy
    leftLeg.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(leftLeg);
    this.parts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.5, 0);
    rightLeg.castShadow = true;
    // Add userData to identify as enemy
    rightLeg.userData = { type: 'enemy', parentId: this.id };
    this.mesh.add(rightLeg);
    this.parts.rightLeg = rightLeg;

    // Add enemy's mesh to walls array in game store for collision detection
    const gameStore = useGameStore.getState();
    gameStore.addWall(this.mesh);

    return this.mesh;
  }

  /**
   * Update the enemy's state if alive
   */
  update(delta: number, time: number, walls: THREE.Object3D[]): void {
    // If not alive, do nothing
    if (!this.alive) return;

    // Calculate distance to player
    const playerPosition = this.camera.position.clone();
    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
    const directionToPlayer = new THREE.Vector3()
      .subVectors(playerPosition, this.mesh.position)
      .normalize();

    if (this.isAggressive && distanceToPlayer < this.detectionRange) {
      this.rotateTowards(directionToPlayer, delta);

      if (distanceToPlayer > this.attackRange / 2) {
        const moveDistance = this.moveSpeed * delta;
        this.mesh.position.add(directionToPlayer.clone().multiplyScalar(moveDistance));
        this.animateWalking(time);
      } else {
        this.resetWalkingAnimation();
      }

      if (distanceToPlayer < this.attackRange) {
        this.tryShoot(time);
      }
    }

    this.updateBullets(delta, walls);
    this.checkCollisions(walls);

    // Ensure enemy stays on ground level
    if (this.mesh.position.y !== 0.5 * this.scale) {
      this.mesh.position.y = 0.5 * this.scale;
    }
  }

  private rotateTowards(direction: THREE.Vector3, delta: number): void {
    const targetRotation = Math.atan2(direction.x, direction.z);
    let angleDiff = targetRotation - this.mesh.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const rotationAmount =
      Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.rotationSpeed * delta);
    this.mesh.rotation.y += rotationAmount;
  }

  private animateWalking(time: number): void {
    const legSwing = Math.sin(time * 5) * 0.2;
    this.parts.leftLeg.rotation.x = legSwing;
    this.parts.rightLeg.rotation.x = -legSwing;
    this.parts.leftArm.rotation.x = -legSwing;
    this.parts.rightArm.rotation.x = legSwing;
  }

  private resetWalkingAnimation(): void {
    this.parts.leftLeg.rotation.x = 0;
    this.parts.rightLeg.rotation.x = 0;
    this.parts.leftArm.rotation.x = 0;
    this.parts.rightArm.rotation.x = 0;
  }

  private tryShoot(time: number): void {
    if (!this.alive || !this.isAggressive || !this.audioContext) {
      return;
    }
    if (time - this.lastShootTime > this.shootInterval / 1000) {
      this.shoot();
      this.lastShootTime = time;
    }
  }

  private shoot(): void {
    console.log(`[ENEMY ${this.id}] Shooting`);
    if (!this.parts.gun || !this.alive) {
      return;
    }
    const gunPosition = new THREE.Vector3();
    this.parts.gun.getWorldPosition(gunPosition);
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
    if (this.accuracy < 1) {
      const inaccuracy = (1 - this.accuracy) * 0.2;
      direction.x += (Math.random() - 0.5) * inaccuracy;
      direction.y += (Math.random() - 0.5) * inaccuracy;
      direction.z += (Math.random() - 0.5) * inaccuracy;
      direction.normalize();
    }
    if (!this.alive) return;
    this.createBullet(gunPosition, direction);
    if (this.alive) this.playSound('shoot');
    if (this.alive) this.createMuzzleFlash(gunPosition);
  }

  private createBullet(position: THREE.Vector3, direction: THREE.Vector3): THREE.Mesh {
    if (!this.alive) return null as unknown as THREE.Mesh;
    const bulletGeometry = new THREE.SphereGeometry(this.bulletSize, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: this.bulletColor });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(position);
    this.scene.add(bullet);
    bullet.userData = {
      velocity: direction.clone().multiplyScalar(this.bulletSpeed),
      damage: this.damage,
      lifetime: 0,
      maxLifetime: 5,
      createdBy: 'enemy',
    };
    this.bullets.push(bullet);
    return bullet;
  }

  private updateBullets(delta: number, walls: THREE.Object3D[]): void {
    if (!this.alive || !this.bullets) return;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));
      bullet.userData.lifetime += delta;
      if (bullet.userData.lifetime > bullet.userData.maxLifetime) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
        continue;
      }
      const collision = this.checkBulletCollisions(bullet, walls);
      if (collision) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
        continue;
      }
      if (this.checkBulletPlayerCollision(bullet)) {
        this.scene.remove(bullet);
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkBulletCollisions(bullet: THREE.Mesh, walls: THREE.Object3D[]): boolean {
    if (!walls || walls.length === 0) return false;
    const raycaster = new THREE.Raycaster();
    const prevPosition = bullet.position
      .clone()
      .sub(bullet.userData.velocity.clone().multiplyScalar(0.016));
    raycaster.set(prevPosition, bullet.userData.velocity.clone().normalize());
    const distanceToTravel = prevPosition.distanceTo(bullet.position);
    const intersects = raycaster.intersectObjects(walls);
    if (intersects.length > 0 && intersects[0].distance < distanceToTravel) {
      const hitPoint = intersects[0].point;
      const normal = intersects[0].face?.normal || new THREE.Vector3(0, 1, 0);
      const hitObject = intersects[0].object;

      // Use the isEnemyObject function for a more thorough check
      const isEnemy = isEnemyObject(hitObject);
      if (!isEnemy) {
        this.createImpactEffect(hitPoint, normal, hitObject);
      } else {
        // For enemies, create particles but no impact mark
        this.createImpactParticlesOnly(hitPoint, normal);
      }
      return true;
    }
    return false;
  }

  private checkBulletPlayerCollision(bullet: THREE.Mesh): boolean {
    const playerPosition = usePlayerStore.getState().playerPosition;
    if (!playerPosition) return false;

    const distance = bullet.position.distanceTo(
      new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2])
    );

    if (distance < 0.5) {
      // Remove bullet
      this.bullets = this.bullets.filter((b) => b !== bullet);
      if (bullet.parent) {
        bullet.parent.remove(bullet);
      }

      // Damage player
      const takeDamage = usePlayerStore.getState().takeDamage;
      takeDamage(bullet.userData.damage);
      this.createBloodEffect(new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]));

      // Use the triggerCameraShake function from EnemyController
      triggerCameraShake(0.5);

      return true;
    }
    return false;
  }

  /**
   * Create an impact effect at the hit point
   * @param position Position of the impact
   * @param normal Surface normal at the impact point
   * @param hitObject The object that was hit
   */
  private createImpactEffect(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    hitObject: THREE.Object3D
  ): void {
    const gameStore = useGameStore.getState();

    // Create impact particles
    const particleCount = 5;
    const particles: THREE.Mesh[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Create particle
      const size = 0.02 + Math.random() * 0.03;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00, // Yellow sparks
        transparent: true,
        opacity: 0.8,
      });

      const particle = new THREE.Mesh(geometry, material);

      // Position at impact point
      particle.position.copy(position);

      // Add random velocity in hemisphere around normal
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      // Make sure velocity is in hemisphere of normal
      if (velocity.dot(normal) < 0) {
        velocity.reflect(normal);
      }

      // Scale velocity
      velocity.multiplyScalar(2 + Math.random() * 3);

      // Add to particle data
      particle.userData = {
        velocity: velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      };

      // Add to scene
      this.scene.add(particle);
      particles.push(particle);
    }

    // Add particles to gameStore
    particles.forEach((particle) => {
      gameStore.addParticle(particle);
    });

    // Create impact mark only if not hitting an enemy
    if (hitObject && !isEnemyObject(hitObject)) {
      // Create a black impact mark
      const markSize = 0.05 + Math.random() * 0.05;
      const markGeometry = new THREE.CircleGeometry(markSize, 8);
      const markMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mark = new THREE.Mesh(markGeometry, markMaterial);

      // Position and orient the mark
      mark.position.copy(position).addScaledVector(normal, 0.01);
      mark.lookAt(position.clone().add(normal));

      // Add to scene
      this.scene.add(mark);

      // Add mark data for lifecycle management
      mark.userData = {
        lifetime: 0,
        maxLifetime: 20, // Seconds
        initialOpacity: 0.7,
        parentObject: hitObject,
      };

      // Add to gameStore
      gameStore.addImpactMarker(mark);
    }
  }

  // New method that only creates particles, no impact marker
  private createImpactParticlesOnly(position: THREE.Vector3, normal: THREE.Vector3): void {
    // Create particle effects
    const particleCount = 5;
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < particleCount; i++) {
      const size = 0.02 + Math.random() * 0.03;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      if (velocity.dot(normal) < 0) velocity.reflect(normal);
      velocity.multiplyScalar(2 + Math.random() * 3);
      particle.userData = {
        velocity: velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      };
      this.scene.add(particle);
      particles.push(particle);
    }

    // Replace window.particles with gameStore particles
    const gameStore = useGameStore.getState();
    particles.forEach((particle) => {
      gameStore.addParticle(particle);
    });
  }

  /**
   * Create a blood effect at the hit point
   * @param position Position of the impact
   */
  private createBloodEffect(position: THREE.Vector3): void {
    const gameStore = useGameStore.getState();

    // Create blood particles
    const particleCount = 10;
    const particles: THREE.Mesh[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Create particle
      const size = 0.02 + Math.random() * 0.03;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000, // Red blood
        transparent: true,
        opacity: 0.9,
      });

      const particle = new THREE.Mesh(geometry, material);

      // Position at impact point
      particle.position.copy(position);

      // Add random velocity in all directions
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      // Scale velocity
      velocity.multiplyScalar(1 + Math.random() * 2);

      // Add to particle data
      particle.userData = {
        velocity: velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      };

      // Add to scene
      this.scene.add(particle);
      particles.push(particle);
    }

    // Add particles to gameStore
    particles.forEach((particle) => {
      gameStore.addParticle(particle);
    });

    // Also add a temporary blood splash on the floor
    const splashSize = 0.2 + Math.random() * 0.1;
    const splashGeometry = new THREE.CircleGeometry(splashSize, 8);
    const splashMaterial = new THREE.MeshBasicMaterial({
      color: 0x990000, // Darker red for floor splash
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const splash = new THREE.Mesh(splashGeometry, splashMaterial);

    // Position on the floor below the hit position
    const floorPosition = position.clone();
    floorPosition.y = 0.01; // Just above the floor
    splash.position.copy(floorPosition);
    splash.rotation.x = -Math.PI / 2; // Lay flat on the floor

    // Add to scene
    this.scene.add(splash);

    // Add splash data for lifecycle management
    splash.userData = {
      lifetime: 0,
      maxLifetime: 10, // Seconds
      initialOpacity: 0.7,
    };

    // Add to gameStore
    gameStore.addImpactMarker(splash);
  }

  /**
   * Create a muzzle flash at the gun
   * @param position Position of the muzzle flash
   */
  private createMuzzleFlash(position: THREE.Vector3): void {
    if (!this.alive) return;

    // Create muzzle flash light
    const light = new THREE.PointLight(0xffaa00, 1, 3);
    light.position.copy(position);
    this.scene.add(light);

    // Create a visible flash element
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);

    // Remove light and flash after a short time
    setTimeout(() => {
      this.scene.remove(light);
      this.scene.remove(flash);
    }, 50);
  }

  /**
   * Handle enemy death
   */
  die(): void {
    // If already flagged as dead, exit early
    if (!this.alive) {
      console.log(`[ENEMY] Die called on already dead enemy ${this.id}`);
      return;
    }

    console.log(`[ENEMY] Enemy ${this.id} dying`);

    // Mark enemy as not alive
    this.alive = false;

    // Also update the mesh userData
    if (this.mesh) {
      this.mesh.userData.alive = false;
    }

    // Play death sound
    try {
      this.playSound('death');
    } catch (e) {
      console.error('Error playing death sound:', e);
    }

    // Create death effect (particles, blood pool, etc.)
    this.createDeathEffect();

    // Update the alive status in the Zustand store
    try {
      const enemyStore = useEnemyStore.getState();
      enemyStore.updateEnemy(this.id, { isAlive: false });
    } catch (e) {
      console.error('Error updating enemy in store on death:', e);
    }

    // Remove from enemies array and walls array after a delay
    // This allows death effects to play and keeps the enemy visible briefly
    setTimeout(() => {
      // Only proceed with cleanup if the component is still mounted
      if (!this.scene) return;

      try {
        // Stop all ongoing behaviors
        this.bullets = [];
        this.disableAllBehaviors();

        // Remove enemy instance from store
        const enemyStore = useEnemyStore.getState();
        // We keep the enemy data in the store (for UI, etc.) but mark it as dead
        console.log(`[ENEMY ${this.id}] Removing from store`);
        enemyStore.removeEnemyInstance(this);

        // Destroy the enemy after death effects complete
        this.isDead = true; // For compatibility with base class
      } catch (e) {
        console.error('Error in enemy death cleanup:', e);
      }
    }, 5000);
  }

  /**
   * Create a death effect with particles
   */
  private createDeathEffect(): void {
    const gameStore = useGameStore.getState();

    // Explode parts in random directions
    Object.values(this.parts).forEach((part) => {
      if (part && part.parent) {
        // Add random velocity and rotation
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.15,
          (Math.random() - 0.5) * 0.1
        );

        const angularVelocity = new THREE.Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        // Store velocity and angular velocity on the mesh
        part.userData.velocity = velocity;
        part.userData.angularVelocity = angularVelocity;
        part.userData.lifetime = 0;
        part.userData.maxLifetime = 2 + Math.random() * 2; // 2-4 seconds

        // Add to gameStore's particles for physics and lifetime handling
        gameStore.addParticle(part);
      }
    });

    this.createBloodPool();

    // Use the triggerCameraShake function from EnemyController
    triggerCameraShake(0.5);
  }

  /**
   * Create a blood pool under the dead enemy
   */
  private createBloodPool(): void {
    // Create blood pool geometry and material
    const poolGeometry = new THREE.CircleGeometry(1, 16);
    const poolMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa0000,
      transparent: true,
      opacity: 0.7,
    });

    // Create blood pool mesh
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);

    // Position just above the ground under the enemy
    pool.rotation.x = -Math.PI / 2; // Rotate to lay flat on ground
    pool.position.copy(this.mesh.position);
    pool.position.y = 0.01; // Position just above ground to avoid z-fighting

    // Add to scene
    this.scene.add(pool);

    // Store reference in gameStore for management
    const gameStore = useGameStore.getState();
    gameStore.addImpactMarker(pool);

    // Set pool data for lifecycle management
    pool.userData = {
      lifetime: 0,
      maxLifetime: 30, // Blood pool stays for 30 seconds
      initialOpacity: 0.7,
      parentObject: this.mesh,
    };

    // Animate pool growing over time
    let scale = 0.1;
    const maxScale = 1 + Math.random() * 0.5;

    const growPool = () => {
      scale += 0.05;
      pool.scale.set(scale, scale, scale);

      if (scale < maxScale && pool.parent) {
        requestAnimationFrame(growPool);
      }
    };

    growPool();
  }

  /**
   * Take damage and update health
   */
  takeDamage(damage: number): void {
    if (!this.alive) {
      return;
    }

    // Apply damage
    this.health = Math.max(0, this.health - damage);

    // Play hit sound
    try {
      this.playSound('hit');
    } catch (e) {
      console.error('Error playing hit sound:', e);
    }

    // Update health in the Zustand store
    try {
      const enemyStore = useEnemyStore.getState();

      // Diagnostic: check if enemy exists in store before updating
      const storeEnemy = enemyStore.enemies.find((e) => e.id === this.id);
      if (!storeEnemy) {
        enemyStore.addEnemy({
          id: this.id,
          health: this.health,
          isAlive: this.alive,
        });
      }

      // Check if instance exists
      const storeInstances = enemyStore.enemyInstances;
      const instanceExists = storeInstances.some((e) => e.getId() === this.id);

      if (!instanceExists) {
        enemyStore.addEnemyInstance(this);
      }

      // Update the enemy in the store
      enemyStore.updateEnemy(this.id, { health: this.health });
    } catch (e) {
      console.error('Error updating enemy in store:', e);
    }

    // Visual feedback for hit - flash the enemy red
    try {
      this.flashDamageEffect();
    } catch (e) {
      console.error('Error applying flash damage effect:', e);
    }

    // Check if enemy is dead after taking damage
    if (this.health <= 0 && this.alive) {
      this.die();
    }
  }

  /**
   * Create a visual damage effect when hit
   */
  private flashDamageEffect(): void {
    // Flash all parts of the enemy red
    Object.keys(this.parts).forEach((partName) => {
      try {
        const part = this.parts[partName];
        if (!part || !part.material) {
          return;
        }

        // Helper function to check if a material has a color property
        const hasColorProperty = (mat: THREE.Material): boolean =>
          Object.prototype.hasOwnProperty.call(mat, 'color');

        // Handle both single material and material array
        if (Array.isArray(part.material)) {
          // Handle material array
          part.material.forEach((mat) => {
            if (hasColorProperty(mat)) {
              // Cast to MeshBasicMaterial to access color
              const meshMat = mat as THREE.MeshBasicMaterial;
              // Store original color
              const originalColor = meshMat.color.clone();
              // Set to red
              meshMat.color.set(0xff0000);

              // Restore original color after a short time
              setTimeout(() => {
                if (part && part.parent) {
                  meshMat.color.copy(originalColor);
                }
              }, 200);
            }
          });
        } else if (hasColorProperty(part.material)) {
          // Handle single material (cast to appropriate type)
          const meshMat = part.material as THREE.MeshBasicMaterial;
          // Store original color
          const originalColor = meshMat.color.clone();
          // Set to red
          meshMat.color.set(0xff0000);

          // Restore original color after a short time
          setTimeout(() => {
            if (part && part.parent) {
              meshMat.color.copy(originalColor);
            }
          }, 200);
        } else {
          console.log(`Part ${partName} material has no color property`);
        }
      } catch (e) {
        console.error(`Error flashing part ${partName}:`, e);
      }
    });
  }

  private disableAllBehaviors(): void {
    this.bullets = [];
    for (const partName in this.parts) {
      const part = this.parts[partName];
      if (part) {
        part.userData.disabled = true;
      }
    }
    this.mesh.userData.isDead = true;
  }

  private loadSounds(): void {}

  getHealth(): number {
    return this.health;
  }

  private checkCollisions(walls: THREE.Object3D[]): void {
    // Skip if enemy is dead or no walls provided
    if (!this.alive || !walls || !walls.length) return;

    // Simple collision detection with walls
    for (const wall of walls) {
      // Check if wall has properties we need for collision
      const wallObj = wall as ObjectWithGeometry;
      if (!wallObj.geometry) continue;

      // Create bounding boxes
      const enemyBox = new THREE.Box3().setFromObject(this.mesh);
      const wallBox = new THREE.Box3().setFromObject(wall);

      // Check for collision
      if (enemyBox.intersectsBox(wallBox)) {
        // Move away from wall
        const enemyCenter = enemyBox.getCenter(new THREE.Vector3());
        const wallCenter = wallBox.getCenter(new THREE.Vector3());

        const direction = new THREE.Vector3().subVectors(enemyCenter, wallCenter).normalize();

        // Move enemy away from wall
        this.mesh.position.add(direction.multiplyScalar(0.1));
      }
    }
  }

  /**
   * Play a sound effect based on type.
   */
  private playSound(type: 'shoot' | 'hit' | 'death'): void {
    // Block ALL sounds from dead enemies EXCEPT death sound
    if (!this.alive && type !== 'death') {
      return;
    }

    try {
      // Use proper typing for AudioContext
      const AudioContextConstructor =
        window.AudioContext || (window as AudioContextWithWebkit).webkitAudioContext;

      if (AudioContextConstructor) {
        // Create a fresh audio context for each sound - more reliable but less efficient
        const ctx = new AudioContextConstructor();

        // Create and play sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type) {
          case 'shoot':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);

            // Auto-close context after sound completes
            setTimeout(() => ctx.close(), 200);
            break;

          case 'hit':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);

            // Auto-close context after sound completes
            setTimeout(() => ctx.close(), 300);
            break;

          case 'death':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.5);

            // Auto-close context after sound completes
            setTimeout(() => ctx.close(), 600);
            break;
        }
      }
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  }

  /**
   * Clean up resources when enemy is destroyed
   */
  destroy(): void {
    // Add a check to prevent destroying enemies that are still alive unless explicitly marked as dead
    if (this.alive && !this.isDead) {
      console.warn(
        `[ENEMY] Attempt to destroy still-alive enemy ${this.id} - preventing destruction`
      );
      return;
    }

    if (!this.scene) {
      console.log(`[ENEMY] Destroy called on already destroyed enemy ${this.id}`);
      return; // Already destroyed
    }

    console.log(`[ENEMY] Destroying enemy ${this.id}`);

    try {
      // Remove all meshes from scene
      if (this.mesh) {
        // Process any child meshes
        while (this.mesh.children.length > 0) {
          const child = this.mesh.children[0];
          this.mesh.remove(child);
          this.scene.remove(child);
        }
        // Remove the main mesh
        this.scene.remove(this.mesh);
      }

      // Clean up bullets
      this.bullets.forEach((bullet) => {
        console.log(`[ENEMY] Destroying bullet: ${bullet.userData.createdBy}`);
        if (bullet && bullet.parent) {
          this.scene.remove(bullet);
        }
      });
      this.bullets = [];

      // Remove from the Zustand store
      try {
        const enemyStore = useEnemyStore.getState();
        enemyStore.removeEnemy(this.id);
      } catch (e) {
        console.error('Error removing enemy from store during destroy:', e);
      }

      // Clean up audio
      if (this.audioContext) {
        try {
          this.audioContext.close();
          this.audioContext = null;
        } catch (e) {
          console.error('Error closing audio context:', e);
        }
      }
    } catch (e) {
      console.error('Error destroying enemy:', e);
    }
  }

  // Getter for ID
  getId(): string {
    return this.id;
  }

  // Getter for mesh
  getMesh(): THREE.Group {
    return this.mesh;
  }

  // Add this method for compatibility with the Gun class
  getIsDead(): boolean {
    return !this.alive || this.isDead;
  }
}
