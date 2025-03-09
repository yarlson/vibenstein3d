import React from 'react';
import { GridPosition } from './GridEditor';
import { LevelData, CellType, EnemyType } from '../../types/level';
import './EditorComponents.css';

interface PropertyEditorProps {
  levelData: LevelData;
  selectedPosition: GridPosition | null;
  onUpdateProperty: (position: GridPosition, property: string, value: number | string) => void;
  onAddEnemy: (position: GridPosition, enemyType: EnemyType) => void;
  onUpdateEnemyProperty: (index: number, property: string, value: number | string) => void;
  onDeleteEnemy: (index: number) => void;
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
  const cellType = levelData.grid[row][col];
  
  // Find if there's an enemy at this position
  const enemyIndex = levelData.enemies.findIndex(
    (enemy) => enemy.position[0] === col && enemy.position[1] === row
  );
  
  const hasEnemy = enemyIndex !== -1;
  const enemy = hasEnemy ? levelData.enemies[enemyIndex] : null;
  
  // Find if there's a light at this position
  const hasLight = levelData.lights && 
                  levelData.lights[row] !== undefined && 
                  levelData.lights[row][col] !== undefined && 
                  levelData.lights[row][col] > 0;
  const lightType = hasLight && levelData.lights ? levelData.lights[row][col] : 0;
  
  return (
    <div className="property-editor">
      <h3>Properties</h3>
      
      <div className="property-section">
        <h4>Cell Information</h4>
        <div className="property-row">
          <label>Position:</label>
          <span>{`(${col}, ${row})`}</span>
        </div>
        
        <div className="property-row">
          <label>Cell Type:</label>
          <span>{cellType}</span>
        </div>
      </div>
      
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
      
      {/* Light Properties */}
      {cellType === CellType.CeilingLight && (
        <div className="property-section">
          <h4>Light Properties</h4>
          
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
        </div>
      )}
    </div>
  );
};

export default PropertyEditor; 