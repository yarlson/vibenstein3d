import React, { useRef, useState, useEffect } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteractive, setIsInteractive] = useState<boolean>(false);
  
  // Find player spawn position
  const playerSpawnPosition = findPlayerSpawn(levelData);
  
  // Toggle interactive mode
  const toggleInteractive = () => {
    setIsInteractive(!isInteractive);
  };
  
  // Set focus to the canvas container when entering interactive mode
  useEffect(() => {
    if (isInteractive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isInteractive]);
  
  return (
    <div className="live-preview">
      <h3>Live Preview</h3>
      
      <div 
        className={`preview-container ${isInteractive ? 'interactive' : 'non-interactive'}`}
        ref={containerRef}
        tabIndex={isInteractive ? 0 : -1} // Make focusable only when interactive
      >
        {/* Overlay to prevent input capturing */}
        {!isInteractive && (
          <div className="preview-overlay" onClick={toggleInteractive}>
            <div className="preview-message">Click to interact</div>
          </div>
        )}
        
        {/* Exit interactive mode button */}
        {isInteractive && (
          <button 
            className="exit-interactive-btn" 
            onClick={toggleInteractive}
          >
            Exit Interactive Mode
          </button>
        )}
        
        {/* The pointer-events style ensures input won't reach the Canvas when not interactive */}
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            pointerEvents: isInteractive ? 'auto' : 'none' 
          }}
        >
          <Canvas
            ref={canvasRef}
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
      </div>
    </div>
  );
};

export default LivePreview; 