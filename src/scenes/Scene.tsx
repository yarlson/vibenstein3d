import { Canvas } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { Physics } from '@react-three/cannon';
import { Player, PLAYER_HEIGHT } from '../components/Player';
import { Floor } from '../components/Floor';
import { LevelGrid } from '../components/LevelGrid';
import { AdaptiveDpr, Stats } from '@react-three/drei';
import { level1 } from '../levels/level1';
import { EnemyManager } from '../components/EnemyManager';

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        <Player spawnPosition={level1.playerSpawn} />

        {/* Floor */}
        <Floor />

        {/* Level Grid (includes walls and ceiling with lights) */}
        <LevelGrid level={level1} />

        {/* Enemy Manager */}
        <EnemyManager level={level1} />
      </Physics>

      {/* Performance stats with custom className */}
      <Stats className="stats-panel" />
    </Canvas>
  );
};
