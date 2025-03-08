// Cell types in the level grid
export enum CellType {
  Empty = 0,
  Wall = 1,
  WallRed = 11,
  WallBlue = 12,
  WallGreen = 13,
  WallYellow = 14,
  WallPurple = 15,
  Door = 2,
  Key = 3,
  PlayerSpawn = 4,
  EnemySpawn = 5,
  CeilingLight = 6,
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

// Level dimensions
export interface LevelDimensions {
  width: number;
  height: number;
  depth: number;
}

// Level definition interface
export interface LevelData {
  grid: CellType[][]; // 2D array representing the level layout
  lights?: number[][]; // 2D array for light placements using simple numbers: 0=None, 1=Warm, 2=Cool, 3=Bright, 4=Dim
  enemies: EnemySpawn[];
  name: string;
  playerSpawn?: [number, number]; // Optional specific player spawn point [x, z]
  dimensions?: LevelDimensions; // Calculated dimensions of the level based on grid size
}

// Cell size for converting grid coordinates to world coordinates
export const CELL_SIZE = 2; // Each cell is 2x2 units
export const WALL_HEIGHT = 3.75; // Standard wall height (increased by 50% from 2.5)
