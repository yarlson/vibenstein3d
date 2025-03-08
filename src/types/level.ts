// Cell types in the level grid
export enum CellType {
  Empty = 0,
  Wall = 1,
  Door = 2,
  Key = 3,
  PlayerSpawn = 4,
  EnemySpawn = 5,
  CeilingLight = 6,
}

// Light types for the lights grid
export enum LightType {
  None = 0,
  CeilingLamp = 1,
  WallSconce = 2,
  FloorLamp = 3,
}

// Light configuration for the lights grid
export interface LightConfig {
  type: LightType;
  color?: string;
  intensity?: number;
  distance?: number;
}

// Enemy types that can spawn in the level
export enum EnemyType {
  Grunt = 'grunt',
  Guard = 'guard',
  Boss = 'boss',
}

// Enemy spawn point definition
export interface EnemySpawn {
  position: [number, number];
  type: EnemyType;
  rotation?: number;
}

// Level definition interface
export interface LevelData {
  grid: CellType[][];
  lights?: (LightType | LightConfig)[][];
  enemies: EnemySpawn[];
  name: string;
  playerSpawn?: [number, number];
}

// Cell size for converting grid coordinates to world coordinates
export const CELL_SIZE = 2;
export const WALL_HEIGHT = 2.5;
