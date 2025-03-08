import { LevelData, EnemyType } from '../types/level';

export const level1: LevelData = {
  name: 'Level 1: Training Ground',
  grid: [
    [15, 14, 13, 12, 11, 11, 12, 13, 14, 15], // Top wall with alternating colors
    [1, 0, 0, 0, 0, 0, 1, 3, 0, 13],
    [1, 0, 0, 0, 12, 0, 1, 1, 2, 12],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 11],
    [1, 0, 14, 0, 4, 0, 15, 0, 0, 11],
    [1, 0, 14, 0, 0, 0, 15, 0, 0, 12],
    [1, 0, 13, 13, 0, 15, 15, 0, 0, 13],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 14],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 15],
    [1, 11, 12, 13, 14, 15, 15, 14, 13, 12], // Bottom wall with alternating colors
  ],
  // Simple lights grid using numbers:
  // 0 = No light
  // 1 = Warm light (yellowish)
  // 2 = Cool light (bluish)
  // 3 = Bright light (white)
  // 4 = Dim light (soft)
  lights: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 3, 0, 0, 0, 4, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  enemies: [
    { position: [2, 2], type: EnemyType.Grunt },
    { position: [7, 7], type: EnemyType.Guard, rotation: Math.PI },
  ],
  playerSpawn: [4, 4],
};
