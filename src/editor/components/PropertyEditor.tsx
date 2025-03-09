import React from 'react';
import { GridPosition } from './GridEditor';
import { LevelData, CellType, EnemyType } from '../../types/level';
import { EditorLayer } from '../types/editorTypes';
import './EditorComponents.css';

interface PropertyEditorProps {
  levelData: LevelData;
  selectedPosition: GridPosition | null;
  onUpdateProperty: (position: GridPosition, property: string, value: number | string) => void;
  onAddEnemy: (position: GridPosition, enemyType: EnemyType) => void;
  onUpdateEnemyProperty: (index: number, property: string, value: number | string) => void;
  onDeleteEnemy: (index: number) => void;
  currentLayer?: EditorLayer; // Optional layer to display properties for
}

/**
 * Property Editor Component
 * Displays and allows editing of properties for the selected grid element.
 */
const PropertyEditor: React.FC<PropertyEditorProps> = ({
  levelData,
  selectedPosition,
  onUpdateProperty,
  onAddEnemy,
  onUpdateEnemyProperty,
  onDeleteEnemy,
  currentLayer = 'walls', // Default to walls layer
}) => {
  if (!selectedPosition) {
    return (
      <div className="property-editor">
        <h3>Properties</h3>
        <p>Select an element on the grid to edit its properties.</p>
      </div>
    );
  }

  const { row, col } = selectedPosition;
  
  // Get cell type from the appropriate layer
  const cellType = levelData.grid[row][col];
  
  // Get light type if available
  const lightType = levelData.lights && 
                   levelData.lights[row] !== undefined && 
                   levelData.lights[row][col] !== undefined ? 
                   levelData.lights[row][col] : 0;
  
  // Find if there's an enemy at this position
  const enemyIndex = levelData.enemies.findIndex(
    (enemy) => enemy.position[0] === col && enemy.position[1] === row
  );
  
  const hasEnemy = enemyIndex !== -1;
  const enemy = hasEnemy ? levelData.enemies[enemyIndex] : null;
  
  // Light type descriptions
  const getLightTypeDescription = (type: number): string => {
    switch(type) {
      case 0: return 'No Light';
      case 1: return 'Warm Light';
      case 2: return 'Cool Light';
      case 3: return 'Bright Light';
      case 4: return 'Dim Light';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="property-editor">
      <h3>Properties</h3>
      
      <div className="property-section">
        <h4>{currentLayer === 'walls' ? 'Cell Information' : 'Light Information'}</h4>
        <div className="property-row">
          <label>Position:</label>
          <span>{`(${col}, ${row})`}</span>
        </div>
        
        {currentLayer === 'walls' ? (
          <div className="property-row">
            <label>Cell Type:</label>
            <span>{cellType}</span>
          </div>
        ) : (
          <div className="property-row">
            <label>Light Type:</label>
            <select 
              value={lightType}
              onChange={(e) => onUpdateProperty(
                selectedPosition, 
                'light', 
                parseInt(e.target.value, 10)
              )}
            >
              <option value="0">No Light</option>
              <option value="1">Warm Light</option>
              <option value="2">Cool Light</option>
              <option value="3">Bright Light</option>
              <option value="4">Dim Light</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Only show these sections in walls layer */}
      {currentLayer === 'walls' && (
        <>
          {/* Enemy Properties */}
          {cellType === CellType.EnemySpawn && (
            <div className="property-section">
              <h4>Enemy Properties</h4>
              
              {!hasEnemy && (
                <div className="property-row">
                  <button 
                    onClick={() => onAddEnemy(selectedPosition, EnemyType.Grunt)}
                    className="add-enemy-btn"
                  >
                    Add Enemy
                  </button>
                  
                  <select 
                    onChange={(e) => onAddEnemy(selectedPosition, e.target.value as EnemyType)}
                    defaultValue={EnemyType.Grunt}
                  >
                    <option value={EnemyType.Grunt}>Grunt</option>
                    <option value={EnemyType.Guard}>Guard</option>
                    <option value={EnemyType.Boss}>Boss</option>
                  </select>
                </div>
              )}
              
              {hasEnemy && enemy && (
                <>
                  <div className="property-row">
                    <label>Type:</label>
                    <select 
                      value={enemy.type}
                      onChange={(e) => onUpdateEnemyProperty(enemyIndex, 'type', e.target.value as EnemyType)}
                    >
                      <option value={EnemyType.Grunt}>Grunt</option>
                      <option value={EnemyType.Guard}>Guard</option>
                      <option value={EnemyType.Boss}>Boss</option>
                    </select>
                  </div>
                  
                  <div className="property-row">
                    <label>Rotation:</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={enemy.rotation || 0}
                      onChange={(e) => onUpdateEnemyProperty(enemyIndex, 'rotation', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="property-row">
                    <button 
                      onClick={() => onDeleteEnemy(enemyIndex)}
                      className="delete-enemy-btn"
                    >
                      Delete Enemy
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Light details */}
      {currentLayer === 'lights' && lightType > 0 && (
        <div className="property-section">
          <h4>Light Details</h4>
          <div className="property-row">
            <label>Type:</label>
            <span>{getLightTypeDescription(lightType)}</span>
          </div>
          
          <div className="property-row">
            <label>Intensity:</label>
            <span>{lightType === 3 ? 'High' : lightType === 4 ? 'Low' : 'Medium'}</span>
          </div>
          
          <div className="property-row">
            <label>Color:</label>
            <span style={{
              display: 'inline-block', 
              width: '16px', 
              height: '16px', 
              backgroundColor: 
                lightType === 1 ? '#ffaa55' : 
                lightType === 2 ? '#aaddff' : 
                lightType === 3 ? '#ffffff' : 
                lightType === 4 ? '#ffddcc' : 'transparent',
              border: '1px solid #555',
              verticalAlign: 'middle',
              marginLeft: '5px'
            }}></span>
            <span>
              {lightType === 1 ? 'Warm' : 
               lightType === 2 ? 'Cool' : 
               lightType === 3 ? 'White' : 
               lightType === 4 ? 'Dim' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyEditor;
