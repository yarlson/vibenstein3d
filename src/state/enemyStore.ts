import { create } from 'zustand';
import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';
import { LevelData, EnemySpawn, CELL_SIZE } from '../types/level';
import { useGameStore } from './gameStore';

export interface EnemyType {
  id: string;
  health: number;
  isAlive: boolean;
}

interface EnemyState {
  enemies: EnemyType[];
  enemyInstances: Enemy[];
  walls: THREE.Object3D[];
  initialized: boolean;

  // Actions
  addEnemy: (enemy: EnemyType) => void;
  updateEnemy: (id: string, updates: Partial<{ health: number; isAlive: boolean }>) => void;
  removeEnemy: (id: string) => void;

  // Actions for Enemy instances
  addEnemyInstance: (enemy: Enemy) => void;
  removeEnemyInstance: (enemy: Enemy) => void;
  getEnemyInstances: () => Enemy[];

  // New functions from EnemyManager
  initializeEnemies: (level: LevelData, scene: THREE.Scene, camera: THREE.Camera) => void;
  spawnEnemy: (
    spawnData: EnemySpawn,
    scene: THREE.Scene,
    camera: THREE.Camera,
    level?: LevelData
  ) => void;
  updateEnemies: (delta: number, time: number) => void;
  setWalls: (walls: THREE.Object3D[]) => void;
  cleanupEnemies: (isFullUnmount?: boolean) => void;

  // Add a flag to control resets
  _resetting: boolean;
  _safeReset: () => void;
}

export const useEnemyStore = create<EnemyState>((set, get) => ({
  // Initial state
  enemies: [],
  enemyInstances: [],
  walls: [],
  initialized: false,
  _resetting: false,

  // Actions
  addEnemy: (enemy: EnemyType) => {
    set((state) => {
      // Check if enemy already exists
      const exists = state.enemies.some((e) => e.id === enemy.id);
      if (exists) {
        return state; // No change needed
      }
      return {
        enemies: [...state.enemies, enemy],
      };
    });
  },

  updateEnemy: (id: string, updates: Partial<{ health: number; isAlive: boolean }>) =>
    set((state) => {
      return {
        enemies: state.enemies.map((enemy) => (enemy.id === id ? { ...enemy, ...updates } : enemy)),
      };
    }),

  removeEnemy: (id: string) =>
    set((state) => {
      return {
        enemies: state.enemies.filter((enemy) => enemy.id !== id),
      };
    }),

  // Actions for Enemy instances
  addEnemyInstance: (enemy: Enemy) => {
    set((state) => {
      // Check if enemy instance already exists
      const exists = state.enemyInstances.some((e) => e === enemy);
      if (exists) {
        return state; // No change needed
      }
      return {
        enemyInstances: [...state.enemyInstances, enemy],
      };
    });
  },

  removeEnemyInstance: (enemy: Enemy) =>
    set((state) => {
      return {
        enemyInstances: state.enemyInstances.filter((e) => e !== enemy),
      };
    }),

  getEnemyInstances: () => get().enemyInstances,

  // New functions from EnemyManager
  initializeEnemies: (level: LevelData, scene: THREE.Scene, camera: THREE.Camera) => {
    const state = get();

    // Only initialize once
    if (state.initialized) return;

    // Reset state if we have any stale data
    if (state.enemies.length > 0 || state.enemyInstances.length > 0) {
      resetEnemyStore();
    }

    // Get walls from game store
    const walls = useGameStore.getState().walls;
    set({ walls });

    // Spawn enemies from level data
    level.enemies.forEach((spawnData) => {
      get().spawnEnemy(spawnData, scene, camera, level);
    });

    set({ initialized: true });
  },

  spawnEnemy: (
    spawnData: EnemySpawn,
    scene: THREE.Scene,
    camera: THREE.Camera,
    level?: LevelData
  ) => {
    const [x, z] = spawnData.position;

    // Calculate grid dimensions if we have level data
    let gridWidth = 10; // Default fallback
    let gridHeight = 10; // Default fallback

    if (level && level.grid) {
      gridWidth = level.grid[0].length;
      gridHeight = level.grid.length;
    }

    // Calculate world coordinates using the correct transformation
    const worldX = (x - gridWidth / 2) * CELL_SIZE;
    const worldZ = (z - gridHeight / 2) * CELL_SIZE;

    // Create enemy instance with correct position
    const position = new THREE.Vector3(
      worldX,
      0.5, // Half height above ground
      worldZ
    );

    // Create enemy instance
    const enemy = new Enemy(scene, position, camera, spawnData.type);

    // Create mesh and add to scene
    enemy.create();

    // Apply initial rotation if specified
    if (spawnData.rotation !== undefined) {
      enemy.getMesh().rotation.y = spawnData.rotation;
    }

    // Add to enemy store
    const state = get();
    state.addEnemyInstance(enemy);
    state.addEnemy({
      id: enemy.getId(),
      health: enemy.getHealth(),
      isAlive: !enemy.getIsDead(),
    });
  },

  updateEnemies: (delta: number, time: number) => {
    const state = get();
    const { walls } = state;

    // Filter out dead enemies
    const aliveEnemies = state.enemyInstances.filter((enemy) => enemy.alive);

    // Remove dead enemies from the store
    if (aliveEnemies.length !== state.enemyInstances.length) {
      const deadEnemies = state.enemyInstances.filter((enemy) => !enemy.alive);
      deadEnemies.forEach((enemy) => {
        state.removeEnemyInstance(enemy);
      });

      set({ enemyInstances: aliveEnemies });
    }

    // Update living enemies
    aliveEnemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.update(delta, time, walls);
      }
    });

    // Update particles from the game store
    const gameStore = useGameStore.getState();
    const { particles, impactMarkers, removeParticle, removeImpactMarker } = gameStore;

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
          if (particle.parent) {
            particle.parent.remove(particle);
          }
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
              if (marker.parent) {
                marker.parent.remove(marker);
              }
              removeImpactMarker(marker);
              continue;
            }
          }
        }

        // Also check if marker's parent object still exists in scene
        if (marker.userData.parentObject) {
          const parentObject = marker.userData.parentObject;

          // If parent object is no longer in the scene, remove the marker
          if (!parentObject.parent) {
            if (marker.parent) {
              marker.parent.remove(marker);
            }
            removeImpactMarker(marker);
          }
        }
      }
    }
  },

  setWalls: (walls: THREE.Object3D[]) => {
    set({ walls });
  },

  cleanupEnemies: (isFullUnmount = false) => {
    console.log('[DEBUG] EnemyStore cleanup function running');

    const state = get();

    // Check if this is a true unmount or just a React remount
    if (isFullUnmount) {
      console.log('[DEBUG] Performing full cleanup - destroying all enemies');

      // Clean up enemies
      state.enemyInstances.forEach((enemy) => {
        try {
          // Mark enemy as dead first, then destroy it
          if (enemy.alive) {
            Object.defineProperty(enemy, 'isDead', { value: true });
          }

          // Destroy the enemy
          enemy.destroy();
        } catch (e) {
          console.error('Error cleaning up enemy:', e);
        }
      });

      // Reset store
      resetEnemyStore();
    } else {
      console.log('[DEBUG] Skipping enemy destruction during React remount');
    }
  },

  // Safe reset function that logs the operation
  _safeReset: () => {
    set({
      _resetting: true,
      enemies: [],
      enemyInstances: [],
      initialized: false,
    });

    // Mark reset as complete
    setTimeout(() => {
      set({ _resetting: false });
    }, 50);
  },
}));

// Create a wrapper to detect direct setState calls
const originalSetState = useEnemyStore.setState;
useEnemyStore.setState = (partial, replace) => {
  return originalSetState(partial, replace);
};

// Export a safe utility function to use instead of direct setState
export const resetEnemyStore = () => {
  useEnemyStore.getState()._safeReset();
};
