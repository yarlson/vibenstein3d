import { LevelData, EnemyType } from '../types/level';

export const level1: LevelData = {
  name: 'Level 1: Training Ground',
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 3, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 4, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  enemies: [
    { position: [2, 2], type: EnemyType.Grunt },
    { position: [7, 7], type: EnemyType.Guard, rotation: Math.PI },
  ],
  playerSpawn: [4, 4], // Center of the map
}; 
