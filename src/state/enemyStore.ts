import { create } from 'zustand';
import { Enemy } from '../entities/Enemy';

export interface EnemyType {
  id: string;
  health: number;
  isAlive: boolean;
}

interface EnemyState {
  enemies: EnemyType[];

  // Reference to actual Enemy instances
  enemyInstances: Enemy[];

  // Actions
  addEnemy: (enemy: EnemyType) => void;
  updateEnemy: (id: string, updates: Partial<{ health: number; isAlive: boolean }>) => void;
  removeEnemy: (id: string) => void;

  // Actions for Enemy instances
  addEnemyInstance: (enemy: Enemy) => void;
  removeEnemyInstance: (enemy: Enemy) => void;
  getEnemyInstances: () => Enemy[];

  // Add a flag to control resets
  _resetting: boolean;
  _safeReset: () => void;
}

export const useEnemyStore = create<EnemyState>((set, get) => ({
  // Initial state
  enemies: [],
  enemyInstances: [],
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

  // Safe reset function that logs the operation
  _safeReset: () => {
    set({
      _resetting: true,
      enemies: [],
      enemyInstances: [],
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
