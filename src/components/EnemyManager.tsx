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
  const { walls, setShakeCamera, particles, removeParticle, impactMarkers, removeImpactMarker } =
    useGameStore();

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

      // Add to enemy store - BOTH data and instance
      try {
        // Get the store from Zustand
        const enemyStore = useEnemyStore.getState();

        // Add enemy data
        enemyStore.addEnemy({
          id: enemy.getId(),
          health: enemy.getHealth(),
          isAlive: !enemy.getIsDead(),
        });

        // Add enemy instance
        enemyStore.addEnemyInstance(enemy);
      } catch (error) {
        console.error('Error adding enemy to store:', error);
      }
    },
    [scene, camera]
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

    // CRITICAL DEBUG: Reset enemy store before adding new enemies to clear any stale state
    try {
      const enemyStore = useEnemyStore.getState();
      // Get initial counts
      const initialEnemyCount = enemyStore.enemies.length;
      const initialInstanceCount = enemyStore.enemyInstances.length;

      // If we have stale data, clear it
      if (initialEnemyCount > 0 || initialInstanceCount > 0) {
        useEnemyStore.setState({
          enemies: [],
          enemyInstances: [],
        });
      }
    } catch (e) {
      console.error('Error resetting enemy store:', e);
    }

    // Calculate world center based on level dimensions
    if (level.dimensions) {
      worldCenterRef.current.set(-level.dimensions.width / 2, 0, -level.dimensions.depth / 2);
    }

    // Get wall meshes from the game store for collision detection
    wallsRef.current = walls;

    // Store the shakeCamera function in the game store
    setShakeCamera(shakeCamera);

    // Spawn initial enemies based on level data
    level.enemies.forEach((spawnData) => {
      spawnEnemy(spawnData);
    });

    // Make sure enemies are in the store
    setTimeout(() => {
      const enemyStore = useEnemyStore.getState();

      if (enemyStore.enemyInstances.length === 0 && enemiesRef.current.length > 0) {
        // Force-add enemies to store
        enemiesRef.current.forEach((enemy) => {
          // Add enemy data
          enemyStore.addEnemy({
            id: enemy.getId(),
            health: enemy.getHealth(),
            isAlive: !enemy.getIsDead(),
          });

          // Add enemy instance
          enemyStore.addEnemyInstance(enemy);
        });
      }
    }, 1000); // Check after 1 second to make sure initialization is complete

    // DEBUG: Add key press handler to test damaging enemies
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (enemiesRef.current.length > 0) {
          // Apply 10 damage to the first enemy
          const enemy = enemiesRef.current[0];
          enemy.takeDamage(10);
        } else {
          console.log('No enemies to damage');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Clean up enemies when component unmounts
      enemiesRef.current.forEach((enemy) => {
        try {
          // Destroy the enemy
          enemy.destroy();

          // Get the store reference
          const enemyStore = useEnemyStore.getState();

          // Remove from both arrays in the store
          enemyStore.removeEnemy(enemy.getId());
          enemyStore.removeEnemyInstance(enemy);
        } catch (e) {
          console.error('Error cleaning up enemy:', e);
        }
      });

      // Clean up local references
      enemiesRef.current = [];

      // Remove debug key handler
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    level,
    scene,
    camera,
    spawnEnemy,
    shakeCamera,
    walls,
    setShakeCamera,
    addEnemyInstance,
    removeEnemyInstance,
  ]);

  // Update enemies every frame
  useFrame((_, delta) => {
    const time = performance.now() / 1000;

    // Double-check and remove any non-alive enemies from the array
    // This should be redundant as they should self-remove, but it's a safety net
    const initialCount = enemiesRef.current.length;
    const aliveEnemies = enemiesRef.current.filter((enemy) => enemy.alive);

    if (aliveEnemies.length !== initialCount) {
      // Remove dead enemies from the store
      const deadEnemies = enemiesRef.current.filter((enemy) => !enemy.alive);
      deadEnemies.forEach((enemy) => {
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
        console.warn('Non-alive enemy still in update loop - this should never happen');
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

    // Check for impact markers with parent objects that no longer exist
    if (impactMarkers.length > 0) {
      for (let i = impactMarkers.length - 1; i >= 0; i--) {
        const marker = impactMarkers[i];

        // If the marker doesn't have a parent object, skip checking
        if (!marker.userData.parentObject) {
          continue;
        }

        const parentObject = marker.userData.parentObject;

        // Check if parentObject still exists in scene
        if (!parentObject.parent) {
          scene.remove(marker);
          removeImpactMarker(marker);
          continue;
        }

        // Check if parentObject is an enemy that died
        if (
          parentObject.userData &&
          parentObject.userData.type === 'enemy' &&
          !parentObject.userData.alive
        ) {
          scene.remove(marker);
          removeImpactMarker(marker);
          continue;
        }

        // For wall objects, keep the marker (they're removed by the fade timeout)
        // No additional checks needed for walls as they are static
      }
    }
  });

  // This component doesn't render anything directly
  return null;
};
