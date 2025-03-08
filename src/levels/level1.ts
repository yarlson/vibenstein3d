import { LevelData, EnemyType, CellType, CELL_SIZE, WALL_HEIGHT } from '../types/level';

export const level1: LevelData = {
  name: 'Level 1: Deep Labyrinth',
  // Expanded level grid with more corridors and dark rooms
  grid: [
    [15, 14, 13, 12, 11, 15, 14, 13, 12, 11, 15, 14, 13, 12, 11, 15, 14, 13, 12, 11], // Top wall with alternating colors
    [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 13],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 2, 0, 12],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 11],
    [1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 15, 15, 15, 1, 0, 0, 0, 11],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 15, 0, 15, 1, 0, 0, 0, 12],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 15, 0, 15, 1, 0, 0, 0, 13],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 15, 15, 15, 1, 0, 0, 0, 14],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 15],
    [1, 0, 4, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 14],
    [1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 13],
    [1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 12],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 1, 0, 0, 0, 1, 11],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 15],
    [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 14],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 13],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 12],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15],
    [1, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11], // Bottom wall with alternating colors
  ],

  // Enhanced lights grid for the expanded level
  // 0 = No light, 1 = Warm light, 2 = Cool light, 3 = Bright light, 4 = Dim light
  lights: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // More enemies for the expanded level
  enemies: [
    { position: [15, 14], type: EnemyType.Grunt },
    { position: [3, 16], type: EnemyType.Boss, rotation: -Math.PI / 4 },
  ],

  // Player spawn identified by CellType.PlayerSpawn (4) in the grid
  // This is no longer hardcoded but automatically determined from the grid
  // The function will scan the grid for the PlayerSpawn cell type (4)
  get playerSpawn(): [number, number] {
    for (let rowIndex = 0; rowIndex < this.grid.length; rowIndex++) {
      for (let colIndex = 0; colIndex < this.grid[rowIndex].length; colIndex++) {
        if (this.grid[rowIndex][colIndex] === CellType.PlayerSpawn) {
          return [colIndex, rowIndex];
        }
      }
    }
    // Fallback if no spawn point is defined in the grid
    return [2, 9];
  },

  // Calculated dimensions based on grid size
  get dimensions(): { width: number; height: number; depth: number } {
    const width = this.grid[0].length * CELL_SIZE;
    const height = WALL_HEIGHT;
    const depth = this.grid.length * CELL_SIZE;

    return { width, height, depth };
  },
};
