import { LevelData } from '../../types/level';

/**
 * Load a level from the given file path
 * @param filePath Path to the level JSON file
 * @returns Promise that resolves to the level data
 */
export const loadLevelData = async (filePath: string): Promise<LevelData> => {
  try {
    // In a real application, this would likely be a fetch request
    // or some other async operation to load the file
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Failed to load level data: ${response.statusText}`);
    }

    const levelData = await response.json();
    return levelData as LevelData;
  } catch (error) {
    console.error('Error loading level data:', error);
    throw error;
  }
};

/**
 * Save level data to a file
 * @param levelData The level data to save
 * @param filename The filename to save to
 */
export const saveLevelData = (levelData: LevelData, filename: string): void => {
  try {
    // Create a Blob with the JSON data
    const blob = new Blob([JSON.stringify(levelData, null, 2)], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving level data:', error);
    throw error;
  }
};

/**
 * Create a new empty level with default values
 * @param rows Number of rows
 * @param cols Number of columns
 * @returns A new empty level
 */
export const createEmptyLevel = (rows: number = 20, cols: number = 30): LevelData => {
  // Create empty grid filled with zeros (empty cells)
  const grid = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  // Create empty lights grid
  const lights = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  return {
    name: 'New Level',
    grid,
    lights,
    enemies: [],
  };
};

/**
 * Validate level data
 * @param levelData The level data to validate
 * @returns An object with a valid flag and optional error messages
 */
export const validateLevelData = (levelData: LevelData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if grid exists and is valid
  if (!levelData.grid || !Array.isArray(levelData.grid) || levelData.grid.length === 0) {
    errors.push('Invalid grid: Grid must be a non-empty array');
  }

  // Check for minimum grid dimensions
  if (levelData.grid.length < 5) {
    errors.push('Grid must have at least 5 rows');
  }

  if (levelData.grid[0].length < 5) {
    errors.push('Grid must have at least 5 columns');
  }

  // Check for player spawn
  let playerSpawnCount = 0;

  // This depends on how the player spawn is defined in your game.
  // Assuming it's a cell with value 4 as seen in the level1.json
  levelData.grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell === 4) playerSpawnCount++;
    });
  });

  if (playerSpawnCount === 0) {
    errors.push('Level must have exactly one player spawn');
  } else if (playerSpawnCount > 1) {
    errors.push(`Level has ${playerSpawnCount} player spawns, but should have exactly one`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
