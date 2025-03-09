import { useMemo } from 'react';
import { Wall } from './Wall';
import { Ceiling } from './Ceiling';
import { LevelData, CellType, CELL_SIZE, WALL_HEIGHT } from '../types/level';
import { findPlayerSpawn, calculateLevelDimensions } from '../utils/levelUtils';

interface LevelGridProps {
  level: LevelData;
  onPlayerSpawnFound?: (spawnPosition: [number, number]) => void;
}

// Light configuration type
type LightConfig = {
  color: string;
  intensity: number;
  distance: number;
};

// Predefined light configurations by numeric index
const LIGHT_CONFIGS: {
  [key: number]: null | LightConfig;
} = {
  0: null, // No light
  1: {
    // Warm light
    color: '#ffaa55',
    intensity: 2.5,
    distance: 12,
  },
  2: {
    // Cool light
    color: '#aaddff',
    intensity: 2.0,
    distance: 15,
  },
  3: {
    // Bright light
    color: '#ffffff',
    intensity: 3.5,
    distance: 18,
  },
  4: {
    // Dim light
    color: '#ffddcc',
    intensity: 1.2,
    distance: 8,
  },
};

// Wall color configuration by cell type
const WALL_COLORS: {
  [key: number]: string;
} = {
  [CellType.Wall]: '#6e6658', // Muted stone/grey wall (default)
  [CellType.WallRed]: '#b22222', // Firebrick red
  [CellType.WallBlue]: '#2a4d69', // Deep blue
  [CellType.WallGreen]: '#228B22', // Forest green
  [CellType.WallYellow]: '#b8860b', // Dark goldenrod yellow
  [CellType.WallPurple]: '#6a0dad', // Deep purple
};

export const LevelGrid = ({ level, onPlayerSpawnFound }: LevelGridProps) => {
  // Find the player spawn position by scanning the grid for PlayerSpawn cell type
  const playerSpawn = useMemo(() => {
    return findPlayerSpawn(level);
  }, [level]);

  // Notify parent component of player spawn position if callback is provided
  useMemo(() => {
    if (onPlayerSpawnFound) {
      onPlayerSpawnFound(playerSpawn);
    }
  }, [playerSpawn, onPlayerSpawnFound]);

  // Calculate level dimensions if not already provided
  const levelDimensions = useMemo(() => {
    return calculateLevelDimensions(level);
  }, [level]);

  // Memoize the wall positions to avoid recalculating every frame
  const walls = useMemo(() => {
    const wallPositions: Array<{
      position: [number, number, number];
      size?: [number, number, number];
      color: string;
    }> = [];

    // Iterate through the grid and create walls
    level.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Check if the cell is any type of wall (regular wall or colored walls)
        if (
          cell === CellType.Wall ||
          cell === CellType.WallRed ||
          cell === CellType.WallBlue ||
          cell === CellType.WallGreen ||
          cell === CellType.WallYellow ||
          cell === CellType.WallPurple
        ) {
          // Convert grid coordinates to world coordinates
          const x = (colIndex - level.grid[0].length / 2) * CELL_SIZE;
          const z = (rowIndex - level.grid.length / 2) * CELL_SIZE;

          // Get the appropriate wall color based on cell type
          const wallColor = WALL_COLORS[cell] || WALL_COLORS[CellType.Wall];

          wallPositions.push({
            position: [x, WALL_HEIGHT / 2, z],
            size: [CELL_SIZE, WALL_HEIGHT, CELL_SIZE],
            color: wallColor,
          });
        }
      });
    });

    return wallPositions;
  }, [level]);

  // Extract ceiling light positions from the lights grid (or fallback to main grid for backward compatibility)
  const ceilingLights = useMemo(() => {
    const lights: Array<{
      position: [number, number];
      color?: string;
      intensity?: number;
      distance?: number;
    }> = [];

    // If we have a dedicated lights grid, use it
    if (level.lights) {
      level.lights.forEach((row, rowIndex) => {
        row.forEach((lightType, colIndex) => {
          // Only process cells with light values > 0
          if (lightType > 0 && LIGHT_CONFIGS[lightType]) {
            const config = LIGHT_CONFIGS[lightType];

            if (config) {
              // Double-check that config is not null
              lights.push({
                position: [colIndex, rowIndex] as [number, number],
                color: config.color,
                intensity: config.intensity,
                distance: config.distance,
              });
            }
          }
        });
      });
    } else {
      // Backward compatibility: check for CeilingLight cells in the main grid
      level.grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === CellType.CeilingLight) {
            const config = LIGHT_CONFIGS[1]; // Use warm light (type 1) as default
            if (config) {
              lights.push({
                position: [colIndex, rowIndex] as [number, number],
                color: config.color,
                intensity: config.intensity,
                distance: config.distance,
              });
            }
          }
        });
      });
    }

    return lights;
  }, [level]);

  return (
    <group>
      {/* Render all walls */}
      {walls.map((wall, index) => (
        <Wall key={`wall-${index}`} position={wall.position} size={wall.size} color={wall.color} />
      ))}

      {/* Ceiling with lights extracted from level data */}
      <Ceiling
        lights={ceilingLights}
        size={{
          width: levelDimensions.width,
          depth: levelDimensions.depth,
        }}
      />
    </group>
  );
};
