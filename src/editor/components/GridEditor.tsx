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
          row.map((cell, colIndex) => {
            const cellIcon = getCellIcon(cell);
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
                  backgroundColor: getCellColor(cell),
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  fontSize: `${Math.max(cellSize / 2.5, 16)}px`, // Adjust icon size based on cell size
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseDown={() => handleDragStart(rowIndex, colIndex)}
                onMouseOver={() => handleDragOver(rowIndex, colIndex)}
                onMouseUp={handleDragEnd}
              >
                {cellIcon && <span className="cell-icon">{cellIcon}</span>}
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
