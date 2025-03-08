import React, { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LevelData, EnemySpawn } from '../types/level';
import { Enemy } from '../entities/Enemy';
import { useEnemyStore } from '../state/enemyStore';
import { useGameStore } from '../state/gameStore';

interface EnemyManagerProps {
  level: LevelData;
}

// No longer need to extend Window interface as we're using Zustand stores

export const EnemyManager: React.FC<EnemyManagerProps> = ({ level }) => {
  const { scene, camera } = useThree();
  const enemiesRef = useRef<Enemy[]>([]);
  const wallsRef = useRef<THREE.Object3D[]>([]);
  const worldCenterRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const initialized = useRef<boolean>(false);

  // Get store actions
  const { addEnemyInstance, removeEnemyInstance } = useEnemyStore();
  const { 
    walls, 
    setShakeCamera, 
    particles, 
    removeParticle 
  } = useGameStore();

  // Function to spawn an enemy, memoized with useCallback
  const spawnEnemy = useCallback(
    (spawnData: EnemySpawn) => {
      const [x, z] = spawnData.position;
      const position = new THREE.Vector3(
        x - 5, // Adjust for level grid offset
        0.5, // Half height above ground
        z - 5 // Adjust for level grid offset
      );

      // Create enemy instance
      const enemy = new Enemy(scene, position, camera, spawnData.type);

      // Create mesh and add to scene
      enemy.create();

      // Apply initial rotation if specified
      if (spawnData.rotation !== undefined) {
        enemy.getMesh().rotation.y = spawnData.rotation;
      }

      // Add to local enemies array
      enemiesRef.current.push(enemy);
      
      // Add to enemy store
      addEnemyInstance(enemy);
    },
    [scene, camera, addEnemyInstance]
  );

  // Function to shake the camera, memoized with useCallback
  const shakeCamera = useCallback(
    (intensity: number = 0.5) => {
      const duration = 0.2; // seconds
      const startTime = performance.now() / 1000;

      const applyShake = () => {
        const currentTime = performance.now() / 1000;
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          // Apply random offset to camera
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity,
            0
          );
          camera.position.add(offset);

          // Continue shaking
          requestAnimationFrame(applyShake);
        }
      };

      // Start shaking
      applyShake();
    },
    [camera]
  );

  // Initialize enemy spawns
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log('Initializing EnemyManager with level:', level.name);

    // Calculate world center based on level dimensions
    if (level.dimensions) {
      worldCenterRef.current.set(-level.dimensions.width / 2, 0, -level.dimensions.depth / 2);
    }

    // Get wall meshes from the game store for collision detection
    wallsRef.current = walls;

    // Store the shakeCamera function in the game store
    setShakeCamera(shakeCamera);

    // Spawn initial enemies based on level data
    console.log('Spawning enemies from level data:', level.enemies.length, 'enemies defined');
    level.enemies.forEach((spawnData) => {
      spawnEnemy(spawnData);
    });
    console.log('Enemies spawned, total count:', enemiesRef.current.length);

    // DEBUG: Add key press handler to test damaging enemies
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        console.log('DEBUG: Manually testing enemy damage');
        if (enemiesRef.current.length > 0) {
          // Apply 10 damage to the first enemy
          const enemy = enemiesRef.current[0];
          console.log('Before damage - Enemy health:', enemy.getHealth());
          enemy.takeDamage(10);
          console.log('After damage - Enemy health:', enemy.getHealth());
        } else {
          console.log('No enemies to damage');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Clean up enemies when component unmounts
      enemiesRef.current.forEach((enemy) => {
        enemy.destroy();
        removeEnemyInstance(enemy);
      });

      // Clean up local references
      enemiesRef.current = [];
      
      // Remove debug key handler
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [level, scene, camera, spawnEnemy, shakeCamera, walls, setShakeCamera, addEnemyInstance, removeEnemyInstance]);

  // Update enemies every frame
  useFrame((_, delta) => {
    const time = performance.now() / 1000;
    
    // Double-check and remove any non-alive enemies from the array
    // This should be redundant as they should self-remove, but it's a safety net
    const initialCount = enemiesRef.current.length;
    const aliveEnemies = enemiesRef.current.filter(enemy => enemy.alive);
    
    if (aliveEnemies.length !== initialCount) {
      console.log(`Filter detected and removed ${initialCount - aliveEnemies.length} dead enemies`);
      
      // Remove dead enemies from the store
      const deadEnemies = enemiesRef.current.filter(enemy => !enemy.alive);
      deadEnemies.forEach(enemy => {
        removeEnemyInstance(enemy);
      });
      
      enemiesRef.current = aliveEnemies;
    }
    
    // Update only living enemies
    enemiesRef.current.forEach((enemy) => {
      // Only update enemies that are alive
      if (enemy.alive) {
        enemy.update(delta, time, wallsRef.current);
      } else {
        console.warn("Non-alive enemy still in update loop - this should never happen");
      }
    });

    // Update particles from the game store
    if (particles.length > 0) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Update position based on velocity
        if (particle.userData.velocity) {
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta));
        }

        // Apply gravity
        if (particle.userData.velocity) {
          particle.userData.velocity.y -= 9.8 * delta;
        }

        // Update lifetime
        particle.userData.lifetime += delta;

        // Check if particle has exceeded max lifetime
        if (particle.userData.lifetime > particle.userData.maxLifetime) {
          // Remove particle
          scene.remove(particle);
          removeParticle(particle);
        }
      }
    }
  });

  // This component doesn't render anything directly
  return null;
};
