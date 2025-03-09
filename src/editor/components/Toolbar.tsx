import React from 'react';
import { ToolbarElementType, TOOLBAR_ELEMENTS, EditorMode } from '../types/editorTypes';
import { CellType } from '../../types/level';
import './EditorComponents.css';

// Props for the Toolbar component
interface ToolbarProps {
  selectedElement: ToolbarElementType | null;
  onSelectElement: (element: ToolbarElementType) => void;
  onDeleteElement: () => void;
  mode: EditorMode;
  onToggleMode: () => void;
}

/**
 * Toolbar Component
 * Renders a set of buttons for placing elements on the grid.
 */
const Toolbar: React.FC<ToolbarProps> = ({
  selectedElement,
  onSelectElement,
  onDeleteElement,
  mode,
  onToggleMode,
}) => {
  // Get button background color based on cell type
  const getButtonBackgroundColor = (cellType: number): string => {
    switch (cellType) {
      case CellType.WallRed:
        return '#b22222'; // Wall Red
      case CellType.WallBlue:
        return '#2a4d69'; // Wall Blue
      case CellType.WallGreen:
        return '#228B22'; // Wall Green
      case CellType.WallYellow:
        return '#b8860b'; // Wall Yellow
      case CellType.WallPurple:
        return '#6a0dad'; // Wall Purple
      default:
        return '';
    }
  };

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-elements">
        {TOOLBAR_ELEMENTS.map((element) => {
          const bgColor = getButtonBackgroundColor(element.cellType);

          return (
            <button
              key={element.id}
              className={`toolbar-button ${selectedElement?.id === element.id ? 'selected' : ''}`}
              onClick={() => onSelectElement(element)}
              title={element.name}
              style={bgColor ? { backgroundColor: bgColor } : undefined}
            >
              <span className="element-icon">{element.icon}</span>
              <span className="element-name">{element.name}</span>
            </button>
          );
        })}
      </div>

      <div className="editor-toolbar-actions">
        <button
          className="toolbar-action delete"
          onClick={onDeleteElement}
          title="Delete Selected Element"
        >
          🗑️ Delete
        </button>

        <button
          className={`toolbar-action mode-toggle ${mode === 'advanced' ? 'advanced' : ''}`}
          onClick={onToggleMode}
          title={`Switch to ${mode === 'standard' ? 'Advanced' : 'Standard'} Mode`}
        >
          {mode === 'standard' ? '🔧 Advanced Mode' : '🔄 Standard Mode'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
