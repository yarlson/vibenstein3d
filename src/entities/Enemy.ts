import * as THREE from 'three';
import { Animal } from './Animal';
import { EnemyType as EnemyTypeEnum } from '../types/level';
import { useEnemyStore } from '../state/enemyStore';
import { usePlayerStore } from '../state/playerStore';
import { useGameStore } from '../state/gameStore';
import { v4 as uuidv4 } from 'uuid';

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
  private sounds: { [key: string]: AudioBuffer | null };

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
      const AudioContextConstructor = window.AudioContext || 
        (window as AudioContextWithWebkit).webkitAudioContext;
      
      if (AudioContextConstructor) {
        this.audioContext = new AudioContextConstructor();
        this.sounds = {
          shoot: null,
          hit: null,
          death: null,
        };
        this.loadSounds();
      } else {
        this.audioContext = null;
        this.sounds = {
          shoot: null,
          hit: null,
          death: null,
        };
      }
    } catch (error) {
      // Log the error and continue
      console.warn('Web Audio API not supported in this browser', error instanceof Error ? error.message : 'Unknown error');
      this.audioContext = null;
      this.sounds = {
        shoot: null,
        hit: null,
        death: null,
      };
    }

    // Add this enemy to the Zustand store
    const enemyStore = useEnemyStore.getState();
    enemyStore.addEnemy({
      id: this.id,
      health: this.health,
      isAlive: this.alive
    });
  }

  /**
   * Create the enemy's 3D representation
   */
  create(): THREE.Group {
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Apply scale
    this.mesh.scale.set(this.scale, this.scale, this.scale);

    // Create enemy body (torso)
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: ENEMY_CONFIGS[this.type].color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    this.mesh.add(body);
    this.parts.body = body;

    // Create enemy head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: ENEMY_CONFIGS[this.type].color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    this.mesh.add(head);
    this.parts.head = head;

    // Create enemy eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 2.5, 0.3);
    this.mesh.add(leftEye);
    this.parts.leftEye = leftEye;
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 2.5, 0.3);
    this.mesh.add(rightEye);
    this.parts.rightEye = rightEye;

    // Create enemy arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 1.5, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);
    this.parts.leftArm = leftArm;
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 1.5, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);
    this.parts.rightArm = rightArm;

    // Create enemy gun
    const gunGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.6, 1.5, 0.4);
    this.mesh.add(gun);
    this.parts.gun = gun;

    // Create enemy legs
    const legGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.5, 0);
    leftLeg.castShadow = true;
    this.mesh.add(leftLeg);
    this.parts.leftLeg = leftLeg;
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.5, 0);
    rightLeg.castShadow = true;
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
      if (!this.alive) console.log('Stopped tryShoot - Enemy is dead');
      return;
    }
    if (time - this.lastShootTime > this.shootInterval / 1000) {
      this.shoot();
      this.lastShootTime = time;
    }
  }

  private shoot(): void {
    if (!this.parts.gun || !this.alive) {
      console.log('Cannot shoot: missing gun part or enemy dead');
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
      this.createImpactEffect(hitPoint, normal);
      return true;
    }
    return false;
  }

  private checkBulletPlayerCollision(bullet: THREE.Mesh): boolean {
    const playerPosition = this.camera.position.clone();
    const playerRadius = 0.5;
    const distance = bullet.position.distanceTo(playerPosition);
    if (distance < playerRadius + this.bulletSize) {
      const takeDamage = usePlayerStore.getState().takeDamage;
      takeDamage(bullet.userData.damage);
      this.createBloodEffect(playerPosition);
      if (window.shakeCamera) window.shakeCamera(0.5);
      return true;
    }
    return false;
  }

  private createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3): void {
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
    if (window.particles) {
      window.particles.push(...particles);
    }
  }

  private createBloodEffect(position: THREE.Vector3): void {
    const particleCount = 10;
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < particleCount; i++) {
      const size = 0.02 + Math.random() * 0.03;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.9,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      velocity.multiplyScalar(1 + Math.random() * 2);
      particle.userData = {
        velocity: velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
      };
      this.scene.add(particle);
      particles.push(particle);
    }
    if (window.particles) {
      window.particles.push(...particles);
    }
  }

  private createMuzzleFlash(position: THREE.Vector3): void {
    if (!this.alive) return;
    const light = new THREE.PointLight(0xffaa00, 1, 3);
    light.position.copy(position);
    this.scene.add(light);
    setTimeout(() => {
      this.scene.remove(light);
    }, 50);
  }

  /**
   * Handle enemy death
   */
  die(): void {
    // If already flagged as dead, exit early
    if (!this.alive) {
      console.log("Enemy already dead, ignoring die() call");
      return;
    }

    console.log(`Enemy died! Type: ${this.type}`);

    // Mark enemy as not alive
    this.alive = false;

    // Immediately disable update logic
    // (For extra safety, override update so that even if called, nothing happens)
    this.update = () => {};

    // Get store instances
    const enemyStore = useEnemyStore.getState();
    const gameStore = useGameStore.getState();

    // Remove from enemy store
    enemyStore.removeEnemyInstance(this);

    // Remove from walls array in the game store
    const wallIndex = gameStore.walls.indexOf(this.mesh);
    if (wallIndex !== -1) {
      console.log("Removing from walls array");
      gameStore.removeWall(this.mesh);
    }

    // Stop any sounds and bullet updates immediately
    this.stopAllAudio();
    this.cleanupBullets();
    this.disableAllBehaviors();

    // Start death sound and visual effect immediately
    this.playDeathSound();
    this.createDeathEffect();

    // Set the legacy isDead flag for compatibility with base class
    this.isDead = true;

    // Remove the enemy's mesh from the scene after a short delay
    // (Short enough to be responsive, long enough to see death animation)
    setTimeout(() => {
      this.destroy();
    }, 1000); // 1-second delay

    // Update the alive status in the Zustand store
    enemyStore.updateEnemy(this.id, { isAlive: false });
  }

  /**
   * Create a death effect with particles
   */
  private createDeathEffect(): void {
    const gameStore = useGameStore.getState();
    const position = this.mesh.position.clone();
    
    // Create particles for death effect
    for (let i = 0; i < 20; i++) {
      const size = Math.random() * 0.2 + 0.1;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color: ENEMY_CONFIGS[this.type].color,
      });
      const particle = new THREE.Mesh(geometry, material);
      
      // Position particle at enemy position with slight random offset
      particle.position.copy(position).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 1 + 0.5,
          (Math.random() - 0.5) * 0.5
        )
      );
      
      // Add velocity and lifetime to particle
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 5,
        (Math.random() - 0.5) * 5
      );
      particle.userData.lifetime = 0;
      particle.userData.maxLifetime = Math.random() * 2 + 1;
      
      // Add to scene and particles array
      this.scene.add(particle);
      gameStore.addParticle(particle);
    }
    
    // Shake camera for dramatic effect
    if (gameStore.shakeCamera) {
      gameStore.shakeCamera(0.5);
    }
  }

  /**
   * Take damage and update health
   */
  takeDamage(damage: number): void {
    if (!this.alive) return;

    console.log('======== ENEMY DAMAGE DEBUG ========');
    console.log(`Enemy type: ${this.type}`);
    console.log(
      `Current position: ${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z}`
    );
    console.log(`Current health: ${this.health}`);
    console.log(`Damage received: ${damage}`);
    console.log(`New health will be: ${this.health - damage}`);
    console.log(`Will die: ${this.health - damage <= 0}`);
    console.log('====================================');
    this.health -= damage;
    this.playSound('hit');

    // Update health in the Zustand store
    const enemyStore = useEnemyStore.getState();
    enemyStore.updateEnemy(this.id, { health: this.health });

    // Check if enemy is dead after taking damage
    if (this.health <= 0 && this.alive) {
      this.die();
    }
  }

  private disableAllBehaviors(): void {
    console.log('Disabling all enemy behaviors');
    this.bullets = [];
    for (const partName in this.parts) {
      const part = this.parts[partName];
      if (part) {
        part.userData.disabled = true;
      }
    }
    this.mesh.userData.isDead = true;
  }

  private playDeathSound(): void {
    try {
      // Use proper typing for AudioContext
      const AudioContextConstructor = window.AudioContext || 
        (window as AudioContextWithWebkit).webkitAudioContext;
      
      if (AudioContextConstructor) {
        const tempContext = new AudioContextConstructor();
        
        const oscillator = tempContext.createOscillator();
        const gainNode = tempContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(tempContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, tempContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, tempContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, tempContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, tempContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(tempContext.currentTime + 0.5);
        
        // Auto-close the context after the sound plays
        setTimeout(() => {
          tempContext.close();
        }, 600);
      }
    } catch (error) {
      console.error("Error playing death sound:", error);
    }
  }

  private stopAllAudio(): void {
    // If we have an audio context, close it to stop all sounds
    if (this.audioContext) {
      // Create a new, temporary context for the death sound
      try {
        // Use proper typing for AudioContext
        const AudioContextConstructor = window.AudioContext || 
          (window as AudioContextWithWebkit).webkitAudioContext;
        
        if (AudioContextConstructor) {
          const tempContext = new AudioContextConstructor();
          
          // Play a brief death sound with the new context
          const oscillator = tempContext.createOscillator();
          const gainNode = tempContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(tempContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, tempContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(55, tempContext.currentTime + 0.5);
          gainNode.gain.setValueAtTime(0.3, tempContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, tempContext.currentTime + 0.5);
          
          oscillator.start();
          oscillator.stop(tempContext.currentTime + 0.5);
          
          // Now close the original context to stop all ongoing sounds
          if (this.audioContext.state !== 'closed') {
            // Create a no-op gain node to silence everything
            const silencer = this.audioContext.createGain();
            silencer.gain.value = 0;
            silencer.connect(this.audioContext.destination);
            
            // Suspend the audio context (this is more compatible than closing)
            if (this.audioContext.state === 'running') {
              this.audioContext.suspend();
            }
          }
          
          // Replace the old audio context with null
          this.audioContext = null;
        }
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    }
    
    // Clear all sound buffers
    this.sounds = {
      shoot: null,
      hit: null,
      death: null
    };
  }

  private cleanupBullets(): void {
    for (const bullet of this.bullets) {
      this.scene.remove(bullet);
    }
    this.bullets = [];
  }

  // Global method to load sounds (stub implementation)
  private loadSounds(): void {
    if (this.audioContext && this.sounds) {
      console.log('Sound system initialized with', Object.keys(this.sounds).length, 'sound slots');
    }
  }

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

        const direction = new THREE.Vector3()
          .subVectors(enemyCenter, wallCenter)
          .normalize();

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
      console.log(`BLOCKED sound ${type} from dead enemy!`);
      return;
    }
    
    // Extra safety logging
    console.log(`Playing ${type} sound for ${this.type} enemy, alive: ${this.alive}`);
    
    try {
      // Use proper typing for AudioContext
      const AudioContextConstructor = window.AudioContext || 
        (window as AudioContextWithWebkit).webkitAudioContext;
      
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
    // ... existing cleanup code ...
    
    // Remove from the Zustand store
    const enemyStore = useEnemyStore.getState();
    enemyStore.removeEnemy(this.id);
    
    // ... rest of destroy method if any ...
  }

  // Getter for ID
  getId(): string {
    return this.id;
  }
  
  // Add this method for compatibility with the Gun class
  getIsDead(): boolean {
    return !this.alive;
  }
}

// Global type definitions
declare global {
  interface Window {
    enemies?: Enemy[];
    enemiesRef?: React.RefObject<Enemy[]>;
    particles?: THREE.Mesh[];
    walls?: THREE.Object3D[];
    shakeCamera?: (intensity: number) => void;
  }
}
