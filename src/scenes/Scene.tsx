import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { Physics } from '@react-three/cannon';
import { Player, PLAYER_HEIGHT } from '../components/Player';
import { Floor } from '../components/Floor';
import { Wall } from '../components/Wall';
import { Sky, Stats } from '@react-three/drei';

export const Scene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: [0, PLAYER_HEIGHT, 0], fov: 75 }}
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
        {/* Player */}
        <Player />
        
        {/* Floor */}
        <Floor />
        
        {/* Test walls to demonstrate collision */}
        <Wall position={[0, 1, -5]} size={[10, 2, 1]} />
        <Wall position={[-5, 1, 0]} size={[1, 2, 10]} />
        <Wall position={[5, 1, 0]} size={[1, 2, 10]} />
        <Wall position={[0, 1, 5]} size={[10, 2, 1]} />
        
        {/* Some obstacles */}
        <Wall position={[-2, 1, -2]} />
        <Wall position={[2, 1, 2]} />
        <Wall position={[-2, 1, 2]} />
        <Wall position={[2, 1, -2]} />
      </Physics>
      
      {/* Performance stats */}
      <Stats />
    </Canvas>
  );
}; 