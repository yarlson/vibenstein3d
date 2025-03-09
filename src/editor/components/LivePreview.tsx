import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { AdaptiveDpr } from '@react-three/drei';
import { LevelData } from '../../types/level';
import { LevelGrid } from '../../components/LevelGrid';
import { Player, PLAYER_HEIGHT } from '../../components/Player';
import { Floor } from '../../components/Floor';
import { EnemyController } from '../../components/EnemyController';
import { findPlayerSpawn } from '../../utils/levelUtils';

interface LivePreviewProps {
  levelData: LevelData;
}

/**
 * LivePreview Component
 * Renders a live preview of the level being edited.
 */
const LivePreview: React.FC<LivePreviewProps> = ({ levelData }) => {
  const [isInteractive, setIsInteractive] = useState<boolean>(false);
  
  // Find player spawn position
  const playerSpawnPosition = findPlayerSpawn(levelData);
  
  // Toggle interactive mode
  const enableInteractive = () => {
    setIsInteractive(true);
  };
  
  const disableInteractive = () => {
    setIsInteractive(false);
  };
  
  // Handle escape key to exit interactive mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInteractive) {
        disableInteractive();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInteractive]);
  
  return (
    <div className="live-preview">
      <h3>Live Preview</h3>
      
      <div className="preview-container">
        {!isInteractive ? (
          // Non-interactive placeholder
          <div className="preview-placeholder">
            <div className="preview-placeholder-content">
              <div className="preview-placeholder-icon">🎮</div>
              <div className="preview-placeholder-text">
                Level Preview
              </div>
              <button 
                className="preview-interact-button"
                onClick={enableInteractive}
              >
                Start Interactive Preview
              </button>
            </div>
          </div>
        ) : (
          // Interactive game canvas
          <div className="preview-interactive">
            <button 
              className="exit-interactive-btn" 
              onClick={disableInteractive}
            >
              Exit Preview (ESC)
            </button>
            
            <Canvas
              camera={{
                position: [0, PLAYER_HEIGHT, 5],
                rotation: [0, 0, 0],
                fov: 75,
              }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
              }}
              shadows
              dpr={[1, 1.5]}
            >
              <AdaptiveDpr pixelated />
              
              {/* Minimal ambient light */}
              <ambientLight intensity={1} />
              
              {/* Physics world */}
              <Physics gravity={[0, -9.81, 0]}>
                {/* Player with spawn position from level data */}
                {playerSpawnPosition && <Player spawnPosition={playerSpawnPosition} />}
                
                {/* Floor */}
                <Floor />
                
                {/* Level Grid (includes walls and ceiling with lights) */}
                <LevelGrid level={levelData} />
                
                {/* Enemy Controller */}
                <EnemyController level={levelData} />
              </Physics>
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview; 