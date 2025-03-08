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
}

export const useEnemyStore = create<EnemyState>((set, get) => ({
  // Initial state
  enemies: [],
  enemyInstances: [],
  
  // Actions
  addEnemy: (enemy: EnemyType) => 
    set((state) => ({ 
      enemies: [...state.enemies, enemy] 
    })),
  
  updateEnemy: (id: string, updates: Partial<{ health: number; isAlive: boolean }>) => 
    set((state) => ({
      enemies: state.enemies.map((enemy) => 
        enemy.id === id 
          ? { ...enemy, ...updates } 
          : enemy
      )
    })),
  
  removeEnemy: (id: string) => 
    set((state) => ({
      enemies: state.enemies.filter((enemy) => enemy.id !== id)
    })),
    
  // Actions for Enemy instances
  addEnemyInstance: (enemy: Enemy) =>
    set((state) => ({
      enemyInstances: [...state.enemyInstances, enemy]
    })),
    
  removeEnemyInstance: (enemy: Enemy) =>
    set((state) => ({
      enemyInstances: state.enemyInstances.filter((e) => e !== enemy)
    })),
    
  getEnemyInstances: () => get().enemyInstances,
})); 