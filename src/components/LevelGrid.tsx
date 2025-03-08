import { useMemo } from 'react';
import { Wall } from './Wall';
import { Ceiling } from './Ceiling';
import { LevelData, CellType, LightType, CELL_SIZE, WALL_HEIGHT } from '../types/level';

interface LevelGridProps {
  level: LevelData;
}

// Predefined light configurations
const LIGHT_CONFIGS = {
  [LightType.None]: null,
  [LightType.WarmLight]: {
    color: '#ffaa55',
    intensity: 2.5,
    distance: 12,
  },
  [LightType.CoolLight]: {
    color: '#aaddff',
    intensity: 2.0,
    distance: 15,
  },
  [LightType.BrightLight]: {
    color: '#ffffff',
    intensity: 3.5,
    distance: 18,
  },
  [LightType.DimLight]: {
    color: '#ffddcc',
    intensity: 1.2,
    distance: 8,
  },
};

export const LevelGrid = ({ level }: LevelGridProps) => {
  // Memoize the wall positions to avoid recalculating every frame
  const walls = useMemo(() => {
    const wallPositions: Array<{
      position: [number, number, number];
      size?: [number, number, number];
    }> = [];

    // Iterate through the grid and create walls
    level.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === CellType.Wall) {
          // Convert grid coordinates to world coordinates
          const x = (colIndex - level.grid[0].length / 2) * CELL_SIZE;
          const z = (rowIndex - level.grid.length / 2) * CELL_SIZE;

          wallPositions.push({
            position: [x, WALL_HEIGHT / 2, z],
            size: [CELL_SIZE, WALL_HEIGHT, CELL_SIZE],
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
      color: string;
      intensity: number;
      distance: number;
    }> = [];

    // If we have a dedicated lights grid, use it
    if (level.lights) {
      level.lights.forEach((row, rowIndex) => {
        row.forEach((lightType, colIndex) => {
          // Only process cells with defined light types
          if (lightType !== LightType.None) {
            const config = LIGHT_CONFIGS[lightType];

            if (config) {
              lights.push({
                position: [colIndex, rowIndex] as [number, number],
                ...config,
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
            // Use warm light as default for backward compatibility
            lights.push({
              position: [colIndex, rowIndex] as [number, number],
              ...LIGHT_CONFIGS[LightType.WarmLight],
            });
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
        <Wall key={`wall-${index}`} position={wall.position} size={wall.size} />
      ))}

      {/* Ceiling with lights extracted from level data */}
      <Ceiling lights={ceilingLights} />
    </group>
  );
};
