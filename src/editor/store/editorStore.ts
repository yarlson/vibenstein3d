import { create } from 'zustand';
import { LevelData, CELL_SIZE, EnemyType } from '../../types/level';
import { GridPosition } from '../components/GridEditor';
import { ToolbarElementType, EditorLayer } from '../types/editorTypes';
import { createEmptyLevel, validateLevelData } from '../utils/levelUtils';

// Define the editor store state
interface EditorState {
  // Level data
  levelData: LevelData | null;
  isLoading: boolean;
  error: string | null;

  // Editor state
  currentLayer: EditorLayer;
  selectedElement: ToolbarElementType | null;
  selectedPosition: GridPosition | null;
  editorMode: 'standard' | 'advanced';

  // Grid configuration
  gridRows: number;
  gridCols: number;
  cellSize: number;

  // Validation
  validationErrors: string[];

  // Actions
  setLevelData: (data: LevelData) => void;
  setCurrentLayer: (layer: EditorLayer) => void;
  setSelectedElement: (element: ToolbarElementType | null) => void;
  setSelectedPosition: (position: GridPosition | null) => void;
  setEditorMode: (mode: 'standard' | 'advanced') => void;
  updateGridDimensions: (rows: number, cols: number, cellSize: number) => void;

  // Grid operations
  placeElement: (position: GridPosition, element: ToolbarElementType) => void;
  moveElement: (fromPosition: GridPosition, toPosition: GridPosition) => void;
  deleteElement: () => void;

  // Enemy operations
  addEnemy: (position: GridPosition, enemyType: EnemyType) => void;
  updateEnemyProperty: (index: number, property: string, value: number | string) => void;
  deleteEnemy: (index: number) => void;

  // Light operations
  updateLight: (position: GridPosition, lightType: number) => void;

  // Level operations
  createNewLevel: (rows?: number, cols?: number) => void;
  validateLevel: () => { valid: boolean; errors: string[] };

  // Property operations
  updateProperty: (position: GridPosition, property: string, value: number | string) => void;
}

// Create the editor store
export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  levelData: createEmptyLevel(),
  isLoading: false,
  error: null,

  currentLayer: 'walls', // Default to walls layer
  selectedElement: null,
  selectedPosition: null,
  editorMode: 'standard',

  gridRows: 20,
  gridCols: 30,
  cellSize: CELL_SIZE,

  validationErrors: [],

  // Actions
  setLevelData: (data: LevelData) => set({ levelData: data }),

  setCurrentLayer: (layer: EditorLayer) => {
    // Clear selected element when changing layers
    set({ 
      currentLayer: layer,
      selectedElement: null
    });
  },

  setSelectedElement: (element: ToolbarElementType | null) => set({ selectedElement: element }),

  setSelectedPosition: (position: GridPosition | null) => set({ selectedPosition: position }),

  setEditorMode: (mode: 'standard' | 'advanced') => set({ editorMode: mode }),

  updateGridDimensions: (rows: number, cols: number, cellSize: number) => {
    const { levelData } = get();

    if (!levelData) return;

    // Only update if dimensions have changed
    if (rows !== get().gridRows || cols !== get().gridCols) {
      // Create a new grid with the new dimensions
      const newGrid = Array(rows)
        .fill(0)
        .map((_, rowIndex) => {
          return Array(cols)
            .fill(0)
            .map((_, colIndex) => {
              // Copy existing cell values if they exist
              if (rowIndex < levelData.grid.length && colIndex < levelData.grid[0].length) {
                return levelData.grid[rowIndex][colIndex];
              }
              return 0; // Empty cell for new cells
            });
        });

      // Create a new lights grid with the new dimensions
      const newLights = Array(rows)
        .fill(0)
        .map((_, rowIndex) => {
          return Array(cols)
            .fill(0)
            .map((_, colIndex) => {
              // Copy existing light values if they exist
              if (
                levelData.lights &&
                rowIndex < levelData.lights.length &&
                colIndex < levelData.lights[0].length
              ) {
                return levelData.lights[rowIndex][colIndex];
              }
              return 0; // No light for new cells
            });
        });

      // Update the level data with the new grids
      set({
        levelData: {
          ...levelData,
          grid: newGrid,
          lights: newLights,
        },
        gridRows: rows,
        gridCols: cols,
        cellSize,
      });
    } else {
      // Just update the cell size
      set({ cellSize });
    }
  },

  // Grid operations
  placeElement: (position: GridPosition, element: ToolbarElementType) => {
    const { levelData, currentLayer } = get();

    if (!levelData) return;

    const { row, col } = position;

    // Handle placing element based on the current layer
    if (currentLayer === 'walls') {
      // Create a copy of the grid
      const newGrid = [...levelData.grid.map((row) => [...row])];

      // Update the cell
      newGrid[row][col] = element.cellType;

      // Update the level data
      set({
        levelData: {
          ...levelData,
          grid: newGrid,
        },
        selectedPosition: position,
      });
    } else if (currentLayer === 'lights') {
      // Ensure the lights grid exists
      const lights =
        levelData.lights ||
        Array(levelData.grid.length)
          .fill(0)
          .map(() => Array(levelData.grid[0].length).fill(0));

      // Create a copy of the lights grid
      const newLights = [...lights.map((row) => [...row])];

      // Update the light
      newLights[row][col] = element.cellType;

      // Update the level data
      set({
        levelData: {
          ...levelData,
          lights: newLights,
        },
        selectedPosition: position,
      });
    }

    // Validate the level
    const validation = validateLevelData({
      ...levelData,
    });

    set({ validationErrors: validation.errors });
  },

  moveElement: (fromPosition: GridPosition, toPosition: GridPosition) => {
    const { levelData, currentLayer } = get();

    if (!levelData) return;

    const { row: fromRow, col: fromCol } = fromPosition;
    const { row: toRow, col: toCol } = toPosition;

    if (currentLayer === 'walls') {
      // Create a copy of the grid
      const newGrid = [...levelData.grid.map((row) => [...row])];

      // Get the cell type at the from position
      const cellType = newGrid[fromRow][fromCol];

      // Update the cells
      newGrid[toRow][toCol] = cellType;
      newGrid[fromRow][fromCol] = 0; // Empty the original cell

      // Update the level data
      set({
        levelData: {
          ...levelData,
          grid: newGrid,
        },
        selectedPosition: toPosition,
      });
    } else if (currentLayer === 'lights') {
      // Ensure the lights grid exists
      const lights =
        levelData.lights ||
        Array(levelData.grid.length)
          .fill(0)
          .map(() => Array(levelData.grid[0].length).fill(0));

      // Create a copy of the lights grid
      const newLights = [...lights.map((row) => [...row])];

      // Get the light type at the from position
      const lightType = newLights[fromRow][fromCol];

      // Update the lights
      newLights[toRow][toCol] = lightType;
      newLights[fromRow][fromCol] = 0; // Empty the original cell

      // Update the level data
      set({
        levelData: {
          ...levelData,
          lights: newLights,
        },
        selectedPosition: toPosition,
      });
    }
  },

  deleteElement: () => {
    const { levelData, selectedPosition, currentLayer } = get();

    if (!levelData || !selectedPosition) return;

    const { row, col } = selectedPosition;

    if (currentLayer === 'walls') {
      // Create a copy of the grid
      const newGrid = [...levelData.grid.map((row) => [...row])];

      // Update the cell to empty
      newGrid[row][col] = 0;

      // Update the level data
      set({
        levelData: {
          ...levelData,
          grid: newGrid,
        },
      });
    } else if (currentLayer === 'lights') {
      // Ensure the lights grid exists
      const lights =
        levelData.lights ||
        Array(levelData.grid.length)
          .fill(0)
          .map(() => Array(levelData.grid[0].length).fill(0));

      // Create a copy of the lights grid
      const newLights = [...lights.map((row) => [...row])];

      // Update the light to empty
      newLights[row][col] = 0;

      // Update the level data
      set({
        levelData: {
          ...levelData,
          lights: newLights,
        },
      });
    }

    // Validate the level
    const validation = validateLevelData({
      ...levelData,
    });

    set({ validationErrors: validation.errors });
  },

  // Enemy operations
  addEnemy: (position: GridPosition, enemyType: EnemyType) => {
    const { levelData } = get();

    if (!levelData) return;

    const { row, col } = position;

    // Create a copy of the enemies array
    const newEnemies = [...levelData.enemies];

    // Add the new enemy
    newEnemies.push({
      position: [col, row], // Note: enemies use [x, y] format
      type: enemyType,
      rotation: 0,
    });

    // Update the level data
    set({
      levelData: {
        ...levelData,
        enemies: newEnemies,
      },
    });
  },

  updateEnemyProperty: (index: number, property: string, value: number | string) => {
    const { levelData } = get();

    if (!levelData || index < 0 || index >= levelData.enemies.length) return;

    // Create a copy of the enemies array
    const newEnemies = [...levelData.enemies];

    // Update the enemy property
    newEnemies[index] = {
      ...newEnemies[index],
      [property]: value,
    };

    // Update the level data
    set({
      levelData: {
        ...levelData,
        enemies: newEnemies,
      },
    });
  },

  deleteEnemy: (index: number) => {
    const { levelData } = get();

    if (!levelData || index < 0 || index >= levelData.enemies.length) return;

    // Create a copy of the enemies array without the deleted enemy
    const newEnemies = levelData.enemies.filter((_, i) => i !== index);

    // Update the level data
    set({
      levelData: {
        ...levelData,
        enemies: newEnemies,
      },
    });
  },

  // Light operations
  updateLight: (position: GridPosition, lightType: number) => {
    const { levelData } = get();

    if (!levelData) return;

    const { row, col } = position;

    // Ensure the lights grid exists
    const lights =
      levelData.lights ||
      Array(levelData.grid.length)
        .fill(0)
        .map(() => Array(levelData.grid[0].length).fill(0));

    // Create a copy of the lights grid
    const newLights = [...lights.map((row) => [...row])];

    // Update the light
    newLights[row][col] = lightType;

    // Update the level data
    set({
      levelData: {
        ...levelData,
        lights: newLights,
      },
    });
  },

  // Level operations
  createNewLevel: (rows: number = 20, cols: number = 30) => {
    const newLevel = createEmptyLevel(rows, cols);

    set({
      levelData: newLevel,
      gridRows: rows,
      gridCols: cols,
      selectedPosition: null,
      validationErrors: [],
    });
  },

  validateLevel: () => {
    const { levelData } = get();

    if (!levelData) {
      return { valid: false, errors: ['No level data available'] };
    }

    const validation = validateLevelData(levelData);

    set({ validationErrors: validation.errors });

    return validation;
  },

  // Property operations
  updateProperty: (position: GridPosition, property: string, value: number | string) => {
    const { levelData } = get();

    if (!levelData) return;

    // Handle different property types
    if (property === 'light') {
      get().updateLight(position, value as number);
    }
    // Add more property types as needed
  },
}));
