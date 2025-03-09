import { LevelData, CellType, CELL_SIZE, WALL_HEIGHT } from '../types/level';

/**
 * Finds the player spawn position in the level data
 * @param levelData The level data object
 * @returns A tuple of [x, z] grid coordinates for the player spawn
 */
export const findPlayerSpawn = (levelData: LevelData): [number, number] => {
  // Check if level already has a defined playerSpawn property
  if (levelData.playerSpawn) {
    return levelData.playerSpawn;
  }

  // Otherwise scan the grid to find the PlayerSpawn cell
  for (let rowIndex = 0; rowIndex < levelData.grid.length; rowIndex++) {
    for (let colIndex = 0; colIndex < levelData.grid[rowIndex].length; colIndex++) {
      if (levelData.grid[rowIndex][colIndex] === CellType.PlayerSpawn) {
        return [colIndex, rowIndex];
      }
    }
  }
  // Fallback if no spawn point is defined in the grid
  return [2, 9];
};

/**
 * Calculates level dimensions based on the grid size
 * @param levelData The level data object
 * @returns An object with width, height, and depth properties
 */
export const calculateLevelDimensions = (levelData: LevelData) => {
  // Use level's dimensions if available
  if (levelData.dimensions) {
    return levelData.dimensions;
  }

  // Otherwise calculate from grid size
  return {
    width: levelData.grid[0].length * CELL_SIZE,
    height: WALL_HEIGHT,
    depth: levelData.grid.length * CELL_SIZE,
  };
};
