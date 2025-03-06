import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { Physics } from '@react-three/cannon';
import { Player, PLAYER_HEIGHT } from '../components/Player';
import { Floor } from '../components/Floor';
import { LevelGrid } from '../components/LevelGrid';
import { Sky, Stats } from '@react-three/drei';
import { level1 } from '../levels/level1';

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, PLAYER_HEIGHT, 5],
        rotation: [0, 0, 0],
        fov: 75
      }}
      style={{ width: '100%', height: '100%' }}
      shadows
    >
      {/* Sky for better visuals */}
      <Sky sunPosition={[100, 10, 100]} />
      
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Physics world */}
      <Physics gravity={[0, -9.81, 0]}>
        {/* Player with spawn position from level data */}
        <Player spawnPosition={level1.playerSpawn} />
        
        {/* Floor */}
        <Floor />
        
        {/* Level Grid */}
        <LevelGrid level={level1} />
      </Physics>
      
      {/* Performance stats */}
      <Stats />
    </Canvas>
  );
}; 