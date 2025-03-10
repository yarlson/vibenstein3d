import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../state/playerStore';
import levelDataJson from '../levels/level1.json';
import { CELL_SIZE, CellType } from '../types/level';

// Map colors for different cell types
const CELL_COLORS = {
  [CellType.Empty]: 'rgba(50, 50, 50, 0.5)', // Empty space
  [CellType.Wall]: '#333', // Wall
  [CellType.Door]: '#8B4513', // Door
  [CellType.Key]: '#FFD700', // Key
  [CellType.PlayerSpawn]: '#ff5555', // Player spawn
  [CellType.WallRed]: '#2E2E2E', // Special wall colors
  [CellType.WallBlue]: '#3A3A3A',
  [CellType.WallGreen]: '#464646',
  [CellType.WallYellow]: '#525252',
  [CellType.WallPurple]: '#5E5E5E',
};

export const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPosition = usePlayerStore((state) => state.playerPosition);

  // Convert world coordinates to minimap coordinates
  const worldToMinimap = (x: number, z: number, canvasSize: number) => {
    const gridWidth = levelDataJson.grid[0].length;
    const gridHeight = levelDataJson.grid.length;

    // Convert world coordinates to grid coordinates using the actual grid dimensions
    const gridX = Math.floor(x / CELL_SIZE + gridWidth / 2);
    const gridZ = Math.floor(z / CELL_SIZE + gridHeight / 2);

    const mapCellSize = canvasSize / gridWidth;

    return {
      x: gridX * mapCellSize,
      z: gridZ * mapCellSize,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = canvas.width;
    const cellSize = canvasSize / levelDataJson.grid[0].length;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw level
    levelDataJson.grid.forEach((row: number[], rowIndex: number) => {
      row.forEach((cell: number, colIndex: number) => {
        // Skip drawing enemy spawn points and ceiling lights
        if (cell === CellType.EnemySpawn || cell === CellType.CeilingLight) {
          // Draw as empty space instead
          ctx.fillStyle = CELL_COLORS[CellType.Empty];
          ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
          return;
        }

        ctx.fillStyle = CELL_COLORS[cell as keyof typeof CELL_COLORS] || '#333';
        ctx.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize);
      });
    });

    // Draw player position
    const { x, z } = worldToMinimap(playerPosition[0], playerPosition[2], canvasSize);

    // Player marker
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(x, z, cellSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [playerPosition]);

  return (
    <div
      className="minimap-container"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '150px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '5px',
        padding: '5px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
    >
      <p style={{ color: 'white', margin: '0 0 5px 0', fontSize: '12px', textAlign: 'center' }}>
        MINIMAP
      </p>
      <canvas
        ref={canvasRef}
        width={140}
        height={140}
        style={{ width: '140px', height: '140px' }}
      />
    </div>
  );
};
