import React, { useState, useRef, useEffect } from 'react';
import { ToolbarElementType } from '../types/editorTypes';
import { LevelData } from '../../types/level';
import './EditorComponents.css';

// Define the position type for grid elements
export type GridPosition = {
  row: number;
  col: number;
};

// Default editor cell size (larger than game cell size for better editing)
const DEFAULT_EDITOR_CELL_SIZE = 30;

interface GridEditorProps {
  levelData: LevelData;
  selectedElement: ToolbarElementType | null;
  onGridCellClick: (position: GridPosition, element: ToolbarElementType) => void;
  onSelectGridElement: (position: GridPosition | null) => void;
  onMoveGridElement: (fromPosition: GridPosition, toPosition: GridPosition) => void;
  selectedPosition: GridPosition | null;
  onUpdateGridDimensions: (rows: number, cols: number, cellSize: number) => void;
  currentLayer: 'walls' | 'lights';
}

/**
 * Grid Editor Component
 * Renders a configurable grid for placing level elements.
 */
const GridEditor: React.FC<GridEditorProps> = ({
  levelData,
  selectedElement,
  onGridCellClick,
  onSelectGridElement,
  onMoveGridElement,
  selectedPosition,
  onUpdateGridDimensions,
  currentLayer,
}) => {
  const [rows, setRows] = useState<number>(levelData.grid.length);
  const [cols, setColumns] = useState<number>(levelData.grid[0].length);
  const [cellSize, setCellSize] = useState<number>(DEFAULT_EDITOR_CELL_SIZE);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragPosition, setDragPosition] = useState<GridPosition | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Update grid dimensions when rows, cols, or cellSize changes
  useEffect(() => {
    onUpdateGridDimensions(rows, cols, cellSize);
  }, [rows, cols, cellSize, onUpdateGridDimensions]);

  // Handle grid cell click
  const handleCellClick = (row: number, col: number) => {
    if (selectedElement) {
      onGridCellClick({ row, col }, selectedElement);
    } else {
      onSelectGridElement({ row, col });
    }
  };

  // Handle drag start
  const handleDragStart = (row: number, col: number) => {
    if (selectedPosition && selectedPosition.row === row && selectedPosition.col === col) {
      setIsDragging(true);
      setDragPosition({ row, col });
    }
  };

  // Handle drag over
  const handleDragOver = (row: number, col: number) => {
    if (isDragging && dragPosition) {
      setDragPosition({ row, col });
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (isDragging && dragPosition && selectedPosition) {
      onMoveGridElement(selectedPosition, dragPosition);
      setIsDragging(false);
      setDragPosition(null);
    }
  };

  // Get cell color based on cell type
  const getCellColor = (cellType: number): string => {
    // Map cell types to colors
    switch (cellType) {
      case 0:
        return '#f0f0f0'; // Empty
      case 1:
        return '#6e6658'; // Wall
      case 11:
        return '#b22222'; // Wall Red
      case 12:
        return '#2a4d69'; // Wall Blue
      case 13:
        return '#228B22'; // Wall Green
      case 14:
        return '#b8860b'; // Wall Yellow
      case 15:
        return '#6a0dad'; // Wall Purple
      case 2:
        return '#a0522d'; // Door
      case 3:
        return '#ffd700'; // Key
      case 4:
        return '#00bfff'; // Player Spawn
      case 5:
        return '#ff4500'; // Enemy Spawn
      default:
        return '#f0f0f0';
    }
  };

  // Get light color based on light type
  const getLightColor = (lightType: number): string => {
    // Map light types to colors
    switch (lightType) {
      case 0:
        return 'transparent'; // No light
      case 1:
        return 'rgba(255, 170, 85, 0.5)'; // Warm light
      case 2:
        return 'rgba(170, 221, 255, 0.5)'; // Cool light
      case 3:
        return 'rgba(255, 255, 255, 0.5)'; // Bright light
      case 4:
        return 'rgba(255, 221, 204, 0.5)'; // Dim light
      default:
        return 'transparent';
    }
  };

  // Get cell icon based on cell type
  const getCellIcon = (cellType: number): string => {
    // Map cell types to icons - ensure consistency with toolbar icons
    switch (cellType) {
      case 0:
        return ''; // Empty
      case 1:
        return '🧱'; // Wall
      case 11:
        return '🧱'; // Wall Red
      case 12:
        return '🧱'; // Wall Blue
      case 13:
        return '🧱'; // Wall Green
      case 14:
        return '🧱'; // Wall Yellow
      case 15:
        return '🧱'; // Wall Purple
      case 2:
        return '🚪'; // Door
      case 3:
        return '🔑'; // Key
      case 4:
        return '👤'; // Player Spawn
      case 5:
        return '👹'; // Enemy Spawn
      case 6:
      case 10:
        return '💡'; // Light
      default:
        return '';
    }
  };

  // Get light icon based on light type
  const getLightIcon = (lightType: number): string => {
    if (lightType > 0) {
      return '💡'; // Show light icon for any light type > 0
    }
    return '';
  };

  // Get current layer data
  const getLayerData = (row: number, col: number) => {
    // Get wall/grid cell type
    const cellType = levelData.grid[row][col];

    // Get light type (if lights exist)
    const lightType =
      levelData.lights && levelData.lights[row] && levelData.lights[row][col]
        ? levelData.lights[row][col]
        : 0;

    return { cellType, lightType };
  };

  return (
    <div className="grid-editor">
      <div className="grid-controls">
        <div className="grid-dimension-control">
          <label>
            Rows:
            <input
              type="number"
              min="5"
              max="50"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value, 10))}
            />
          </label>
        </div>

        <div className="grid-dimension-control">
          <label>
            Columns:
            <input
              type="number"
              min="5"
              max="50"
              value={cols}
              onChange={(e) => setColumns(parseInt(e.target.value, 10))}
            />
          </label>
        </div>

        <div className="grid-dimension-control">
          <label>
            Cell Size:
            <input
              type="number"
              min="20"
              max="100"
              step="5"
              value={cellSize}
              onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
            />
          </label>
        </div>
      </div>

      <div
        className="grid"
        ref={gridRef}
        style={{
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        }}
      >
        {levelData.grid.map((row, rowIndex) =>
          row.map((_cell, colIndex) => {
            const { cellType, lightType } = getLayerData(rowIndex, colIndex);
            const wallIcon = getCellIcon(cellType);
            const lightIcon = getLightIcon(lightType);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${
                  selectedPosition &&
                  selectedPosition.row === rowIndex &&
                  selectedPosition.col === colIndex
                    ? 'selected'
                    : ''
                }`}
                style={{
                  backgroundColor: getCellColor(cellType),
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  fontSize: `${Math.max(cellSize / 2.5, 16)}px`, // Adjust icon size based on cell size
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseDown={() => handleDragStart(rowIndex, colIndex)}
                onMouseOver={() => handleDragOver(rowIndex, colIndex)}
                onMouseUp={handleDragEnd}
              >
                {/* Wall layer */}
                {wallIcon && <span className="cell-icon wall-icon">{wallIcon}</span>}

                {/* Light layer - semi-transparent overlay */}
                <div
                  className="light-overlay"
                  style={{
                    backgroundColor: getLightColor(lightType),
                    opacity: currentLayer === 'lights' ? 0.8 : 0.5, // More visible when editing lights
                  }}
                >
                  {lightIcon && <span className="light-icon">{lightIcon}</span>}
                </div>

                {/* Show coordinates in dev mode */}
                <span className="cell-coords">{`${rowIndex},${colIndex}`}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="grid-info">
        <p>
          Grid Size: {rows} × {cols} (Cells)
        </p>
        {selectedPosition && (
          <p>
            Selected: {selectedPosition.row}, {selectedPosition.col}
          </p>
        )}
      </div>
    </div>
  );
};

export default GridEditor;
