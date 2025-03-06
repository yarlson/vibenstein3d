// Cell types in the level grid
export enum CellType {
  Empty = 0,
  Wall = 1,
  Door = 2,
  Key = 3,
  PlayerSpawn = 4,
  EnemySpawn = 5,
}

// Enemy types that can spawn in the level
export enum EnemyType {
  Grunt = 'grunt',
  Guard = 'guard',
  Boss = 'boss',
}

// Enemy spawn point definition
export interface EnemySpawn {
  position: [number, number]; // Grid coordinates [x, z]
  type: EnemyType;
  rotation?: number; // Initial rotation in radians
}

// Level definition interface
export interface LevelData {
  grid: CellType[][]; // 2D array representing the level layout
  enemies: EnemySpawn[];
  name: string;
  playerSpawn?: [number, number]; // Optional specific player spawn point [x, z]
}

// Cell size for converting grid coordinates to world coordinates
export const CELL_SIZE = 2; // Each cell is 2x2 units
export const WALL_HEIGHT = 2.5; // Standard wall height
