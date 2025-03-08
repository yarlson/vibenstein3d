import React, { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LevelData, EnemySpawn } from '../types/level';
import { Enemy } from '../entities/Enemy';
import { useEnemyStore, resetEnemyStore } from '../state/enemyStore';
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

  // Helper function to update the enemy store
  const updateEnemyStore = useCallback((enemy: Enemy) => {
    try {
      if (!enemy) {
        return false;
      }

      // Validate enemy has required methods
      if (
        typeof enemy.getId !== 'function' ||
        typeof enemy.getHealth !== 'function' ||
        typeof enemy.getIsDead !== 'function'
      ) {
        return false;
      }

      const attemptUpdate = (retryCount = 0, maxRetries = 3) => {
        // Get the store from Zustand
        const enemyStore = useEnemyStore.getState();

        // Check if enemy is already in the store
        const existingEnemyData = enemyStore.enemies.find((e) => e.id === enemy.getId());
        const existingEnemyInstance = enemyStore.enemyInstances.includes(enemy);

        if (existingEnemyData && existingEnemyInstance) {
          return true;
        }

        // Capture store before modification for comparison
        const beforeEnemies = [...enemyStore.enemies];
        const beforeInstances = [...enemyStore.enemyInstances];

        // Add enemy data
        enemyStore.addEnemy({
          id: enemy.getId(),
          health: enemy.getHealth(),
          isAlive: !enemy.getIsDead(),
        });

        // Immediately verify if the store state changed
        const afterEnemyData = useEnemyStore.getState().enemies;

        if (afterEnemyData.length <= beforeEnemies.length) {
          if (retryCount < maxRetries) {
            return attemptUpdate(retryCount + 1, maxRetries);
          }

          // Try to force update the state directly as a fallback
          try {
            useEnemyStore.setState((state) => ({
              enemies: [
                ...state.enemies,
                {
                  id: enemy.getId(),
                  health: enemy.getHealth(),
                  isAlive: !enemy.getIsDead(),
                },
              ],
            }));
          } catch (e) {
            console.error('updateEnemyStore: Force update failed:', e);
          }
        }

        // Add enemy instance
        enemyStore.addEnemyInstance(enemy);

        // Immediately verify if the store state changed
        const afterEnemyInstances = useEnemyStore.getState().enemyInstances;

        if (afterEnemyInstances.length <= beforeInstances.length) {
          if (retryCount < maxRetries) {
            return attemptUpdate(retryCount + 1, maxRetries);
          }

          // Try to force update the state directly as a fallback
          try {
            useEnemyStore.setState((state) => ({
              enemyInstances: [...state.enemyInstances, enemy],
            }));
          } catch (e) {
            console.error('updateEnemyStore: Force update failed:', e);
          }
        }

        // Schedule a check to verify the enemy remains in the store
        setTimeout(() => {
          const currentStore = useEnemyStore.getState();
          const stillInStoreData = currentStore.enemies.some((e) => e.id === enemy.getId());
          const stillInStoreInstance = currentStore.enemyInstances.includes(enemy);

          if (!stillInStoreData || !stillInStoreInstance) {
            if (retryCount < maxRetries) {
              return attemptUpdate(retryCount + 1, maxRetries);
            }
          }
        }, 100);

        return true;
      };

      return attemptUpdate();
    } catch (error) {
      console.log('updateEnemyStore: Error updating enemy store:', error);
      return false;
    }
  }, []);

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

      // Add to enemy store using our helper function
      updateEnemyStore(enemy);
    },
    [scene, camera, updateEnemyStore]
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

    // Reset enemy store only if it contains stale data
    try {
      const enemyStore = useEnemyStore.getState();
      // Get initial counts
      const initialEnemyCount = enemyStore.enemies.length;
      const initialInstanceCount = enemyStore.enemyInstances.length;

      // If we have stale data, clear it
      if (initialEnemyCount > 0 || initialInstanceCount > 0) {
        // Use the safe reset method instead of direct setState
        resetEnemyStore();
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

    // Set up store subscription to monitor for changes
    const unsubscribe = useEnemyStore.subscribe(() => {});

    // Set interval to periodically check the status and repair if needed
    const statusInterval = setInterval(() => {
      const enemyStore = useEnemyStore.getState();

      // Check for and repair any mismatch between local refs and store
      if (
        enemiesRef.current.length > 0 &&
        (enemyStore.enemies.length !== enemiesRef.current.length ||
          enemyStore.enemyInstances.length !== enemiesRef.current.length)
      ) {
        // Only attempt repair if there are no enemies in store but we have local enemies
        if (
          enemyStore.enemies.length === 0 &&
          enemyStore.enemyInstances.length === 0 &&
          enemiesRef.current.length > 0
        ) {
          // Restore all enemies to store
          enemiesRef.current.forEach((enemy) => {
            updateEnemyStore(enemy);
          });
        }
      }
    }, 500);

    level.enemies.forEach((spawnData) => {
      spawnEnemy(spawnData);
    });

    // Verify enemies are in the store after initialization
    setTimeout(() => {
      const enemyStore = useEnemyStore.getState();

      if (enemyStore.enemyInstances.length === 0 && enemiesRef.current.length > 0) {
        // Verify final store state
        useEnemyStore.getState();
      }
    }, 1000); // Check after 1 second to make sure initialization is complete

    // DEBUG: Add key press handler to test damaging enemies and view store state
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (enemiesRef.current.length > 0) {
          // Apply 10 damage to the first enemy
          const enemy = enemiesRef.current[0];
          enemy.takeDamage(10);
        } else {
          console.log('No enemies to damage');
        }
      } else if (e.key === 'F3') {
        // Test enemy store state
        const enemyStore = useEnemyStore.getState();
        console.log('==== ENEMY STORE DEBUG ====');
        console.log(`Local enemies ref count: ${enemiesRef.current.length}`);
        console.log(`Store enemy data count: ${enemyStore.enemies.length}`);
        console.log(`Store enemy instances count: ${enemyStore.enemyInstances.length}`);

        // Check if the counts match
        if (
          enemiesRef.current.length !== enemyStore.enemies.length ||
          enemiesRef.current.length !== enemyStore.enemyInstances.length
        ) {
          console.warn('WARNING: Mismatch between local ref and store counts!');

          // Log detailed info for debugging
          console.log(
            'Local enemies:',
            enemiesRef.current.map((e) => ({ id: e.getId(), health: e.getHealth() }))
          );
          console.log('Store enemy data:', enemyStore.enemies);
          console.log(
            'Store enemy instances:',
            enemyStore.enemyInstances.map((e) => ({ id: e.getId(), health: e.getHealth() }))
          );

          // Try to fix the mismatch by updating the store
          console.log('Attempting to fix mismatch by updating store...');
          let count = 0;
          enemiesRef.current.forEach((enemy) => {
            // Check if this enemy is already in the store
            const enemyInStore = enemyStore.enemies.find((e) => e.id === enemy.getId());
            const instanceInStore = enemyStore.enemyInstances.includes(enemy);

            if (!enemyInStore || !instanceInStore) {
              updateEnemyStore(enemy);
              count++;
            }
          });
          console.log(`Added ${count} missing enemies to store`);
        } else {
          console.log('Status: Local ref and store counts match!');
        }
        console.log('==========================');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('[DEBUG] EnemyManager cleanup function running - component is unmounting');

      // Stop intervals and unsubscribe from store events
      clearInterval(statusInterval);
      unsubscribe();

      // Check if this is a true unmount or just a React remount
      const isFullUnmount =
        document.body.classList.contains('unmounting') ||
        document.hidden ||
        window.location.href.includes('unmount=true');

      // Log the cleanup type
      console.log(
        `[DEBUG] EnemyManager cleanup type: ${isFullUnmount ? 'FULL UNMOUNT' : 'REACT REMOUNT'}`
      );

      // Only destroy enemies on full unmount (like level change or game exit)
      // For normal React remounts, just keep the enemies alive
      if (isFullUnmount) {
        console.log('[DEBUG] Performing full cleanup - destroying all enemies');

        // Clean up enemies when component unmounts
        enemiesRef.current.forEach((enemy) => {
          try {
            // Mark enemy as dead first, then destroy it
            // This prevents the "Attempt to destroy still-alive enemy" message
            if (enemy.alive) {
              // Use direct property access to bypass the setter
              Object.defineProperty(enemy, 'isDead', { value: true });
            }

            // Now destroy the enemy
            enemy.destroy();

            // Remove from store
            const enemyStore = useEnemyStore.getState();
            enemyStore.removeEnemy(enemy.getId());
            enemyStore.removeEnemyInstance(enemy);
          } catch (e) {
            console.error('Error cleaning up enemy:', e);
          }
        });
      } else {
        console.log('[DEBUG] Skipping enemy destruction during React remount');
      }

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
    updateEnemyStore,
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

        // Update lifetime and remove if expired
        particle.userData.lifetime += delta;
        if (particle.userData.lifetime > particle.userData.maxLifetime) {
          // Remove particle
          scene.remove(particle);
          removeParticle(particle);
        }
      }
    }

    // Update impact markers - gradual fade out based on lifetime
    if (impactMarkers.length > 0) {
      for (let i = impactMarkers.length - 1; i >= 0; i--) {
        const marker = impactMarkers[i];

        // Update lifetime
        marker.userData.lifetime += delta;

        // Check if marker has material with opacity
        if (marker.material) {
          // Need to check if it's an array of materials or a single material
          const material = Array.isArray(marker.material)
            ? (marker.material[0] as THREE.MeshBasicMaterial)
            : (marker.material as THREE.MeshBasicMaterial);

          if (material.opacity !== undefined) {
            // Calculate fading opacity based on lifetime
            const initialOpacity = marker.userData.initialOpacity || 0.9;
            const progress = marker.userData.lifetime / marker.userData.maxLifetime;

            // Apply fading - gradually decrease opacity
            material.opacity = initialOpacity * (1 - progress);

            // If opacity is very low or lifetime exceeded, remove the marker
            if (
              material.opacity < 0.05 ||
              marker.userData.lifetime >= marker.userData.maxLifetime
            ) {
              scene.remove(marker);
              removeImpactMarker(marker);
              continue;
            }
          }
        }

        // Also check if marker's parent object still exists in scene (previous functionality)
        if (marker.userData.parentObject) {
          const parentObject = marker.userData.parentObject;

          // If parent object is no longer in the scene, remove the marker
          if (!parentObject.parent) {
            scene.remove(marker);
            removeImpactMarker(marker);
          }
        }
      }
    }
  });

  // This component doesn't render anything directly
  return null;
};
