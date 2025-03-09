import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Physics } from '@react-three/cannon';
import { Player, PLAYER_HEIGHT } from '../components/Player';
import { Floor } from '../components/Floor';
import { LevelGrid } from '../components/LevelGrid';
import { AdaptiveDpr, Stats } from '@react-three/drei';
import { LevelData } from '../types/level';
import { EnemyController } from '../components/EnemyController.tsx';
import { findPlayerSpawn } from '../utils/levelUtils';
// Import level data directly
import levelDataJson from '../levels/level1.json';

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [playerSpawnPosition, setPlayerSpawnPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load level data from JSON
  useEffect(() => {
    // Set the imported JSON data directly
    const data = levelDataJson as LevelData;
    setLevelData(data);

    // Find player spawn point immediately
    setPlayerSpawnPosition(findPlayerSpawn(data));
    setIsLoading(false);
  }, []);

  // Callback to receive player spawn position from LevelGrid
  const handlePlayerSpawnFound = useCallback((spawnPosition: [number, number]) => {
    setPlayerSpawnPosition(spawnPosition);
  }, []);

  // Apply class to Stats component when it's mounted
  useEffect(() => {
    // Find the Stats panel in the DOM
    const statsPanel = document.querySelector('.stats');
    if (statsPanel) {
      statsPanel.classList.add('stats-panel');
    }

    // Remove class when component unmounts
    return () => {
      const statsPanel = document.querySelector('.stats');
      if (statsPanel) {
        statsPanel.classList.remove('stats-panel');
      }
    };
  }, []);

  // Show loading indicator while level data is being loaded
  if (isLoading || !levelData) {
    return <div className="loading">Loading level data...</div>;
  }

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, PLAYER_HEIGHT, 5],
        rotation: [0, 0, 0],
        fov: 75,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
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
        <LevelGrid level={levelData} onPlayerSpawnFound={handlePlayerSpawnFound} />

        {/* Enemy Controller - replacement for EnemyManager */}
        <EnemyController level={levelData} />
      </Physics>

      {/* Performance stats with custom className */}
      <Stats className="stats-panel" />
    </Canvas>
  );
};
