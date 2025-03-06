import { useMemo } from 'react';
import { Wall } from './Wall';
import { LevelData, CellType, CELL_SIZE, WALL_HEIGHT } from '../types/level';

interface LevelGridProps {
  level: LevelData;
}

export const LevelGrid = ({ level }: LevelGridProps) => {
  // Memoize the wall positions to avoid recalculating every frame
  const walls = useMemo(() => {
    const wallPositions: Array<{ position: [number, number, number]; size?: [number, number, number] }> = [];
    
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

  return (
    <group>
      {/* Render all walls */}
      {walls.map((wall, index) => (
        <Wall
          key={`wall-${index}`}
          position={wall.position}
          size={wall.size}
        />
      ))}
    </group>
  );
}; 