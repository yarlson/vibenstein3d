import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Toolbar from './components/Toolbar';
import GridEditor, { GridPosition } from './components/GridEditor';
import PropertyEditor from './components/PropertyEditor';
import LivePreview from './components/LivePreview';
import { useEditorStore } from './store/editorStore';
import { loadLevelData, saveLevelData } from './utils/levelUtils';
import { EnemyType } from '../types/level';
import {
  ToolbarElementType,
  TOOLBAR_ELEMENTS,
  LIGHT_ELEMENTS,
  EditorLayer,
} from './types/editorTypes';
import './Editor.css';

/**
 * Editor Component
 * This is the main container for the level editor functionality.
 */
const Editor: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('level1.json');

  // Get state and actions from the editor store
  const {
    levelData,
    selectedElement,
    selectedPosition,
    editorMode,
    currentLayer,
    validationErrors,
    setLevelData,
    setSelectedElement,
    setSelectedPosition,
    setEditorMode,
    setCurrentLayer,
    updateGridDimensions,
    placeElement,
    moveElement,
    deleteElement,
    addEnemy,
    updateEnemyProperty,
    deleteEnemy,
    updateProperty,
    createNewLevel,
    validateLevel,
  } = useEditorStore();

  // Handle loading a level
  const handleLoadLevel = useCallback(
    async (path: string) => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await loadLevelData(path);
        setLevelData(data);
        setFilename(path.split('/').pop() || 'level.json');
      } catch (err) {
        console.error('Error loading level:', err);
        setLoadError('Failed to load level data');
      } finally {
        setIsLoading(false);
      }
    },
    [setLevelData]
  );

  // Load the initial level data
  useEffect(() => {
    handleLoadLevel('/src/levels/level1.json');
  }, [handleLoadLevel]);

  // Handle saving a level
  const handleSaveLevel = () => {
    if (!levelData) return;

    // Validate the level before saving
    const validation = validateLevel();

    if (!validation.valid) {
      alert(`Cannot save level with errors: ${validation.errors.join(', ')}`);
      return;
    }

    saveLevelData(levelData, filename);
  };

  // Handle creating a new level
  const handleNewLevel = () => {
    const rows = prompt('Enter number of rows (min 5):', '20');
    const cols = prompt('Enter number of columns (min 5):', '30');

    if (rows && cols) {
      const numRows = parseInt(rows, 10);
      const numCols = parseInt(cols, 10);

      if (numRows >= 5 && numCols >= 5) {
        createNewLevel(numRows, numCols);
        setFilename('new_level.json');
      } else {
        alert('Rows and columns must be at least 5');
      }
    }
  };

  // Handle switching layers
  const handleLayerChange = (layer: EditorLayer) => {
    setCurrentLayer(layer);
  };

  // Handle selecting an element from the toolbar
  const handleSelectElement = (element: ToolbarElementType) => {
    setSelectedElement(element);
  };

  // Handle clicking on a grid cell
  const handleGridCellClick = (position: GridPosition, element: ToolbarElementType) => {
    placeElement(position, element);
  };

  // Handle selecting a grid element
  const handleSelectGridElement = (position: GridPosition | null) => {
    setSelectedPosition(position);
  };

  // Handle moving a grid element
  const handleMoveGridElement = (fromPosition: GridPosition, toPosition: GridPosition) => {
    moveElement(fromPosition, toPosition);
  };

  // Handle deleting an element
  const handleDeleteElement = () => {
    deleteElement();
  };

  // Handle toggling the editor mode
  const handleToggleMode = () => {
    setEditorMode(editorMode === 'standard' ? 'advanced' : 'standard');
  };

  // Handle adding an enemy
  const handleAddEnemy = (position: GridPosition, enemyType: EnemyType) => {
    addEnemy(position, enemyType);
  };

  // Handle updating an enemy property
  const handleUpdateEnemyProperty = (index: number, property: string, value: number | string) => {
    updateEnemyProperty(index, property, value);
  };

  // Handle deleting an enemy
  const handleDeleteEnemy = (index: number) => {
    deleteEnemy(index);
  };

  // Handle updating a property
  const handleUpdateProperty = (
    position: GridPosition,
    property: string,
    value: number | string
  ) => {
    updateProperty(position, property, value);
  };

  // Show loading indicator while level data is being loaded
  if (isLoading) {
    return <div className="editor-loading">Loading level data...</div>;
  }

  // Show error message if loading failed
  if (loadError) {
    return (
      <div className="editor-error">
        <h2>Error Loading Level</h2>
        <p>{loadError}</p>
        <button onClick={() => handleLoadLevel('/src/levels/level1.json')}>Try Again</button>
        <Link to="/">Return to Game</Link>
      </div>
    );
  }

  // Show the editor if level data is loaded
  if (!levelData) {
    return <div className="editor-loading">No level data available</div>;
  }

  // Get the appropriate toolbar elements based on the current layer
  const toolbarElements = currentLayer === 'walls' ? TOOLBAR_ELEMENTS : LIGHT_ELEMENTS;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>Level Editor</h1>

        <div className="editor-actions">
          <button onClick={handleNewLevel} className="editor-action">
            New Level
          </button>

          <button onClick={handleSaveLevel} className="editor-action">
            Save Level
          </button>

          <div className="filename-input">
            <label>Filename:</label>
            <input type="text" value={filename} onChange={(e) => setFilename(e.target.value)} />
          </div>

          <Link to="/" className="editor-action return">
            Return to Game
          </Link>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h3>Validation Errors:</h3>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-content">
        <div className="editor-left-pane">
          {/* Layer Tabs */}
          <div className="layer-tabs">
            <button
              className={`layer-tab walls-tab ${currentLayer === 'walls' ? 'active' : ''}`}
              onClick={() => handleLayerChange('walls')}
            >
              Walls & Objects
            </button>

            <button
              className={`layer-tab lights-tab ${currentLayer === 'lights' ? 'active' : ''}`}
              onClick={() => handleLayerChange('lights')}
            >
              Lights
            </button>
          </div>

          {/* Toolbar for the current layer */}
          <Toolbar
            selectedElement={selectedElement}
            onSelectElement={handleSelectElement}
            onDeleteElement={handleDeleteElement}
            mode={editorMode}
            onToggleMode={handleToggleMode}
            elements={toolbarElements}
          />

          <div className="editor-workspace">
            <GridEditor
              levelData={levelData}
              selectedElement={selectedElement}
              onGridCellClick={handleGridCellClick}
              onSelectGridElement={handleSelectGridElement}
              onMoveGridElement={handleMoveGridElement}
              selectedPosition={selectedPosition}
              onUpdateGridDimensions={updateGridDimensions}
              currentLayer={currentLayer}
            />

            <PropertyEditor
              levelData={levelData}
              selectedPosition={selectedPosition}
              onUpdateProperty={handleUpdateProperty}
              onAddEnemy={handleAddEnemy}
              onUpdateEnemyProperty={handleUpdateEnemyProperty}
              onDeleteEnemy={handleDeleteEnemy}
              currentLayer={currentLayer}
            />
          </div>
        </div>

        <div className="editor-right-pane">
          <LivePreview levelData={levelData} />
        </div>
      </div>
    </div>
  );
};

export default Editor;
